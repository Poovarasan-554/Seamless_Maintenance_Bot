# Overview

This is a full-stack web application built with a modern tech stack featuring React frontend and Express.js backend. The application appears to be an issue tracking or ticketing system with functionality for searching and displaying issue details, along with similar issue recommendations. It uses a PostgreSQL database with Drizzle ORM for data management and includes a comprehensive UI component library based on shadcn/ui.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using TypeScript for type safety
- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Comprehensive component library based on shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture  
- **Express.js**: RESTful API server with TypeScript
- **Storage Layer**: Abstracted storage interface with in-memory implementation (MemStorage) that can be easily swapped for database implementation
- **Session Management**: PostgreSQL session store using connect-pg-simple
- **Development**: Hot reload with tsx, production builds with esbuild
- **API Structure**: All API routes prefixed with `/api`, with request/response logging middleware

## Data Storage
- **Database**: PostgreSQL with Neon serverless driver (@neondatabase/serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Centralized schema definition in shared folder with automatic TypeScript type generation
- **Migrations**: Database migrations managed through drizzle-kit
- **Current Schema**: User table with id, username, and password fields

## Authentication & Authorization
- **Session-based**: Uses PostgreSQL session store for persistent sessions
- **User Management**: Basic user model with username/password authentication
- **Validation**: Zod integration with Drizzle for runtime type validation

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **express**: Web application framework
- **react**: Frontend UI library
- **@tanstack/react-query**: Server state management

## UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library

## Development Tools
- **vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development debugging tools

## Form & Data Handling
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation
- **date-fns**: Date manipulation utilities

## Session & Storage
- **connect-pg-simple**: PostgreSQL session store for Express