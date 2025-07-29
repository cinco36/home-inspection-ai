import OpenAI from 'openai';
import { Pool } from 'pg';
import pool from '../database/connection';

// AI Service Configuration
interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  maxRetries: number;
  retryDelay: number;
}

interface AIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  requestType?: string;
}

interface AIRequest {
  id: string;
  fileId: string;
  requestType: string;
  promptUsed: string;
  inputText: string;
  responseText?: string;
  tokensUsed?: number;
  costCents?: number;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCostCents: number;
  requestsByType: Record<string, number>;
  averageTokensPerRequest: number;
}

// Token costs per 1K tokens (in cents) - approximate costs
const TOKEN_COSTS = {
  'gpt-3.5-turbo': { input: 0.15, output: 0.2 },
  'gpt-4': { input: 3.0, output: 6.0 },
  'gpt-4-turbo': { input: 1.0, output: 3.0 },
};

class AIService {
  private openai?: OpenAI;
  private config: AIConfig;
  private pool: Pool;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'), // Increased from 1500
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxRetries: 3,
      retryDelay: 1000,
    };

    this.pool = pool;

    // Only initialize OpenAI client if API key is provided
    if (this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
    }
  }

  /**
   * Process text using ChatGPT API
   */
  async processText(
    prompt: string,
    text: string,
    fileId: string,
    options: AIOptions = {}
  ): Promise<string> {
    const requestId = await this.createRequest(prompt, text, fileId, options.requestType || 'general');

    try {
      // Update request status to processing
      await this.updateRequestStatus(requestId, 'pending');

      const model = options.model || this.config.model;
      const maxTokens = options.maxTokens || this.config.maxTokens;
      const temperature = options.temperature || this.config.temperature;

      // Note: We don't check input token length here since we truncate text in processFile
      // and maxTokens is for output generation

      let response: string;
      let attempts = 0;

      while (attempts < this.config.maxRetries) {
        try {
          if (!this.openai) {
            throw new Error('OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.');
          }

          const completion = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: text }
            ],
            max_tokens: maxTokens,
            temperature,
          });

          response = completion.choices[0]?.message?.content || '';
          
          if (!response) {
            throw new Error('Empty response from OpenAI API');
          }

          // Validate response
          if (!this.validateResponse(response)) {
            throw new Error('Invalid response format from OpenAI API');
          }

          // Calculate tokens and cost
          const tokensUsed = completion.usage?.total_tokens || 0;
          const costCents = this.calculateCost(tokensUsed, model);

          // Update request with success
          await this.updateRequestSuccess(requestId, response, tokensUsed, costCents);

          return response;

        } catch (error) {
          attempts++;
          
          if (attempts >= this.config.maxRetries) {
            throw error;
          }

          // Wait before retrying
          await this.delay(this.config.retryDelay * attempts);
        }
      }

      throw new Error('Max retries exceeded');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update request with error
      await this.updateRequestError(requestId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Process a file with AI analysis
   */
  async processFile(fileId: string, extractedText: string): Promise<{ success: boolean; error?: string; summary?: string; recommendations?: string; costCents?: number }> {
    try {
      // Truncate text if it's too long (keep first 8000 characters for analysis)
      const maxTextLength = 8000;
      const truncatedText = extractedText.length > maxTextLength 
        ? extractedText.substring(0, maxTextLength) + '\n\n[Text truncated for analysis - full report available in original file]'
        : extractedText;

      // Create a comprehensive prompt for home inspection analysis
      const prompt = `You are an expert home inspector analyzing a home inspection report. Please provide:

1. A concise summary of the key findings (2-3 paragraphs)
2. Specific recommendations for addressing any issues found (bullet points)

Focus on:
- Safety concerns
- Structural issues
- Major repairs needed
- Maintenance recommendations
- Cost implications

Format your response as:
SUMMARY:
[Your summary here]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [etc.]`;

      // Process the text with AI
      const aiResponse = await this.processText(prompt, truncatedText, fileId, {
        requestType: 'home_inspection_analysis',
        maxTokens: this.config.maxTokens, // Use config maxTokens instead of hardcoded 2000
        temperature: 0.3
      });

      // Parse the response to extract summary and recommendations
      const { summary, recommendations } = this.parseAIResponse(aiResponse);

      // Calculate cost (this will be updated by the processText method)
      const requests = await this.getRequestsByFileId(fileId);
      const latestRequest = requests[0]; // Most recent request
      const costCents = latestRequest?.costCents || 0;

      return {
        success: true,
        summary,
        recommendations,
        costCents
      };

    } catch (error) {
      console.error('AI processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI processing failed'
      };
    }
  }

  /**
   * Parse AI response to extract summary and recommendations
   */
  private parseAIResponse(response: string): { summary: string; recommendations: string } {
    let summary = '';
    let recommendations = '';

    const lines = response.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toUpperCase().includes('SUMMARY:')) {
        currentSection = 'summary';
        continue;
      } else if (trimmedLine.toUpperCase().includes('RECOMMENDATIONS:')) {
        currentSection = 'recommendations';
        continue;
      }

      if (currentSection === 'summary' && trimmedLine) {
        summary += (summary ? '\n' : '') + trimmedLine;
      } else if (currentSection === 'recommendations' && trimmedLine) {
        recommendations += (recommendations ? '\n' : '') + trimmedLine;
      }
    }

    // If parsing failed, use the entire response as summary
    if (!summary && !recommendations) {
      summary = response;
    }

    return { summary, recommendations };
  }

  /**
   * Estimate token count for text
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost in cents for token usage
   */
  calculateCost(tokens: number, model: string): number {
    const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS];
    if (!costs) {
      return 0; // Unknown model, no cost tracking
    }

    // Use input cost as approximation (simplified)
    return Math.ceil((tokens / 1000) * costs.input * 100);
  }

  /**
   * Validate AI response
   */
  validateResponse(response: string): boolean {
    return Boolean(response && response.trim().length > 0);
  }

  /**
   * Create a new AI request record
   */
  private async createRequest(
    prompt: string,
    text: string,
    fileId: string,
    requestType: string
  ): Promise<string> {
    const query = `
      INSERT INTO ai_requests (file_id, request_type, prompt_used, input_text, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `;

    const result = await this.pool.query(query, [fileId, requestType, prompt, text]);
    return result.rows[0].id;
  }

  /**
   * Update request status
   */
  private async updateRequestStatus(requestId: string, status: string): Promise<void> {
    const query = `
      UPDATE ai_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await this.pool.query(query, [status, requestId]);
  }

  /**
   * Update request with successful response
   */
  private async updateRequestSuccess(
    requestId: string,
    response: string,
    tokensUsed: number,
    costCents: number
  ): Promise<void> {
    const query = `
      UPDATE ai_requests 
      SET status = 'completed', 
          response_text = $1, 
          tokens_used = $2, 
          cost_cents = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `;

    await this.pool.query(query, [response, tokensUsed, costCents, requestId]);
  }

  /**
   * Update request with error
   */
  private async updateRequestError(requestId: string, errorMessage: string): Promise<void> {
    const query = `
      UPDATE ai_requests 
      SET status = 'failed', 
          error_message = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await this.pool.query(query, [errorMessage, requestId]);
  }

  /**
   * Get AI requests for a specific file
   */
  async getRequestsByFileId(fileId: string): Promise<AIRequest[]> {
    const query = `
      SELECT * FROM ai_requests 
      WHERE file_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [fileId]);
    return result.rows;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_cents), 0) as total_cost_cents,
        request_type,
        COUNT(*) as requests_by_type
      FROM ai_requests 
      WHERE status = 'completed'
      GROUP BY request_type
    `;

    const result = await this.pool.query(query);
    
    const stats: UsageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCostCents: 0,
      requestsByType: {},
      averageTokensPerRequest: 0,
    };

    result.rows.forEach(row => {
      stats.totalRequests += parseInt(row.requests_by_type);
      stats.totalTokens += parseInt(row.total_tokens);
      stats.totalCostCents += parseInt(row.total_cost_cents);
      stats.requestsByType[row.request_type] = parseInt(row.requests_by_type);
    });

    stats.averageTokensPerRequest = stats.totalRequests > 0 
      ? Math.round(stats.totalTokens / stats.totalRequests) 
      : 0;

    return stats;
  }

  /**
   * Test OpenAI connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      if (!this.openai) {
        return {
          success: false,
          message: 'OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.',
        };
      }

      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 10,
      });

      return {
        success: true,
        message: 'OpenAI API connection successful',
        model: this.config.model,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return Object.keys(TOKEN_COSTS);
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService; 

