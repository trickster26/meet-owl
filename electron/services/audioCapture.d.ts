/**
 * Cross-platform audio capture service
 * Supports Windows (WASAPI) and Linux (PulseAudio/PipeWire)
 */
export interface AudioSource {
    id: string;
    name: string;
    type: 'screen' | 'window' | 'audio';
}
export interface CaptureOptions {
    sampleRate?: number;
    channels?: number;
    format?: 'wav' | 'webm' | 'mp3';
}
declare class AudioCaptureService {
    private ffmpegProcess;
    private isRecording;
    private outputPath;
    private platform;
    constructor();
    /**
     * Get available audio sources based on platform
     */
    getAudioSources(): Promise<AudioSource[]>;
    /**
     * Check if FFmpeg is available
     */
    checkFFmpeg(): Promise<boolean>;
    /**
     * Get FFmpeg input device based on platform
     */
    private getFFmpegAudioInput;
    /**
     * Start recording system audio using FFmpeg
     */
    startRecording(outputDir: string, options?: CaptureOptions): Promise<string>;
    /**
     * Stop recording
     */
    stopRecording(): Promise<string>;
    /**
     * Check recording status
     */
    getStatus(): {
        isRecording: boolean;
        outputPath: string;
    };
    /**
     * Get platform-specific instructions for audio setup
     */
    getSetupInstructions(): string;
}
export declare const audioCaptureService: AudioCaptureService;
export default AudioCaptureService;
