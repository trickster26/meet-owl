/**
 * Whisper transcription service
 * Uses whisper.cpp or faster-whisper for local transcription
 * Falls back to OpenAI Whisper API if configured
 */
export interface TranscriptionResult {
    text: string;
    segments: TranscriptSegment[];
    language: string;
    duration: number;
}
export interface TranscriptSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    speaker?: string;
}
export interface WhisperOptions {
    model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    language?: string;
    task?: 'transcribe' | 'translate';
    outputFormat?: 'json' | 'txt' | 'srt' | 'vtt';
}
declare class WhisperService {
    private whisperPath;
    private modelsPath;
    private platform;
    private isProcessing;
    constructor();
    /**
     * Initialize Whisper - check for installation
     */
    initialize(): Promise<boolean>;
    /**
     * Find whisper.cpp binary
     */
    private findWhisperCpp;
    /**
     * Check if faster-whisper is installed
     */
    private checkFasterWhisper;
    /**
     * Check if openai-whisper is installed
     */
    private checkOpenAIWhisper;
    /**
     * Transcribe an audio file
     */
    transcribe(audioPath: string, options?: WhisperOptions): Promise<TranscriptionResult>;
    /**
     * Transcribe using faster-whisper (Python)
     */
    private transcribeWithFasterWhisper;
    /**
     * Transcribe using whisper CLI (openai-whisper)
     */
    private transcribeWithWhisperCLI;
    /**
     * Transcribe using whisper.cpp
     */
    private transcribeWithWhisperCpp;
    /**
     * Convert audio to 16kHz WAV for whisper.cpp
     */
    private convertToWav;
    /**
     * Get installation instructions
     */
    getInstallInstructions(): string;
}
export declare const whisperService: WhisperService;
export default WhisperService;
