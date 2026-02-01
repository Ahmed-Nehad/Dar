// MigrationAlert.tsx
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { AlertTriangle, ArrowRightLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MigrationAlert() {
  const oldDataCount = useLiveQuery(() => db.months.count()) ?? 0;
  const [isMigrating, setIsMigrating] = useState(false);

  if (oldDataCount === 0) return null;

  const handleMigrate = async () => {
    if (!confirm("هل أنت متأكد من نقل البيانات إلى النظام الجديد؟")) return;
    
    setIsMigrating(true);
    const toastId = toast.loading("جاري تحديث قاعدة البيانات...");

    try {
      await db.transaction('rw', [db.months, db.academic_months], async () => {
        const oldRecords = await db.months.toArray();

        // ✅ Check which months are already migrated
        const existingKeys = new Set(
          (await db.academic_months.toArray()).map(m => m.key)
        );

        // ✅ Only migrate months that don't exist yet
        const toMigrate = oldRecords.filter(old => !existingKeys.has(old.key));

        if (toMigrate.length > 0) {
          const newRecords = toMigrate.map(old => ({
            id: `acd${crypto.randomUUID()}`,
            key: old.key,
            name: old.name,
            year: old.year,
            is_open: old.is_open
          }));

          await db.academic_months.bulkAdd(newRecords);
        }

        // ✅ Mark migration as complete by clearing old table
        // This is safe because data is now in academic_months
        await db.months.clear();
      });

      toast.success(` تم نقل ${oldDataCount} شهر بنجاح!`, { id: toastId });
      
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(`فشل التحديث: ${error.message}`, { id: toastId });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-base-100 max-w-md w-full rounded-xl p-6 shadow-2xl border-2 border-warning">
        
        <div className="flex items-center gap-4 mb-4 text-warning">
          <div className="p-3 bg-warning/10 rounded-full">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold">تحديث مطلوب</h2>
        </div>

        <p className="text-base-content/70 mb-6 leading-relaxed">
          تم اكتشاف <b>{oldDataCount}</b> شهور مسجلة بالنظام القديم.
          <br/>
          يجب تحديث هيكلة البيانات لضمان المزامنة الصحيحة ومنع الأخطاء.
        </p>

        <button 
          onClick={handleMigrate} 
          disabled={isMigrating}
          className="btn btn-warning w-full gap-2 text-lg"
        >
          {isMigrating ? (
            <>
              <Loader2 className="animate-spin" />
              جاري النقل...
            </>
          ) : (
            <>
              <ArrowRightLeft />
              نقل البيانات الآن
            </>
          )}
        </button>
        
        <div className="text-center mt-4 text-xs opacity-50">
          لن يتم حذف أي بيانات، سيتم فقط نقلها للجدول الجديد.
        </div>
      </div>
    </div>
  );
}