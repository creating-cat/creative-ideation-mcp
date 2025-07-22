# コード内ドキュメント改善タスク

## タスク概要
- **作成日**: 2025-07-22
- **優先度**: 高
- **推定工数**: 3-4時間
- **担当者**: 
- **期限**: 1週間以内

## 問題の概要
`src/tools/generateIdeaCategories.ts` において、実装の品質は高いものの、コード内ドキュメントに以下の具体的な問題がある。

## 詳細な問題点

### 1. 言語の不整合問題
**現状**: 英語と日本語が無秩序に混在
- ツール名: `generate_idea_categories` (英語)
- ツール説明: `Generate contextual categories and options for creative thinking...` (英語)
- パラメータ説明: `expert_role` は英語説明だが例は `"ゲームデザイナー"` (日本語)
- 実際の出力: 完全に日本語
- コメント: 英語と日本語が混在

**問題の影響**: 
- 開発者が混乱する
- 国際化対応時の方針が不明確
- コードレビュー時の一貫性チェックが困難

### 2. ツール説明の抽象性問題
**現状**: `Generate contextual categories and options for creative thinking based on expert role and target subject`
**具体的な問題**:
- "creative thinking" が抽象的すぎて実際の用途が不明
- どのような場面で使うツールなのかが分からない
- ビジネス価値や解決する課題が見えない
- 類似ツールとの差別化点が不明

**問題の影響**:
- ユーザーがツールの適用場面を判断できない
- 導入検討時に価値を評価できない
- 適切でない用途での使用リスク

### 3. パラメータ説明の不備
**現状の具体的な問題**:

#### `expert_role` パラメータ
- 説明: `The expert role perspective to take when generating categories`
- 問題: 「perspective」が曖昧、どの程度具体的に指定すべきか不明
- 例: `"ゲームデザイナー", "料理研究家"` だが、粒度の指針がない

#### `target_categories` パラメータ  
- 説明: `生成するカテゴリ数の目安`
- 問題: 「目安」の意味が不明確、実際にどう調整されるのか説明なし
- 範囲: 10-30だが、なぜこの範囲なのか根拠がない

#### `target_options_per_category` パラメータ
- 説明: `1カテゴリあたりの選択肢生成数の目安（カテゴリの性質により自動調整）`
- 問題: 「自動調整」の具体的なロジックが不明
- 最大200の根拠が不明

#### `domain_context` パラメータ
- 説明: `Additional domain-specific context or constraints to consider (optional)`
- 問題: 「domain-specific」が専門用語、具体例が不足
- どの程度詳細に書くべきか不明

### 4. 技術仕様の説明不足
**現状の問題**:
- 処理時間について一切言及なし（実際は2-4分程度）
- API呼び出し回数の説明なし（1 + カテゴリ数回）
- メモリ使用量やリソース消費の情報なし
- レート制限の影響について説明なし
- 同時実行制限について言及なし

**問題の影響**:
- パフォーマンス計画が立てられない
- 本番環境での運用設計ができない
- ユーザーが処理時間を予測できない

### 5. 出力形式説明の不完全性
**現状の問題**:
- `GenerateIdeaCategoriesOutput` インターフェースはあるが説明が不十分
- 成功時の具体的な出力例がない
- エラー時の出力例がない
- ランダムサンプリング適用時の出力の違いが不明
- 各フィールドの意味や用途の説明なし

**問題の影響**:
- 出力データの活用方法が分からない
- エラー時の対処が困難
- 統合時の実装設計ができない

### 6. エラーハンドリングの説明不足
**現状の問題**:
```typescript
getErrorCode(error: Error): string {
  if (error.message.includes('GEMINI_API_KEY')) {
    return 'INVALID_API_KEY';
  }
  // ... 他の判定
}
```
- エラーコードの意味がコメントで説明されていない
- 各エラーの対処法が不明
- エラー判定ロジックが簡素すぎる（部分文字列マッチのみ）
- エラーの発生条件が不明

### 7. コメント品質の問題
**現状の問題**:
- ファイル冒頭: `Generate Idea Categories Tool` のみで詳細説明なし
- 関数コメント: JSDocスタイルでない
- インラインコメント: 処理の意図が説明されていない
- アルゴリズム説明: Fisher-Yatesアルゴリズムの説明が不十分

### 8. 実用性・保守性の問題
**現状の問題**:
- 推奨設定値の説明なし
- 用途別の設定例なし
- パフォーマンス最適化のガイダンスなし
- 将来の機能拡張を考慮したコメント構造でない
- 新しい開発者がコードを理解するのに時間がかかる構造

**問題の影響**:
- 適切な設定値が分からない
- パフォーマンス問題の原因特定が困難
- 機能追加時の影響範囲が予測できない
- チーム開発時の効率低下

## 修正対象ファイル
- [x] `src/tools/generateIdeaCategories.ts`

## 詳細タスクと修正案

### Task 1: 言語の統一
- [x] **1-1**: ツール説明を日本語中心に統一
- [x] **1-2**: パラメータ説明の言語を統一
- [x] **1-3**: コメントを日本語に統一

**修正案**:
```typescript
// 修正前
description: 'Generate contextual categories and options for creative thinking based on expert role and target subject'

// 修正後
description: '専門家の視点から多角的思考のためのカテゴリと選択肢を生成するツール。ブレインストーミング、企画立案、アイデア発想を支援します。'
```

### Task 2: ツール説明の具体化
- [x] **2-1**: 抽象的な「creative thinking」を具体的な用途に変更
- [x] **2-2**: 実際の使用場面を明記
- [x] **2-3**: ツールの価値・メリットを説明

**修正案**:
```typescript
/**
 * アイデア発想支援ツール
 * 
 * 専門家の視点から特定のテーマについて多角的に考えるためのカテゴリと選択肢を生成します。
 * ブレインストーミング、企画立案、問題解決、創作活動などの場面で活用できます。
 * 
 * 【主な用途】
 * - 新商品・サービスの企画検討
 * - ゲーム・コンテンツ制作の要素整理
 * - マーケティング戦略の多角的検討
 * - 教育・研修プログラムの設計
 * - 問題解決のアプローチ整理
 * 
 * 【特徴】
 * - 専門家の知見を活用した高品質な発想支援
 * - カテゴリごとに整理された体系的なアイデア
 * - 大量の選択肢から効率的な絞り込み機能
 */
```

### Task 3: パラメータ説明の改善
- [x] **3-1**: 各パラメータの目的と効果を明確化
- [x] **3-2**: 「目安」の概念を詳しく説明
- [x] **3-3**: 実用的な設定例を追加

**修正案**:
```typescript
expert_role: z.string()
  .min(1, '専門家役割の指定は必須です')
  .describe('思考の視点となる専門家の役割（例: "ゲームデザイナー", "マーケティング戦略家", "UXデザイナー"）'),

target_subject: z.string()
  .min(1, '対象テーマの指定は必須です')
  .describe('多角的に検討したいテーマや課題（例: "新しいボードゲーム", "ECサイト改善", "オンライン研修"）'),

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
  .default(20)
  .describe('各カテゴリの選択肢数の目安。カテゴリの性質により自動調整されます（例: 曜日→7個、5段階評価→5個）'),

randomize_selection: z.boolean()
  .optional()
  .default(false)
  .describe('大量の選択肢から一部をランダム選択するか。アイデアの多様性確保や効率的な絞り込みに有効'),

random_sample_size: z.number()
  .int()
  .min(5)
  .max(200)
  .optional()
  .default(10)
  .describe('ランダム選択時の最大出力数。各カテゴリでこの数を超える場合にランダム選択を実行'),

domain_context: z.string()
  .optional()
  .describe('追加の文脈情報や制約条件（例: "家族向け", "B2B企業向け", "予算100万円以内"）')
```

### Task 4: 技術情報の追加
- [x] **4-1**: 処理時間の説明を追加
- [x] **4-2**: API使用量の説明を追加
- [x] **4-3**: パフォーマンス特性を明記

**修正案**:
```typescript
/**
 * 【処理時間・パフォーマンス】
 * - 処理時間: 約 (1 + カテゴリ数) × 5-10秒
 * - API呼び出し: 1回（カテゴリ生成） + カテゴリ数回（選択肢生成）
 * - レート制限: Gemini API制限により5秒間隔で実行
 * - 推定所要時間: カテゴリ20個の場合 約2-4分
 * 
 * 【使用リソース】
 * - Gemini API: 1.5-pro モデル使用
 * - トークン消費: 中程度（プロンプト最適化済み）
 * - メモリ使用: 軽量（ストリーミング処理）
 */
```

### Task 5: 出力形式の詳細説明
- [x] **5-1**: 成功時の出力構造を詳しく説明
- [x] **5-2**: エラー時の出力例を追加
- [x] **5-3**: ランダムサンプリング適用時の違いを明記

**修正案**:
```typescript
/**
 * 出力形式の詳細
 */
export interface GenerateIdeaCategoriesOutput {
  /** 処理成功フラグ */
  success: boolean;
  /** 成功時のデータ（success: true の場合のみ） */
  data?: {
    /** 指定された専門家役割 */
    expert_role: string;
    /** 指定された対象テーマ */
    target_subject: string;
    /** 生成されたカテゴリと選択肢の配列 */
    categories: Array<{
      /** カテゴリ名（日本語） */
      name: string;
      /** カテゴリの説明・目的 */
      description: string;
      /** そのカテゴリの選択肢一覧 */
      options: string[];
    }>;
  };
  /** エラー時の詳細情報（success: false の場合のみ） */
  error?: {
    /** エラーコード（INVALID_API_KEY, RATE_LIMIT_EXCEEDED等） */
    code: string;
    /** エラーメッセージ */
    message: string;
    /** 詳細情報（開発環境でのみ出力） */
    details?: any;
  };
}

/**
 * 出力例
 * 
 * 【成功時】
 * {
 *   "success": true,
 *   "data": {
 *     "expert_role": "ゲームデザイナー",
 *     "target_subject": "協力型ボードゲーム",
 *     "categories": [
 *       {
 *         "name": "ゲームメカニクス",
 *         "description": "ゲームの基本的な仕組みや遊び方",
 *         "options": ["ワーカープレイスメント", "デッキ構築", "協力型パズル"]
 *       }
 *     ]
 *   }
 * }
 * 
 * 【エラー時】
 * {
 *   "success": false,
 *   "error": {
 *     "code": "INVALID_API_KEY",
 *     "message": "GEMINI_API_KEY environment variable is required"
 *   }
 * }
 */
```

### Task 6: エラーハンドリングの改善
- [x] **6-1**: エラーコード判定ロジックの詳細化
- [x] **6-2**: 各エラーコードの説明を追加
- [x] **6-3**: エラー対処法をコメントで説明

**修正案**:
```typescript
/**
 * エラーコード判定
 * APIエラーやシステムエラーを適切なエラーコードに分類
 */
getErrorCode(error: Error): string {
  const message = error.message.toLowerCase();
  
  // API キー関連エラー
  if (message.includes('gemini_api_key') || message.includes('api key') || message.includes('unauthorized')) {
    return 'INVALID_API_KEY';  // 対処法: API キーの確認・更新
  }
  
  // レート制限・クォータ関連エラー
  if (message.includes('rate limit') || message.includes('quota') || message.includes('too many requests')) {
    return 'RATE_LIMIT_EXCEEDED';  // 対処法: 時間をおいて再実行
  }
  
  // ネットワーク関連エラー
  if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
    return 'NETWORK_ERROR';  // 対処法: ネットワーク環境の確認
  }
  
  // 入力値検証エラー
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'VALIDATION_ERROR';  // 対処法: パラメータ値の確認
  }
  
  // JSON解析エラー
  if (message.includes('json') || message.includes('parse') || message.includes('syntax')) {
    return 'JSON_PARSE_ERROR';  // 対処法: 自動修復を試行、失敗時は再実行
  }
  
  // 生成処理失敗
  if (message.includes('generation') || message.includes('failed to generate')) {
    return 'GENERATION_FAILED';  // 対処法: パラメータ調整して再実行
  }
  
  // その他の内部エラー
  return 'INTERNAL_ERROR';  // 対処法: ログ確認、サポートに連絡
}
```

### Task 7: JSDocコメントの充実
- [x] **7-1**: 関数にJSDocコメントを追加
- [x] **7-2**: パラメータと戻り値の説明を詳細化
- [x] **7-3**: 使用例をコメントに含める

**修正案**:
```typescript
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
): Array<{ name: string; description: string; options: string[] }>
```

### Task 8: 実用性の向上
- [x] **8-1**: 具体的な使用場面の説明を追加
- [x] **8-2**: 推奨設定値の説明を追加
- [x] **8-3**: ベストプラクティスをコメントで説明

**修正案**:
```typescript
/**
 * 推奨設定とベストプラクティス
 * 
 * 【用途別推奨設定】
 * - 企画立案: target_categories: 15-20, target_options_per_category: 20-30
 * - ブレインストーミング: target_categories: 20-25, randomize_selection: true
 * - 詳細検討: target_categories: 10-15, target_options_per_category: 30-50
 * - 効率重視: target_categories: 10-12, random_sample_size: 8-12
 * 
 * 【パフォーマンス最適化】
 * - 処理時間短縮: target_categories を少なめに設定
 * - 網羅性重視: target_options_per_category を多めに設定
 * - バランス重視: デフォルト値（20, 20）を使用
 */
```

## 完了基準
- [x] 全てのチェックボックスが完了
- [x] 言語の統一性確認（日本語中心）
- [x] 説明の具体性・実用性確認
- [x] JSDocコメントの品質確認
- [x] エラーハンドリングの網羅性確認

## テスト・検証手順
1. **コード品質確認**
   - TypeScriptコンパイルエラーなし
   - ESLint警告なし
   - JSDocコメントの正確性確認

2. **説明の妥当性確認**
   - 実装と説明の整合性確認
   - 例示の動作確認
   - 推奨設定値の妥当性確認

3. **実用性確認**
   - 開発者が理解しやすいか
   - 実際の使用場面で役立つか
   - メンテナンスしやすいか

## 完了後のアクション
- [ ] `completed/YYYYMMDD-code-documentation-improvements.md` に移動
- [ ] 他のモジュールファイルの同様改善検討
- [ ] コードレビューでの品質確認

## 期待される効果
- **開発効率向上**: 明確な説明により実装理解が容易
- **保守性向上**: 適切なドキュメントにより将来の修正が効率的
- **ユーザビリティ向上**: 実用的な情報により適切な使用が可能
- **品質向上**: 一貫性のある説明により信頼性が向上