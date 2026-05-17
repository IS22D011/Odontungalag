import { Attendance, LeaveRequest } from '@/types';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const attendanceHistory: Attendance[] = [
  {
    id: 'att-1',
    userId: 'user-1',
    date: today,
    status: 'present',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  {
    id: 'att-2',
    userId: 'user-1',
    date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
    checkIn: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
    checkOut: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
    status: 'present',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  {
    id: 'att-3',
    userId: 'user-1',
    date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
    checkIn: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000),
    checkOut: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 17.5 * 60 * 60 * 1000),
    status: 'late',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    userId: 'user-1',
    startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000),
    reason: 'Vacation',
    status: 'approved',
    approvedBy: 'user-2',
  },
  {
    id: 'leave-2',
    userId: 'user-1',
    startDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
    reason: 'Personal',
    status: 'pending',
  },
];

export const stats = {
  totalLeaveDays: 20,
  usedLeaveDays: 8,
  pendingLeaves: 2,
  presentDays: 18,
  lateDays: 2,
  currentMonth: 'February',
};
