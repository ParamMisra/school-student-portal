import 'dotenv/config'; // ⚡ MUST BE LINE 1 (Before importing app or modules)
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { connectDatabase } from './config/db';
import { startBulkUploadWorker } from './modules/admin/admin.worker';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.IO Server
export const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173', // Adjust this to match your frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// Socket.IO Connection Listener
io.on('connection', (socket) => {
  console.log(`⚡ New Socket.IO client connected: ${socket.id}`);

  // Handle client joining user-specific or role-specific rooms
  socket.on('joinRoom', (roomName: string) => {
    socket.join(roomName);
    console.log(`👤 Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket.IO client disconnected: ${socket.id}`);
  });
});

// Start Server, DB Connection, and Workers
const startServer = async () => {
  await connectDatabase();
  
  // Start BullMQ background worker listener
  startBulkUploadWorker();

  server.listen(PORT, () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
  });
};

startServer();