import * as fs from 'fs';
import * as path from 'path';
import { ModelInfo, ModelFormat } from './model-detector';
import { QualityScorer } from './quality-scorer';

export interface ScanResult {
  models: ModelInfo[];
  scanTime: number;
}

export class ModelScanner {
  private qualityScorer = new QualityScorer();
  private modelPatterns = [
    '*.gguf',
    '*.ggml',
    '*.onnx',
    '*.tflite',
    'model.bin',
    'pytorch_model.bin'
  ];

  private scanPaths = [
    '/Users/*/models/',
    '/models/',
    '/AI/models/',
    '/ProgramData/llama.cpp/models/'
  ];

  async scanDrives(drives: string[]): Promise<ModelInfo[]> {
    const startTime = Date.now();
    let allModels: ModelInfo[] = [];

    for (const drive of drives) {
      try {
        console.log(`Scanning drive: ${drive}`);
        const models = await this.scanDrive(drive);
        allModels = [...allModels, ...models];
      } catch (error) {
        console.error(`Failed to scan drive ${drive}:`, error);
      }
    }

    const scanTime = Date.now() - startTime;
    console.log(`Scanning completed in ${scanTime}ms`);

    // Sort by quality score
    allModels.sort((a, b) => b.qualityScore - a.qualityScore);

    return allModels;
  }

  private async scanDrive(drivePath: string): Promise<ModelInfo[]> {
    let models: ModelInfo[] = [];

    // Scan common model directories
    for (const scanPath of this.scanPaths) {
      const fullPath = path.join(drivePath, scanPath);
      try {
        if (fs.existsSync(fullPath)) {
          const foundModels = await this.findModelsInDirectory(fullPath);
          models = [...models, ...foundModels];
        }
      } catch (error) {
        console.error(`Failed to scan directory ${fullPath}:`, error);
      }
    }

    // Scan root drive for models
    try {
      const rootModels = await this.findModelsInDirectory(drivePath);
      models = [...models, ...rootModels];
    } catch (error) {
      console.error(`Failed to scan root directory ${drivePath}:`, error);
    }

    return models;
  }

  private async findModelsInDirectory(dirPath: string): Promise<ModelInfo[]> {
    let models: ModelInfo[] = [];

    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        
        try {
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            // Recursively scan subdirectories
            const subModels = await this.findModelsInDirectory(itemPath);
            models = [...models, ...subModels];
          } else if (stat.isFile()) {
            // Check if file matches model patterns
            const format = this.detectModelFormat(itemPath);
            if (format) {
              const modelInfo = await this.createModelInfo(itemPath, format);
              if (modelInfo) {
                models.push(modelInfo);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to process item ${itemPath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${dirPath}:`, error);
    }

    return models;
  }

  detectModelFormat(filePath: string): ModelFormat | null {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.gguf':
      case '.ggml':
        return 'gguf';
      case '.onnx':
        return 'onnx';
      case '.tflite':
        return 'tflite';
      case '.bin':
        // Check if it's a PyTorch model
        const basename = path.basename(filePath);
        if (basename.includes('model') || basename.includes('pytorch')) {
          return 'pytorch';
        }
        break;
    }
    
    return null;
  }

  private async createModelInfo(filePath: string, format: ModelFormat): Promise<ModelInfo | null> {
    try {
      const stat = fs.statSync(filePath);
      
      // Get model metadata
      const name = path.basename(filePath);
      const size = stat.size;
      
      // Calculate quality score
      const qualityScore = this.qualityScorer.calculateQualityScore(filePath, format);
      
      // Determine capabilities based on model type
      const capabilities = this.determineCapabilities(format);
      
      return {
        path: filePath,
        name,
        format,
        size,
        qualityScore,
        parameters: this.extractParameters(filePath),
        quantization: this.extractQuantization(filePath),
        capabilities
      };
    } catch (error) {
      console.error(`Failed to create model info for ${filePath}:`, error);
      return null;
    }
  }

  private determineCapabilities(format: ModelFormat): string[] {
    switch (format) {
      case 'gguf':
        return ['chat', 'code', 'embedding'];
      case 'onnx':
        return ['chat', 'code'];
      case 'tflite':
        return ['chat'];
      case 'pytorch':
        return ['chat', 'code'];
      default:
        return ['chat'];
    }
  }

  private extractParameters(filePath: string): string {
    // Extract parameters from filename or metadata
    const name = path.basename(filePath);
    
    // Look for parameter patterns like 7B, 13B, etc.
    const paramMatch = name.match(/(\d+)([bB])/);
    if (paramMatch) {
      return `${paramMatch[1]}${paramMatch[2]}`;
    }
    
    return 'unknown';
  }

  private extractQuantization(filePath: string): string {
    // Extract quantization from filename
    const name = path.basename(filePath);
    
    const quantizations = ['Q4_K_M', 'Q5_K_M', 'Q2_K', 'Q3_K_M', 'Q4_0', 'Q4_1', 'Q5_0', 'Q5_1'];
    
    for (const quant of quantizations) {
      if (name.includes(quant)) {
        return quant;
      }
    }
    
    return 'unknown';
  }

  validateModelIntegrity(filePath: string): boolean {
    try {
      const stat = fs.statSync(filePath);
      return stat.isFile() && stat.size > 0;
    } catch (error) {
      return false;
    }
  }
}