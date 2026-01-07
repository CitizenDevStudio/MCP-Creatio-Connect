/**
 * MCP Server with SSE Transport for Creatio CRM
 *
 * This implements a Model Context Protocol server using Server-Sent Events (SSE)
 * for remote connections from AI assistants like Claude Code.
 *
 * Endpoint: GET /mcp/sse - SSE connection for MCP protocol
 * Endpoint: POST /mcp/messages - Message endpoint for client requests
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Express, Request, Response } from "express";
import { CreatioClient, getCreatioClient, setCreatioClient } from "./creatio-client";
import type { CreatioAccount, QueryParams } from "@shared/schema";
import { log } from "./index";

// Store active transports for message routing
const activeTransports = new Map<string, SSEServerTransport>();

// Create the MCP server instance
function createMCPServer(): Server {
  const server = new Server(
    {
      name: "creatio-connect",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "test_creatio_connection",
          description:
            "Test connection to a Creatio CRM instance using Forms authentication",
          inputSchema: {
            type: "object" as const,
            properties: {
              baseUrl: {
                type: "string",
                description:
                  "The base URL of the Creatio instance (e.g., https://yourcompany.creatio.com)",
              },
              username: {
                type: "string",
                description: "Creatio username for authentication",
              },
              password: {
                type: "string",
                description: "Creatio password for authentication",
              },
            },
            required: ["baseUrl", "username", "password"],
          },
        },
        {
          name: "query_creatio_accounts",
          description:
            "Query Creatio Account (Customer) records with OData filter expressions",
          inputSchema: {
            type: "object" as const,
            properties: {
              filter: {
                type: "string",
                description:
                  'OData $filter expression (e.g., "contains(Name,\'Tech\')" or "Name eq \'Acme\'")',
              },
              select: {
                type: "string",
                description:
                  'Comma-separated list of fields to return (e.g., "Id,Name,Phone,Email")',
              },
              top: {
                type: "number",
                description:
                  "Maximum number of records to return (1-100, default 25)",
              },
              orderby: {
                type: "string",
                description: 'Sort order (e.g., "Name asc" or "CreatedOn desc")',
              },
            },
          },
        },
        {
          name: "get_creatio_account",
          description: "Get a single Creatio Account by its unique ID (GUID)",
          inputSchema: {
            type: "object" as const,
            properties: {
              id: {
                type: "string",
                description: "The GUID of the account to retrieve",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "create_creatio_account",
          description: "Create a new Account record in Creatio CRM",
          inputSchema: {
            type: "object" as const,
            properties: {
              name: {
                type: "string",
                description: "Account/Company name (required)",
              },
              phone: {
                type: "string",
                description: "Primary phone number",
              },
              email: {
                type: "string",
                description: "Primary email address",
              },
              web: {
                type: "string",
                description: "Website URL",
              },
              address: {
                type: "string",
                description: "Street address",
              },
              city: {
                type: "string",
                description: "City",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "update_creatio_account",
          description: "Update an existing Account record in Creatio CRM",
          inputSchema: {
            type: "object" as const,
            properties: {
              id: {
                type: "string",
                description: "The GUID of the account to update",
              },
              name: {
                type: "string",
                description: "Account/Company name",
              },
              phone: {
                type: "string",
                description: "Primary phone number",
              },
              email: {
                type: "string",
                description: "Primary email address",
              },
              web: {
                type: "string",
                description: "Website URL",
              },
              address: {
                type: "string",
                description: "Street address",
              },
              city: {
                type: "string",
                description: "City",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "delete_creatio_account",
          description: "Delete an Account record from Creatio CRM",
          inputSchema: {
            type: "object" as const,
            properties: {
              id: {
                type: "string",
                description: "The GUID of the account to delete",
              },
            },
            required: ["id"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "test_creatio_connection":
          return await testConnection(args as {
            baseUrl: string;
            username: string;
            password: string;
          });

        case "query_creatio_accounts":
          return await queryAccounts(args as QueryParams);

        case "get_creatio_account":
          return await getAccount((args as { id: string }).id);

        case "create_creatio_account":
          return await createAccount(args as Record<string, unknown>);

        case "update_creatio_account":
          return await updateAccount(args as Record<string, unknown>);

        case "delete_creatio_account":
          return await deleteAccount((args as { id: string }).id);

        default:
          return {
            content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing ${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Tool implementations
async function testConnection(config: {
  baseUrl: string;
  username: string;
  password: string;
}) {
  const client = new CreatioClient(config);
  const result = await client.testConnection();

  if (result.success) {
    setCreatioClient(client);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
    isError: !result.success,
  };
}

async function queryAccounts(params: QueryParams) {
  const client = getCreatioClient();
  if (!client) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Not connected. Use test_creatio_connection first.",
        },
      ],
      isError: true,
    };
  }

  const accounts = await client.queryAccounts({
    filter: params.filter,
    select: params.select,
    top: params.top || 25,
    orderby: params.orderby || "Name asc",
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            count: accounts.length,
            accounts: accounts.map((a) => ({
              Id: a.Id,
              Name: a.Name,
              Phone: a.Phone,
              Email: a.Email,
              Web: a.Web,
              City: a.City,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
}

async function getAccount(id: string) {
  const client = getCreatioClient();
  if (!client) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Not connected. Use test_creatio_connection first.",
        },
      ],
      isError: true,
    };
  }

  const account = await client.getAccountById(id);

  if (!account) {
    return {
      content: [{ type: "text" as const, text: `Account not found: ${id}` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(account, null, 2),
      },
    ],
  };
}

async function createAccount(args: Record<string, unknown>) {
  const client = getCreatioClient();
  if (!client) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Not connected. Use test_creatio_connection first.",
        },
      ],
      isError: true,
    };
  }

  const accountData: Partial<CreatioAccount> = {
    Name: args.name as string,
  };

  if (args.phone) accountData.Phone = args.phone as string;
  if (args.email) accountData.Email = args.email as string;
  if (args.web) accountData.Web = args.web as string;
  if (args.address) accountData.Address = args.address as string;
  if (args.city) accountData.City = args.city as string;

  const created = await client.createAccount(accountData);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            message: "Account created successfully",
            account: created,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function updateAccount(args: Record<string, unknown>) {
  const client = getCreatioClient();
  if (!client) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Not connected. Use test_creatio_connection first.",
        },
      ],
      isError: true,
    };
  }

  const id = args.id as string;
  const updates: Partial<CreatioAccount> = {};

  if (args.name) updates.Name = args.name as string;
  if (args.phone) updates.Phone = args.phone as string;
  if (args.email) updates.Email = args.email as string;
  if (args.web) updates.Web = args.web as string;
  if (args.address) updates.Address = args.address as string;
  if (args.city) updates.City = args.city as string;

  await client.updateAccount(id, updates);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            message: `Account ${id} updated successfully`,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function deleteAccount(id: string) {
  const client = getCreatioClient();
  if (!client) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Not connected. Use test_creatio_connection first.",
        },
      ],
      isError: true,
    };
  }

  await client.deleteAccount(id);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            message: `Account ${id} deleted successfully`,
          },
          null,
          2
        ),
      },
    ],
  };
}

/**
 * Register MCP SSE routes on an Express app
 */
export function registerMCPRoutes(app: Express): void {
  // SSE endpoint for MCP connections
  app.get("/mcp/sse", async (req: Request, res: Response) => {
    log("New MCP SSE connection established", "mcp");

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    // Create a unique session ID
    const sessionId = crypto.randomUUID();

    // Create transport and server
    const transport = new SSEServerTransport("/mcp/messages", res);
    const server = createMCPServer();

    // Store transport for message routing
    activeTransports.set(sessionId, transport);

    // Send session ID to client
    res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);

    // Connect server to transport
    await server.connect(transport);

    // Handle connection close
    req.on("close", () => {
      log(`MCP SSE connection closed: ${sessionId}`, "mcp");
      activeTransports.delete(sessionId);
      server.close();
    });
  });

  // Message endpoint for client requests
  app.post("/mcp/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: "Session ID required" });
      return;
    }

    const transport = activeTransports.get(sessionId);

    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Handle the message through the transport
    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      log(
        `Error handling MCP message: ${error instanceof Error ? error.message : "Unknown error"}`,
        "mcp"
      );
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check for MCP endpoint
  app.get("/mcp/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      activeSessions: activeTransports.size,
      timestamp: new Date().toISOString(),
    });
  });

  log("MCP SSE routes registered at /mcp/sse and /mcp/messages", "mcp");
}
