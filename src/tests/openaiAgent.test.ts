import { OpenAIAgent } from '../agents/openaiAgent';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Mocked response',
                  },
                },
              ],
            }),
          },
        },
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              {
                embedding: [0.1, 0.2, 0.3],
              },
            ],
          }),
        },
      };
    }),
  };
});

describe('OpenAIAgent', () => {
  let agent: OpenAIAgent;

  beforeEach(() => {
    agent = new OpenAIAgent('test-agent');
  });

  test('should initialize with API key', async () => {
    await agent.init({ apiKey: 'test-key' });
    expect(agent.id).toBe('test-agent');
  });

  test('should throw error when no API key provided', async () => {
    await expect(agent.init({})).rejects.toThrow('OpenAI API key is required');
  });

  test('should generate completion', async () => {
    await agent.init({ apiKey: 'test-key' });
    const result = await agent.generateCompletion('Test prompt');
    expect(result).toBe('Mocked response');
  });

  test('should generate embedding', async () => {
    await agent.init({ apiKey: 'test-key' });
    const result = await agent.generateEmbedding('Test text');
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  test('should execute generate-test task', async () => {
    await agent.init({ apiKey: 'test-key' });
    const result = await agent.executeTask('generate-test', { 
      code: 'function add(a, b) { return a + b; }',
      testType: 'unit'
    });
    expect(result).toHaveProperty('testCode');
  });

  test('should throw error for unknown task', async () => {
    await agent.init({ apiKey: 'test-key' });
    await expect(agent.executeTask('invalid-task', {})).rejects.toThrow('Unknown task: invalid-task');
  });
});