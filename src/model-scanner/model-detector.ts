export type ModelFormat = 'gguf' | 'onnx' | 'tflite' | 'pytorch';

export interface ModelInfo {
  path: string;
  name: string;
  format: ModelFormat;
  size: number;
  qualityScore: number;
  parameters: string;
  quantization: string;
  capabilities: string[];
}

export interface ModelDetectionResult {
  isValid: boolean;
  format: ModelFormat | null;
  metadata?: ModelMetadata;
  error?: string;
}

export interface ModelMetadata {
  architecture?: string;
  parameters?: string;
  trainingData?: string;
  quantization?: string;
  size?: number;
}

export class ModelDetector {
  private static readonly MODEL_PATTERNS: Record<ModelFormat, RegExp[]> = {
    gguf: [/\.gguf$/i, /\.ggml$/i],
    onnx: [/\.onnx$/i],
    tflite: [/\.tflite$/i],
    pytorch: [/model\.bin$/i, /pytorch_model\.bin$/i]
  };

  detectModelFormat(filePath: string): ModelFormat | null {
    const lowerPath = filePath.toLowerCase();
    
    for (const [format, patterns] of Object.entries(this.MODEL_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(lowerPath))) {
        return format as ModelFormat;
      }
    }
    
    return null;
  }

  async validateModel(filePath: string): Promise<ModelDetectionResult> {
    try {
      const format = this.detectModelFormat(filePath);
      
      if (!format) {
        return {
          isValid: false,
          format: null,
          error: 'Unknown model format'
        };
      }

      // Check file integrity
      if (!this.isFileValid(filePath)) {
        return {
          isValid: false,
          format,
          error: 'Invalid file or corrupted model'
        };
      }

      // Extract metadata based on format
      const metadata = await this.extractMetadata(filePath, format);
      
      return {
        isValid: true,
        format,
        metadata
      };
    } catch (error) {
      return {
        isValid: false,
        format: null,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  private isFileValid(filePath: string): boolean {
    try {
      const fs = require('fs');
      const stat = fs.statSync(filePath);
      return stat.isFile() && stat.size > 0;
    } catch (error) {
      return false;
    }
  }

  private async extractMetadata(filePath: string, format: ModelFormat): Promise<ModelMetadata> {
    const metadata: ModelMetadata = {};
    
    try {
      switch (format) {
        case 'gguf':
          metadata.architecture = await this.extractGgufArchitecture(filePath);
          break;
        case 'onnx':
          metadata.architecture = await this.extractOnnxArchitecture(filePath);
          break;
        case 'tflite':
          metadata.architecture = await this.extractTfliteArchitecture(filePath);
          break;
        case 'pytorch':
          metadata.architecture = 'PyTorch';
          break;
      }

      // Extract parameters from filename
      const fileName = require('path').basename(filePath);
      const paramMatch = fileName.match(/(\d+)([bB])/);
      if (paramMatch) {
        metadata.parameters = `${paramMatch[1]}${paramMatch[2]}`;
      }

      // Extract quantization
      const quantMatch = fileName.match(/Q[0-9_]+/);
      if (quantMatch) {
        metadata.quantization = quantMatch[0];
      }
    } catch (error) {
      console.error('Failed to extract metadata:', error);
    }

    return metadata;
  }

  private async extractGgufArchitecture(filePath: string): Promise<string> {
    // Implementation for GGUF architecture detection
    return 'LLaMA';
  }

  private async extractOnnxArchitecture(filePath: string): Promise<string> {
    // Implementation for ONNX architecture detection
    return 'ONNX';
  }

  private async extractTfliteArchitecture(filePath: string): Promise<string> {
    // Implementation for TensorFlow Lite architecture detection
    return 'TensorFlow Lite';
  }
}