import { Users } from "lucide-react";
import Link from "next/link";
import { listTeamsAction } from "@/actions/team";
import { CreateTeamDialog } from "@/components/team/CreateTeamDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamsActivityProps {
  userId: string;
}

export async function TeamsActivity({ userId }: TeamsActivityProps) {
  try {
    const result = await listTeamsAction({
      pagination: {
        page: 1,
        limit: 5,
        order: "desc",
        orderBy: "createdAt",
      },
      filter: { memberId: userId },
    });

    const teams = result.items;

    return (
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
          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                チームがありません
              </h3>
              <p className="text-gray-600 text-center mb-6">
                新しいチームを作成して協力しましょう。
              </p>
              <CreateTeamDialog>
                <Button>最初のチームを作成</Button>
              </CreateTeamDialog>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{team.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {team.memberCount} メンバー • {team.activeOkrCount}{" "}
                      アクティブOKR
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {team.activeOkrCount > 0 ? "進行中" : "待機中"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (_error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>チーム活動</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">チーム情報を読み込めませんでした</p>
        </CardContent>
      </Card>
    );
  }
}
