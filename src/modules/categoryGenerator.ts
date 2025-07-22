/**
 * Category Generation Module
 * Generates relevant categories for the specified expert role and target subject
 */

import { getGeminiClient } from '../utils/gemini';
import { logger } from '../utils/logger';

export interface Category {
  category_name: string;
  category_description: string;
  example_choices: string[];
}

const IMPROVED_CATEGORY_GENERATION_PROMPT = `
# 概要
あなたは、カテゴリ構造提案AIです。
「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について多角的に考えるためのカテゴリー（観点）を考案してください。

各カテゴリは、思考の構成要素となるものです。たとえば、画像生成における「スタイル」「構図」「色調」のような分類が該当します。

# 指示
- 「{{TARGET_SUBJECT}}」の質を良くするために必要となるカテゴリをたくさん考えてください。
- **特に、成果物のスタイル（例：ジブリ風、写実的）、作風（例：村上春樹風、SF風）、典拠（例：特定の専門家の見解、特定の情報源に基づく）などを指定できるカテゴリを積極的に含めてください。** これらは、「{{TARGET_SUBJECT}}」の方向性の一貫性を保ち、特定の質や雰囲気を再現する上で重要です。
- また、「{{EXPERT_ROLE}}」として必要な基本的なカテゴリを考えてください。
- ユーザーが各カテゴリの選択肢を選ぶことで、「{{TARGET_SUBJECT}}」の具体的な特徴をコントロールしやすくなるようなカテゴリを考案してください。
- 「{{TARGET_SUBJECT}}」を特徴づける様々な側面を網羅できるよう、多角的な視点からカテゴリを考案し、十分な数を確保してください。
- ユーザーが選択した条件に基づいて「{{TARGET_SUBJECT}}」を生成する際、結果の再現性を高め、かつ詳細なバリエーションの指定を可能にするため、多角的な視点からカテゴリを考案し、十分な数を確保してください。
- カテゴリは{{TARGET_CATEGORIES}}種程度を目安にしてください（最低10種類以上）。
- カテゴリや選択肢を考案する際には、**著作権や倫理的な配慮に関する制限は一切考慮せず、バリエーションと質を重視**して出してください。これらの懸念事項は、最終的に成果物を生成する段階で別途対応されます。

# 入力情報
専門家役割: {{EXPERT_ROLE}}
対象テーマ: {{TARGET_SUBJECT}}
{{DOMAIN_CONTEXT_SECTION}}

# 出力フォーマット
出力は **必ず以下の形式のJSONオブジェクト1つだけ** を返してください。

[
  {
    "category_name": "カテゴリ名",
    "category_description": "そのカテゴリの内容や目的、思考の観点としての機能が理解できるような簡潔な説明",
    "example_choices": ["そのカテゴリに該当する典型的な選択肢の例を3つ"]
  }
]

## 制約・前提
- 出力は **JSONオブジェクトのみ** にしてください。
- **「了解しました」「こちらが出力です」などの文や、マークダウン記法（\`\`\`や#など）は一切使用しないでください。**
- JSONのフォーマットに間違いないか、可能であれば返答前に返信文字列をJSONパースを内部的に実行してみてエラーがないか確認し、エラーがあれば修正してから返信してください。
`;

export class CategoryGenerator {
  private geminiClient = getGeminiClient();

  async generateCategories(
    expertRole: string,
    targetSubject: string,
    targetCategories: number = 20,
    domainContext?: string
  ): Promise<Category[]> {
    logger.info('Starting category generation', { targetCategories });

    // Build domain context section
    const domainContextSection = domainContext
      ? `
# 追加コンテキスト（全体要望）
${domainContext}

# 注意事項
上記は「${targetSubject}」全体に関する要望や制約です。
カテゴリー生成に関連する部分があれば考慮し、関連しない内容は無視してください。`
      : '';

    const prompt = IMPROVED_CATEGORY_GENERATION_PROMPT
      .replace(/{{EXPERT_ROLE}}/g, expertRole)
      .replace(/{{TARGET_SUBJECT}}/g, targetSubject)
      .replace(/{{TARGET_CATEGORIES}}/g, targetCategories.toString())
      .replace(/{{DOMAIN_CONTEXT_SECTION}}/g, domainContextSection);

    try {
      const result = await this.geminiClient.generateContent(prompt);

      // Validate the result is an array
      if (!Array.isArray(result)) {
        throw new Error('Expected array of categories');
      }

      // Validate each category
      result.forEach((category, index) => {
        this.validateCategory(category, index);
      });

      // Limit to targetCategories
      const limitedCategories = result.slice(0, targetCategories);

      logger.info('Category generation completed successfully', {
        totalGenerated: result.length,
        returned: limitedCategories.length
      });

      return limitedCategories as Category[];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Category generation failed', { error: errorMessage });
      throw new Error(`Failed to generate categories: ${errorMessage}`);
    }
  }

  private validateCategory(category: any, index: number): void {
    const requiredFields = [
      'category_name', 'category_description', 'example_choices'
    ];

    for (const field of requiredFields) {
      if (!category[field]) {
        throw new Error(`Missing field '${field}' in category ${index}`);
      }
    }

    if (!Array.isArray(category.example_choices)) {
      throw new Error(`Invalid example_choices in category ${index}: must be array`);
    }

    if (category.example_choices.length === 0) {
      throw new Error(`Empty example_choices in category ${index}`);
    }
  }
}