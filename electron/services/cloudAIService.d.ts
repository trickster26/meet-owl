/**
 * Cloud AI Service
 * Uses OpenAI API for transcription (Whisper) and summarization (GPT-4o-mini)
 * Zero local dependencies - everything runs in the cloud
 */
export interface TranscriptionResult {
    text: string;
    segments: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
    language: string;
    duration: number;
}
export interface SummaryResult {
    summary: string;
    actionItems: string[];
    keyPoints: string[];
    decisions: string[];
}
export interface CloudAIConfig {
    apiKey: string;
    transcriptionModel?: 'whisper-1';
    summarizationModel?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
}
declare class CloudAIService {
    private client;
    private config;
    /**
     * Initialize with API key
     */
    initialize(config: CloudAIConfig): void;
    /**
     * Check if service is configured
     */
    isConfigured(): boolean;
    /**
     * Validate API key
     */
    validateApiKey(apiKey: string): Promise<boolean>;
    /**
     * Transcribe audio file using OpenAI Whisper API
     */
    transcribe(audioPath: string): Promise<TranscriptionResult>;
    /**
     * Generate meeting summary using GPT
     */
    summarize(transcript: string): Promise<SummaryResult>;
    /**
     * Get pricing info
     */
    getPricingInfo(): string;
    /**
     * Get models info
     */
    getAvailableModels(): {
        transcription: string[];
        summarization: string[];
    };
}
export declare const cloudAIService: CloudAIService;
export default CloudAIService;
