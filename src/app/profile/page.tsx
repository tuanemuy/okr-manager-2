import { redirect } from "next/navigation";
import { ProfileForms } from "@/components/profile/ProfileForms";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-2xl">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">プロフィール設定</h1>
          <p className="text-gray-600 mt-2">アカウント情報の管理</p>
        </div>
      </div>

      <ProfileForms user={user} />
    </div>
  );
}
