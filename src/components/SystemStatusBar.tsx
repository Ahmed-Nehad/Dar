import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useSystemStatus } from '../utils/useSystemStatus';

export default function SystemStatusBar() {
    const { isOnline, isSyncing, isError, errorMessage, phase, user } = useSystemStatus();

    // If user is not logged in, we only show basic online/offline status
    if (!user?.userId) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-base-100 border-t border-base-300 p-1 px-4 text-xs flex justify-between items-center z-50 shadow-lg">

            {/* LEFT: Connection Status */}
            <div className="flex items-center gap-3">
                {/* Network Icon */}
                {isOnline ? (
                    <div className="flex items-center gap-1 text-success font-bold">
                        <Wifi size={14} />
                        <span className="inline text-sm">متصل</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-error font-bold animate-pulse">
                        <WifiOff size={14} />
                        <span className="inline text-sm">لا يوجد إنترنت (وضع عدم الاتصال)</span>
                    </div>
                )}

                {/* Sync Spinner */}
                {isSyncing && (
                    <div className="flex items-center gap-1 text-info">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>جاري المزامنة ({phase === 'pulling' ? 'تحميل' : 'رفع'})...</span>
                    </div>
                )}

                {/* Sync Success (Idle) */}
                {!isSyncing && !isError && isOnline && user.userId !== 'unauthorized' && (
                    <div className="flex items-center gap-1 text-base-content/50">
                        <CheckCircle2 size={14} />
                        <span className="inline text-sm">تمت المزامنة</span>
                    </div>
                )}
                {user.userId == 'unauthorized' && (
                    <div className="flex items-center gap-1 text-base-content/50">
                        <X size={14} className='text-red-600' />
                        <span className="inline text-sm">غير مسجل</span>
                    </div>
                )}
            </div>

            {/* RIGHT: Error Messages */}
            {isError && (
                <div className="flex items-center gap-2 text-error font-bold bg-error/10 px-2 py-0.5 rounded">
                    <AlertTriangle size={14} />
                    <span>{errorMessage}</span>
                </div>
            )}
        </div>
    );
}