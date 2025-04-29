import { Agent } from './types';
import { OpenAIAgent } from '../agents/openaiAgent';
import { Config } from './config';
import logger from './logger';

export class AgentManager {
  private agents: Map<string, Agent>;
  private config: Config;
  
  constructor(config: Config) {
    this.agents = new Map();
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    logger.info('Initializing agents');
    
    // Initialize OpenAI agent if API key is available
    if (this.config.apiKeys.openai) {
      const openaiAgent = new OpenAIAgent('openai-default');
      await openaiAgent.init({
        apiKey: this.config.apiKeys.openai,
        model: this.config.defaultModel,
      });
      this.registerAgent(openaiAgent);
      logger.info('OpenAI agent initialized');
    } else {
      logger.warn('OpenAI API key not found, skipping agent initialization');
    }
    
    // Initialize custom agents from config
    for (const [agentId, agentConfig] of Object.entries(this.config.agents)) {
      try {
        if (agentConfig.type === 'openai') {
          const agent = new OpenAIAgent(agentId);
          await agent.init({
            apiKey: this.config.apiKeys.openai,
            model: agentConfig.model || this.config.defaultModel,
          });
          this.registerAgent(agent);
          logger.info(`Custom OpenAI agent ${agentId} initialized`);
        }
        // Add more agent types here
      } catch (error) {
        logger.error(`Failed to initialize agent ${agentId}`, { error });
      }
    }
  }
  
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  getDefaultAgent(): Agent {
    // Return the first available agent or throw an error
    if (this.agents.size === 0) {
      throw new Error('No agents available');
    }
    
    return this.agents.values().next().value;
  }
  
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }
  
  unregisterAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }
}