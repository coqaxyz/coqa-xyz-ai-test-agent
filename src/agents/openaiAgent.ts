import { OpenAI } from 'openai';
import { Agent, LLMProvider } from '../core/types';
import logger from '../core/logger';

export class OpenAIAgent implements Agent, LLMProvider {
  id: string;
  name: string;
  capabilities: string[];
  private client: OpenAI;
  private model: string;

  constructor(id: string = 'openai-default') {
    this.id = id;
    this.name = 'OpenAI Agent';
    this.capabilities = ['code-generation', 'test-generation', 'code-analysis'];
    this.model = 'gpt-4';
  }

  async init(config: Record<string, any>): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
    });

    if (config.model) {
      this.model = config.model;
    }

    logger.info(`OpenAI Agent initialized with model: ${this.model}`);
  }

  async executeTask(task: string, inputs: Record<string, any>): Promise<Record<string, any>> {
    logger.info(`Executing task: ${task}`);
    
    switch (task) {
      case 'generate-test':
        return this.generateTest(inputs.code, inputs.testType);
      case 'analyze-code':
        return this.analyzeCode(inputs.code);
      case 'suggest-improvements':
        return this.suggestImprovements(inputs.code, inputs.testResults);
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  async generateCompletion(prompt: string, options: Record<string, any> = {}): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Error generating completion', { error });
      throw new Error(`Failed to generate completion: ${(error as Error).message}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding', { error });
      throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
    }
  }

  private async generateTest(code: string, testType: string): Promise<Record<string, any>> {
    const prompt = `
      Generate a comprehensive ${testType} test for the following code:
      
      \`\`\`
      ${code}
      \`\`\`
      
      The test should:
      1. Cover all main functionality
      2. Include edge cases
      3. Follow best practices for testing
      4. Use jest as the testing framework
      
      Return the test code only, without explanations.
    `;

    const testCode = await this.generateCompletion(prompt);
    return { testCode };
  }

  private async analyzeCode(code: string): Promise<Record<string, any>> {
    const prompt = `
      Analyze the following code for testability, potential bugs, and code quality issues:
      
      \`\`\`
      ${code}
      \`\`\`
      
      Provide a structured JSON output with the following sections:
      1. complexity (numeric score 1-10)
      2. testability (numeric score 1-10)
      3. potentialIssues (array of issues)
      4. testingRecommendations (array of recommendations)
    `;

    const analysisText = await this.generateCompletion(prompt);
    try {
      const analysis = JSON.parse(analysisText);
      return analysis;
    } catch (error) {
      logger.error('Error parsing analysis', { error, analysisText });
      return { 
        error: 'Failed to parse analysis',
        rawResponse: analysisText
      };
    }
  }

  private async suggestImprovements(code: string, testResults: any): Promise<Record<string, any>> {
    const prompt = `
      Review the following code and its test results, then suggest improvements:
      
      Code:
      \`\`\`
      ${code}
      \`\`\`
      
      Test Results:
      \`\`\`
      ${JSON.stringify(testResults, null, 2)}
      \`\`\`
      
      Provide a structured JSON output with the following sections:
      1. codeImprovements (array of suggested code changes)
      2. testImprovements (array of suggested test improvements)
      3. priorityIssues (array of high-priority issues to address)
    `;

    const suggestionsText = await this.generateCompletion(prompt);
    try {
      const suggestions = JSON.parse(suggestionsText);
      return suggestions;
    } catch (error) {
      logger.error('Error parsing suggestions', { error, suggestionsText });
      return { 
        error: 'Failed to parse suggestions',
        rawResponse: suggestionsText
      };
    }
  }
}