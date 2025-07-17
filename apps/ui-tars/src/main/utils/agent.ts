import { UITarsModelVersion } from '@ui-tars/shared/constants';
import {
  Operator,
  SearchEngineForSettings,
  VLMProviderV2,
} from '../store/types';
import {
  getSystemPrompt,
  getSystemPromptDoubao_15_15B,
  getSystemPromptDoubao_15_20B,
  getSystemPromptV1_5,
} from '../agent/prompts';
import {
  closeScreenMarker,
  hideScreenWaterFlow,
  hideWidgetWindow,
  showScreenWaterFlow,
  showWidgetWindow,
} from '../window/ScreenMarker';
import { hideMainWindow, showMainWindow } from '../window';
import { SearchEngine } from '@ui-tars/operator-browser';
import { RAGService } from '../services/ragService';

export const getModelVersion = (
  provider: VLMProviderV2 | undefined,
): UITarsModelVersion => {
  switch (provider) {
    case VLMProviderV2.ui_tars_1_5:
      return UITarsModelVersion.V1_5;
    case VLMProviderV2.ui_tars_1_0:
      return UITarsModelVersion.V1_0;
    case VLMProviderV2.doubao_1_5:
      return UITarsModelVersion.DOUBAO_1_5_15B;
    case VLMProviderV2.doubao_1_5_vl:
      return UITarsModelVersion.DOUBAO_1_5_20B;
    default:
      return UITarsModelVersion.V1_0;
  }
};

export const getSpByModelVersion = (
  modelVersion: UITarsModelVersion,
  language: 'zh' | 'en',
  operatorType: 'browser' | 'computer',
) => {
  switch (modelVersion) {
    case UITarsModelVersion.DOUBAO_1_5_20B:
      return getSystemPromptDoubao_15_20B(language, operatorType);
    case UITarsModelVersion.DOUBAO_1_5_15B:
      return getSystemPromptDoubao_15_15B(language);
    case UITarsModelVersion.V1_5:
      return getSystemPromptV1_5(language, 'normal');
    default:
      return getSystemPrompt(language);
  }
};

// New function for enhanced system prompt with RAG integration
export const getEnhancedSystemPrompt = async (
  modelVersion: UITarsModelVersion,
  language: 'zh' | 'en',
  operatorType: 'browser' | 'computer',
  instructions: string,
): Promise<string> => {
  // Get the base system prompt
  const baseSystemPrompt = getSpByModelVersion(
    modelVersion,
    language,
    operatorType,
  );

  // console.log('=== PROMPT DEBUG ===');
  // console.log('📋 Base System Prompt:');
  // console.log(baseSystemPrompt);
  // console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Get RAG context
    const ragService = RAGService.getInstance();
    const ragContext = await ragService.getRAGContext(instructions);

    // console.log('🔍 RAG Context:');
    // console.log(ragContext || '(No RAG context)');
    // console.log('\n' + '='.repeat(50) + '\n');

    // Combine base prompt with RAG context
    if (ragContext) {
      const finalPrompt = baseSystemPrompt + ragContext;
      // console.log('🚀 FINAL PROMPT (Base + RAG):');
      // console.log(finalPrompt);
      // console.log('\n' + '='.repeat(50) + '\n');
      return finalPrompt;
    }
  } catch (error) {
    console.error('Failed to get RAG context:', error);
    // Continue without RAG context if there's an error
  }

  // console.log('🚀 FINAL PROMPT (Base only, no RAG):');
  // console.log(baseSystemPrompt);
  // console.log('\n' + '='.repeat(50) + '\n');

  return baseSystemPrompt;
};

export const getLocalBrowserSearchEngine = (
  engine?: SearchEngineForSettings,
) => {
  return (engine || SearchEngineForSettings.GOOGLE) as unknown as SearchEngine;
};

export const beforeAgentRun = async (operator: Operator) => {
  switch (operator) {
    case Operator.RemoteComputer:
      break;
    case Operator.RemoteBrowser:
      break;
    case Operator.LocalComputer:
      showWidgetWindow();
      showScreenWaterFlow();
      hideMainWindow();
      break;
    case Operator.LocalBrowser:
      hideMainWindow();
      showWidgetWindow();
      break;
    default:
      break;
  }
};

export const afterAgentRun = (operator: Operator) => {
  switch (operator) {
    case Operator.RemoteComputer:
      break;
    case Operator.RemoteBrowser:
      break;
    case Operator.LocalComputer:
      hideWidgetWindow();
      closeScreenMarker();
      hideScreenWaterFlow();
      showMainWindow();
      break;
    case Operator.LocalBrowser:
      hideWidgetWindow();
      showMainWindow();
      break;
    default:
      break;
  }
};
