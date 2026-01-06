import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Database, Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionForm } from "@/components/connection-form";
import { QueryBuilder } from "@/components/query-builder";
import { AccountResults } from "@/components/account-results";
import { MCPToolsPanel } from "@/components/mcp-tools-panel";
import { StatusBar } from "@/components/status-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import type { CreatioConfig, CreatioAccount } from "@shared/schema";

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CreatioAccount[] | null>(null);
  const [queryTime, setQueryTime] = useState<number | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [lastQueryTimeStamp, setLastQueryTimeStamp] = useState<string | null>(null);

  const connectMutation = useMutation({
    mutationFn: async (config: CreatioConfig) => {
      const response = await apiRequest("POST", "/api/creatio/connect", config);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsConnected(true);
        setConnectionError(null);
      } else {
        setConnectionError(data.error || "Failed to connect");
        setIsConnected(false);
      }
    },
    onError: (error: Error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/creatio/disconnect", {});
      return response.json();
    },
    onSuccess: () => {
      setIsConnected(false);
      setInstanceUrl(null);
      setAccounts(null);
      setQueryTime(null);
      setQueryError(null);
      setLastQueryTimeStamp(null);
      setConnectionError(null);
    },
  });

  const queryMutation = useMutation({
    mutationFn: async (params: Record<string, string | undefined>) => {
      const startTime = Date.now();
      const response = await apiRequest("POST", "/api/creatio/accounts/query", params);
      const data = await response.json();
      const endTime = Date.now();
      return { ...data, queryTime: endTime - startTime };
    },
    onSuccess: (data) => {
      if (data.success) {
        setAccounts(data.data || []);
        setQueryTime(data.queryTime);
        setQueryError(null);
        setLastQueryTimeStamp(new Date().toLocaleTimeString());
      } else {
        setQueryError(data.error || "Query failed");
        setAccounts([]);
        setQueryTime(null);
      }
    },
    onError: (error: Error) => {
      setQueryError(error.message);
      setAccounts([]);
      setQueryTime(null);
    },
  });

  const handleConnect = useCallback(async (config: CreatioConfig) => {
    setInstanceUrl(config.baseUrl);
    await connectMutation.mutateAsync(config);
  }, [connectMutation]);

  const handleDisconnect = useCallback(async () => {
    await disconnectMutation.mutateAsync();
  }, [disconnectMutation]);

  const handleQuery = useCallback(async (params: Record<string, string | undefined>) => {
    await queryMutation.mutateAsync(params);
  }, [queryMutation]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Database className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Creatio MCP Server</h1>
            <p className="text-xs text-muted-foreground">CRM Integration Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground"
          >
            <a
              href="https://academy.creatio.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-creatio-docs"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Docs
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground"
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-github"
            >
              <Github className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <ConnectionForm
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isConnecting={connectMutation.isPending}
                isDisconnecting={disconnectMutation.isPending}
                isConnected={isConnected}
                connectionError={connectionError}
              />
              <QueryBuilder
                onQuery={handleQuery}
                isQuerying={queryMutation.isPending}
                isConnected={isConnected}
              />
            </div>

            <div className="space-y-6 lg:col-span-8">
              <AccountResults
                accounts={accounts}
                isLoading={queryMutation.isPending}
                queryTime={queryTime}
                error={queryError}
              />
              <MCPToolsPanel />
            </div>
          </div>
        </div>
      </main>

      <StatusBar
        isConnected={isConnected}
        lastQueryTime={lastQueryTimeStamp}
        accountCount={accounts?.length ?? null}
        instanceUrl={instanceUrl}
      />
    </div>
  );
}
