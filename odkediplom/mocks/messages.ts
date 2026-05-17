import { Conversation, Message } from "@/types";

const now = new Date();

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    name: "Engineering Team",
    type: "group",
    participants: ["user-1", "user-2", "user-3"],
    avatar: undefined,
    unreadCount: 3,
    lastMessage: {
      id: "msg-1",
      senderId: "user-2",
      text: "Great work on the latest sprint!",
      createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      read: false,
    },
  },
  {
    id: "conv-2",
    name: "Sarah Chen",
    type: "direct",
    participants: ["user-1", "user-2"],
    avatar: "https://i.pravatar.cc/150?img=5",
    unreadCount: 1,
    lastMessage: {
      id: "msg-2",
      senderId: "user-2",
      text: "Can you review the design mockups?",
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      read: false,
    },
  },
  {
    id: "conv-3",
    name: "Michael Torres",
    type: "direct",
    participants: ["user-1", "user-3"],
    avatar: "https://i.pravatar.cc/150?img=8",
    unreadCount: 0,
    lastMessage: {
      id: "msg-3",
      senderId: "user-1",
      text: "Thanks for the help!",
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: true,
    },
  },
  {
    id: "conv-4",
    name: "Design Team",
    type: "group",
    participants: ["user-1", "user-4"],
    avatar: undefined,
    unreadCount: 0,
    lastMessage: {
      id: "msg-4",
      senderId: "user-4",
      text: "New designs are ready for review",
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      read: true,
    },
  },
  {
    id: "conv-5",
    name: "Company Announcements",
    type: "group",
    participants: ["user-1", "user-2", "user-3", "user-4", "user-5"],
    avatar: undefined,
    unreadCount: 0,
    lastMessage: {
      id: "msg-5",
      senderId: "user-2",
      text: "Team lunch this Friday at 12pm!",
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      read: true,
    },
  },
];

export const messageHistory: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1-1",
      senderId: "user-3",
      text: "Has anyone tested the new feature?",
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      read: true,
    },
    {
      id: "msg-1-2",
      senderId: "user-1",
      text: "Yes, I tested it yesterday. Works great!",
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      read: true,
    },
    {
      id: "msg-1-3",
      senderId: "user-2",
      text: "Great work on the latest sprint!",
      createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      read: false,
    },
  ],
  "conv-2": [
    {
      id: "msg-2-1",
      senderId: "user-2",
      text: "Hey Alex, do you have a moment?",
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "msg-2-2",
      senderId: "user-1",
      text: "Sure, what's up?",
      createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      read: true,
    },
    {
      id: "msg-2-3",
      senderId: "user-2",
      text: "Орой уух юм уу?",
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      read: false,
    },
  ],
};
