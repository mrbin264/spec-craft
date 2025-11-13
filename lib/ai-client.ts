// Azure OpenAI service client
import { env } from './env';

export interface AIGenerateOptions {
  action: AIAction;
  selectedText: string;
  context: string;
  model?: 'gpt-4o-mini' | 'gpt-4o';
}

export type AIAction = 
  | 'complete'
  | 'rewrite'
  | 'generate-criteria'
  | 'generate-tests'
  | 'summarize'
  | 'extract-tasks'
  | 'translate';

export interface AIGenerateResult {
  generatedText: string;
  tokensUsed: number;
  model: string;
  metadata: {
    timestamp: Date;
    action: string;
  };
}

// Prompt templates for each AI action
const PROMPT_TEMPLATES: Record<AIAction, (selectedText: string, context: string) => string> = {
  complete: (selectedText, context) => `
You are a technical writing assistant. Complete the following text in a clear and professional manner.

Context:
${context}

Text to complete:
${selectedText}

Provide only the completion, without repeating the original text.
`,

  rewrite: (selectedText, context) => `
You are a technical writing assistant. Rewrite the following text for clarity, conciseness, and professionalism.

Context:
${context}

Text to rewrite:
${selectedText}

Provide the rewritten version.
`,

  'generate-criteria': (selectedText, context) => `
You are a product requirements expert. Generate acceptance criteria for the following user story using the EARS (Easy Approach to Requirements Syntax) pattern.

Context:
${context}

User Story:
${selectedText}

Generate 3-5 acceptance criteria following these patterns:
- WHEN <trigger>, THE <system> SHALL <response>
- WHILE <condition>, THE <system> SHALL <response>
- IF <condition>, THEN THE <system> SHALL <response>
- WHERE <option>, THE <system> SHALL <response>

Format as a numbered list.
`,

  'generate-tests': (selectedText, context) => `
You are a QA engineer. Generate test cases for the following specification.

Context:
${context}

Specification:
${selectedText}

Generate 3-5 test cases covering:
- Happy path scenarios
- Edge cases
- Error conditions

Format as a numbered list with test name and steps.
`,

  summarize: (selectedText, context) => `
You are a technical writing assistant. Summarize the following content concisely.

Context:
${context}

Content to summarize:
${selectedText}

Provide a clear, concise summary (2-3 sentences).
`,

  'extract-tasks': (selectedText, context) => `
You are a project manager. Extract actionable tasks from the following specification.

Context:
${context}

Specification:
${selectedText}

Generate a list of specific, actionable tasks. Format as a checkbox list:
- [ ] Task description
`,

  translate: (selectedText, context) => `
You are a translation assistant. Translate the following text to the target language while maintaining technical accuracy.

Context:
${context}

Text to translate:
${selectedText}

Provide the translation.
`,
};

/**
 * Estimate token count for text
 * Rough approximation: 1 token ≈ 4 characters for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get prompt template for an AI action
 */
export function getPromptTemplate(action: AIAction, selectedText: string, context: string): string {
  const template = PROMPT_TEMPLATES[action];
  if (!template) {
    throw new Error(`Unknown AI action: ${action}`);
  }
  return template(selectedText, context);
}

/**
 * Estimate token cost for an AI generation request
 */
export function estimateTokenCost(options: AIGenerateOptions): number {
  const prompt = getPromptTemplate(options.action, options.selectedText, options.context);
  const promptTokens = estimateTokens(prompt);
  // Estimate response tokens (typically 20-50% of prompt length)
  const estimatedResponseTokens = Math.ceil(promptTokens * 0.3);
  return promptTokens + estimatedResponseTokens;
}

/**
 * Generate text using Azure OpenAI
 */
export async function generateWithAI(options: AIGenerateOptions): Promise<AIGenerateResult> {
  const { action, selectedText, context, model = 'gpt-4o-mini' } = options;
  
  // Validate configuration
  if (!env.openai.endpoint || !env.openai.apiKey) {
    throw new Error('Azure OpenAI configuration is missing');
  }

  const prompt = getPromptTemplate(action, selectedText, context);
  
  // Call Azure OpenAI API
  const url = `${env.openai.endpoint}/openai/deployments/${env.openai.deploymentName}/chat/completions?api-version=2024-02-15-preview`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.openai.apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for technical documentation and specification writing.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  const generatedText = data.choices[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || estimateTokens(prompt + generatedText);

  return {
    generatedText,
    tokensUsed,
    model,
    metadata: {
      timestamp: new Date(),
      action,
    },
  };
}
