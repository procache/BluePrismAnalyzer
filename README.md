# Blue Prism Dependency Explorer

A comprehensive web application for analyzing and visualizing Blue Prism automation files (.bpprocess and .bpobject), providing detailed insights into process dependencies, VBO usage patterns, automation structure, and Application Modeller element hierarchies.

## Features

### 🔍 Multi-Format Analysis
- **Process File Analysis (.bpprocess)**: Extract process dependencies, VBO usage, and workflow structure
- **VBO File Analysis (.bpobject)**: Analyze Application Modeller elements, actions, and object structure
- **Unified Upload Interface**: Single drag-and-drop interface supporting both file types
- **Large File Support**: Handle files up to 50MB with efficient memory management
- **XML Parsing**: Robust XML parsing with comprehensive error handling

### 📊 Advanced Visualization
- **Interactive Dashboards**: Clean, responsive interface with collapsible sections
- **Hierarchical Data Display**: Tree-like visualization of VBO dependencies and action relationships
- **Search & Filter**: Real-time filtering across VBOs, actions, and elements
- **Usage Analytics**: Track action usage counts, locations, and frequency patterns
- **Element Structure Mapping**: Detailed breakdown of Application Modeller hierarchies

### 📁 Export & Data Management
- **Optimized CSV Export**: Excel-compatible exports with UTF-8 BOM encoding
- **Alphabetical Action Sorting**: Automatically sorted data for consistent organization
- **Streamlined Data Format**: Clean columns focusing on Business Object, Action, and Usage Count
- **Analysis History**: Persistent storage of all analysis results with PostgreSQL backend
- **Detailed Analysis Pages**: Individual analysis views with comprehensive metadata

### 📱 Modern User Experience
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Professional Blue Prism Theming**: Custom color scheme matching Blue Prism branding
- **Accessible Components**: WCAG-compliant interface using Radix UI primitives
- **Loading States**: Progress indicators and skeleton screens during file processing
- **Error Handling**: Comprehensive error messages with actionable guidance

## Technology Stack

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Vite** for lightning-fast development and optimized production builds
- **Tailwind CSS** with custom Blue Prism theming for consistent styling
- **shadcn/ui** component library built on Radix UI primitives for accessibility
- **TanStack Query (v5)** for sophisticated server state management and caching
- **Wouter** for lightweight, hook-based client-side routing
- **React Hook Form** with Zod validation for robust form handling

### Backend Architecture
- **Express.js** with TypeScript for scalable server-side architecture
- **PostgreSQL** database with Drizzle ORM for type-safe operations
- **Multer** for efficient multipart file upload handling (50MB limit)
- **xml2js** for comprehensive Blue Prism XML parsing and validation
- **Zod** schemas for runtime type validation and API contract enforcement

### Development & Build Tools
- **Drizzle Kit** for database schema migrations and management
- **tsx** for TypeScript execution in development environment
- **ESBuild** for optimized production server bundling
- **PostCSS** with Tailwind CSS for advanced styling capabilities

## Getting Started

### Prerequisites
- **Node.js 18+** (recommended: Node.js 20)
- **PostgreSQL database** (local installation or cloud service like Neon)
- **Git** for version control

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blue-prism-dependency-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Database Connection**
   ```bash
   # Set your PostgreSQL connection string
   export DATABASE_URL="postgresql://username:password@localhost:5432/blue_prism_analyzer"
   
   # For Replit deployment, the DATABASE_URL is automatically provided
   ```

4. **Initialize database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Usage Guide

### Analyzing Blue Prism Files

1. **Upload Files**: 
   - Drag and drop .bpprocess or .bpobject files onto the unified upload area
   - Files up to 50MB are supported
   - The system automatically detects file type and applies appropriate parsing

2. **Process Analysis (.bpprocess files)**:
   - View hierarchical VBO dependencies and their usage locations
   - Explore action breakdowns with usage counts and descriptions
   - Navigate through process stages and subsheet relationships
   - Search and filter across all VBOs and actions

3. **VBO Analysis (.bpobject files)**:
   - Examine Application Modeller element hierarchies
   - Review action definitions with input/output parameters
   - Analyze element structures and their relationships
   - Explore VBO metadata including version and narrative information

4. **Data Management**:
   - **Export to CSV**: Download analysis results with Excel-optimized formatting
   - **View History**: Access all previous analyses through the History page
   - **Detailed Views**: Click on individual analyses for comprehensive breakdowns
   - **Search Functionality**: Use real-time search to find specific elements across large files

## Project Structure

```
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── ui/            # shadcn/ui component library
│   │   │   ├── analysis-results.tsx      # Process analysis display
│   │   │   ├── vbo-analysis-results.tsx  # VBO analysis display
│   │   │   ├── unified-upload.tsx        # File upload interface
│   │   │   └── file-upload.tsx           # Base upload component
│   │   ├── pages/             # Route-Specific Page Components
│   │   │   ├── home.tsx       # Main upload and analysis page
│   │   │   ├── history.tsx    # Analysis history listing
│   │   │   ├── analysis-detail.tsx  # Individual analysis view
│   │   │   └── not-found.tsx  # 404 error page
│   │   ├── lib/               # Utility Functions & Configurations
│   │   │   ├── bp-parser.ts   # Blue Prism .bpprocess parsing logic
│   │   │   ├── vbo-parser.ts  # Blue Prism .bpobject parsing logic
│   │   │   ├── queryClient.ts # TanStack Query configuration
│   │   │   └── utils.ts       # General utility functions
│   │   └── hooks/             # Custom React Hooks
│   │       ├── use-toast.ts   # Toast notification hook
│   │       └── use-mobile.tsx # Mobile responsive hook
├── server/                     # Express.js Backend
│   ├── routes.ts              # API endpoint definitions
│   ├── storage.ts             # Database abstraction layer
│   ├── db.ts                  # Database connection setup
│   ├── index.ts               # Server entry point
│   └── vite.ts                # Vite development server integration
├── shared/                     # Shared TypeScript Definitions
│   └── schema.ts              # Database schemas and API types
├── attached_assets/           # Sample Blue Prism Files
│   ├── *.bpprocess           # Example process files
│   └── *.bpobject            # Example VBO files
├── components.json            # shadcn/ui configuration
├── drizzle.config.ts         # Database ORM configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── vite.config.ts            # Vite build configuration
└── package.json              # Dependencies and build scripts
```

## API Endpoints

### Process Analysis
- `POST /api/analyze` - Upload and analyze .bpprocess files
- `GET /api/analyses` - Retrieve all process analysis records
- `GET /api/analyses/:id` - Get specific process analysis by ID

### VBO Analysis  
- `POST /api/analyze-vbo` - Upload and analyze .bpobject files
- `GET /api/vbo-analyses` - Retrieve all VBO analysis records
- `GET /api/vbo-analyses/:id` - Get specific VBO analysis by ID

### File Processing
- Maximum file size: 50MB
- Supported formats: .bpprocess, .bpobject
- Content-Type: multipart/form-data
- Response format: JSON with comprehensive analysis data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Database Schema

The application uses PostgreSQL with Drizzle ORM for type-safe database operations:

### Process Analyses Table (`process_analyses`)
- `id` - Primary key (serial)
- `fileName` - Original uploaded file name
- `fileSize` - File size in bytes
- `processName` - Extracted Blue Prism process name
- `totalStages` - Number of process stages
- `vboCount` - Count of unique VBOs used
- `actionCount` - Total number of actions across all VBOs
- `subsheetCount` - Number of process subsheets
- `dependencies` - JSON object containing hierarchical VBO and action data

### VBO Analyses Table (`vbo_analyses`)
- `id` - Primary key (serial)
- `fileName` - Original uploaded file name
- `fileSize` - File size in bytes
- `vboName` - Visual Business Object name
- `version` - VBO version information
- `narrative` - VBO description/documentation
- `actionCount` - Number of actions defined in the VBO
- `elementCount` - Count of Application Modeller elements
- `actions` - JSON array of action definitions with inputs/outputs
- `elements` - JSON object containing hierarchical element structure

### Data Types
- Shared TypeScript schemas ensure type safety between frontend and backend
- JSON columns store complex nested structures for flexible data representation
- Zod validation schemas provide runtime type checking for API endpoints

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the project wiki for detailed guides

## Features in Development

### Planned Enhancements
- **Batch File Processing**: Upload and analyze multiple Blue Prism files simultaneously
- **Advanced Visualization**: Interactive process flow diagrams and dependency graphs  
- **Enhanced Search**: Advanced filtering with regex support and cross-file search
- **Export Options**: Additional formats including JSON, XML, and detailed reports
- **Performance Optimization**: Improved handling of very large files (100MB+)

### Future Integrations
- **Blue Prism API Connectivity**: Direct integration with Blue Prism environments
- **Version Comparison**: Compare different versions of processes and VBOs
- **Dependency Tracking**: Cross-process dependency analysis and impact assessment
- **Collaboration Features**: Team sharing and annotation capabilities

## Recent Updates

### Version 2.0 (August 2025)
- ✅ **Unified File Upload**: Single interface supporting both .bpprocess and .bpobject files
- ✅ **VBO Analysis**: Complete Application Modeller element analysis
- ✅ **Enhanced CSV Export**: Improved Excel compatibility with UTF-8 BOM
- ✅ **Responsive Design**: Mobile-optimized interface with collapsible sections
- ✅ **PostgreSQL Integration**: Persistent storage with comprehensive history tracking
- ✅ **Type-Safe Architecture**: Full TypeScript implementation with shared schemas