import path from 'path';
import fs from 'fs/promises';
import { TestConfig, TestCase, TestFramework, TestGenerator } from '../core/types';
import { OpenAIAgent } from '../agents/openaiAgent';
import logger from '../core/logger';
import { parseFile, ParsedModule } from './codeParser';

export class AITestGenerator implements TestGenerator {
  private agent: OpenAIAgent;
  
  constructor(agent: OpenAIAgent) {
    this.agent = agent;
  }

  async analyzeCode(sourcePath: string): Promise<ParsedModule> {
    logger.info(`Analyzing code at ${sourcePath}`);
    
    try {
      const parsedCode = await parseFile(sourcePath);
      return parsedCode;
    } catch (error) {
      logger.error(`Error analyzing code at ${sourcePath}`, { error });
      throw new Error(`Failed to analyze code: ${(error as Error).message}`);
    }
  }

  async generateTestCases(analysis: ParsedModule, config: TestConfig): Promise<TestCase[]> {
    logger.info(`Generating test cases for ${analysis.filePath}`);
    
    try {
      const fileContent = await fs.readFile(analysis.filePath, 'utf-8');
      
      const prompt = `
        Generate test cases for the following ${config.type} test:
        
        File: ${path.basename(analysis.filePath)}
        
        Code:
        \`\`\`typescript
        ${fileContent}
        \`\`\`
        
        Return a JSON array of test cases, where each test case has:
        1. id: string
        2. description: string
        3. input: object with input parameters
        4. expectedOutput: expected results
        
        Focus on thorough coverage, edge cases, and negative testing.
      `;
      
      const result = await this.agent.generateCompletion(prompt);
      
      try {
        const testCases = JSON.parse(result) as TestCase[];
        return testCases;
      } catch (error) {
        logger.error('Error parsing test cases JSON', { error, rawResponse: result });
        throw new Error(`Failed to parse test cases: ${(error as Error).message}`);
      }
    } catch (error) {
      logger.error(`Error generating test cases for ${analysis.filePath}`, { error });
      throw new Error(`Failed to generate test cases: ${(error as Error).message}`);
    }
  }

  async convertToTestCode(testCases: TestCase[], framework: TestFramework): Promise<string> {
    logger.info(`Converting test cases to ${framework} code`);
    
    const frameworkExamples = {
      [TestFramework.JEST]: `
        describe('Example suite', () => {
          test('should do something', () => {
            expect(1 + 1).toBe(2);
          });
        });
      `,
      [TestFramework.MOCHA]: `
        describe('Example suite', function() {
          it('should do something', function() {
            expect(1 + 1).to.equal(2);
          });
        });
      `,
      [TestFramework.CYPRESS]: `
        describe('Example suite', () => {
          it('should do something', () => {
            expect(1 + 1).to.equal(2);
          });
        });
      `,
      [TestFramework.PLAYWRIGHT]: `
        test.describe('Example suite', () => {
          test('should do something', async ({ page }) => {
            expect(1 + 1).toBe(2);
          });
        });
      `,
    };
    
    const prompt = `
      Convert these test cases to ${framework} test code:
      
      Test Cases:
      \`\`\`json
      ${JSON.stringify(testCases, null, 2)}
      \`\`\`
      
      Framework: ${framework}
      
      Example structure for this framework:
      \`\`\`typescript
      ${frameworkExamples[framework]}
      \`\`\`
      
      Return only the complete test file code in TypeScript.
    `;
    
    try {
      const testCode = await this.agent.generateCompletion(prompt);
      return testCode;
    } catch (error) {
      logger.error(`Error converting to ${framework} code`, { error });
      throw new Error(`Failed to convert to test code: ${(error as Error).message}`);
    }
  }
}