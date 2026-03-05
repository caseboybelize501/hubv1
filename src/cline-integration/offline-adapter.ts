import { InferenceEngine } from '../inference/engine';
import { ModelInfo } from '../model-scanner/model-detector';

// Mock Cline Core interface
interface ClineCoreInterface {
  generateCompletion(prompt: string): Promise<string>;
  loadModel(modelPath: string): Promise<void>;
  getActiveModel(): ModelInfo | null;
}

export class OfflineClineAdapter implements ClineCoreInterface {
  private inferenceEngine: InferenceEngine;
  private activeModel: ModelInfo | null = null;

  constructor(inferenceEngine: InferenceEngine) {
    this.inferenceEngine = inferenceEngine;
  }

  async generateCompletion(prompt: string): Promise<string> {
    try {
      if (!this.inferenceEngine.isModelLoaded()) {
        throw new Error('No model loaded for completion generation');
      }

      // Generate completion using local inference engine
      const result = await this.inferenceEngine.generate(prompt);
      return result.text;
    } catch (error) {
      console.error('Completion generation failed:', error);
      throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadModel(modelPath: string): Promise<void> {
    try {
      // Load model using inference engine
      const modelInfo = await this.getModelInfoFromPath(modelPath);
      await this.inferenceEngine.loadModel(modelInfo);
      this.activeModel = modelInfo;
      console.log(`Loaded model for Cline: ${modelInfo.name}`);
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getActiveModel(): Promise<ModelInfo | null> {
    return this.activeModel;
  }

  // Override Cline core methods for offline use
  async generateChatCompletion(messages: any[]): Promise<string> {
    try {
      if (!this.inferenceEngine.isModelLoaded()) {
        throw new Error('No model loaded for chat completion');
      }

      // Format messages for local inference
      const prompt = this.formatMessagesForInference(messages);
      
      const result = await this.inferenceEngine.generate(prompt);
      return result.text;
    } catch (error) {
      console.error('Chat completion failed:', error);
      throw new Error(`Failed to generate chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCodeCompletion(prompt: string, context?: string): Promise<string> {
    try {
      if (!this.inferenceEngine.isModelLoaded()) {
        throw new Error('No model loaded for code completion');
      }

      // Add context to prompt if provided
      let fullPrompt = prompt;
      if (context) {
        fullPrompt = `Context: ${context}\n\n${prompt}`;
      }

      const result = await this.inferenceEngine.generate(fullPrompt);
      return result.text;
    } catch (error) {
      console.error('Code completion failed:', error);
      throw new Error(`Failed to generate code completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatMessagesForInference(messages: any[]): string {
    let formatted = '';
    
    for (const message of messages) {
      const role = message.role || 'user';
      const content = message.content || '';
      
      formatted += `${role}: ${content}\n\n`;
    }
    
    return formatted.trim();
  }

  private async getModelInfoFromPath(modelPath: string): Promise<ModelInfo> {
    // This would typically fetch model info from registry
    // For now, we'll create a mock model info
    return {
      path: modelPath,
      name: 'default-model',
      format: 'gguf',
      size: 1000000,
      qualityScore: 85,
      parameters: '7B',
      quantization: 'Q4_K_M',
      capabilities: ['chat', 'code']
    };
  }

  // Configuration methods
  async setDefaultModel(modelPath: string): Promise<void> {
    await this.loadModel(modelPath);
  }

  async getConfiguration(): Promise<any> {
    return {
      model: this.activeModel,
      engine: 'local',
      offlineMode: true,
      capabilities: ['chat', 'code', 'completion']
    };
  }

  async testConnection(): Promise<boolean> {
    // In offline mode, connection is always available
    return true;
  }
}