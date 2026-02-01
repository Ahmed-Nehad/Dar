import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Student } from '../db';
import { SURAH_NAMES } from '../utils/surhas';
import { getMonthSessions } from '../utils/dates';
import SearchBar from './SearchBar';
import { exportToExcel } from '../utils/excelExport';

const normalize = (str: string) => str.trim().replace(/\s+/g, ' ').replaceAll('أ', 'ا');

// --- Sub-component: Individual Student Row ---
const StudentRow = ({
  student,
  report,
  stats,
  monthKey,
}: {
  student: any,
  report: any,
  stats: { quran: number, edu: number },
  monthKey: string,
}) => {

  const [formData, setFormData] = useState({
    current_hifz: '',
    past_revision: '',
    notes: '',
    expenses: false,
  });

  useEffect(() => {
    setFormData({
      current_hifz: report?.current_hifz || '',
      past_revision: report?.past_revision || '',
      notes: report?.notes || '',
      expenses: report?.expenses || false,
    });
  }, [report, monthKey]);

  const handleSave = async (field: string, value: any) => {
    const dbValue = report ? report[field] : '';
    if (dbValue === value) return;

    if (report && report.id) {
      await db.monthly_reports.update(report.id, { [field]: value });
    } else {
      const existing = await db.monthly_reports
        .where({ student_id: student.id, month_key: monthKey })
        .first();

      if (existing && existing.id) {
        await db.monthly_reports.update(existing.id, { [field]: value });
      } else {
        await db.monthly_reports.add({
          student_id: student.id,
          month_key: monthKey,
          current_hifz: '',
          past_revision: '',
          notes: '',
          expenses: false,
          [field]: value
        });
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <tr className="hover group">
      <th className="bg-base-100 font-medium z-10 text-nowrap">
        {/* <span className='inline-block w-5'>{index+1}</span> */}
        <span className='text-nowrap'>{student.name}</span>
      </th>

      <td className="p-0 text-center border-l border-base-100">
        <label className="cursor-pointer flex justify-center items-center h-12 w-full hover:bg-base-200/50 transition-colors">
          <input
            type="checkbox"
            className={`checkbox checkbox-sm checkbox-neutral`}
            checked={formData.expenses}
            onChange={() => handleSave('expenses', !formData.expenses)}
          />
        </label>
      </td>

      {/* Column 1: Quran Stats */}
      <td className="p-1 text-center border-l border-base-100 min-w-[60px]">
        <div className={`badge badge-sm w-full font-bold ${stats.quran > 0 ? 'badge-primary text-primary-content' : 'badge-outline opacity-40'}`}>
          {stats.quran}
        </div>
      </td>

      {/* Column 2: Edu Stats */}
      <td className="p-1 text-center border-l border-base-100 min-w-[60px]">
        <div className={`badge badge-sm w-full font-bold ${stats.edu > 0 ? 'badge-secondary text-secondary-content' : 'badge-outline opacity-40'}`}>
          {stats.edu}
        </div>
      </td>

      {/* Current Hifz */}
      <td className="p-1 border-l border-base-100">
        <input
          type="text"
          list="surah-list"
          className="input input-bordered input-sm w-full focus:input-primary transition-all"
          placeholder="سورة..."
          value={formData.current_hifz}
          onChange={(e) => handleChange('current_hifz', e.target.value)}
          onBlur={(e) => handleSave('current_hifz', e.target.value)}
        />
      </td>

      {/* Past Revision */}
      <td className="p-1 border-l border-base-100">
        <input
          type="text"
          list="surah-list"
          className="input input-bordered input-sm w-full focus:input-primary transition-all"
          placeholder="سورة..."
          value={formData.past_revision}
          onChange={(e) => handleChange('past_revision', e.target.value)}
          onBlur={(e) => handleSave('past_revision', e.target.value)}
        />
      </td>

      {/* Notes */}
      <td className="p-1 border-l border-base-100">
        <textarea
          className="textarea textarea-bordered textarea-xs w-full h-10 min-h-[2.5rem] leading-tight resize-none focus:h-20 focus:z-50 focus:shadow-lg transition-all ph-mask"
          placeholder="..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          onBlur={(e) => handleSave('notes', e.target.value)}
        ></textarea>
      </td>
    </tr>
  );
};

// --- Main Component ---
export default function ProgressReport({ monthKey, students }: { monthKey: string, students: Student[] }) {
  const [search, setSearch] = useState('');

  const [yearStr, monthStr] = monthKey.split('-');
  const sessions = getMonthSessions(parseInt(yearStr), parseInt(monthStr) - 1);

  const reports = useLiveQuery(() =>
    db.monthly_reports.where('month_key').equals(monthKey).toArray()
    , [monthKey]);

  const attendanceLogs = useLiveQuery(() =>
    db.attendance.where('date').between(`${monthKey}-01`, `${monthKey}-31`, true, true).toArray()
    , [monthKey]);

  const statsMap = useMemo(() => {
    const map = new Map<string, { quran: number, edu: number }>();
    if (!attendanceLogs) return map;

    attendanceLogs.forEach(log => {
      const current = map.get(log.student_id) || { quran: 0, edu: 0 };
      if (log.type === 'quran') current.quran++;
      else if (log.type === 'edu') current.edu++;
      map.set(log.student_id, current);
    });
    return map;
  }, [attendanceLogs]);

  const reportsMap = new Map(reports?.map(r => [r.student_id, r]));

  const handleExport = async () => {
    if (!students.length) return;

    // 1. Define Schema
    const schema = [
      {
        column: '#',
        type: Number,
        value: (s: any) => s.index,
        width: 5
      },
      {
        column: 'الاسم',
        type: String,
        value: (s: any) => s.name,
        width: 25,
        fontWeight: 'bold',
        align: 'right'
      },
      {
        column: "المصاريف",
        type: String,
        value: (s: any) => reportsMap.get(s.id)?.expenses ? '✓' : 'X',
        width: 10,
        align: 'center',
      },
      {
        column: 'الحفظ الجديد',
        type: String,
        value: (s: any) => reportsMap.get(s.id)?.current_hifz || '',
        width: 20,
        // wrap: true // Auto-wrap text
      },
      {
        column: 'المراجعة',
        type: String,
        value: (s: any) => reportsMap.get(s.id)?.past_revision || '',
        width: 20,
        // wrap: true
      },
      {
        column: 'حضور قرآن',
        type: Number,
        value: (s: any) => statsMap.get(s.id)?.quran || 0,
        width: 12,
        align: 'center'
      },
      {
        column: 'حضور منهج',
        type: Number,
        value: (s: any) => statsMap.get(s.id)?.edu || 0,
        width: 12,
        align: 'center'
      },
      {
        column: 'ملاحظات',
        type: String,
        value: (s: any) => reportsMap.get(s.id)?.notes || '',
        width: 30
      }
    ];

    // 2. Prepare Data
    const data = students.map((s, i) => ({ ...s, index: i + 1 }));

    // 3. Export
    await exportToExcel(data, schema, `متابعة_${monthKey}`);
  };

  const filteredStudents = students?.filter(s => normalize(s.name).includes(normalize(search)));


  if (!students) return <div className="loading loading-spinner loading-lg text-primary mx-auto block mt-10"></div>;

  return (
    <div className="flex flex-col gap-4">

      <SearchBar search={search} setSearch={setSearch} filteredStudents={filteredStudents} exportExcel={handleExport} />

      <datalist id="surah-list">
        {SURAH_NAMES.map(surah => (
          <option key={surah} value={surah} />
        ))}
      </datalist>

      {/* Main Table Card */}
      <div className="card print:!static bg-base-100 shadow-sm border border-base-200 rounded-none md:rounded-box">
        <div className="overflow-x-auto w-full max-h-[70vh] print-only print:max-w-screen print:max-h-max">
          <table className="table table-pin-rows table-pin-cols table-xs md:table-sm">
            <thead className='*:print:min-w-0'>
              <tr className="bg-base-200">
                <th className="bg-base-200 text-primary z-20 font-bold text-base">اسم الطالب</th>
                <th className='ext-center min-w-[70px] p-1 font-normal relative' >الماصاريف</th>

                <th className="relative font-normal text-center min-w-[60px] w-[60px] text-sm">{"قرآن" + ` /${sessions.filter(s => s.type == 'quran').length}`}</th>
                <th className="relative font-normal text-center min-w-[60px] w-[60px] text-sm">{"تربوي" + ` /${sessions.filter(s => s.type == 'edu').length}`}</th>

                <th className="relative font-normal min-w-[100px] w-[100px]">الحفظ الجديد</th>
                <th className="relative font-normal min-w-[100px] w-[100px]">المراجعة</th>
                <th className="relative font-normal min-w-[180px] w-full">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents?.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  report={reportsMap.get(student.id)}
                  stats={statsMap.get(student.id) || { quran: 0, edu: 0 }}
                  monthKey={monthKey}
                />
              ))}
              {filteredStudents?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 opacity-50">
                    لا يوجد طلاب مطابقين للبحث
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