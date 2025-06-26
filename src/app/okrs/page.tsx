import { Filter, Plus, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getObjectivesData } from "@/actions/okr";
import { CreateObjectiveDialog } from "@/components/okr/CreateObjectiveDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";

export default async function OKRsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const objectives = await getObjectivesData();

  const personalObjectives = {
    items: objectives.items.filter((obj) => obj.type === "personal"),
  };
  const teamObjectives = {
    items: objectives.items.filter((obj) => obj.type === "team"),
  };
  const organizationObjectives = {
    items: objectives.items.filter((obj) => obj.type === "organization"),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OKR管理</h1>
          <p className="text-gray-600 mt-2">目標と主要な結果を管理</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            フィルター
          </Button>
          <CreateObjectiveDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新しいOKR
            </Button>
          </CreateObjectiveDialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">すべて ({objectives.items.length})</TabsTrigger>
          <TabsTrigger value="personal">
            個人 ({personalObjectives.items.length})
          </TabsTrigger>
          <TabsTrigger value="team">
            チーム ({teamObjectives.items.length})
          </TabsTrigger>
          <TabsTrigger value="organization">
            組織 ({organizationObjectives.items.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ObjectivesList objectives={objectives} />
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <ObjectivesList objectives={personalObjectives} />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <ObjectivesList objectives={teamObjectives} />
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <ObjectivesList objectives={organizationObjectives} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ObjectivesList({ objectives }: { objectives: { items: any[] } }) {
  if (objectives.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            OKRがありません
          </h3>
          <p className="text-gray-600 text-center mb-6">
            新しいOKRを作成して目標の管理を始めましょう。
          </p>
          <CreateObjectiveDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              最初のOKRを作成
            </Button>
          </CreateObjectiveDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {objectives.items.map((objective) => (
        <Card key={objective.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-lg">{objective.title}</CardTitle>
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
                {objective.team && (
                  <Badge variant="outline">{objective.team.name}</Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {objective.progress.toFixed(1)}%
                </div>
                <Progress value={objective.progress} className="w-20 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {objective.description || "説明がありません"}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {objective.keyResultsCount} つのKey Result
              </div>
              <div className="text-sm text-gray-600">
                {new Date(objective.startDate).toLocaleDateString()} -{" "}
                {new Date(objective.endDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
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
              <Link href={`/okrs/${objective.id}`}>
                <Button variant="outline" size="sm">
                  詳細を見る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
