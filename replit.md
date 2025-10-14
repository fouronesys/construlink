# Verified Construction Suppliers Platform

## Overview
This platform is a B2B directory for verified construction material and service suppliers in the Dominican Republic. Its primary purpose is to connect construction professionals with reliable suppliers, streamline procurement, and enhance transparency within the construction sector. Key capabilities include RNC validation, monthly subscription management, administrative approval workflows, a product-focused main page, pricing, category-based directory filtering, and a business claim functionality.

## Recent Changes

### October 14, 2025 - Supplier Dashboard Improvements Complete
Completed comprehensive supplier dashboard enhancement with 9 implementation phases:
- **Backend APIs**: Full CRUD endpoints for publications, advertisement requests, and banners with proper authentication and plan validation
- **Frontend Components**: Complete modal system for managing publications, requesting advertisements/banners, and uploading company logos
- **Integration**: React Query mutations with cache invalidation, Zod validation, toast notifications, and loading states
- **Image Upload System**: Multer-based file handling with type/size validation for logos and banner images
- **Testing**: 88 data-testid attributes throughout the interface for comprehensive UI testing
- **Quality**: All features tested and verified working without errors

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
-   **Supplier Dashboard**: Comprehensive management interface for suppliers featuring:
    - **Publications Management**: Create, edit, and delete supplier publications with image upload, category filtering, view count tracking, and pagination (plan limits enforced).
    - **Advertisement Requests**: Request paid advertisements for existing publications with duration and budget specification, pending admin approval.
    - **Banner Management**: Request promotional banners for desktop/tablet/mobile with custom images, titles, descriptions, and links (requires admin approval). Track banner performance metrics (clicks, impressions).
    - **Company Logo**: Upload, preview, and delete company logo with file validation (JPEG, PNG, WEBP up to 5MB).
    - Complete integration with React Query for real-time updates, Zod validation, toast notifications, and loading states.
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

### Performance Optimizations (Applied October 2025)
-   **Database Indexing**: Added 11 strategic indices on high-traffic columns:
    - Suppliers: status, location, isFeatured, averageRating, userId
    - Supplier Specialties: supplierId, specialty
    - Reviews: supplierId, rating, createdAt
    - Products: supplierId, category, isActive
    - Subscriptions: supplierId, status, plan
    - Payments: subscriptionId, status, paymentDate
-   **Query Optimization**: Refactored `updateSupplierRating` to use single SQL aggregation instead of fetching all reviews (O(n) → O(1))
-   **Caching Layer**: Implemented `SimpleCache` module with TTL-based in-memory caching:
    - Featured suppliers: 5 min TTL with invalidation on featured status toggles
    - Admin statistics: 1 min TTL for dashboard metrics
-   **React Optimization**: Applied React.memo to performance-critical components:
    - ProviderCard: Prevents re-renders in supplier lists
    - Navigation: Global component used across all pages

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