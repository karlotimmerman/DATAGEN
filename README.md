# DATAGEN - AI Document Analysis System

DATAGEN is an advanced document analysis platform powered by AI agents. It allows users to upload documents for AI-powered analysis and visualization.

## System Architecture

- **Backend**: Python-based multi-agent system using LangChain and LangGraph with OpenAI LLMs
- **API Server**: FastAPI server that bridges the frontend with the backend agent system
- **Frontend**: Next.js application with TypeScript, shadcn/UI components, and built-in API routes

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/karlotimmerman/DATAGEN.git
   cd DATAGEN
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   # or if using pnpm
   pnpm install
   ```

### Running the Application

1. Start the FastAPI backend server:
   ```bash
   python api_server.py
   ```
   The API server will be available at http://localhost:8000

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   # or if using pnpm
   pnpm dev
   ```
   The frontend will be available at http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Upload documents for analysis
3. Provide analysis instructions
4. View real-time analysis progress and results

## Features

- Document upload and processing
- Real-time analysis progress tracking
- Interactive visualizations
- Code generation for data analysis
- Comprehensive analysis reports

## Development

### Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=ws://localhost:8000
```

#### Backend
Configure your OpenAI API key and other settings as needed.

### Project Structure

- `/frontend` - Next.js frontend application
- `/api_server.py` - FastAPI server
- `/main.py` - Multi-agent system implementation

## Deployment

### Production Build

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   # or if using pnpm
   pnpm build
   ```

2. For production deployment, consider using:
   - Docker containers
   - Nginx as a reverse proxy
   - PM2 for process management

## License

[MIT License](LICENSE)

## Acknowledgements

- [LangChain](https://github.com/langchain-ai/langchain)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
