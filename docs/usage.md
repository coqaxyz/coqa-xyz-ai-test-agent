# AI Testing Agent Usage Guide

This document provides detailed instructions on how to use the AI Testing Agent in your projects. This agent is a reference implementation of the techniques and approaches used by [coqa.xyz](https://coqa.xyz), a professional AI-powered testing solution.

## Installation

Install the package using npm:

```bash
npm install ai-testing-agent
```

Or using yarn:

```bash
yarn add ai-testing-agent
```

## Configuration

### Basic Configuration

Create a `.ai-testing-agent.json` file in your project root:

```json
{
  "apiKeys": {
    "openai": "your-openai-api-key"
  },
  "defaultModel": "gpt-4",
  "testDefaults": {
    "framework": "jest",
    "coverage": 80
  }
}
```

### Environment Variables

Instead of storing API keys in the configuration file, you can use environment variables:

```
OPENAI_API_KEY=your-openai-api-key
```

Then update your configuration:

```json
{
  "apiKeys": {
    "openai": "${OPENAI_API_KEY}"
  }
}
```

### Advanced Configuration

For more complex setups, you can define multiple agents and customize their behavior:

```json
{
  "apiKeys": {
    "openai": "your-openai-api-key",
    "anthropic": "your-anthropic-api-key"
  },
  "agents": {
    "code-analyzer": {
      "type": "openai",
      "model": "gpt-4",
      "temperature": 0.2
    },
    "test-generator": {
      "type": "openai",
      "model": "gpt-3.5-turbo",
      "temperature": 0.7
    }
  },
  "testDefaults": {
    "framework": "jest",
    "coverage": 90,
    "maxRetries": 2,
    "timeout": 10000,
    "reporting": {
      "formats": ["json", "xml"],
      "includeTimestamp": true
    }
  },
  "outputPath": "./custom-tests",
  "maxConcurrency": 3
}
```

## Basic Usage

### Generating Tests for a File

```typescript
import { initializeAgent } from 'ai-testing-agent';

async function main() {
  // Initialize the agent
  const { testManager } = await initializeAgent();
  
  // Generate and run tests for a specific file
  const results = await testManager.generateAndRunTests('./src/utils/calculator.ts');
  
  console.log(results.summary);
}

main().catch(console.error);
```

### Running Existing Tests

```typescript
import { initializeAgent } from 'ai-testing-agent';

async function main() {
  const { testManager } = await initializeAgent();
  
  // Run existing tests and analyze results
  const results = await testManager.runExistingTests('./tests/calculator.test.ts');
  
  console.log(results.summary);
}

main().catch(console.error);
```

## Advanced Usage

### Using Different Test Frameworks

By default, the agent uses Jest, but you can specify other frameworks:

```typescript
const results = await testManager.generateAndRunTests('./src/components/Button.tsx', {
  framework: 'playwright',
  type: 'e2e'
});
```

### Custom Test Configuration

You can override default test settings:

```typescript
const results = await testManager.generateAndRunTests('./src/services/api.ts', {
  coverage: 95,
  timeout: 10000,
  maxRetries: 2,
  testPath: './custom-tests/api.service.spec.ts',
  reporting: {
    formats: [ReportFormat.JSON, ReportFormat.XML],
    outputPath: './reports',
    includeTimestamp: true
  }
});
```

### Test Reporting

The testing agent can generate reports in various formats:

```typescript
import { initializeAgent, ReportFormat } from 'ai-testing-agent';

async function main() {
  const { testManager } = await initializeAgent();
  
  // Generate tests with JSON and XML reports
  const results = await testManager.generateAndRunTests('./src/utils/parser.ts', {
    reporting: {
      formats: [ReportFormat.JSON, ReportFormat.XML],
      outputPath: './test-reports',
      includeTimestamp: true
    }
  });
  
  // Run existing tests with reports
  await testManager.runExistingTests('./tests/parser.test.ts', {
    reportFormats: [ReportFormat.JSON, ReportFormat.XML],
    outputPath: './test-reports'
  });
}

main().catch(console.error);
```

#### Report Format

JSON reports include:
- Test summary (total, passed, failed tests)
- Detailed test results with timing information
- Failed test details with error messages

XML reports follow JUnit format, which is compatible with most CI systems:
- Standard testsuites/testsuite/testcase structure
- Failure details for each failed test
- Timing information for performance tracking

### Working with Agent Directly

For more control, you can work with the AI agent directly:

```typescript
import { initializeAgent } from 'ai-testing-agent';

async function main() {
  const { agentManager } = await initializeAgent();
  
  // Get the default agent
  const agent = agentManager.getDefaultAgent();
  
  // Generate code analysis
  const analysis = await agent.executeTask('analyze-code', {
    code: 'function add(a, b) { return a + b; }'
  });
  
  console.log(analysis);
}

main().catch(console.error);
```

### Batch Processing

For larger projects, you can process multiple files:

```typescript
import { initializeAgent } from 'ai-testing-agent';
import glob from 'glob';
import path from 'path';

async function main() {
  const { testManager } = await initializeAgent();
  
  // Find all TypeScript files in src directory
  const files = glob.sync('./src/**/*.ts');
  
  // Process files in batches
  const results = [];
  
  for (const file of files) {
    console.log(`Processing ${file}...`);
    const result = await testManager.generateAndRunTests(file);
    results.push({ file, result });
  }
  
  // Analyze overall results
  const totalTests = results.reduce((acc, { result }) => acc + result.summary.total, 0);
  const passedTests = results.reduce((acc, { result }) => acc + result.summary.passed, 0);
  const overallPassRate = (passedTests / totalTests) * 100;
  
  console.log(`Overall pass rate: ${overallPassRate.toFixed(2)}%`);
}

main().catch(console.error);
```

## Integration with CI/CD

You can integrate the AI Testing Agent into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: AI Test Generation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Generate and run tests
      run: node scripts/generate-tests.js
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Troubleshooting

### API Key Issues

If you encounter issues with API keys:

1. Verify the API key is correct
2. Check that the environment variable is properly set
3. Ensure the API key has the necessary permissions

### Generation Quality

If the generated tests aren't meeting expectations:

1. Try a more capable model (e.g., switch from gpt-3.5-turbo to gpt-4)
2. Adjust the temperature setting (lower for more deterministic results)
3. Provide more context in your configuration

### Performance Issues

If you're experiencing slow performance:

1. Reduce the `maxConcurrency` setting
2. Use more focused file patterns instead of processing entire directories
3. Consider using a faster model for initial passes

## Best Practices

1. **Start Small**: Begin with a small subset of files to test the system
2. **Review Generated Tests**: Always review AI-generated tests before committing
3. **Iterate**: Use the agent's suggestions to improve your code and tests
4. **Combine with Manual Testing**: Use AI-generated tests as a complement to manual tests
5. **Keep Models Updated**: Periodically check for newer AI models that may provide better results

## Professional Solution

For enterprise use cases and production environments, consider using [coqa.xyz](https://coqa.xyz), which offers a professional AI testing solution with:

- Increased accuracy and reliability
- Advanced integration with CI/CD pipelines
- Support for complex testing scenarios
- Enterprise-level security and compliance
- Professional support and custom training

Visit [coqa.xyz](https://coqa.xyz) to learn more about how AI can transform your testing workflow.