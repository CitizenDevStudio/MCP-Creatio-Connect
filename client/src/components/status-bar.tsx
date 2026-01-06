import { Database, Wifi, WifiOff, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBarProps {
  isConnected: boolean;
  lastQueryTime: string | null;
  accountCount: number | null;
  instanceUrl: string | null;
}

export function StatusBar({ isConnected, lastQueryTime, accountCount, instanceUrl }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border bg-card px-4 py-2 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground" data-testid="text-status-connected">
                Connected
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground" data-testid="text-status-disconnected">
                Not connected
              </span>
            </>
          )}
        </div>

        {instanceUrl && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            <span className="max-w-[200px] truncate" data-testid="text-status-instance">
              {instanceUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {accountCount !== null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span data-testid="text-status-account-count">{accountCount} accounts</span>
          </div>
        )}

        {lastQueryTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span data-testid="text-status-last-query">Last query: {lastQueryTime}</span>
          </div>
        )}

        <Badge variant="outline" className="text-[10px]" data-testid="badge-mcp-version">
          MCP v1.0
        </Badge>
      </div>
    </div>
  );
}
