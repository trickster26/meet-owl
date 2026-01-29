/**
 * Whisper transcription service
 * Uses whisper.cpp or faster-whisper for local transcription
 * Falls back to OpenAI Whisper API if configured
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
import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
var WhisperService = /** @class */ (function () {
    function WhisperService() {
        this.whisperPath = null;
        this.isProcessing = false;
        this.platform = os.platform();
        this.modelsPath = path.join(os.homedir(), '.meetnotes', 'models');
    }
    /**
     * Initialize Whisper - check for installation
     */
    WhisperService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var whisperCppPath, hasFasterWhisper, hasOpenAIWhisper;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findWhisperCpp()];
                    case 1:
                        whisperCppPath = _a.sent();
                        if (whisperCppPath) {
                            this.whisperPath = whisperCppPath;
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, this.checkFasterWhisper()];
                    case 2:
                        hasFasterWhisper = _a.sent();
                        if (hasFasterWhisper) {
                            this.whisperPath = 'faster-whisper';
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, this.checkOpenAIWhisper()];
                    case 3:
                        hasOpenAIWhisper = _a.sent();
                        if (hasOpenAIWhisper) {
                            this.whisperPath = 'whisper';
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Find whisper.cpp binary
     */
    WhisperService.prototype.findWhisperCpp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var possiblePaths, _i, possiblePaths_1, p;
            return __generator(this, function (_a) {
                possiblePaths = [
                    '/usr/local/bin/whisper',
                    '/usr/bin/whisper',
                    path.join(os.homedir(), '.local', 'bin', 'whisper'),
                    path.join(os.homedir(), '.meetnotes', 'whisper', 'main'),
                ];
                if (this.platform === 'win32') {
                    possiblePaths.push('C:\\Program Files\\Whisper\\whisper.exe', path.join(os.homedir(), 'whisper.cpp', 'main.exe'));
                }
                for (_i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
                    p = possiblePaths_1[_i];
                    if (fs.existsSync(p)) {
                        return [2 /*return*/, p];
                    }
                }
                return [2 /*return*/, null];
            });
        });
    };
    /**
     * Check if faster-whisper is installed
     */
    WhisperService.prototype.checkFasterWhisper = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        exec('python3 -c "import faster_whisper"', function (error) {
                            resolve(!error);
                        });
                    })];
            });
        });
    };
    /**
     * Check if openai-whisper is installed
     */
    WhisperService.prototype.checkOpenAIWhisper = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        exec('whisper --help', function (error) {
                            resolve(!error);
                        });
                    })];
            });
        });
    };
    /**
     * Transcribe an audio file
     */
    WhisperService.prototype.transcribe = function (audioPath_1) {
        return __awaiter(this, arguments, void 0, function (audioPath, options) {
            var initialized, model, language, outputFormat;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isProcessing) {
                            throw new Error('Transcription already in progress');
                        }
                        if (!fs.existsSync(audioPath)) {
                            throw new Error("Audio file not found: ".concat(audioPath));
                        }
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        initialized = _a.sent();
                        if (!initialized) {
                            throw new Error('Whisper is not installed. Please install whisper.cpp or faster-whisper.');
                        }
                        this.isProcessing = true;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 8, 9]);
                        model = options.model || 'base';
                        language = options.language || 'auto';
                        outputFormat = options.outputFormat || 'json';
                        if (!(this.whisperPath === 'faster-whisper')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.transcribeWithFasterWhisper(audioPath, model, language)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        if (!(this.whisperPath === 'whisper')) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.transcribeWithWhisperCLI(audioPath, model, language, outputFormat)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6: return [4 /*yield*/, this.transcribeWithWhisperCpp(audioPath, model, language)];
                    case 7: 
                    // Use whisper.cpp
                    return [2 /*return*/, _a.sent()];
                    case 8:
                        this.isProcessing = false;
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transcribe using faster-whisper (Python)
     */
    WhisperService.prototype.transcribeWithFasterWhisper = function (audioPath, model, language) {
        return __awaiter(this, void 0, void 0, function () {
            var script;
            return __generator(this, function (_a) {
                script = "\nimport json\nfrom faster_whisper import WhisperModel\n\nmodel = WhisperModel(\"".concat(model, "\", device=\"cpu\", compute_type=\"int8\")\nsegments, info = model.transcribe(\"").concat(audioPath.replace(/\\/g, '\\\\'), "\"").concat(language !== 'auto' ? ", language=\"".concat(language, "\"") : '', ")\n\nresult = {\n    \"text\": \"\",\n    \"segments\": [],\n    \"language\": info.language,\n    \"duration\": info.duration\n}\n\nfor segment in segments:\n    result[\"text\"] += segment.text + \" \"\n    result[\"segments\"].append({\n        \"id\": segment.id,\n        \"start\": segment.start,\n        \"end\": segment.end,\n        \"text\": segment.text.strip()\n    })\n\nprint(json.dumps(result))\n");
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var process = spawn('python3', ['-c', script]);
                        var stdout = '';
                        var stderr = '';
                        process.stdout.on('data', function (data) {
                            stdout += data.toString();
                        });
                        process.stderr.on('data', function (data) {
                            stderr += data.toString();
                        });
                        process.on('close', function (code) {
                            if (code === 0 && stdout) {
                                try {
                                    var result = JSON.parse(stdout);
                                    resolve(result);
                                }
                                catch (e) {
                                    reject(new Error("Failed to parse output: ".concat(stdout)));
                                }
                            }
                            else {
                                reject(new Error("Transcription failed: ".concat(stderr)));
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Transcribe using whisper CLI (openai-whisper)
     */
    WhisperService.prototype.transcribeWithWhisperCLI = function (audioPath, model, language, outputFormat) {
        return __awaiter(this, void 0, void 0, function () {
            var outputDir, outputName, args;
            return __generator(this, function (_a) {
                outputDir = path.dirname(audioPath);
                outputName = path.basename(audioPath, path.extname(audioPath));
                args = [
                    audioPath,
                    '--model', model,
                    '--output_dir', outputDir,
                    '--output_format', 'json',
                ];
                if (language !== 'auto') {
                    args.push('--language', language);
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var process = spawn('whisper', args);
                        var stderr = '';
                        process.stderr.on('data', function (data) {
                            stderr += data.toString();
                            console.log('Whisper:', data.toString());
                        });
                        process.on('close', function (code) {
                            var _a;
                            if (code === 0) {
                                // Read the JSON output file
                                var jsonPath = path.join(outputDir, "".concat(outputName, ".json"));
                                if (fs.existsSync(jsonPath)) {
                                    try {
                                        var data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                                        resolve({
                                            text: data.text || '',
                                            segments: data.segments || [],
                                            language: data.language || 'en',
                                            duration: ((_a = data.segments) === null || _a === void 0 ? void 0 : _a.length) > 0
                                                ? data.segments[data.segments.length - 1].end
                                                : 0,
                                        });
                                    }
                                    catch (e) {
                                        reject(new Error("Failed to read transcription output"));
                                    }
                                }
                                else {
                                    reject(new Error('Transcription output file not found'));
                                }
                            }
                            else {
                                reject(new Error("Whisper exited with code ".concat(code, ": ").concat(stderr)));
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Transcribe using whisper.cpp
     */
    WhisperService.prototype.transcribeWithWhisperCpp = function (audioPath, model, language) {
        return __awaiter(this, void 0, void 0, function () {
            var wavPath, modelPath, args;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.convertToWav(audioPath)];
                    case 1:
                        wavPath = _a.sent();
                        modelPath = path.join(this.modelsPath, "ggml-".concat(model, ".bin"));
                        if (!fs.existsSync(modelPath)) {
                            throw new Error("Model not found: ".concat(modelPath, ". Download from https://huggingface.co/ggerganov/whisper.cpp"));
                        }
                        args = [
                            '-m', modelPath,
                            '-f', wavPath,
                            '-oj', // Output JSON
                        ];
                        if (language !== 'auto') {
                            args.push('-l', language);
                        }
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var process = spawn(_this.whisperPath, args);
                                var stdout = '';
                                var stderr = '';
                                process.stdout.on('data', function (data) {
                                    stdout += data.toString();
                                });
                                process.stderr.on('data', function (data) {
                                    stderr += data.toString();
                                });
                                process.on('close', function (code) {
                                    var _a;
                                    // Clean up temp WAV file
                                    if (wavPath !== audioPath && fs.existsSync(wavPath)) {
                                        fs.unlinkSync(wavPath);
                                    }
                                    if (code === 0 && stdout) {
                                        try {
                                            var result = JSON.parse(stdout);
                                            resolve({
                                                text: ((_a = result.transcription) === null || _a === void 0 ? void 0 : _a.map(function (s) { return s.text; }).join(' ')) || '',
                                                segments: result.transcription || [],
                                                language: language !== 'auto' ? language : 'en',
                                                duration: 0,
                                            });
                                        }
                                        catch (e) {
                                            // Try parsing as plain text
                                            resolve({
                                                text: stdout.trim(),
                                                segments: [{ id: 0, start: 0, end: 0, text: stdout.trim() }],
                                                language: 'en',
                                                duration: 0,
                                            });
                                        }
                                    }
                                    else {
                                        reject(new Error("whisper.cpp failed: ".concat(stderr)));
                                    }
                                });
                            })];
                }
            });
        });
    };
    /**
     * Convert audio to 16kHz WAV for whisper.cpp
     */
    WhisperService.prototype.convertToWav = function (inputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var outputPath;
            return __generator(this, function (_a) {
                if (inputPath.endsWith('.wav')) {
                    return [2 /*return*/, inputPath];
                }
                outputPath = inputPath.replace(/\.[^.]+$/, '_converted.wav');
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var args = [
                            '-i', inputPath,
                            '-ar', '16000',
                            '-ac', '1',
                            '-c:a', 'pcm_s16le',
                            '-y',
                            outputPath,
                        ];
                        var process = spawn('ffmpeg', args);
                        process.on('close', function (code) {
                            if (code === 0) {
                                resolve(outputPath);
                            }
                            else {
                                reject(new Error('Failed to convert audio to WAV'));
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Get installation instructions
     */
    WhisperService.prototype.getInstallInstructions = function () {
        var platform = os.platform();
        if (platform === 'linux') {
            return "\nInstall faster-whisper (recommended):\n  pip3 install faster-whisper\n\nOr install openai-whisper:\n  pip3 install openai-whisper\n\nOr build whisper.cpp:\n  git clone https://github.com/ggerganov/whisper.cpp\n  cd whisper.cpp\n  make\n  # Download model:\n  bash ./models/download-ggml-model.sh base\n      ";
        }
        else if (platform === 'win32') {
            return "\nInstall faster-whisper (recommended):\n  pip install faster-whisper\n\nOr install openai-whisper:\n  pip install openai-whisper\n\nOr download whisper.cpp:\n  https://github.com/ggerganov/whisper.cpp/releases\n      ";
        }
        return '';
    };
    return WhisperService;
}());
export var whisperService = new WhisperService();
export default WhisperService;
