/**
 * Browser-based Whisper Transcription Service
 * Uses @huggingface/transformers to run Whisper locally in the browser
 * 100% free, no API costs, works offline
 */

import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for browser use
env.allowLocalModels = false;
env.useBrowserCache = true;

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

export interface TranscriptionProgress {
    status: 'loading' | 'transcribing' | 'complete' | 'error';
    progress: number;
    message: string;
}

type ProgressCallback = (progress: TranscriptionProgress) => void;

class BrowserWhisperService {
    private transcriber: any = null;
    private isLoading: boolean = false;
    private modelId: string = 'Xenova/whisper-tiny';

    /**
     * Initialize the Whisper model
     * This downloads the model on first use (~75MB for tiny)
     */
    async initialize(
        model: 'tiny' | 'base' | 'small' = 'tiny',
        onProgress?: ProgressCallback
    ): Promise<boolean> {
        if (this.transcriber && this.modelId === `Xenova/whisper-${model}`) {
            return true;
        }

        if (this.isLoading) {
            return false;
        }

        this.isLoading = true;
        this.modelId = `Xenova/whisper-${model}`;

        try {
            onProgress?.({
                status: 'loading',
                progress: 0,
                message: `Loading Whisper ${model} model... (first time may take a minute)`,
            });

            this.transcriber = await pipeline(
                'automatic-speech-recognition',
                this.modelId,
                {
                    progress_callback: (data: any) => {
                        if (data.status === 'progress') {
                            onProgress?.({
                                status: 'loading',
                                progress: Math.round(data.progress),
                                message: `Downloading model: ${Math.round(data.progress)}%`,
                            });
                        }
                    },
                }
            );

            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('Failed to load Whisper model:', error);
            this.isLoading = false;
            onProgress?.({
                status: 'error',
                progress: 0,
                message: `Failed to load model: ${error}`,
            });
            return false;
        }
    }

    /**
     * Check if model is loaded
     */
    isReady(): boolean {
        return this.transcriber !== null;
    }

    /**
     * Transcribe audio from a Blob or ArrayBuffer
     */
    async transcribe(
        audio: Blob | ArrayBuffer | Float32Array,
        onProgress?: ProgressCallback
    ): Promise<TranscriptionResult> {
        if (!this.transcriber) {
            throw new Error('Whisper model not loaded. Call initialize() first.');
        }

        onProgress?.({
            status: 'transcribing',
            progress: 0,
            message: 'Processing audio...',
        });

        try {
            // Convert to proper format if needed
            let audioData: Float32Array;

            if (audio instanceof Blob) {
                audioData = await this.blobToFloat32Array(audio);
            } else if (audio instanceof ArrayBuffer) {
                audioData = await this.arrayBufferToFloat32Array(audio);
            } else {
                audioData = audio;
            }

            onProgress?.({
                status: 'transcribing',
                progress: 50,
                message: 'Transcribing with Whisper...',
            });

            // Run transcription
            const result = await this.transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: true,
                language: 'english',
            });

            onProgress?.({
                status: 'complete',
                progress: 100,
                message: 'Transcription complete!',
            });

            // Parse result into segments
            const segments = this.parseChunks(result);

            return {
                text: result.text || '',
                segments,
                language: 'en',
                duration: audioData.length / 16000, // Assuming 16kHz sample rate
            };
        } catch (error) {
            onProgress?.({
                status: 'error',
                progress: 0,
                message: `Transcription failed: ${error}`,
            });
            throw error;
        }
    }

    /**
     * Convert Blob to Float32Array for Whisper
     */
    private async blobToFloat32Array(blob: Blob): Promise<Float32Array> {
        const arrayBuffer = await blob.arrayBuffer();
        return this.arrayBufferToFloat32Array(arrayBuffer);
    }

    /**
     * Convert ArrayBuffer to Float32Array for Whisper
     */
    private async arrayBufferToFloat32Array(buffer: ArrayBuffer): Promise<Float32Array> {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000, // Whisper expects 16kHz
        });

        try {
            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(buffer);

            // Get mono channel (Whisper expects mono)
            const channelData = audioBuffer.getChannelData(0);

            // Resample to 16kHz if needed
            if (audioBuffer.sampleRate !== 16000) {
                return this.resample(channelData, audioBuffer.sampleRate, 16000);
            }

            return channelData;
        } finally {
            audioContext.close();
        }
    }

    /**
     * Resample audio to target sample rate
     */
    private resample(
        audioData: Float32Array,
        fromRate: number,
        toRate: number
    ): Float32Array {
        const ratio = fromRate / toRate;
        const newLength = Math.round(audioData.length / ratio);
        const result = new Float32Array(newLength);

        for (let i = 0; i < newLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
            const t = srcIndex - srcIndexFloor;
            result[i] = audioData[srcIndexFloor] * (1 - t) + audioData[srcIndexCeil] * t;
        }

        return result;
    }

    /**
     * Parse Whisper chunks into segments
     */
    private parseChunks(result: any): TranscriptionResult['segments'] {
        if (!result.chunks) {
            return [{
                id: 0,
                start: 0,
                end: 0,
                text: result.text || '',
            }];
        }

        return result.chunks.map((chunk: any, index: number) => ({
            id: index,
            start: chunk.timestamp?.[0] || 0,
            end: chunk.timestamp?.[1] || 0,
            text: chunk.text || '',
        }));
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return [
            { id: 'tiny', name: 'Whisper Tiny', size: '~75MB', speed: 'Fastest' },
            { id: 'base', name: 'Whisper Base', size: '~145MB', speed: 'Fast' },
            { id: 'small', name: 'Whisper Small', size: '~465MB', speed: 'Accurate' },
        ];
    }
}

export const browserWhisperService = new BrowserWhisperService();
export default BrowserWhisperService;
