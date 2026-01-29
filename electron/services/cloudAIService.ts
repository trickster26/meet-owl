/**
 * Cloud AI Service
 * Uses OpenAI API for transcription (Whisper) and summarization (GPT-4o-mini)
 * Zero local dependencies - everything runs in the cloud
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

export interface TranscriptionResult {
    text: string;
    segments: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
    language: string;
    duration: number;
}

export interface SummaryResult {
    summary: string;
    actionItems: string[];
    keyPoints: string[];
    decisions: string[];
}

export interface CloudAIConfig {
    apiKey: string;
    transcriptionModel?: 'whisper-1';
    summarizationModel?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
}

class CloudAIService {
    private client: OpenAI | null = null;
    private config: CloudAIConfig | null = null;

    /**
     * Initialize with API key
     */
    initialize(config: CloudAIConfig): void {
        this.config = {
            transcriptionModel: 'whisper-1',
            summarizationModel: 'gpt-4o-mini',
            ...config,
        };

        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
    }

    /**
     * Check if service is configured
     */
    isConfigured(): boolean {
        return this.client !== null && this.config !== null;
    }

    /**
     * Validate API key
     */
    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const testClient = new OpenAI({ apiKey });
            await testClient.models.list();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Transcribe audio file using OpenAI Whisper API
     */
    async transcribe(audioPath: string): Promise<TranscriptionResult> {
        if (!this.client) {
            throw new Error('CloudAI not initialized. Please set your API key in Settings.');
        }

        if (!fs.existsSync(audioPath)) {
            throw new Error(`Audio file not found: ${audioPath}`);
        }

        try {
            // Read the audio file
            const audioFile = fs.createReadStream(audioPath);

            // Call OpenAI Whisper API with verbose JSON for segments
            const transcription = await this.client.audio.transcriptions.create({
                file: audioFile,
                model: this.config!.transcriptionModel || 'whisper-1',
                response_format: 'verbose_json',
                timestamp_granularities: ['segment'],
            });

            // Parse segments from response
            const segments = (transcription as any).segments?.map((seg: any, idx: number) => ({
                id: idx,
                start: seg.start || 0,
                end: seg.end || 0,
                text: seg.text?.trim() || '',
            })) || [];

            return {
                text: transcription.text,
                segments,
                language: (transcription as any).language || 'en',
                duration: (transcription as any).duration || 0,
            };
        } catch (error: any) {
            console.error('Transcription error:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    /**
     * Generate meeting summary using GPT
     */
    async summarize(transcript: string): Promise<SummaryResult> {
        if (!this.client) {
            throw new Error('CloudAI not initialized. Please set your API key in Settings.');
        }

        const prompt = `You are an AI meeting assistant. Analyze the following meeting transcript and provide a structured summary.

MEETING TRANSCRIPT:
${transcript}

Please provide your response in the following exact JSON format:
{
  "summary": "2-3 paragraph summary of the meeting",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "actionItems": ["Action item 1 with owner if mentioned", "Action item 2"],
  "decisions": ["Decision 1", "Decision 2"]
}

If any section has no items, use an empty array []. Return ONLY valid JSON, no other text.`;

        try {
            const completion = await this.client.chat.completions.create({
                model: this.config!.summarizationModel || 'gpt-4o-mini',
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
            });

            const responseText = completion.choices[0]?.message?.content || '';

            // Parse JSON response
            try {
                const result = JSON.parse(responseText);
                return {
                    summary: result.summary || '',
                    actionItems: result.actionItems || [],
                    keyPoints: result.keyPoints || [],
                    decisions: result.decisions || [],
                };
            } catch (parseError) {
                // If JSON parsing fails, return raw text as summary
                return {
                    summary: responseText,
                    actionItems: [],
                    keyPoints: [],
                    decisions: [],
                };
            }
        } catch (error: any) {
            console.error('Summarization error:', error);
            throw new Error(`Summarization failed: ${error.message}`);
        }
    }

    /**
     * Get pricing info
     */
    getPricingInfo(): string {
        return `
OpenAI API Pricing (approximate):

Whisper Transcription:
  • $0.006 per minute of audio

GPT-4o-mini Summarization:
  • ~$0.01 per meeting summary

Example: A 30-minute meeting costs approximately:
  • Transcription: $0.18
  • Summary: $0.01
  • Total: ~$0.19

Get your API key at: https://platform.openai.com/api-keys
    `;
    }

    /**
     * Get models info
     */
    getAvailableModels() {
        return {
            transcription: ['whisper-1'],
            summarization: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
        };
    }
}

export const cloudAIService = new CloudAIService();
export default CloudAIService;
