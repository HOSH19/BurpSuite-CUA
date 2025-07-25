/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import assert from 'assert';

import { logger } from '@main/logger';
import { StatusEnum } from '@ui-tars/shared/types';
import { type ConversationWithSoM } from '@main/shared/types';
import { GUIAgent, type GUIAgentConfig } from '@ui-tars/sdk';
import { markClickPosition } from '@main/utils/image';
import { UTIOService } from '@main/services/utio';
import { RAGService } from '@main/services/ragService';
import { NutJSElectronOperator } from '../agent/operator';
import {
  createRemoteBrowserOperator,
  RemoteComputerOperator,
} from '../remote/operators';
import {
  DefaultBrowserOperator,
  RemoteBrowserOperator,
} from '@ui-tars/operator-browser';
import { showPredictionMarker } from '@main/window/ScreenMarker';
import { SettingStore } from '@main/store/setting';
import { AppState, Operator } from '@main/store/types';
import { GUIAgentManager } from '../ipcRoutes/agent';
import { checkBrowserAvailability } from './browserCheck';
import {
  getModelVersion,
  getSpByModelVersion,
  beforeAgentRun,
  afterAgentRun,
  getLocalBrowserSearchEngine,
} from '../utils/agent';
import { FREE_MODEL_BASE_URL } from '../remote/shared';
import { getAuthHeader } from '../remote/auth';
import { ProxyClient } from '../remote/proxyClient';
import { UITarsModelConfig } from '@ui-tars/sdk/core';
import { generateMasterPlan } from '../agent/prompts';

// Extract and log progress from LLM response
const logProgress = (thought: string, totalSteps: number): void => {
  const progress = thought.match(
    /## PROGRESS TRACKING\s*([\s\S]*?)(?=\n## |$)/,
  )?.[1];
  if (!progress) return;

  const completed = progress.match(/✅ Completed:\s*\[(.*?)\]/)?.[1]?.trim();
  const current = progress.match(/⏳ Current:\s*\[(.*?)\]/)?.[1]?.trim();
  const remaining = progress.match(/📋 Remaining:\s*\[(.*?)\]/)?.[1];

  if (current) {
    // Count step numbers in completed and remaining sections
    const completedSteps = completed
      ? (completed.match(/Step \d+/g) || []).length
      : 0;
    const remainingSteps = remaining
      ? (remaining.match(/Step \d+/g) || []).length
      : 0;

    logger.info(`📊 Progress: ${current}`);
    logger.info(
      `   📋 Master plan: ${totalSteps} total | ✅ ${completedSteps} done | 📋 ${remainingSteps} remaining`,
    );
  }
};

// Generate master plan using LLM
const generateMasterPlanWithLLM = async (
  instructions: string,
  ragContextData: Array<{
    context: string;
    relevance: number;
    source?: string;
  }>,
  modelConfig: UITarsModelConfig,
  modelAuthHdrs: Record<string, string>,
  language: 'zh' | 'en',
): Promise<string | null> => {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      baseURL: modelConfig.baseURL,
      apiKey: modelConfig.apiKey,
      maxRetries: 1,
    });

    // Build enhanced prompt with RAG context
    let enhancedPrompt = `${generateMasterPlan(language)}\n\n`;

    if (ragContextData.length > 0) {
      logger.info(
        `🔍 Adding ${ragContextData.length} RAG context items to master plan generation`,
      );
      enhancedPrompt += `## RELEVANT CONTEXT:\n`;
      ragContextData.forEach((ctx, i) => {
        // Truncate context to reduce token usage
        const truncatedContext =
          ctx.context.length > 200
            ? ctx.context.substring(0, 200) + '...'
            : ctx.context;
        enhancedPrompt += `**Context ${i + 1}**: ${truncatedContext}\n`;
        logger.debug(
          `   Context ${i + 1}: ${ctx.context.substring(0, 100)}...`,
        );
      });
      enhancedPrompt += `\n`;
    } else {
      logger.info(`🔍 No RAG context available for master plan generation`);
    }

    enhancedPrompt += `## TASK TO ANALYZE:\n${instructions}`;
    logger.debug(
      `📝 Enhanced prompt length: ${enhancedPrompt.length} characters`,
    );

    const response = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: 'user',
          content: enhancedPrompt,
        },
      ],
      max_tokens: 1000, // Reduced from 2000 to 1000
      temperature: 0.3,
      ...modelAuthHdrs,
    });

    const masterPlan = response.choices[0]?.message?.content?.trim() || null;

    if (masterPlan) {
      logger.info(`✅ Enhanced master plan generated successfully`);
      logger.debug(
        `📋 Master plan preview: ${masterPlan.substring(0, 200)}...`,
      );
      logger.debug(
        `📊 Master plan total length: ${masterPlan.length} characters`,
      );

      // Show how many steps were generated
      const stepCount = masterPlan
        .split('\n')
        .filter((line) => line.trim().match(/^\d+\./)).length;
      logger.info(`📋 Generated ${stepCount} steps in enhanced master plan`);

      // Show if RAG context influenced the plan
      if (ragContextData.length > 0) {
        logger.info(
          `🔍 Enhanced master plan incorporates ${ragContextData.length} RAG context items`,
        );
      }
    } else {
      logger.warn(`⚠️ Master plan generation returned empty response`);
    }

    return masterPlan;
  } catch (error) {
    logger.error('Master plan generation failed:', error);
    return null;
  }
};

export const runAgent = async (
  setState: (state: AppState) => void,
  getState: () => AppState,
) => {
  const settings = SettingStore.getStore();
  const { instructions, abortController } = getState();
  assert(instructions, 'instructions is required');

  // Setup RAG context
  let ragContextData: Array<{
    context: string;
    relevance: number;
    source?: string;
  }> = [];
  try {
    logger.info(
      `🔍 Querying RAG for context related to: "${instructions.substring(0, 50)}..."`,
    );
    ragContextData = await RAGService.getInstance().queryRAG(instructions, 2); // Reduced from 3 to 2
    if (ragContextData.length > 0) {
      logger.info(`📚 RAG: ${ragContextData.length} context items retrieved`);
      ragContextData.forEach((ctx, i) => {
        logger.debug(
          `   RAG Context ${i + 1} (relevance: ${ctx.relevance}): ${ctx.context.substring(0, 80)}...`,
        );
      });
    } else {
      logger.info(`📚 RAG: No relevant context found`);
    }
  } catch (error) {
    logger.error('RAG retrieval failed:', error);
  }

  // Setup operator
  let operatorType: 'computer' | 'browser' = 'computer';
  let operator:
    | NutJSElectronOperator
    | DefaultBrowserOperator
    | RemoteComputerOperator
    | RemoteBrowserOperator;

  switch (settings.operator) {
    case Operator.LocalComputer:
      operator = new NutJSElectronOperator();
      break;
    case Operator.LocalBrowser:
      await checkBrowserAvailability();
      if (!getState().browserAvailable) {
        setState({
          ...getState(),
          status: StatusEnum.ERROR,
          errorMsg:
            'Browser is not available. Please install Chrome and try again.',
        });
        return;
      }
      operator = await DefaultBrowserOperator.getInstance(
        false,
        false,
        false,
        getState().status === StatusEnum.CALL_USER,
        getLocalBrowserSearchEngine(settings.searchEngineForBrowser),
      );
      operatorType = 'browser';
      break;
    case Operator.RemoteComputer:
      operator = await RemoteComputerOperator.create();
      break;
    case Operator.RemoteBrowser:
      operator = await createRemoteBrowserOperator();
      operatorType = 'browser';
      break;
    default:
      throw new Error(`Unknown operator: ${settings.operator}`);
  }

  // Setup model configuration
  let modelVersion = getModelVersion(settings.vlmProvider);
  let modelConfig: UITarsModelConfig = {
    baseURL: settings.vlmBaseUrl,
    apiKey: settings.vlmApiKey,
    model: settings.vlmModelName,
    useResponsesApi: settings.useResponsesApi,
  };
  let modelAuthHdrs: Record<string, string> = {};

  if (
    settings.operator === Operator.RemoteComputer ||
    settings.operator === Operator.RemoteBrowser
  ) {
    const useResponsesApi = await ProxyClient.getRemoteVLMResponseApiSupport();
    modelConfig = {
      baseURL: FREE_MODEL_BASE_URL,
      apiKey: '',
      model: '',
      useResponsesApi,
    };
    modelAuthHdrs = await getAuthHeader();
    modelVersion = await ProxyClient.getRemoteVLMProvider();
  }

  // Generate or retrieve master plan
  let masterPlan = getState().masterPlan;
  let masterPlanStepCount = 0;

  if (!masterPlan) {
    logger.info('🎯 Generating enhanced master plan with RAG context...');
    masterPlan =
      (await generateMasterPlanWithLLM(
        instructions,
        ragContextData,
        modelConfig,
        modelAuthHdrs,
        settings.language ?? 'en',
      )) || undefined;

    if (masterPlan) {
      setState({ ...getState(), masterPlan });
      masterPlanStepCount = masterPlan
        .split('\n')
        .filter((line) => line.trim().match(/^\d+\./)).length;
      logger.info(
        `📋 Enhanced master plan: ${masterPlanStepCount} steps generated with RAG context`,
      );
    }
  } else {
    logger.info('📋 Using cached enhanced master plan');
    masterPlanStepCount = masterPlan
      .split('\n')
      .filter((line) => line.trim().match(/^\d+\./)).length;
  }

  // Create system prompt with enhanced master plan (RAG context already included)
  const systemPrompt = getSpByModelVersion(
    modelVersion,
    settings.language ?? 'en',
    operatorType,
    masterPlan || undefined,
  );

  if (masterPlan) {
    logger.info(
      `🎯 Using enhanced master plan in system prompt (${masterPlan.split('\n').filter((line) => line.trim().match(/^\d+\./)).length} steps)`,
    );
    logger.debug(
      `📋 System prompt includes enhanced master plan with RAG context`,
    );
  } else {
    logger.info(`🎯 No master plan available, using standard system prompt`);
  }

  // Simplified handleData function with action verification
  const handleData: GUIAgentConfig<NutJSElectronOperator>['onData'] = async ({
    data,
  }) => {
    const { status, conversations, ...restUserData } = data;
    const lastConv = getState().messages[getState().messages.length - 1];

    // Log progress from LLM responses
    conversations.forEach((conv) => {
      if (
        conv.from === 'gpt' &&
        masterPlan &&
        conv.predictionParsed?.[0]?.thought
      ) {
        logProgress(conv.predictionParsed[0].thought, masterPlanStepCount);

        // Debug: Show when enhanced master plan is being referenced
        if (
          conv.predictionParsed[0].thought.includes('Step') ||
          conv.predictionParsed[0].thought.includes('PROGRESS TRACKING')
        ) {
          logger.debug(
            `📋 Enhanced master plan being referenced in execution step`,
          );
        }
      }
    });

    // Process conversations with markers and RAG context for UI display
    const conversationsWithSoM: ConversationWithSoM[] = await Promise.all(
      conversations.map(async (conv) => {
        const screenshotBase64WithElementMarker =
          lastConv?.screenshotBase64 &&
          conv.screenshotContext?.size &&
          conv.predictionParsed
            ? await markClickPosition({
                screenshotContext: conv.screenshotContext,
                base64: lastConv.screenshotBase64,
                parsed: conv.predictionParsed,
              }).catch(() => '')
            : undefined;

        return {
          ...conv,
          screenshotBase64WithElementMarker,
          ragContext: ragContextData.length > 0 ? ragContextData : undefined, // Add RAG context for UI display
        };
      }),
    ).catch(() => conversations);

    // Show prediction markers for local computer operator
    const lastConvWithSoM =
      conversationsWithSoM?.[conversationsWithSoM.length - 1];
    if (
      settings.operator === Operator.LocalComputer &&
      lastConvWithSoM?.predictionParsed?.length &&
      lastConvWithSoM?.screenshotContext?.size &&
      !abortController?.signal?.aborted
    ) {
      showPredictionMarker(
        lastConvWithSoM.predictionParsed,
        lastConvWithSoM.screenshotContext,
      );
    }

    // Update state
    setState({
      ...getState(),
      status,
      restUserData,
      messages: [...(getState().messages || []), ...conversationsWithSoM],
    });
  };

  // Create and configure GUIAgent
  const guiAgent = new GUIAgent({
    model: modelConfig,
    systemPrompt,
    logger,
    signal: abortController?.signal,
    operator: operator!,
    onData: handleData,
    onError: (params) => {
      logger.error('GUIAgent error:', params.error);

      // Handle rate limiting specifically
      if (params.error?.message?.includes('429')) {
        logger.warn('⚠️ Rate limit hit - the system will retry automatically');
        logger.info(
          '💡 Consider waiting a moment or checking your API rate limits',
        );
      }

      setState({
        ...getState(),
        status: StatusEnum.ERROR,
        errorMsg: JSON.stringify({
          status: params.error?.status,
          message: params.error?.message,
          stack: params.error?.stack,
        }),
      });
    },
    retry: {
      model: { maxRetries: 8 },
      screenshot: { maxRetries: 8 },
      execute: { maxRetries: 3 },
    },
    maxLoopCount: settings.maxLoopCount,
    loopIntervalInMs: 500,
    uiTarsVersion: modelVersion,
  });

  // Initialize services
  GUIAgentManager.getInstance().setAgent(guiAgent);
  UTIOService.getInstance().sendInstruction(instructions);
  beforeAgentRun(settings.operator);

  // Log flow summary
  logger.info(`🔄 HYBRID FLOW SUMMARY:`);
  logger.info(`   1. ✅ RAG Context: ${ragContextData.length} items retrieved`);
  logger.info(
    `   2. ✅ Enhanced Master Plan: ${masterPlan ? 'Generated with RAG context' : 'Not available'}`,
  );
  logger.info(
    `   3. ✅ System Prompt: ${masterPlan ? 'Includes enhanced master plan' : 'Standard prompt'}`,
  );
  logger.info(
    `   4. 🚀 Ready for execution with ${masterPlanStepCount} planned steps`,
  );

  // Run the agent
  const startTime = Date.now();
  logger.info(`🚀 Starting ${settings.operator} agent`);

  try {
    await guiAgent.run(
      instructions,
      getState().sessionHistoryMessages,
      modelAuthHdrs,
    );
    logger.info(
      `🏁 Completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    );
  } catch (error) {
    logger.error('Agent execution error:', error);
    setState({
      ...getState(),
      status: StatusEnum.ERROR,
      errorMsg: (error as Error).message,
    });
  }

  afterAgentRun(settings.operator);
};
