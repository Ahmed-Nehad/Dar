import { useObservable } from "dexie-react-hooks";
import { db } from "../db";
import { LogIn, LogOutIcon } from "lucide-react";

export default function LoginButton() {
  const user = useObservable(db.cloud.currentUser);

  const handleLogout = async () => {
    const isConfirmed = window.confirm(
      "هل أنت متأكد من تسجيل الخروج؟\n\n" +
      "⚠️ تحذير: سيتم مسح البيانات المحلية من هذا الجهاز لحماية خصوصيتك.\n" +
      "تأكد أنك متصل بالإنترنت لضمان مزامنة أحدث التغييرات قبل الخروج."
    );

    if (isConfirmed) {
      await db.cloud.logout();
    }
  };

  if (user && user.userId !== 'unauthorized') {
    return (
      <div className="flex items-center gap-2 bg-base-200 px-3 py-1 rounded-full text-xs font-bold">
        <button onClick={handleLogout}>
          <LogOutIcon size={14} className="text-error" />
        </button>
        <span className="hidden md:inline">{user.email}</span>
        <span className="badge badge-success badge-xs text-success-content">متصل</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => db.cloud.login()}
      className="btn btn-sm btn-outline btn-primary gap-2"
    >
      <LogIn size={16} />
      دخول
    </button>
  );
}