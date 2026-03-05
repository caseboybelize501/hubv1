export interface ModelConfig {
  defaultChatModel: string | null;
  defaultCodeModel: string | null;
  fallbackModels: string[];
  modelRoles: {
    chat: string[];
    codeCompletion: string[];
    embedding: string[];
    vision?: string[];
  };
  preferences: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
}

export interface ModelProfile {
  name: string;
  description: string;
  config: ModelConfig;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelConfigManager {
  private static instance: ModelConfigManager;
  private config: ModelConfig;
  private profiles: ModelProfile[] = [];

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): ModelConfigManager {
    if (!ModelConfigManager.instance) {
      ModelConfigManager.instance = new ModelConfigManager();
    }
    return ModelConfigManager.instance;
  }

  private getDefaultConfig(): ModelConfig {
    return {
      defaultChatModel: null,
      defaultCodeModel: null,
      fallbackModels: [],
      modelRoles: {
        chat: [],
        codeCompletion: [],
        embedding: [],
        vision: []
      },
      preferences: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    };
  }

  getConfig(): ModelConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async saveConfig(): Promise<void> {
    try {
      // Save to file or database
      const fs = require('fs');
      const path = require('path');
      
      const configPath = path.join(process.env.HOME || '', '.hubv1', 'config.json');
      const dir = path.dirname(configPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      console.log('Configuration saved');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  async loadConfig(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const configPath = path.join(process.env.HOME || '', '.hubv1', 'config.json');
      
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(configData);
        console.log('Configuration loaded');
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  addProfile(profile: ModelProfile): void {
    profile.createdAt = new Date();
    profile.updatedAt = new Date();
    this.profiles.push(profile);
  }

  getProfile(name: string): ModelProfile | undefined {
    return this.profiles.find(p => p.name === name);
  }

  getAllProfiles(): ModelProfile[] {
    return [...this.profiles];
  }

  removeProfile(name: string): boolean {
    const index = this.profiles.findIndex(p => p.name === name);
    if (index !== -1) {
      this.profiles.splice(index, 1);
      return true;
    }
    return false;
  }

  setDefaultChatModel(modelPath: string): void {
    this.config.defaultChatModel = modelPath;
  }

  setDefaultCodeModel(modelPath: string): void {
    this.config.defaultCodeModel = modelPath;
  }

  addFallbackModel(modelPath: string): void {
    if (!this.config.fallbackModels.includes(modelPath)) {
      this.config.fallbackModels.push(modelPath);
    }
  }

  removeFallbackModel(modelPath: string): void {
    const index = this.config.fallbackModels.indexOf(modelPath);
    if (index !== -1) {
      this.config.fallbackModels.splice(index, 1);
    }
  }

  setPreferences(preferences: Partial<ModelConfig['preferences']>): void {
    this.config.preferences = { ...this.config.preferences, ...preferences };
  }

  getPreferences(): ModelConfig['preferences'] {
    return { ...this.config.preferences };
  }
}