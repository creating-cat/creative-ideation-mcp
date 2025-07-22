#!/usr/bin/env node

/**
 * Gemini Context Options MCP Server
 * AI創造的思考支援のためのコンテキスト対応カテゴリー・選択肢生成MCPサーバー
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateCategoriesTool } from './tools/generateCategories';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

// 必要な環境変数を検証
function validateEnvironment(): void {
  const requiredVars = ['GEMINI_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables', { missingVars });
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set the following environment variables:');
    console.error('- GEMINI_API_KEY: Your Google Gemini API key');
    console.error('\nYou can set them in a .env file or as environment variables.');
    process.exit(1);
  }
}

// 開始前に環境を検証
validateEnvironment();

// MCPサーバーを作成
const server = new McpServer({
  name: 'gemini-context-options-mcp-server',
  version: "0.1.0",
  description: 'Gemini APIを使用してAI創造的思考支援のためのコンテキスト対応カテゴリーと選択肢を生成するMCPサーバー',
});

// メインツールを登録
server.tool(
  generateCategoriesTool.name,
  generateCategoriesTool.description,
  generateCategoriesTool.input_schema.shape,
  async (args) => {
    try {
      const result = await generateCategoriesTool.execute(args);
      
      // 期待される形式で返却することを確認
      if (result && result.content && result.content.length > 0 && result.content[0].text) {
        return {
          content: [{ type: "text", text: result.content[0].text }]
        };
      }
      
      // 予期しないレスポンスのフォールバック
      // 予期しないツールレスポンス形式 - サイレントに処理
      return { 
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Processing completed, but an unexpected response was received.'
            }
          }, null, 2)
        }] 
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Tool execution error', { error: errorMessage });
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: errorMessage
            }
          }, null, 2)
        }]
      };
    }
  }
);

// サーバーを開始
async function startServer(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // MCP Server started successfully - no logging needed for normal operation
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to start MCP Server', { error: errorMessage });
    console.error('MCP Server failed to start:', error);
    process.exit(1);
  }
}

// グレースフルシャットダウンを処理
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// サーバーを開始
startServer();