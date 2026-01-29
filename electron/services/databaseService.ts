/**
 * Database service for storing meetings, transcripts, and summaries
 * Uses better-sqlite3 for cross-platform SQLite support
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface Meeting {
    id?: number;
    title: string;
    date: string;
    duration: number;
    audioPath: string;
    transcriptPath?: string;
    status: 'recording' | 'transcribing' | 'summarizing' | 'complete' | 'error';
    createdAt?: string;
    updatedAt?: string;
}

export interface Transcript {
    id?: number;
    meetingId: number;
    text: string;
    segments: string; // JSON string of segments
    language: string;
    createdAt?: string;
}

export interface Summary {
    id?: number;
    meetingId: number;
    summary: string;
    actionItems: string; // JSON string
    keyPoints: string; // JSON string
    decisions: string; // JSON string
    model: string;
    createdAt?: string;
}

class DatabaseService {
    private dbPath: string;
    private db: any = null;

    constructor() {
        const userDataPath = app?.getPath('userData') || path.join(process.env.HOME || '', '.meetnotes');
        this.dbPath = path.join(userDataPath, 'meetnotes.db');
    }

    /**
     * Initialize database with tables
     */
    async initialize(): Promise<void> {
        // Ensure directory exists
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create tables using SQL file operations
        // Note: For simplicity, we'll use JSON file storage initially
        // Can be upgraded to better-sqlite3 later

        const schemaPath = path.join(dir, 'meetings.json');
        if (!fs.existsSync(schemaPath)) {
            fs.writeFileSync(schemaPath, JSON.stringify({ meetings: [], transcripts: [], summaries: [] }, null, 2));
        }
    }

    /**
     * Get all data
     */
    private getData(): { meetings: Meeting[]; transcripts: Transcript[]; summaries: Summary[] } {
        const userDataPath = app?.getPath('userData') || path.join(process.env.HOME || '', '.meetnotes');
        const dataPath = path.join(userDataPath, 'meetings.json');

        if (!fs.existsSync(dataPath)) {
            return { meetings: [], transcripts: [], summaries: [] };
        }

        return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }

    /**
     * Save all data
     */
    private saveData(data: { meetings: Meeting[]; transcripts: Transcript[]; summaries: Summary[] }): void {
        const userDataPath = app?.getPath('userData') || path.join(process.env.HOME || '', '.meetnotes');
        const dataPath = path.join(userDataPath, 'meetings.json');

        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    }

    /**
     * Create a new meeting
     */
    async createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
        const data = this.getData();
        const now = new Date().toISOString();

        const newMeeting: Meeting = {
            ...meeting,
            id: Date.now(),
            createdAt: now,
            updatedAt: now,
        };

        data.meetings.push(newMeeting);
        this.saveData(data);

        return newMeeting;
    }

    /**
     * Update a meeting
     */
    async updateMeeting(id: number, updates: Partial<Meeting>): Promise<Meeting | null> {
        const data = this.getData();
        const index = data.meetings.findIndex(m => m.id === id);

        if (index === -1) return null;

        data.meetings[index] = {
            ...data.meetings[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        this.saveData(data);
        return data.meetings[index];
    }

    /**
     * Get a meeting by ID
     */
    async getMeeting(id: number): Promise<Meeting | null> {
        const data = this.getData();
        return data.meetings.find(m => m.id === id) || null;
    }

    /**
     * Get all meetings
     */
    async getAllMeetings(): Promise<Meeting[]> {
        const data = this.getData();
        return data.meetings.sort((a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }

    /**
     * Delete a meeting
     */
    async deleteMeeting(id: number): Promise<boolean> {
        const data = this.getData();
        const initialLength = data.meetings.length;

        data.meetings = data.meetings.filter(m => m.id !== id);
        data.transcripts = data.transcripts.filter(t => t.meetingId !== id);
        data.summaries = data.summaries.filter(s => s.meetingId !== id);

        this.saveData(data);
        return data.meetings.length < initialLength;
    }

    /**
     * Save transcript for a meeting
     */
    async saveTranscript(transcript: Omit<Transcript, 'id' | 'createdAt'>): Promise<Transcript> {
        const data = this.getData();

        const newTranscript: Transcript = {
            ...transcript,
            id: Date.now(),
            createdAt: new Date().toISOString(),
        };

        // Remove existing transcript for this meeting
        data.transcripts = data.transcripts.filter(t => t.meetingId !== transcript.meetingId);
        data.transcripts.push(newTranscript);

        this.saveData(data);
        return newTranscript;
    }

    /**
     * Get transcript for a meeting
     */
    async getTranscript(meetingId: number): Promise<Transcript | null> {
        const data = this.getData();
        return data.transcripts.find(t => t.meetingId === meetingId) || null;
    }

    /**
     * Save summary for a meeting
     */
    async saveSummary(summary: Omit<Summary, 'id' | 'createdAt'>): Promise<Summary> {
        const data = this.getData();

        const newSummary: Summary = {
            ...summary,
            id: Date.now(),
            createdAt: new Date().toISOString(),
        };

        // Remove existing summary for this meeting
        data.summaries = data.summaries.filter(s => s.meetingId !== summary.meetingId);
        data.summaries.push(newSummary);

        this.saveData(data);
        return newSummary;
    }

    /**
     * Get summary for a meeting
     */
    async getSummary(meetingId: number): Promise<Summary | null> {
        const data = this.getData();
        return data.summaries.find(s => s.meetingId === meetingId) || null;
    }

    /**
     * Search meetings by text
     */
    async searchMeetings(query: string): Promise<Meeting[]> {
        const data = this.getData();
        const lowerQuery = query.toLowerCase();

        const meetingsWithTranscripts = data.meetings.filter(meeting => {
            // Search in title
            if (meeting.title.toLowerCase().includes(lowerQuery)) return true;

            // Search in transcript
            const transcript = data.transcripts.find(t => t.meetingId === meeting.id);
            if (transcript && transcript.text.toLowerCase().includes(lowerQuery)) return true;

            // Search in summary
            const summary = data.summaries.find(s => s.meetingId === meeting.id);
            if (summary && summary.summary.toLowerCase().includes(lowerQuery)) return true;

            return false;
        });

        return meetingsWithTranscripts;
    }

    /**
     * Get meeting with full details (transcript + summary)
     */
    async getMeetingWithDetails(id: number): Promise<{
        meeting: Meeting;
        transcript: Transcript | null;
        summary: Summary | null;
    } | null> {
        const meeting = await this.getMeeting(id);
        if (!meeting) return null;

        const transcript = await this.getTranscript(id);
        const summary = await this.getSummary(id);

        return { meeting, transcript, summary };
    }
}

export const databaseService = new DatabaseService();
export default DatabaseService;
