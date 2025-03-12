# DATAGEN Frontend

This application provides a web interface for the DATAGEN multi-agent analysis system. It allows users to upload documents for analysis, view real-time processing progress, and explore the results through visualizations and reports.

## Features

- Document upload and analysis
- Real-time progress tracking with WebSockets
- Visualization of analysis results
- Code and report viewing
- Dark/light mode support

## Setup

1. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

2. Set up environment variables:

   - Copy `.env.local.example` to `.env.local`
   - Adjust settings as needed

3. Run the development server:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app`: Next.js app router pages
- `src/components`: React components
- `src/lib`: Utility functions and services
- `src/hooks`: Custom React hooks
- `src/types`: TypeScript type definitions

## API Routes

- `POST /api/analysis`: Start a new analysis
- `GET /api/analysis`: List all analyses
- `GET /api/analysis/[id]`: Get details of a specific analysis
- `PATCH /api/analysis/[id]`: Update an analysis (internal)
- `DELETE /api/analysis/[id]`: Cancel/delete an analysis
- `GET /api/socket`: WebSocket endpoint for real-time updates

## WebSocket Events

- `job_update`: Sent when a job's status changes
- `agent_message`: Sent when an agent sends a new message

## Environment Variables

| Variable                   | Description                             | Default                 |
| -------------------------- | --------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for API requests               | `http://localhost:3000` |
| `NEXT_PUBLIC_SOCKET_URL`   | URL for WebSocket connections           | `http://localhost:3000` |
| `UPLOADS_DIR`              | Directory for uploaded files            | `./data/uploads`        |
| `JOBS_DIR`                 | Directory for job data                  | `./data/jobs`           |
| `DATAGEN_SCRIPT_PATH`      | Path to the Python script               | `../main.py`            |
| `DATAGEN_WORKING_DIR`      | Working directory for the Python script | `../`                   |

## Deployment

This application can be deployed using Vercel, Docker, or any other Next.js-compatible hosting service.

For production deployment, make sure to set the appropriate environment variables.
