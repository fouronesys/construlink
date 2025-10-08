# Verified Construction Suppliers Platform

## Overview
This is a B2B directory platform for verified construction material and service suppliers in the Dominican Republic. It features RNC validation, monthly subscription management, and administrative approval workflows. The platform aims to connect construction professionals with reliable suppliers, streamline procurement, and enhance transparency in the construction sector. It includes a product-focused main page, a pricing section, category-based directory filtering, and a business claim functionality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Responsiveness**: Fully responsive for mobile phones and tablets.

### Technical Implementations
- **Backend**: Node.js with Express.js
- **Database ORM**: Drizzle ORM for type-safe PostgreSQL operations
- **Authentication**: Replit OpenID Connect with session-based authentication (PostgreSQL-backed)
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Deployment**: Optimized for Replit deployment with multi-stage Docker builds for CapRover.

### Feature Specifications
- **Authentication & Authorization**: Replit Auth, session management, and role-based access (client, supplier, admin, superadmin).
- **Supplier Management**: Unified registration, tiered subscription plans (Basic, Professional, Enterprise) with real-time usage validation, administrative verification workflow, and status management (pending, approved, suspended, rejected).
- **Payment System**: Multi-gateway support with Azul (primary) and Verifone for monthly recurring payments, 7-day trial period, and Dominican Peso (DOP) currency. Schema supports multiple payment gateways with explicit gateway identification. Includes a comprehensive admin panel for payment, refund, and invoice management with fiscal compliance (NCF, ITBIS calculation). **Status**: Fase 1 completada (schema preparado para Azul).
- **Business Claim System**: Allows users to claim ownership of existing company listings through an admin-approved workflow, leading to ownership transfer and role upgrade.
- **Admin Panel**: Features include banner management, analytics dashboard (clicks, impressions, CTR with charts and CSV export), user management (role and status), and audit logging.
- **Quote Request Process**: Clients can browse and filter suppliers to submit quote requests, with notifications for suppliers.

### System Design Choices
- **Database**: PostgreSQL (via Neon serverless) with Drizzle ORM for schema management and connection pooling.
- **Shared Schema**: Centralized database schema definition.
- **Modular Architecture**: Clear separation between frontend and backend.
- **Robust Validation**: Zod used for all form and API validations.

## Recent Changes (2025-10-08)

### Sistema de Pagos con Azul - Fase 1 Completada ✅
- **Schema actualizado** para soportar múltiples gateways de pago (Azul, Verifone, Manual)
- **Nueva tabla** `paymentGatewayConfig` para almacenar credenciales de diferentes gateways
- **Campos genéricos** agregados: `paymentGateway`, `gatewayTransactionId`, `gatewayAuthCode`, etc.
- **Compatibilidad** mantenida con campos legacy de Verifone
- **Archivo de configuración** `shared/azul-config.ts` con tipos, constantes y helpers para Azul
- **Próximos pasos**: Fase 2 - Integración con Azul Payment Gateway API

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection
- **azul**: Payment gateway (República Dominicana - Banco Popular) - En implementación
- **verifone**: Payment processing (legacy support)
- **drizzle-orm**: Database ORM
- **express**: Web server framework
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **DGII Validation**: fouronerncvalidator.onrender.com for RNC validation