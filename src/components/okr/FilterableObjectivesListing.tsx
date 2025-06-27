"use client";

import { Plus, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listObjectivesAction } from "@/actions/okr";
import { CreateObjectiveDialog } from "@/components/okr/CreateObjectiveDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ObjectiveWithKeyResults } from "@/core/domain/okr/types";
import type { OKRFilters } from "./OKRFilterDialog";

interface FilterableObjectivesListingProps {
  filters: OKRFilters;
}

export function FilterableObjectivesListing({
  filters,
}: FilterableObjectivesListingProps) {
  const [objectives, setObjectives] = useState<{
    all: ObjectiveWithKeyResults[];
    personal: ObjectiveWithKeyResults[];
    team: ObjectiveWithKeyResults[];
    organization: ObjectiveWithKeyResults[];
  }>({
    all: [],
    personal: [],
    team: [],
    organization: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjectives = async () => {
      setLoading(true);

      try {
        // Build filter object from the filters state
        const baseFilter: {
          status?: "draft" | "active" | "completed" | "cancelled";
          startDate?: Date;
          endDate?: Date;
          type?: "personal" | "team" | "organization";
        } = {};

        if (filters.status) {
          baseFilter.status = filters.status;
        }

        if (filters.startDate) {
          baseFilter.startDate = filters.startDate;
        }

        if (filters.endDate) {
          baseFilter.endDate = filters.endDate;
        }

        // Fetch all objectives with filters
        const allResult = await listObjectivesAction({
          pagination: {
            page: 1,
            limit: 100,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: baseFilter,
        });

        // Fetch filtered by type
        const personalResult = await listObjectivesAction({
          pagination: {
            page: 1,
            limit: 100,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: { ...baseFilter, type: "personal" },
        });

        const teamResult = await listObjectivesAction({
          pagination: {
            page: 1,
            limit: 100,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: { ...baseFilter, type: "team" },
        });

        const organizationResult = await listObjectivesAction({
          pagination: {
            page: 1,
            limit: 100,
            order: "desc",
            orderBy: "createdAt",
          },
          filter: { ...baseFilter, type: "organization" },
        });

        const allObjectives = allResult.items;
        const personalObjectives = personalResult.items;
        const teamObjectives = teamResult.items;
        const organizationObjectives = organizationResult.items;

        // Apply client-side filtering for progress and type
        const applyClientFilters = (objs: ObjectiveWithKeyResults[]) => {
          return objs.filter((obj) => {
            // Progress filter
            if (filters.progressMin !== undefined) {
              if ((obj.progressPercentage || 0) < filters.progressMin) {
                return false;
              }
            }
            if (filters.progressMax !== undefined) {
              if ((obj.progressPercentage || 0) > filters.progressMax) {
                return false;
              }
            }

            // Type filter for "all" tab
            if (filters.type && obj.type !== filters.type) {
              return false;
            }

            return true;
          });
        };

        setObjectives({
          all: applyClientFilters(allObjectives),
          personal: applyClientFilters(personalObjectives),
          team: applyClientFilters(teamObjectives),
          organization: applyClientFilters(organizationObjectives),
        });
      } catch (error) {
        console.error("Failed to fetch objectives:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchObjectives();
  }, [filters]);

  if (loading) {
    return (
      <div className="space-y-4">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
          <Card key={key} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList>
        <TabsTrigger value="all">すべて ({objectives.all.length})</TabsTrigger>
        <TabsTrigger value="personal">
          個人 ({objectives.personal.length})
        </TabsTrigger>
        <TabsTrigger value="team">
          チーム ({objectives.team.length})
        </TabsTrigger>
        <TabsTrigger value="organization">
          組織 ({objectives.organization.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <ObjectivesList objectives={objectives.all} />
      </TabsContent>

      <TabsContent value="personal" className="space-y-4">
        <ObjectivesList objectives={objectives.personal} />
      </TabsContent>

      <TabsContent value="team" className="space-y-4">
        <ObjectivesList objectives={objectives.team} />
      </TabsContent>

      <TabsContent value="organization" className="space-y-4">
        <ObjectivesList objectives={objectives.organization} />
      </TabsContent>
    </Tabs>
  );
}

function ObjectivesList({
  objectives,
}: {
  objectives: ObjectiveWithKeyResults[];
}) {
  if (objectives.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            OKRがありません
          </h3>
          <p className="text-gray-600 text-center mb-6">
            条件に一致するOKRが見つかりませんでした。
          </p>
          <CreateObjectiveDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新しいOKRを作成
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
