/**
 * Generate Idea Categories Tool
 * Main MCP tool that orchestrates the entire process
 */

import { z } from 'zod';
import { logger } from '../utils/logger';
import { TopicAnalyzer } from '../modules/topicAnalyzer';
import { CategoryGenerator } from '../modules/categoryGenerator';
import { OptionGenerator } from '../modules/optionGenerator';

// Input schema validation
export const generateIdeaCategoriesSchema = z.object({
  expert_role: z.string().min(1, 'Expert role is required'),
  target_subject: z.string().min(1, 'Target subject is required'),
  max_categories: z.number().int().min(1).max(30).optional().default(15),
  max_options_per_category: z.number().int().min(1).max(50).optional().default(20),
  domain_context: z.string().optional()
});

export type GenerateIdeaCategoriesInput = z.infer<typeof generateIdeaCategoriesSchema>;

export interface GenerateIdeaCategoriesOutput {
  success: boolean;
  data?: {
    expert_role: string;
    target_subject: string;
    categories: Array<{
      name: string;
      description: string;
      options: string[];
    }>;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const generateIdeaCategoriesTool = {
  name: 'generate_idea_categories',
  description: 'Generate contextual categories and options for creative thinking based on expert role and target subject',
  input_schema: generateIdeaCategoriesSchema,
  
  async execute(args: any): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const startTime = Date.now();
    logger.info('Starting generate_idea_categories tool execution', { args });

    try {
      // Validate input
      const validatedInput = generateIdeaCategoriesSchema.parse(args);
      
      // Construct user request from input
      const userRequest = this.constructUserRequest(validatedInput);
      
      // Initialize modules
      const topicAnalyzer = new TopicAnalyzer();
      const categoryGenerator = new CategoryGenerator();
      const optionGenerator = new OptionGenerator();

      // Step 1: Analyze the user request
      logger.info('Step 1: Analyzing user request');
      const analysisResult = await topicAnalyzer.analyzeUserRequest(userRequest);

      // Step 2: Generate categories
      logger.info('Step 2: Generating categories');
      const categories = await categoryGenerator.generateCategories(
        analysisResult,
        userRequest,
        validatedInput.max_categories
      );

      // Step 3: Generate options for each category
      logger.info('Step 3: Generating options for categories');
      const categoriesWithOptions = await optionGenerator.generateOptionsForCategories(
        analysisResult,
        categories,
        userRequest,
        validatedInput.max_options_per_category
      );

      // Prepare successful response
      const response: GenerateIdeaCategoriesOutput = {
        success: true,
        data: {
          expert_role: validatedInput.expert_role,
          target_subject: validatedInput.target_subject,
          categories: categoriesWithOptions
        }
      };

      const executionTime = Date.now() - startTime;
      logger.info('Tool execution completed successfully', { 
        executionTime,
        categoryCount: categoriesWithOptions.length,
        totalOptions: categoriesWithOptions.reduce((sum, cat) => sum + cat.options.length, 0)
      });

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Tool execution failed', { 
        error: errorMessage,
        executionTime 
      });

      // Prepare error response
      const errorResponse: GenerateIdeaCategoriesOutput = {
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        }
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(errorResponse, null, 2) }]
      };
    }
  },

  constructUserRequest(input: GenerateIdeaCategoriesInput): string {
    let request = `${input.expert_role}として、${input.target_subject}について考えたい。`;
    
    if (input.domain_context) {
      request += ` 特に${input.domain_context}の観点から。`;
    }
    
    return request;
  },

  getErrorCode(error: Error): string {
    if (error.message.includes('GEMINI_API_KEY')) {
      return 'INVALID_API_KEY';
    }
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }
    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return 'VALIDATION_ERROR';
    }
    return 'INTERNAL_ERROR';
  }
};