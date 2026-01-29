/**
 * Cross-platform audio capture service
 * Supports Windows (WASAPI) and Linux (PulseAudio/PipeWire)
 */

import { desktopCapturer } from 'electron';
import { exec, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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

class AudioCaptureService {
    private ffmpegProcess: ChildProcess | null = null;
    private isRecording: boolean = false;
    private outputPath: string = '';
    private platform: string;

    constructor() {
        this.platform = os.platform();
    }

    /**
     * Get available audio sources based on platform
     */
    async getAudioSources(): Promise<AudioSource[]> {
        const sources: AudioSource[] = [];

        // Get screen/window sources from Electron
        const desktopSources = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            fetchWindowIcons: false,
        });

        desktopSources.forEach(source => {
            sources.push({
                id: source.id,
                name: source.name,
                type: source.id.startsWith('screen') ? 'screen' : 'window',
            });
        });

        // Add system audio source
        if (this.platform === 'linux') {
            // Check for PulseAudio/PipeWire
            sources.push({
                id: 'pulse-default',
                name: 'System Audio (PulseAudio/PipeWire)',
                type: 'audio',
            });
        } else if (this.platform === 'win32') {
            // Windows WASAPI loopback
            sources.push({
                id: 'wasapi-loopback',
                name: 'System Audio (Windows)',
                type: 'audio',
            });
        }

        return sources;
    }

    /**
     * Check if FFmpeg is available
     */
    async checkFFmpeg(): Promise<boolean> {
        return new Promise((resolve) => {
            exec('ffmpeg -version', (error) => {
                resolve(!error);
            });
        });
    }

    /**
     * Get FFmpeg input device based on platform
     */
    private getFFmpegAudioInput(): { format: string; device: string } {
        if (this.platform === 'linux') {
            // For Linux with PulseAudio/PipeWire
            // Use the default monitor (captures all system audio)
            return {
                format: 'pulse',
                device: 'default', // Will capture from default output monitor
            };
        } else if (this.platform === 'win32') {
            // For Windows with DirectShow/WASAPI
            return {
                format: 'dshow',
                device: 'audio="Stereo Mix"', // Common name, may vary
            };
        } else if (this.platform === 'darwin') {
            // macOS requires additional setup (BlackHole, etc.)
            return {
                format: 'avfoundation',
                device: ':0', // Default audio input
            };
        }

        throw new Error(`Unsupported platform: ${this.platform}`);
    }

    /**
     * Start recording system audio using FFmpeg
     */
    async startRecording(outputDir: string, options: CaptureOptions = {}): Promise<string> {
        if (this.isRecording) {
            throw new Error('Recording already in progress');
        }

        const hasFFmpeg = await this.checkFFmpeg();
        if (!hasFFmpeg) {
            throw new Error('FFmpeg is not installed. Please install FFmpeg to enable audio recording.');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const format = options.format || 'webm';
        const filename = `meeting-${timestamp}.${format}`;
        this.outputPath = path.join(outputDir, filename);

        const audioInput = this.getFFmpegAudioInput();

        // Build FFmpeg arguments
        const args: string[] = [
            '-y', // Overwrite output file
        ];

        if (this.platform === 'linux') {
            // Linux PulseAudio capture
            args.push(
                '-f', 'pulse',
                '-i', 'default',
                '-ac', String(options.channels || 2),
                '-ar', String(options.sampleRate || 44100),
            );
        } else if (this.platform === 'win32') {
            // Windows DirectShow capture
            args.push(
                '-f', 'dshow',
                '-i', 'audio=Stereo Mix',
                '-ac', String(options.channels || 2),
                '-ar', String(options.sampleRate || 44100),
            );
        }

        // Output format
        if (format === 'webm') {
            args.push('-c:a', 'libopus');
        } else if (format === 'mp3') {
            args.push('-c:a', 'libmp3lame', '-b:a', '192k');
        } else {
            args.push('-c:a', 'pcm_s16le');
        }

        args.push(this.outputPath);

        console.log('Starting FFmpeg with args:', args.join(' '));

        this.ffmpegProcess = spawn('ffmpeg', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.ffmpegProcess.stderr?.on('data', (data) => {
            console.log('FFmpeg:', data.toString());
        });

        this.ffmpegProcess.on('error', (error) => {
            console.error('FFmpeg error:', error);
            this.isRecording = false;
        });

        this.ffmpegProcess.on('close', (code) => {
            console.log('FFmpeg process closed with code:', code);
            this.isRecording = false;
        });

        this.isRecording = true;
        return this.outputPath;
    }

    /**
     * Stop recording
     */
    async stopRecording(): Promise<string> {
        if (!this.isRecording || !this.ffmpegProcess) {
            throw new Error('No recording in progress');
        }

        return new Promise((resolve, reject) => {
            // Send 'q' to FFmpeg to gracefully stop
            this.ffmpegProcess!.stdin?.write('q');

            const timeout = setTimeout(() => {
                if (this.ffmpegProcess) {
                    this.ffmpegProcess.kill('SIGTERM');
                }
            }, 5000);

            this.ffmpegProcess!.on('close', () => {
                clearTimeout(timeout);
                this.isRecording = false;
                this.ffmpegProcess = null;

                if (fs.existsSync(this.outputPath)) {
                    resolve(this.outputPath);
                } else {
                    reject(new Error('Recording file was not created'));
                }
            });
        });
    }

    /**
     * Check recording status
     */
    getStatus(): { isRecording: boolean; outputPath: string } {
        return {
            isRecording: this.isRecording,
            outputPath: this.outputPath,
        };
    }

    /**
     * Get platform-specific instructions for audio setup
     */
    getSetupInstructions(): string {
        if (this.platform === 'linux') {
            return `
Linux Audio Setup:
1. Ensure PulseAudio or PipeWire is running
2. Install FFmpeg: sudo apt install ffmpeg
3. To capture system audio, you may need to configure a monitor source:
   - Run: pactl list short sources
   - Look for a source ending with ".monitor"
   - Or use pavucontrol to configure recording sources
      `;
        } else if (this.platform === 'win32') {
            return `
Windows Audio Setup:
1. Install FFmpeg and add to PATH
2. Enable "Stereo Mix" in Sound settings:
   - Right-click volume icon > Sounds
   - Recording tab > Right-click > Show Disabled Devices
   - Enable "Stereo Mix"
3. If Stereo Mix is not available, install VB-Cable or similar virtual audio driver
      `;
        } else if (this.platform === 'darwin') {
            return `
macOS Audio Setup:
1. Install FFmpeg: brew install ffmpeg
2. Install BlackHole audio driver: brew install blackhole-2ch
3. Create a Multi-Output Device in Audio MIDI Setup
4. Configure apps to use the Multi-Output Device
      `;
        }
        return 'Unsupported platform';
    }
}

export const audioCaptureService = new AudioCaptureService();
export default AudioCaptureService;
