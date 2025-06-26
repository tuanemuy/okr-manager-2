import { Plus, Target } from "lucide-react";
import Link from "next/link";
import { context } from "@/actions/context";
import { CreateObjectiveDialog } from "@/components/okr/CreateObjectiveDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ObjectiveWithKeyResults } from "@/core/domain/okr/types";
import { listObjectives } from "@/core/application/okr/listObjectives";
import { getCurrentUser } from "@/lib/auth";

export async function ObjectivesListing() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch all objectives
  const allResult = await listObjectives(context, user.id, {
    pagination: { page: 1, limit: 50, order: "desc", orderBy: "createdAt" },
  });

  // Fetch personal objectives
  const personalResult = await listObjectives(context, user.id, {
    pagination: { page: 1, limit: 50, order: "desc", orderBy: "createdAt" },
    filter: { type: "personal" },
  });

  // Fetch team objectives
  const teamResult = await listObjectives(context, user.id, {
    pagination: { page: 1, limit: 50, order: "desc", orderBy: "createdAt" },
    filter: { type: "team" },
  });

  // Fetch organization objectives
  const organizationResult = await listObjectives(context, user.id, {
    pagination: { page: 1, limit: 50, order: "desc", orderBy: "createdAt" },
    filter: { type: "organization" },
  });

  const allObjectives = allResult.isOk() ? allResult.value.items : [];
  const personalObjectives = personalResult.isOk()
    ? personalResult.value.items
    : [];
  const teamObjectives = teamResult.isOk() ? teamResult.value.items : [];
  const organizationObjectives = organizationResult.isOk()
    ? organizationResult.value.items
    : [];

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList>
        <TabsTrigger value="all">すべて ({allObjectives.length})</TabsTrigger>
        <TabsTrigger value="personal">
          個人 ({personalObjectives.length})
        </TabsTrigger>
        <TabsTrigger value="team">チーム ({teamObjectives.length})</TabsTrigger>
        <TabsTrigger value="organization">
          組織 ({organizationObjectives.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <ObjectivesList objectives={allObjectives} />
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
  );
}

function ObjectivesList({ objectives }: { objectives: ObjectiveWithKeyResults[] }) {
  if (objectives.length === 0) {
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
      {objectives.map((objective) => (
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
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 line-clamp-2">
              {objective.description || "説明がありません"}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {objective.keyResults?.length ?? 0} つのKey Result
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
