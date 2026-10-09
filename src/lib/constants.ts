export const DEPARTMENTS = [
  { id: 1, name: "Semicon", code: "SEMICON", type: "technical" },
  { id: 2, name: "Aerospace & Defence", code: "AERO_DEFENCE", type: "technical" },
  { id: 3, name: "Space", code: "SPACE", type: "technical" },
  { id: 4, name: "Cybersecurity", code: "CYBER", type: "technical" },
  { id: 5, name: "MedTech", code: "MEDTECH", type: "technical" },
  { id: 6, name: "Advanced Manufacturing", code: "ADV_MFG", type: "technical" },
  { id: 7, name: "HR & Recruitment", code: "HR_REC", type: "recruitment" },
  { id: 8, name: "Communications", code: "COMM", type: "technical" },
  { id: 9, name: "Strategy & Operations", code: "STRATEGY_OPS", type: "technical" },
] as const;

export const ROLES = {
  ADMIN: "Admin",
  VICE_CHAIRMAN: "Vice Chairman",
  CHAIRMAN: "Vice Chairman",
  EXECUTIVE: "Executive",
  DEPARTMENT_HEAD: "Department Head",
} as const;

export const RAG_STATUSES = ["GREEN", "AMBER", "RED", "NOT STARTED"] as const;

export const WORKSTREAM_STATUSES = [
  "Not Started",
  "In Progress",
  "On Track",
  "Delayed",
  "Completed",
  "Blocked",
  "On Hold",
] as const;

export const RECRUITMENT_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;

export const RECRUITMENT_STATUSES = [
  "Open",
  "Sourcing",
  "Screening",
  "Interview",
  "Offer",
  "Joined",
  "On Hold",
  "Closed",
] as const;
