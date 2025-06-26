import {
  Mail,
  MoreHorizontal,
  Plus,
  Settings,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamData } from "@/actions/team";
import { InviteTeamMemberDialog } from "@/components/team/InviteTeamMemberDialog";
import { TeamSettingsDialog } from "@/components/team/TeamSettingsDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const team = await getTeamData(id);

  const isAdmin =
    team.members.find((m) => m.userId === user.id)?.role?.name === "admin";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
          <p className="text-gray-600">
            {team.description || "説明がありません"}
          </p>
        </div>
        <div className="flex space-x-2">
          {isAdmin && (
            <>
              <InviteTeamMemberDialog teamId={team.id}>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  メンバー招待
                </Button>
              </InviteTeamMemberDialog>
              <TeamSettingsDialog team={team}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </Button>
              </TeamSettingsDialog>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="members">
            メンバー ({team.members.length})
          </TabsTrigger>
          <TabsTrigger value="okrs">OKR ({team.okrs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  チーム進捗
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {team.overallProgress.toFixed(1)}%
                </div>
                <Progress value={team.overallProgress} className="mt-2" />
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
                <div className="text-2xl font-bold">{team.activeOkrCount}</div>
                <p className="text-xs text-muted-foreground">進行中の目標</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  メンバー数
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{team.members.length}</div>
                <p className="text-xs text-muted-foreground">チームメンバー</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>最近の活動</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    最近のアクティビティがありません
                  </p>
                ) : (
                  team.recentActivity.map((activity, index) => {
                    const activityItem = activity as {
                      description: string;
                      createdAt: string;
                    };
                    return (
                      <div
                        key={`activity-${index}-${Date.now()}`}
                        className="flex items-center space-x-3 text-sm"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-gray-600">
                          {activityItem.description}
                        </span>
                        <span className="text-gray-400 ml-auto">
                          {new Date(
                            activityItem.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">チームメンバー</h3>
            {isAdmin && (
              <InviteTeamMemberDialog teamId={team.id}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  メンバー招待
                </Button>
              </InviteTeamMemberDialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.members.map((member) => (
              <Card key={member.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-gray-600">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          member.role?.name === "admin"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {member.role?.name === "admin"
                          ? "管理者"
                          : member.role?.name === "member"
                            ? "メンバー"
                            : "閲覧者"}
                      </Badge>
                      {isAdmin && member.userId !== user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>役割を変更</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              チームから削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="okrs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">チームOKR</h3>
            <Link href="/okrs">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新しいOKR
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {team.okrs.map((okr) => (
              <Card key={okr.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{okr.title}</h3>
                      <p className="text-gray-600 mt-1">{okr.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {okr.progressPercentage?.toFixed(1) ?? 0}%
                      </div>
                      <Progress
                        value={okr.progressPercentage ?? 0}
                        className="w-20 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{okr.keyResults.length} つのKey Result</span>
                    <span>
                      {new Date(okr.startDate).toLocaleDateString()} -{" "}
                      {new Date(okr.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4">
                    <Link href={`/okrs/${okr.id}`}>
                      <Button variant="outline" size="sm">
                        詳細を見る
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
