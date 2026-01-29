import { useRef, useState } from 'react';
import { Trash2, Edit2, Save, X, UserPlus, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { db, type Student } from '../db';
import type { DexieError } from 'dexie';
import readXlsxFile from 'read-excel-file';
import SearchBar from './SearchBar';

export default function Students({ students }: { students: Student[] }) {

    // 2. State for Adding New Student
    const [search, setSearch] = useState('');
    const [newName, setNewName] = useState('');
    const [newNote, setNewNote] = useState('');

    // 3. State for Inline Editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editNote, setEditNote] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ACTIONS ---
    const normalize = (str: string) => str.trim().replace(/\s+/g, ' ').replaceAll('أ', 'ا');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const name = newName.trim();
        const notes = newNote.trim() || '';

        const exists = students.some(s => normalize(s.name) === normalize(name));
        if (exists) {
            alert('هذا الاسم مسجل بالفعل!');
            setSearch(name.trim());
            setNewName('');
            setNewNote('');
            return;
        }

        try {
            await db.students.add({ name, notes });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'name' in err) {
                const dexieError = err as DexieError;
                switch (dexieError.name) {
                    case "ConstraintError":
                        alert("هذا الأسم مسجل بالفعل");
                        setSearch(name.trim());
                        break;
                    default:
                        alert('حدث خطأ');
                        break;
                }
            } else {
                console.log(err);
            }
        }

        setNewName('');
        setNewNote('');
    };
    const handleRemove = async (id: string) => {
        const isConfirmed = window.confirm('هل انت متأكد من حذف الطالب؟');

        if (!isConfirmed) return;

        try {
            await db.students.delete(id);
        } catch (err: unknown) {
            console.log(err);
            alert("حدث خطأ")
        }
    };

    const startEdit = (student: any) => {
        setEditingId(student.id);
        setEditName(student.name);
        setEditNote(student.notes || '');
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditNote('');
    };
    const saveEdit = async (id: string) => {
        if (!editName.trim()) return;

        try{
            await db.students.update(id, {
                name: editName.trim(),
                notes: editNote.trim()
            });
        }catch(err: any) {
            console.log(err.message);
            if(err && err.message == "Error modifying one or more objects. Errors: ConstraintError: Unable to add key to index 'name': at least one key does not satisfy the uniqueness requirements."){
                alert('هذا الأسم مسجل بالفعل')
                setSearch(editName.trim());
            } else {
                alert('حدث خطأ')
            }
            cancelEdit();
        }
        setEditingId(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 1. Read the file (returns Array of Arrays)
            // Example: [ ["الاسم", "السن"], ["أحمد", 10], ["محمد", 12] ]
            const rows = await readXlsxFile(file);

            if (rows.length === 0) {
                alert('الملف فارغ!');
                return;
            }

            // 2. Find the Header Row (First row)
            const headers = rows[0].map(h => String(h).trim());

            const possibleHeaders = ['name', 'Name', 'الاسم', 'الأسم', 'أسم', 'اسم الطالب', 'الطالب'];

            // Find the INDEX of the column that contains the name
            const nameColIndex = headers.findIndex(h => possibleHeaders.includes(h));

            if (nameColIndex === -1) {
                alert(`لم يتم العثور على عمود للاسم.\nالرجاء التأكد من وجود عمود بعنوان: "الاسم" أو "الأسم" أو "أسم"`);
                return;
            }

            const existingNames = new Set(students.map(s => normalize(s.name)));
            const studentsToAdd: any[] = [];
            let skippedCount = 0;

            // 3. Extract Names (Skip header row 0)
            rows.slice(1).map((row) => {
                const rawName = row[nameColIndex]; // Get data from the specific column index

                if (rawName && String(rawName).trim().length > 0) {
                    const name = String(rawName).trim();
                    if (existingNames.has(normalize(name))) skippedCount++;
                    else {
                        existingNames.add(normalize(name));
                        studentsToAdd.push({
                            id: `std${crypto.randomUUID()}`,
                            name,
                            notes: '',
                            is_active: true
                        })
                    };
                }
                return null;
            });

            if (studentsToAdd.length > 0) {
                await db.students.bulkAdd(studentsToAdd);
                alert(`تمت العملية بنجاح:\n✅ تم إضافة: ${studentsToAdd.length}\n⚠️ تم تجاهل (مكرر): ${skippedCount}`);
            } else {
                alert(`لم يتم إضافة أي طلاب جدد.\nجميع الأسماء (${skippedCount}) موجودة بالفعل.`);
            }

        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء قراءة الملف. تأكد أن الملف بصيغة Excel (.xlsx)');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredStudents = students?.filter(s => normalize(s.name).includes(normalize(search)));

    return (
        <div className="p-4 mx-auto">

            {/* HEADER CARD */}
            <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
                <div className="card-body">
                    <div className="flex justify-between items-start">
                        <h2 className="card-title gap-2 mb-4">
                            <UserPlus className="text-primary" />
                            إدارة الطلاب
                        </h2>

                        {/* IMPORT BUTTON */}
                        <div>
                            <input
                                type="file"
                                accept=".xlsx"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button
                                className="btn btn-outline btn-success gap-2 btn-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileSpreadsheet size={18} />
                                استيراد من Excel
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="form-control w-full md:w-1/3">
                            <label className="label"><span className="label-text font-bold">اسم الطالب</span></label>
                            <input type="text" className="input input-bordered w-full" placeholder="أحمد محمد..." value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>

                        <div className="form-control w-full md:w-1/2">
                            <label className="label"><span className="label-text">ملاحظات عامة</span></label>
                            <input type="text" className="input input-bordered w-full" placeholder="رقم ولي الأمر..." value={newNote} onChange={e => setNewNote(e.target.value)} />
                        </div>

                        <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={!newName.trim()}>
                            إضافة
                        </button>
                    </form>
                </div>
            </div>

            <SearchBar search={search} setSearch={setSearch} filteredStudents={filteredStudents} />

            {/* STUDENTS LIST */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden mt-5">

                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        {/* Table Header */}
                        <thead>
                            <tr className="bg-base-200 text-base">
                                {/* <th className=''>#</th> */}
                                <th className='text-nowrap'>الاسم</th>
                                <th>ملاحظات</th>
                                <th className="w-32 text-center">إجراءات</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredStudents?.map((student) => (
                                <tr key={student.id} className="hover">

                                    {/* --- RENDER MODE --- */}
                                    {editingId !== student.id ? (
                                        <>
                                            {/* <td className='text-nowrap w-5'>{index + 1}</td> */}
                                            <td className="font-bold text-lg text-nowrap">{student.name}</td>
                                            <td className="opacity-70 min-w-fit text-nowrap">{student.notes || '-'}</td>
                                            <td className="flex justify-center gap-2">
                                                <button
                                                    className="btn btn-square btn-sm btn-ghost text-info"
                                                    onClick={() => startEdit(student)}
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="btn btn-square btn-sm btn-ghost text-error"
                                                    onClick={() => handleRemove(student.id!)}
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        /* --- EDIT MODE --- */
                                        <>
                                            {/* <td>{index + 1}</td> */}
                                            <td>
                                                <input
                                                    type="text"
                                                    className="input input-sm input-bordered w-full max-w-xs"
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    autoFocus
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="input input-sm input-bordered w-full min-w-40 text-nowrap"
                                                    value={editNote}
                                                    onChange={e => setEditNote(e.target.value)}
                                                />
                                            </td>
                                            <td className="flex justify-center gap-2">
                                                <button
                                                    className="btn btn-square btn-sm btn-success text-white"
                                                    onClick={() => saveEdit(student.id!)}
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button
                                                    className="btn btn-square btn-sm btn-ghost"
                                                    onClick={cancelEdit}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}

                            {students?.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} />
                                            <p>لا يوجد طلاب مسجلين حالياً</p>
                                        </div>
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