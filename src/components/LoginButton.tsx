import { useObservable } from "dexie-react-hooks";
import { db } from "../db";
import { LogIn, User } from "lucide-react";

export default function LoginButton() {
  const user = useObservable(db.cloud.currentUser);

  if (user && user.userId !== 'unauthorized') {
    return (
      <div className="flex items-center gap-2 bg-base-200 px-3 py-1 rounded-full text-xs font-bold">
        <User size={14} className="text-success" />
        <span className="hidden md:inline">{user.email}</span>
        <span className="badge badge-success badge-xs">متصل</span>
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