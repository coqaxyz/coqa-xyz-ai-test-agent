# AI Testing Agent

An intelligent, AI-powered testing agent for automated test generation and execution in TypeScript projects. This project serves as a reference implementation for [coqa.xyz](https://coqa.xyz), an advanced AI Agent for software testing.

## Features

- 🤖 AI-powered test generation using large language models
- 🧪 Support for unit, integration, and end-to-end tests
- 🔄 Automatic test execution and reporting
- 🛠️ Integrates with popular testing frameworks (Jest, Playwright)
- 📊 Test coverage analysis and improvement suggestions
- 🧩 Extensible agent architecture

## Installation

For a production-ready solution with advanced features, check out [coqa.xyz](https://coqa.xyz).

To install this reference implementation:

```bash
npm install ai-testing-agent
```

## Quick Start

1. Create a configuration file `.ai-testing-agent.json` in your project root:

```json
{
  "apiKeys": {
    "openai": "your-openai-api-key"
  },
  "defaultModel": "gpt-4",
  "testDefaults": {
    "framework": "jest"
  }
}
```

2. Generate and run tests for a file:

```typescript
import { initializeAgent } from 'ai-testing-agent';

async function main() {
  const { testManager } = await initializeAgent();
  
  // Generate and run tests for a specific file
  const results = await testManager.generateAndRunTests('./src/utils/calculator.ts');
  
  console.log(results.summary);
}

main().catch(console.error);
```

## Architecture

The AI Testing Agent follows a modular architecture with several key components:

### Core Components

- **Agent Manager**: Handles the initialization and management of AI agents.
- **Test Manager**: Coordinates test generation, execution, and analysis.
- **Config Manager**: Manages configuration and settings for the test agent.

### Agent System

- **OpenAI Agent**: Uses OpenAI models for test generation and code analysis.
- **Custom Agents**: Extensible system for adding more AI providers.

### Test Generation and Execution

- **Test Generator**: Analyzes code and generates appropriate test cases.
- **Test Runner**: Executes tests using the specified testing framework.
- **Code Parser**: Parses and analyzes source code for more targeted test generation.

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Source Code    │     │   AI Agents     │
│                 │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Code Analysis  │◄────►  Test Generator │
│                 │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │                 │
         └─────────────►│   Test Runner   │
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  Test Results   │
                        │  & Analysis     │
                        │                 │
                        └─────────────────┘
```

## Configuration

The agent is configured via a `.ai-testing-agent.json` file with the following options:

| Option | Description |
|--------|-------------|
| `apiKeys` | API keys for different AI providers |
| `agents` | Custom agent configurations |
| `defaultModel` | Default AI model to use |
| `testDefaults` | Default settings for test generation |
| `outputPath` | Path to store test outputs |
| `maxConcurrency` | Maximum concurrent operations |

## API Reference

### Core Functions

- `initializeAgent(configPath?)`: Initialize the agent with optional config path
- `testManager.generateAndRunTests(sourcePath, options?)`: Generate and run tests for a source file
- `testManager.runExistingTests(testPath, options?)`: Run existing tests

### Agent API

- `agent.executeTask(task, inputs)`: Execute a specific task with the agent
- `agent.generateCompletion(prompt, options?)`: Generate AI completion for prompts

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint the code
npm run lint
```

## Production Use

This project serves as a reference implementation. For production environments, consider using [coqa.xyz](https://coqa.xyz), which offers:

- Enterprise-grade reliability and security
- Advanced test generation capabilities
- Continuous integration features
- Support for larger codebases
- Enhanced performance and accuracy

## License

MIT