/**
 * Browser-based Text Summarization Service
 * Uses extractive summarization (free, no API) with optional Chrome AI API
 * 100% free, works offline
 */

export interface SummaryResult {
    summary: string;
    actionItems: string[];
    keyPoints: string[];
    decisions: string[];
}

class BrowserSummaryService {
    /**
     * Generate meeting summary using extractive summarization
     * This extracts important sentences rather than generating new text
     */
    async summarize(transcript: string): Promise<SummaryResult> {
        // Clean and split into sentences
        const sentences = this.splitIntoSentences(transcript);

        if (sentences.length === 0) {
            return {
                summary: 'No content to summarize.',
                actionItems: [],
                keyPoints: [],
                decisions: [],
            };
        }

        // Extract key points (most important sentences)
        const keyPoints = this.extractKeyPoints(sentences);

        // Extract action items (sentences with action verbs)
        const actionItems = this.extractActionItems(sentences);

        // Extract decisions (sentences with decision language)
        const decisions = this.extractDecisions(sentences);

        // Generate summary (top sentences by importance)
        const summary = this.generateSummary(sentences);

        return {
            summary,
            keyPoints,
            actionItems,
            decisions,
        };
    }

    /**
     * Split text into sentences
     */
    private splitIntoSentences(text: string): string[] {
        // Split by sentence-ending punctuation
        const sentences = text
            .replace(/([.!?])\s+/g, '$1|')
            .split('|')
            .map(s => s.trim())
            .filter(s => s.length > 10); // Filter very short segments

        return sentences;
    }

    /**
     * Score sentence importance based on various factors
     */
    private scoreSentence(sentence: string, allSentences: string[]): number {
        let score = 0;
        const lower = sentence.toLowerCase();

        // Keywords that indicate importance
        const importantKeywords = [
            'important', 'critical', 'key', 'main', 'primary', 'essential',
            'must', 'should', 'need', 'require', 'deadline', 'goal',
            'decision', 'agreed', 'concluded', 'result', 'outcome',
            'next step', 'action item', 'follow up', 'priority'
        ];

        for (const keyword of importantKeywords) {
            if (lower.includes(keyword)) {
                score += 2;
            }
        }

        // Sentences at the beginning are often summaries
        const index = allSentences.indexOf(sentence);
        if (index < 3) {
            score += 2;
        }

        // Longer sentences often contain more information
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount > 10 && wordCount < 40) {
            score += 1;
        }

        // Sentences with numbers may contain important data
        if (/\d+/.test(sentence)) {
            score += 1;
        }

        return score;
    }

    /**
     * Extract key points from the transcript
     */
    private extractKeyPoints(sentences: string[]): string[] {
        // Score all sentences
        const scored = sentences.map(s => ({
            sentence: s,
            score: this.scoreSentence(s, sentences),
        }));

        // Sort by score and take top 5
        const topSentences = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => s.sentence);

        // Format as bullet points
        return topSentences.map(s => this.cleanSentence(s));
    }

    /**
     * Extract action items (tasks, todos, assignments)
     */
    private extractActionItems(sentences: string[]): string[] {
        const actionPatterns = [
            /\b(will|going to|need to|have to|should|must|plan to)\s+\w+/i,
            /\b(action item|task|todo|follow up|next step)/i,
            /\b(assign|responsible|owner|deadline|by [a-z]+ \d+)/i,
            /\b(please|can you|could you|would you)\s+\w+/i,
            /\b(let's|we'll|we should|we need to)\s+\w+/i,
        ];

        const actionItems: string[] = [];

        for (const sentence of sentences) {
            for (const pattern of actionPatterns) {
                if (pattern.test(sentence)) {
                    const cleaned = this.cleanSentence(sentence);
                    if (!actionItems.includes(cleaned)) {
                        actionItems.push(cleaned);
                    }
                    break;
                }
            }
        }

        return actionItems.slice(0, 10); // Limit to 10 items
    }

    /**
     * Extract decisions made during the meeting
     */
    private extractDecisions(sentences: string[]): string[] {
        const decisionPatterns = [
            /\b(decided|agreed|concluded|approved|confirmed|finalized)/i,
            /\b(decision|consensus|agreement|resolution)/i,
            /\b(we will|we're going|the plan is|going forward)/i,
            /\b(voted|selected|chose|picked|opted)/i,
        ];

        const decisions: string[] = [];

        for (const sentence of sentences) {
            for (const pattern of decisionPatterns) {
                if (pattern.test(sentence)) {
                    const cleaned = this.cleanSentence(sentence);
                    if (!decisions.includes(cleaned)) {
                        decisions.push(cleaned);
                    }
                    break;
                }
            }
        }

        return decisions.slice(0, 5); // Limit to 5 decisions
    }

    /**
     * Generate a summary from the most important sentences
     */
    private generateSummary(sentences: string[]): string {
        if (sentences.length <= 3) {
            return sentences.join(' ');
        }

        // Score and rank sentences
        const scored = sentences.map(s => ({
            sentence: s,
            score: this.scoreSentence(s, sentences),
        }));

        // Take top sentences maintaining original order
        const topScores = scored
            .map((s, i) => ({ ...s, index: i }))
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.min(5, Math.ceil(sentences.length * 0.3)));

        // Sort by original order
        topScores.sort((a, b) => a.index - b.index);

        return topScores.map(s => this.cleanSentence(s.sentence)).join(' ');
    }

    /**
     * Clean a sentence for output
     */
    private cleanSentence(sentence: string): string {
        return sentence
            .replace(/\s+/g, ' ')
            .replace(/^\s*[-•*]\s*/, '')
            .trim();
    }

    /**
     * Check if Chrome's built-in AI is available
     * (Future: Chrome is adding on-device AI capabilities)
     */
    async checkChromeAI(): Promise<boolean> {
        try {
            // Check for Chrome's AI API (not yet widely available)
            if ('ai' in window && 'languageModel' in (window as any).ai) {
                return true;
            }
        } catch {
            // Not available
        }
        return false;
    }
}

export const browserSummaryService = new BrowserSummaryService();
export default BrowserSummaryService;
