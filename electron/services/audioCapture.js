/**
 * Cross-platform audio capture service
 * Supports Windows (WASAPI) and Linux (PulseAudio/PipeWire)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { desktopCapturer } from 'electron';
import { exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
var AudioCaptureService = /** @class */ (function () {
    function AudioCaptureService() {
        this.ffmpegProcess = null;
        this.isRecording = false;
        this.outputPath = '';
        this.platform = os.platform();
    }
    /**
     * Get available audio sources based on platform
     */
    AudioCaptureService.prototype.getAudioSources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sources, desktopSources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sources = [];
                        return [4 /*yield*/, desktopCapturer.getSources({
                                types: ['screen', 'window'],
                                fetchWindowIcons: false,
                            })];
                    case 1:
                        desktopSources = _a.sent();
                        desktopSources.forEach(function (source) {
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
                        }
                        else if (this.platform === 'win32') {
                            // Windows WASAPI loopback
                            sources.push({
                                id: 'wasapi-loopback',
                                name: 'System Audio (Windows)',
                                type: 'audio',
                            });
                        }
                        return [2 /*return*/, sources];
                }
            });
        });
    };
    /**
     * Check if FFmpeg is available
     */
    AudioCaptureService.prototype.checkFFmpeg = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        exec('ffmpeg -version', function (error) {
                            resolve(!error);
                        });
                    })];
            });
        });
    };
    /**
     * Get FFmpeg input device based on platform
     */
    AudioCaptureService.prototype.getFFmpegAudioInput = function () {
        if (this.platform === 'linux') {
            // For Linux with PulseAudio/PipeWire
            // Use the default monitor (captures all system audio)
            return {
                format: 'pulse',
                device: 'default', // Will capture from default output monitor
            };
        }
        else if (this.platform === 'win32') {
            // For Windows with DirectShow/WASAPI
            return {
                format: 'dshow',
                device: 'audio="Stereo Mix"', // Common name, may vary
            };
        }
        else if (this.platform === 'darwin') {
            // macOS requires additional setup (BlackHole, etc.)
            return {
                format: 'avfoundation',
                device: ':0', // Default audio input
            };
        }
        throw new Error("Unsupported platform: ".concat(this.platform));
    };
    /**
     * Start recording system audio using FFmpeg
     */
    AudioCaptureService.prototype.startRecording = function (outputDir_1) {
        return __awaiter(this, arguments, void 0, function (outputDir, options) {
            var hasFFmpeg, timestamp, format, filename, audioInput, args;
            var _this = this;
            var _a;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.isRecording) {
                            throw new Error('Recording already in progress');
                        }
                        return [4 /*yield*/, this.checkFFmpeg()];
                    case 1:
                        hasFFmpeg = _b.sent();
                        if (!hasFFmpeg) {
                            throw new Error('FFmpeg is not installed. Please install FFmpeg to enable audio recording.');
                        }
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        format = options.format || 'webm';
                        filename = "meeting-".concat(timestamp, ".").concat(format);
                        this.outputPath = path.join(outputDir, filename);
                        audioInput = this.getFFmpegAudioInput();
                        args = [
                            '-y', // Overwrite output file
                        ];
                        if (this.platform === 'linux') {
                            // Linux PulseAudio capture
                            args.push('-f', 'pulse', '-i', 'default', '-ac', String(options.channels || 2), '-ar', String(options.sampleRate || 44100));
                        }
                        else if (this.platform === 'win32') {
                            // Windows DirectShow capture
                            args.push('-f', 'dshow', '-i', 'audio=Stereo Mix', '-ac', String(options.channels || 2), '-ar', String(options.sampleRate || 44100));
                        }
                        // Output format
                        if (format === 'webm') {
                            args.push('-c:a', 'libopus');
                        }
                        else if (format === 'mp3') {
                            args.push('-c:a', 'libmp3lame', '-b:a', '192k');
                        }
                        else {
                            args.push('-c:a', 'pcm_s16le');
                        }
                        args.push(this.outputPath);
                        console.log('Starting FFmpeg with args:', args.join(' '));
                        this.ffmpegProcess = spawn('ffmpeg', args, {
                            stdio: ['pipe', 'pipe', 'pipe'],
                        });
                        (_a = this.ffmpegProcess.stderr) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                            console.log('FFmpeg:', data.toString());
                        });
                        this.ffmpegProcess.on('error', function (error) {
                            console.error('FFmpeg error:', error);
                            _this.isRecording = false;
                        });
                        this.ffmpegProcess.on('close', function (code) {
                            console.log('FFmpeg process closed with code:', code);
                            _this.isRecording = false;
                        });
                        this.isRecording = true;
                        return [2 /*return*/, this.outputPath];
                }
            });
        });
    };
    /**
     * Stop recording
     */
    AudioCaptureService.prototype.stopRecording = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.isRecording || !this.ffmpegProcess) {
                    throw new Error('No recording in progress');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var _a;
                        // Send 'q' to FFmpeg to gracefully stop
                        (_a = _this.ffmpegProcess.stdin) === null || _a === void 0 ? void 0 : _a.write('q');
                        var timeout = setTimeout(function () {
                            if (_this.ffmpegProcess) {
                                _this.ffmpegProcess.kill('SIGTERM');
                            }
                        }, 5000);
                        _this.ffmpegProcess.on('close', function () {
                            clearTimeout(timeout);
                            _this.isRecording = false;
                            _this.ffmpegProcess = null;
                            if (fs.existsSync(_this.outputPath)) {
                                resolve(_this.outputPath);
                            }
                            else {
                                reject(new Error('Recording file was not created'));
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Check recording status
     */
    AudioCaptureService.prototype.getStatus = function () {
        return {
            isRecording: this.isRecording,
            outputPath: this.outputPath,
        };
    };
    /**
     * Get platform-specific instructions for audio setup
     */
    AudioCaptureService.prototype.getSetupInstructions = function () {
        if (this.platform === 'linux') {
            return "\nLinux Audio Setup:\n1. Ensure PulseAudio or PipeWire is running\n2. Install FFmpeg: sudo apt install ffmpeg\n3. To capture system audio, you may need to configure a monitor source:\n   - Run: pactl list short sources\n   - Look for a source ending with \".monitor\"\n   - Or use pavucontrol to configure recording sources\n      ";
        }
        else if (this.platform === 'win32') {
            return "\nWindows Audio Setup:\n1. Install FFmpeg and add to PATH\n2. Enable \"Stereo Mix\" in Sound settings:\n   - Right-click volume icon > Sounds\n   - Recording tab > Right-click > Show Disabled Devices\n   - Enable \"Stereo Mix\"\n3. If Stereo Mix is not available, install VB-Cable or similar virtual audio driver\n      ";
        }
        else if (this.platform === 'darwin') {
            return "\nmacOS Audio Setup:\n1. Install FFmpeg: brew install ffmpeg\n2. Install BlackHole audio driver: brew install blackhole-2ch\n3. Create a Multi-Output Device in Audio MIDI Setup\n4. Configure apps to use the Multi-Output Device\n      ";
        }
        return 'Unsupported platform';
    };
    return AudioCaptureService;
}());
export var audioCaptureService = new AudioCaptureService();
export default AudioCaptureService;
