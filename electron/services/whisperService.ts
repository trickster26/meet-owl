/**
 * Whisper transcription service
 * Uses whisper.cpp or faster-whisper for local transcription
 * Falls back to OpenAI Whisper API if configured
 */

import { spawn, ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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

class WhisperService {
    private whisperPath: string | null = null;
    private modelsPath: string;
    private platform: string;
    private isProcessing: boolean = false;

    constructor() {
        this.platform = os.platform();
        this.modelsPath = path.join(os.homedir(), '.meetnotes', 'models');
    }

    /**
     * Initialize Whisper - check for installation
     */
    async initialize(): Promise<boolean> {
        // Check for whisper.cpp
        const whisperCppPath = await this.findWhisperCpp();
        if (whisperCppPath) {
            this.whisperPath = whisperCppPath;
            return true;
        }

        // Check for faster-whisper (Python)
        const hasFasterWhisper = await this.checkFasterWhisper();
        if (hasFasterWhisper) {
            this.whisperPath = 'faster-whisper';
            return true;
        }

        // Check for openai-whisper (Python)
        const hasOpenAIWhisper = await this.checkOpenAIWhisper();
        if (hasOpenAIWhisper) {
            this.whisperPath = 'whisper';
            return true;
        }

        return false;
    }

    /**
     * Find whisper.cpp binary
     */
    private async findWhisperCpp(): Promise<string | null> {
        const possiblePaths = [
            '/usr/local/bin/whisper',
            '/usr/bin/whisper',
            path.join(os.homedir(), '.local', 'bin', 'whisper'),
            path.join(os.homedir(), '.meetnotes', 'whisper', 'main'),
        ];

        if (this.platform === 'win32') {
            possiblePaths.push(
                'C:\\Program Files\\Whisper\\whisper.exe',
                path.join(os.homedir(), 'whisper.cpp', 'main.exe'),
            );
        }

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }

        return null;
    }

    /**
     * Check if faster-whisper is installed
     */
    private async checkFasterWhisper(): Promise<boolean> {
        return new Promise((resolve) => {
            exec('python3 -c "import faster_whisper"', (error) => {
                resolve(!error);
            });
        });
    }

    /**
     * Check if openai-whisper is installed
     */
    private async checkOpenAIWhisper(): Promise<boolean> {
        return new Promise((resolve) => {
            exec('whisper --help', (error) => {
                resolve(!error);
            });
        });
    }

    /**
     * Transcribe an audio file
     */
    async transcribe(
        audioPath: string,
        options: WhisperOptions = {}
    ): Promise<TranscriptionResult> {
        if (this.isProcessing) {
            throw new Error('Transcription already in progress');
        }

        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found: ${audioPath}`);
        }

        const initialized = await this.initialize();
        if (!initialized) {
            throw new Error(
                'Whisper is not installed. Please install whisper.cpp or faster-whisper.'
            );
        }

        this.isProcessing = true;

        try {
            const model = options.model || 'base';
            const language = options.language || 'auto';
            const outputFormat = options.outputFormat || 'json';

            // Try faster-whisper first (fastest)
            if (this.whisperPath === 'faster-whisper') {
                return await this.transcribeWithFasterWhisper(audioPath, model, language);
            }

            // Try whisper CLI
            if (this.whisperPath === 'whisper') {
                return await this.transcribeWithWhisperCLI(audioPath, model, language, outputFormat);
            }

            // Use whisper.cpp
            return await this.transcribeWithWhisperCpp(audioPath, model, language);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Transcribe using faster-whisper (Python)
     */
    private async transcribeWithFasterWhisper(
        audioPath: string,
        model: string,
        language: string
    ): Promise<TranscriptionResult> {
        const script = `
import json
from faster_whisper import WhisperModel

model = WhisperModel("${model}", device="cpu", compute_type="int8")
segments, info = model.transcribe("${audioPath.replace(/\\/g, '\\\\')}"${language !== 'auto' ? `, language="${language}"` : ''})

result = {
    "text": "",
    "segments": [],
    "language": info.language,
    "duration": info.duration
}

for segment in segments:
    result["text"] += segment.text + " "
    result["segments"].append({
        "id": segment.id,
        "start": segment.start,
        "end": segment.end,
        "text": segment.text.strip()
    })

print(json.dumps(result))
`;

        return new Promise((resolve, reject) => {
            const process = spawn('python3', ['-c', script]);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0 && stdout) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Failed to parse output: ${stdout}`));
                    }
                } else {
                    reject(new Error(`Transcription failed: ${stderr}`));
                }
            });
        });
    }

    /**
     * Transcribe using whisper CLI (openai-whisper)
     */
    private async transcribeWithWhisperCLI(
        audioPath: string,
        model: string,
        language: string,
        outputFormat: string
    ): Promise<TranscriptionResult> {
        const outputDir = path.dirname(audioPath);
        const outputName = path.basename(audioPath, path.extname(audioPath));

        const args = [
            audioPath,
            '--model', model,
            '--output_dir', outputDir,
            '--output_format', 'json',
        ];

        if (language !== 'auto') {
            args.push('--language', language);
        }

        return new Promise((resolve, reject) => {
            const process = spawn('whisper', args);
            let stderr = '';

            process.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log('Whisper:', data.toString());
            });

            process.on('close', (code) => {
                if (code === 0) {
                    // Read the JSON output file
                    const jsonPath = path.join(outputDir, `${outputName}.json`);
                    if (fs.existsSync(jsonPath)) {
                        try {
                            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                            resolve({
                                text: data.text || '',
                                segments: data.segments || [],
                                language: data.language || 'en',
                                duration: data.segments?.length > 0
                                    ? data.segments[data.segments.length - 1].end
                                    : 0,
                            });
                        } catch (e) {
                            reject(new Error(`Failed to read transcription output`));
                        }
                    } else {
                        reject(new Error('Transcription output file not found'));
                    }
                } else {
                    reject(new Error(`Whisper exited with code ${code}: ${stderr}`));
                }
            });
        });
    }

    /**
     * Transcribe using whisper.cpp
     */
    private async transcribeWithWhisperCpp(
        audioPath: string,
        model: string,
        language: string
    ): Promise<TranscriptionResult> {
        // First convert to WAV if needed (whisper.cpp requires 16kHz WAV)
        const wavPath = await this.convertToWav(audioPath);
        const modelPath = path.join(this.modelsPath, `ggml-${model}.bin`);

        if (!fs.existsSync(modelPath)) {
            throw new Error(
                `Model not found: ${modelPath}. Download from https://huggingface.co/ggerganov/whisper.cpp`
            );
        }

        const args = [
            '-m', modelPath,
            '-f', wavPath,
            '-oj', // Output JSON
        ];

        if (language !== 'auto') {
            args.push('-l', language);
        }

        return new Promise((resolve, reject) => {
            const process = spawn(this.whisperPath!, args);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                // Clean up temp WAV file
                if (wavPath !== audioPath && fs.existsSync(wavPath)) {
                    fs.unlinkSync(wavPath);
                }

                if (code === 0 && stdout) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve({
                            text: result.transcription?.map((s: any) => s.text).join(' ') || '',
                            segments: result.transcription || [],
                            language: language !== 'auto' ? language : 'en',
                            duration: 0,
                        });
                    } catch (e) {
                        // Try parsing as plain text
                        resolve({
                            text: stdout.trim(),
                            segments: [{ id: 0, start: 0, end: 0, text: stdout.trim() }],
                            language: 'en',
                            duration: 0,
                        });
                    }
                } else {
                    reject(new Error(`whisper.cpp failed: ${stderr}`));
                }
            });
        });
    }

    /**
     * Convert audio to 16kHz WAV for whisper.cpp
     */
    private async convertToWav(inputPath: string): Promise<string> {
        if (inputPath.endsWith('.wav')) {
            return inputPath;
        }

        const outputPath = inputPath.replace(/\.[^.]+$/, '_converted.wav');

        return new Promise((resolve, reject) => {
            const args = [
                '-i', inputPath,
                '-ar', '16000',
                '-ac', '1',
                '-c:a', 'pcm_s16le',
                '-y',
                outputPath,
            ];

            const process = spawn('ffmpeg', args);

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Failed to convert audio to WAV'));
                }
            });
        });
    }

    /**
     * Get installation instructions
     */
    getInstallInstructions(): string {
        const platform = os.platform();

        if (platform === 'linux') {
            return `
Install faster-whisper (recommended):
  pip3 install faster-whisper

Or install openai-whisper:
  pip3 install openai-whisper

Or build whisper.cpp:
  git clone https://github.com/ggerganov/whisper.cpp
  cd whisper.cpp
  make
  # Download model:
  bash ./models/download-ggml-model.sh base
      `;
        } else if (platform === 'win32') {
            return `
Install faster-whisper (recommended):
  pip install faster-whisper

Or install openai-whisper:
  pip install openai-whisper

Or download whisper.cpp:
  https://github.com/ggerganov/whisper.cpp/releases
      `;
        }
        return '';
    }
}

export const whisperService = new WhisperService();
export default WhisperService;
