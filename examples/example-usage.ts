import { initializeAgent, TestType, TestFramework } from '../src/index';
import path from 'path';

/**
 * Example calculator module to be tested
 */
const calculatorCode = `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}
`;

/**
 * Simple example showing how to use the AI Testing Agent
 */
async function exampleUsage() {
  try {
    // Create example file
    const fs = require('fs');
    const exampleDir = path.join(process.cwd(), 'examples', 'src');
    
    if (!fs.existsSync(exampleDir)) {
      fs.mkdirSync(exampleDir, { recursive: true });
    }
    
    const calculatorFilePath = path.join(exampleDir, 'calculator.ts');
    fs.writeFileSync(calculatorFilePath, calculatorCode);
    console.log(`Created example file at ${calculatorFilePath}`);

    // Initialize the agent
    console.log('Initializing AI Testing Agent...');
    const { testManager } = await initializeAgent();
    
    // Generate and run tests for the calculator file
    console.log('Generating tests for calculator.ts...');
    const results = await testManager.generateAndRunTests(calculatorFilePath, {
      type: TestType.UNIT,
      framework: TestFramework.JEST,
      coverage: 90,
    });
    
    // Display test results
    console.log('\n--- Test Results ---');
    console.log(`Total tests: ${results.summary.total}`);
    console.log(`Passed tests: ${results.summary.passed}`);
    console.log(`Failed tests: ${results.summary.failed}`);
    console.log(`Pass rate: ${results.summary.passRate.toFixed(2)}%`);
    console.log(`Total duration: ${results.summary.totalDuration}ms`);
    
    if (results.failedTests.length > 0) {
      console.log('\n--- Failed Tests ---');
      results.failedTests.forEach(test => {
        console.log(`- ${test.testId}`);
        console.log(`  Error: ${test.error}`);
      });
    }
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
if (require.main === module) {
  console.log('Starting AI Testing Agent example...');
  exampleUsage();
}