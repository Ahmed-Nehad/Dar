import { Search } from 'lucide-react'

function SearchBar({ filteredStudents, search, setSearch }: { filteredStudents: any[], search: string, setSearch: (prop: any) => void }) {
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

            <div className="text-xs opacity-50 font-bold px-2 text-nowrap">
                عدد الطلاب: {filteredStudents?.length}
            </div>
        </div>
    )
}

export default SearchBar