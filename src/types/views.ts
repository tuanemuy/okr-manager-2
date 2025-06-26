import type {
  KeyResult,
  Objective,
  OkrDashboardStats,
} from "@/core/domain/okr/types";
import type { Team } from "@/core/domain/team/types";

// Extended objective type with computed properties for frontend views
export type ObjectiveView = Objective & {
  progress: number;
  keyResults: (KeyResult & { progress: number })[];
  keyResultsCount: number;
  team?: { name: string; id: string };
};

// Extended team type with computed properties for frontend views
export type TeamView = Team & {
  members: Array<{
    id: string;
    userId: string;
    user: { name: string; email: string; avatarUrl?: string };
    role: { name: string; id: string };
    status: "invited" | "active" | "inactive";
    joinedAt?: Date;
  }>;
  okrs: ObjectiveView[];
  overallProgress: number;
  activeOkrCount: number;
  recentActivity: Array<{
    id: string;
    description: string;
    createdAt: Date;
    user: { name: string };
  }>;
};

// Extended dashboard type with computed properties for frontend views
export type DashboardView = OkrDashboardStats & {
  overallProgress: number;
  teamCount: number;
  quarterlyCompletion: number;
  recentObjectives: Array<{
    id: string;
    title: string;
    type: "personal" | "team" | "organization";
    progress: number;
    status: "draft" | "active" | "completed" | "cancelled";
    createdAt: Date;
  }>;
  teamActivity: Array<{
    id: string;
    name: string;
    memberCount: number;
    progress: number;
    activeOkrCount: number;
  }>;
};

// Paginated list response type
export type PaginatedResponse<T> = {
  items: T[];
  count: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Extended objective list with pagination
export type ObjectiveListView = PaginatedResponse<ObjectiveView>;

// Extended team list with stats
export type TeamListView = PaginatedResponse<
  Team & {
    memberCount: number;
    activeOkrCount: number;
  }
>;
