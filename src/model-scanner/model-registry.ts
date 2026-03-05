import * as fs from 'fs';
import * as path from 'path';
import { ModelInfo } from './model-detector';

export class ModelRegistry {
  private models: ModelInfo[] = [];
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.env.HOME || '', '.hubv1', 'models.db');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Initialize database with empty models table
      this.createModelsTable();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private createModelsTable(): void {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          format TEXT NOT NULL,
          size INTEGER NOT NULL,
          qualityScore INTEGER NOT NULL,
          parameters TEXT,
          quantization TEXT,
          capabilities TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
      });

      db.close();
    } catch (error) {
      console.error('Failed to create models table:', error);
    }
  }

  async saveModels(models: ModelInfo[]): Promise<void> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      db.serialize(() => {
        // Clear existing models
        db.run('DELETE FROM models');

        // Insert new models
        const stmt = db.prepare(`INSERT INTO models (path, name, format, size, qualityScore, parameters, quantization, capabilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

        for (const model of models) {
          stmt.run(
            model.path,
            model.name,
            model.format,
            model.size,
            model.qualityScore,
            model.parameters,
            model.quantization,
            JSON.stringify(model.capabilities)
          );
        }

        stmt.finalize();
      });

      db.close();
      this.models = models;
      console.log(`Saved ${models.length} models to registry`);
    } catch (error) {
      console.error('Failed to save models:', error);
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM models ORDER BY qualityScore DESC', (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const models = rows.map(row => ({
              ...row,
              capabilities: JSON.parse(row.capabilities)
            }));
            resolve(models);
          }
        });

        db.close();
      });
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  async getModelByPath(modelPath: string): Promise<ModelInfo | null> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM models WHERE path = ?', [modelPath], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? {
              ...row,
              capabilities: JSON.parse(row.capabilities)
            } : null);
          }
        });

        db.close();
      });
    } catch (error) {
      console.error('Failed to get model by path:', error);
      return null;
    }
  }

  async updateModel(model: ModelInfo): Promise<void> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      db.serialize(() => {
        const stmt = db.prepare(`UPDATE models SET name = ?, format = ?, size = ?, qualityScore = ?, parameters = ?, quantization = ?, capabilities = ? WHERE path = ?`);
        
        stmt.run(
          model.name,
          model.format,
          model.size,
          model.qualityScore,
          model.parameters,
          model.quantization,
          JSON.stringify(model.capabilities),
          model.path
        );
        
        stmt.finalize();
      });

      db.close();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  }

  async deleteModel(modelPath: string): Promise<void> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      db.serialize(() => {
        db.run('DELETE FROM models WHERE path = ?', [modelPath]);
      });

      db.close();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  }

  async clearRegistry(): Promise<void> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      db.serialize(() => {
        db.run('DELETE FROM models');
      });

      db.close();
      this.models = [];
    } catch (error) {
      console.error('Failed to clear registry:', error);
    }
  }

  async getModelsByFormat(format: string): Promise<ModelInfo[]> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM models WHERE format = ? ORDER BY qualityScore DESC', [format], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const models = rows.map(row => ({
              ...row,
              capabilities: JSON.parse(row.capabilities)
            }));
            resolve(models);
          }
        });

        db.close();
      });
    } catch (error) {
      console.error('Failed to get models by format:', error);
      return [];
    }
  }

  async getModelsByCapability(capability: string): Promise<ModelInfo[]> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM models WHERE capabilities LIKE ? ORDER BY qualityScore DESC`, [`%${capability}%`], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const models = rows.map(row => ({
              ...row,
              capabilities: JSON.parse(row.capabilities)
            }));
            resolve(models);
          }
        });

        db.close();
      });
    } catch (error) {
      console.error('Failed to get models by capability:', error);
      return [];
    }
  }
}