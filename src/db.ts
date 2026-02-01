// src/db.ts
import { Dexie, type EntityTable } from "dexie";
import dexieCloud from 'dexie-cloud-addon';
import posthog from "posthog-js";
// import logger from "dexie-logger";

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
  expenses: boolean;
  notes: string;
}

// 4. Months Registry: To track which months have been "Started"
interface OldAcademicMonth {
  key: string; // "YYYY-MM" (Primary Key)
  name: string; // "January"
  year: number;
  is_open: boolean;
}

// 4. Months Registry: To track which months have been "Started"
interface AcademicMonth {
  id: string;
  key: string; // "YYYY-MM" (Primary Key)
  name: string; // "January"
  year: number;
  is_open: boolean;
}

const db = new Dexie("DarTahfezDB", { addons: [dexieCloud] }) as Dexie & {
  students: EntityTable<Student, "id">;
  attendance: EntityTable<Attendance, "id">;
  monthly_reports: EntityTable<MonthlyReport, "id">;
  months: EntityTable<OldAcademicMonth, "key">;
  academic_months: EntityTable<AcademicMonth, "id">;
};

db.version(6)
  .stores({
    students: "@id, name",
    attendance: "@id, [student_id+date], date",
    monthly_reports: "@id, [student_id+month_key], month_key",
    months: "key, year",
    academic_months: "@id, key, year"
  })
  .upgrade(async tx => {
    console.log('Running v6 migration...');

    // ==========================================
    // PART 1: Migrate months → academic_months
    // ==========================================
    const oldMonths = await tx.table('months').toArray();

    if (oldMonths.length > 0) {
      console.log(`Found ${oldMonths.length} old months to migrate`);

      // Check which months already exist in new table
      const existingKeys = new Set(
        (await tx.table('academic_months').toArray()).map(m => m.key)
      );

      // Only migrate months that don't exist yet
      const toMigrate = oldMonths.filter(old => !existingKeys.has(old.key));

      if (toMigrate.length > 0) {
        const newRecords = toMigrate.map(old => ({
          id: `acd${crypto.randomUUID()}`,
          key: old.key,
          name: old.name,
          year: old.year,
          is_open: old.is_open ?? true
        }));

        await tx.table('academic_months').bulkAdd(newRecords);
        console.log(`✅ Migrated ${newRecords.length} months to academic_months`);
      } else {
        console.log('ℹ️ All months already migrated');
      }

      // Clear old table after successful migration
      await tx.table('months').clear();
      console.log('✅ Cleared old months table');
    }

    // ==========================================
    // PART 2: Handle duplicate students
    // ==========================================
    const allStudents = await tx.table('students').toArray();

    if (allStudents.length > 0) {
      console.log(`Checking ${allStudents.length} students for duplicates...`);

      const seenNames = new Map(); // name -> {id, firstSeen}
      const duplicates: string[] = [];
      const idsToKeep = new Set();

      for (const student of allStudents) {
        const normalizedName = student.name.trim().toLowerCase();

        if (seenNames.has(normalizedName)) {
          // This is a duplicate - mark for deletion
          duplicates.push(student.id);
          console.log(`Found duplicate: "${student.name}" (id: ${student.id})`);
        } else {
          // First occurrence - keep this one
          seenNames.set(normalizedName, {
            id: student.id,
            originalName: student.name
          });
          idsToKeep.add(student.id);
        }
      }

      if (duplicates.length > 0) {
        console.log(`⚠️ Found ${duplicates.length} duplicate students`);

        // Before deleting duplicates, we need to reassign their data
        // to the "kept" student record

        // 1. Fix attendance records
        const attendanceRecords = await tx.table('attendance').toArray();
        const attendanceToUpdate = attendanceRecords.filter(
          a => duplicates.includes(a.student_id)
        );

        if (attendanceToUpdate.length > 0) {
          for (const attendance of attendanceToUpdate) {
            // Find the correct student ID to use
            const student = allStudents.find(s => s.id === attendance.student_id);
            if (student) {
              const normalizedName = student.name.trim().toLowerCase();
              const correctId = seenNames.get(normalizedName)?.id;

              if (correctId && correctId !== attendance.student_id) {
                // Update to point to the kept student
                await tx.table('attendance').update(attendance.id, {
                  student_id: correctId
                });
              }
            }
          }
          console.log(`✅ Reassigned ${attendanceToUpdate.length} attendance records`);
        }

        // 2. Fix monthly reports
        const reportRecords = await tx.table('monthly_reports').toArray();
        const reportsToUpdate = reportRecords.filter(
          r => duplicates.includes(r.student_id)
        );

        if (reportsToUpdate.length > 0) {
          for (const report of reportsToUpdate) {
            const student = allStudents.find(s => s.id === report.student_id);
            if (student) {
              const normalizedName = student.name.trim().toLowerCase();
              const correctId = seenNames.get(normalizedName)?.id;

              if (correctId && correctId !== report.student_id) {
                // Check if a report already exists for the correct student
                const existingReport = await tx.table('monthly_reports')
                  .where('[student_id+month_key]')
                  .equals([correctId, report.month_key])
                  .first();

                if (existingReport) {
                  // Report already exists, delete duplicate
                  await tx.table('monthly_reports').delete(report.id);
                } else {
                  // Update to point to the kept student
                  await tx.table('monthly_reports').update(report.id, {
                    student_id: correctId
                  });
                }
              }
            }
          }
          console.log(`✅ Reassigned ${reportsToUpdate.length} monthly reports`);
        }

        // 3. Finally, delete duplicate students
        await tx.table('students').bulkDelete(duplicates);
        console.log(`✅ Deleted ${duplicates.length} duplicate students`);
        console.log(`✅ Kept ${idsToKeep.size} unique students`);
      } else {
        console.log('✅ No duplicate students found');
      }
    }

    console.log('✅ Migration v6 complete');
  });

// Add error handler for opening failures
db.open().catch(err => {
  posthog?.capture('$exception', {
    describtion: 'Error open the database',
    type: 'Database Error',
    location: 'db.ts',
    err: err.name,
    message: err.message || String(err),
  });

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

// db.use(logger({
//   tableWhiteList: ['months', 'students', 'academic_months'],
//   // logType: LogType.Minimal
// }));

export type { Student, Attendance, MonthlyReport, AcademicMonth };
export { db };