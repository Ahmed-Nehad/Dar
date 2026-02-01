import { useState } from 'react';
import { useObservable } from "dexie-react-hooks";
import { db } from "../db";
import { LogIn, LogOut, Loader2, FileWarning, Check } from "lucide-react";
import toast from 'react-hot-toast'; 
import { usePostHog } from '@posthog/react';

export default function LoginButton() {

  const postHog = usePostHog();

  const user = useObservable(db.cloud.currentUser);
  const [isBusy, setIsBusy] = useState(false);

  // ✅ FIX: Create a strict boolean that filters out the "unauthorized" string
  const isLoggedIn = user?.userId && user.userId !== 'unauthorized';

  // --- LOGIN LOGIC ---
  const handleLogin = async () => {
    setIsBusy(true); 

    postHog?.startSessionRecording();
    postHog?.capture('login_attempt', { method: 'popup' });

    const toastId = toast.loading("جاري فتح نافذة الدخول... الرجاء المتابعة في النافذة المنبثقة");

    try {
      await db.cloud.login();

      postHog?.identify(user?.userId, { email: user?.email });
      postHog?.capture('login_success');

      toast.success("تم الدخول بنجاح! جاري تحميل البيانات...", { id: toastId });
    } catch (error: any) {
      postHog?.capture('login_failure', {
        reason: error.message,
        error_name: error.name
      });

      console.error("Login Error:", error);
      if (error.name === 'AbortError' || error.message?.includes('Cancelled')) {
        toast.error("تم إلغاء العملية", { id: toastId });
      } else {
        toast.error(`خطأ: ${error.message}`, { id: toastId });
      }
    } finally {
      setIsBusy(false);
      postHog?.stopSessionRecording();
    }
  };

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    if (!window.confirm("سيتم مسح البيانات المحلية. هل أنت متأكد؟")) return;
    
    const toastId = toast.loading("جاري تسجيل الخروج...");
    setIsBusy(true);

    try {
      await db.cloud.logout();
      toast.success("تم الخروج بنجاح", { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error("فشل الخروج", { id: toastId });
      setIsBusy(false);
    }
  };

  // --- RENDER ---
  
  // 1. Logged In View (Strict Check)
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <div className="badge badge-success gap-2 p-3 shadow-sm transition-all duration-300">
          <span className="text-xs font-mono ph-mask">{user?.email}</span>
          <span className="md:hidden text-xs">متصل</span>
          <Check size={14} />
        </div>
        <button 
          onClick={handleLogout} 
          disabled={isBusy}
          className="btn btn-sm btn-ghost btn-circle text-error hover:bg-error/10 disabled:opacity-50" 
          title="تسجيل الخروج"
        >
          {isBusy ? <Loader2 className="animate-spin" size={18}/> : <LogOut size={18} />}
        </button>
      </div>
    );
  }

  // 2. Logged Out View (Guest)
  return (
    <div className="flex items-center gap-2">
      {!isBusy && (
        <span className="text-[10px] text-warning hidden lg:inline font-bold animate-pulse">
           <FileWarning size={14} />
          <span>
           غير محفوظ
          </span>
        </span>
      )}
      
      <button 
        onClick={handleLogin} 
        disabled={isBusy}
        className="btn btn-xs md:btn-sm btn-warning btn-outline gap-2 shadow-sm disabled:border-base-300 disabled:text-base-content/50"
      >
        {isBusy ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            <span className="inline text-sm">جاري الدخول...</span>
          </>
        ) : (
          <>
            <LogIn size={14} />
            <span className="inline text-sm">حفظ البيانات</span>
          </>
        )}
      </button>
    </div>
  );
}