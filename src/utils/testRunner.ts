import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { TestResult, TestRunner, ReportFormat } from '../core/types';
import logger from '../core/logger';
import { TestReporter } from './testReporter';

const execPromise = promisify(exec);

export class JestTestRunner implements TestRunner {
  private projectRoot: string;
  private reporter: TestReporter;
  
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.reporter = new TestReporter();
  }
  
  async runTests(testPath: string, options: Record<string, any> = {}): Promise<TestResult[]> {
    logger.info(`Running tests at ${testPath}`);
    
    const jestOptions = [
      '--json',
      options.coverage ? '--coverage' : '',
      options.watch ? '--watch' : '',
      options.testNamePattern ? `--testNamePattern="${options.testNamePattern}"` : '',
    ].filter(Boolean).join(' ');
    
    try {
      const { stdout, stderr } = await execPromise(`npx jest ${testPath} ${jestOptions}`, {
        cwd: this.projectRoot,
        env: { ...process.env, NODE_ENV: 'test' },
      });
      
      if (stderr && !stderr.includes('passed')) {
        logger.warn(`Jest warnings: ${stderr}`);
      }
      
      try {
        const jestResults = JSON.parse(stdout);
        return this.parseJestResults(jestResults);
      } catch (error) {
        logger.error('Error parsing Jest results', { error, stdout });
        throw new Error(`Failed to parse Jest results: ${(error as Error).message}`);
      }
    } catch (error) {
      logger.error(`Error running tests at ${testPath}`, { error });
      
      // If Jest failed to run but returned structured output, try to parse it
      if ((error as any).stdout) {
        try {
          const jestResults = JSON.parse((error as any).stdout);
          return this.parseJestResults(jestResults);
        } catch (parseError) {
          // If parsing fails, just return the error message
          logger.error('Error parsing Jest failure results', { parseError });
        }
      }
      
      // Return a failed test result
      return [{
        testId: 'test-execution-error',
        passed: false,
        error: (error as Error).message,
        duration: 0,
      }];
    }
  }
  
  async analyzeResults(results: TestResult[]): Promise<any> {
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
    
    return {
      summary: {
        total: results.length,
        passed: passed.length,
        failed: failed.length,
        passRate: results.length ? (passed.length / results.length) * 100 : 0,
        totalDuration,
      },
      failedTests: failed.map(f => ({
        testId: f.testId,
        error: f.error,
      })),
    };
  }
  
  private parseJestResults(jestResults: any): TestResult[] {
    const results: TestResult[] = [];
    
    for (const testResult of jestResults.testResults) {
      for (const assertionResult of testResult.assertionResults) {
        results.push({
          testId: assertionResult.fullName || assertionResult.title,
          passed: assertionResult.status === 'passed',
          error: assertionResult.failureMessages?.join('\n') || undefined,
          duration: assertionResult.duration || 0,
        });
      }
    }
    
    return results;
  }
  
  async generateReport(
    results: TestResult[], 
    analysis: any, 
    formats: ReportFormat[], 
    outputPath: string
  ): Promise<string[]> {
    const reportPaths: string[] = [];
    
    for (const format of formats) {
      const reportPath = await this.reporter.generateReport(results, analysis, {
        format,
        outputPath,
        includeTimestamp: true,
      });
      
      reportPaths.push(reportPath);
    }
    
    return reportPaths;
  }
}

export class PlaywrightTestRunner implements TestRunner {
  private projectRoot: string;
  private reporter: TestReporter;
  
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.reporter = new TestReporter();
  }
  
  async runTests(testPath: string, options: Record<string, any> = {}): Promise<TestResult[]> {
    logger.info(`Running Playwright tests at ${testPath}`);
    
    const pwOptions = [
      '--reporter=json',
      options.headed ? '--headed' : '',
      options.workers ? `--workers=${options.workers}` : '',
      options.browser ? `--browser=${options.browser}` : '',
    ].filter(Boolean).join(' ');
    
    try {
      const { stdout, stderr } = await execPromise(`npx playwright test ${testPath} ${pwOptions}`, {
        cwd: this.projectRoot,
        env: { ...process.env, NODE_ENV: 'test' },
      });
      
      if (stderr) {
        logger.warn(`Playwright warnings: ${stderr}`);
      }
      
      try {
        const pwResults = JSON.parse(stdout);
        return this.parsePlaywrightResults(pwResults);
      } catch (error) {
        logger.error('Error parsing Playwright results', { error, stdout });
        throw new Error(`Failed to parse Playwright results: ${(error as Error).message}`);
      }
    } catch (error) {
      logger.error(`Error running Playwright tests at ${testPath}`, { error });
      
      // Return a failed test result
      return [{
        testId: 'test-execution-error',
        passed: false,
        error: (error as Error).message,
        duration: 0,
      }];
    }
  }
  
  async analyzeResults(results: TestResult[]): Promise<any> {
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
    
    return {
      summary: {
        total: results.length,
        passed: passed.length,
        failed: failed.length,
        passRate: results.length ? (passed.length / results.length) * 100 : 0,
        totalDuration,
      },
      failedTests: failed.map(f => ({
        testId: f.testId,
        error: f.error,
      })),
    };
  }
  
  private parsePlaywrightResults(pwResults: any): TestResult[] {
    const results: TestResult[] = [];
    
    for (const suite of pwResults.suites || []) {
      this.extractPlaywrightTestResults(suite, results);
    }
    
    return results;
  }
  
  private extractPlaywrightTestResults(suite: any, results: TestResult[]): void {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        results.push({
          testId: `${suite.title} › ${spec.title}`,
          passed: test.status === 'passed' || test.status === 'expected',
          error: test.errors?.map((e: any) => e.message || JSON.stringify(e)).join('\n') || undefined,
          duration: test.duration || 0,
        });
      }
    }
    
    for (const childSuite of suite.suites || []) {
      this.extractPlaywrightTestResults(childSuite, results);
    }
  }
  
  async generateReport(
    results: TestResult[], 
    analysis: any, 
    formats: ReportFormat[], 
    outputPath: string
  ): Promise<string[]> {
    const reportPaths: string[] = [];
    
    for (const format of formats) {
      const reportPath = await this.reporter.generateReport(results, analysis, {
        format,
        outputPath,
        includeTimestamp: true,
      });
      
      reportPaths.push(reportPath);
    }
    
    return reportPaths;
  }
}