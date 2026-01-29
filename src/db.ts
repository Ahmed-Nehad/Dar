// src/db.ts
import { Dexie, type EntityTable } from "dexie";
import dexieCloud from 'dexie-cloud-addon';

// 1. Student Profile: Constant info
interface Student {
  id: string;
  name: string;
  notes?: string;
}

// 2. Attendance Log: Daily records
interface Attendance {
  id: string;
  student_id: string;
  date: string; // Format: "YYYY-MM-DD"
  type: 'quran' | 'edu'; // Derived from day of week (Thu=Edu, Sun/Tue=Quran)
}

// 3. Monthly Report: The data for Page 2
interface MonthlyReport {
  id: string;
  student_id: string;
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

const db = new Dexie("DarTahfezDB", { addons: [dexieCloud] }) as Dexie & {
  students: EntityTable<Student, "id">;
  attendance: EntityTable<Attendance, "id">;
  monthly_reports: EntityTable<MonthlyReport, "id">;
  months: EntityTable<AcademicMonth, "key">;
};

db.version(2).stores({
  students: "@id, &name",
  attendance: "@id, [student_id+date], date", // Compound index to prevent duplicate entries per day
  monthly_reports: "@id, [student_id+month_key], month_key", // One report per student per month
  months: "key, year" // To list available months
});

// Add error handler for opening failures
db.open().catch(err => {
  console.error('Failed to open database:', err);
  alert(err.name);
  alert(err.message);
  // Optionally try to delete and recreate
  if (err.name === 'UnknownError') {
    return db.delete().then(() => db.open());
  }
});

db.cloud.configure({
  databaseUrl: "https://zs28znv2u.dexie.cloud",
  requireAuth: false
})

export type { Student, Attendance, MonthlyReport, AcademicMonth };
export { db };