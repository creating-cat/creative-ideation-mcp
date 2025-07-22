/**
 * アイデアカテゴリ生成ツール
 * 創造的思考支援のためのメインMCPツール
 * 
 * 【主な用途】
 * - 新商品・サービスの企画検討
 * - ゲーム・コンテンツ制作の要素整理  
 * - マーケティング戦略の多角的検討
 * - 教育・研修プログラムの設計
 * - 問題解決のアプローチ整理
 * 
 * 【処理時間・パフォーマンス】
 * - 処理時間: 約 (1 + カテゴリ数) × 5-10秒
 * - API呼び出し: 1回（カテゴリ生成） + カテゴリ数回（選択肢生成）
 * - レート制限: Gemini API制限により5秒間隔で実行
 * - 推定所要時間: カテゴリ20個の場合 約2-4分
 */

import { z } from 'zod';
import { logger } from '../utils/logger';
import { CategoryGenerator } from '../modules/categoryGenerator';
import { OptionGenerator } from '../modules/optionGenerator';

// Input schema validation
export const generateIdeaCategoriesSchema = z.object({
  expert_role: z.string()
    .min(1, '専門家役割は必須です')
    .describe('カテゴリー生成時に採用する専門家の視点（例: "ゲームデザイナー", "料理研究家", "UXデザイナー"）'),
  target_subject: z.string()
    .min(1, '対象テーマは必須です')
    .describe('思考対象となるテーマや課題（例: "オリジナルボードゲーム", "新しいレシピ", "モバイルアプリのUI"）'),

  // 生成数の制御（統一された命名）
  target_categories: z.number()
    .int()
    .min(10)
    .max(30)
    .optional()
    .default(20)
    .describe('生成するカテゴリ数の目安。テーマの複雑さに応じて自動調整されます（10-30、推奨: 15-25）'),

  target_options_per_category: z.number()
    .int()
    .min(10)
    .max(200)
    .optional()
    .default(50)
    .describe('各カテゴリの選択肢数の目安。カテゴリの性質により自動調整されます（例: 曜日→7個、5段階評価→5個）'),

  // ランダム化制御
  randomize_selection: z.boolean()
    .optional()
    .default(false)
    .describe('AIの選択パターン偏りを回避するランダムサンプリング機能。通常AIが選びがちな定番選択肢を避け、意外性のある創造的なアイデアを得られます。ブレインストーミングや新規性重視の場面で特に有効'),

  random_sample_size: z.number()
    .int()
    .min(5)
    .max(200)  // target_options_per_categoryの最大値と同じ
    .optional()
    .default(10)
    .describe('ランダム選択時の最大出力数。各カテゴリでこの数を超える場合にランダム選択を実行。多様性を求める場合は target_options_per_category を大きく設定し、この値で絞り込むことを推奨'),

  domain_context: z.string()
    .optional()
    .describe('追加の領域固有コンテキストや制約条件（任意）。既に決まっている要件や条件がある場合や、より具体的で専門的な要求がある場合に指定することで、カテゴリ生成時やオプション生成時にこの内容を考慮して生成します。')
});

export type GenerateIdeaCategoriesInput = z.infer<typeof generateIdeaCategoriesSchema>;

/**
 * 出力形式の詳細
 * 
 * 【成功時の出力構造】
 * - success: true
 * - data.expert_role: 指定された専門家役割
 * - data.target_subject: 指定された対象テーマ
 * - data.categories: 生成されたカテゴリ配列
 *   - name: カテゴリ名（日本語）
 *   - description: カテゴリの説明（日本語）
 *   - options: 選択肢配列（日本語）
 * 
 * 【エラー時の出力構造】
 * - success: false
 * - error.code: エラーコード（INVALID_API_KEY, RATE_LIMIT_EXCEEDED等）
 * - error.message: エラーメッセージ
 * - error.details: 詳細情報（開発環境のみ）
 * 
 * 【推奨設定とベストプラクティス】
 * - 企画立案: target_categories: 15-20, target_options_per_category: 20-30
 * - ブレインストーミング: target_categories: 20-25, randomize_selection: true
 * - 詳細検討: target_categories: 10-15, target_options_per_category: 30-50
 * - 効率重視: target_categories: 10-12, random_sample_size: 8-12
 */
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
  name: 'generate_categories',
  description: `AIの創造的思考を支援するため、専門家の視点から特定のテーマに対する多角的なカテゴリーと選択肢を生成します。ボードゲーム設計、レシピ開発、コンテンツ制作など、幅広い創作活動で活用できます。

【重要】非決定性: 同じパラメータでも毎回異なる結果を生成します。この特性を活かして複数回実行することで、より多様なアイデアを収集できます。

【ランダムサンプリング】randomize_selection=trueで、AIの選択パターン偏りを回避し、通常では選ばれにくい創造的な選択肢を得られます。新規性や意外性を重視する場面で推奨。

【出力形式】
成功時: { success: true, data: { expert_role, target_subject, categories: [{ name, description, options: [...] }] } }
失敗時: { success: false, error: { code, message } }

【処理時間】約(1+カテゴリ数)×5-10秒（例：20カテゴリで2-4分）

【典型的な出力例】
カテゴリ例: "ゲーム要素", "プレイヤー数", "難易度設定" など
選択肢例: ["協力型", "対戦型", "パズル要素"] など`,
  input_schema: generateIdeaCategoriesSchema,

  async execute(args: any): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const startTime = Date.now();
    logger.info('アイデアカテゴリ生成ツールの実行を開始', { args });

    try {
      // Validate input
      const validatedInput = generateIdeaCategoriesSchema.parse(args);

      // Initialize modules
      const categoryGenerator = new CategoryGenerator();
      const optionGenerator = new OptionGenerator();

      // ステップ1: カテゴリー生成
      logger.info('ステップ1: カテゴリーを生成中');
      const categories = await categoryGenerator.generateCategories(
        validatedInput.expert_role,
        validatedInput.target_subject,
        validatedInput.target_categories,
        validatedInput.domain_context
      );

      // ステップ2: 各カテゴリーの選択肢生成
      logger.info('ステップ2: カテゴリーの選択肢を生成中');
      const categoriesWithOptions = await optionGenerator.generateOptionsForCategories(
        validatedInput.expert_role,
        validatedInput.target_subject,
        categories,
        validatedInput.target_options_per_category,
        validatedInput.domain_context
      );

      // ステップ3: ランダムサンプリングの適用（要求された場合）
      let finalCategories = categoriesWithOptions;
      if (validatedInput.randomize_selection) {
        logger.info('ステップ3: 選択肢にランダムサンプリングを適用中');
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
      logger.info('ツール実行が正常に完了', {
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
      logger.error('ツール実行が失敗', {
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
   * ランダムサンプリング適用
   * 
   * 各カテゴリの選択肢が指定されたサンプルサイズを超える場合、
   * Fisher-Yatesアルゴリズムを使用してランダムに選択肢を絞り込みます。
   * 
   * @param categories - 選択肢を含むカテゴリ配列
   * @param sampleSize - 各カテゴリの最大選択肢数
   * @returns サンプリング適用後のカテゴリ配列
   * 
   * @example
   * // 各カテゴリの選択肢を最大10個に制限
   * const sampled = applyRandomSampling(categories, 10);
   */
  applyRandomSampling(
    categories: Array<{ name: string; description: string; options: string[] }>,
    sampleSize: number
  ): Array<{ name: string; description: string; options: string[] }> {
    return categories.map(category => {
      if (category.options.length <= sampleSize) {
        // サンプルサイズより選択肢が少ない場合は全選択肢を返す
        return category;
      }

      // Fisher-Yatesアルゴリズムで選択肢配列をシャッフル
      const shuffledOptions = [...category.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      // 最初のsampleSize個の選択肢を取得
      return {
        ...category,
        options: shuffledOptions.slice(0, sampleSize)
      };
    });
  },

  /**
   * エラーコード判定
   * 
   * エラーメッセージの内容に基づいて適切なエラーコードを返します。
   * 
   * @param error - 発生したエラーオブジェクト
   * @returns エラーコード文字列
   */
  getErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    // APIキー関連エラー - 対処法: 環境変数GEMINI_API_KEYを確認
    if (message.includes('gemini_api_key') || message.includes('api key')) {
      return 'INVALID_API_KEY';
    }

    // レート制限エラー - 対処法: 時間をおいて再実行
    if (message.includes('rate limit') || message.includes('quota')) {
      return 'RATE_LIMIT_EXCEEDED';
    }

    // ネットワークエラー - 対処法: 接続確認後に再実行
    if (message.includes('network') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }

    // バリデーションエラー - 対処法: パラメータを確認
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    // 生成処理失敗 - 対処法: パラメータ調整して再実行
    if (message.includes('generation') || message.includes('failed to generate')) {
      return 'GENERATION_FAILED';
    }

    // その他の内部エラー - 対処法: ログ確認、サポートに連絡
    return 'INTERNAL_ERROR';
  }
};