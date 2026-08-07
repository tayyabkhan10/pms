import { getCurrentUser } from "@/lib/auth";
import { AvatarUpload } from "@/components/AvatarUpload";
import { ProfileForm } from "./ProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AdminProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">My Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">Edit your own admin account.</p>

      <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <AvatarUpload name={user.name} url={user.avatarUrl} />
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <ProfileForm name={user.name} email={user.email} />
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
