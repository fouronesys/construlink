# Verified Construction Suppliers Platform

## Overview
This platform is a B2B directory for verified construction material and service suppliers in the Dominican Republic. Its primary purpose is to connect construction professionals with reliable suppliers, streamline procurement, and enhance transparency within the construction sector. Key capabilities include RNC validation, monthly subscription management, administrative approval workflows, a product-focused main page, pricing, category-based directory filtering, and a business claim functionality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
-   **Framework**: React 18 with TypeScript
-   **UI Components**: Shadcn/UI built with Radix UI primitives
-   **Styling**: TailwindCSS, utilizing CSS variables for theming
-   **Forms**: React Hook Form with Zod for validation
-   **Responsiveness**: Fully responsive design for mobile and tablet devices.

### Technical Implementations
-   **Backend**: Node.js with Express.js
-   **Database ORM**: Drizzle ORM for type-safe PostgreSQL interactions
-   **Authentication**: Replit OpenID Connect with session-based authentication (PostgreSQL-backed)
-   **State Management**: TanStack Query for server state management
-   **Routing**: Wouter for client-side routing
-   **Deployment**: Optimized for Replit deployment, with multi-stage Docker builds for CapRover.

### Feature Specifications
-   **Authentication & Authorization**: Includes Replit Auth, session management, and role-based access for clients, suppliers, admins, and superadmins.
-   **Supplier Management**: Features unified registration, tiered subscription plans (Basic, Professional, Enterprise) with real-time usage validation, an administrative verification workflow, and status management (pending, approved, suspended, rejected).
-   **Payment System**: Supports multiple gateways (Azul, Verifone) for recurring monthly payments in Dominican Pesos (DOP). Includes flexible trial periods, automatic invoice generation with NCF, ITBIS tax calculation (18%), fiscal reports for DGII, and PDF generation. An admin panel manages payments, refunds, NCFs, and fiscal compliance.
-   **Business Claim System**: Enables users to claim existing company listings, with ownership transfer and role upgrades upon admin approval.
-   **Admin Panel**: Provides banner management, an analytics dashboard (clicks, impressions, CTR with charts and CSV export), user management (role and status), and audit logging.
-   **Quote Request Process**: Allows clients to browse, filter suppliers, and submit quote requests, with notifications sent to relevant suppliers.
-   **Semantic Search System**: Utilizes Hugging Face Inference API for generating and storing 384-dimensional embeddings (combining legal name, description, specialties, and location) for suppliers. Features automatic embedding generation upon app start, new supplier registration, and approval. Semantic search API endpoint uses cosine similarity for relevance ranking, displayed in a CommandDialog with grouped relevance levels.

### System Design Choices
-   **Database**: PostgreSQL (via Neon serverless) managed with Drizzle ORM for schema and connection pooling.
-   **Shared Schema**: Centralized database schema definition ensures consistency.
-   **Modular Architecture**: Promotes clear separation between frontend and backend concerns.
-   **Robust Validation**: Zod is used comprehensively for all form and API data validations.
-   **Security**: Conditional SSL/TLS configuration for development vs. production environments, robust session configuration with mandatory `SESSION_SECRET`, `secure: true` cookies in production, `sameSite: 'lax'` for CSRF protection, and `httpOnly: true` for XSS protection.

## External Dependencies

-   **@neondatabase/serverless**: For PostgreSQL database connection.
-   **azul**: Payment gateway integration for the Dominican Republic (Banco Popular).
-   **verifone**: Payment processing (for legacy support).
-   **pdfkit**: Used for generating PDF invoices with fiscal data.
-   **drizzle-orm**: The chosen ORM for database interactions.
-   **express**: The web server framework for the backend.
-   **@tanstack/react-query**: For managing server state in the frontend.
-   **@radix-ui/react-\***: Provides accessible UI primitives for component building.
-   **tailwindcss**: The utility-first CSS framework for styling.
-   **react-hook-form**: For efficient form handling.
-   **zod**: For robust schema validation throughout the application.
-   **fouronerncvalidator.onrender.com**: External service for RNC validation.
-   **Hugging Face Inference API**: For generating semantic embeddings for search functionality.