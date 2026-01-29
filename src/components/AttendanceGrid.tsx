import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Student } from '../db';
import { getMonthSessions } from '../utils/dates';
import { useState } from 'react';
import SearchBar from './SearchBar';
import { exportToExcel } from '../utils/excelExport';

const normalize = (str: string) => str.trim().replace(/\s+/g, ' ').replaceAll('أ', 'ا');

export default function AttendanceGrid({ monthKey, students }: { monthKey: string, students: Student[] }) {
  const [search, setSearch] = useState('');
  // 1. Parse Key
  const [yearStr, monthStr] = monthKey.split('-');
  const sessions = getMonthSessions(parseInt(yearStr), parseInt(monthStr) - 1);

  // Optimization: Fetch ALL logs for this month at once
  const logs = useLiveQuery(() =>
    db.attendance.where('date').between(`${monthKey}-01`, `${monthKey}-31`, true, true).toArray()
    , [monthKey]);

  // 3. Create Fast Lookup Map: "studentID_date" -> true
  const attendanceMap = new Set(logs?.map(l => `${l.student_id}_${l.date}`));

  // 4. Toggle Handler
  const toggle = async (studentId: string, dateStr: string, isPresent: boolean) => {
    if (isPresent) {
      const record = logs?.find(l => l.student_id === studentId && l.date === dateStr);
      if (record?.id) await db.attendance.delete(record.id);
    } else {
      await db.attendance.add({
        student_id: studentId,
        date: dateStr,
        type: new Date(dateStr).getDay() === 4 ? 'edu' : 'quran'
      });
    }
  };

  const handleExport = async () => {
    if (!students.length) return;

    // 1. Define Static Columns
    const schema = [
      {
        column: '#',
        type: Number,
        value: (student: any) => student.index,
        width: 5,
        align: 'center'
      },
      {
        column: 'الاسم',
        type: String,
        value: (student: any) => student.name,
        width: 25,
        fontWeight: 'bold',
        align: 'right' // RTL alignment
      }
    ];

    // 2. Add Dynamic Date Columns
    sessions.forEach(session => {
      schema.push({
        column: `${session.dayName} ${session.displayDate}`, // Header text
        type: String,
        value: (student: any) => {
          const isPresent = attendanceMap.has(`${student.id}_${session.dateStr}`);
          return isPresent ? '✓' : 'X';
        },
        width: 10,
        align: 'center',
        borderColor: '#000000' // Optional styling
      } as any);
    });

    // 3. Prepare Data (Add index for the # column)
    const data = students.map((s, i) => ({ ...s, index: i + 1 }));

    // 4. Export
    await exportToExcel(data, schema, `حضور_${monthKey}`);
  };

  const filteredStudents = students?.filter(s => normalize(s.name).includes(normalize(search)));

  if (!Array.isArray(students)) return <div className="loading loading-spinner loading-lg text-primary"></div>;
  else if (students.length == 0) return <div className='text-3xl font-bold text-center m-10'>مفيش طلاب</div>

  return (
    <div className="flex flex-col gap-4">

      <SearchBar search={search} setSearch={setSearch} filteredStudents={filteredStudents} exportExcel={handleExport} />

      {/* THE GRID */}
      <div className="card print:!static bg-base-100 shadow-sm border border-base-200 rounded-none md:rounded-box">
        <div className="overflow-x-auto w-full max-h-[70vh] print-only print:max-w-screen print:max-h-max">
          <table className="table table-pin-rows table-pin-cols table-xs md:table-sm">
            <thead>
              <tr className="bg-base-200">
                <th className="bg-base-200 z-20 text-base font-bold text-primary">اسم الطالب</th>
                {sessions.map(s => (
                  <th key={s.dateStr} className="text-center min-w-[70px] print:min-w-0 p-1 font-normal relative">
                    <div className="flex flex-col items-center gap-1">
                      <span className="opacity-100">{s.dayName}</span>
                      <span className="font-bold">{s.displayDate}</span>
                      <div className={`h-1 w-8 rounded-full ${s.type === 'edu' ? 'bg-secondary' : 'bg-primary/40'}`} />
                    </div>
                  </th>
                ))}
                {/* <th className='w-0'></th> */}
              </tr>
            </thead>
            <tbody>
              {filteredStudents?.map((student) => (
                <tr key={student.id} className="hover">
                  <th className="bg-base-100 font-medium z-10 text-nowrap">
                    {/* <span className='inline-block w-5'>{index+1}</span> */}
                    <span className='text-nowrap'>{student.name}</span>
                  </th>
                  {sessions.map(s => {
                    const isChecked = attendanceMap.has(`${student.id}_${s.dateStr}`);
                    return (
                      <td key={s.dateStr} className="p-0 text-center border-l border-base-100">
                        <label className="cursor-pointer flex justify-center items-center h-12 w-full hover:bg-base-200/50 transition-colors">
                          <input
                            type="checkbox"
                            className={`checkbox checkbox-sm ${s.type === 'edu' ? 'checkbox-secondary' : 'checkbox-primary'}`}
                            checked={isChecked}
                            onChange={() => toggle(student.id, s.dateStr, isChecked)}
                          />
                        </label>
                      </td>
                    );
                  })}
                  {/* <th>{student.id}</th> */}
                </tr>
              ))}
              {filteredStudents?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 opacity-50">
                    لا يوجد طلاب مطابقين للبحث
                  </td>
                </tr>
              )}
              {students.length === 0 && (
                <tr>
                  <td colSpan={sessions.length + 1} className="text-center py-10 opacity-50">
                    لا يوجد طلاب.. اضغط على "طالب جديد" للإضافة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}