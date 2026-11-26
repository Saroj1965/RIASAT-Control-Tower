export const DEPARTMENTS = [
  { id: 1, name: "Semicon", code: "SEMICON", type: "technical", head_of_department: "To be hired" },
  { id: 2, name: "Aerospace & Defence", code: "AERO_DEFENCE", type: "technical", head_of_department: "To be hired" },
  { id: 3, name: "Space", code: "SPACE", type: "technical", head_of_department: "To be hired" },
  { id: 4, name: "Cybersecurity", code: "CYBER", type: "technical", head_of_department: "To be hired" },
  { id: 5, name: "MedTech", code: "MEDTECH", type: "technical", head_of_department: "To be hired" },
  { id: 6, name: "Advanced Manufacturing", code: "ADV_MFG", type: "technical", head_of_department: "To be hired" },
  { id: 7, name: "HR & Recruitment", code: "HR_REC", type: "recruitment", head_of_department: "Ms. Anamika Sahay" },
  { id: 8, name: "Communications", code: "COMM", type: "technical", head_of_department: "Ms. Vinila Kalive" },
  { id: 9, name: "Strategy & Process", code: "STRATEGY_PROCESS", type: "technical", head_of_department: "Mr. Avinash Ghodgaonkar" },
  { id: 10, name: "Executive Administration", code: "EXEC_ADMIN", type: "technical", head_of_department: "Ms. Sarojini Mangalam" },
  { id: 11, name: "Vice Chairman", code: "VICE_CHAIRMAN", type: "technical", head_of_department: "Mr. Venkatesh Valluri" },
] as const;

export const ROLES = {
  ADMIN: "Admin",
  VICE_CHAIRMAN: "Vice Chairman",
  CHAIRMAN: "Vice Chairman",
  EXECUTIVE: "Executive",
  DEPARTMENT_HEAD: "Department Head",
  FORM_ADMIN: "Form Admin",
  USER_ADMIN: "User Admin",
  DEPT_ADMIN: "Department Admin",
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
  "Candidate sourced",
  "shortlisted",
  "Interview in progress",
  "Offers released",
  "Rejected",
  "Joined",
] as const;
