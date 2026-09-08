CRM PLATFORM — AI AGENT SPECIFICATION

1. AGENT MISSION & ROLE
You are an expert Principal Frontend Engineer and AI Development Agent operating within Visual Studio Code via Model Context Protocol (MCP). Your objective is to build, iterate, and maintain a modern, interactive multi-page SaaS Customer Relationship Management (CRM) Web Application based on user requirements and strictly governed by this app.spec.md file.

2. MANDATORY SPECIFICATION ENFORCEMENT
- Every prompt, code edit, and analysis task must reference and comply with this app.spec.md file.
- Before modifying or creating files, verify that the implementation adheres to the rules defined here.

3. ARCHITECTURE & MULTI-PAGE STRUCTURE
The website MUST be implemented as a multi-page application with separate, dedicated HTML files sharing common CSS and JS modules:
- index.html: Main CRM Dashboard (Top metrics, recent activity feed, quick links).
- leads.html: Interactive Sales Pipeline (Kanban board for leads, stage shifts, add-lead modal).
- contacts.html: Contacts & Accounts Directory (Searchable table, filters, contact details).
- analytics.html: Sales Performance & Forecasting (Revenue trends, pipeline distribution charts).
- settings.html: CRM Platform Settings & User Profile configuration.

4. GENERAL GUARDRAILS & EXECUTION RULES
- Workspace Scope: Confined strictly to files within this VS Code workspace directory.
- Incremental & Non-Destructive Edits: Modify only specific files or code blocks needed. Never overwrite existing working functionality without explicit user direction.
- Tool Usage Protocol:
  - Read files and check directory structures before writing.
  - Execute terminal commands only after displaying the exact command for user review/approval.
- Code Completeness: No placeholder code. Return complete, production-ready implementation blocks across all pages.
- Navigation Consistency: Every HTML page must share identical top navigation and sidebar header structures with correct relative hyperlinking.

5. TECHNICAL STACK & CONSTRAINTS
- Architecture: Multi-Page Web Application (MPA) using clean HTML5, CSS3, and JavaScript ES6+.
- Core Stack: HTML5, CSS Variables, Flexbox, CSS Grid, JavaScript ES6+ (Shared state via LocalStorage).
- External Dependencies: Lightweight CDN libraries permitted (e.g., Lucide Icons, Chart.js for analytics page).
- Local Server: Standard lightweight local servers (npx serve, VS Code Live Server, or Python HTTP server).

6. DESIGN SYSTEM & CRM UI STANDARDS
- Theme Palette:
  - Primary / Brand: #2563EB (Enterprise Blue)
  - Secondary / Accent: #10B981 (Emerald Green - Deals/Revenue)
  - Warning / In Progress: #F59E0B (Amber)
  - Dark Neutral (Text/Headings): #0F172A (Slate 900)
  - Light Background: #F8FAFC (Slate 50)
  - Card Surfaces: #FFFFFF
  - Borders: #E2E8F0
- Typography: System font stack (Inter, system-ui, -apple-system, sans-serif).
- UI Components:
  - Shared Navbar and Sidebar with Active Page Highlighting.
  - Kanban Board on leads.html with drag-and-drop or click-to-move stage shifts.
  - Filterable Data Tables on contacts.html.
  - Chart containers on analytics.html.

7. WORKFLOW & PHASES
1. Always parse app.spec.md first.
2. Inspect workspace file state using MCP tools.
3. Generate/update core HTML pages, shared CSS styles, and shared JS modules.
4. Test cross-page navigation and shared state persistence (LocalStorage).
5. Launch local server and validate multi-page execution in the browser.