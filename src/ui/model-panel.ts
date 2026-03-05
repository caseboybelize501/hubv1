import * as vscode from 'vscode';
import { ModelRegistry } from '../model-scanner/model-registry';
import { ModelInfo } from '../model-scanner/model-detector';

export class ModelPanel {
  private static instance: ModelPanel;
  private panel: vscode.WebviewPanel | undefined;
  private modelRegistry: ModelRegistry;
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    this.modelRegistry = new ModelRegistry();
  }

  static getInstance(): ModelPanel {
    if (!ModelPanel.instance) {
      ModelPanel.instance = new ModelPanel();
    }
    return ModelPanel.instance;
  }

  async show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'hubv1-model-panel',
      'HubV1 Model Manager',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true
      }
    );

    this.panel.webview.html = await this.getWebviewContent();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      message => this.handleMessage(message),
      undefined,
      this.disposables
    );

    // Clean up on dispose
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.disposables.forEach(d => d.dispose());
      },
      undefined,
      this.disposables
    );
  }

  private async getWebviewContent(): Promise<string> {
    const models = await this.modelRegistry.getModels();
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HubV1 Model Manager</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background-color: #f5f5f5; 
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 20px; 
      padding: 15px; 
      background: white; 
      border-radius: 8px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
    }
    .model-card { 
      background: white; 
      border-radius: 8px; 
      padding: 15px; 
      margin: 10px 0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .model-info { flex: 1; }
    .model-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
    .model-details { font-size: 12px; color: #666; }
    .quality-score { 
      background: #e0e0e0; 
      padding: 5px 10px; 
      border-radius: 15px; 
      font-size: 12px; 
      font-weight: bold; 
    }
    .btn { 
      background: #007acc; 
      color: white; 
      border: none; 
      padding: 8px 15px; 
      border-radius: 4px; 
      cursor: pointer; 
      margin-left: 10px; 
    }
    .btn:hover { background: #005a9e; }
    .scan-btn { 
      background: #28a745; 
      padding: 10px 20px; 
      font-size: 16px; 
    }
    .scan-btn:hover { background: #218838; }
    .status-bar { 
      margin-top: 20px; 
      padding: 10px; 
      background: #e9ecef; 
      border-radius: 4px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HubV1 Model Manager</h1>
      <button class="btn scan-btn" onclick="scanModels()">Scan Drives</button>
    </div>
    
    <div class="status-bar">
      <p>Found ${models.length} models</p>
    </div>
    
    <div id="models-container">
      ${this.renderModels(models)}
    </div>
  </div>

  <script>
    function scanModels() {
      // Send message to extension
      vscode.postMessage({ command: 'scanModels' });
    }
    
    function loadModel(modelPath) {
      vscode.postMessage({ command: 'loadModel', path: modelPath });
    }
    
    function testModel(modelPath) {
      vscode.postMessage({ command: 'testModel', path: modelPath });
    }
    
    function saveConfiguration() {
      vscode.postMessage({ command: 'saveConfig' });
    }
  </script>
</body>
</html>`;
  }

  private renderModels(models: ModelInfo[]): string {
    if (models.length === 0) {
      return '<p>No models found. Click "Scan Drives" to search for local models.</p>';
    }

    return models.map(model => `
      <div class="model-card">
        <div class="model-info">
          <div class="model-name">${model.name}</div>
          <div class="model-details">
            <span>Format: ${model.format}</span> | 
            <span>Size: ${(model.size / (1024 * 1024)).toFixed(1)} MB</span> | 
            <span>Parameters: ${model.parameters}</span> | 
            <span>Quantization: ${model.quantization}</span>
          </div>
          <div class="model-details">
            Capabilities: ${model.capabilities.join(', ')}
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span class="quality-score">${model.qualityScore}/100</span>
          <button class="btn" onclick="loadModel('${model.path}')">Load</button>
          <button class="btn" onclick="testModel('${model.path}')">Test</button>
        </div>
      </div>
    `).join('');
  }

  private async handleMessage(message: any) {
    switch (message.command) {
      case 'scanModels':
        await this.scanModels();
        break;
      case 'loadModel':
        await this.loadModel(message.path);
        break;
      case 'testModel':
        await this.testModel(message.path);
        break;
      case 'saveConfig':
        await this.saveConfiguration();
        break;
    }
  }

  private async scanModels() {
    // This would trigger the model scanner
    vscode.window.showInformationMessage('Scanning for models...');
    
    // Update panel with new content
    if (this.panel) {
      this.panel.webview.html = await this.getWebviewContent();
    }
  }

  private async loadModel(modelPath: string) {
    try {
      // In a real implementation, this would load the model
      vscode.window.showInformationMessage(`Loading model: ${modelPath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load model: ${error}`);
    }
  }

  private async testModel(modelPath: string) {
    try {
      // In a real implementation, this would test the model
      vscode.window.showInformationMessage(`Testing model: ${modelPath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to test model: ${error}`);
    }
  }

  private async saveConfiguration() {
    try {
      // In a real implementation, this would save the configuration
      vscode.window.showInformationMessage('Configuration saved');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save configuration: ${error}`);
    }
  }
}