import { app, BrowserWindow, ipcMain, desktopCapturer, systemPreferences } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { audioCaptureService } from './services/audioCapture';
import { whisperService } from './services/whisperService';
import { ollamaService } from './services/ollamaService';
import { cloudAIService } from './services/cloudAIService';
import { databaseService } from './services/databaseService';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
    if (require('electron-squirrel-startup')) {
        app.quit();
    }
} catch (e) {
    // electron-squirrel-startup not installed
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Ensure directories exist
const recordingsPath = path.join(app.getPath('userData'), 'recordings');
const transcriptsPath = path.join(app.getPath('userData'), 'transcripts');
const modelsPath = path.join(app.getPath('userData'), 'models');
const configPath = path.join(app.getPath('userData'), 'config.json');

[recordingsPath, transcriptsPath, modelsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Load saved config
interface AppConfig {
    openaiApiKey?: string;
    aiMode: 'cloud' | 'local';
    whisperModel: string;
    summarizationModel: string;
}

function loadConfig(): AppConfig {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading config:', e);
    }
    return {
        aiMode: 'cloud',
        whisperModel: 'whisper-1',
        summarizationModel: 'gpt-4o-mini',
    };
}

function saveConfig(config: AppConfig): void {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

let appConfig = loadConfig();

// Initialize cloud AI if API key is set
if (appConfig.openaiApiKey) {
    cloudAIService.initialize({ apiKey: appConfig.openaiApiKey });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            // Allow external connections for HuggingFace model downloads
            webSecurity: !isDev, // Disable in dev, enable in production
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#1a1a2e',
        show: false,
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    // Initialize database
    await databaseService.initialize();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==================== IPC Handlers ====================

// ----- Config -----
ipcMain.handle('get-config', async () => {
    return {
        ...appConfig,
        openaiApiKey: appConfig.openaiApiKey ? '••••••••' + appConfig.openaiApiKey.slice(-4) : '',
        hasApiKey: !!appConfig.openaiApiKey,
    };
});

ipcMain.handle('set-api-key', async (_, apiKey: string) => {
    try {
        // Validate the key
        const isValid = await cloudAIService.validateApiKey(apiKey);
        if (!isValid) {
            return { success: false, error: 'Invalid API key' };
        }

        appConfig.openaiApiKey = apiKey;
        saveConfig(appConfig);
        cloudAIService.initialize({ apiKey });
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('set-ai-mode', async (_, mode: 'cloud' | 'local') => {
    appConfig.aiMode = mode;
    saveConfig(appConfig);
    return { success: true };
});

// ----- Audio Sources -----
ipcMain.handle('get-audio-sources', async () => {
    try {
        const sources = await audioCaptureService.getAudioSources();
        return sources;
    } catch (error) {
        console.error('Error getting audio sources:', error);
        return [];
    }
});

// ----- Recording -----
ipcMain.handle('start-recording', async () => {
    try {
        const outputPath = await audioCaptureService.startRecording(recordingsPath);
        return { success: true, path: outputPath };
    } catch (error) {
        console.error('Error starting recording:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('stop-recording', async () => {
    try {
        const outputPath = await audioCaptureService.stopRecording();
        return { success: true, path: outputPath };
    } catch (error) {
        console.error('Error stopping recording:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('get-recording-status', async () => {
    return audioCaptureService.getStatus();
});

// ----- File Management -----
ipcMain.handle('save-recording', async (_, buffer: ArrayBuffer, filename: string) => {
    try {
        const filePath = path.join(recordingsPath, filename);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error saving recording:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('save-transcript', async (_, transcript: string, filename: string) => {
    try {
        const filePath = path.join(transcriptsPath, filename);
        fs.writeFileSync(filePath, transcript);
        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error saving transcript:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('get-recordings', async () => {
    try {
        const files = fs.readdirSync(recordingsPath);
        return files
            .filter(file => file.endsWith('.webm') || file.endsWith('.wav') || file.endsWith('.mp3'))
            .map(file => ({
                name: file,
                path: path.join(recordingsPath, file),
                stats: fs.statSync(path.join(recordingsPath, file)),
            }));
    } catch (error) {
        console.error('Error getting recordings:', error);
        return [];
    }
});

ipcMain.handle('get-transcripts', async () => {
    try {
        const files = fs.readdirSync(transcriptsPath);
        return files
            .filter(file => file.endsWith('.json') || file.endsWith('.txt'))
            .map(file => ({
                name: file,
                path: path.join(transcriptsPath, file),
                content: fs.readFileSync(path.join(transcriptsPath, file), 'utf-8'),
            }));
    } catch (error) {
        console.error('Error getting transcripts:', error);
        return [];
    }
});

// ----- Transcription (Cloud or Local) -----
ipcMain.handle('transcribe-audio', async (_, audioPath: string, options: any = {}) => {
    try {
        // Try cloud first if configured
        if (appConfig.aiMode === 'cloud' && cloudAIService.isConfigured()) {
            const result = await cloudAIService.transcribe(audioPath);
            return { success: true, result };
        }

        // Fallback to local Whisper
        const result = await whisperService.transcribe(audioPath, options);
        return { success: true, result };
    } catch (error) {
        console.error('Error transcribing:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('check-whisper', async () => {
    // Cloud mode - always available if API key is set
    if (appConfig.aiMode === 'cloud') {
        return {
            available: cloudAIService.isConfigured(),
            mode: 'cloud',
            instructions: cloudAIService.isConfigured()
                ? 'Using OpenAI Whisper API'
                : 'Please set your OpenAI API key in Settings',
        };
    }

    // Local mode
    const isAvailable = await whisperService.initialize();
    return {
        available: isAvailable,
        mode: 'local',
        instructions: whisperService.getInstallInstructions(),
    };
});

// ----- Summarization (Cloud or Local) -----
ipcMain.handle('summarize-transcript', async (_, transcript: string) => {
    try {
        // Try cloud first if configured
        if (appConfig.aiMode === 'cloud' && cloudAIService.isConfigured()) {
            const result = await cloudAIService.summarize(transcript);
            return { success: true, result };
        }

        // Fallback to local Ollama
        const result = await ollamaService.summarizeMeeting(transcript);
        return { success: true, result };
    } catch (error) {
        console.error('Error summarizing:', error);
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('check-ollama', async () => {
    // Cloud mode - always available if API key is set
    if (appConfig.aiMode === 'cloud') {
        return {
            available: cloudAIService.isConfigured(),
            mode: 'cloud',
            models: cloudAIService.isConfigured()
                ? cloudAIService.getAvailableModels().summarization
                : [],
            instructions: cloudAIService.isConfigured()
                ? 'Using OpenAI GPT API'
                : 'Please set your OpenAI API key in Settings',
        };
    }

    // Local mode
    const isAvailable = await ollamaService.isAvailable();
    const models = isAvailable ? await ollamaService.getModels() : [];
    return {
        available: isAvailable,
        mode: 'local',
        models,
        instructions: ollamaService.getInstallInstructions(),
    };
});

ipcMain.handle('set-ollama-model', async (_, model: string) => {
    appConfig.summarizationModel = model;
    saveConfig(appConfig);
    ollamaService.setModel(model);
    return { success: true };
});

// ----- Database -----
ipcMain.handle('create-meeting', async (_, meeting: any) => {
    try {
        const result = await databaseService.createMeeting(meeting);
        return { success: true, meeting: result };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('get-meetings', async () => {
    try {
        const meetings = await databaseService.getAllMeetings();
        return { success: true, meetings };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('get-meeting-details', async (_, id: number) => {
    try {
        const details = await databaseService.getMeetingWithDetails(id);
        return { success: true, ...details };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('update-meeting', async (_, id: number, updates: any) => {
    try {
        const result = await databaseService.updateMeeting(id, updates);
        return { success: true, meeting: result };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('delete-meeting', async (_, id: number) => {
    try {
        await databaseService.deleteMeeting(id);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('save-meeting-transcript', async (_, meetingId: number, transcript: any) => {
    try {
        const result = await databaseService.saveTranscript({
            meetingId,
            text: transcript.text,
            segments: JSON.stringify(transcript.segments),
            language: transcript.language,
        });
        return { success: true, transcript: result };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('save-meeting-summary', async (_, meetingId: number, summary: any, model: string) => {
    try {
        const result = await databaseService.saveSummary({
            meetingId,
            summary: summary.summary,
            actionItems: JSON.stringify(summary.actionItems),
            keyPoints: JSON.stringify(summary.keyPoints),
            decisions: JSON.stringify(summary.decisions),
            model,
        });
        return { success: true, summary: result };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

ipcMain.handle('search-meetings', async (_, query: string) => {
    try {
        const meetings = await databaseService.searchMeetings(query);
        return { success: true, meetings };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});

// ----- App Info -----
ipcMain.handle('get-app-paths', async () => {
    return {
        recordings: recordingsPath,
        transcripts: transcriptsPath,
        models: modelsPath,
        userData: app.getPath('userData'),
    };
});

ipcMain.handle('get-platform-info', async () => {
    return {
        platform: process.platform,
        arch: process.arch,
        audioSetup: audioCaptureService.getSetupInstructions(),
    };
});

// ----- Permissions -----
ipcMain.handle('check-microphone-permission', async () => {
    if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('microphone');
        if (status !== 'granted') {
            const granted = await systemPreferences.askForMediaAccess('microphone');
            return granted;
        }
        return true;
    }
    return true;
});

ipcMain.handle('check-screen-permission', async () => {
    if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('screen');
        return status === 'granted';
    }
    return true;
});

// ----- System Status -----
ipcMain.handle('get-system-status', async () => {
    const cloudConfigured = cloudAIService.isConfigured();

    // If cloud mode, return cloud status
    if (appConfig.aiMode === 'cloud') {
        return {
            mode: 'cloud',
            cloudConfigured,
            whisper: {
                available: cloudConfigured,
                mode: 'cloud',
                instructions: cloudConfigured
                    ? 'Using OpenAI Whisper API'
                    : 'Set your OpenAI API key to enable transcription',
            },
            ollama: {
                available: cloudConfigured,
                mode: 'cloud',
                models: cloudConfigured ? cloudAIService.getAvailableModels().summarization : [],
                instructions: cloudConfigured
                    ? 'Using OpenAI GPT API'
                    : 'Set your OpenAI API key to enable summarization',
            },
            platform: process.platform,
            pricingInfo: cloudAIService.getPricingInfo(),
        };
    }

    // Local mode
    const whisperAvailable = await whisperService.initialize();
    const ollamaAvailable = await ollamaService.isAvailable();
    const ollamaModels = ollamaAvailable ? await ollamaService.getModels() : [];

    return {
        mode: 'local',
        cloudConfigured,
        whisper: {
            available: whisperAvailable,
            mode: 'local',
            instructions: whisperService.getInstallInstructions(),
        },
        ollama: {
            available: ollamaAvailable,
            mode: 'local',
            models: ollamaModels,
            instructions: ollamaService.getInstallInstructions(),
        },
        platform: process.platform,
        audioSetup: audioCaptureService.getSetupInstructions(),
    };
});

// ----- Pricing Info -----
ipcMain.handle('get-pricing-info', async () => {
    return cloudAIService.getPricingInfo();
});
