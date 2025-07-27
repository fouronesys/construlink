# Verified Construction Suppliers Platform

## Overview
This is a B2B directory platform for verified construction material and service suppliers in the Dominican Republic. The system features RNC validation through DGII, monthly subscription management via Verifone, and administrative approval workflows. Built with React/TypeScript frontend, Express backend, and PostgreSQL with Drizzle ORM.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit OpenID Connect with session-based auth
- **Payment Processing**: Verifone for subscription management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle with schema migrations
- **Connection**: Connection pooling with @neondatabase/serverless
- **Schema Location**: Shared schema definition in `/shared/schema.ts`

## Key Components

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL
- **Role-Based Access**: Four roles (client, supplier, admin, superadmin)
- **Authorization Middleware**: Custom middleware for route protection

### Supplier Management
- **Registration Flow**: Multi-step process with RNC validation
- **Verification System**: Admin approval workflow with document review
- **Status Management**: Pending, approved, suspended, rejected states
- **Subscription Integration**: Verifone recurring billing at RD$1000/month

### Payment System
- **Provider**: Verifone with webhook integration
- **Subscription Model**: Monthly recurring payments
- **Trial Period**: 7-day trial period
- **Currency**: Dominican Peso (DOP) at RD$1000

### External Integrations
- **RNC Validation**: DGII validation via fouronerncvalidator.onrender.com
- **Payment Gateway**: Verifone for payment processing
- **Email Notifications**: Automated status updates for suppliers

## Data Flow

### Supplier Registration
1. User completes registration form with company details
2. System validates RNC through external DGII API
3. Payment setup through Verifone integration
4. Administrative review queue populated
5. Admin approval/rejection with email notifications
6. Approved suppliers appear in public directory

### Quote Request Process
1. Clients browse verified supplier directory
2. Filter by specialty, location, and ratings
3. Submit quote requests through contact forms
4. Suppliers receive notifications in dashboard
5. Direct communication facilitated between parties

### Subscription Management
1. Monthly billing cycle through Verifone
2. Automatic suspension for failed payments
3. Renewal notifications and grace periods
4. Admin override capabilities for special cases

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection
- **verifone**: Payment processing
- **drizzle-orm**: Database ORM
- **express**: Web server framework
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite dev server with HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, STRIPE keys, session secrets

### Production Build
- **Frontend**: Vite production build to `/dist/public`
- **Backend**: ESBuild compilation to `/dist/index.js`
- **Static Assets**: Served by Express in production mode
- **Database**: Drizzle migrations via `npm run db:push`

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string
- **VERIFONE_API_KEY**: Server-side Verifone integration
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Authentication domain configuration

### Hosting Considerations
- Platform designed for Replit deployment
- Uses Replit-specific authentication and banner integration
- WebSocket support required for database connections
- Static file serving handled by Express middleware