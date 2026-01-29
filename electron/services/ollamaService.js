/**
 * Ollama LLM service for meeting summarization
 * Connects to local Ollama instance for AI-powered summarization
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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import * as http from 'http';
import * as https from 'https';
var OllamaService = /** @class */ (function () {
    function OllamaService(options) {
        if (options === void 0) { options = {}; }
        this.baseUrl = options.baseUrl || 'http://localhost:11434';
        this.model = options.model || 'llama3.2';
        this.temperature = options.temperature || 0.7;
        this.maxTokens = options.maxTokens || 2048;
    }
    /**
     * Check if Ollama is running
     */
    OllamaService.prototype.isAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/api/tags', 'GET')];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.models && response.models.length > 0];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get available models
     */
    OllamaService.prototype.getModels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/api/tags', 'GET')];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, ((_a = response.models) === null || _a === void 0 ? void 0 : _a.map(function (m) { return m.name; })) || []];
                    case 2:
                        error_2 = _b.sent();
                        console.error('Failed to get models:', error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set the model to use
     */
    OllamaService.prototype.setModel = function (model) {
        this.model = model;
    };
    /**
     * Generate a meeting summary from transcript
     */
    OllamaService.prototype.summarizeMeeting = function (transcript) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = this.buildSummaryPrompt(transcript);
                        return [4 /*yield*/, this.generate(prompt)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, this.parseSummaryResponse(response)];
                }
            });
        });
    };
    /**
     * Build the summarization prompt
     */
    OllamaService.prototype.buildSummaryPrompt = function (transcript) {
        return "You are an AI meeting assistant. Analyze the following meeting transcript and provide a structured summary.\n\nMEETING TRANSCRIPT:\n".concat(transcript, "\n\nPlease provide your response in the following exact format:\n\n## SUMMARY\n[2-3 paragraph summary of the meeting]\n\n## KEY POINTS\n- [Key point 1]\n- [Key point 2]\n- [Key point 3]\n\n## ACTION ITEMS\n- [Action item 1 with owner if mentioned]\n- [Action item 2 with owner if mentioned]\n\n## DECISIONS MADE\n- [Decision 1]\n- [Decision 2]\n\nIf any section has no items, write \"None identified.\"");
    };
    /**
     * Parse the LLM response into structured format
     */
    OllamaService.prototype.parseSummaryResponse = function (response) {
        var result = {
            summary: '',
            actionItems: [],
            keyPoints: [],
            decisions: [],
        };
        // Extract summary
        var summaryMatch = response.match(/## SUMMARY\n([\s\S]*?)(?=## KEY POINTS|## ACTION|$)/i);
        if (summaryMatch) {
            result.summary = summaryMatch[1].trim();
        }
        // Extract key points
        var keyPointsMatch = response.match(/## KEY POINTS\n([\s\S]*?)(?=## ACTION|## DECISIONS|$)/i);
        if (keyPointsMatch) {
            result.keyPoints = this.extractBulletPoints(keyPointsMatch[1]);
        }
        // Extract action items
        var actionMatch = response.match(/## ACTION ITEMS\n([\s\S]*?)(?=## DECISIONS|$)/i);
        if (actionMatch) {
            result.actionItems = this.extractBulletPoints(actionMatch[1]);
        }
        // Extract decisions
        var decisionsMatch = response.match(/## DECISIONS MADE\n([\s\S]*?)$/i);
        if (decisionsMatch) {
            result.decisions = this.extractBulletPoints(decisionsMatch[1]);
        }
        // If parsing failed, return raw response as summary
        if (!result.summary && response) {
            result.summary = response;
        }
        return result;
    };
    /**
     * Extract bullet points from text
     */
    OllamaService.prototype.extractBulletPoints = function (text) {
        var lines = text.split('\n');
        var points = [];
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            var trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                var point = trimmed.replace(/^[-•*]\s*/, '').trim();
                if (point && point.toLowerCase() !== 'none identified.' && point.toLowerCase() !== 'none') {
                    points.push(point);
                }
            }
        }
        return points;
    };
    /**
     * Generate response from Ollama
     */
    OllamaService.prototype.generate = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            model: this.model,
                            prompt: prompt,
                            stream: false,
                            options: {
                                temperature: this.temperature,
                                num_predict: this.maxTokens,
                            },
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest('/api/generate', 'POST', payload)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.response || ''];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Ollama generation failed:', error_3);
                        throw new Error("Failed to generate summary: ".concat(error_3));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stream generation (for real-time output)
     */
    OllamaService.prototype.generateStream = function (prompt) {
        return __asyncGenerator(this, arguments, function generateStream_1() {
            var payload, url, isHttps, httpModule, options;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            model: this.model,
                            prompt: prompt,
                            stream: true,
                            options: {
                                temperature: this.temperature,
                                num_predict: this.maxTokens,
                            },
                        };
                        url = new URL('/api/generate', this.baseUrl);
                        isHttps = url.protocol === 'https:';
                        httpModule = isHttps ? https : http;
                        options = {
                            hostname: url.hostname,
                            port: url.port || (isHttps ? 443 : 80),
                            path: url.pathname,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        };
                        return [4 /*yield*/, __await(new Promise(function (resolve, reject) {
                                var req = httpModule.request(options, function (res) {
                                    var buffer = '';
                                    res.on('data', function (chunk) {
                                        buffer += chunk.toString();
                                        var lines = buffer.split('\n');
                                        buffer = lines.pop() || '';
                                        for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                                            var line = lines_2[_i];
                                            if (line.trim()) {
                                                try {
                                                    var json = JSON.parse(line);
                                                    if (json.response) {
                                                        // Note: This won't work with AsyncGenerator pattern easily
                                                        // Consider using callbacks or events for streaming
                                                    }
                                                }
                                                catch (e) {
                                                    // Ignore parse errors
                                                }
                                            }
                                        }
                                    });
                                    res.on('end', function () {
                                        resolve();
                                    });
                                });
                                req.on('error', reject);
                                req.write(JSON.stringify(payload));
                                req.end();
                            }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Make HTTP request to Ollama
     */
    OllamaService.prototype.makeRequest = function (path, method, body) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var url = new URL(path, _this.baseUrl);
            var isHttps = url.protocol === 'https:';
            var httpModule = isHttps ? https : http;
            var options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            var req = httpModule.request(options, function (res) {
                var data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    try {
                        var json = JSON.parse(data);
                        resolve(json);
                    }
                    catch (e) {
                        resolve({ response: data });
                    }
                });
            });
            req.on('error', function (error) {
                reject(error);
            });
            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    };
    /**
     * Get installation instructions
     */
    OllamaService.prototype.getInstallInstructions = function () {
        return "\nInstall Ollama:\n\nLinux:\n  curl -fsSL https://ollama.com/install.sh | sh\n\nWindows:\n  Download from https://ollama.com/download/windows\n\nAfter installation, pull a model:\n  ollama pull llama3.2\n\nOr for smaller/faster models:\n  ollama pull mistral\n  ollama pull gemma2\n\nStart Ollama service:\n  ollama serve\n    ";
    };
    return OllamaService;
}());
export var ollamaService = new OllamaService();
export default OllamaService;
