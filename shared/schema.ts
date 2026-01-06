import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for basic auth (kept for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Creatio Connection Configuration
export const creatioConfigSchema = z.object({
  baseUrl: z.string().url("Please enter a valid URL"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type CreatioConfig = z.infer<typeof creatioConfigSchema>;

// Creatio Account entity (Customer)
export const creatioAccountSchema = z.object({
  Id: z.string().uuid(),
  Name: z.string(),
  Phone: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
  Web: z.string().nullable().optional(),
  Address: z.string().nullable().optional(),
  City: z.string().nullable().optional(),
  Country: z.string().nullable().optional(),
  CreatedOn: z.string().nullable().optional(),
  ModifiedOn: z.string().nullable().optional(),
});

export type CreatioAccount = z.infer<typeof creatioAccountSchema>;

// Creatio Opportunity entity
export const creatioOpportunitySchema = z.object({
  Id: z.string().uuid(),
  Title: z.string(),
  Amount: z.number().nullable().optional(),
  DueDate: z.string().nullable().optional(),
  AccountId: z.string().uuid().nullable().optional(),
  StageId: z.string().uuid().nullable().optional(),
  OwnerId: z.string().uuid().nullable().optional(),
  CreatedOn: z.string().nullable().optional(),
  ModifiedOn: z.string().nullable().optional(),
});

export type CreatioOpportunity = z.infer<typeof creatioOpportunitySchema>;

// Query parameters for OData queries
export const queryParamsSchema = z.object({
  filter: z.string().optional(),
  select: z.string().optional(),
  top: z.number().min(1).max(100).optional(),
  skip: z.number().min(0).optional(),
  orderby: z.string().optional(),
  expand: z.string().optional(),
});

export type QueryParams = z.infer<typeof queryParamsSchema>;

// Connection test response
export const connectionTestResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
});

export type ConnectionTestResult = z.infer<typeof connectionTestResultSchema>;

// API response wrapper
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    count: z.number().optional(),
  });

// Query results
export const accountQueryResultSchema = z.object({
  accounts: z.array(creatioAccountSchema),
  count: z.number(),
  queryTime: z.number(),
});

export type AccountQueryResult = z.infer<typeof accountQueryResultSchema>;

// MCP Tool definitions
export const mcpToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
});

export type MCPTool = z.infer<typeof mcpToolSchema>;

// Session state
export const sessionStateSchema = z.object({
  isConnected: z.boolean(),
  lastQuery: z.string().nullable(),
  lastQueryTime: z.string().nullable(),
  accountCount: z.number().nullable(),
});

export type SessionState = z.infer<typeof sessionStateSchema>;
