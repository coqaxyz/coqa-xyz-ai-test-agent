import { z } from 'zod';

export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
}

export enum TestFramework {
  JEST = 'jest',
  MOCHA = 'mocha',
  CYPRESS = 'cypress',
  PLAYWRIGHT = 'playwright',
}

export enum ReportFormat {
  JSON = 'json',
  XML = 'xml',
}

export const TestConfigSchema = z.object({
  type: z.nativeEnum(TestType),
  framework: z.nativeEnum(TestFramework),
  sourcePath: z.string(),
  testPath: z.string(),
  coverage: z.number().min(0).max(100).optional(),
  maxRetries: z.number().int().min(0).optional(),
  timeout: z.number().int().min(0).optional(),
  reporting: z.object({
    formats: z.array(z.nativeEnum(ReportFormat)).optional(),
    outputPath: z.string().optional(),
    includeTimestamp: z.boolean().optional(),
  }).optional(),
});

export type TestConfig = z.infer<typeof TestConfigSchema>;

export interface TestCase {
  id: string;
  description: string;
  input: any;
  expectedOutput: any;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  init(config: Record<string, any>): Promise<void>;
  executeTask(task: string, inputs: Record<string, any>): Promise<Record<string, any>>;
}

export interface LLMProvider {
  generateCompletion(prompt: string, options?: Record<string, any>): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}

export interface TestGenerator {
  analyzeCode(sourcePath: string): Promise<any>;
  generateTestCases(analysis: any, config: TestConfig): Promise<TestCase[]>;
  convertToTestCode(testCases: TestCase[], framework: TestFramework): Promise<string>;
}

export interface TestRunner {
  runTests(testPath: string, options?: Record<string, any>): Promise<TestResult[]>;
  analyzeResults(results: TestResult[]): Promise<any>;
  generateReport?(results: TestResult[], analysis: any, formats: ReportFormat[], outputPath: string): Promise<string[]>;
}