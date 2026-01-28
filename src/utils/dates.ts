// src/utils/dates.ts

export interface Session {
    dateObj: Date;
    dateStr: string;     // "2026-02-01" (Used for DB Lookup)
    dayName: string;     // "الأحد"
    displayDate: string; // "1/2"
    type: 'quran' | 'edu';
}

export function getMonthSessions(year: number, monthIdx: number): Session[] {
    const sessions: Session[] = [];
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthIdx, day);
        const dayOfWeek = date.getDay();

        // 0=Sun, 2=Tue, 4=Thu
        if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
            sessions.push({
                dateObj: date,
                dateStr: date.toLocaleDateString('en-CA'), // YYYY-MM-DD format regardless of locale
                dayName: date.toLocaleDateString('ar-EG', { weekday: 'long' }),
                displayDate: `${day}/${monthIdx + 1}`,
                type: dayOfWeek === 4 ? 'edu' : 'quran' // Thursday is Edu
            });
        }
    }
    return sessions;
}