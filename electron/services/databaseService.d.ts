/**
 * Database service for storing meetings, transcripts, and summaries
 * Uses better-sqlite3 for cross-platform SQLite support
 */
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
    segments: string;
    language: string;
    createdAt?: string;
}
export interface Summary {
    id?: number;
    meetingId: number;
    summary: string;
    actionItems: string;
    keyPoints: string;
    decisions: string;
    model: string;
    createdAt?: string;
}
declare class DatabaseService {
    private dbPath;
    private db;
    constructor();
    /**
     * Initialize database with tables
     */
    initialize(): Promise<void>;
    /**
     * Get all data
     */
    private getData;
    /**
     * Save all data
     */
    private saveData;
    /**
     * Create a new meeting
     */
    createMeeting(meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting>;
    /**
     * Update a meeting
     */
    updateMeeting(id: number, updates: Partial<Meeting>): Promise<Meeting | null>;
    /**
     * Get a meeting by ID
     */
    getMeeting(id: number): Promise<Meeting | null>;
    /**
     * Get all meetings
     */
    getAllMeetings(): Promise<Meeting[]>;
    /**
     * Delete a meeting
     */
    deleteMeeting(id: number): Promise<boolean>;
    /**
     * Save transcript for a meeting
     */
    saveTranscript(transcript: Omit<Transcript, 'id' | 'createdAt'>): Promise<Transcript>;
    /**
     * Get transcript for a meeting
     */
    getTranscript(meetingId: number): Promise<Transcript | null>;
    /**
     * Save summary for a meeting
     */
    saveSummary(summary: Omit<Summary, 'id' | 'createdAt'>): Promise<Summary>;
    /**
     * Get summary for a meeting
     */
    getSummary(meetingId: number): Promise<Summary | null>;
    /**
     * Search meetings by text
     */
    searchMeetings(query: string): Promise<Meeting[]>;
    /**
     * Get meeting with full details (transcript + summary)
     */
    getMeetingWithDetails(id: number): Promise<{
        meeting: Meeting;
        transcript: Transcript | null;
        summary: Summary | null;
    } | null>;
}
export declare const databaseService: DatabaseService;
export default DatabaseService;
