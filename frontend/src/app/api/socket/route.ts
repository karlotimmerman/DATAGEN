import { Server } from 'socket.io';

import { AnalysisJob } from '@/types/analysis';

import { getJobById } from '@/lib/data/jobs';
import { logger } from '@/lib/logger';

// Store for active connections
const connectedClients = new Map();

// Only create the WebSocket server once
let wsServer: Server;

function initWebSocketServer() {
  // Check if server is already initialized
  if (wsServer) return wsServer;

  wsServer = new Server({
    path: '/api/socket',
    transports: ['websocket'],
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Setup event handlers
  wsServer.on('connection', (socket) => {
    logger.info('Client connected to WebSocket', { socketId: socket.id });

    // Join a specific job's room
    socket.on('join', (jobId: string) => {
      socket.join(jobId);
      connectedClients.set(socket.id, { jobId });
      logger.info('Client joined job room', { socketId: socket.id, jobId });

      // Send the current job status
      getJobById(jobId)
        .then((job) => {
          if (job) {
            socket.emit('job_update', job);
          }
        })
        .catch((error) => {
          logger.error('Error fetching job data for socket', { jobId, error });
        });
    });

    // Leave a specific job's room
    socket.on('leave', (jobId: string) => {
      socket.leave(jobId);
      logger.info('Client left job room', { socketId: socket.id, jobId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      connectedClients.delete(socket.id);
      logger.info('Client disconnected from WebSocket', { socketId: socket.id });
    });
  });

  return wsServer;
}

// Function to emit updates to all clients watching a specific job
export function emitJobUpdate(jobId: string, update: AnalysisJob) {
  if (!wsServer) initWebSocketServer();

  wsServer.to(jobId).emit('job_update', update);
  logger.debug('Emitted job update to clients', { jobId });
}

// WebSocket route handler
export async function GET() {
  // Initialize the WebSocket server if not already done
  initWebSocketServer();

  // Just a placeholder response - actual WebSocket handling is done by the server
  return new Response('WebSocket endpoint active', { status: 200 });
}
