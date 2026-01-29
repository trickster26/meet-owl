# MeetNotes

MeetNotes is an AI-powered meeting recorder, transcriber, and summarizer built with Electron, React, and TypeScript. It offers a privacy-focused solution for capturing meetings, transcribing them in real-time, and generating insightful summaries using local or cloud-based AI models.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18.0-blue)
![Electron](https://img.shields.io/badge/Electron-28.0-blue)

## Features

- **🎙️ High-Quality Recording**: Capture system audio and microphone input simultaneously.
- **📝 Real-time Transcription**: accurate speech-to-text using OpenAI's Whisper model (Local or Cloud).
- **🧠 AI Summarization**: Generate concise summaries, action items, key points, and decisions using Ollama (Local) or OpenAI GPT (Cloud).
- **🔒 Privacy-First**: 100% local processing capability means your meetings never leave your device if you choose.
- **📂 Meeting History**: Organize, search, and manage your past meetings and transcripts.
- **⚙️ Flexible Configuration**: Choose between speed (Tiny model) and accuracy (Large model), and toggle between local and cloud AI providers.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS (via bundled CSS)
- **Backend**: Electron (Main Process), Node.js
- **AI Services**:
  - **Transcription**: `whisper.cpp` or `faster-whisper` (Python)
  - **Summarization**: Ollama (Local) or OpenAI API (Cloud)
- **Database**: Local JSON/SQLite based storage (implied by service structure)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: (v18 or higher recommended)
- **Python**: (v3.8+ for `faster-whisper` support)
- **FFmpeg**: Required for audio processing.
  - *Linux*: `sudo apt install ffmpeg`
  - *Mac*: `brew install ffmpeg`
  - *Windows*: `winget install ffmpeg`
- **Ollama**: (Optional, for privacy-focused local summarization)
  - [Download Ollama](https://ollama.com/) and pull a model: `ollama pull llama3`

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/meet-note-taker.git
   cd meet-note-taker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies (for local Whisper)**
   ```bash
   pip install faster-whisper
   # OR
   pip install openai-whisper
   ```

## Usage

### Development

Run the application in development mode with hot-reloading:

```bash
npm run electron:dev
```

### Production Build

Build the application for your operating system:

```bash
npm run electron:build
```

The output binaries will be in the `release` directory.

## Configuration

MeetNotes works out-of-the-box with local defaults, but you can configure it for enhanced performance or cloud capabilities.

### Local AI (Default)
1. Ensure **Ollama** is running (`ollama serve`).
2. Go to **Settings** in the app.
3. Select "Local" mode.
4. Choose your preferred Whisper model size (Tiny/Base/Small).

### Cloud AI (OpenAI)
1. Go to **Settings**.
2. Select "Cloud" mode.
3. Enter your OpenAI API Key.
4. Enjoy higher accuracy summaries and transcription (Note: standard API costs apply).

## Project Structure

```
├── electron/          # Main process & Services
│   ├── main.ts        # Entry point
│   ├── services/      # Node.js services (Ollama, Whisper, Audio)
│   └── preload.ts     # IPC bridge
├── src/               # Renderer process (React)
│   ├── components/    # UI Components
│   ├── services/      # Browser-side services
│   └── App.tsx        # Main UI
├── dist/              # Built frontend assets
└── release/           # Packaged Electron app
```

## License

MIT
