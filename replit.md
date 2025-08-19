# Overview

This is a full-stack web application built with a modern tech stack featuring React frontend and Python FastAPI backend. The application is an issue tracking or ticketing system with functionality for searching and displaying issue details, along with similar issue recommendations. It includes JWT-based authentication, comprehensive UI with modern design elements, and detailed issue management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2024)
- **Backend Migration**: Converted from Node.js/Express to Python FastAPI
- **UI Personalization**: Replaced "admin" with "Poovarasan" throughout the interface
- **Authentication**: Implemented JWT-based authentication with secure password hashing
- **UI Enhancements**: Added modern gradient backgrounds and improved visual design
- **Data Management**: Implemented data clearing functionality when fetching new issues
- **Production Ready**: Optimized for Replit deployment with proper error handling

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using TypeScript for type safety
- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Comprehensive component library based on shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture  
- **FastAPI**: Modern Python web framework with automatic API documentation
- **JWT Authentication**: Secure token-based authentication with bcrypt password hashing
- **Mock Data Storage**: In-memory data storage for issues and similar issue recommendations
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration
- **Static File Serving**: Integrated React app serving with fallback routing
- **API Structure**: All API routes prefixed with `/api`, with comprehensive error handling

## Data Storage
- **Mock Data**: In-memory storage for demonstration purposes
- **User Authentication**: Single user account (Poovarasan) with bcrypt-hashed password
- **Issue Data**: Mock issues with comprehensive metadata including status, priority, assignee, timestamps
- **Similar Issues**: Mock similar issues from Redmine and Mantis systems with contact information
- **JWT Tokens**: Secure token storage with 24-hour expiration

## Authentication & Authorization
- **JWT-based**: Secure token-based authentication system
- **Password Hashing**: bcrypt for secure password storage
- **Token Validation**: JWT middleware for protected API endpoints
- **User Management**: Single user system with personalized welcome message
- **Frontend Integration**: Automatic token management and login state persistence

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