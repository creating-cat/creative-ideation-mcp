# Gemini Context Options MCP Server

Google Gemini APIを使用して、創造的思考のためのコンテキスト別カテゴリと選択肢を生成するMCP（Model Context Protocol）サーバーです。

## 主要機能

- **トピック分析**: ユーザーリクエストから専門家役割と対象テーマを抽出
- **カテゴリ生成**: 指定されたコンテキストに関連する思考カテゴリを作成
- **選択肢生成**: 各カテゴリに対して多様な選択肢を生成
- **ランダムサンプリング**: AIの選択パターンを回避するオプション機能
- **日本語対応**: すべての出力が日本語で提供
- **レート制限対応**: Gemini API用の5秒間隔制御
- **エラーハンドリング**: 自動リトライとJSON修復機能

## インストール

### 必要な環境

- Node.js 18以上
- Google Gemini APIキー

### ソースからのインストール

```bash
git clone <repository-url>
cd gemini-context-options-mcp-server
npm install
npm run build
```

## 設定

### 環境変数

プロジェクトルートに`.env`ファイルを作成：

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
LOG_LEVEL=INFO
```

### Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでサインイン
3. 新しいAPIキーを作成
4. APIキーを`.env`ファイルにコピー

## 使用方法

### MCPサーバーとして使用

MCPクライアント（Kiroなど）の設定に追加：

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

### 基本的な使用例

**入力:**
```json
{
  "expert_role": "ゲームデザイナー",
  "target_subject": "オリジナルボードゲーム",
  "target_categories": 3,
  "target_options_per_category": 5
}
```

**応答例:**
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
          "協力ゲーム",
          "正体隠匿"
        ]
      },
      {
        "name": "テーマ設定",
        "description": "ゲームの世界観や背景設定",
        "options": [
          "中世ファンタジー",
          "宇宙開拓",
          "現代都市",
          "古代文明",
          "サイバーパンク"
        ]
      },
      {
        "name": "プレイヤー体験",
        "description": "プレイヤーが感じる楽しさや感情",
        "options": [
          "戦略的思考の楽しさ",
          "協力による達成感",
          "予想外の展開",
          "成長の実感",
          "競争の緊張感"
        ]
      }
    ]
  }
}
```

### 主要パラメータ

- `expert_role` (必須): 専門家役割の視点
- `target_subject` (必須): 考察対象のテーマ
- `target_categories` (オプション): 生成カテゴリ数の目安 (デフォルト: 20)
- `target_options_per_category` (オプション): 各カテゴリの選択肢数の目安 (デフォルト: 20)
- `randomize_selection` (オプション): ランダム選択の有効化 (デフォルト: false)
- `domain_context` (オプション): 追加のドメイン固有コンテキスト

## 開発

### スクリプト

```bash
npm run dev        # 開発モードで実行
npm run build      # TypeScriptをビルド
npm run start      # ビルド済みサーバーを実行
npm run check      # 型チェック
```

## ライセンス

MIT License - 詳細はLICENSEファイルを参照してください。

## よくある問題

### APIキーエラー
```
Error: GEMINI_API_KEY environment variable is required
```
- `.env`ファイルにAPIキーが正しく設定されているか確認
- APIキーの有効性を[Google AI Studio](https://aistudio.google.com/)で確認

### 処理が途中で止まる
- ネットワーク接続を確認
- Gemini APIの利用制限を確認

## サポート

問題や質問がある場合：
- GitHubでissueを作成
- ログで詳細なエラー情報を確認
- Gemini APIキーが有効で十分なクォータがあることを確認