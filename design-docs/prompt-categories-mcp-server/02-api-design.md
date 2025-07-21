# API設計書

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

### エラーコード体系
- `INVALID_API_KEY`: APIキーが無効または未設定
- `API_RATE_LIMIT`: APIレート制限に達した
- `API_SERVICE_ERROR`: APIサービスエラー
- `INVALID_PARAMETERS`: パラメータ検証エラー
- `PARSING_ERROR`: JSON解析エラー
- `INTERNAL_ERROR`: 内部エラー

### エラーレスポンス形式
```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "ユーザーフレンドリーなエラーメッセージ",
    details: {
      // 開発者向けの詳細情報（本番環境では省略可能）
    }
  }
}
```

## レート制限対応

### 制限値
- Gemini API: 60 QPM (Queries Per Minute)
- 同時リクエスト: 最大5件

### 対応策
- リクエストキューイング
- 指数バックオフによる再試行
- ユーザーへの適切な待機時間通知

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