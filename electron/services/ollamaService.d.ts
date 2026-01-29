/**
 * Ollama LLM service for meeting summarization
 * Connects to local Ollama instance for AI-powered summarization
 */
export interface SummaryResult {
    summary: string;
    actionItems: string[];
    keyPoints: string[];
    decisions: string[];
    participants?: string[];
}
export interface OllamaOptions {
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
declare class OllamaService {
    private baseUrl;
    private model;
    private temperature;
    private maxTokens;
    constructor(options?: OllamaOptions);
    /**
     * Check if Ollama is running
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get available models
     */
    getModels(): Promise<string[]>;
    /**
     * Set the model to use
     */
    setModel(model: string): void;
    /**
     * Generate a meeting summary from transcript
     */
    summarizeMeeting(transcript: string): Promise<SummaryResult>;
    /**
     * Build the summarization prompt
     */
    private buildSummaryPrompt;
    /**
     * Parse the LLM response into structured format
     */
    private parseSummaryResponse;
    /**
     * Extract bullet points from text
     */
    private extractBulletPoints;
    /**
     * Generate response from Ollama
     */
    generate(prompt: string): Promise<string>;
    /**
     * Stream generation (for real-time output)
     */
    generateStream(prompt: string): AsyncGenerator<string>;
    /**
     * Make HTTP request to Ollama
     */
    private makeRequest;
    /**
     * Get installation instructions
     */
    getInstallInstructions(): string;
}
export declare const ollamaService: OllamaService;
export default OllamaService;
