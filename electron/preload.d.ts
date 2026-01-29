export interface ElectronAPI {
    getConfig: () => Promise<{
        aiMode: 'cloud' | 'local';
        hasApiKey: boolean;
        openaiApiKey: string;
        whisperModel: string;
        summarizationModel: string;
    }>;
    setApiKey: (apiKey: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    setAIMode: (mode: 'cloud' | 'local') => Promise<{
        success: boolean;
    }>;
    getAudioSources: () => Promise<Array<{
        id: string;
        name: string;
        type: 'screen' | 'window' | 'audio';
    }>>;
    startRecording: () => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    stopRecording: () => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    getRecordingStatus: () => Promise<{
        isRecording: boolean;
        outputPath: string;
    }>;
    saveRecording: (buffer: ArrayBuffer, filename: string) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    getRecordings: () => Promise<Array<{
        name: string;
        path: string;
        stats: {
            size: number;
            mtime: Date;
        };
    }>>;
    transcribeAudio: (audioPath: string, options?: {
        model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
        language?: string;
    }) => Promise<{
        success: boolean;
        result?: {
            text: string;
            segments: Array<{
                id: number;
                start: number;
                end: number;
                text: string;
            }>;
            language: string;
            duration: number;
        };
        error?: string;
    }>;
    checkWhisper: () => Promise<{
        available: boolean;
        mode?: string;
        instructions: string;
    }>;
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
    setOllamaModel: (model: string) => Promise<{
        success: boolean;
    }>;
    createMeeting: (meeting: any) => Promise<{
        success: boolean;
        meeting?: any;
        error?: string;
    }>;
    getMeetings: () => Promise<{
        success: boolean;
        meetings?: any[];
        error?: string;
    }>;
    getMeetingDetails: (id: number) => Promise<{
        success: boolean;
        meeting?: any;
        transcript?: any;
        summary?: any;
        error?: string;
    }>;
    updateMeeting: (id: number, updates: any) => Promise<{
        success: boolean;
        meeting?: any;
        error?: string;
    }>;
    deleteMeeting: (id: number) => Promise<{
        success: boolean;
        error?: string;
    }>;
    saveMeetingTranscript: (meetingId: number, transcript: any) => Promise<{
        success: boolean;
        error?: string;
    }>;
    saveMeetingSummary: (meetingId: number, summary: any, model: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    searchMeetings: (query: string) => Promise<{
        success: boolean;
        meetings?: any[];
        error?: string;
    }>;
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
        whisper: {
            available: boolean;
            mode?: string;
            instructions: string;
        };
        ollama: {
            available: boolean;
            mode?: string;
            models: string[];
            instructions: string;
        };
        platform: string;
        pricingInfo?: string;
        audioSetup?: string;
    }>;
    getPricingInfo: () => Promise<string>;
    checkMicrophonePermission: () => Promise<boolean>;
    checkScreenPermission: () => Promise<boolean>;
}
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
