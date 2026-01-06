import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Filter, SortAsc, Hash, Play, RotateCcw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const queryFormSchema = z.object({
  filter: z.string().optional(),
  select: z.string().optional(),
  top: z.string().optional(),
  orderby: z.string().optional(),
});

type QueryFormValues = z.infer<typeof queryFormSchema>;

interface QueryBuilderProps {
  onQuery: (params: QueryFormValues) => Promise<void>;
  isQuerying: boolean;
  isConnected: boolean;
}

const fieldOptions = [
  { value: "Name", label: "Name" },
  { value: "Phone", label: "Phone" },
  { value: "Email", label: "Email" },
  { value: "Web", label: "Website" },
  { value: "Address", label: "Address" },
  { value: "City", label: "City" },
  { value: "CreatedOn", label: "Created Date" },
];

const orderOptions = [
  { value: "Name asc", label: "Name (A-Z)" },
  { value: "Name desc", label: "Name (Z-A)" },
  { value: "CreatedOn desc", label: "Newest First" },
  { value: "CreatedOn asc", label: "Oldest First" },
];

const limitOptions = [
  { value: "10", label: "10 records" },
  { value: "25", label: "25 records" },
  { value: "50", label: "50 records" },
  { value: "100", label: "100 records" },
];

export function QueryBuilder({ onQuery, isQuerying, isConnected }: QueryBuilderProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      filter: "",
      select: "",
      top: "25",
      orderby: "Name asc",
    },
  });

  const onSubmit = async (data: QueryFormValues) => {
    await onQuery(data);
  };

  const handleReset = () => {
    form.reset({
      filter: "",
      select: "",
      top: "25",
      orderby: "Name asc",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Query Accounts</CardTitle>
            <CardDescription className="text-sm">
              Search and filter Creatio Account records
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="filter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    Search Filter
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., contains(Name,'Tech') or Name eq 'Acme'"
                      {...field}
                      data-testid="input-filter"
                      disabled={!isConnected}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    OData filter expression (leave empty for all records)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="top"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5" />
                      Limit
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isConnected}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-limit">
                          <SelectValue placeholder="Select limit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {limitOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderby"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <SortAsc className="h-3.5 w-3.5" />
                      Sort By
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isConnected}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-orderby">
                          <SelectValue placeholder="Select order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground"
                  data-testid="button-advanced-toggle"
                >
                  Advanced Options
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <FormField
                  control={form.control}
                  name="select"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Fields</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Id,Name,Phone,Email"
                          {...field}
                          data-testid="input-select"
                          disabled={!isConnected}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Comma-separated field names (leave empty for all fields)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isQuerying || !isConnected}
                data-testid="button-execute-query"
              >
                {isQuerying ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Querying...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Execute Query
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isQuerying || !isConnected}
                data-testid="button-reset-query"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
