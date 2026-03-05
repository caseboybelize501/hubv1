# HubV1 - Local AI Assistant for VS Codium

**HubV1** is a VS Codium extension that provides full offline model inference with Cline/Continue integration. It scans local drives for LLM models and enables seamless local AI assistance without any external API calls.

## Features

- ✅ **Full Offline Inference**: All processing happens locally on your machine
- 🖥️ **Multi-Drive Scanning**: Automatically scans C: and D: drives for models
- 🧠 **Model Detection**: Supports GGUF, ONNX, TensorFlow Lite, and PyTorch formats
- 🔍 **Quality Scoring**: Automatic model quality assessment with community benchmarks
- ⚙️ **Multi-Model Configuration**: Configure different models for chat, code completion, and embeddings
- 🔄 **Seamless Integration**: Works with existing Cline/Continue workflows

## Architecture


┌─────────────────────────────────────────────────────────────┐
│                    VS Codium                                │
├─────────────────────────────────────────────────────────────┤
│                    Extension Host                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              HubV1 Extension Core                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ • Model Scanner Module                                  │ │
│  │ • Model Registry                                        │ │
│  │ • Inference Engine                                      │ │
│  │ • Configuration Manager                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Local Inference Engines                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ • llama.cpp Bridge                                      │ │
│  │ • ONNX Runtime                                          │ │
│  │ • TensorFlow Lite                                       │ │
│  │ • Memory Manager                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘


## Installation

1. Install VS Codium
2. Clone this repository
3. Run `npm install` in the project directory
4. Build the extension with `npm run compile`
5. Open VS Codium and install the built extension

## Usage

### Scanning Models

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "HubV1: Scan Models"
3. The extension will scan C: and D: drives for local models

### Model Management

1. Open Command Palette
2. Run "HubV1: Open Model Panel"
3. View found models with quality scores
4. Load models for use in your coding sessions

## Configuration

The extension automatically saves model configurations to `~/.hubv1/config.json`. You can customize:

- Default chat and code completion models
- Fallback models
- Inference preferences (temperature, max tokens, etc.)

## Technical Details

### Supported Model Formats

- **GGUF**: llama.cpp models (recommended)
- **ONNX**: Cross-platform models
- **TensorFlow Lite**: Mobile-friendly models
- **PyTorch**: Standard PyTorch models

### Quality Scoring System

Models are scored based on:
1. Size vs. Performance
2. Quantization Quality (Q4_K_M, Q5_K_M, etc.)
3. Architecture Type (LLaMA, Mistral, CodeLlama)
4. Training Data Relevance
5. Community Ratings/Benchmarks

## Development

### Project Structure


src/
├── extension.ts           # Main extension entry point
├── model-scanner/         # Model detection and scanning
│   ├── scanner.ts         # Drive scanning logic
│   ├── model-detector.ts  # Model format detection
│   ├── quality-scorer.ts  # Quality assessment
│   └── model-registry.ts  # Model storage
├── inference/             # Local inference engine
│   ├── engine.ts          # Main inference interface
│   ├── backends/          # Format-specific engines
│   └── optimizations/     # Performance optimizations
├── cline-integration/     # Cline/Continue integration
│   └── offline-adapter.ts # Offline mode adapter
└── config/                # Configuration management
    └── model-config.ts    # Model configuration


### Building

bash
npm install
npm run compile


## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please open issues and pull requests on GitHub.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.