import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import logger from './logger';

const ConfigSchema = z.object({
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    google: z.string().optional(),
  }),
  agents: z.record(z.string(), z.any()),
  defaultModel: z.string().default('gpt-4'),
  testDefaults: z.object({
    framework: z.string().default('jest'),
    coverage: z.number().default(80),
    maxRetries: z.number().default(3),
    timeout: z.number().default(5000),
    reporting: z.object({
      formats: z.array(z.string()).default([]),
      includeTimestamp: z.boolean().default(true),
    }).optional(),
  }),
  outputPath: z.string().default('./output'),
  maxConcurrency: z.number().default(5),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(configPath: string = '.ai-testing-agent.json'): Config {
  try {
    const configFile = path.resolve(process.cwd(), configPath);
    
    if (!fs.existsSync(configFile)) {
      logger.warn(`Config file not found at ${configFile}, using defaults`);
      return {
        apiKeys: {},
        agents: {},
        defaultModel: 'gpt-4',
        testDefaults: {
          framework: 'jest',
          coverage: 80,
          maxRetries: 3,
          timeout: 5000,
          reporting: {
            formats: [],
            includeTimestamp: true,
          },
        },
        outputPath: './output',
        maxConcurrency: 5,
      };
    }

    const rawConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    logger.error('Error loading config', { error });
    throw new Error(`Failed to load config: ${(error as Error).message}`);
  }
}