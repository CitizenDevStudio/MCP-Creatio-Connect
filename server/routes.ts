import type { Express } from "express";
import { createServer, type Server } from "http";
import { createCreatioClient, getCreatioClient, setCreatioClient } from "./creatio-client";
import { mcpServer, MCP_TOOLS } from "./mcp-server";
import { registerMCPRoutes } from "./mcp-sse-server";
import { creatioConfigSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register MCP SSE routes for AI assistant connections
  registerMCPRoutes(app);

  app.post("/api/creatio/connect", async (req, res) => {
    try {
      const validatedConfig = creatioConfigSchema.parse(req.body);
      const client = createCreatioClient(validatedConfig);
      const result = await client.testConnection();

      if (result.success) {
        mcpServer.setClient(client);
      }

      res.json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({
          success: false,
          error: "Invalid configuration provided",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  app.post("/api/creatio/accounts/query", async (req, res) => {
    try {
      const client = getCreatioClient();

      if (!client) {
        res.status(401).json({
          success: false,
          error: "Not connected to Creatio. Please connect first.",
        });
        return;
      }

      const params = {
        filter: req.body.filter || undefined,
        select: req.body.select || undefined,
        top: req.body.top ? parseInt(req.body.top, 10) : 25,
        orderby: req.body.orderby || "Name asc",
      };

      const accounts = await client.queryAccounts(params);

      res.json({
        success: true,
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Query failed",
      });
    }
  });

  app.get("/api/creatio/accounts/:id", async (req, res) => {
    try {
      const client = getCreatioClient();

      if (!client) {
        res.status(401).json({
          success: false,
          error: "Not connected to Creatio. Please connect first.",
        });
        return;
      }

      const account = await client.getAccountById(req.params.id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: "Account not found",
        });
        return;
      }

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get account",
      });
    }
  });

  app.post("/api/creatio/accounts", async (req, res) => {
    try {
      const client = getCreatioClient();

      if (!client) {
        res.status(401).json({
          success: false,
          error: "Not connected to Creatio. Please connect first.",
        });
        return;
      }

      if (!req.body.Name) {
        res.status(400).json({
          success: false,
          error: "Account name is required",
        });
        return;
      }

      const account = await client.createAccount(req.body);

      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create account",
      });
    }
  });

  app.patch("/api/creatio/accounts/:id", async (req, res) => {
    try {
      const client = getCreatioClient();

      if (!client) {
        res.status(401).json({
          success: false,
          error: "Not connected to Creatio. Please connect first.",
        });
        return;
      }

      await client.updateAccount(req.params.id, req.body);

      res.json({
        success: true,
        message: "Account updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update account",
      });
    }
  });

  app.delete("/api/creatio/accounts/:id", async (req, res) => {
    try {
      const client = getCreatioClient();

      if (!client) {
        res.status(401).json({
          success: false,
          error: "Not connected to Creatio. Please connect first.",
        });
        return;
      }

      await client.deleteAccount(req.params.id);

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete account",
      });
    }
  });

  app.get("/api/mcp/tools", (req, res) => {
    res.json({
      success: true,
      tools: MCP_TOOLS,
    });
  });

  app.post("/api/mcp/execute", async (req, res) => {
    try {
      const { tool, args } = req.body;

      if (!tool) {
        res.status(400).json({
          success: false,
          error: "Tool name is required",
        });
        return;
      }

      const result = await mcpServer.executeTool(tool, args || {});

      res.json({
        success: !result.isError,
        result: result.content,
        isError: result.isError,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
      });
    }
  });

  app.post("/api/creatio/disconnect", (req, res) => {
    setCreatioClient(null as any);
    res.json({
      success: true,
      message: "Disconnected from Creatio",
    });
  });

  app.get("/api/health", (req, res) => {
    const client = getCreatioClient();
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      creatioConnected: !!client,
      version: "1.0.0",
    });
  });

  return httpServer;
}
