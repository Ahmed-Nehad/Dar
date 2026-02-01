import { usePostHog } from '@posthog/react'
import { FileDown, Printer, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom';

function SearchBar({ filteredStudents, search, setSearch, exportExcel }: { filteredStudents: any[], search: string, setSearch: (prop: any) => void, exportExcel?: () => void }) {

    const posthog = usePostHog();
    const location = useLocation();

    const handleExcelExport = () => {
        posthog?.capture('Excel_Export', {
            feature: 'export_excel',
            view: location.pathname,
        });
        exportExcel!();
    }

    const handlePDFExport = () => {
        posthog?.capture('PDF_Export', {
            feature: 'export_PDF',
            view: location.pathname,
        })
        window.print();
    }

    return (
        <div className="flex justify-between items-end gap-2 px-1">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 md:max-w-1/3 shadow-sm">
                <input
                    type="text"
                    className="grow"
                    placeholder="بحث عن طالب..."
                    value={search}
                    onChange={(e) => setSearch((e.target.value))}
                />
                <Search className="w-4 h-4 opacity-70" />
            </label>

            {!exportExcel ?
                <div className="text-xs opacity-50 font-bold px-2 text-nowrap">
                    عدد الطلاب: {filteredStudents?.length}
                </div> : <div className='space-x-2'>
                    <button
                        className="btn btn-outline btn-success gap-2 btn-sm"
                        onClick={handleExcelExport}
                    >
                        <FileDown size={18} />
                        <span className='hidden sm:inline'>{"Excel"}</span>
                    </button>
                    <button onClick={handlePDFExport} className="btn btn-outline btn-sm btn-error gap-2">
                        <Printer size={16} />
                        <span className='hidden sm:inline'>{"PDF"}</span>
                    </button>
                </div>}
        </div>
    )
}

export default SearchBar
