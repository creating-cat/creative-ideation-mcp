---
title: "Gemini Context Options MCP Server - 実装仕様書"
description: "コンテキストオプション生成MCPサーバーの包括的な実装仕様"
version: "1.0"
created: "2025-01-22"
status: "draft"
---

# Gemini Context Options MCP Server - 実装仕様書

## 1. プロジェクト概要

### プロジェクト名
**gemini-context-options-mcp-server**

### 目的
GPGGプロジェクトの核心機能を抽出し、特定のトピックやコンテキストに対して多角的な視点やアイデアを提供するためのカテゴリーと選択肢を生成するMCPサーバーを実装する。主にAIが創造的思考を行う際の支援ツールとして機能させる。

### 背景
- AIは特定のトピック（例：ボードゲーム設計）について考える際、多角的な視点が必要
- 人間の専門家は自然と多様な観点から問題を考えられるが、AIはそれを明示的に提供されると有益
- カテゴリーと選択肢の形で思考の枠組みを提供することで、AIの創造的思考を支援できる

### スコープ

#### 含まれる機能
- [x] トピック/コンテキスト分析
- [x] 関連カテゴリーの生成
- [x] 各カテゴリーの選択肢生成
- [x] 日本語対応
- [x] カテゴリー数と選択肢数の制御
- [x] エラーハンドリングとログ機能
- [x] ランダムチョイスモード

#### 含まれない機能
- プロンプト生成機能（カテゴリーと選択肢の提供のみ）
- 詳細/高速モードの切り替え（単一の処理モードのみ）
- お気に入り機能
- 画像生成機能
- Web UI

## 2. 拡張機能: ランダムチョイスモード

### 概要
**目的**: AIの選択パターンの類似性を回避し、オリジナリティを向上させる

### 2つの主要用途
1. **網羅的探索モード**: より多くの選択肢を確認したい場合
2. **ランダムサンプリングモード**: 多くの選択肢の中からランダムに絞った選択肢を得たい場合

### 入力スキーマ設計
```typescript
export const generateIdeaCategoriesSchema = z.object({
  expert_role: z.string().min(1).describe('専門家役割'),
  target_subject: z.string().min(1).describe('対象テーマ'),
  
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
  
  domain_context: z.string().optional().describe('追加のドメイン固有コンテキスト')
});
```

### 動作パターン
1. **通常モード**: `target_options_per_category`個生成 → 全て返却
2. **網羅的探索**: `target_options_per_category`を大きく設定 → 全て返却
3. **ランダムサンプリング**: `target_options_per_category`個生成 → `random_sample_size`個をランダム選択

## 3. アーキテクチャ設計

### システム構成
```
┌─────────────────┐    ┌──────────────────────────────┐    ┌─────────────────┐
│   MCP Client    │    │   MCP Server                 │    │  Gemini API     │
│   (Kiro等)     │◄──►│  (gemini-context-options-    │◄──►│                 │
│                 │    │   mcp-server)                │    │                 │
└─────────────────┘    └──────────────────────────────┘    └─────────────────┘
```

### 主要コンポーネント
1. **MCPサーバー本体** (`src/index.ts`)
   - MCP通信の管理
   - ツールの登録と実行

2. **トピック分析モジュール** (`src/modules/topicAnalyzer.ts`)
   - 入力されたトピック/コンテキストの分析
   - 関連する思考領域の特定

3. **カテゴリー生成モジュール** (`src/modules/categoryGenerator.ts`)
   - トピックに関連するカテゴリーの生成
   - 各カテゴリーの説明の生成

4. **選択肢生成モジュール** (`src/modules/optionGenerator.ts`)
   - カテゴリー別選択肢の生成
   - 日本語対応

5. **統合ツール** (`src/tools/generateIdeaCategories.ts`)
   - 上記モジュールを統合した単一ツール

### 技術スタック
- **言語**: TypeScript
- **MCPフレームワーク**: @modelcontextprotocol/sdk
- **AIサービス**: Google Gemini API (@google/genai)
- **バリデーション**: Zod
- **設定管理**: dotenv
- **ビルドツール**: TypeScript Compiler
- **パッケージ名**: gemini-context-options-mcp-server

### 重要な実装機能
- **レート制限管理**: 5秒間隔の自動API呼び出し制御
- **JSON自動修正**: パースエラー時のAIによる自動修正
- **包括的リトライ**: 最大3回の自動リトライ機能
- **APIレスポンス前処理**: マークダウン記法の自動除去
- **ランダムサンプリング**: メモリ内でのシャッフル・選択処理
- **統一された命名規則**: `target_*`形式でのパラメータ命名

## 4. データフロー設計

### 基本フロー
1. **入力**: クライアントが専門家役割と対象テーマを送信
2. **コンテキスト構築**: 専門家の視点でのカテゴリー生成プロンプトを構築
3. **カテゴリー生成**: 専門家の視点から関連するカテゴリーを生成
4. **選択肢生成**: 各カテゴリーの選択肢を生成
5. **出力**: 構造化されたJSONデータを返却

### データ構造例
```json
{
  "success": true,
  "data": {
    "expert_role": "ゲームデザイナー",
    "target_subject": "オリジナルボードゲーム",
    "categories": [
      {
        "name": "ゲームメカニクス",
        "description": "ゲームの基本的な動作や仕組み",
        "options": [
          "ワーカープレイスメント",
          "デッキ構築",
          "エリアコントロール",
          "..."
        ]
      }
    ]
  }
}
```

## 5. 実装計画

### フェーズ1: 基盤構築（1-2日）
#### 目標
MCPサーバーの基本構造とプロジェクト設定を完成させる。

#### 成果物
- [ ] プロジェクト初期化（package.json, tsconfig.json等）
- [ ] MCPサーバー基本構造の実装
- [ ] 環境変数設定とGemini API接続確認
- [ ] 基本的なエラーハンドリング実装
- [ ] ログ機能の実装

#### 技術タスク
1. **プロジェクト設定**
   ```bash
   npm init
   npm install @modelcontextprotocol/sdk @google/genai zod dotenv
   npm install -D typescript @types/node ts-node
   ```

2. **基本ディレクトリ構造**
   ```
   src/
   ├── index.ts              # MCPサーバーエントリーポイント
   ├── config/
   │   └── environment.ts    # 環境変数管理
   ├── utils/
   │   ├── logger.ts         # ログ機能
   │   ├── gemini.ts         # Gemini API クライアント
   │   ├── rateLimiter.ts    # レート制限管理
   │   └── jsonCorrector.ts  # JSON自動修正機能
   ├── modules/              # 機能モジュール
   └── tools/                # MCPツール実装
   ```

### フェーズ2: トピック分析モジュール実装（1-2日）
#### 目標
トピック分析機能を完成させる。

#### 成果物
- [ ] トピック分析モジュールの実装
- [ ] 分析プロンプトテンプレートの実装
- [ ] JSON解析とエラー修正機能
- [ ] 単体テストの実装

### フェーズ3: カテゴリー生成モジュール実装（1-2日）
#### 目標
カテゴリー生成機能を完成させる。

#### 成果物
- [ ] カテゴリー生成モジュールの実装
- [ ] カテゴリー生成プロンプトの実装
- [ ] EXAMPLE_CHOICES生成機能の実装
- [ ] カテゴリー数制限機能
- [ ] 単体テストの実装

### フェーズ4: 選択肢生成モジュール実装（1-2日）
#### 目標
選択肢生成機能を完成させる。

#### 成果物
- [ ] 選択肢生成モジュールの実装
- [ ] 選択肢生成プロンプトの実装
- [ ] EXAMPLE_CHOICES機能の実装
- [ ] 選択肢数制限機能
- [ ] ランダムサンプリング機能
- [ ] 単体テストの実装

### フェーズ5: 統合ツール実装（1日）
#### 目標
すべての機能を統合した単一ツールを完成させる。

#### 成果物
- [ ] `generate_idea_categories` ツールの実装
- [ ] 入力パラメータのバリデーション
- [ ] エラーハンドリングの統合
- [ ] 統合テストの実装

### フェーズ6: テスト・ドキュメント・パッケージング（2-3日）
#### 目標
本番利用可能な状態まで品質を向上させる。

#### 成果物
- [ ] 包括的なテストスイート
- [ ] ユーザードキュメント
- [ ] npmパッケージ化
- [ ] CI/CD設定

## 6. API設計

### MCPツール仕様

#### generate_idea_categories（単一ツール）

##### 入力パラメータ
```typescript
{
  expert_role: string;                    // 必須: 専門家の役割
  target_subject: string;                 // 必須: 対象テーマ
  target_categories?: number;             // オプション: 目標カテゴリー数（デフォルト: 20）
  target_options_per_category?: number;   // オプション: カテゴリーあたりの目標選択肢数（デフォルト: 20）
  randomize_selection?: boolean;          // オプション: ランダム選択（デフォルト: false）
  random_sample_size?: number;            // オプション: ランダム選択時の最大出力数（デフォルト: 10）
  domain_context?: string;                // オプション: 追加のドメインコンテキスト
}
```

##### 出力形式
```typescript
{
  success: boolean;
  data?: {
    expert_role: string;
    target_subject: string;
    categories: Array<{
      name: string;               // カテゴリー名（日本語）
      description: string;        // カテゴリーの説明（日本語）
      options: Array<string>;     // 選択肢（日本語）
    }>;
    metadata: {
      total_categories: number;   // 生成されたカテゴリー数
      total_options: number;      // 生成された選択肢の総数
      processing_time_ms: number; // 処理時間（ミリ秒）
    };
  };
  error?: {
    code: string;                 // エラーコード
    message: string;              // エラーメッセージ
    details?: any;                // 詳細情報（開発時のみ）
  };
}
```

## 7. プロンプト設計

### カテゴリー生成プロンプト
```typescript
const CATEGORY_GENERATION_PROMPT = `
# 概要
「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について多角的に考えるためのカテゴリーを{{TARGET_CATEGORIES}}個程度を目安に考案してください。

# 指示
- 各カテゴリーは、専門家の視点から見た異なる側面や観点を表すものにしてください
- カテゴリー名は簡潔で明確なものにしてください
- 説明は1-2文程度の簡潔なものにしてください
- 各カテゴリーに、そのカテゴリーに該当する典型的な選択肢の例を3つ含めてください
- 例は、後で生成される選択肢の具体性レベルや表現スタイルの参考となります

# 専門家役割
{{EXPERT_ROLE}}

# 対象テーマ
{{TARGET_SUBJECT}}

# 追加コンテキスト（全体要望）
{{DOMAIN_CONTEXT}}

# 注意事項
上記は「{{TARGET_SUBJECT}}」全体に関する要望や制約です。
カテゴリー生成に関連する部分があれば考慮し、関連しない内容は無視してください。

# 出力形式
以下の形式でJSONを出力してください：

[
  {
    "name": "カテゴリー名",
    "description": "カテゴリーの説明",
    "example_choices": ["例1", "例2", "例3"]
  }
]
`;
```

### 選択肢生成プロンプト
```typescript
const OPTIONS_GENERATION_PROMPT = `
# 概要
「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について考える際の、カテゴリー「{{CATEGORY_NAME}}」に対する選択肢を{{TARGET_OPTIONS}}個程度を目安に生成してください。

# 指示
- 原則として、{{TARGET_OPTIONS}}個程度を目安に生成してください。
- ただし、カテゴリの性質上、選択肢の数が自然と限定される場合（例：カテゴリが「曜日」であれば選択肢は7つ、「評価（5段階）」であれば5つなど）は、無理に{{TARGET_OPTIONS}}個を目指す必要はありません。その場合は、考えられる全てのバリエーションを網羅するようにしてください。
- これらの選択肢は、AIに対してプロンプトとして入力される文の一部になります。
- したがって、単なるキーワードではなく、プロンプト内で意味を成し、「{{TARGET_SUBJECT}}」の生成に寄与するような自然な表現を意識してください。
- 同じような表現ばかりにならないようにしてください。
- ポジティブ／ネガティブや多様な軸（属性、形式、スタイル、性質など）で分散してください。
- 選択肢例を参考に、同じような具体性レベルや表現スタイルで生成してください。

# 専門家役割
{{EXPERT_ROLE}}

# 対象テーマ
{{TARGET_SUBJECT}}

# カテゴリー情報
- カテゴリー名: {{CATEGORY_NAME}}
- カテゴリーの説明: {{CATEGORY_DESCRIPTION}}
- 選択肢例（参考）: {{EXAMPLE_CHOICES}}

# 大元のユーザーリクエスト
以下の内容に{{CATEGORY_NAME}}についての情報が含まれている場合は、それを取り入れて反映してください。

====大元のユーザーリクエスト(ここから)====
{{DOMAIN_CONTEXT}}
====大元のユーザーリクエスト(ここまで)====

# 出力形式
以下の形式でJSONを出力してください：

[
  "選択肢1",
  "選択肢2"
]
`;
```

## 8. エラーハンドリング

### 高度なエラーハンドリング機能

#### JSON自動修正機能
- JSONパースエラー時、AIによる自動修正
- 元のコンテキストを保持した修正プロンプト
- マークダウン記法や説明文の自動除去

#### APIレスポンス前処理
```typescript
function preprocessApiResponse(apiResult: any): string {
  // マークダウンのコードブロックを取り除く
  jsonString = jsonString.replace(/```json/g, '');
  jsonString = jsonString.replace(/```/g, '');
  jsonString = jsonString.trim(); // 前後の空白を削除
  return jsonString;
}
```

#### 包括的リトライ機能
- 各処理段階での自動リトライ（最大3回）
- エラー詳細ログ出力
- 段階的エラーメッセージ

### エラーコード体系
- `INVALID_API_KEY`: APIキーが無効または未設定
- `API_RATE_LIMIT`: APIレート制限に達した
- `API_SERVICE_ERROR`: APIサービスエラー
- `INVALID_PARAMETERS`: パラメータ検証エラー
- `JSON_PARSE_ERROR`: JSON解析エラー（自動修正試行後）
- `GENERATION_FAILED`: カテゴリー生成失敗（リトライ後）
- `INTERNAL_ERROR`: 内部エラー

## 9. レート制限対応

### 自動レート制限管理
- **5秒間隔制御**: API呼び出し間に自動的に5秒間隔を確保
- **タイムスタンプ管理**: 前回呼び出し時刻を記録し、適切な待機時間を計算
- **自動待機**: 必要に応じて自動的に待機処理を実行

```typescript
const MIN_API_CALL_INTERVAL_MS = 5000; // 5秒間隔
let lastApiCallTimestamp = 0;

async function callGenerativeAI(model: string, contents: string) {
  const currentTime = Date.now();
  const elapsedTime = currentTime - lastApiCallTimestamp;
  
  if (lastApiCallTimestamp !== 0 && elapsedTime < MIN_API_CALL_INTERVAL_MS) {
    const waitTime = MIN_API_CALL_INTERVAL_MS - elapsedTime;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCallTimestamp = Date.now();
  return await ai.models.generateContent({ model, contents });
}
```

### 処理時間の見積もり
- **基本処理**: 1回のカテゴリー生成 + 20カテゴリー × 選択肢生成
- **API呼び出し回数**: 約41回 (1 + 20×2) ※デフォルト設定時
- **推定処理時間**: 約2-3分 (5秒間隔 × 40回 + 処理時間)

## 10. 品質要件

### パフォーマンス
- **レスポンス時間**: 2-3分（レート制限により）
- **API呼び出し間隔**: 5秒間隔（Gemini APIレート制限対応）
- **推定API呼び出し回数**: 約41回 (1 + 20×2) ※デフォルト設定時
- **同時リクエスト**: 1件のみ（MCPサーバーの性質上）
- **カテゴリー数**: デフォルト20件（最大30件）
- **選択肢数**: デフォルト20件/カテゴリー（最大200件）
- **ランダムサンプリング**: 生成後にメモリ内で処理（追加API呼び出しなし）

### 処理制約
- **MCPプログレス表示**: 不可（標準入出力通信のため）
- **並行処理**: 不可（レート制限のため順次処理）
- **処理時間通知**: 開始時にユーザーへ所要時間を通知

### 可用性
- API制限に対する適切なエラーハンドリング
- ネットワーク障害時の再試行機能
- 設定不備時の明確なエラーメッセージ

### セキュリティ
- APIキーの安全な管理
- 入力データの適切なサニタイズ
- ログでの機密情報の除外

## 11. 使用例とユースケース

### 基本的な使用例

#### 例1: オリジナルボードゲームの設計

##### 入力
```json
{
  "expert_role": "ゲームデザイナー",
  "target_subject": "オリジナルボードゲーム",
  "target_categories": 12,
  "target_options_per_category": 15
}
```

##### 期待される出力
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "ゲームメカニクス",
        "description": "ゲームの基本的な仕組みや遊び方",
        "options": [
          "エリア制御",
          "デッキ構築",
          "ワーカープレイスメント",
          "ダイスロール",
          "カードドラフト",
          "協力ゲーム",
          "正体隠匿",
          "リソース管理",
          "タイル配置",
          "オークション",
          "パズル要素",
          "リアルタイム",
          "レガシー要素",
          "モジュラーボード",
          "非対称パワー"
        ]
      }
    ]
  }
}
```

### AIによる活用パターン

#### パターン1: 段階的アイデア展開
1. **初期段階**: 大まかなトピックでカテゴリーを生成
2. **詳細化**: 特定のカテゴリーに焦点を当てて再度生成
3. **組み合わせ**: 複数の選択肢を組み合わせて具体案を作成

#### パターン2: 多角的検討
1. **全体俯瞰**: 幅広いカテゴリーで全体像を把握
2. **重要度評価**: 各カテゴリーの重要度を判断
3. **優先順位付け**: 重要なカテゴリーから詳細検討

#### パターン3: 創造的発想
1. **制約なし生成**: 最大数でカテゴリーと選択肢を生成
2. **ランダム組み合わせ**: 異なるカテゴリーの選択肢を組み合わせ
3. **新規性評価**: 既存のものとの差別化ポイントを検討

## 12. 成功指標

### 機能指標
- [ ] ツールが正常動作
- [ ] エラー率 < 5%
- [ ] レスポンス時間 < 3分

### 品質指標
- [ ] テストカバレッジ > 80%
- [ ] TypeScript型エラー 0件
- [ ] セキュリティ脆弱性 0件

### 利用指標
- [ ] MCPクライアントでの正常動作確認
- [ ] ドキュメントの完備
- [ ] npmパッケージ公開

## 13. 環境変数設定

| 変数名 | 説明 | デフォルト値 | 必須 |
|--------|------|-------------|------|
| `GEMINI_API_KEY` | Google Gemini APIキー | - | はい |
| `LOG_LEVEL` | ログレベル | `INFO` | いいえ |
| `MAX_CONCURRENT_REQUESTS` | 最大同時リクエスト数 | `5` | いいえ |
| `DEFAULT_TARGET_CATEGORIES` | デフォルトの目標カテゴリー数 | `20` | いいえ |
| `DEFAULT_TARGET_OPTIONS` | デフォルトの目標選択肢数/カテゴリー | `20` | いいえ |
| `GEMINI_MODEL` | 使用するGeminiモデル | `gemini-1.5-pro` | いいえ |

---

## 実装ノート

### 命名規則の統一
- **統一形式**: `target_*` 形式を採用
- **理由**: プロンプト内で「〜程度を目安」として使用されるため
- **例**: `target_categories`, `target_options_per_category`

### GPGGプロンプトからの重要な改良点

#### 選択肢数の柔軟性
- 原則として指定数を目安に生成
- **カテゴリの性質上、選択肢の数が自然と限定される場合**（例：「曜日」なら7つ、「評価（5段階）」なら5つ）は、無理に目標数を目指さず、考えられる全てのバリエーションを網羅

#### プロンプト要素としての自然性
- 単なるキーワードではなく、**プロンプト内で意味を成す自然な表現**を重視
- AIへの入力として機能する文の一部となることを意識

#### 多様性の具体的指示
- 同じような表現の回避
- **ポジティブ／ネガティブや多様な軸**（属性、形式、スタイル、性質など）での分散

#### ユーザーリクエストの活用
- 大元のユーザーリクエストにカテゴリ固有の情報が含まれている場合の反映
- カテゴリ生成と選択肢生成の両段階での活用

#### ランダムサンプリングの改良
- `random_sample_size`は**最大選択数**として機能
- 実際の選択肢数がそれより少ない場合は全て出力
- 無理な水増しを避ける自然な動作