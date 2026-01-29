import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PlusCircle } from 'lucide-react';
import { db } from './db';
import AttendanceGrid from './components/AttendanceGrid';
import ProgressReport from './components/ProgressReport';
import Students from './components/Students';
import LoginButton from './components/LoginButton';

// Arabic Month Names
const months = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function App() {
  // 1. Dynamic Date Setup
  const navigate = useNavigate();
  const location = useLocation();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(currentDate.getMonth());

  // Generate dynamic year range (Current Year - 1 to Current Year + 4)
  const existingYears = useLiveQuery(() => db.months.orderBy('year').uniqueKeys());
  const years = Array.from(new Set([
    currentDate.getFullYear(),
    ...(existingYears || []).map(y => Number(y))
  ])).sort((a, b) => a - b);

  // 2. Database Key Generation
  const currentMonthKey = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;

  // 3. Check DB for Month Existence
  const monthRecord = useLiveQuery(
    () => db.months.get(currentMonthKey),
    [currentMonthKey]
  );

  const students = useLiveQuery(
    () => db.students.toArray(),
    []
  ) || [];

  // 4. Handle "Start Month" Action
  const handleStartMonth = async () => {
    await db.months.add({
      key: currentMonthKey,
      name: months[selectedMonthIdx],
      year: selectedYear,
      is_open: true
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200 w-screen max-w-screen overflow-x-hidden" dir="rtl">

      {/* === TOP NAVIGATION BAR === */}
      <div className="navbar bg-base-100 shadow-sm sticky- top-0 z-50 px-4">
        <div className="flex-1 flex-row flex gap-2">
          <LoginButton />
          <h1 className="font-bold !text-xl hidden md:block">نظام التحفيظ</h1>
        </div>

        <div className="flex-none join direction-ltr">
          {/* Year Selector */}
          <select
            className="select w-20 select-sm join-item select-bordered"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            className="select w-20 select-sm join-item select-bordered"
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
          >
            {months.map((name, index) => (
              <option key={index} value={index}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* === CONTENT AREA === */}
      <main className="flex-1 p-4 mx-auto w-screen max-w-screen">
        {!monthRecord ? (
          <div className="hero min-h-[60vh]">
            <div className="hero-content text-center">
              <div className="max-w-7xlas0d9">
                <div className="text-6xl mb-4">📅</div>
                <h1 className="text-3xl font-bold">شهر جديد</h1>
                <p className="py-6 text-base-content/70">
                  شهر <span className="font-bold text-primary">{months[selectedMonthIdx]} {selectedYear}</span> غير مسجل في النظام.
                  <br />
                  اضغط أدناه لإنشاء جداول الحضور والمتابعة لهذا الشهر.
                </p>
                <button onClick={handleStartMonth} className="btn btn-primary gap-2">
                  <PlusCircle size={20} />
                  بدء الشهر
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div role="tablist" className="tabs tabs-lift">

            {/* TAB 1: Attendance */}
            <input
              type="radio"
              name="main_tabs"
              role="tab"
              className="tab min-w-[120px]- shrink font-bold text-lg"
              aria-label="سجل الحضور"
              checked={location.pathname === '/'}
              onChange={() => navigate('/')}
            />
            <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-4 md:p-6 w-full">
              <AttendanceGrid monthKey={currentMonthKey} students={students} />
            </div>

            {/* TAB 2: Progress */}
            <input
              type="radio"
              name="main_tabs"
              role="tab"
              className="tab min-w-[120px]- shrink font-bold text-lg"
              aria-label="المراجعة الشهرية"
              checked={location.pathname === '/progress'}
              onChange={() => navigate('/progress')}
            />
            <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-4 md:p-6 w-full">
              <ProgressReport monthKey={currentMonthKey} students={students} />
            </div>

            {/* TAB 3: Students */}
            <input
              type="radio"
              name="main_tabs"
              role="tab"
              className="tab min-w-24- shrink font-bold text-lg"
              aria-label="الطلبة"
              checked={location.pathname === '/students'}
              onChange={() => navigate('/students')}
            />
            <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-4 md:p-6 w-full">
              <Students students={students} />
            </div>
          </div>
        )}
      </main>

    </div>
  );
}