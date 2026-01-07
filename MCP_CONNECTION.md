# Connecting to the Creatio MCP Server

This document explains how to connect AI assistants (like Claude Code) to the Creatio MCP Server using SSE transport.

## Server Endpoints

Once the server is running, the following MCP endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp/sse` | GET | SSE connection endpoint for MCP protocol |
| `/mcp/messages` | POST | Message handler for MCP requests |
| `/mcp/health` | GET | Health check for MCP service |

## Configuring Claude Code

Add this server to your Claude Code MCP configuration:

### Option 1: Project-level configuration

Create or edit `.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "creatio": {
      "url": "https://your-deployed-server.com/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### Option 2: Global configuration

Edit your global Claude Code settings:

```json
{
  "mcpServers": {
    "creatio": {
      "url": "https://your-deployed-server.com/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### Local Development

For local development, use:

```json
{
  "mcpServers": {
    "creatio": {
      "url": "http://localhost:5000/mcp/sse",
      "transport": "sse"
    }
  }
}
```

## Available MCP Tools

Once connected, Claude Code will have access to these Creatio CRM tools:

| Tool | Description |
|------|-------------|
| `test_creatio_connection` | Test connection to a Creatio CRM instance |
| `query_creatio_accounts` | Query Account records with OData filters |
| `get_creatio_account` | Get a single Account by ID |
| `create_creatio_account` | Create a new Account record |
| `update_creatio_account` | Update an existing Account |
| `delete_creatio_account` | Delete an Account record |

## Usage Flow

1. **First, establish a Creatio connection** by calling `test_creatio_connection` with your credentials:
   - `baseUrl`: Your Creatio instance URL (e.g., `https://yourcompany.creatio.com`)
   - `username`: Your Creatio username
   - `password`: Your Creatio password

2. **Then use the other tools** to interact with your CRM data. The connection is maintained server-side.

## Example Conversation

```
You: Connect to our Creatio CRM at https://example.creatio.com with user admin@example.com

Claude: [Uses test_creatio_connection tool]
Successfully connected to Creatio instance.

You: Find all accounts with "Tech" in the name

Claude: [Uses query_creatio_accounts with filter "contains(Name,'Tech')"]
Found 5 accounts: TechCorp, TechSolutions, ...
```

## Security Notes

- Credentials are sent securely over HTTPS (ensure your deployment uses SSL)
- Sessions are maintained server-side
- No credentials are stored persistently - they're held in memory for the session duration
- Consider using environment variables for production deployments
