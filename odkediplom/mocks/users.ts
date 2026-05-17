import { User } from "@/types";

export const currentUser: User = {
  id: "user-1",
  name: "Одонтунгалаг",
  email: "odke@gmail.com",
  role: "employee",
  avatar:
    "data:image/png;base64,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",
  department: "MC4",
  jobTitle: "захирал",
};

export const users: User[] = [
  currentUser,
  {
    id: "user-2",
    name: "Хонгорзул",
    email: "sarah.chen@company.com",
    role: "manager",
    avatar: "https://i.pravatar.cc/150?img=5",
    department: "Engineering",
    jobTitle: "Engineering Manager",
  },
  {
    id: "user-3",
    name: "Сарнай",
    email: "michael.torres@company.com",
    role: "employee",
    avatar: "https://i.pravatar.cc/150?img=8",
    department: "Engineering",
    jobTitle: "Frontend Developer",
  },
  {
    id: "user-4",
    name: "Номинэрдэнэ",
    email: "emily.davis@company.com",
    role: "employee",
    avatar: "https://i.pravatar.cc/150?img=9",
    department: "Design",
    jobTitle: "Product Designer",
  },
  {
    id: "user-5",
    name: "David Kim",
    email: "david.kim@company.com",
    role: "employee",
    avatar: "https://i.pravatar.cc/150?img=13",
    department: "Marketing",
    jobTitle: "Marketing Specialist",
  },
];
