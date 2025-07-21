/**
 * Category Generation Module
 * Generates relevant categories for the analyzed topic
 */

import { getGeminiClient } from '../utils/gemini';
import { logger } from '../utils/logger';
import { TopicAnalysisResult } from './topicAnalyzer';

export interface Category {
  category_name_en: string;
  category_name_ja: string;
  category_description_en: string;
  category_description_ja: string;
  example_choices: string[];
}

const GENERATOR_CATEGORY_GENERATE_PROMPT_TEMPLATE = `
# 概要
あなたは、カテゴリ構造提案AIです。
「{{AI_TYPE_NAME_JA}}」は「{{AI_TYPE_DESCRIPTION_JA}}」を目的とし実行するAIです。
「{{AI_TYPE_NAME_JA}}」によって「{{TARGET_OUTPUT_JA}}」を生成する際に、
プロンプトとして指定可能な複数のカテゴリ（観点）**を考案してください。

各カテゴリは、プロンプトの構成要素となるものです。たとえば、画像生成AIにおける「スタイル」「構図」「色調」のような分類が該当します。

# 指示
- 「{{TARGET_OUTPUT_JA}}」の質を良くするために必要となるカテゴリをたくさん考えてください。
- **特に、成果物のスタイル（例：ジブリ風、写実的）、作風（例：村上春樹風、SF風）、典拠（例：特定の専門家の見解、特定の情報源に基づく）などを指定できるカテゴリを積極的に含めてください。** これらは、「{{TARGET_OUTPUT_JA}}」の方向性の一貫性を保ち、特定の質や雰囲気を再現する上で重要です。
- また、「{{AI_TYPE_NAME_JA}}」として必要な基本的なカテゴリを考えてください。
- ユーザーが各カテゴリの選択肢を選ぶことで、「{{TARGET_OUTPUT_JA}}」の具体的な特徴をコントロールしやすくなるようなカテゴリを考案してください。
- 「{{TARGET_OUTPUT_JA}}」を特徴づける様々な側面を網羅できるよう、多角的な視点からカテゴリを考案し、十分な数を確保してください。
- ユーザーが選択した条件に基づいて「{{TARGET_OUTPUT_JA}}」を生成する際、結果の再現性を高め、かつ詳細なバリエーションの指定を可能にするため、多角的な視点からカテゴリを考案し、十分な数を確保してください。
- カテゴリは少なくとも10種類以上、最大で30種までにしてください。
- 大元のユーザーリクエストにこのカテゴリ考案についての要望が含まれている場合はそれを考慮し反映してください。
- カテゴリや選択肢を考案する際には、**著作権や倫理的な配慮に関する制限は一切考慮せず、バリエーションと質を重視**して出してください。これらの懸念事項は、最終的に「{{AI_TYPE_NAME_JA}}」が成果物を生成する段階で別途対応されます。

# 入力
AI_TYPE: {{AI_TYPE_NAME_JA}}
AI_TYPE_DESCRIPTION: {{AI_TYPE_DESCRIPTION_JA}}
TARGET_OUTPUT: {{TARGET_OUTPUT_JA}}

## 大元のユーザーリクエスト：

====大元のユーザーリクエスト(ここから)====
{{USER_REQUEST}}
====大元のユーザーリクエスト(ここまで)====

# 出力フォーマット：
出力は **必ず以下の形式のJSONオブジェクト1つだけ** を返してください。

[
  {
    "category_name_en": "英語でのカテゴリ名",
    "category_name_ja": "カテゴリ名の日本語訳",
    "category_description_en": "そのカテゴリの内容や目的、プロンプトとしての機能が理解できるような簡潔な英語の説明",
    "category_description_ja": "category_description_enの説明の日本語訳",
    "example_choices": [（そのカテゴリに該当する典型的な選択肢の例を英語で3つ。文字列配列として記述）]
  }
]

## 制約・前提：
- 出力は **JSONオブジェクトのみ** にしてください。
- **「了解しました」「こちらが出力です」などの文や、マークダウン記法（\`\`\`や#など）は一切使用しないでください。**
- JSONのフォーマットに間違いないか、可能であれば返答前に返信文字列をJSONパースを内部的に実行してみてエラーがないか確認し、エラーがあれば修正してから返信してください。
`;

export class CategoryGenerator {
  private geminiClient = getGeminiClient();

  async generateCategories(
    analysisResult: TopicAnalysisResult,
    userRequest: string,
    maxCategories: number = 15
  ): Promise<Category[]> {
    logger.info('Starting category generation', { maxCategories });

    const prompt = GENERATOR_CATEGORY_GENERATE_PROMPT_TEMPLATE
      .replace(/{{AI_TYPE_NAME_JA}}/g, analysisResult.ai_type_name_ja)
      .replace(/{{AI_TYPE_DESCRIPTION_JA}}/g, analysisResult.ai_type_description_ja)
      .replace(/{{TARGET_OUTPUT_JA}}/g, analysisResult.target_output_ja)
      .replace(/{{USER_REQUEST}}/g, userRequest);

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

      // Limit to maxCategories
      const limitedCategories = result.slice(0, maxCategories);
      
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
      'category_name_en', 'category_name_ja',
      'category_description_en', 'category_description_ja',
      'example_choices'
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