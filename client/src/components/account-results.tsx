import { useState } from "react";
import { Building2, Phone, Mail, Globe, MapPin, Calendar, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CreatioAccount } from "@shared/schema";

interface AccountResultsProps {
  accounts: CreatioAccount[] | null;
  isLoading: boolean;
  queryTime: number | null;
  error: string | null;
}

function AccountCard({ account, index }: { account: CreatioAccount; index: number }) {
  const [copiedId, setCopiedId] = useState(false);

  const copyId = async () => {
    await navigator.clipboard.writeText(account.Id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className="group rounded-md border border-border bg-card p-4 transition-colors hover-elevate"
      data-testid={`card-account-${account.Id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate" data-testid={`text-account-name-${account.Id}`}>
                {account.Name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyId}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    data-testid={`button-copy-id-${account.Id}`}
                  >
                    {copiedId ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span className="truncate max-w-[180px]">{account.Id}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copiedId ? "Copied!" : "Click to copy ID"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm">
        {account.Phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate" data-testid={`text-account-phone-${account.Id}`}>{account.Phone}</span>
          </div>
        )}
        {account.Email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <a
              href={`mailto:${account.Email}`}
              className="truncate hover:text-foreground hover:underline"
              data-testid={`link-account-email-${account.Id}`}
            >
              {account.Email}
            </a>
          </div>
        )}
        {account.Web && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <a
              href={account.Web.startsWith("http") ? account.Web : `https://${account.Web}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate hover:text-foreground hover:underline"
              data-testid={`link-account-web-${account.Id}`}
            >
              {account.Web}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {(account.City || account.Address) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate" data-testid={`text-account-location-${account.Id}`}>
              {[account.Address, account.City, account.Country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        {account.CreatedOn && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span data-testid={`text-account-created-${account.Id}`}>
              Created: {new Date(account.CreatedOn).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-md border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No accounts found</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Try adjusting your filter criteria or connect to your Creatio instance to query accounts.
      </p>
    </div>
  );
}

function WelcomeState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Building2 className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-medium">Ready to Query</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Connect to your Creatio instance and execute a query to see account data here.
      </p>
    </div>
  );
}

export function AccountResults({ accounts, isLoading, queryTime, error }: AccountResultsProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Account Results</CardTitle>
              <CardDescription className="text-sm">
                {accounts
                  ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""} found`
                  : "Query results will appear here"}
              </CardDescription>
            </div>
          </div>
          {queryTime !== null && (
            <Badge variant="secondary" className="shrink-0" data-testid="badge-query-time">
              {queryTime}ms
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {error ? (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive" data-testid="text-results-error">
            <p className="font-medium">Query Error</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : accounts === null ? (
          <WelcomeState />
        ) : accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[calc(100vh-380px)] pr-4">
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <AccountCard key={account.Id} account={account} index={index} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
