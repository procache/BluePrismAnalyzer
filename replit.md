# Blue Prism Process Analyzer

## Overview

The Blue Prism Process Analyzer is a web application designed to analyze and visualize Blue Prism automation files (.bpprocess and .bpobject). It provides insights into process dependencies, VBO (Visual Business Object) usage, and automation structure to help developers and analysts understand complex automation workflows.

The application processes uploaded Blue Prism files, extracts metadata and structural information, and presents the results through interactive dashboards with search, filtering, and export capabilities. It serves as a tool for automation governance, documentation, and optimization.

## Recent Changes (August 2025)

### CSV Export Enhancements
- **Alphabetical action sorting**: Actions are now sorted alphabetically for each VBO in CSV exports
- **Streamlined columns**: Removed "Locations" column from CSV exports for cleaner data
- **Enhanced Excel compatibility**: Added UTF-8 BOM and Windows line endings for better autofit functionality
- **Improved encoding**: Better character encoding handling for international text

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React and TypeScript, using Vite as the build tool. The UI leverages shadcn/ui components for consistent design and Tailwind CSS for styling. The application uses a single-page architecture with wouter for client-side routing and TanStack Query for server state management.

Key architectural decisions:
- **Component-based UI**: Modular components for file upload, analysis results, and data visualization
- **Type-safe development**: Full TypeScript implementation with shared types between client and server
- **Modern React patterns**: Hooks-based components with proper state management
- **Responsive design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
The server is an Express.js application with TypeScript, following a layered architecture pattern. It handles file uploads, XML parsing, and data persistence through a clean separation of concerns.

Key architectural decisions:
- **Middleware-based request handling**: Express middleware for logging, file uploads, and error handling
- **Storage abstraction**: Interface-based storage layer allowing for different database implementations
- **Type-safe API**: Shared schema definitions between client and server
- **Streaming file processing**: Efficient handling of large Blue Prism files using multer

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema is designed to store both process analysis and VBO analysis results with flexible JSON fields for complex nested data.

Key architectural decisions:
- **Relational database**: PostgreSQL for ACID compliance and complex queries
- **Type-safe ORM**: Drizzle provides compile-time type checking and migration management
- **JSON storage**: Complex nested data structures stored as JSON for flexibility
- **Schema versioning**: Drizzle migrations for database evolution

### Authentication and Authorization
Currently, the application operates without authentication mechanisms, designed for internal tool usage. All uploaded files and analysis results are accessible to any user of the application.

### External Dependencies

**Database Services:**
- PostgreSQL database (configured via DATABASE_URL environment variable)
- Neon Database serverless PostgreSQL for cloud deployment

**File Processing:**
- multer for handling multipart file uploads
- xml2js for parsing Blue Prism XML files
- Support for .bpprocess and .bpobject file formats

**UI Framework:**
- Radix UI primitives for accessible component foundations
- shadcn/ui component library for consistent design system
- Tailwind CSS for utility-first styling

**Development Tools:**
- Vite for fast development and optimized builds
- tsx for TypeScript execution in development
- esbuild for production server bundling

**Third-party Integrations:**
- react-dropzone for drag-and-drop file uploads
- date-fns for date formatting and manipulation
- Lucide React for consistent iconography

The application is designed to be self-contained with minimal external service dependencies, making it suitable for internal deployment environments.