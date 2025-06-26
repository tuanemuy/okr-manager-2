import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentObjectives } from "@/components/dashboard/RecentObjectives";
import { TeamsActivity } from "@/components/dashboard/TeamsActivity";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            おかえりなさい, {user.name}さん
          </h1>
          <p className="text-gray-600 mt-2">OKRの進捗を確認しましょう</p>
        </div>
        <Link href="/okrs">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新しいOKR
          </Button>
        </Link>
      </div>

      <DashboardStats userId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentObjectives />
        <TeamsActivity userId={user.id} />
      </div>
    </div>
  );
}
