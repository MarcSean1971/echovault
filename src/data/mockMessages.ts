
import { AdminMessage } from "@/types/admin";

export const mockMessages: AdminMessage[] = [
  {
    id: "msg_1",
    title: "Important Documents",
    sender: "marc.s@seelenbinderconsulting.com",
    recipients: ["family@example.com"],
    status: "Pending",
    condition: "Inactivity",
    createdAt: "May 1, 2025"
  },
  {
    id: "msg_2",
    title: "My Final Wishes",
    sender: "sarah.wilson@example.com",
    recipients: ["lawyer@example.com"],
    status: "Scheduled",
    condition: "Date",
    createdAt: "April 28, 2025"
  },
  {
    id: "msg_3",
    title: "Personal Video Message",
    sender: "john.doe@example.com",
    recipients: ["brother@example.com", "sister@example.com"],
    status: "Delivered",
    condition: "Panic Trigger",
    createdAt: "April 25, 2025"
  },
  {
    id: "msg_4",
    title: "Financial Instructions",
    sender: "emma.johnson@example.com",
    recipients: ["accountant@example.com"],
    status: "Pending",
    condition: "Inactivity",
    createdAt: "April 22, 2025"
  },
  {
    id: "msg_5",
    title: "Personal Journal",
    sender: "michael.brown@example.com",
    recipients: ["spouse@example.com"],
    status: "Draft",
    condition: "None",
    createdAt: "April 20, 2025"
  }
];
