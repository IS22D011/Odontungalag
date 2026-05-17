export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type UserRole = "admin" | "manager" | "employee";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "late" | "on_leave" | "absent";
export type AttendanceMethod = "gps" | "qr";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  jobTitle: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  createdBy: string;
  dueDate: Date;
  projectId: string;
  comments: Comment[];
  attachments: string[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  type: "group" | "direct";
  participants: string[];
  lastMessage?: Message;
  avatar?: string;
  unreadCount: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: string;
  url: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  method?: AttendanceMethod;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  qrCodeId?: string;
}

export interface LocationVerification {
  isValid: boolean;
  distance?: number;
  message: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface OfficeLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
}
