import { Edit, Plus, Settings, Target, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getObjectiveData } from "@/actions/okr";
import { CreateKeyResultDialog } from "@/components/okr/CreateKeyResultDialog";
import { DeleteKeyResultDialog } from "@/components/okr/DeleteKeyResultDialog";
import { UpdateKeyResultDialog } from "@/components/okr/UpdateKeyResultDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";

interface OKRDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OKRDetailPage({ params }: OKRDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const objective = await getObjectiveData(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {objective.title}
            </h1>
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
            {objective.type === "team" && objective.teamId && (
              <Badge variant="outline">チームOKR</Badge>
            )}
          </div>
          <p className="text-gray-600 mb-4">
            {objective.description || "説明がありません"}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              {new Date(objective.startDate).toLocaleDateString()} -{" "}
              {new Date(objective.endDate).toLocaleDateString()}
            </span>
            <Badge
              variant={
                objective.status === "active"
                  ? "default"
                  : objective.status === "completed"
                    ? "secondary"
                    : "outline"
              }
            >
              {objective.status === "active"
                ? "進行中"
                : objective.status === "completed"
                  ? "完了"
                  : "計画中"}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            設定
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全体の進捗</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {objective.progress.toFixed(1)}%
            </div>
            <Progress value={objective.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {objective.keyResults.length}
            </div>
            <p className="text-xs text-muted-foreground">主要な結果</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了済み</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {objective.keyResults.filter((kr) => kr.progress >= 100).length}
            </div>
            <p className="text-xs text-muted-foreground">Key Results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">残り日数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(
                0,
                Math.ceil(
                  (new Date(objective.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">日</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Key Results</CardTitle>
            <CreateKeyResultDialog objectiveId={objective.id}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Key Resultを追加
              </Button>
            </CreateKeyResultDialog>
          </div>
        </CardHeader>
        <CardContent>
          {objective.keyResults.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Key Resultsがありません
              </h3>
              <p className="text-gray-600 mb-6">
                目標を測定可能な結果に分解してください。
              </p>
              <CreateKeyResultDialog objectiveId={objective.id}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  最初のKey Resultを追加
                </Button>
              </CreateKeyResultDialog>
            </div>
          ) : (
            <div className="space-y-4">
              {objective.keyResults.map((keyResult) => (
                <Card
                  key={keyResult.id}
                  className="border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">
                          {keyResult.title}
                        </h3>
                        {keyResult.description && (
                          <p className="text-gray-600 mt-1">
                            {keyResult.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <UpdateKeyResultDialog keyResult={keyResult}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </UpdateKeyResultDialog>
                        <DeleteKeyResultDialog
                          keyResultId={keyResult.id}
                          keyResultTitle={keyResult.title}
                        >
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteKeyResultDialog>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {keyResult.currentValue.toLocaleString()} /{" "}
                          {keyResult.targetValue.toLocaleString()}{" "}
                          {keyResult.unit}
                        </span>
                        <Badge
                          variant={
                            keyResult.progress >= 100
                              ? "default"
                              : keyResult.progress >= 70
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {keyResult.progress >= 100
                            ? "達成"
                            : keyResult.progress >= 70
                              ? "順調"
                              : "要注意"}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {keyResult.progress.toFixed(1)}%
                      </div>
                    </div>

                    <Progress value={keyResult.progress} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
