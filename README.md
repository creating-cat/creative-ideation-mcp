# Gemini Context Options MCP Server

An MCP (Model Context Protocol) server that generates contextual categories and options for creative thinking using the Google Gemini API. This server helps AI assistants provide multi-perspective thinking frameworks for various topics and contexts.

## Features

- **Topic Analysis**: Analyzes user requests to extract expert roles and target subjects
- **Category Generation**: Creates relevant thinking categories for the specified context
- **Option Generation**: Generates diverse options for each category
- **Random Sampling**: Optional random selection of options to avoid AI selection patterns
- **Japanese Language Support**: All outputs are provided in Japanese
- **Rate Limiting**: Built-in 5-second interval rate limiting for Gemini API
- **Error Handling**: Comprehensive error handling with automatic retry and JSON repair
- **Structured Output**: Returns well-structured JSON data for easy integration

## Installation

### Prerequisites

- Node.js 18 or higher
- Google Gemini API key

### Install from npm (when published)

```bash
npm install -g gemini-context-options-mcp-server
```

### Install from source

```bash
git clone <repository-url>
cd gemini-context-options-mcp-server
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
LOG_LEVEL=INFO
```

### 環境変数一覧

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `GEMINI_API_KEY` | ✅ | - | Google Gemini API キー |
| `GEMINI_MODEL` | ❌ | `gemini-1.5-pro` | 使用するGeminiモデル |
| `LOG_LEVEL` | ❌ | `INFO` | ログレベル (ERROR/WARN/INFO/DEBUG) |
| `DEBUG_MCP` | ❌ | `false` | MCP開発時のデバッグログ有効化 |

### 環境別設定例

**開発環境**
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-pro
LOG_LEVEL=DEBUG
DEBUG_MCP=true
```

**本番環境**
```env
GEMINI_API_KEY=your_production_api_key
GEMINI_MODEL=gemini-1.5-pro
LOG_LEVEL=ERROR
DEBUG_MCP=false
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key to your `.env` file

## Usage

### As an MCP Server

Add to your MCP client configuration (e.g., Kiro):

```json
{
  "mcpServers": {
    "gemini-context-options": {
      "command": "gemini-context-options-mcp-server",
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Available Tools

#### `generate_idea_categories`

Generates contextual categories and options for creative thinking.

**Parameters:**
- `expert_role` (string, required): 専門家役割の視点 (例: "ゲームデザイナー")
- `target_subject` (string, required): 考察対象のテーマ (例: "オリジナルボードゲーム")
- `target_categories` (number, optional): 生成カテゴリ数の目安 (10-30, default: 20)
- `target_options_per_category` (number, optional): 各カテゴリの選択肢数の目安 (10-200, default: 20)
- `randomize_selection` (boolean, optional): 選択肢をランダムに選択するか (default: false)
- `random_sample_size` (number, optional): ランダム選択時の最大出力数 (5-200, default: 10)
- `domain_context` (string, optional): 追加のドメイン固有コンテキスト

**Example:**
```json
{
  "expert_role": "ゲームデザイナー",
  "target_subject": "オリジナルボードゲーム",
  "target_categories": 12,
  "target_options_per_category": 15,
  "domain_context": "家族向けの協力型ゲーム"
}
```

**ランダムサンプリング使用例:**
```json
{
  "expert_role": "Webデザイナー",
  "target_subject": "企業サイトのリニューアル",
  "target_categories": 12,
  "target_options_per_category": 30,
  "randomize_selection": true,
  "random_sample_size": 15,
  "domain_context": "BtoB企業向けの信頼性重視"
}
```

### 目安値の自動調整について

`target_categories`と`target_options_per_category`は「目安値」として機能し、以下の場合に自動調整されます：

#### 選択肢数の調整例
- **自然な制約がある場合**: 
  - 「曜日」→ 7個
  - 「季節」→ 4個  
  - 「評価（5段階）」→ 5個
- **豊富な選択肢がある場合**: 目安値に近い数を生成
- **専門性が高い場合**: 質を重視して数を調整

#### 期待値設定のガイダンス
- **少数精鋭**: `target_categories: 8-12`, `target_options_per_category: 10-15`
- **バランス型**: `target_categories: 15-20`, `target_options_per_category: 15-25`
- **網羅的**: `target_categories: 20-30`, `target_options_per_category: 25-50`

### ランダムサンプリング機能

#### 機能の用途と効果
`randomize_selection`を有効にすると、生成された選択肢からランダムに選択して出力します。これにより：
- **AIの選択パターンの類似性を回避**: 同じ入力でも異なる結果を得られます
- **オリジナリティの向上**: 予期しない組み合わせで創造性を刺激
- **探索の効率化**: 大量の選択肢から絞り込んで確認可能

#### 使用シーンの具体例
1. **網羅的探索モード**: `target_options_per_category: 50`, `randomize_selection: false`
   - より多くの選択肢を確認したい場合
2. **ランダムサンプリングモード**: `target_options_per_category: 100`, `randomize_selection: true`, `random_sample_size: 15`
   - 多くの選択肢の中からランダムに絞った選択肢を得たい場合

#### 注意事項
- `random_sample_size`は実際の選択肢数より多く設定しても、全選択肢が出力されます
- 同じパラメータでも実行のたびに異なる結果が得られます
- 再現性が必要な場合は`randomize_selection: false`を使用してください

## 業界別使用例とベストプラクティス

### 業界別使用例

#### ゲーム開発
```json
{
  "expert_role": "ゲームデザイナー",
  "target_subject": "RPGのバトルシステム",
  "target_categories": 15,
  "target_options_per_category": 25,
  "domain_context": "ターン制でストラテジー要素重視"
}
```

#### Webデザイン
```json
{
  "expert_role": "UXデザイナー", 
  "target_subject": "ECサイトの改善",
  "target_categories": 12,
  "target_options_per_category": 20,
  "domain_context": "モバイルファーストでアクセシビリティ重視"
}
```

#### マーケティング
```json
{
  "expert_role": "マーケティングストラテジスト",
  "target_subject": "新商品のプロモーション戦略",
  "target_categories": 18,
  "target_options_per_category": 30,
  "randomize_selection": true,
  "random_sample_size": 12
}
```

#### 教育・研修
```json
{
  "expert_role": "教育コンサルタント",
  "target_subject": "オンライン研修プログラム",
  "target_categories": 10,
  "target_options_per_category": 15,
  "domain_context": "企業向け新人研修、インタラクティブ重視"
}
```

#### イベント企画
```json
{
  "expert_role": "イベントプランナー",
  "target_subject": "技術カンファレンスの企画",
  "target_categories": 14,
  "target_options_per_category": 25,
  "domain_context": "500名規模、ハイブリッド開催"
}
```

### パラメータ設定のベストプラクティス

#### 効率的な設定パターン
1. **初期探索**: `target_categories: 15-20`, `target_options_per_category: 15-20`
2. **詳細検討**: `target_categories: 8-12`, `target_options_per_category: 25-35`
3. **アイデア発散**: `target_categories: 25-30`, `target_options_per_category: 30-50`

#### 効果的な使い方のTips
- **専門家役割は具体的に**: "デザイナー" より "UXデザイナー" の方が適切
- **対象テーマに制約を含める**: "ゲーム" より "家族向け協力型ボードゲーム"
- **domain_context を活用**: 予算、期間、対象者などの制約を明記
- **段階的アプローチ**: 大まかなカテゴリから詳細な選択肢へ段階的に絞り込み

### パフォーマンス最適化ガイド

#### 効率的なパラメータ設定
- **処理時間重視**: `target_categories: 8-12` で API 呼び出し数を削減
- **品質重視**: `target_options_per_category: 15-25` で適切な選択肢数を確保
- **バランス重視**: デフォルト値（20/20）が多くの用途に最適

#### 処理時間短縮のコツ
1. **段階的実行**: 大きなタスクを小さく分割して実行
2. **キャッシュ活用**: 同じ expert_role + target_subject の組み合わせは結果を保存
3. **並列処理**: 複数の異なるテーマを同時に処理する場合は別々のプロセスで実行

#### 大量データ処理時の注意点
- **API制限の考慮**: 1時間あたりの API 呼び出し制限を確認
- **メモリ使用量**: 大量の選択肢生成時はメモリ使用量を監視
- **ネットワーク安定性**: 長時間の処理では接続の安定性を確保

**Response:**
```json
{
  "success": true,
  "data": {
    "expert_role": "ゲームデザイナー",
    "target_subject": "オリジナルボードゲーム",
    "categories": [
      {
        "name": "ゲームメカニクス",
        "description": "ゲームの基本的な仕組みや遊び方",
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

## Development

### Scripts

```bash
npm run dev        # Run in development mode with ts-node
npm run build      # Build TypeScript to JavaScript
npm run start      # Run the built server
npm run check      # Type check without building
```

### Project Structure

```
src/
├── index.ts                    # MCP server entry point
├── tools/
│   └── generateIdeaCategories.ts  # Main tool implementation
├── modules/
│   ├── topicAnalyzer.ts        # Topic analysis module
│   ├── categoryGenerator.ts    # Category generation module
│   └── optionGenerator.ts      # Option generation module
└── utils/
    ├── gemini.ts              # Gemini API client
    └── logger.ts              # Logging utility
```

## Performance Considerations

- **Processing Time**: 約 (1 + カテゴリ数) × 5-10秒
- **API呼び出し数**: 1 + 生成されたカテゴリ数 (例: カテゴリ20個の場合は21回)
- **Rate Limiting**: 5-second intervals between API calls
- **Concurrent Requests**: Processes one request at a time

## Security & Quality Features

### セキュリティ機能

#### API キー管理の安全性
- 環境変数による安全な API キー管理
- `.env` ファイルは `.gitignore` で除外済み
- 本番環境では適切なシークレット管理サービスの使用を推奨

#### 入力検証の仕組み
- **Zod による厳密な型検証**: 全入力パラメータを事前検証
- **範囲チェック**: 数値パラメータの最小・最大値制限
- **必須項目チェック**: 必要なパラメータの存在確認
- **型安全性**: TypeScript による静的型チェック

#### ログ出力時の機密情報保護
- API キーやトークンはログに出力されません
- 本番環境では機密情報を含むデバッグログを無効化
- エラー詳細は開発環境でのみ出力

### 品質保証機能

#### 自動リトライ機能
- **最大3回の自動リトライ**: 一時的な障害に対する自動復旧
- **指数バックオフ**: リトライ間隔を段階的に延長
- **エラー分類**: リトライ可能なエラーと不可能なエラーを区別

#### JSON自動修正機能
- **AI による JSON 修復**: 構文エラーのある JSON を自動修正
- **マークダウン除去**: コードブロック記法の自動除去
- **フォールバック処理**: 修正失敗時の適切なエラーハンドリング

#### レート制限対応
- **5秒間隔の自動制御**: API 利用制限を遵守
- **タイムスタンプ管理**: 適切な待機時間の計算
- **透明性**: 処理時間の事前通知

## Error Handling

The server provides comprehensive error handling with detailed error information:

### エラーコード一覧

| エラーコード | 説明 | 一般的な原因 | 対処法 |
|-------------|------|-------------|--------|
| `INVALID_API_KEY` | API キーの問題 | キーが無効・期限切れ・未設定 | API キーを確認・更新してください |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | API使用量上限・短時間での大量リクエスト | 時間をおいて再実行してください |
| `NETWORK_ERROR` | ネットワークエラー | 接続問題・タイムアウト・DNS解決失敗 | ネットワーク環境を確認してください |
| `VALIDATION_ERROR` | 入力値検証エラー | パラメータの型・範囲違反・必須項目不足 | パラメータ値を確認してください |
| `JSON_PARSE_ERROR` | JSON解析エラー | API応答の形式問題・不正なJSON | 自動修復を試行、失敗時は再実行してください |
| `GENERATION_FAILED` | 生成処理失敗 | AI応答の品質問題・予期しない応答形式 | パラメータを調整して再実行してください |
| `INTERNAL_ERROR` | 内部エラー | 予期しない問題・システムエラー | ログを確認、問題が続く場合はサポートに連絡 |

### エラーレスポンス例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "target_categories must be between 10 and 30",
    "details": "Validation failed for parameter: target_categories"
  }
}
```

### トラブルシューティングガイド

#### よくある問題と解決法

**Q: API キーエラーが発生する**
```
Error: GEMINI_API_KEY environment variable is required
```
- `.env`ファイルにAPIキーが正しく設定されているか確認
- 環境変数が正しく読み込まれているか確認
- APIキーの有効性を[Google AI Studio](https://aistudio.google.com/)で確認

**Q: 処理が途中で止まる**
- ネットワーク接続を確認
- Gemini APIの利用制限を確認
- ログでエラー詳細を確認（`DEBUG_MCP=true`で詳細ログ有効化）

**Q: 生成される内容が期待と異なる**
- `domain_context`パラメータでより具体的な指示を追加
- `target_categories`や`target_options_per_category`を調整
- 専門家役割（`expert_role`）をより具体的に設定

#### デバッグ手順

1. **環境変数の確認**
   ```bash
   echo $GEMINI_API_KEY  # APIキーが設定されているか確認
   ```

2. **デバッグログの有効化**
   ```bash
   export DEBUG_MCP=true
   export LOG_LEVEL=DEBUG
   ```

3. **ログの確認**
   - エラーログは標準エラー出力に JSON 形式で出力されます
   - タイムスタンプ、ログレベル、メッセージ、詳細データが含まれます

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the logs for detailed error information
- Ensure your Gemini API key is valid and has sufficient quota