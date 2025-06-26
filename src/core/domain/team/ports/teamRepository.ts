import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type {
  AddTeamMemberParams,
  CreateTeamInvitationParams,
  CreateTeamParams,
  ListTeamMembersQuery,
  ListTeamsQuery,
  Team,
  TeamInvitation,
  TeamMember,
  TeamWithStats,
  UpdateTeamMemberParams,
  UpdateTeamParams,
} from "../types";

export class TeamRepositoryError extends AnyError {
  override readonly name = "TeamRepositoryError";
}

export interface TeamRepository {
  // Team CRUD operations
  create(params: CreateTeamParams): Promise<Result<Team, TeamRepositoryError>>;

  findById(id: string): Promise<Result<Team | null, TeamRepositoryError>>;

  findByIdWithStats(
    id: string,
  ): Promise<Result<TeamWithStats | null, TeamRepositoryError>>;

  update(params: UpdateTeamParams): Promise<Result<Team, TeamRepositoryError>>;

  delete(id: string): Promise<Result<void, TeamRepositoryError>>;

  list(
    query: ListTeamsQuery,
  ): Promise<
    Result<{ items: TeamWithStats[]; count: number }, TeamRepositoryError>
  >;

  // Team member operations
  addMember(
    params: AddTeamMemberParams,
  ): Promise<Result<TeamMember, TeamRepositoryError>>;

  findMember(
    teamId: string,
    userId: string,
  ): Promise<Result<TeamMember | null, TeamRepositoryError>>;

  findMemberById(
    id: string,
  ): Promise<Result<TeamMember | null, TeamRepositoryError>>;

  updateMember(
    params: UpdateTeamMemberParams,
  ): Promise<Result<TeamMember, TeamRepositoryError>>;

  removeMember(id: string): Promise<Result<void, TeamRepositoryError>>;

  listMembers(
    teamId: string,
    query: ListTeamMembersQuery,
  ): Promise<
    Result<{ items: TeamMember[]; count: number }, TeamRepositoryError>
  >;

  // Team invitation operations
  createInvitation(
    params: CreateTeamInvitationParams,
  ): Promise<Result<TeamInvitation, TeamRepositoryError>>;

  findInvitationByToken(
    token: string,
  ): Promise<Result<TeamInvitation | null, TeamRepositoryError>>;

  findInvitationById(
    id: string,
  ): Promise<Result<TeamInvitation | null, TeamRepositoryError>>;

  updateInvitationStatus(
    id: string,
    status: "accepted" | "expired" | "cancelled",
  ): Promise<Result<void, TeamRepositoryError>>;

  listInvitations(
    teamId: string,
  ): Promise<Result<TeamInvitation[], TeamRepositoryError>>;

  // Utility methods
  isUserMember(
    teamId: string,
    userId: string,
  ): Promise<Result<boolean, TeamRepositoryError>>;

  getUserRoleInTeam(
    teamId: string,
    userId: string,
  ): Promise<Result<string | null, TeamRepositoryError>>;
}
