---
inclusion: always
description: "TypeScript MCPサーバー開発のコーディング規約と品質基準"
---

# コーディング規約

## TypeScript設定

### 厳格な型チェック
- TypeScript strict mode を有効化
- 型エラー 0件を維持
- `any` 型の使用を避ける
- 適切な型定義とインターフェースの作成

### 命名規則
- **パラメータ**: `target_*` 形式（例: `target_categories`, `target_options_per_category`）
- **関数**: camelCase（例: `generateCategories`, `processApiResponse`）
- **定数**: UPPER_SNAKE_CASE（例: `MIN_API_CALL_INTERVAL_MS`）
- **インターフェース**: PascalCase（例: `CategoryData`, `ApiResponse`）

## エラーハンドリング

### 包括的エラー処理
- 各処理段階での適切なエラーハンドリング
- 最大3回の自動リトライ機能
- 構造化されたエラーレスポンス

### エラーコード体系
```typescript
enum ErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_SERVICE_ERROR = 'API_SERVICE_ERROR',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
  GENERATION_FAILED = 'GENERATION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## API設計原則

### レート制限対応
- 5秒間隔の自動API呼び出し制御
- タイムスタンプ管理による適切な待機時間計算
- ユーザーへの処理時間通知

### JSON処理
- APIレスポンスの前処理（マークダウン記法除去）
- JSON自動修正機能
- パースエラー時のAIによる修正試行

## コード品質

### テスト要件
- 単体テスト: 各モジュールの個別機能
- 統合テスト: モジュール間の連携
- テストカバレッジ 80%以上

### ログ設計
- 構造化ログの出力
- 適切なログレベル（ERROR, WARN, INFO, DEBUG）
- 機密情報の除外

### パフォーマンス
- メモリ効率的な処理
- 適切なガベージコレクション
- 処理時間の測定と記録