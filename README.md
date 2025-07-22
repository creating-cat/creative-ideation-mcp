# Creative Ideation MCP Server

Google Gemini APIを使用して、創造的思考のためのコンテキスト別カテゴリと選択肢を生成するMCP（Model Context Protocol）サーバーです。

## 主要機能

- **トピック分析**: ユーザーリクエストから専門家役割と対象テーマを抽出
- **カテゴリ生成**: 指定されたコンテキストに関連する思考カテゴリを作成
- **選択肢生成**: 各カテゴリに対して多様な選択肢を生成
- **ランダムサンプリング**: AIの選択パターンを回避するオプション機能
- **日本語対応**: すべての出力が日本語で提供
- **レート制限対応**: Gemini API用の5秒間隔制御
- **エラーハンドリング**: 自動リトライとJSON修復機能

## 前提条件

- Node.js 18以上
- Google Gemini APIキー

## セットアップ

### Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでサインイン
3. 新しいAPIキーを作成

### MCPサーバー設定例

```json
{
  "mcpServers": {
    "creative-ideation-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@creating-cat/creative-ideation-mcp"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY"
      },
      "disabled": false,
      "timeout": 300
    }
  }
}
```

* `YOUR_GEMINI_API_KEY`にはあなたのGemini API KEYを設定してください。
  * `YOUR_GEMINI_API_KEY`を`${env:GEMINI_API_KEY}`とすることで環境変数から取得させることも可能です。(Kiroの機能)

## ランダムサンプリング機能

### 解決する問題

AIは学習データの偏りにより、同じようなパターンの選択肢を生成しがちです。例えば：

- 「ゲームメカニクス」で常に「ワーカープレイスメント」「デッキ構築」が上位に来る
- 「料理のジャンル」で「イタリアン」「フレンチ」「和食」が定番として選ばれる
- 創造的なアイデア発想において、予想可能な選択肢に偏る

### 解決策

ランダムサンプリング機能は、AIに大量の選択肢（通常の10-20倍）を生成させた後、その中からランダムに選択することで：

- **多様性の確保**: 普段は選ばれにくい選択肢も含まれる
- **意外性の創出**: 予想外の組み合わせや視点が得られる
- **創造的思考の促進**: 固定観念を打破する新しい発想のきっかけを提供

### 使用例

```json
{
  "expert_role": "ゲームデザイナー",
  "target_subject": "オリジナルボードゲーム",
  "target_categories": 3,
  "target_options_per_category": 50,
  "randomize_selection": true,
  "random_sample_size": 8
}
```

この設定では、各カテゴリで50個の選択肢を生成し、その中からランダムに8個を選択します。結果として、通常では得られない多様で創造的な選択肢が得られます。

**動作の仕組み**: `target_options_per_category` で指定した数の選択肢を生成後、その数が `random_sample_size` を超える場合にランダムサンプリングが適用されます。

## ツール: `generate_categories`

このMCPサーバーは `generate_categories` という名前のツールを提供します。

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

### 入力パラメータ

| パラメータ名 | 説明 | デフォルト値 |
| ------------ | ---- | ------------ |
| `expert_role` | (string, 必須) 専門家役割の視点（例: "ゲームデザイナー", "料理研究家"） | なし |
| `target_subject` | (string, 必須) 考察対象のテーマ（例: "オリジナルボードゲーム", "新しいレシピ"） | なし |
| `target_categories` | (number, 任意) 生成カテゴリ数の目安（10-30） | `20` |
| `target_options_per_category` | (number, 任意) 各カテゴリの選択肢数の目安（10-200） | `20` |
| `randomize_selection` | (boolean, 任意) ランダム選択の有効化 | `false` |
| `random_sample_size` | (number, 任意) ランダム選択時の最大出力数（5-200） | `10` |
| `domain_context` | (string, 任意) 追加のドメイン固有コンテキスト | なし |

### 出力

成功した場合、生成されたカテゴリと選択肢のJSONデータを返します。
失敗した場合は、エラーコードとメッセージを含むエラー情報を返します。

## 注意事項

* **非決定性**: 同じパラメータで実行しても、AI生成のため毎回異なる結果が返されます。この特性を活かして複数回実行することで、より多様なアイデアを得ることができます。
* 処理時間は約(1+カテゴリ数)×5-10秒です（例：20カテゴリで2-4分）
* APIキーの取り扱いには十分注意してください。
* Gemini APIの利用制限にご注意ください。

## ライセンス

MIT License - 詳細はLICENSEファイルを参照してください。

