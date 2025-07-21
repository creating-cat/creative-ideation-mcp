# 実装計画書 - gemini-context-options-mcp-server

## 開発フェーズ

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

3. **基本MCPサーバー実装**
   ```typescript
   // src/index.ts の骨格
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   
   const server = new McpServer({
     name: 'idea-categories-mcp-server',
     version: "0.1.0",
     description: 'Generate idea categories and options for creative thinking'
   });
   
   // ツール登録は後のフェーズで実装
   
   const transport = new StdioServerTransport();
   server.connect(transport);
   ```

### フェーズ2: トピック分析モジュール実装（1-2日）
#### 目標
トピック分析機能を完成させる。

#### 成果物
- [ ] トピック分析モジュールの実装
- [ ] 分析プロンプトテンプレートの実装
- [ ] JSON解析とエラー修正機能
- [ ] 単体テストの実装

#### 技術タスク
1. **トピック分析モジュール**
   ```typescript
   // src/modules/topicAnalyzer.ts
   export async function analyzeTopicContext(topic: string, domainContext?: string): Promise<TopicAnalysis> {
     // トピック分析の実装
     // Gemini APIを使用して分析を実行
     return {
       core_focus: "...",
       key_aspects: ["...", "..."],
       relevant_domains: ["...", "..."]
     };
   }
   ```

2. **プロンプトテンプレート**
   ```typescript
   // src/prompts/templates.ts
   export const CATEGORY_GENERATION_PROMPT = `
   # 概要
   「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について多角的に考えるためのカテゴリーを{{MAX_CATEGORIES}}個まで考案してください。
   
   # 追加コンテキスト（全体要望）
   {{DOMAIN_CONTEXT}}
   
   # 注意事項
   上記は「{{TARGET_SUBJECT}}」全体に関する要望や制約です。
   カテゴリー生成に関連する部分があれば考慮し、関連しない内容は無視してください。
   `;
   
   export const OPTIONS_GENERATION_PROMPT = `
   # 概要
   「{{EXPERT_ROLE}}」が「{{TARGET_SUBJECT}}」について考える際の、カテゴリー「{{CATEGORY_NAME}}」に対する選択肢を{{MAX_OPTIONS_PER_CATEGORY}}個まで生成してください。
   
   # 追加コンテキスト（全体要望）
   {{DOMAIN_CONTEXT}}
   
   # 注意事項
   上記は「{{TARGET_SUBJECT}}」全体に関する要望や制約です。
   カテゴリー「{{CATEGORY_NAME}}」の選択肢生成に関連する部分があれば考慮し、
   関連しない内容は無視してください。
   `;
   ```

### フェーズ3: カテゴリー生成モジュール実装（1-2日）
#### 目標
カテゴリー生成機能を完成させる。

#### 成果物
- [ ] カテゴリー生成モジュールの実装
- [ ] カテゴリー生成プロンプトの実装
- [ ] EXAMPLE_CHOICES生成機能の実装
- [ ] カテゴリー数制限機能
- [ ] 単体テストの実装

#### 技術タスク
1. **カテゴリー生成モジュール**
   ```typescript
   // src/modules/categoryGenerator.ts
   export async function generateCategories(
     expertRole: string,
     targetSubject: string,
     maxCategories: number = 15,
     domainContext?: string
   ): Promise<Category[]> {
     // カテゴリー生成プロンプトテンプレートを使用
     const prompt = CATEGORY_GENERATION_PROMPT
       .replace('{{EXPERT_ROLE}}', expertRole)
       .replace('{{TARGET_SUBJECT}}', targetSubject)
       .replace('{{MAX_CATEGORIES}}', maxCategories.toString())
       .replace('{{DOMAIN_CONTEXT}}', domainContext || '');
     
     // Gemini APIを使用してカテゴリーを生成
     return [
       {
         name: "カテゴリー名",
         description: "カテゴリーの説明",
         example_choices: ["例1", "例2", "例3"]
       },
       // ...
     ];
   }
   ```

### フェーズ4: 選択肢生成モジュール実装（1-2日）
#### 目標
選択肢生成機能を完成させる。

#### 成果物
- [ ] 選択肢生成モジュールの実装
- [ ] 選択肢生成プロンプトの実装
- [ ] EXAMPLE_CHOICES機能の実装
- [ ] 選択肢数制限機能
- [ ] 単体テストの実装

#### 技術タスク
1. **選択肢生成モジュール**
   ```typescript
   // src/modules/optionGenerator.ts
   export async function generateOptions(
     expertRole: string,
     targetSubject: string,
     category: Category,
     maxOptions: number = 20,
     domainContext?: string
   ): Promise<string[]> {
     // 選択肢生成プロンプトテンプレートを使用
     const prompt = OPTIONS_GENERATION_PROMPT
       .replace('{{EXPERT_ROLE}}', expertRole)
       .replace('{{TARGET_SUBJECT}}', targetSubject)
       .replace('{{CATEGORY_NAME}}', category.name)
       .replace('{{CATEGORY_DESCRIPTION}}', category.description)
       .replace('{{EXAMPLE_CHOICES}}', JSON.stringify(category.example_choices))
       .replace('{{MAX_OPTIONS_PER_CATEGORY}}', maxOptions.toString())
       .replace('{{DOMAIN_CONTEXT}}', domainContext || '');
     
     // Gemini APIを使用して選択肢を生成
     return ["選択肢1", "選択肢2", "..."]; // 日本語で直接生成
   }
   ```

### フェーズ5: 統合ツール実装（1日）
#### 目標
すべての機能を統合した単一ツールを完成させる。

#### 成果物
- [ ] `generate_idea_categories` ツールの実装
- [ ] 入力パラメータのバリデーション
- [ ] エラーハンドリングの統合
- [ ] 統合テストの実装

#### 技術タスク
1. **統合ツール実装**
   ```typescript
   // src/tools/generateIdeaCategories.ts
   import { z } from "zod";
   
   // 入力スキーマ定義
   const generateIdeaCategoriesSchema = z.object({
     topic: z.string().min(1).describe("Topic or context to generate categories for"),
     max_categories: z.number().int().positive().optional().default(15),
     max_options_per_category: z.number().int().positive().optional().default(20),
     language: z.enum(["ja", "en", "both"]).optional().default("both"),
     domain_context: z.string().optional()
   });
   
   export const generateIdeaCategoriesToolDefinition = {
     name: "generate_idea_categories",
     description: "Generate categories and options for creative thinking on a specific topic",
     input_schema: generateIdeaCategoriesSchema,
     execute: async (args) => {
       try {
         // 1. トピック分析
         const topicAnalysis = await analyzeTopicContext(args.topic, args.domain_context);
         
         // 2. カテゴリー生成
         const categories = await generateCategories(args.topic, topicAnalysis, args.max_categories);
         
         // 3. 選択肢生成（並列処理）
         const categoriesWithOptions = await Promise.all(
           categories.map(async (category) => {
             const options = await generateOptions(args.topic, category, args.max_options_per_category);
             return { ...category, options };
           })
         );
         
         // 4. 結果の整形と返却
         return {
           success: true,
           data: {
             topic: args.topic,
             categories: categoriesWithOptions,
             metadata: {
               total_categories: categoriesWithOptions.length,
               total_options: categoriesWithOptions.reduce((sum, cat) => sum + cat.options.length, 0),
               processing_time_ms: Date.now() - startTime
             }
           }
         };
       } catch (error) {
         // エラーハンドリング
         return {
           success: false,
           error: {
             code: determineErrorCode(error),
             message: getErrorMessage(error),
             details: process.env.NODE_ENV === "development" ? error : undefined
           }
         };
       }
     }
   };
   ```

2. **MCPサーバーへのツール登録**
   ```typescript
   // src/index.ts
   import { generateIdeaCategoriesToolDefinition } from "./tools/generateIdeaCategories";
   
   // ツール登録
   server.tool(
     generateIdeaCategoriesToolDefinition.name,
     generateIdeaCategoriesToolDefinition.description,
     generateIdeaCategoriesToolDefinition.input_schema.shape,
     generateIdeaCategoriesToolDefinition.execute
   );
   ```

### フェーズ6: テスト・ドキュメント・パッケージング（2-3日）
#### 目標
本番利用可能な状態まで品質を向上させる。

#### 成果物
- [ ] 包括的なテストスイート
- [ ] ユーザードキュメント
- [ ] npmパッケージ化
- [ ] CI/CD設定

#### 技術タスク
1. **テスト実装**
   ```typescript
   // tests/modules/topicAnalyzer.test.ts
   describe('topicAnalyzer', () => {
     test('should analyze topic correctly', async () => {
       // テスト実装
     });
   });
   ```

2. **ドキュメント作成**
   - README.md
   - API仕様書
   - 設定ガイド
   - トラブルシューティング

3. **パッケージング**
   ```json
   {
     "name": "@creating-cat/idea-categories-mcp-server",
     "bin": {
       "idea-categories-mcp-server": "dist/index.js"
     },
     "files": ["dist", "README.md", "LICENSE"]
   }
   ```

## 品質保証

### テスト戦略
1. **単体テスト**: 各モジュールの個別機能テスト
2. **統合テスト**: モジュール間の連携テスト
3. **E2Eテスト**: MCPクライアントからの実際の利用テスト
4. **パフォーマンステスト**: レスポンス時間とメモリ使用量

### コード品質
- TypeScript strict mode
- ESLint + Prettier
- コードカバレッジ 80%以上
- 型安全性の確保

### セキュリティ
- 依存関係の脆弱性チェック
- APIキーの適切な管理
- 入力データのサニタイズ

## リスク管理

### 技術リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| Gemini API制限 | 高 | レート制限対応、フォールバック機能 |
| JSON解析失敗 | 中 | 自動修正機能、複数回試行 |
| メモリ使用量増大 | 中 | ストリーミング処理、ガベージコレクション |

### スケジュールリスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| プロンプト調整の複雑さ | 中 | 段階的改善、テスト駆動開発 |
| API仕様変更 | 低 | バージョン固定、変更監視 |

## 成功指標

### 機能指標
- [ ] ツールが正常動作
- [ ] エラー率 < 5%
- [ ] レスポンス時間 < 20秒

### 品質指標
- [ ] テストカバレッジ > 80%
- [ ] TypeScript型エラー 0件
- [ ] セキュリティ脆弱性 0件

### 利用指標
- [ ] MCPクライアントでの正常動作確認
- [ ] ドキュメントの完備
- [ ] npmパッケージ公開