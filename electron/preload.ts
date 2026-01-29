import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // ----- Config -----
    getConfig: () => ipcRenderer.invoke('get-config'),
    setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),
    setAIMode: (mode: 'cloud' | 'local') => ipcRenderer.invoke('set-ai-mode', mode),

    // ----- Audio Sources -----
    getAudioSources: () => ipcRenderer.invoke('get-audio-sources'),

    // ----- Recording -----
    startRecording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    getRecordingStatus: () => ipcRenderer.invoke('get-recording-status'),
    saveRecording: (buffer: ArrayBuffer, filename: string) =>
        ipcRenderer.invoke('save-recording', buffer, filename),
    getRecordings: () => ipcRenderer.invoke('get-recordings'),

    // ----- Transcription -----
    transcribeAudio: (audioPath: string, options?: any) =>
        ipcRenderer.invoke('transcribe-audio', audioPath, options),
    checkWhisper: () => ipcRenderer.invoke('check-whisper'),
    saveTranscript: (transcript: string, filename: string) =>
        ipcRenderer.invoke('save-transcript', transcript, filename),
    getTranscripts: () => ipcRenderer.invoke('get-transcripts'),

    // ----- Summarization -----
    summarizeTranscript: (transcript: string) =>
        ipcRenderer.invoke('summarize-transcript', transcript),
    checkOllama: () => ipcRenderer.invoke('check-ollama'),
    setOllamaModel: (model: string) => ipcRenderer.invoke('set-ollama-model', model),

    // ----- Database -----
    createMeeting: (meeting: any) => ipcRenderer.invoke('create-meeting', meeting),
    getMeetings: () => ipcRenderer.invoke('get-meetings'),
    getMeetingDetails: (id: number) => ipcRenderer.invoke('get-meeting-details', id),
    updateMeeting: (id: number, updates: any) => ipcRenderer.invoke('update-meeting', id, updates),
    deleteMeeting: (id: number) => ipcRenderer.invoke('delete-meeting', id),
    saveMeetingTranscript: (meetingId: number, transcript: any) =>
        ipcRenderer.invoke('save-meeting-transcript', meetingId, transcript),
    saveMeetingSummary: (meetingId: number, summary: any, model: string) =>
        ipcRenderer.invoke('save-meeting-summary', meetingId, summary, model),
    searchMeetings: (query: string) => ipcRenderer.invoke('search-meetings', query),

    // ----- App Info -----
    getAppPaths: () => ipcRenderer.invoke('get-app-paths'),
    getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),
    getSystemStatus: () => ipcRenderer.invoke('get-system-status'),
    getPricingInfo: () => ipcRenderer.invoke('get-pricing-info'),

    // ----- Permissions -----
    checkMicrophonePermission: () => ipcRenderer.invoke('check-microphone-permission'),
    checkScreenPermission: () => ipcRenderer.invoke('check-screen-permission'),
});

// Type definitions for the exposed API
export interface ElectronAPI {
    // Config
    getConfig: () => Promise<{
        aiMode: 'cloud' | 'local';
        hasApiKey: boolean;
        openaiApiKey: string;
        whisperModel: string;
        summarizationModel: string;
    }>;
    setApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
    setAIMode: (mode: 'cloud' | 'local') => Promise<{ success: boolean }>;

    // Audio Sources
    getAudioSources: () => Promise<Array<{
        id: string;
        name: string;
        type: 'screen' | 'window' | 'audio';
    }>>;

    // Recording
    startRecording: () => Promise<{ success: boolean; path?: string; error?: string }>;
    stopRecording: () => Promise<{ success: boolean; path?: string; error?: string }>;
    getRecordingStatus: () => Promise<{ isRecording: boolean; outputPath: string }>;
    saveRecording: (buffer: ArrayBuffer, filename: string) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    getRecordings: () => Promise<Array<{
        name: string;
        path: string;
        stats: { size: number; mtime: Date };
    }>>;

    // Transcription
    transcribeAudio: (audioPath: string, options?: {
        model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
        language?: string;
    }) => Promise<{
        success: boolean;
        result?: {
            text: string;
            segments: Array<{ id: number; start: number; end: number; text: string }>;
            language: string;
            duration: number;
        };
        error?: string;
    }>;
    checkWhisper: () => Promise<{ available: boolean; mode?: string; instructions: string }>;
    saveTranscript: (transcript: string, filename: string) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    getTranscripts: () => Promise<Array<{
        name: string;
        path: string;
        content: string;
    }>>;

    // Summarization
    summarizeTranscript: (transcript: string) => Promise<{
        success: boolean;
        result?: {
            summary: string;
            actionItems: string[];
            keyPoints: string[];
            decisions: string[];
        };
        error?: string;
    }>;
    checkOllama: () => Promise<{
        available: boolean;
        mode?: string;
        models: string[];
        instructions: string;
    }>;
    setOllamaModel: (model: string) => Promise<{ success: boolean }>;

    // Database
    createMeeting: (meeting: any) => Promise<{ success: boolean; meeting?: any; error?: string }>;
    getMeetings: () => Promise<{ success: boolean; meetings?: any[]; error?: string }>;
    getMeetingDetails: (id: number) => Promise<{
        success: boolean;
        meeting?: any;
        transcript?: any;
        summary?: any;
        error?: string;
    }>;
    updateMeeting: (id: number, updates: any) => Promise<{ success: boolean; meeting?: any; error?: string }>;
    deleteMeeting: (id: number) => Promise<{ success: boolean; error?: string }>;
    saveMeetingTranscript: (meetingId: number, transcript: any) => Promise<{ success: boolean; error?: string }>;
    saveMeetingSummary: (meetingId: number, summary: any, model: string) => Promise<{ success: boolean; error?: string }>;
    searchMeetings: (query: string) => Promise<{ success: boolean; meetings?: any[]; error?: string }>;

    // App Info
    getAppPaths: () => Promise<{
        recordings: string;
        transcripts: string;
        models: string;
        userData: string;
    }>;
    getPlatformInfo: () => Promise<{
        platform: string;
        arch: string;
        audioSetup: string;
    }>;
    getSystemStatus: () => Promise<{
        mode: 'cloud' | 'local';
        cloudConfigured: boolean;
        whisper: { available: boolean; mode?: string; instructions: string };
        ollama: { available: boolean; mode?: string; models: string[]; instructions: string };
        platform: string;
        pricingInfo?: string;
        audioSetup?: string;
    }>;
    getPricingInfo: () => Promise<string>;

    // Permissions
    checkMicrophonePermission: () => Promise<boolean>;
    checkScreenPermission: () => Promise<boolean>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
