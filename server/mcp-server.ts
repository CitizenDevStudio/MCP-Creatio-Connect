import type { CreatioAccount, QueryParams } from "@shared/schema";
import { CreatioClient } from "./creatio-client";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export const MCP_TOOLS: MCPTool[] = [
  {
    name: "test_creatio_connection",
    description: "Test connection to a Creatio CRM instance using Forms authentication",
    inputSchema: {
      type: "object",
      properties: {
        baseUrl: {
          type: "string",
          description: "The base URL of the Creatio instance (e.g., https://yourcompany.creatio.com)",
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
    description: "Query Creatio Account (Customer) records with OData filter expressions",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "OData $filter expression (e.g., \"contains(Name,'Tech')\" or \"Name eq 'Acme'\")",
        },
        select: {
          type: "string",
          description: "Comma-separated list of fields to return (e.g., \"Id,Name,Phone,Email\")",
        },
        top: {
          type: "number",
          description: "Maximum number of records to return (1-100, default 25)",
        },
        orderby: {
          type: "string",
          description: "Sort order (e.g., \"Name asc\" or \"CreatedOn desc\")",
        },
      },
    },
  },
  {
    name: "get_creatio_account",
    description: "Get a single Creatio Account by its unique ID (GUID)",
    inputSchema: {
      type: "object",
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
      type: "object",
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
      type: "object",
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
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The GUID of the account to delete",
        },
      },
      required: ["id"],
    },
  },
];

export class MCPServer {
  private client: CreatioClient | null = null;

  setClient(client: CreatioClient): void {
    this.client = client;
  }

  getTools(): MCPTool[] {
    return MCP_TOOLS;
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    try {
      switch (name) {
        case "test_creatio_connection":
          return await this.testConnection(args as {
            baseUrl: string;
            username: string;
            password: string;
          });

        case "query_creatio_accounts":
          return await this.queryAccounts(args as QueryParams);

        case "get_creatio_account":
          return await this.getAccount(args.id as string);

        case "create_creatio_account":
          return await this.createAccount(args);

        case "update_creatio_account":
          return await this.updateAccount(args);

        case "delete_creatio_account":
          return await this.deleteAccount(args.id as string);

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async testConnection(config: {
    baseUrl: string;
    username: string;
    password: string;
  }): Promise<MCPToolResult> {
    const client = new CreatioClient(config);
    const result = await client.testConnection();

    if (result.success) {
      this.client = client;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
      isError: !result.success,
    };
  }

  private async queryAccounts(params: QueryParams): Promise<MCPToolResult> {
    if (!this.client) {
      return {
        content: [{ type: "text", text: "Not connected. Use test_creatio_connection first." }],
        isError: true,
      };
    }

    const accounts = await this.client.queryAccounts({
      filter: params.filter,
      select: params.select,
      top: params.top || 25,
      orderby: params.orderby || "Name asc",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: accounts.length,
            accounts: accounts.map((a) => ({
              Id: a.Id,
              Name: a.Name,
              Phone: a.Phone,
              Email: a.Email,
              Web: a.Web,
              City: a.City,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async getAccount(id: string): Promise<MCPToolResult> {
    if (!this.client) {
      return {
        content: [{ type: "text", text: "Not connected. Use test_creatio_connection first." }],
        isError: true,
      };
    }

    const account = await this.client.getAccountById(id);

    if (!account) {
      return {
        content: [{ type: "text", text: `Account not found: ${id}` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(account, null, 2),
        },
      ],
    };
  }

  private async createAccount(args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.client) {
      return {
        content: [{ type: "text", text: "Not connected. Use test_creatio_connection first." }],
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

    const created = await this.client.createAccount(accountData);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Account created successfully",
            account: created,
          }, null, 2),
        },
      ],
    };
  }

  private async updateAccount(args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.client) {
      return {
        content: [{ type: "text", text: "Not connected. Use test_creatio_connection first." }],
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

    await this.client.updateAccount(id, updates);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Account ${id} updated successfully`,
          }, null, 2),
        },
      ],
    };
  }

  private async deleteAccount(id: string): Promise<MCPToolResult> {
    if (!this.client) {
      return {
        content: [{ type: "text", text: "Not connected. Use test_creatio_connection first." }],
        isError: true,
      };
    }

    await this.client.deleteAccount(id);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Account ${id} deleted successfully`,
          }, null, 2),
        },
      ],
    };
  }
}

export const mcpServer = new MCPServer();
