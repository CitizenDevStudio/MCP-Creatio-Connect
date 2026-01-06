import { Wrench, Code2, FileJson, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

const mcpTools: MCPTool[] = [
  {
    name: "query_creatio_accounts",
    description: "Query Creatio Account (Customer) records with OData filters",
    parameters: {
      filter: {
        type: "string",
        description: "OData $filter expression (e.g., contains(Name,'Tech'))",
        required: false,
      },
      select: {
        type: "string",
        description: "Comma-separated fields to return",
        required: false,
      },
      top: {
        type: "number",
        description: "Maximum number of records (1-100)",
        required: false,
      },
      orderby: {
        type: "string",
        description: "Sort order (e.g., 'Name asc')",
        required: false,
      },
    },
  },
  {
    name: "get_creatio_account",
    description: "Get a single Creatio Account by ID",
    parameters: {
      id: {
        type: "string",
        description: "The GUID of the account to retrieve",
        required: true,
      },
    },
  },
  {
    name: "test_creatio_connection",
    description: "Test connection to Creatio instance",
    parameters: {
      baseUrl: {
        type: "string",
        description: "Creatio instance URL",
        required: true,
      },
      username: {
        type: "string",
        description: "Creatio username",
        required: true,
      },
      password: {
        type: "string",
        description: "Creatio password",
        required: true,
      },
    },
  },
];

const sampleMcpConfig = `{
  "mcpServers": {
    "creatio": {
      "command": "node",
      "args": ["path/to/creatio-mcp-server/index.js"],
      "env": {
        "CREATIO_BASE_URL": "https://yourcompany.creatio.com",
        "CREATIO_USERNAME": "your_username",
        "CREATIO_PASSWORD": "your_password"
      }
    }
  }
}`;

const sampleVsCodeSettings = `{
  "creatio-mcp.baseUrl": "https://yourcompany.creatio.com",
  "creatio-mcp.username": "your_username"
}`;

function ToolCard({ tool }: { tool: MCPTool }) {
  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Terminal className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-mono text-sm font-semibold text-foreground">{tool.name}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parameters</p>
        <div className="space-y-1.5">
          {Object.entries(tool.parameters).map(([key, param]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                {key}
              </code>
              {param.required && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  required
                </Badge>
              )}
              <span className="text-muted-foreground">{param.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MCPToolsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">MCP Server Tools</CardTitle>
            <CardDescription className="text-sm">
              Available MCP tools for Creatio integration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="tools" className="text-xs" data-testid="tab-tools">
              <Terminal className="h-3.5 w-3.5 mr-1.5" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="mcp-config" className="text-xs" data-testid="tab-mcp-config">
              <FileJson className="h-3.5 w-3.5 mr-1.5" />
              MCP Config
            </TabsTrigger>
            <TabsTrigger value="vscode" className="text-xs" data-testid="tab-vscode">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              VS Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="mt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {mcpTools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="mcp-config" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add this configuration to your MCP settings file:
              </p>
              <div className="rounded-md bg-muted p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-foreground whitespace-pre">
                  {sampleMcpConfig}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vscode" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add these settings to your VS Code settings.json:
              </p>
              <div className="rounded-md bg-muted p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-foreground whitespace-pre">
                  {sampleVsCodeSettings}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Password should be stored securely in VS Code's secret storage.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
