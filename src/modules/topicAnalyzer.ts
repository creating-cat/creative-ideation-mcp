/**
 * Topic Analysis Module
 * Analyzes user requests to extract expert role and target subject
 */

import { getGeminiClient } from '../utils/gemini';
import { logger } from '../utils/logger';

export interface TopicAnalysisResult {
  ai_type_id: string;
  ai_type_name_en: string;
  ai_type_name_ja: string;
  ai_type_description_en: string;
  ai_type_description_ja: string;
  target_output_en: string;
  target_output_ja: string;
  target_output_id: string;
  target_output_context_en: string;
  target_output_context_ja: string;
  target_output_goal_en: string;
  target_output_goal_ja: string;
}

const USER_REQUEST_ANALYZE_PROMPT_TEMPLATE = `
# 概要
あなたは高性能な構文解析AI兼プロンプトエンジニアです。  
後述のユーザーリクエストに対して、ユーザーが求めている成果物を出力する仮想の生成AI（=目的AI）を仮定してください。  
そして、その目的AIに対するプロンプトジェネレーターを構築するための前提情報を抽出してください。

# 指示
以下の流れに従って、出力する内容を段階的に導出してください：

1. \`target_output\`とは、ユーザーが求めている成果物の「本体（=中心的なアウトプット）」を表すものであり、条件や仕様を含まない、シンプルかつ本質的な形で定義してください
  - \`target_output\`とは、AIが生成する中心的なアウトプットそのものであり、「どんな条件で」「どのくらいの数を」「どんな属性で」などの**要件やバリエーション指定は含めないでください**。
    - ただし、成果物に必ず含まれる本質となる条件は残してください。
  - 判断基準：
    - 「それが何か1つ生成されれば成立するもの」= \`target_output\`
    - 「それをどのように生成するかの条件・制約・バリエーション」＝ **仕様・要件（別項目で扱う）**

2. **\`target_output\` を生成するAIのタイプ（= \`ai_type\`）を定義してください。**
   - ユーザーがAIについて直接言及していなくても、その成果物を生成するAIがあると仮定して補完してください。
   - \`ai_type\` は \`target_output\` を生成する能力を持ったAIであり、
     \`target_output\` よりも **カテゴリ的に上位の概念（より抽象的）** を表すようにしてください。
   - 例：\`target_output\` が \`"curry recipe"\` の場合、\`ai_type\` は \`"recipe_generation"\` のように、より一般的なカテゴリになります。

3. **\`ai_type\`に関する各項目について定義してください。**
   - \`ai_type_id\` は snake_case 形式の短く一意な識別子にしてください（例: \`urban_legend_generation\`）。
   - \`ai_type_name\`は人間に読ませるための自然な名称にしてください。
   - \`ai_type_description\`は \`ai_type\`の目的を自然な一文で説明してください。
   - \`target_output_id\` は \`target_output\` を一意に識別するための snake_case 形式のIDです（例: \`curry_recipe_detail\`, \`spooky_urban_legend_story\`）。\`ai_type_id\` とは独立して、\`target_output\` の内容を具体的に示すものにしてください。

4. \`target_output_context\`は、\`ai_type_name\`が\`target_output\`を生成できるようにするためのコンテキスト内容を定義してください。
  - ユーザーリクエストに対して\`ai_type_name\`がどのような専門家の立場になり、どのような内容をどの品質で出力するべきかを、正確かつ具体的に説明してください。
  - 生成する \`target_output_context\` の構成要素  
    - 1. \`ai_type_name\`に与える専門家の役割（例：SEOライター、料理研究家、キャリアアドバイザーなど）  
    - 2. \`ai_type_name\`が取り組むタスクの具体的な説明（何をどうするか）  
    - 3. 出力物に必要な品質・形式・制約条件（誰向けなのか、読みやすさ、形式、内容の深さなど）

5. \`target_output_goal\`は\`ai_type_name\`が実行すべき最終目標を定義します。
  - \`target_output_goal\`に含めるべき要素
    - 1. \`ai_type_name\`が実現すべき最終アウトプットの目的（ユーザーがそれによって何を達成したいのか）
    - 2. その目的を達成するために、\`ai_type_name\`が出力で満たすべき条件（品質、読者層、応用可能性など）
    - 3. 結果的にユーザーが得る成果・効果・状態（行動の変化、理解の促進、ツールとしての使いやすさなど）

6. **各項目について、英語（\`*\_en\`）と日本語（\`*\_ja\`）の両方を出力してください。**

# ユーザーリクエスト：
{{USER_REQUEST}}

# 出力フォーマット：
出力は **必ず以下の形式の JSON オブジェクト1つだけ** を返してください。

{
  "ai_type_id": "specific_ai_type_identifier",
  "ai_type_name_en": "AI Type Name (English)",
  "ai_type_name_ja": "AIタイプ名（日本語）",
  "ai_type_description_en": "Brief description of what this AI type does.",
  "ai_type_description_ja": "このAIタイプが行うことの簡単な説明。",
  "target_output_en": "Core output the user wants (English)",
  "target_output_ja": "ユーザーが求める中核的な成果物（日本語）",
  "target_output_id": "specific_target_output_identifier",
  "target_output_context_en": "Context for the AI to generate the target output (role, task, quality).",
  "target_output_context_ja": "AIが目的成果物を生成するためのコンテキスト（役割、タスク、品質）。",
  "target_output_goal_en": "The ultimate goal the AI should achieve with the output (user's aim, conditions, user benefits).",
  "target_output_goal_ja": "AIが出力で達成すべき最終目標（ユーザーの狙い、達成条件、ユーザーの便益）。"
}

## 制約・前提：
- 出力は **JSONオブジェクトのみ** にしてください。
- **「了解しました」「以下が出力です」などの文や、マークダウン記法（\`\`\`や#など）は一切使用しないでください。**
- JSONのフォーマットに間違いないか、可能であれば返答前に返信文字列をJSONパースを内部的に実行してみてエラーがないか確認し、エラーがあれば修正してから返信してください。
`;

export class TopicAnalyzer {
  private geminiClient = getGeminiClient();

  async analyzeUserRequest(userRequest: string): Promise<TopicAnalysisResult> {
    logger.info('Starting topic analysis', { userRequest });

    const prompt = USER_REQUEST_ANALYZE_PROMPT_TEMPLATE.replace('{{USER_REQUEST}}', userRequest);

    try {
      const result = await this.geminiClient.generateContent(prompt);
      
      // Validate the result structure
      this.validateAnalysisResult(result);
      
      logger.info('Topic analysis completed successfully');
      return result as TopicAnalysisResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Topic analysis failed', { error: errorMessage });
      throw new Error(`Failed to analyze user request: ${errorMessage}`);
    }
  }

  private validateAnalysisResult(result: any): void {
    const requiredFields = [
      'ai_type_id', 'ai_type_name_en', 'ai_type_name_ja',
      'ai_type_description_en', 'ai_type_description_ja',
      'target_output_en', 'target_output_ja', 'target_output_id',
      'target_output_context_en', 'target_output_context_ja',
      'target_output_goal_en', 'target_output_goal_ja'
    ];

    for (const field of requiredFields) {
      if (!result[field] || typeof result[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }
  }
}