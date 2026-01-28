import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Edit2, Save, X, UserPlus, AlertCircle } from 'lucide-react';
import { db } from '../db';

export default function Students() {
    // 1. Fetch only active students
    const students = useLiveQuery(() =>
        db.students.filter(s => s.is_active !== false).toArray()
    );

    // 2. State for Adding New Student
    const [newName, setNewName] = useState('');
    const [newNote, setNewNote] = useState('');

    // 3. State for Inline Editing
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editNote, setEditNote] = useState('');

    // --- ACTIONS ---

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        await db.students.add({
            name: newName.trim(),
            notes: newNote.trim(),
            is_active: true
        });

        setNewName('');
        setNewNote('');
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

    const saveEdit = async (id: number) => {
        if (!editName.trim()) return;

        await db.students.update(id, {
            name: editName.trim(),
            notes: editNote.trim()
        });
        setEditingId(null);
    };

    // Soft delete to preserve attendance history
    const handleRemove = async (id: number) => {
        if (window.confirm("هل أنت متأكد من حذف هذا الطالب؟ (سيتم أرشفته للحفاظ على سجله السابق)")) {
            await db.students.update(id, { is_active: false });
        }
    };

    return (
        <div className="p-4 mx-auto">

            {/* HEADER & ADD FORM */}
            <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
                <div className="card-body">
                    <h2 className="card-title gap-2 mb-4">
                        <UserPlus className="text-primary" />
                        إضافة طالب جديد
                    </h2>

                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="form-control w-full md:w-1/3">
                            <label className="label"><span className="label-text font-bold">اسم الطالب</span></label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="أحمد محمد..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>

                        <div className="form-control w-full md:w-1/2">
                            <label className="label"><span className="label-text">ملاحظات عامة (اختياري)</span></label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="رقم ولي الأمر، ملاحظات صحية..."
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={!newName.trim()}>
                            إضافة
                        </button>
                    </form>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-lg opacity-70">عدد الطلاب: {students?.length}</h2>
            </div>

            {/* STUDENTS LIST */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        {/* Table Header */}
                        <thead>
                            <tr className="bg-base-200 text-base">
                                <th className='w-10'>#</th>
                                <th className='min-w-44'>الاسم</th>
                                <th>ملاحظات</th>
                                <th className="w-32 text-center">إجراءات</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students?.map((student) => (
                                <tr key={student.id} className="hover">

                                    {/* --- RENDER MODE --- */}
                                    {editingId !== student.id ? (
                                        <>
                                            <td>{student.id}</td>
                                            <td className="font-bold text-lg">{student.name}</td>
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
                                            <td>{student.id}</td>
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