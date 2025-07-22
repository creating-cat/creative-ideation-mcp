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
  
  // 生成数の制御（統一された命名）
  target_categories: z.number()
    .int()
    .min(10)
    .max(30)
    .optional()
    .default(20)
    .describe('生成するカテゴリ数の目安'),
  
  target_options_per_category: z.number()
    .int()
    .min(10)
    .max(200)
    .optional()
    .default(20)
    .describe('1カテゴリあたりの選択肢生成数の目安（カテゴリの性質により自動調整）'),
  
  // ランダム化制御
  randomize_selection: z.boolean()
    .optional()
    .default(false)
    .describe('選択肢をランダムに選ぶかどうか'),
  
  random_sample_size: z.number()
    .int()
    .min(5)
    .max(200)  // target_options_per_categoryの最大値と同じ
    .optional()
    .default(10)
    .describe('ランダム選択時の最大出力数（実際の選択肢数がこれより少ない場合は全て出力）'),
  
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
        validatedInput.target_categories,
        validatedInput.domain_context
      );

      // Step 2: Generate options for each category
      logger.info('Step 2: Generating options for categories');
      const categoriesWithOptions = await optionGenerator.generateOptionsForCategories(
        validatedInput.expert_role,
        validatedInput.target_subject,
        categories,
        validatedInput.target_options_per_category,
        validatedInput.domain_context
      );

      // Step 3: Apply random sampling if requested
      let finalCategories = categoriesWithOptions;
      if (validatedInput.randomize_selection) {
        logger.info('Step 3: Applying random sampling to options');
        finalCategories = this.applyRandomSampling(categoriesWithOptions, validatedInput.random_sample_size);
      }

      // Prepare successful response
      const response: GenerateIdeaCategoriesOutput = {
        success: true,
        data: {
          expert_role: validatedInput.expert_role,
          target_subject: validatedInput.target_subject,
          categories: finalCategories
        }
      };

      const executionTime = Date.now() - startTime;
      logger.info('Tool execution completed successfully', { 
        executionTime,
        categoryCount: finalCategories.length,
        totalOptions: finalCategories.reduce((sum, cat) => sum + cat.options.length, 0),
        randomSamplingApplied: validatedInput.randomize_selection
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

  /**
   * Apply random sampling to category options
   */
  applyRandomSampling(
    categories: Array<{ name: string; description: string; options: string[] }>,
    sampleSize: number
  ): Array<{ name: string; description: string; options: string[] }> {
    return categories.map(category => {
      if (category.options.length <= sampleSize) {
        // If we have fewer options than sample size, return all options
        return category;
      }

      // Shuffle the options array using Fisher-Yates algorithm
      const shuffledOptions = [...category.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      // Take the first sampleSize options
      return {
        ...category,
        options: shuffledOptions.slice(0, sampleSize)
      };
    });
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