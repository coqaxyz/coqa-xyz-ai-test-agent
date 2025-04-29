import { loadConfig } from './core/config';
import { AgentManager } from './core/agentManager';
import { TestManager } from './core/testManager';
import logger from './core/logger';

export async function initializeAgent(configPath?: string) {
  try {
    // Load configuration
    const config = loadConfig(configPath);
    
    // Initialize agent manager
    const agentManager = new AgentManager(config);
    await agentManager.initialize();
    
    // Initialize test manager
    const testManager = new TestManager(agentManager, config);
    
    return {
      agentManager,
      testManager,
      config,
    };
  } catch (error) {
    logger.error('Error initializing agent', { error });
    throw new Error(`Failed to initialize agent: ${(error as Error).message}`);
  }
}

export * from './core/types';
export * from './agents/openaiAgent';
export * from './utils/testGenerator';
export * from './utils/testRunner';
export * from './utils/testReporter';
export * from './utils/codeParser';