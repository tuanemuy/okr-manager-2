import { Plus, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/actions/okr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const dashboard = await getDashboardData(user.id);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全体の進捗</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overallProgress.toFixed(1)}%
            </div>
            <Progress value={dashboard.overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブなOKR
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.activeObjectives}
            </div>
            <p className="text-xs text-muted-foreground">進行中の目標</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">チーム数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.teamCount}</div>
            <p className="text-xs text-muted-foreground">所属チーム</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              今四半期の達成率
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.quarterlyCompletion.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Q{Math.ceil((new Date().getMonth() + 1) / 3)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              最近のOKR
              <Link href="/okrs">
                <Button variant="outline" size="sm">
                  すべて見る
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recentObjectives.map((objective) => (
                <div
                  key={objective.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{objective.title}</h3>
                    <p className="text-sm text-gray-600">
                      {objective.keyResultsCount} つのKey Result
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {objective.progress.toFixed(1)}%
                    </div>
                    <Progress
                      value={objective.progress}
                      className="w-20 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              チーム活動
              <Link href="/teams">
                <Button variant="outline" size="sm">
                  チーム管理
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.teamActivity.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{team.name}</h3>
                    <p className="text-sm text-gray-600">
                      {team.memberCount} メンバー
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {team.progress.toFixed(1)}%
                    </div>
                    <Progress value={team.progress} className="w-20 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
