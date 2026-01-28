// src/db.ts
import { Dexie, type EntityTable } from "dexie";

// 1. Student Profile: Constant info
interface Student {
  id: number;
  name: string;
  is_active: boolean; // To hide students who left without deleting data
  notes?: string;
}

// 2. Attendance Log: Daily records
interface Attendance {
  id: number;
  student_id: number;
  date: string; // Format: "YYYY-MM-DD"
  type: 'quran' | 'edu'; // Derived from day of week (Thu=Edu, Sun/Tue=Quran)
}

// 3. Monthly Report: The data for Page 2
interface MonthlyReport {
  id: number;
  student_id: number;
  month_key: string; // Format: "YYYY-MM" (e.g., "2026-01") to link to year/month
  current_hifz: string;
  past_revision: string;
  notes: string;
}

// 4. Months Registry: To track which months have been "Started"
interface AcademicMonth {
  key: string; // "YYYY-MM" (Primary Key)
  name: string; // "January"
  year: number;
  is_open: boolean;
}

const db = new Dexie("DarTahfezDB") as Dexie & {
  students: EntityTable<Student, "id">;
  attendance: EntityTable<Attendance, "id">;
  monthly_reports: EntityTable<MonthlyReport, "id">;
  months: EntityTable<AcademicMonth, "key">;
};

db.version(2).stores({
  students: "++id, name, is_active",
  attendance: "++id, [student_id+date], date", // Compound index to prevent duplicate entries per day
  monthly_reports: "++id, [student_id+month_key], month_key", // One report per student per month
  months: "key, year" // To list available months
});

export type { Student, Attendance, MonthlyReport, AcademicMonth };
export { db };