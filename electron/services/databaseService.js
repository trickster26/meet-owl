/**
 * Database service for storing meetings, transcripts, and summaries
 * Uses better-sqlite3 for cross-platform SQLite support
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
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
var DatabaseService = /** @class */ (function () {
    function DatabaseService() {
        this.db = null;
        var userDataPath = (app === null || app === void 0 ? void 0 : app.getPath('userData')) || path.join(process.env.HOME || '', '.meetnotes');
        this.dbPath = path.join(userDataPath, 'meetnotes.db');
    }
    /**
     * Initialize database with tables
     */
    DatabaseService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dir, schemaPath;
            return __generator(this, function (_a) {
                dir = path.dirname(this.dbPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                schemaPath = path.join(dir, 'meetings.json');
                if (!fs.existsSync(schemaPath)) {
                    fs.writeFileSync(schemaPath, JSON.stringify({ meetings: [], transcripts: [], summaries: [] }, null, 2));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get all data
     */
    DatabaseService.prototype.getData = function () {
        var userDataPath = (app === null || app === void 0 ? void 0 : app.getPath('userData')) || path.join(process.env.HOME || '', '.meetnotes');
        var dataPath = path.join(userDataPath, 'meetings.json');
        if (!fs.existsSync(dataPath)) {
            return { meetings: [], transcripts: [], summaries: [] };
        }
        return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    };
    /**
     * Save all data
     */
    DatabaseService.prototype.saveData = function (data) {
        var userDataPath = (app === null || app === void 0 ? void 0 : app.getPath('userData')) || path.join(process.env.HOME || '', '.meetnotes');
        var dataPath = path.join(userDataPath, 'meetings.json');
        var dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    };
    /**
     * Create a new meeting
     */
    DatabaseService.prototype.createMeeting = function (meeting) {
        return __awaiter(this, void 0, void 0, function () {
            var data, now, newMeeting;
            return __generator(this, function (_a) {
                data = this.getData();
                now = new Date().toISOString();
                newMeeting = __assign(__assign({}, meeting), { id: Date.now(), createdAt: now, updatedAt: now });
                data.meetings.push(newMeeting);
                this.saveData(data);
                return [2 /*return*/, newMeeting];
            });
        });
    };
    /**
     * Update a meeting
     */
    DatabaseService.prototype.updateMeeting = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var data, index;
            return __generator(this, function (_a) {
                data = this.getData();
                index = data.meetings.findIndex(function (m) { return m.id === id; });
                if (index === -1)
                    return [2 /*return*/, null];
                data.meetings[index] = __assign(__assign(__assign({}, data.meetings[index]), updates), { updatedAt: new Date().toISOString() });
                this.saveData(data);
                return [2 /*return*/, data.meetings[index]];
            });
        });
    };
    /**
     * Get a meeting by ID
     */
    DatabaseService.prototype.getMeeting = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = this.getData();
                return [2 /*return*/, data.meetings.find(function (m) { return m.id === id; }) || null];
            });
        });
    };
    /**
     * Get all meetings
     */
    DatabaseService.prototype.getAllMeetings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = this.getData();
                return [2 /*return*/, data.meetings.sort(function (a, b) {
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                    })];
            });
        });
    };
    /**
     * Delete a meeting
     */
    DatabaseService.prototype.deleteMeeting = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var data, initialLength;
            return __generator(this, function (_a) {
                data = this.getData();
                initialLength = data.meetings.length;
                data.meetings = data.meetings.filter(function (m) { return m.id !== id; });
                data.transcripts = data.transcripts.filter(function (t) { return t.meetingId !== id; });
                data.summaries = data.summaries.filter(function (s) { return s.meetingId !== id; });
                this.saveData(data);
                return [2 /*return*/, data.meetings.length < initialLength];
            });
        });
    };
    /**
     * Save transcript for a meeting
     */
    DatabaseService.prototype.saveTranscript = function (transcript) {
        return __awaiter(this, void 0, void 0, function () {
            var data, newTranscript;
            return __generator(this, function (_a) {
                data = this.getData();
                newTranscript = __assign(__assign({}, transcript), { id: Date.now(), createdAt: new Date().toISOString() });
                // Remove existing transcript for this meeting
                data.transcripts = data.transcripts.filter(function (t) { return t.meetingId !== transcript.meetingId; });
                data.transcripts.push(newTranscript);
                this.saveData(data);
                return [2 /*return*/, newTranscript];
            });
        });
    };
    /**
     * Get transcript for a meeting
     */
    DatabaseService.prototype.getTranscript = function (meetingId) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = this.getData();
                return [2 /*return*/, data.transcripts.find(function (t) { return t.meetingId === meetingId; }) || null];
            });
        });
    };
    /**
     * Save summary for a meeting
     */
    DatabaseService.prototype.saveSummary = function (summary) {
        return __awaiter(this, void 0, void 0, function () {
            var data, newSummary;
            return __generator(this, function (_a) {
                data = this.getData();
                newSummary = __assign(__assign({}, summary), { id: Date.now(), createdAt: new Date().toISOString() });
                // Remove existing summary for this meeting
                data.summaries = data.summaries.filter(function (s) { return s.meetingId !== summary.meetingId; });
                data.summaries.push(newSummary);
                this.saveData(data);
                return [2 /*return*/, newSummary];
            });
        });
    };
    /**
     * Get summary for a meeting
     */
    DatabaseService.prototype.getSummary = function (meetingId) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                data = this.getData();
                return [2 /*return*/, data.summaries.find(function (s) { return s.meetingId === meetingId; }) || null];
            });
        });
    };
    /**
     * Search meetings by text
     */
    DatabaseService.prototype.searchMeetings = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var data, lowerQuery, meetingsWithTranscripts;
            return __generator(this, function (_a) {
                data = this.getData();
                lowerQuery = query.toLowerCase();
                meetingsWithTranscripts = data.meetings.filter(function (meeting) {
                    // Search in title
                    if (meeting.title.toLowerCase().includes(lowerQuery))
                        return true;
                    // Search in transcript
                    var transcript = data.transcripts.find(function (t) { return t.meetingId === meeting.id; });
                    if (transcript && transcript.text.toLowerCase().includes(lowerQuery))
                        return true;
                    // Search in summary
                    var summary = data.summaries.find(function (s) { return s.meetingId === meeting.id; });
                    if (summary && summary.summary.toLowerCase().includes(lowerQuery))
                        return true;
                    return false;
                });
                return [2 /*return*/, meetingsWithTranscripts];
            });
        });
    };
    /**
     * Get meeting with full details (transcript + summary)
     */
    DatabaseService.prototype.getMeetingWithDetails = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var meeting, transcript, summary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMeeting(id)];
                    case 1:
                        meeting = _a.sent();
                        if (!meeting)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, this.getTranscript(id)];
                    case 2:
                        transcript = _a.sent();
                        return [4 /*yield*/, this.getSummary(id)];
                    case 3:
                        summary = _a.sent();
                        return [2 /*return*/, { meeting: meeting, transcript: transcript, summary: summary }];
                }
            });
        });
    };
    return DatabaseService;
}());
export var databaseService = new DatabaseService();
export default DatabaseService;
