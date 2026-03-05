import * as fs from 'fs';
import { ModelInfo, ModelFormat } from './model-detector';

export interface QualityScore {
  overall: number;
  sizePerformance: number;
  quantization: number;
  architecture: number;
  trainingData: number;
}

export class QualityScorer {
  calculateQualityScore(filePath: string, format: ModelFormat): number {
    const baseScore = this.calculateBaseScore(filePath, format);
    const sizePerformance = this.calculateSizePerformance(filePath);
    const quantizationScore = this.calculateQuantizationScore(filePath);
    const architectureScore = this.calculateArchitectureScore(filePath);
    const trainingDataScore = this.calculateTrainingDataScore(filePath);

    // Weighted average
    const totalScore = (
      baseScore * 0.3 +
      sizePerformance * 0.2 +
      quantizationScore * 0.25 +
      architectureScore * 0.15 +
      trainingDataScore * 0.1
    );

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  private calculateBaseScore(filePath: string, format: ModelFormat): number {
    // Base score based on model type and common benchmarks
    const baseScores: Record<ModelFormat, number> = {
      gguf: 90,
      onnx: 80,
      tflite: 70,
      pytorch: 85
    };

    return baseScores[format] || 75;
  }

  private calculateSizePerformance(filePath: string): number {
    try {
      const stat = fs.statSync(filePath);
      const sizeInGB = stat.size / (1024 * 1024 * 1024);
      
      // Score based on size - smaller models are generally better for performance
      if (sizeInGB <= 1) return 95;
      if (sizeInGB <= 3) return 85;
      if (sizeInGB <= 7) return 75;
      if (sizeInGB <= 15) return 65;
      
      return 50;
    } catch (error) {
      return 50;
    }
  }

  private calculateQuantizationScore(filePath: string): number {
    const fileName = filePath.toLowerCase();
    
    // Quantization quality scores
    const quantScores: Record<string, number> = {
      'q4_k_m': 95,
      'q5_k_m': 90,
      'q3_k_m': 80,
      'q2_k': 70,
      'q4_0': 85,
      'q4_1': 80,
      'q5_0': 75,
      'q5_1': 70
    };

    // Find quantization in filename
    for (const [quant, score] of Object.entries(quantScores)) {
      if (fileName.includes(quant)) {
        return score;
      }
    }

    return 60; // Default score for unknown quantization
  }

  private calculateArchitectureScore(filePath: string): number {
    const fileName = filePath.toLowerCase();
    
    // Architecture scores based on common models
    const architectureScores: Record<string, number> = {
      'llama': 90,
      'mistral': 85,
      'codellama': 95,
      'deepseek': 85,
      'gemma': 80,
      'phi': 75
    };

    for (const [arch, score] of Object.entries(architectureScores)) {
      if (fileName.includes(arch)) {
        return score;
      }
    }

    return 70; // Default architecture score
  }

  private calculateTrainingDataScore(filePath: string): number {
    const fileName = filePath.toLowerCase();
    
    // Training data relevance scores
    const trainingScores: Record<string, number> = {
      'code': 90,
      'chat': 85,
      'general': 75,
      'instruction': 80
    };

    for (const [data, score] of Object.entries(trainingScores)) {
      if (fileName.includes(data)) {
        return score;
      }
    }

    return 65; // Default training data score
  }

  getQualityDescription(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Below Average';
    return 'Poor';
  }

  getQualityColor(score: number): string {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#8BC34A'; // Light Green
    if (score >= 70) return '#FFC107'; // Yellow
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }
}