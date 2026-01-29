/**
 * Cloud AI Service
 * Uses OpenAI API for transcription (Whisper) and summarization (GPT-4o-mini)
 * Zero local dependencies - everything runs in the cloud
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import OpenAI from 'openai';
import * as fs from 'fs';
var CloudAIService = /** @class */ (function () {
    function CloudAIService() {
        this.client = null;
        this.config = null;
    }
    /**
     * Initialize with API key
     */
    CloudAIService.prototype.initialize = function (config) {
        this.config = __assign({ transcriptionModel: 'whisper-1', summarizationModel: 'gpt-4o-mini' }, config);
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
    };
    /**
     * Check if service is configured
     */
    CloudAIService.prototype.isConfigured = function () {
        return this.client !== null && this.config !== null;
    };
    /**
     * Validate API key
     */
    CloudAIService.prototype.validateApiKey = function (apiKey) {
        return __awaiter(this, void 0, void 0, function () {
            var testClient, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        testClient = new OpenAI({ apiKey: apiKey });
                        return [4 /*yield*/, testClient.models.list()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transcribe audio file using OpenAI Whisper API
     */
    CloudAIService.prototype.transcribe = function (audioPath) {
        return __awaiter(this, void 0, void 0, function () {
            var audioFile, transcription, segments, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.client) {
                            throw new Error('CloudAI not initialized. Please set your API key in Settings.');
                        }
                        if (!fs.existsSync(audioPath)) {
                            throw new Error("Audio file not found: ".concat(audioPath));
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        audioFile = fs.createReadStream(audioPath);
                        return [4 /*yield*/, this.client.audio.transcriptions.create({
                                file: audioFile,
                                model: this.config.transcriptionModel || 'whisper-1',
                                response_format: 'verbose_json',
                                timestamp_granularities: ['segment'],
                            })];
                    case 2:
                        transcription = _b.sent();
                        segments = ((_a = transcription.segments) === null || _a === void 0 ? void 0 : _a.map(function (seg, idx) {
                            var _a;
                            return ({
                                id: idx,
                                start: seg.start || 0,
                                end: seg.end || 0,
                                text: ((_a = seg.text) === null || _a === void 0 ? void 0 : _a.trim()) || '',
                            });
                        })) || [];
                        return [2 /*return*/, {
                                text: transcription.text,
                                segments: segments,
                                language: transcription.language || 'en',
                                duration: transcription.duration || 0,
                            }];
                    case 3:
                        error_2 = _b.sent();
                        console.error('Transcription error:', error_2);
                        throw new Error("Transcription failed: ".concat(error_2.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate meeting summary using GPT
     */
    CloudAIService.prototype.summarize = function (transcript) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, responseText, result, error_3;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.client) {
                            throw new Error('CloudAI not initialized. Please set your API key in Settings.');
                        }
                        prompt = "You are an AI meeting assistant. Analyze the following meeting transcript and provide a structured summary.\n\nMEETING TRANSCRIPT:\n".concat(transcript, "\n\nPlease provide your response in the following exact JSON format:\n{\n  \"summary\": \"2-3 paragraph summary of the meeting\",\n  \"keyPoints\": [\"Key point 1\", \"Key point 2\", \"Key point 3\"],\n  \"actionItems\": [\"Action item 1 with owner if mentioned\", \"Action item 2\"],\n  \"decisions\": [\"Decision 1\", \"Decision 2\"]\n}\n\nIf any section has no items, use an empty array []. Return ONLY valid JSON, no other text.");
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.chat.completions.create({
                                model: this.config.summarizationModel || 'gpt-4o-mini',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are a professional meeting assistant. Always respond with valid JSON only.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.7,
                                max_tokens: 2000,
                            })];
                    case 2:
                        completion = _c.sent();
                        responseText = ((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
                        // Parse JSON response
                        try {
                            result = JSON.parse(responseText);
                            return [2 /*return*/, {
                                    summary: result.summary || '',
                                    actionItems: result.actionItems || [],
                                    keyPoints: result.keyPoints || [],
                                    decisions: result.decisions || [],
                                }];
                        }
                        catch (parseError) {
                            // If JSON parsing fails, return raw text as summary
                            return [2 /*return*/, {
                                    summary: responseText,
                                    actionItems: [],
                                    keyPoints: [],
                                    decisions: [],
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _c.sent();
                        console.error('Summarization error:', error_3);
                        throw new Error("Summarization failed: ".concat(error_3.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get pricing info
     */
    CloudAIService.prototype.getPricingInfo = function () {
        return "\nOpenAI API Pricing (approximate):\n\nWhisper Transcription:\n  \u2022 $0.006 per minute of audio\n\nGPT-4o-mini Summarization:\n  \u2022 ~$0.01 per meeting summary\n\nExample: A 30-minute meeting costs approximately:\n  \u2022 Transcription: $0.18\n  \u2022 Summary: $0.01\n  \u2022 Total: ~$0.19\n\nGet your API key at: https://platform.openai.com/api-keys\n    ";
    };
    /**
     * Get models info
     */
    CloudAIService.prototype.getAvailableModels = function () {
        return {
            transcription: ['whisper-1'],
            summarization: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
        };
    };
    return CloudAIService;
}());
export var cloudAIService = new CloudAIService();
export default CloudAIService;
