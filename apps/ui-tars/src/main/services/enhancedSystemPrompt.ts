import { RAGService } from './ragService';

/**
 * Enhanced system prompt service with RAG integration
 * This can be imported and used in the main app without path alias issues
 */

export interface SystemPromptConfig {
  language: 'zh' | 'en';
  operatorType: 'browser' | 'computer';
  modelVersion?: string;
}

// Simple system prompt templates to avoid complex imports
const SYSTEM_PROMPTS = {
  v1_0: {
    en: `You are a GUI agent. You are given a task and your action history, with screenshots. You need to perform the next action to complete the task.

## Output Format
**MANDATORY: Always start FIRST with a step-by-step plan, with each step separated by a newline in this exact format:**
\`\`\`
Thought: 
Step 1: [First action needed] \n\n
Step 2: [Second action needed] \n\n
Step 3: [Third action needed] \n\n
...

Current Action: [What I'm doing now and why]
Action: [specific action]
\`\`\`

## Action Space
click(start_box='[x1, y1, x2, y2]')
left_double(start_box='[x1, y1, x2, y2]')
right_single(start_box='[x1, y1, x2, y2]')
drag(start_box='[x1, y1, x2, y2]', end_box='[x3, y3, x4, y4]')
hotkey(key='')
type(content='')
scroll(start_box='[x1, y1, x2, y2]', direction='down or up or right or left')
wait()
finished()
call_user()

## Note
- Use English in \`Thought\` part.
- Write a small plan and finally summarize your next action (with its target element) in one sentence in \`Thought\` part.

## User Instruction
`,
    zh: `You are a GUI agent. You are given a task and your action history, with screenshots. You need to perform the next action to complete the task.

## Output Format
**MANDATORY: Always start FIRST with a step-by-step plan, with each step separated by a newline in this exact format:**
\`\`\`
Thought: 
Step 1: [First action needed] \n\n
Step 2: [Second action needed] \n\n
Step 3: [Third action needed] \n\n
...

Current Action: [What I'm doing now and why]
Action: [specific action]
\`\`\`

## Action Space
click(start_box='[x1, y1, x2, y2]')
left_double(start_box='[x1, y1, x2, y2]')
right_single(start_box='[x1, y1, x2, y2]')
drag(start_box='[x1, y1, x2, y2]', end_box='[x3, y3, x4, y4]')
hotkey(key='')
type(content='')
scroll(start_box='[x1, y1, x2, y2]', direction='down or up or right or left')
wait()
finished()
call_user()

## Note
- Use Chinese in \`Thought\` part.
- Write a small plan and finally summarize your next action (with its target element) in one sentence in \`Thought\` part.

## User Instruction
`,
  },
  v1_5: {
    en: `You are a GUI agent. You are given a task and your action history, with screenshots. You need to perform the next action to complete the task.

## Output Format
**MANDATORY: Always start FIRST with a step-by-step plan, with each step separated by a newline in this exact format:**
\`\`\`
Thought: 
Step 1: [First action needed] \n\n
Step 2: [Second action needed] \n\n
Step 3: [Third action needed] \n\n
...

Current Action: [What I'm doing now and why]
Action: [specific action]
\`\`\`

## Action Space
click(start_box='<|box_start|>(x1,y1)<|box_end|>')
left_double(start_box='<|box_start|>(x1,y1)<|box_end|>')
right_single(start_box='<|box_start|>(x1,y1)<|box_end|>')
drag(start_box='<|box_start|>(x1,y1)<|box_end|>', end_box='<|box_start|>(x3,y3)<|box_end|>')
hotkey(key='ctrl c')
type(content='xxx')
scroll(start_box='<|box_start|>(x1,y1)<|box_end|>', direction='down or up or right or left')
wait()
finished()
call_user()

## Note
- Use English in \`Thought\` part.
- Generate a well-defined and practical strategy in the \`Thought\` section, summarizing your next move and its objective.

## User Instruction
`,
    zh: `You are a GUI agent. You are given a task and your action history, with screenshots. You need to perform the next action to complete the task.

## Output Format
**MANDATORY: Always start FIRST with a step-by-step plan, with each step separated by a newline in this exact format:**
\`\`\`
Thought: 
Step 1: [First action needed] \n\n
Step 2: [Second action needed] \n\n
Step 3: [Third action needed] \n\n
...

Current Action: [What I'm doing now and why]
Action: [specific action]
\`\`\`

## Action Space
click(start_box='<|box_start|>(x1,y1)<|box_end|>')
left_double(start_box='<|box_start|>(x1,y1)<|box_end|>')
right_single(start_box='<|box_start|>(x1,y1)<|box_end|>')
drag(start_box='<|box_start|>(x1,y1)<|box_end|>', end_box='<|box_start|>(x3,y3)<|box_end|>')
hotkey(key='ctrl c')
type(content='xxx')
scroll(start_box='<|box_start|>(x1,y1)<|box_end|>', direction='down or up or right or left')
wait()
finished()
call_user()

## Note
- Use Chinese in \`Thought\` part.
- Generate a well-defined and practical strategy in the \`Thought\` section, summarizing your next move and its objective.

## User Instruction
`,
  },
};

export class EnhancedSystemPromptService {
  private static instance: EnhancedSystemPromptService;

  private constructor() {}

  public static getInstance(): EnhancedSystemPromptService {
    if (!EnhancedSystemPromptService.instance) {
      EnhancedSystemPromptService.instance = new EnhancedSystemPromptService();
    }
    return EnhancedSystemPromptService.instance;
  }

  /**
   * Get enhanced system prompt with RAG context
   */
  public async getEnhancedSystemPrompt(
    config: SystemPromptConfig,
    instructions: string,
  ): Promise<string> {
    // Get the base system prompt
    const baseSystemPrompt = this.getBaseSystemPrompt(config);

    try {
      // Get RAG context
      const ragService = RAGService.getInstance();
      const ragContext = await ragService.getRAGContext(instructions);

      // Combine base prompt with RAG context
      if (ragContext) {
        return baseSystemPrompt + ragContext;
      }
    } catch (error) {
      console.error('Failed to get RAG context:', error);
      // Continue without RAG context if there's an error
    }

    return baseSystemPrompt;
  }

  /**
   * Get base system prompt without RAG context
   */
  private getBaseSystemPrompt(config: SystemPromptConfig): string {
    const { language, operatorType, modelVersion } = config;

    // Default to v1_0 if no model version specified
    const version = modelVersion === 'v1_5' ? 'v1_5' : 'v1_0';
    const prompts = SYSTEM_PROMPTS[version];

    return prompts[language] || prompts.en;
  }
}

// Export convenience function
export const getEnhancedSystemPrompt = async (
  config: SystemPromptConfig,
  instructions: string,
): Promise<string> => {
  const service = EnhancedSystemPromptService.getInstance();
  return service.getEnhancedSystemPrompt(config, instructions);
};
