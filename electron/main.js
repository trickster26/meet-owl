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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { audioCaptureService } from './services/audioCapture';
import { whisperService } from './services/whisperService';
import { ollamaService } from './services/ollamaService';
import { cloudAIService } from './services/cloudAIService';
import { databaseService } from './services/databaseService';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
    if (require('electron-squirrel-startup')) {
        app.quit();
    }
}
catch (e) {
    // electron-squirrel-startup not installed
}
var mainWindow = null;
var isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
// Ensure directories exist
var recordingsPath = path.join(app.getPath('userData'), 'recordings');
var transcriptsPath = path.join(app.getPath('userData'), 'transcripts');
var modelsPath = path.join(app.getPath('userData'), 'models');
var configPath = path.join(app.getPath('userData'), 'config.json');
[recordingsPath, transcriptsPath, modelsPath].forEach(function (dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    }
    catch (e) {
        console.error('Error loading config:', e);
    }
    return {
        aiMode: 'cloud',
        whisperModel: 'whisper-1',
        summarizationModel: 'gpt-4o-mini',
    };
}
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
var appConfig = loadConfig();
// Initialize cloud AI if API key is set
if (appConfig.openaiApiKey) {
    cloudAIService.initialize({ apiKey: appConfig.openaiApiKey });
}
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            // Allow external connections for HuggingFace model downloads
            webSecurity: !isDev, // Disable in dev, enable in production
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#1a1a2e',
        show: false,
    });
    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', function () {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
app.whenReady().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Initialize database
            return [4 /*yield*/, databaseService.initialize()];
            case 1:
                // Initialize database
                _a.sent();
                createWindow();
                app.on('activate', function () {
                    if (BrowserWindow.getAllWindows().length === 0) {
                        createWindow();
                    }
                });
                return [2 /*return*/];
        }
    });
}); });
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// ==================== IPC Handlers ====================
// ----- Config -----
ipcMain.handle('get-config', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, __assign(__assign({}, appConfig), { openaiApiKey: appConfig.openaiApiKey ? '••••••••' + appConfig.openaiApiKey.slice(-4) : '', hasApiKey: !!appConfig.openaiApiKey })];
    });
}); });
ipcMain.handle('set-api-key', function (_, apiKey) { return __awaiter(void 0, void 0, void 0, function () {
    var isValid, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, cloudAIService.validateApiKey(apiKey)];
            case 1:
                isValid = _a.sent();
                if (!isValid) {
                    return [2 /*return*/, { success: false, error: 'Invalid API key' }];
                }
                appConfig.openaiApiKey = apiKey;
                saveConfig(appConfig);
                cloudAIService.initialize({ apiKey: apiKey });
                return [2 /*return*/, { success: true }];
            case 2:
                error_1 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_1) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('set-ai-mode', function (_, mode) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        appConfig.aiMode = mode;
        saveConfig(appConfig);
        return [2 /*return*/, { success: true }];
    });
}); });
// ----- Audio Sources -----
ipcMain.handle('get-audio-sources', function () { return __awaiter(void 0, void 0, void 0, function () {
    var sources, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, audioCaptureService.getAudioSources()];
            case 1:
                sources = _a.sent();
                return [2 /*return*/, sources];
            case 2:
                error_2 = _a.sent();
                console.error('Error getting audio sources:', error_2);
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ----- Recording -----
ipcMain.handle('start-recording', function () { return __awaiter(void 0, void 0, void 0, function () {
    var outputPath, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, audioCaptureService.startRecording(recordingsPath)];
            case 1:
                outputPath = _a.sent();
                return [2 /*return*/, { success: true, path: outputPath }];
            case 2:
                error_3 = _a.sent();
                console.error('Error starting recording:', error_3);
                return [2 /*return*/, { success: false, error: String(error_3) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('stop-recording', function () { return __awaiter(void 0, void 0, void 0, function () {
    var outputPath, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, audioCaptureService.stopRecording()];
            case 1:
                outputPath = _a.sent();
                return [2 /*return*/, { success: true, path: outputPath }];
            case 2:
                error_4 = _a.sent();
                console.error('Error stopping recording:', error_4);
                return [2 /*return*/, { success: false, error: String(error_4) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('get-recording-status', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, audioCaptureService.getStatus()];
    });
}); });
// ----- File Management -----
ipcMain.handle('save-recording', function (_, buffer, filename) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath;
    return __generator(this, function (_a) {
        try {
            filePath = path.join(recordingsPath, filename);
            fs.writeFileSync(filePath, Buffer.from(buffer));
            return [2 /*return*/, { success: true, path: filePath }];
        }
        catch (error) {
            console.error('Error saving recording:', error);
            return [2 /*return*/, { success: false, error: String(error) }];
        }
        return [2 /*return*/];
    });
}); });
ipcMain.handle('save-transcript', function (_, transcript, filename) { return __awaiter(void 0, void 0, void 0, function () {
    var filePath;
    return __generator(this, function (_a) {
        try {
            filePath = path.join(transcriptsPath, filename);
            fs.writeFileSync(filePath, transcript);
            return [2 /*return*/, { success: true, path: filePath }];
        }
        catch (error) {
            console.error('Error saving transcript:', error);
            return [2 /*return*/, { success: false, error: String(error) }];
        }
        return [2 /*return*/];
    });
}); });
ipcMain.handle('get-recordings', function () { return __awaiter(void 0, void 0, void 0, function () {
    var files;
    return __generator(this, function (_a) {
        try {
            files = fs.readdirSync(recordingsPath);
            return [2 /*return*/, files
                    .filter(function (file) { return file.endsWith('.webm') || file.endsWith('.wav') || file.endsWith('.mp3'); })
                    .map(function (file) { return ({
                    name: file,
                    path: path.join(recordingsPath, file),
                    stats: fs.statSync(path.join(recordingsPath, file)),
                }); })];
        }
        catch (error) {
            console.error('Error getting recordings:', error);
            return [2 /*return*/, []];
        }
        return [2 /*return*/];
    });
}); });
ipcMain.handle('get-transcripts', function () { return __awaiter(void 0, void 0, void 0, function () {
    var files;
    return __generator(this, function (_a) {
        try {
            files = fs.readdirSync(transcriptsPath);
            return [2 /*return*/, files
                    .filter(function (file) { return file.endsWith('.json') || file.endsWith('.txt'); })
                    .map(function (file) { return ({
                    name: file,
                    path: path.join(transcriptsPath, file),
                    content: fs.readFileSync(path.join(transcriptsPath, file), 'utf-8'),
                }); })];
        }
        catch (error) {
            console.error('Error getting transcripts:', error);
            return [2 /*return*/, []];
        }
        return [2 /*return*/];
    });
}); });
// ----- Transcription (Cloud or Local) -----
ipcMain.handle('transcribe-audio', function (_1, audioPath_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([_1, audioPath_1], args_1, true), void 0, function (_, audioPath, options) {
        var result_1, result, error_5;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    if (!(appConfig.aiMode === 'cloud' && cloudAIService.isConfigured())) return [3 /*break*/, 2];
                    return [4 /*yield*/, cloudAIService.transcribe(audioPath)];
                case 1:
                    result_1 = _a.sent();
                    return [2 /*return*/, { success: true, result: result_1 }];
                case 2: return [4 /*yield*/, whisperService.transcribe(audioPath, options)];
                case 3:
                    result = _a.sent();
                    return [2 /*return*/, { success: true, result: result }];
                case 4:
                    error_5 = _a.sent();
                    console.error('Error transcribing:', error_5);
                    return [2 /*return*/, { success: false, error: String(error_5) }];
                case 5: return [2 /*return*/];
            }
        });
    });
});
ipcMain.handle('check-whisper', function () { return __awaiter(void 0, void 0, void 0, function () {
    var isAvailable;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // Cloud mode - always available if API key is set
                if (appConfig.aiMode === 'cloud') {
                    return [2 /*return*/, {
                            available: cloudAIService.isConfigured(),
                            mode: 'cloud',
                            instructions: cloudAIService.isConfigured()
                                ? 'Using OpenAI Whisper API'
                                : 'Please set your OpenAI API key in Settings',
                        }];
                }
                return [4 /*yield*/, whisperService.initialize()];
            case 1:
                isAvailable = _a.sent();
                return [2 /*return*/, {
                        available: isAvailable,
                        mode: 'local',
                        instructions: whisperService.getInstallInstructions(),
                    }];
        }
    });
}); });
// ----- Summarization (Cloud or Local) -----
ipcMain.handle('summarize-transcript', function (_, transcript) { return __awaiter(void 0, void 0, void 0, function () {
    var result_2, result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!(appConfig.aiMode === 'cloud' && cloudAIService.isConfigured())) return [3 /*break*/, 2];
                return [4 /*yield*/, cloudAIService.summarize(transcript)];
            case 1:
                result_2 = _a.sent();
                return [2 /*return*/, { success: true, result: result_2 }];
            case 2: return [4 /*yield*/, ollamaService.summarizeMeeting(transcript)];
            case 3:
                result = _a.sent();
                return [2 /*return*/, { success: true, result: result }];
            case 4:
                error_6 = _a.sent();
                console.error('Error summarizing:', error_6);
                return [2 /*return*/, { success: false, error: String(error_6) }];
            case 5: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('check-ollama', function () { return __awaiter(void 0, void 0, void 0, function () {
    var isAvailable, models, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // Cloud mode - always available if API key is set
                if (appConfig.aiMode === 'cloud') {
                    return [2 /*return*/, {
                            available: cloudAIService.isConfigured(),
                            mode: 'cloud',
                            models: cloudAIService.isConfigured()
                                ? cloudAIService.getAvailableModels().summarization
                                : [],
                            instructions: cloudAIService.isConfigured()
                                ? 'Using OpenAI GPT API'
                                : 'Please set your OpenAI API key in Settings',
                        }];
                }
                return [4 /*yield*/, ollamaService.isAvailable()];
            case 1:
                isAvailable = _b.sent();
                if (!isAvailable) return [3 /*break*/, 3];
                return [4 /*yield*/, ollamaService.getModels()];
            case 2:
                _a = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                _a = [];
                _b.label = 4;
            case 4:
                models = _a;
                return [2 /*return*/, {
                        available: isAvailable,
                        mode: 'local',
                        models: models,
                        instructions: ollamaService.getInstallInstructions(),
                    }];
        }
    });
}); });
ipcMain.handle('set-ollama-model', function (_, model) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        appConfig.summarizationModel = model;
        saveConfig(appConfig);
        ollamaService.setModel(model);
        return [2 /*return*/, { success: true }];
    });
}); });
// ----- Database -----
ipcMain.handle('create-meeting', function (_, meeting) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.createMeeting(meeting)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, { success: true, meeting: result }];
            case 2:
                error_7 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_7) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('get-meetings', function () { return __awaiter(void 0, void 0, void 0, function () {
    var meetings, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.getAllMeetings()];
            case 1:
                meetings = _a.sent();
                return [2 /*return*/, { success: true, meetings: meetings }];
            case 2:
                error_8 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_8) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('get-meeting-details', function (_, id) { return __awaiter(void 0, void 0, void 0, function () {
    var details, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.getMeetingWithDetails(id)];
            case 1:
                details = _a.sent();
                return [2 /*return*/, __assign({ success: true }, details)];
            case 2:
                error_9 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_9) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('update-meeting', function (_, id, updates) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.updateMeeting(id, updates)];
            case 1:
                result = _a.sent();
                return [2 /*return*/, { success: true, meeting: result }];
            case 2:
                error_10 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_10) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('delete-meeting', function (_, id) { return __awaiter(void 0, void 0, void 0, function () {
    var error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.deleteMeeting(id)];
            case 1:
                _a.sent();
                return [2 /*return*/, { success: true }];
            case 2:
                error_11 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_11) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('save-meeting-transcript', function (_, meetingId, transcript) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.saveTranscript({
                        meetingId: meetingId,
                        text: transcript.text,
                        segments: JSON.stringify(transcript.segments),
                        language: transcript.language,
                    })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, { success: true, transcript: result }];
            case 2:
                error_12 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_12) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('save-meeting-summary', function (_, meetingId, summary, model) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.saveSummary({
                        meetingId: meetingId,
                        summary: summary.summary,
                        actionItems: JSON.stringify(summary.actionItems),
                        keyPoints: JSON.stringify(summary.keyPoints),
                        decisions: JSON.stringify(summary.decisions),
                        model: model,
                    })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, { success: true, summary: result }];
            case 2:
                error_13 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_13) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
ipcMain.handle('search-meetings', function (_, query) { return __awaiter(void 0, void 0, void 0, function () {
    var meetings, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, databaseService.searchMeetings(query)];
            case 1:
                meetings = _a.sent();
                return [2 /*return*/, { success: true, meetings: meetings }];
            case 2:
                error_14 = _a.sent();
                return [2 /*return*/, { success: false, error: String(error_14) }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ----- App Info -----
ipcMain.handle('get-app-paths', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                recordings: recordingsPath,
                transcripts: transcriptsPath,
                models: modelsPath,
                userData: app.getPath('userData'),
            }];
    });
}); });
ipcMain.handle('get-platform-info', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                platform: process.platform,
                arch: process.arch,
                audioSetup: audioCaptureService.getSetupInstructions(),
            }];
    });
}); });
// ----- Permissions -----
ipcMain.handle('check-microphone-permission', function () { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, granted;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(process.platform === 'darwin')) return [3 /*break*/, 3];
                status_1 = systemPreferences.getMediaAccessStatus('microphone');
                if (!(status_1 !== 'granted')) return [3 /*break*/, 2];
                return [4 /*yield*/, systemPreferences.askForMediaAccess('microphone')];
            case 1:
                granted = _a.sent();
                return [2 /*return*/, granted];
            case 2: return [2 /*return*/, true];
            case 3: return [2 /*return*/, true];
        }
    });
}); });
ipcMain.handle('check-screen-permission', function () { return __awaiter(void 0, void 0, void 0, function () {
    var status_2;
    return __generator(this, function (_a) {
        if (process.platform === 'darwin') {
            status_2 = systemPreferences.getMediaAccessStatus('screen');
            return [2 /*return*/, status_2 === 'granted'];
        }
        return [2 /*return*/, true];
    });
}); });
// ----- System Status -----
ipcMain.handle('get-system-status', function () { return __awaiter(void 0, void 0, void 0, function () {
    var cloudConfigured, whisperAvailable, ollamaAvailable, ollamaModels, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                cloudConfigured = cloudAIService.isConfigured();
                // If cloud mode, return cloud status
                if (appConfig.aiMode === 'cloud') {
                    return [2 /*return*/, {
                            mode: 'cloud',
                            cloudConfigured: cloudConfigured,
                            whisper: {
                                available: cloudConfigured,
                                mode: 'cloud',
                                instructions: cloudConfigured
                                    ? 'Using OpenAI Whisper API'
                                    : 'Set your OpenAI API key to enable transcription',
                            },
                            ollama: {
                                available: cloudConfigured,
                                mode: 'cloud',
                                models: cloudConfigured ? cloudAIService.getAvailableModels().summarization : [],
                                instructions: cloudConfigured
                                    ? 'Using OpenAI GPT API'
                                    : 'Set your OpenAI API key to enable summarization',
                            },
                            platform: process.platform,
                            pricingInfo: cloudAIService.getPricingInfo(),
                        }];
                }
                return [4 /*yield*/, whisperService.initialize()];
            case 1:
                whisperAvailable = _b.sent();
                return [4 /*yield*/, ollamaService.isAvailable()];
            case 2:
                ollamaAvailable = _b.sent();
                if (!ollamaAvailable) return [3 /*break*/, 4];
                return [4 /*yield*/, ollamaService.getModels()];
            case 3:
                _a = _b.sent();
                return [3 /*break*/, 5];
            case 4:
                _a = [];
                _b.label = 5;
            case 5:
                ollamaModels = _a;
                return [2 /*return*/, {
                        mode: 'local',
                        cloudConfigured: cloudConfigured,
                        whisper: {
                            available: whisperAvailable,
                            mode: 'local',
                            instructions: whisperService.getInstallInstructions(),
                        },
                        ollama: {
                            available: ollamaAvailable,
                            mode: 'local',
                            models: ollamaModels,
                            instructions: ollamaService.getInstallInstructions(),
                        },
                        platform: process.platform,
                        audioSetup: audioCaptureService.getSetupInstructions(),
                    }];
        }
    });
}); });
// ----- Pricing Info -----
ipcMain.handle('get-pricing-info', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, cloudAIService.getPricingInfo()];
    });
}); });
