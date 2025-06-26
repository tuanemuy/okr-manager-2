import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamsData } from "@/actions/team";
import { CreateTeamDialog } from "@/components/team/CreateTeamDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function TeamsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const teams = await getTeamsData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">チーム管理</h1>
          <p className="text-gray-600 mt-2">所属チームの管理と新規作成</p>
        </div>
        <CreateTeamDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新しいチーム
          </Button>
        </CreateTeamDialog>
      </div>

      {teams.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              チームがありません
            </h3>
            <p className="text-gray-600 text-center mb-6">
              新しいチームを作成して、メンバーと協力してOKRを管理しましょう。
            </p>
            <CreateTeamDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                最初のチームを作成
              </Button>
            </CreateTeamDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.items.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge
                    variant={team.role === "admin" ? "default" : "secondary"}
                  >
                    {team.role === "admin"
                      ? "管理者"
                      : team.role === "member"
                        ? "メンバー"
                        : "閲覧者"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {team.description || "説明がありません"}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{team.memberCount} メンバー</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {team.okrCount} OKR
                  </div>
                </div>

                <Link href={`/teams/${team.id}`}>
                  <Button className="w-full" variant="outline">
                    詳細を見る
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
