#!/usr/bin/env node

/**
 * Gemini Context Options MCP Server
 * An MCP server that generates contextual categories and options for creative thinking
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateIdeaCategoriesTool } from './tools/generateIdeaCategories';
import { logger } from './utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
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

// Validate environment before starting
validateEnvironment();

// Create MCP server
const server = new McpServer({
  name: 'gemini-context-options-mcp-server',
  version: "0.1.0",
  description: 'An MCP server that generates contextual categories and options for creative thinking using the Gemini API.',
});

// Register the main tool
server.tool(
  generateIdeaCategoriesTool.name,
  generateIdeaCategoriesTool.description,
  generateIdeaCategoriesTool.input_schema.shape,
  async (args) => {
    try {
      const result = await generateIdeaCategoriesTool.execute(args);
      
      // Ensure we return the expected format
      if (result && result.content && result.content.length > 0 && result.content[0].text) {
        return {
          content: [{ type: "text", text: result.content[0].text }]
        };
      }
      
      // Fallback for unexpected responses
      // Unexpected tool response format - handled silently
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

// Start the server
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Start the server
startServer();