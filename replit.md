# Overview

This is a Blue Prism analysis tool that provides automated analysis and visualization of Blue Prism automation files. The application allows users to upload and analyze three types of Blue Prism files: process files (.bpprocess), VBO (Visual Business Object) files (.bpobject), and release files (.bprelease). It extracts key metrics, dependencies, and structural information from these files, presenting the data through interactive dashboards and detailed reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 18 with TypeScript, using Vite as the build tool and development server. The frontend follows a component-based architecture with React Router (wouter) for client-side routing.

**UI Framework**: Utilizes shadcn/ui components built on top of Radix UI primitives, providing a consistent design system. Tailwind CSS handles styling with a custom color palette that includes Blue Prism-specific brand colors.

**State Management**: Uses TanStack Query (React Query) for server state management, caching, and data synchronization. Local component state is managed with React's useState and useEffect hooks.

**File Structure**: Organized into logical directories:
- `/pages` - Route-level components for different application views
- `/components` - Reusable UI components including specialized analysis result displays
- `/lib` - Utility functions, API client, and parsing logic
- `/hooks` - Custom React hooks for shared functionality

## Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js. The server handles file uploads, XML parsing, and data persistence.

**File Processing**: Implements dedicated parsers for each Blue Prism file type using xml2js for XML parsing. Multer handles multipart file uploads with memory storage and file type validation.

**API Design**: RESTful API structure with endpoints for file upload/analysis and data retrieval. Includes proper error handling and response formatting.

**Data Processing Pipeline**: 
1. File validation and type detection
2. XML parsing and data extraction
3. Dependency analysis and relationship mapping
4. Data transformation and storage
5. Response generation with structured analysis results

## Data Storage Solutions

**Database**: PostgreSQL with Neon serverless for scalability and managed infrastructure.

**ORM**: Drizzle ORM provides type-safe database operations and schema management. Database schema is centrally defined in `/shared/schema.ts` and includes tables for process analyses, VBO analyses, and release analyses.

**Data Models**: Structured schemas for:
- Process analyses (stages, dependencies, VBO usage)
- VBO analyses (actions, elements, metadata)
- Release analyses (packages, contained processes and VBOs)

**Migration Strategy**: Uses Drizzle Kit for database migrations and schema changes.

## Authentication and Authorization

Currently implements a stateless architecture without explicit authentication mechanisms. The application is designed for internal use with file-based analysis workflows.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling via `@neondatabase/serverless`

## UI Component Libraries
- **Radix UI**: Comprehensive set of low-level UI primitives for accessibility and functionality
- **shadcn/ui**: Pre-built component library built on Radix UI with consistent styling
- **Lucide React**: Icon library providing consistent iconography

## Development and Build Tools
- **Vite**: Modern build tool and development server with hot module replacement
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first CSS framework for styling
- **PostCSS**: CSS processing pipeline with autoprefixer

## Data Processing Libraries
- **xml2js**: XML parsing for Blue Prism file analysis
- **date-fns**: Date manipulation and formatting utilities
- **react-dropzone**: Drag-and-drop file upload functionality

## State Management and API
- **TanStack Query**: Server state management, caching, and synchronization
- **Zod**: Runtime type validation and schema parsing

## File Upload and Processing
- **Multer**: Middleware for handling multipart/form-data file uploads
- **ws**: WebSocket implementation for Neon database connections

The application follows modern web development practices with a focus on type safety, component reusability, and efficient data processing for Blue Prism automation analysis workflows.