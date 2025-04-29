import path from 'path';
import fs from 'fs/promises';
import { AITestGenerator } from '../utils/testGenerator';
import { TestConfig, TestType, TestFramework } from '../core/types';
import { OpenAIAgent } from '../agents/openaiAgent';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../utils/codeParser', () => ({
  parseFile: jest.fn().mockResolvedValue({
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    interfaces: [],
    filePath: '/test/file.ts',
  }),
}));

describe('AITestGenerator', () => {
  const mockAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    capabilities: ['test-generation'],
    init: jest.fn(),
    executeTask: jest.fn(),
    generateCompletion: jest.fn(),
    generateEmbedding: jest.fn(),
  } as unknown as OpenAIAgent;

  let generator: AITestGenerator;
  const testConfig: TestConfig = {
    type: TestType.UNIT,
    framework: TestFramework.JEST,
    sourcePath: '/test/file.ts',
    testPath: '/test/file.test.ts',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new AITestGenerator(mockAgent);
    
    // Mock file read
    (fs.readFile as jest.Mock).mockResolvedValue('const add = (a, b) => a + b;');
  });

  test('should analyze code', async () => {
    const result = await generator.analyzeCode('/test/file.ts');
    expect(result).toHaveProperty('filePath', '/test/file.ts');
  });

  test('should generate test cases', async () => {
    const mockTestCases = [
      {
        id: 'test1',
        description: 'Test addition',
        input: { a: 1, b: 2 },
        expectedOutput: 3,
      },
    ];
    
    mockAgent.generateCompletion.mockResolvedValue(JSON.stringify(mockTestCases));
    
    const analysis = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      filePath: '/test/file.ts',
    };
    
    const result = await generator.generateTestCases(analysis, testConfig);
    expect(result).toEqual(mockTestCases);
    expect(mockAgent.generateCompletion).toHaveBeenCalled();
  });

  test('should convert test cases to test code', async () => {
    const testCases = [
      {
        id: 'test1',
        description: 'Test addition',
        input: { a: 1, b: 2 },
        expectedOutput: 3,
      },
    ];
    
    const mockTestCode = `
      import { add } from './file';
      
      describe('add', () => {
        test('should add two numbers', () => {
          expect(add(1, 2)).toBe(3);
        });
      });
    `;
    
    mockAgent.generateCompletion.mockResolvedValue(mockTestCode);
    
    const result = await generator.convertToTestCode(testCases, TestFramework.JEST);
    expect(result).toBe(mockTestCode);
    expect(mockAgent.generateCompletion).toHaveBeenCalled();
  });

  test('should handle errors in test case generation', async () => {
    mockAgent.generateCompletion.mockResolvedValue('Invalid JSON');
    
    const analysis = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      filePath: '/test/file.ts',
    };
    
    await expect(generator.generateTestCases(analysis, testConfig))
      .rejects.toThrow('Failed to parse test cases');
  });
});