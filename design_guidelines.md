# Design Guidelines: Creatio MCP Server & VS Code Extension

## Design Approach

**Selected Approach:** VS Code Design System Compliance

This developer tool must seamlessly integrate with VS Code's native UI patterns and conventions. Users expect consistency with their development environment, not standalone application design.

## Core Design Principles

1. **VS Code Native First** - Embrace VS Code's built-in components and patterns
2. **Information Clarity** - CRM data must be scannable and parseable at a glance
3. **Progressive Disclosure** - Show essentials first, details on demand
4. **Error Transparency** - Technical errors should be immediately actionable

---

## Typography

**System Fonts:** Use VS Code's default editor fonts
- **Primary:** Consolas, 'Courier New', monospace (for data display)
- **UI Labels:** -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui
- **Code/JSON:** Inherit from VS Code editor settings

**Sizes:**
- Output panel data: 13px (VS Code standard)
- Configuration labels: 13px
- Error messages: 12px
- Command descriptions: 11px

---

## Layout System

**Spacing Units:** Use VS Code's 4px base unit
- Compact spacing: `4px, 8px` for related items
- Standard spacing: `12px, 16px` for sections
- Generous spacing: `20px, 24px` for major divisions

**Component Structure:**

### Settings Configuration Panel
```
- Section header (24px top margin, 8px bottom)
- Input field label (4px bottom margin)
- Input field (8px bottom margin)
- Helper text (4px top margin, 16px bottom before next field)
```

### Output Panel
```
- Query metadata header (12px padding)
- Separator line (1px, 8px vertical margin)
- Results list (8px padding between items)
- Each account record (16px vertical spacing)
```

### Quick Pick Menu
```
- Title (VS Code standard)
- Items: 32px height per item
- Icons: 16x16px, 8px right margin
```

---

## Component Library

### Configuration UI (VS Code Settings)

**Input Fields:**
- Creatio Instance URL: Full-width text input with placeholder "https://yourcompany.creatio.com"
- Username: Text input (autocomplete off)
- Password: Password input with "show/hide" toggle
- Field grouping: 8px between related fields, 24px between groups

**Validation:**
- Inline error messages below invalid fields
- Red indicator icon (⚠) 4px left of error text
- Success state: Subtle checkmark (✓) on validated fields

### Command Palette Integration

**Command Structure:**
```
Creatio: Query Accounts
  └─ Description: "Fetch and display accounts from Creatio CRM"
  └─ Keybinding: (suggest Ctrl+Shift+C, Q)
```

### Output Panel Display

**Account List View:**
```
┌─ Query Results: 15 accounts found ───────────────┐
│                                                   │
│ [1] Acme Corporation                             │
│     ID: 405947d0-2ffb-4ded-8675-0475f19f5a81    │
│     Phone: +1 555-1234                           │
│     Email: contact@acme.com                      │
│                                                   │
│ [2] Tech Solutions Ltd                           │
│     ID: 5b2c8e71-9a3f-4d1e-b7c6-3e8f2a1d9c4b    │
│     Phone: +1 555-5678                           │
│     ...                                          │
└───────────────────────────────────────────────────┘
```

**Formatting Rules:**
- Monospace font for consistency
- Account name: Bold weight
- Field labels: Dim color (60% opacity)
- GUIDs: Monospace, selectable
- Separators: Single line, subtle (20% opacity)

### Status Bar Integration

**Active Connection Indicator:**
- Icon: Database symbol (󰆼) or CRM icon
- Text: "Creatio Connected" or "Creatio: 15 accounts"
- Click action: Quick pick for recent queries
- Position: Right side of status bar

### Error Display

**Error Message Template:**
```
❌ Creatio API Error

Failed to authenticate with Creatio instance.

Details:
  Status: 401 Unauthorized
  Endpoint: /ServiceModel/AuthService.svc/Login
  
Troubleshooting:
  • Verify username and password in settings
  • Check instance URL is correct
  • Ensure API access is enabled for your user

[Open Settings] [Retry Connection] [View Logs]
```

**Error Hierarchy:**
- Critical errors: Red icon, bold title
- Warnings: Yellow icon, regular weight
- Info messages: Blue icon, helpful tips

---

## Data Presentation

### Account Data Cards

**Field Display Order:**
1. Name (primary, 14px bold)
2. ID (monospace, 11px, selectable)
3. Phone (with click-to-call link if supported)
4. Email (with mailto: link)
5. Website (with external link icon)

**Interaction States:**
- Hoverable: Subtle background highlight (5% lighter)
- Selectable: Click to copy ID or expand details
- Expanded: Show additional fields with smooth transition

### Query Filters UI

**Filter Input (Quick Input Box):**
```
┌─ Filter Accounts ─────────────────────────────┐
│                                                │
│ Examples:                                      │
│   Name contains "Tech"                         │
│   Phone startswith "+1"                        │
│   CreatedOn gt 2024-01-01                      │
│                                                │
│ Enter OData filter: _                          │
└────────────────────────────────────────────────┘
```

**Auto-complete Suggestions:**
- Field names: Account properties
- Operators: eq, ne, gt, lt, contains, startswith
- Sample queries as hints

---

## Accessibility

- All commands accessible via keyboard shortcuts
- Screen reader announcements for query results
- High contrast mode support (inherit from VS Code)
- Focus indicators on all interactive elements
- ARIA labels for custom UI components

---

## No Animations

Static, instant transitions only. Developer tools prioritize speed and predictability over visual flair.

---

## Extension-Specific Patterns

### Welcome Screen (First Launch)

Simple setup wizard in webview:
1. Welcome message with Creatio logo
2. Configuration form (3 fields stacked vertically)
3. "Test Connection" button (full-width, 16px vertical margin)
4. Success/error feedback inline

### Notification Toasts

Use VS Code's native notification system:
- Info: "Connected to Creatio successfully"
- Warning: "Session expired, re-authenticating..."
- Error: "Failed to fetch accounts. Check settings."

---

## JSON Output Formatting

For raw JSON display in output panel:
- Syntax highlighting: Inherit from VS Code theme
- Indentation: 2 spaces
- Line numbers: Optional, togglable
- Collapsible objects: Use VS Code's built-in JSON viewer

This design prioritizes developer efficiency, clear information hierarchy, and seamless VS Code integration over decorative elements.