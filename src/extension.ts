import * as vscode from 'vscode';
import { ModelScanner } from './model-scanner/scanner';
import { ModelRegistry } from './model-scanner/model-registry';
import { InferenceEngine } from './inference/engine';
import { OfflineClineAdapter } from './cline-integration/offline-adapter';

export async function activate(context: vscode.ExtensionContext) {
  console.log('HubV1 extension activated');

  // Initialize core components
  const modelScanner = new ModelScanner();
  const modelRegistry = new ModelRegistry();
  const inferenceEngine = new InferenceEngine();
  const clineAdapter = new OfflineClineAdapter(inferenceEngine);

  // Register commands
  const scanModelsCommand = vscode.commands.registerCommand('hubv1.scanModels', async () => {
    try {
      const drives = ['C:', 'D:'];
      const models = await modelScanner.scanDrives(drives);
      
      // Store found models
      await modelRegistry.saveModels(models);
      
      vscode.window.showInformationMessage(`Found ${models.length} models`);
      
      // Update UI
      updateModelPanel(models);
    } catch (error) {
      vscode.window.showErrorMessage(`Model scanning failed: ${error}`);
    }
  });

  const openModelPanelCommand = vscode.commands.registerCommand('hubv1.openModelPanel', () => {
    // Open model panel UI
    createModelPanel();
  });

  context.subscriptions.push(scanModelsCommand, openModelPanelCommand);

  // Initialize on startup
  await initializeExtension(modelScanner, modelRegistry, inferenceEngine);
}

async function initializeExtension(
  scanner: ModelScanner,
  registry: ModelRegistry,
  engine: InferenceEngine
) {
  try {
    // Scan for models on startup
    const drives = ['C:', 'D:'];
    const models = await scanner.scanDrives(drives);
    
    if (models.length > 0) {
      await registry.saveModels(models);
      console.log(`Initialized with ${models.length} models`);
    }
    
    // Load default model
    await engine.initialize();
  } catch (error) {
    console.error('Extension initialization failed:', error);
  }
}

function updateModelPanel(models: any[]) {
  // Update the model panel with found models
  console.log('Updating model panel with', models.length, 'models');
}

function createModelPanel() {
  // Create and show model management panel
  const panel = vscode.window.createWebviewPanel(
    'hubv1-model-panel',
    'HubV1 Model Manager',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = getWebviewContent();
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HubV1 Model Manager</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .panel { padding: 20px; }
    .model-card { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
    .scan-btn { background: #007acc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>HubV1 Model Manager</h1>
    <button class="scan-btn" onclick="scanModels()">Scan Drives</button>
    <div id="models-container"></div>
  </div>
  <script>
    function scanModels() {
      // Implementation for scanning models
      console.log('Scanning models...');
    }
  </script>
</body>
</html>`;
}

export function deactivate() {
  console.log('HubV1 extension deactivated');
}