/**
 * Ollama LLM service for meeting summarization
 * Connects to local Ollama instance for AI-powered summarization
 */

import * as http from 'http';
import * as https from 'https';

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

interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

class OllamaService {
    private baseUrl: string;
    private model: string;
    private temperature: number;
    private maxTokens: number;

    constructor(options: OllamaOptions = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:11434';
        this.model = options.model || 'llama3.2';
        this.temperature = options.temperature || 0.7;
        this.maxTokens = options.maxTokens || 2048;
    }

    /**
     * Check if Ollama is running
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await this.makeRequest('/api/tags', 'GET');
            return response.models && response.models.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get available models
     */
    async getModels(): Promise<string[]> {
        try {
            const response = await this.makeRequest('/api/tags', 'GET');
            return response.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Failed to get models:', error);
            return [];
        }
    }

    /**
     * Set the model to use
     */
    setModel(model: string): void {
        this.model = model;
    }

    /**
     * Generate a meeting summary from transcript
     */
    async summarizeMeeting(transcript: string): Promise<SummaryResult> {
        const prompt = this.buildSummaryPrompt(transcript);
        const response = await this.generate(prompt);
        return this.parseSummaryResponse(response);
    }

    /**
     * Build the summarization prompt
     */
    private buildSummaryPrompt(transcript: string): string {
        return `You are an AI meeting assistant. Analyze the following meeting transcript and provide a structured summary.

MEETING TRANSCRIPT:
${transcript}

Please provide your response in the following exact format:

## SUMMARY
[2-3 paragraph summary of the meeting]

## KEY POINTS
- [Key point 1]
- [Key point 2]
- [Key point 3]

## ACTION ITEMS
- [Action item 1 with owner if mentioned]
- [Action item 2 with owner if mentioned]

## DECISIONS MADE
- [Decision 1]
- [Decision 2]

If any section has no items, write "None identified."`;
    }

    /**
     * Parse the LLM response into structured format
     */
    private parseSummaryResponse(response: string): SummaryResult {
        const result: SummaryResult = {
            summary: '',
            actionItems: [],
            keyPoints: [],
            decisions: [],
        };

        // Extract summary
        const summaryMatch = response.match(/## SUMMARY\n([\s\S]*?)(?=## KEY POINTS|## ACTION|$)/i);
        if (summaryMatch) {
            result.summary = summaryMatch[1].trim();
        }

        // Extract key points
        const keyPointsMatch = response.match(/## KEY POINTS\n([\s\S]*?)(?=## ACTION|## DECISIONS|$)/i);
        if (keyPointsMatch) {
            result.keyPoints = this.extractBulletPoints(keyPointsMatch[1]);
        }

        // Extract action items
        const actionMatch = response.match(/## ACTION ITEMS\n([\s\S]*?)(?=## DECISIONS|$)/i);
        if (actionMatch) {
            result.actionItems = this.extractBulletPoints(actionMatch[1]);
        }

        // Extract decisions
        const decisionsMatch = response.match(/## DECISIONS MADE\n([\s\S]*?)$/i);
        if (decisionsMatch) {
            result.decisions = this.extractBulletPoints(decisionsMatch[1]);
        }

        // If parsing failed, return raw response as summary
        if (!result.summary && response) {
            result.summary = response;
        }

        return result;
    }

    /**
     * Extract bullet points from text
     */
    private extractBulletPoints(text: string): string[] {
        const lines = text.split('\n');
        const points: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
                const point = trimmed.replace(/^[-•*]\s*/, '').trim();
                if (point && point.toLowerCase() !== 'none identified.' && point.toLowerCase() !== 'none') {
                    points.push(point);
                }
            }
        }

        return points;
    }

    /**
     * Generate response from Ollama
     */
    async generate(prompt: string): Promise<string> {
        const payload = {
            model: this.model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: this.temperature,
                num_predict: this.maxTokens,
            },
        };

        try {
            const response = await this.makeRequest('/api/generate', 'POST', payload);
            return response.response || '';
        } catch (error) {
            console.error('Ollama generation failed:', error);
            throw new Error(`Failed to generate summary: ${error}`);
        }
    }

    /**
     * Stream generation (for real-time output)
     */
    async *generateStream(prompt: string): AsyncGenerator<string> {
        const payload = {
            model: this.model,
            prompt: prompt,
            stream: true,
            options: {
                temperature: this.temperature,
                num_predict: this.maxTokens,
            },
        };

        const url = new URL('/api/generate', this.baseUrl);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        return new Promise<void>((resolve, reject) => {
            const req = httpModule.request(options, (res) => {
                let buffer = '';

                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const json = JSON.parse(line);
                                if (json.response) {
                                    // Note: This won't work with AsyncGenerator pattern easily
                                    // Consider using callbacks or events for streaming
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                });

                res.on('end', () => {
                    resolve();
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify(payload));
            req.end();
        }) as any;
    }

    /**
     * Make HTTP request to Ollama
     */
    private makeRequest(path: string, method: string, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const req = httpModule.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (e) {
                        resolve({ response: data });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    /**
     * Get installation instructions
     */
    getInstallInstructions(): string {
        return `
Install Ollama:

Linux:
  curl -fsSL https://ollama.com/install.sh | sh

Windows:
  Download from https://ollama.com/download/windows

After installation, pull a model:
  ollama pull llama3.2

Or for smaller/faster models:
  ollama pull mistral
  ollama pull gemma2

Start Ollama service:
  ollama serve
    `;
    }
}

export const ollamaService = new OllamaService();
export default OllamaService;
