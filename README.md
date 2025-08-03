# Blue Prism Process Analyzer

A powerful web application for analyzing and visualizing Blue Prism automation files (.bpprocess and .bpobject), providing insights into process dependencies, VBO usage, and automation structure.

## Features

### 🔍 Process Analysis
- **File Upload**: Drag-and-drop support for .bpprocess and .bpobject files
- **XML Parsing**: Comprehensive extraction of Blue Prism metadata and structure
- **Dependency Mapping**: Hierarchical visualization of VBO dependencies and actions
- **Process Flow Analysis**: Detailed breakdown of automation workflows

### 📊 Data Visualization
- **Interactive Dashboards**: Clean, responsive interface for exploring analysis results
- **Search & Filter**: Find specific VBOs, actions, and dependencies quickly
- **Sortable Tables**: Alphabetically organized data for easy navigation
- **Usage Statistics**: Track action usage counts and frequency

### 📁 Export Capabilities
- **CSV Export**: Download analysis results with optimized Excel compatibility
- **Alphabetical Sorting**: Actions automatically sorted for each VBO
- **Clean Data Format**: Streamlined columns (Business Object, Action, Usage Count)
- **Auto-fit Support**: UTF-8 BOM and Windows line endings for proper column sizing

### 📱 Modern Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Built-in theme switching capability
- **Accessible Components**: Built with Radix UI primitives for screen reader support
- **Professional Styling**: Clean Blue Prism-themed design system

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent, accessible components
- **TanStack Query** for efficient server state management
- **Wouter** for lightweight client-side routing

### Backend
- **Express.js** with TypeScript for robust server architecture
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **Multer** for handling file uploads
- **xml2js** for Blue Prism XML parsing

### Development Tools
- **Drizzle Kit** for database migrations
- **tsx** for TypeScript execution
- **ESBuild** for production bundling

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/blue-prism-analyzer.git
   cd blue-prism-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database connection string
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Docker Setup (Optional)

```bash
docker-compose up -d
```

## Usage

1. **Upload Files**: Drag and drop your .bpprocess or .bpobject files onto the upload area
2. **View Analysis**: Explore the generated dependency maps and action breakdowns
3. **Search & Filter**: Use the search functionality to find specific VBOs or actions
4. **Export Data**: Download your analysis results as CSV files for further processing

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-specific page components
│   │   ├── lib/            # Utility functions and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express.js backend
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database abstraction layer
│   └── index.ts            # Server entry point
├── shared/                 # Shared TypeScript types and schemas
│   └── schema.ts           # Database and API type definitions
└── drizzle/                # Database migrations and configuration
```

## API Endpoints

- `POST /api/analyze` - Upload and analyze Blue Prism files
- `GET /api/analyses` - Retrieve all previous analyses
- `GET /api/analyses/:id` - Get specific analysis by ID
- `DELETE /api/analyses/:id` - Delete an analysis

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Database Schema

The application uses PostgreSQL with the following main tables:
- `process_analyses` - Stores Blue Prism process analysis results
- `vbo_analyses` - Stores Visual Business Object analysis data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the project wiki for detailed guides

## Roadmap

- [ ] Batch file processing
- [ ] Advanced filtering options
- [ ] Process flow visualization diagrams
- [ ] Integration with Blue Prism APIs
- [ ] Role-based access control
- [ ] Advanced reporting features