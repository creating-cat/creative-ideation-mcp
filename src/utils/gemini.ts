/**
 * Gemini API client utility
 */

import { GoogleGenAI } from '@google/genai';
import { logger } from './logger';

export class GeminiClient {
  private client: GoogleGenAI;
  private model: string;
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 5000; // 5 seconds between requests

  constructor(apiKey: string, model: string = 'gemini-1.5-pro') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
    logger.info('Gemini client initialized', { model });
  }

  /**
   * Enforce rate limiting by waiting if necessary
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      logger.debug('Rate limiting: waiting', { waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Generate content with automatic retry and JSON parsing
   */
  async generateContent(prompt: string, maxRetries: number = 3): Promise<any> {
    await this.enforceRateLimit();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug('Generating content', { attempt, maxRetries });
        
        const result = await this.client.models.generateContent({
          model: this.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        let text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Remove markdown code blocks if present
        text = text.replace(/```json\s*|\s*```/g, '').trim();

        logger.debug('Raw response received', { textLength: text.length });

        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(text);
          logger.info('Content generated successfully', { attempt });
          return jsonData;
        } catch (parseError) {
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          logger.warn('JSON parse failed, attempting auto-fix', { attempt, parseError: errorMessage });
          
          // Try to fix JSON with AI
          const fixedJson = await this.fixJsonWithAI(text);
          if (fixedJson) {
            logger.info('JSON auto-fix successful', { attempt });
            return fixedJson;
          }
          
          throw new Error(`JSON parsing failed: ${errorMessage}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Content generation failed', { 
          attempt, 
          maxRetries, 
          error: errorMessage 
        });

        if (attempt === maxRetries) {
          throw new Error(`Failed to generate content after ${maxRetries} attempts: ${errorMessage}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  /**
   * Attempt to fix malformed JSON using AI
   */
  private async fixJsonWithAI(malformedJson: string): Promise<any | null> {
    try {
      const fixPrompt = `
以下のテキストは有効なJSONになるはずですが、構文エラーがあります。
正しいJSONフォーマットに修正してください。
修正されたJSONのみを返してください。説明や追加のテキストは不要です。

修正対象:
${malformedJson}
`;

      await this.enforceRateLimit();
      
      const result = await this.client.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: fixPrompt }] }]
      });
      let fixedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Remove markdown code blocks
      fixedText = fixedText.replace(/```json\s*|\s*```/g, '').trim();

      return JSON.parse(fixedText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('JSON auto-fix failed', { error: errorMessage });
      return null;
    }
  }
}

let geminiClient: GeminiClient | null = null;

/**
 * Get or create Gemini client instance
 */
export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    geminiClient = new GeminiClient(apiKey, model);
  }
  
  return geminiClient;
}