# Creatio MCP Server

## Overview

This project is a Creatio MCP (Model Context Protocol) Server with a web-based CRM integration dashboard. It provides a full-stack application for connecting to Creatio CRM instances, executing CRUD operations on Customer (Account) and Opportunity data, and exposing MCP tools for AI agent integration.

The application serves as both a developer tool interface for testing Creatio CRM connections and an MCP server that can be consumed by AI coding assistants like Claude.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with hot module replacement
- **Theme Support**: Dark/light/system theme with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: REST endpoints under `/api/*` prefix
- **Build**: esbuild for production bundling with Vite for frontend

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database tables and Zod validation schemas
- **Database**: PostgreSQL (requires `DATABASE_URL` environment variable)
- **Session Storage**: In-memory storage available, with connect-pg-simple for PostgreSQL sessions

### Creatio CRM Integration
- **Authentication**: Forms-based authentication against Creatio AuthService
- **Data Access**: OData v4 protocol for querying Account and Opportunity entities
- **Session Management**: Maintains authenticated session with CSRF token handling
- **Client Location**: `server/creatio-client.ts` handles all Creatio API communication

### MCP Server Implementation
- **Tool Definitions**: Located in `server/mcp-server.ts`
- **Available Tools**: Connection testing, account querying, account retrieval
- **Protocol**: Exposes MCP-compatible tool interfaces for AI agent consumption

### Key Design Patterns
- **Shared Types**: `shared/` directory contains schemas used by both frontend and backend
- **Validation**: Zod schemas for runtime validation with drizzle-zod integration
- **Error Handling**: Centralized error responses with typed error states

## External Dependencies

### Database
- PostgreSQL database required
- Connection via `DATABASE_URL` environment variable
- Drizzle Kit for schema migrations (`npm run db:push`)

### Third-Party Services
- **Creatio CRM**: External CRM system accessed via OData API
  - Requires base URL, username, and password for authentication
  - Uses Forms authentication (not OAuth)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Async state management
- `@radix-ui/*`: Accessible UI primitives
- `react-hook-form` / `@hookform/resolvers`: Form handling with Zod validation
- `wouter`: Client-side routing
- `express`: HTTP server framework