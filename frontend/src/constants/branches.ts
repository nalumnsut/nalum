export const BRANCHES = [
  "Bachelor of Architecture (B.Arch)",
  "Bachelor of Business Administration (BBA)",
  "Bachelor of Design (B.Des)",
  "Biotechnology",
  "Civil Engineering",
  "COE (Computer Engineering)",
  "Computer Science Engineering",
  "Computer Science Engineering (Artificial Intelligence)",
  "Computer Science Engineering (Big Data Analytics)",
  "Computer Science Engineering (Data Science)",
  "Computer Science Engineering (IoT)",
  "Doctor of Philosophy (Ph.D)",
  "Electrical Engineering",
  "Electronics and Communication Engineering",
  "Electronics and Communication Engineering (ECAM)",
  "Electronics Engineering (VLSI Design)",
  "Geoinformatics (GI)",
  "Information Technology",
  "Information Technology (Network Security)",
  "Instrumentation and Control Engineering",
  "Master of Arts (M.A)",
  "Master of Business Administration (MBA)",
  "Master of Science (M.Sc)",
  "Master of Technology (M.Tech)",
  "Mathematics and Computing (MAC)",
  "Mechanical Engineering",
  "Mechanical Engineering - Electric Vehicles (MEEV)",
  "MPAE (Manufacturing Processes and Automation Engineering)",
] as const;

export const CAMPUSES = ["Main Campus", "East Campus", "West Campus"] as const;

export type Branch = (typeof BRANCHES)[number];
export type Campus = (typeof CAMPUSES)[number];