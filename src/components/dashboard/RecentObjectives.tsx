import { Target } from "lucide-react";
import Link from "next/link";
import { listObjectivesAction } from "@/actions/okr";
import { CreateObjectiveDialog } from "@/components/okr/CreateObjectiveDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";

export async function RecentObjectives() {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const result = await listObjectivesAction({
      pagination: {
        page: 1,
        limit: 5,
        order: "desc",
        orderBy: "createdAt",
      },
    });

    const objectives = result.items;

    return (
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
          {objectives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                OKRがありません
              </h3>
              <p className="text-gray-600 text-center mb-6">
                新しいOKRを作成して目標の管理を始めましょう。
              </p>
              <CreateObjectiveDialog>
                <Button>最初のOKRを作成</Button>
              </CreateObjectiveDialog>
            </div>
          ) : (
            <div className="space-y-4">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{objective.title}</h3>
                      <Badge
                        variant={
                          objective.type === "personal"
                            ? "default"
                            : objective.type === "team"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {objective.type === "personal"
                          ? "個人"
                          : objective.type === "team"
                            ? "チーム"
                            : "組織"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {objective.status === "active"
                        ? "進行中"
                        : objective.status === "completed"
                          ? "完了"
                          : "計画中"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {(objective.progressPercentage ?? 0).toFixed(1)}%
                    </div>
                    <Progress
                      value={objective.progressPercentage ?? 0}
                      className="w-20 mt-1"
                    />
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
          <CardTitle>最近のOKR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">OKRを読み込めませんでした</p>
        </CardContent>
      </Card>
    );
  }
}
