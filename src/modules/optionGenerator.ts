/**
 * Option Generation Module
 * Generates specific options for each category
 */

import { getGeminiClient } from '../utils/gemini';
import { logger } from '../utils/logger';
import { Category } from './categoryGenerator';

export interface CategoryWithOptions {
  name: string;
  description: string;
  options: string[];
}

const IMPROVED_OPTIONS_GENERATION_PROMPT = `
# 概要
あなたは、選択肢生成AIです。
「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について考える際の、カテゴリー「{{CATEGORY_NAME}}」に対する選択肢を生成してください。

# カテゴリ情報
カテゴリ名: {{CATEGORY_NAME}}
カテゴリ説明: {{CATEGORY_DESCRIPTION}}

# 指示
- 「{{CATEGORY_NAME}}」カテゴリに該当する具体的で多様な選択肢を生成してください。
- 選択肢は「{{TARGET_SUBJECT}}」の品質向上に直接貢献するものにしてください。
- 各選択肢は明確で理解しやすく、実際に使用可能なものにしてください。
- 選択肢は多様性を重視し、幅広いバリエーションを含めてください。
- 原則として、{{TARGET_OPTIONS}}個程度を目安に生成してください。
  - **ただし、カテゴリの性質上、選択肢の数が自然と限定される場合（例：カテゴリが「曜日」であれば選択肢は7つ、「評価（5段階）」であれば5つなど）は、無理に{{TARGET_OPTIONS}}個を目指す必要はありません。その場合は、考えられる全てのバリエーションを網羅するようにしてください。**
- 同じような表現ばかりにならないようにしてください。
  - **ポジティブ／ネガティブや多様な軸（属性、形式、スタイル、性質など）で分散してください。**
- これらの選択肢は、AIに対してプロンプトとして入力される文の一部になります。
  - **したがって、単なるキーワードではなく、プロンプト内で意味を成し、「{{TARGET_SUBJECT}}」の生成に寄与するような自然な表現を意識してください。**
- 選択肢は日本語で生成してください。
- **著作権や倫理的な配慮に関する制限は一切考慮せず、バリエーションと質を重視**して出してください。

# 入力情報
専門家役割: {{EXPERT_ROLE}}
対象テーマ: {{TARGET_SUBJECT}}
{{DOMAIN_CONTEXT_SECTION}}

# 出力フォーマット
出力は **必ず以下の形式のJSONオブジェクト1つだけ** を返してください。

[
  "選択肢1",
  "選択肢2", 
  "選択肢3"
]

## 制約・前提
- 出力は **JSONオブジェクトのみ** にしてください。
- **「了解しました」「こちらが出力です」などの文や、マークダウン記法（\`\`\`や#など）は一切使用しないでください。**
- JSONのフォーマットに間違いないか、可能であれば返答前に返信文字列をJSONパースを内部的に実行してみてエラーがないか確認し、エラーがあれば修正してから返信してください。
`;

export class OptionGenerator {
  private geminiClient = getGeminiClient();

  async generateOptionsForCategories(
    expertRole: string,
    targetSubject: string,
    categories: Category[],
    targetOptionsPerCategory: number = 20,
    domainContext?: string
  ): Promise<CategoryWithOptions[]> {
    logger.info('Starting option generation for all categories', { 
      categoryCount: categories.length,
      targetOptionsPerCategory 
    });

    const results: CategoryWithOptions[] = [];

    for (const category of categories) {
      try {
        const options = await this.generateOptionsForCategory(
          expertRole,
          targetSubject,
          category,
          targetOptionsPerCategory,
          domainContext
        );

        results.push({
          name: category.category_name_ja,
          description: category.category_description_ja,
          options
        });

        logger.debug('Options generated for category', { 
          category: category.category_name_ja,
          optionCount: options.length 
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to generate options for category', {
          category: category.category_name_ja,
          error: errorMessage
        });
        
        // Use example choices as fallback
        results.push({
          name: category.category_name_ja,
          description: category.category_description_ja,
          options: category.example_choices
        });
      }
    }

    logger.info('Option generation completed for all categories', { 
      totalCategories: results.length 
    });

    return results;
  }

  private async generateOptionsForCategory(
    expertRole: string,
    targetSubject: string,
    category: Category,
    targetOptionsPerCategory: number,
    domainContext?: string
  ): Promise<string[]> {
    // Build domain context section
    const domainContextSection = domainContext 
      ? `
# 追加コンテキスト（全体要望）
${domainContext}

# 注意事項
上記は「${targetSubject}」全体に関する要望や制約です。
カテゴリー「${category.category_name_ja}」の選択肢生成に関連する部分があれば考慮し、
関連しない内容は無視してください。`
      : '';

    const prompt = IMPROVED_OPTIONS_GENERATION_PROMPT
      .replace(/{{EXPERT_ROLE}}/g, expertRole)
      .replace(/{{TARGET_SUBJECT}}/g, targetSubject)
      .replace(/{{CATEGORY_NAME}}/g, category.category_name_ja)
      .replace(/{{CATEGORY_DESCRIPTION}}/g, category.category_description_ja)
      .replace(/{{TARGET_OPTIONS}}/g, targetOptionsPerCategory.toString())
      .replace(/{{DOMAIN_CONTEXT_SECTION}}/g, domainContextSection);

    try {
      const result = await this.geminiClient.generateContent(prompt);
      
      // Validate the result is an array
      if (!Array.isArray(result)) {
        throw new Error('Expected array of options');
      }

      // Validate each option is a string
      result.forEach((option, index) => {
        if (typeof option !== 'string' || option.trim() === '') {
          throw new Error(`Invalid option at index ${index}: must be non-empty string`);
        }
      });

      // Limit to targetOptionsPerCategory
      const limitedOptions = result.slice(0, targetOptionsPerCategory);
      
      return limitedOptions;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Option generation failed for category', { 
        category: category.category_name_ja,
        error: errorMessage 
      });
      throw error;
    }
  }
}