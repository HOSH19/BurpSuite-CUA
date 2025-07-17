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
  getEnhancedSystemPrompt,
} from '../utils/agent';
import { FREE_MODEL_BASE_URL } from '../remote/shared';
import { getAuthHeader } from '../remote/auth';
import { ProxyClient } from '../remote/proxyClient';
import { UITarsModelConfig } from '@ui-tars/sdk/core';

export const runAgent = async (
  setState: (state: AppState) => void,
  getState: () => AppState,
) => {
  logger.info('🚀 [RUNAGENT] ========== STARTING AGENT RUN ==========');
  const settings = SettingStore.getStore();
  const { instructions, abortController } = getState();
  assert(instructions, 'instructions is required');

  const language = settings.language ?? 'en';

  logger.info(
    `🔧 [RUNAGENT] Settings - Operator: ${settings.operator}, MaxLoops: ${settings.maxLoopCount}`,
  );

  // Retrieve RAG context once at the beginning
  logger.info(
    `🔍 [RUNAGENT] Retrieving RAG context for instructions (one-time setup)...`,
  );
  const ragService = RAGService.getInstance();
  let ragContextData: Array<{
    context: string;
    relevance: number;
    source?: string;
  }> = [];

  try {
    const ragStartTime = Date.now();
    ragContextData = await ragService.queryRAG(instructions, 3);
    const ragEndTime = Date.now();
    logger.info(
      `✅ [RUNAGENT] RAG context retrieved - ${ragContextData.length} items in ${ragEndTime - ragStartTime}ms`,
    );
  } catch (error) {
    logger.error(`❌ [RUNAGENT] RAG context retrieval failed:`, error);
  }

  // Global loop counter for tracking across all handleData calls
  let currentLoopNumber = 0;
  let conversationCountInCurrentLoop = 0;

  const handleData: GUIAgentConfig<NutJSElectronOperator>['onData'] = async ({
    data,
  }) => {
    const lastConv = getState().messages[getState().messages.length - 1];
    const { status, conversations, ...restUserData } = data;

    // Track loop progression - detect new loop FIRST
    let isNewLoop = false;
    if (conversations.length > 0) {
      const latestConv = conversations[conversations.length - 1];

      // Detect new loop when we get a human conversation with screenshot
      if (latestConv.from === 'human' && latestConv.screenshotBase64) {
        currentLoopNumber++;
        conversationCountInCurrentLoop = 0;
        isNewLoop = true;
        logger.info(
          `\n🔄 [RUNAGENT] ========== LOOP ${currentLoopNumber} STARTED ==========`,
        );
        logger.info(
          `📸 [RUNAGENT] LOOP ${currentLoopNumber}: Screenshot captured and processed`,
        );
      }

      conversationCountInCurrentLoop++;
    }

    // Log handleData call with correct loop number (or "INIT" if no loop started yet)
    if (currentLoopNumber === 0 && !isNewLoop) {
      logger.info(
        `\n📝 [RUNAGENT] INIT: HandleData called (initializing agent status)`,
      );
      logger.info(
        `📊 [RUNAGENT] INIT: Status=${status}, New conversations=${conversations.length}`,
      );
    } else {
      logger.info(
        `\n📝 [RUNAGENT] LOOP ${currentLoopNumber}: HandleData called (conversation ${conversationCountInCurrentLoop})`,
      );
      logger.info(
        `📊 [RUNAGENT] LOOP ${currentLoopNumber}: Status=${status}, New conversations=${conversations.length}`,
      );
    }

    // Process each conversation with detailed logging
    const logPrefix =
      currentLoopNumber === 0 && !isNewLoop
        ? 'INIT'
        : `LOOP ${currentLoopNumber}`;

    conversations.forEach((conv, index) => {
      const hasScreenshot = !!conv.screenshotBase64;
      const hasActions = !!conv.predictionParsed;
      const hasScreenshotContext = !!conv.screenshotContext;

      logger.info(
        `\n🔍 [RUNAGENT] ${logPrefix}: Processing conversation ${index + 1}:`,
      );
      logger.info(`   └── From: ${conv.from}`);
      logger.info(`   └── Has screenshot: ${hasScreenshot}`);
      logger.info(`   └── Has actions: ${hasActions}`);
      logger.info(`   └── Has screenshot context: ${hasScreenshotContext}`);

      // Detailed conversation type analysis
      if (conv.from === 'human' && hasScreenshot && !hasActions) {
        logger.info(
          `🎯 [RUNAGENT] ${logPrefix}: HUMAN SCREENSHOT CONVERSATION`,
        );
        logger.info(`   └── This is the main screenshot that starts the loop`);
        if (conv.screenshotContext?.size) {
          logger.info(
            `   └── Screenshot: ${conv.screenshotContext.size.width}x${conv.screenshotContext.size.height} (scale: ${conv.screenshotContext.scaleFactor})`,
          );
        }
      } else if (conv.from === 'gpt' && hasActions && !hasScreenshot) {
        logger.info(`🤖 [RUNAGENT] ${logPrefix}: GPT ACTION CONVERSATION`);
        logger.info(
          `   └── Model decided on ${conv.predictionParsed?.length || 0} actions`,
        );
        conv.predictionParsed?.forEach((action, actionIndex) => {
          logger.info(
            `   └── Action ${actionIndex + 1}: ${action.action_type} - ${JSON.stringify(action.action_inputs)}`,
          );
        });
      } else if (conv.from === 'gpt' && hasScreenshot && !hasActions) {
        logger.info(`📸 [RUNAGENT] ${logPrefix}: POST-ACTION SCREENSHOT`);
        logger.info(`   └── Screenshot taken after action execution`);
      } else {
        logger.info(`❓ [RUNAGENT] ${logPrefix}: UNKNOWN CONVERSATION TYPE`);
        logger.info(`   └── This conversation type is unexpected`);
      }
    });

    logger.info(
      `\n🔄 [RUNAGENT] ${logPrefix}: Processing conversations with SoM (Set of Marks)`,
    );
    logger.info(
      `🔍 [RUNAGENT] ${logPrefix}: Using cached RAG context - ${ragContextData.length} items`,
    );

    // add SoM to conversations
    const conversationsWithSoM: ConversationWithSoM[] = await Promise.all(
      conversations.map(async (conv, index) => {
        const { screenshotContext, predictionParsed } = conv;

        logger.info(
          `\n🎨 [RUNAGENT] ${logPrefix}: Processing SoM for conversation ${index + 1}`,
        );

        if (
          lastConv?.screenshotBase64 &&
          screenshotContext?.size &&
          predictionParsed
        ) {
          logger.info(
            `   └── Creating element markers (previous screenshot + current actions)`,
          );
          logger.info(
            `   └── Using screenshot from: ${lastConv.from} conversation`,
          );
          logger.info(
            `   └── Marking ${predictionParsed.length} actions on screenshot`,
          );

          const screenshotBase64WithElementMarker = await markClickPosition({
            screenshotContext,
            base64: lastConv?.screenshotBase64,
            parsed: predictionParsed,
          }).catch((e) => {
            logger.error(
              `❌ [RUNAGENT] ${logPrefix}: markClickPosition error:`,
              e,
            );
            return '';
          });

          logger.info(
            `✅ [RUNAGENT] ${logPrefix}: Element markers created successfully`,
          );
          logger.info(
            `🔍 [RUNAGENT] ${logPrefix}: Adding cached RAG context to conversation with element markers (${ragContextData.length} items)`,
          );

          return {
            ...conv,
            screenshotBase64WithElementMarker,
            ragContext: ragContextData.length > 0 ? ragContextData : undefined,
          };
        }

        logger.info(
          `   └── No element markers (missing: ${!lastConv?.screenshotBase64 ? 'previous screenshot' : ''} ${!screenshotContext?.size ? 'screenshot context' : ''} ${!predictionParsed ? 'actions' : ''})`,
        );
        logger.info(
          `🔍 [RUNAGENT] ${logPrefix}: Adding cached RAG context to conversation without element markers (${ragContextData.length} items)`,
        );

        return {
          ...conv,
          ragContext: ragContextData.length > 0 ? ragContextData : undefined,
        };
      }),
    ).catch((e) => {
      logger.error(
        `❌ [RUNAGENT] ${logPrefix}: conversationsWithSoM error:`,
        e,
      );
      return conversations;
    });

    const {
      screenshotBase64,
      predictionParsed,
      screenshotContext,
      screenshotBase64WithElementMarker,
      ...rest
    } = conversationsWithSoM?.[conversationsWithSoM.length - 1] || {};

    // Show prediction markers for local computer operator
    if (
      settings.operator === Operator.LocalComputer &&
      predictionParsed?.length &&
      screenshotContext?.size &&
      !abortController?.signal?.aborted
    ) {
      logger.info(
        `🎯 [RUNAGENT] ${logPrefix}: Showing prediction markers on screen`,
      );
      showPredictionMarker(predictionParsed, screenshotContext);
    }

    const newMessages = [
      ...(getState().messages || []),
      ...conversationsWithSoM,
    ];

    // Final state update
    setState({
      ...getState(),
      status,
      restUserData,
      messages: newMessages,
    });

    logger.info(`\n✅ [RUNAGENT] ${logPrefix}: HandleData completed`);
    logger.info(`   └── Total messages in state: ${newMessages.length}`);
    logger.info(
      `   └── New conversations processed: ${conversationsWithSoM.length}`,
    );
    logger.info(`   └── Status: ${status}`);

    // Log if actions will be executed next
    if (predictionParsed?.length) {
      logger.info(
        `⏳ [RUNAGENT] ${logPrefix}: Actions will be executed next by GUIAgent`,
      );
    }
  };

  let operatorType: 'computer' | 'browser' = 'computer';
  let operator:
    | NutJSElectronOperator
    | DefaultBrowserOperator
    | RemoteComputerOperator
    | RemoteBrowserOperator;

  switch (settings.operator) {
    case Operator.LocalComputer:
      operator = new NutJSElectronOperator();
      operatorType = 'computer';
      break;
    case Operator.LocalBrowser:
      await checkBrowserAvailability();
      const { browserAvailable } = getState();
      if (!browserAvailable) {
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
      operatorType = 'computer';
      break;
    case Operator.RemoteBrowser:
      operator = await createRemoteBrowserOperator();
      operatorType = 'browser';
      break;
    default:
      break;
  }

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

  // Use enhanced system prompt with RAG integration (reuse already-retrieved RAG context)
  logger.info(
    `🔍 [RUNAGENT] Creating enhanced system prompt with cached RAG context...`,
  );
  const baseSystemPrompt = getSpByModelVersion(
    modelVersion,
    language,
    operatorType,
  );

  let systemPrompt = baseSystemPrompt;
  if (ragContextData.length > 0) {
    let ragContextString = '\n\n## RELEVANT CONTEXT FROM KNOWLEDGE BASE:\n';
    ragContextData.forEach((ctx, index) => {
      ragContextString += `\n**Context ${index + 1}** (Relevance: ${ctx.relevance.toFixed(2)}, Source: ${ctx.source}):\n`;
      ragContextString += `${ctx.context}\n`;
    });
    ragContextString +=
      '\nUse this context to provide more accurate and helpful responses.\n';
    systemPrompt = baseSystemPrompt + ragContextString;
    logger.info(
      `✅ [RUNAGENT] Enhanced system prompt created with ${ragContextData.length} RAG contexts`,
    );
  } else {
    logger.info(
      `📝 [RUNAGENT] Using base system prompt (no RAG context available)`,
    );
  }

  logger.info(`\n🔧 [RUNAGENT] Creating GUIAgent instance`);
  logger.info(`   └── Operator: ${settings.operator}`);
  logger.info(`   └── Model: ${modelConfig.model || 'default'}`);
  logger.info(`   └── Max loops: ${settings.maxLoopCount}`);
  logger.info(`   └── Loop interval: 0ms (no delay)`);

  const guiAgent = new GUIAgent({
    model: modelConfig,
    systemPrompt: systemPrompt,
    logger,
    signal: abortController?.signal,
    operator: operator!,
    onData: handleData,
    onError: (params) => {
      const { error } = params;
      logger.error(`❌ [RUNAGENT] GUIAgent error:`, error);
      setState({
        ...getState(),
        status: StatusEnum.ERROR,
        errorMsg: JSON.stringify({
          status: error?.status,
          message: error?.message,
          stack: error?.stack,
        }),
      });
    },
    retry: {
      model: {
        maxRetries: 5,
      },
      screenshot: {
        maxRetries: 5,
      },
      execute: {
        maxRetries: 1,
      },
    },
    maxLoopCount: settings.maxLoopCount,
    loopIntervalInMs: 0, // No delay between actions for faster execution
    uiTarsVersion: modelVersion,
  });

  logger.info(`✅ [RUNAGENT] GUIAgent instance created successfully`);

  GUIAgentManager.getInstance().setAgent(guiAgent);
  UTIOService.getInstance().sendInstruction(instructions);

  const { sessionHistoryMessages } = getState();

  beforeAgentRun(settings.operator);

  const startTime = Date.now();

  logger.info(
    `\n🚀 [RUNAGENT] ========== STARTING GUIAGENT EXECUTION ==========`,
  );
  logger.info(
    `📋 [RUNAGENT] Instructions: ${instructions.substring(0, 100)}...`,
  );
  logger.info(
    `⚙️ [RUNAGENT] Configuration: maxLoopCount=${settings.maxLoopCount}, loopIntervalInMs=0`,
  );

  await guiAgent
    .run(instructions, sessionHistoryMessages, modelAuthHdrs)
    .catch((e) => {
      logger.error(`❌ [RUNAGENT] GUIAgent.run() error:`, e);
      setState({
        ...getState(),
        status: StatusEnum.ERROR,
        errorMsg: e.message,
      });
    });

  const totalTime = (Date.now() - startTime) / 1000;
  logger.info(
    `\n🏁 [RUNAGENT] ========== GUIAGENT EXECUTION COMPLETED ==========`,
  );
  logger.info(`⏱️ [RUNAGENT] Total execution time: ${totalTime}s`);
  logger.info(`🔢 [RUNAGENT] Total loops executed: ${currentLoopNumber}`);

  afterAgentRun(settings.operator);
};
