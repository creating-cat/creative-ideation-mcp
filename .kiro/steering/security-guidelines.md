---
inclusion: always
description: "MCPサーバー開発におけるセキュリティベストプラクティス"
---

# セキュリティガイドライン

## API キー管理

### 環境変数による管理
- APIキーは必ず環境変数で管理
- `.env`ファイルは`.gitignore`に追加
- 本番環境では適切なシークレット管理サービスを使用

### 検証とエラーハンドリング
```typescript
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}
```

## 入力データの検証

### Zodによるバリデーション
- すべての入力パラメータをZodスキーマで検証
- 型安全性の確保
- 不正な入力の早期検出

### サニタイゼーション
- ユーザー入力の適切なサニタイズ
- SQLインジェクション等の攻撃の防止
- 特殊文字のエスケープ処理

## ログセキュリティ

### 機密情報の除外
- APIキーやトークンをログに出力しない
- ユーザーの個人情報の適切な匿名化
- デバッグ情報の本番環境での無効化

### ログレベルの適切な設定
```typescript
// 本番環境では機密情報を含むデバッグログを無効化
if (process.env.NODE_ENV === 'production') {
  // DEBUG レベルのログを無効化
}
```

## 依存関係の管理

### 脆弱性チェック
- 定期的な`npm audit`の実行
- 依存関係の最新化
- セキュリティアップデートの迅速な適用

### 最小権限の原則
- 必要最小限の依存関係のみを使用
- 未使用の依存関係の削除
- パッケージの信頼性確認

## エラー情報の適切な処理

### 本番環境でのエラー詳細
```typescript
return {
  success: false,
  error: {
    code: errorCode,
    message: userFriendlyMessage,
    // 開発環境でのみ詳細情報を含める
    details: process.env.NODE_ENV === 'development' ? error : undefined
  }
};
```

### スタックトレースの管理
- 本番環境ではスタックトレースを外部に露出しない
- 内部ログには詳細情報を記録
- ユーザーには適切なエラーメッセージのみ表示