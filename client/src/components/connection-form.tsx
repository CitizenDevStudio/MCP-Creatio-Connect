import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Database, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { creatioConfigSchema, type CreatioConfig } from "@shared/schema";

interface ConnectionFormProps {
  onConnect: (config: CreatioConfig) => Promise<void>;
  onDisconnect: () => Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isConnected: boolean;
  connectionError: string | null;
}

export function ConnectionForm({ onConnect, onDisconnect, isConnecting, isDisconnecting, isConnected, connectionError }: ConnectionFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CreatioConfig>({
    resolver: zodResolver(creatioConfigSchema),
    defaultValues: {
      baseUrl: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: CreatioConfig) => {
    await onConnect(data);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Creatio Connection</CardTitle>
            <CardDescription className="text-sm">
              Connect to your Creatio CRM instance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instance URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://yourcompany.creatio.com"
                      {...field}
                      data-testid="input-base-url"
                      disabled={isConnected}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Your Creatio instance URL without trailing slash
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      autoComplete="off"
                      {...field}
                      data-testid="input-username"
                      disabled={isConnected}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="off"
                        {...field}
                        data-testid="input-password"
                        disabled={isConnected}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                        disabled={isConnected}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {connectionError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="text-connection-error">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{connectionError}</span>
              </div>
            )}

            {isConnected && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400" data-testid="text-connection-success">
                <Check className="h-4 w-4 shrink-0" />
                <span>Connected successfully to Creatio instance</span>
              </div>
            )}

            {isConnected ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                data-testid="button-disconnect"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect"
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={isConnecting}
                data-testid="button-connect"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
