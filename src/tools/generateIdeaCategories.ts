/**
 * Generate Idea Categories Tool
 * Main MCP tool that orchestrates the entire process
 */

import { z } from 'zod';
import { logger } from '../utils/logger';
import { CategoryGenerator } from '../modules/categoryGenerator';
import { OptionGenerator } from '../modules/optionGenerator';

// Input schema validation
export const generateIdeaCategoriesSchema = z.object({
  expert_role: z.string()
    .min(1, 'Expert role is required')
    .describe('The expert role perspective to take when generating categories (e.g., "ゲームデザイナー", "料理研究家")'),
  target_subject: z.string()
    .min(1, 'Target subject is required')
    .describe('The target subject or topic to think about (e.g., "オリジナルボードゲーム", "新しいレシピ")'),
  max_categories: z.number()
    .int()
    .min(10, 'Must be at least 10')
    .max(30, 'Cannot exceed 30')
    .optional()
    .default(20)
    .describe('Target number of categories to generate as a guideline (default: 20, max: 30)'),
  max_options_per_category: z.number()
    .int()
    .min(10, 'Must be at least 10')
    .max(50, 'Cannot exceed 100')
    .optional()
    .default(100)
    .describe('Target number of options to generate per category as a guideline (default: 50, max: 100)'),
  domain_context: z.string()
    .optional()
    .describe('Additional domain-specific context or constraints to consider (optional)')
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
      
      // Initialize modules
      const categoryGenerator = new CategoryGenerator();
      const optionGenerator = new OptionGenerator();

      // Step 1: Generate categories
      logger.info('Step 1: Generating categories');
      const categories = await categoryGenerator.generateCategories(
        validatedInput.expert_role,
        validatedInput.target_subject,
        validatedInput.max_categories,
        validatedInput.domain_context
      );

      // Step 2: Generate options for each category
      logger.info('Step 2: Generating options for categories');
      const categoriesWithOptions = await optionGenerator.generateOptionsForCategories(
        validatedInput.expert_role,
        validatedInput.target_subject,
        categories,
        validatedInput.max_options_per_category,
        validatedInput.domain_context
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