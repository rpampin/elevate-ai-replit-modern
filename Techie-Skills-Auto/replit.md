# Skills Management System

## Overview

This is a full-stack web application for managing team skills and talent within an organization. The system allows tracking of team members, their skills, learning goals, and provides comprehensive analytics on team capabilities. Built as a modern monorepo with a React frontend and Express backend, it provides a complete solution for talent management and skills assessment.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Development**: tsx for TypeScript execution in development

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL 16 (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas shared between client and server

## Key Components

### Core Entities
1. **Knowledge Areas**: High-level skill domains (Programming, Cloud, etc.)
2. **Skill Categories**: Groupings within knowledge areas with assessment criteria
3. **Skills**: Individual competencies linked to categories and knowledge areas
4. **Scales**: Assessment frameworks (numeric/qualitative) for skill evaluation
5. **Members**: Team members with profiles and skill assessments
6. **Member Profiles**: Extended member data including assignments, roles, and feedback

### Frontend Pages
- **Dashboard**: Overview with stats, filters, and member management
- **Members**: Team member CRUD operations with detailed profiles
- **Skills**: Skill management and organization
- **Knowledge Areas**: Domain management interface
- **Categories**: Skill category configuration
- **Scales**: Assessment scale management
- **Analytics**: Advanced reporting and insights

### Shared Architecture
- **Schema**: Centralized type definitions and validation in `/shared/schema.ts`
- **Path Aliases**: Configured for clean imports (`@/`, `@shared/`)
- **Internationalization**: Built-in support for English/Spanish localization

## Data Flow

### Client-Server Communication
1. Frontend makes REST API calls via TanStack Query
2. Backend validates requests using shared Zod schemas
3. Drizzle ORM handles database operations with type safety
4. Responses are cached client-side for performance

### State Management
- Server state managed by React Query with automatic caching
- Local component state for UI interactions
- Form state handled by React Hook Form
- Global settings (language) via React Context

### Data Validation
- Shared Zod schemas ensure consistent validation
- Client-side validation for immediate feedback
- Server-side validation for security and data integrity

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **UI Components**: Radix UI primitives for accessibility
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns for date manipulation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Development Tools
- **TypeScript**: Full type safety across the stack
- **ESLint/Prettier**: Code quality and formatting
- **Vite Plugins**: Runtime error handling and development tools

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Database: Drizzle pushes schema changes via `npm run db:push`

### Production Environment
- **Platform**: Replit Autoscale deployment
- **Port Configuration**: Server runs on port 5000, exposed as port 80
- **Environment Variables**: `DATABASE_URL` required for PostgreSQL connection
- **Static Assets**: Express serves built frontend from `/dist/public`

### Development Workflow
- Hot module replacement via Vite in development
- TypeScript compilation checking without emit
- Database schema changes managed through Drizzle migrations

## Changelog
- July 3, 2025. Enhanced People Dashboard filter system with improved user experience
  - Knowledge Area dropdown now filters Skills dropdown instead of directly filtering members
  - Skills dropdown supports multi-selection with visual checkmarks for selected skills
  - Clicking a selected skill in dropdown toggles it off (removes from selection)
  - Selected skills appear as removable badges in dedicated full-width section below filters
  - Improved filter workflow: Knowledge Area → Skills (with checkmarks) → Members filtered by skills
  - Enhanced UX prevents messy layout when many skills are selected
- January 2, 2025. Created specialized modular dashboard architecture for role-specific business intelligence
  - Split unified business intelligence dashboard into four dedicated specialized dashboards
  - Created Sales Dashboard (sales-dashboard.tsx) for talent availability and technology expertise tracking
  - Created Solutions Dashboard (solutions-dashboard.tsx) for key people identification and skill gap analysis
  - Created People Dashboard (people-dashboard.tsx) for career path insights and development opportunities
  - Created Production Dashboard (production-dashboard.tsx) for colleague networking and knowledge exchange
  - Updated routing system in App.tsx to support new specialized dashboard endpoints
  - Enhanced sidebar navigation with dedicated "Dashboards" section containing all specialized dashboards
  - Reorganized navigation hierarchy: Dashboards (main/sales/solutions/people/production), Insights (analytics/AI), Management (members/skills/etc.)
  - Each dashboard provides focused, role-specific business intelligence tailored to different business functions
  - Transformed main Dashboard into a clean "Talent Command Center" landing page that guides users to specialized dashboards
  - Removed redundant filtering functionality from main Dashboard (specialized dashboards contain detailed filtering)
  - Main Dashboard now shows high-level stats and provides quick access navigation to all specialized functions
- July 1, 2025. Updated member categories from CSV bootcamp data and refined Team Skills Radar filtering
  - Successfully imported and applied member categories (Starter, Builder, Solver, Wizard) based on CSV skill expertise data
  - Processed 76 team members with skill data, resulting in: 4 Starters, 21 Builders, 33 Solvers, 21 Wizards
  - Removed knowledge area filter from Categories view in Team Skills Radar for simplified user experience
  - Categories view now filters by member categories only, maintaining clean and focused interface
  - Skills view retains all filtering options (knowledge areas, categories, and member categories)
- July 1, 2025. Enhanced Team Skill Radar with multi-perspective analytics and comprehensive analytics restoration
  - Rebuilt Team Skill Radar with three distinct views: Knowledge Areas, Categories, and Skills
  - Knowledge Areas view: Shows proficiency by knowledge areas, filters by member categories only
  - Categories view: Shows proficiency by skill categories, filters by member categories only
  - Skills view: Shows individual skill proficiency, filters by knowledge areas, categories, and member categories
  - Progressive filtering system where each view adds more filter options than the previous
  - Uses existing member category system (All, Starter, Builder, Solver, Wizard) for consistent data source
  - Restored all missing analytics sections: category/client distribution, top performers, learning goals, strengths, and skill gaps
  - Fixed pagination reset issue where search changes were unnecessarily resetting page position
- July 1, 2025. Refined pagination UI with optional dividers for cleaner management interfaces
  - Added optional `showPaginationDivider` prop to DataTable component (defaults to true)
  - Updated all management pages (Members, Skills, Knowledge Areas, Categories, Scales) to hide pagination dividers with `showPaginationDivider={false}`
  - Achieved cleaner, more streamlined appearance for table-based management interfaces
  - Profile tabs continue using standalone PaginationControls with dividers for card-based layouts
- July 1, 2025. Complete application-wide pagination standardization with reusable component architecture
  - Created unified PaginationControls component with consistent interface across entire application
  - Standardized all 7 profile tabs (Skills, Opportunities, Assignments, Roles, Appreciations, Feedback, Client History) to use identical pagination implementation
  - Updated all 5 main management pages (Members, Skills, Knowledge Areas, Categories, Scales) to use reusable pagination component
  - Eliminated all inline pagination implementations, achieving complete consistency across 12+ components
  - All pagination now uses consistent 10-item default with standardized Previous/Next controls and item count display
  - Enhanced Skills and Opportunities tabs with scale-based proficiency levels and proper database integration
  - Removed Priority field completely from learning goals (frontend and backend)
  - Fixed scale data handling to support database format (string arrays vs object arrays)
  - All components maintain dark mode support and proper spacing standards
- June 30, 2025. Unified visual layout across all list views and restricted Add Techie button to Members page only
  - Modified Header component to conditionally show Add Techie button only when explicitly requested
  - Added showAddTechie prop to Header component (defaults to false)
  - Updated Members page to enable Add Techie button with showAddTechie={true}
  - Standardized all list views (Skills, Knowledge Areas, Categories, Scales) to match Members page layout structure
  - All pages now use consistent `<main className="p-6">` container with DataTable for unified visual appearance
  - Removed action buttons from non-member pages, showing only Import Excel where applicable
  - Fixed Add Techie functionality to navigate to newly created member's profile page after successful creation
  - Cleaned up debugging logs and streamlined the user experience across all management interfaces
- June 30, 2025. Fixed edit modal forms and completed comprehensive member data population
  - Fixed all edit modals (Assignment, Appreciation, Feedback, Client History) to properly populate forms with existing data
  - Resolved clientId format issue where generated data used string IDs like "client-1-1" instead of numeric client IDs
  - Updated data generation script to use actual numeric client IDs from the system
  - Successfully populated all 77 member profiles with complete realistic data: assignments (2-5 each), roles (1-3 each), appreciations (1-4 each), feedback (1-3 each), client history (2-4 periods each)
  - All edit forms now correctly handle and display existing member data when editing
- June 30, 2025. Reorganized navigation menu with grouped sections for better user experience
  - Restructured sidebar into two logical sections: "Insights" and "Management"
  - Insights section: Dashboard, Analytics, AI Assistant (for decision-making and analysis)
  - Management section: Members, Skills, Knowledge Areas, Categories, Scales (for CRUD operations)
  - Improved menu hierarchy with section headers and better visual organization
  - Fixed member profile system by removing duplicate fullName field and unified name field usage
- June 27, 2025. Enhanced date input with professional library integration and updated team member location system
  - Replaced custom DateInput with react-datepicker + react-input-mask for professional UX
  - Implemented masked input with 99/99/9999 pattern for field-level control (2 digits day, 2 digits month, 4 digits year)
  - Added INSERT-mode behavior: clicking date field selects all text for easy overwriting
  - Maintained DD/MM/YYYY format display while persisting as ISO dates
  - Enhanced date picker with calendar popup, year/month dropdowns, and visual mask characters
  - Fixed React hooks ordering issues with stable component structure and workflow restarts
  - Updated member-view component to use DD/MM/YYYY format for all date displays (hire date, assignments, roles, appreciations, feedback, client history)
  - Fixed categories and locations API endpoints - both working correctly with proper storage methods
  - Enhanced form functionality with working Category and Location dropdowns using CreatableSelect components
  - Updated Techie Category model with correct values: Starter, Builder, Solver, Wizard
  - Updated Location model to use South American countries: Argentina, Uruguay, Chile, Brazil, Colombia
  - Randomly assigned country locations to all 77 team members with balanced distribution
  - Updated both storage initialization and persisted JSON data to reflect new location and category structures
- June 26, 2025. Enhanced client diversity and work history distribution
  - Expanded client list from 3 to 12 diverse clients across different industries
  - Added clients: FinanceFlow, HealthTech Solutions, RetailMax, EduTech Pro, DataVault Systems, CloudFirst Technologies, MobileApp Innovations, SecureNet Solutions, AgriTech Partners
  - Redistributed member current client assignments for better distribution
  - Updated work history with varied client assignments to eliminate repetition
  - Fixed overlapping work history for all 77 member profiles
  - Created realistic career progression timelines with non-overlapping date ranges
  - Aligned assignments and appreciations with actual work periods
  - Implemented progressive role advancement based on experience levels
- June 25, 2025. Refactored server architecture with modular structure
  - Split large routes.ts file into organized controllers and route modules
  - Created separate controllers for each domain (members, skills, analytics, etc.)
  - Implemented proper error handling middleware
  - Improved code maintainability and separation of concerns
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.