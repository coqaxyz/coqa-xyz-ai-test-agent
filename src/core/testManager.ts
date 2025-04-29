import path from 'path';
import fs from 'fs/promises';
import { TestConfig, TestType, TestFramework, ReportFormat } from './types';
import { AgentManager } from './agentManager';
import { Config } from './config';
import { AITestGenerator } from '../utils/testGenerator';
import { JestTestRunner, PlaywrightTestRunner } from '../utils/testRunner';
import logger from './logger';

export class TestManager {
  private agentManager: AgentManager;
  private config: Config;
  
  constructor(agentManager: AgentManager, config: Config) {
    this.agentManager = agentManager;
    this.config = config;
  }
  
  async generateAndRunTests(sourcePath: string, options: Partial<TestConfig> = {}): Promise<any> {
    logger.info(`Generating and running tests for ${sourcePath}`);
    
    const testConfig: TestConfig = {
      type: options.type || TestType.UNIT,
      framework: options.framework || TestFramework.JEST,
      sourcePath,
      testPath: options.testPath || this.getDefaultTestPath(sourcePath, options.framework || TestFramework.JEST),
      coverage: options.coverage || this.config.testDefaults.coverage,
      maxRetries: options.maxRetries || this.config.testDefaults.maxRetries,
      timeout: options.timeout || this.config.testDefaults.timeout,
      reporting: options.reporting || {
        formats: this.config.testDefaults.reporting?.formats?.map(f => f as ReportFormat) || [],
        outputPath: this.config.outputPath,
        includeTimestamp: this.config.testDefaults.reporting?.includeTimestamp || true,
      },
    };
    
    try {
      // Get the default agent
      const agent = this.agentManager.getDefaultAgent();
      if (!agent) {
        throw new Error('No agent available');
      }
      
      // Create test generator
      const generator = new AITestGenerator(agent as any); // Cast to any to bypass type checking
      
      // Analyze code
      const analysis = await generator.analyzeCode(sourcePath);
      
      // Generate test cases
      const testCases = await generator.generateTestCases(analysis, testConfig);
      
      // Convert to test code
      const testCode = await generator.convertToTestCode(testCases, testConfig.framework);
      
      // Ensure the test directory exists
      const testDir = path.dirname(testConfig.testPath);
      await fs.mkdir(testDir, { recursive: true });
      
      // Write test file
      await fs.writeFile(testConfig.testPath, testCode, 'utf-8');
      logger.info(`Test file written to ${testConfig.testPath}`);
      
      // Run tests
      const runner = this.getTestRunner(testConfig.framework);
      const results = await runner.runTests(testConfig.testPath);
      
      // Analyze results
      const analysis = await runner.analyzeResults(results);
      
      // Generate reports if reporting is enabled
      if (testConfig.reporting?.formats && testConfig.reporting.formats.length > 0) {
        const outputPath = testConfig.reporting.outputPath || this.config.outputPath;
        await runner.generateReport!(
          results, 
          analysis, 
          testConfig.reporting.formats, 
          outputPath
        );
      }
      
      return analysis;
    } catch (error) {
      logger.error(`Error generating and running tests`, { error });
      throw new Error(`Failed to generate and run tests: ${(error as Error).message}`);
    }
  }
  
  async runExistingTests(testPath: string, options: Record<string, any> = {}): Promise<any> {
    logger.info(`Running existing tests at ${testPath}`);
    
    try {
      // Determine framework based on file extension or content
      const framework = await this.detectFramework(testPath);
      
      // Run tests
      const runner = this.getTestRunner(framework);
      const results = await runner.runTests(testPath, options);
      
      // Analyze results
      const analysis = await runner.analyzeResults(results);
      
      // Generate reports if reporting formats are specified
      if (options.reportFormats && Array.isArray(options.reportFormats) && options.reportFormats.length > 0) {
        const outputPath = options.outputPath || this.config.outputPath;
        await runner.generateReport!(
          results, 
          analysis, 
          options.reportFormats.map((f: string) => f as ReportFormat), 
          outputPath
        );
      }
      
      return analysis;
    } catch (error) {
      logger.error(`Error running existing tests`, { error });
      throw new Error(`Failed to run existing tests: ${(error as Error).message}`);
    }
  }
  
  private getDefaultTestPath(sourcePath: string, framework: TestFramework): string {
    const dir = path.dirname(sourcePath);
    const filename = path.basename(sourcePath, path.extname(sourcePath));
    
    const testDir = dir.includes('src')
      ? dir.replace(/src/, 'test')
      : path.join(dir, '__tests__');
    
    const extension = path.extname(sourcePath).replace('.', '.test.');
    return path.join(testDir, `${filename}${extension}`);
  }
  
  private getTestRunner(framework: TestFramework): JestTestRunner | PlaywrightTestRunner {
    switch (framework) {
      case TestFramework.JEST:
      case TestFramework.MOCHA:
        return new JestTestRunner();
      case TestFramework.PLAYWRIGHT:
      case TestFramework.CYPRESS:
        return new PlaywrightTestRunner();
      default:
        return new JestTestRunner();
    }
  }
  
  private async detectFramework(testPath: string): Promise<TestFramework> {
    try {
      const content = await fs.readFile(testPath, 'utf-8');
      
      if (content.includes('describe') && content.includes('test(') && content.includes('expect(')) {
        return TestFramework.JEST;
      } else if (content.includes('describe') && content.includes('it(') && content.includes('expect(')) {
        return TestFramework.MOCHA;
      } else if (content.includes('test.describe') || content.includes('page.goto')) {
        return TestFramework.PLAYWRIGHT;
      } else if (content.includes('cy.visit') || content.includes('cy.get')) {
        return TestFramework.CYPRESS;
      }
      
      // Default to Jest
      return TestFramework.JEST;
    } catch (error) {
      logger.error(`Error detecting framework`, { error });
      return TestFramework.JEST;
    }
  }
}