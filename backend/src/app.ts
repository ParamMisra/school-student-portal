import 'dotenv/config'; // ⚡ MUST BE LINE 1
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import classRoutes from './modules/classes/class.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import marksRoutes from './modules/marks/marks.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/classes', classRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/marks', marksRoutes); 
app.use('/api/attendance', attendanceRoutes); 
app.use('/api', analyticsRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'School Management System API is fully operational.' });
});

export default app;