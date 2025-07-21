# Gemini Context Options MCP Server

An MCP (Model Context Protocol) server that generates contextual categories and options for creative thinking using the Google Gemini API. This server helps AI assistants provide multi-perspective thinking frameworks for various topics and contexts.

## Features

- **Topic Analysis**: Analyzes user requests to extract expert roles and target subjects
- **Category Generation**: Creates relevant thinking categories for the specified context
- **Option Generation**: Generates diverse options for each category
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

Required variables:
- `GEMINI_API_KEY`: Your Google Gemini API key

Optional variables:
- `GEMINI_MODEL`: Gemini model to use (default: `gemini-1.5-pro`)
- `LOG_LEVEL`: Logging level (`ERROR`, `WARN`, `INFO`, `DEBUG`)

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
- `expert_role` (string, required): The expert role perspective (e.g., "ゲームデザイナー")
- `target_subject` (string, required): The target subject to think about (e.g., "オリジナルボードゲーム")
- `max_categories` (number, optional): Maximum number of categories (default: 15, max: 30)
- `max_options_per_category` (number, optional): Maximum options per category (default: 20, max: 50)
- `domain_context` (string, optional): Additional domain-specific context

**Example:**
```json
{
  "expert_role": "ゲームデザイナー",
  "target_subject": "オリジナルボードゲーム",
  "max_categories": 12,
  "max_options_per_category": 15,
  "domain_context": "家族向けの協力型ゲーム"
}
```

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

- **Processing Time**: Typically 2-3 minutes due to rate limiting
- **API Calls**: Approximately 31 API calls (1 + 15×2) for default settings
- **Rate Limiting**: 5-second intervals between API calls
- **Concurrent Requests**: Processes one request at a time

## Error Handling

The server provides detailed error information:

- `INVALID_API_KEY`: API key issues
- `RATE_LIMIT_EXCEEDED`: API rate limit problems
- `NETWORK_ERROR`: Network connectivity issues
- `VALIDATION_ERROR`: Input validation failures
- `INTERNAL_ERROR`: Other internal errors

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