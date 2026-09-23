// backend/src/app.ts
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

// ⚡ ADD /api PREFIX TO ALL ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/classes', classRoutes);
app.use('/api', timetableRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', marksRoutes);
app.use('/api', analyticsRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'School Management System API is fully operational.' });
});

export default app;