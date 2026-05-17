import { Document } from "@/types";

const now = new Date();

export const documents: Document[] = [
  {
    id: "doc-1",
    name: "Employee Handbook 2024",
    type: "pdf",
    category: "Компанийн бодлого",
    uploadedBy: "user-2",
    uploadedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    size: "2.4 MB",
    url: "https://example.com/handbook.pdf",
  },
  {
    id: "doc-2",
    name: "Code of Conduct",
    type: "pdf",
    category: "Компанийн бодлого",
    uploadedBy: "user-2",
    uploadedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    size: "1.1 MB",
    url: "https://example.com/code-of-conduct.pdf",
  },
  {
    id: "doc-3",
    name: "Remote Work Guidelines",
    type: "pdf",
    category: "Заавар",
    uploadedBy: "user-2",
    uploadedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    size: "890 KB",
    url: "https://example.com/remote-work.pdf",
  },
  {
    id: "doc-4",
    name: "API Documentation",
    type: "pdf",
    category: "Техникийн",
    uploadedBy: "user-1",
    uploadedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    size: "3.2 MB",
    url: "https://example.com/api-docs.pdf",
  },
  {
    id: "doc-5",
    name: "Security Best Practices",
    type: "pdf",
    category: "Техникийн",
    uploadedBy: "user-2",
    uploadedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    size: "1.8 MB",
    url: "https://example.com/security.pdf",
  },
  {
    id: "doc-6",
    name: "Benefits Overview",
    type: "pdf",
    category: "Хүний нөөц",
    uploadedBy: "user-2",
    uploadedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    size: "1.5 MB",
    url: "https://example.com/benefits.pdf",
  },
  {
    id: "doc-7",
    name: "Time Off Policy",
    type: "pdf",
    category: "Хүний нөөц",
    uploadedBy: "user-2",
    uploadedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
    size: "650 KB",
    url: "https://example.com/time-off.pdf",
  },
];

export const documentCategories = [
  "Бүх баримт",
  "Компанийн бодлого",
  "Заавар",
  "Техникийн",
  "Хүний нөөц",
];
