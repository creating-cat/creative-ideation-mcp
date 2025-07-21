# API設計書 - gemini-context-options-mcp-server

## MCPツール仕様

### generate_idea_categories（単一ツール）

#### 概要
特定のトピックやコンテキストに対して、多角的な視点やアイデアを提供するためのカテゴリーと選択肢を生成するツール。AIの創造的思考を支援するために設計されています。

#### 入力パラメータ
```typescript
{
  expert_role: string;            // 必須: 専門家の役割（例: "ゲームデザイナー"）
  target_subject: string;         // 必須: 対象テーマ（例: "オリジナルボードゲーム"）
  max_categories?: number;        // オプション: 最大カテゴリー数（デフォルト: 15）
  max_options_per_category?: number; // オプション: カテゴリーあたりの最大選択肢数（デフォルト: 20）
  domain_context?: string;        // オプション: 特定のドメインやコンテキストの追加情報
}
```

#### 出力形式
```typescript
{
  success: boolean;
  data?: {
    expert_role: string;          // 入力された専門家役割
    target_subject: string;       // 入力された対象テーマ
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

## プロンプトテンプレート設計

### トピック分析プロンプト
```typescript
const TOPIC_ANALYSIS_PROMPT = `
# 指示
あなたは特定のトピックやコンテキストに対して、多角的な視点やアイデアを提供する専門家です。
以下のトピックについて、創造的思考や問題解決に役立つカテゴリーを特定してください。

# 専門家役割
{{EXPERT_ROLE}}

# 対象テーマ
{{TARGET_SUBJECT}}

# 追加コンテキスト
{{DOMAIN_CONTEXT}}

# 出力形式
以下の形式でJSONを出力してください：

{
  "topic_analysis": {
    "core_focus": "トピックの核心的な焦点",
    "key_aspects": ["側面1", "側面2", "側面3", ...],
    "relevant_domains": ["関連ドメイン1", "関連ドメイン2", ...]
  }
}
`;
```

### カテゴリー生成プロンプト
```typescript
const CATEGORY_GENERATION_PROMPT = `
# 概要
「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について多角的に考えるためのカテゴリーを{{MAX_CATEGORIES}}個まで考案してください。

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
  },
  ...
]
`;
```

### 選択肢生成プロンプト
```typescript
const OPTIONS_GENERATION_PROMPT = `
# 概要
「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について考える際の、カテゴリー「{{CATEGORY_NAME}}」に対する選択肢を{{MAX_OPTIONS_PER_CATEGORY}}個まで生成してください。

# 指示
- 専門家の視点から実用的で創造的な選択肢を提供してください
- 多様なアプローチや可能性を示すバリエーション豊かな選択肢にしてください
- 日本語で自然な表現にしてください
- 選択肢例を参考に、同じような具体性レベルや表現スタイルで生成してください

# 専門家役割
{{EXPERT_ROLE}}

# 対象テーマ
{{TARGET_SUBJECT}}

# カテゴリー情報
- カテゴリー名: {{CATEGORY_NAME}}
- カテゴリーの説明: {{CATEGORY_DESCRIPTION}}
- 選択肢例（参考）: {{EXAMPLE_CHOICES}}

# 追加コンテキスト（全体要望）
{{DOMAIN_CONTEXT}}

# 注意事項
上記は「{{TARGET_SUBJECT}}」全体に関する要望や制約です。
カテゴリー「{{CATEGORY_NAME}}」の選択肢生成に関連する部分があれば考慮し、
関連しない内容は無視してください。

# 出力形式
以下の形式でJSONを出力してください：

[
  "選択肢1",
  "選択肢2",
  ...
]
`;
```

## エラーハンドリング

### 高度なエラーハンドリング機能

#### 1. **JSON自動修正機能**
- JSONパースエラー時、AIによる自動修正
- 元のコンテキストを保持した修正プロンプト
- マークダウン記法や説明文の自動除去

#### 2. **APIレスポンス前処理**
```typescript
function preprocessApiResponse(apiResult: any): string {
  // マークダウンのコードブロックを取り除く
  jsonString = jsonString.replace(/```json/g, '');
  jsonString = jsonString.replace(/```/g, '');
  jsonString = jsonString.trim(); // 前後の空白を削除
  return jsonString;
}
```

#### 3. **包括的リトライ機能**
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

### エラーレスポンス形式
```typescript
{
  success: false,
  error: {
    code: "GENERATION_FAILED",
    message: "カテゴリー生成結果のJSONパースに失敗 (3回試行)",
    details: {
      retry_count: 3,
      last_error: "AI自動修正も含めて処理に失敗しました",
      processing_stage: "category_generation"
    }
  }
}
```

## レート制限対応

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
- **基本処理**: 1回のカテゴリー生成 + 15カテゴリー × (英語生成 + 翻訳)
- **API呼び出し回数**: 約31回 (1 + 15×2)
- **推定処理時間**: 約2.5-3分 (5秒間隔 × 30回 + 処理時間)

### ユーザー通知
```json
{
  "content": [{
    "type": "text",
    "text": "カテゴリー生成を開始します。約2-3分の処理時間が必要です。Gemini APIのレート制限により、各API呼び出し間に5秒の間隔を設けています..."
  }]
}
```

## ログ仕様

### ログレベル
- `ERROR`: エラー情報
- `WARN`: 警告情報
- `INFO`: 一般情報
- `DEBUG`: デバッグ情報

### ログ形式
```json
{
  "timestamp": "2025-01-21T10:00:00.000Z",
  "level": "INFO",
  "message": "Request processed successfully",
  "request_id": "req_abc123",
  "expert_role": "ゲームデザイナー",
  "target_subject": "オリジナルボードゲーム",
  "duration_ms": 1500,
  "categories_generated": 12,
  "options_generated": 240
}
```

## 環境変数設定

| 変数名 | 説明 | デフォルト値 | 必須 |
|--------|------|-------------|------|
| `GEMINI_API_KEY` | Google Gemini APIキー | - | はい |
| `LOG_LEVEL` | ログレベル | `INFO` | いいえ |
| `MAX_CONCURRENT_REQUESTS` | 最大同時リクエスト数 | `5` | いいえ |
| `DEFAULT_MAX_CATEGORIES` | デフォルトの最大カテゴリー数 | `15` | いいえ |
| `DEFAULT_MAX_OPTIONS` | デフォルトの最大選択肢数/カテゴリー | `20` | いいえ |
| `GEMINI_MODEL` | 使用するGeminiモデル | `gemini-1.5-pro` | いいえ |