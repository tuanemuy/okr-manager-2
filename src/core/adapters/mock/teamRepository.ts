import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type TeamRepository,
  TeamRepositoryError,
} from "@/core/domain/team/ports/teamRepository";
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
} from "@/core/domain/team/types";

export class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();
  private members: Map<string, TeamMember> = new Map();
  private invitations: Map<string, TeamInvitation> = new Map();
  private userTeamMemberships: Map<string, Set<string>> = new Map();

  async create(
    params: CreateTeamParams,
  ): Promise<Result<Team, TeamRepositoryError>> {
    const id = uuidv7();
    const now = new Date();

    const team: Team = {
      id,
      name: params.name,
      description: params.description,
      createdById: params.createdById,
      createdAt: now,
      updatedAt: now,
    };

    this.teams.set(id, team);
    return ok(team);
  }

  async findById(
    id: string,
  ): Promise<Result<Team | null, TeamRepositoryError>> {
    const team = this.teams.get(id);
    return ok(team || null);
  }

  async findByIdWithStats(
    id: string,
  ): Promise<Result<TeamWithStats | null, TeamRepositoryError>> {
    const team = this.teams.get(id);
    if (!team) {
      return ok(null);
    }

    // Count members
    const memberCount = Array.from(this.members.values()).filter(
      (member) => member.teamId === id && member.status === "active",
    ).length;

    const teamWithStats: TeamWithStats = {
      ...team,
      memberCount,
      activeOkrCount: 0, // Simplified for testing
    };

    return ok(teamWithStats);
  }

  async update(
    params: UpdateTeamParams,
  ): Promise<Result<Team, TeamRepositoryError>> {
    const team = this.teams.get(params.id);
    if (!team) {
      return err(new TeamRepositoryError("Team not found"));
    }

    const updatedTeam: Team = {
      ...team,
      name: params.name ?? team.name,
      description: params.description ?? team.description,
      updatedAt: new Date(),
    };

    this.teams.set(params.id, updatedTeam);
    return ok(updatedTeam);
  }

  async delete(id: string): Promise<Result<void, TeamRepositoryError>> {
    if (!this.teams.has(id)) {
      return err(new TeamRepositoryError("Team not found"));
    }

    this.teams.delete(id);

    // Remove all members
    for (const [memberId, member] of this.members.entries()) {
      if (member.teamId === id) {
        this.members.delete(memberId);

        // Update user memberships
        const userMemberships = this.userTeamMemberships.get(member.userId);
        if (userMemberships) {
          userMemberships.delete(id);
          if (userMemberships.size === 0) {
            this.userTeamMemberships.delete(member.userId);
          }
        }
      }
    }

    return ok(undefined);
  }

  async list(
    query: ListTeamsQuery,
  ): Promise<
    Result<{ items: TeamWithStats[]; count: number }, TeamRepositoryError>
  > {
    let teams = Array.from(this.teams.values());

    // Apply filters
    if (query.filter?.search) {
      const searchTerm = query.filter.search.toLowerCase();
      teams = teams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm) ||
          team.description?.toLowerCase().includes(searchTerm),
      );
    }

    if (query.filter?.userId) {
      const userTeams =
        this.userTeamMemberships.get(query.filter.userId) || new Set();
      teams = teams.filter((team) => userTeams.has(team.id));
    }

    // Convert to TeamWithStats
    const teamsWithStats: TeamWithStats[] = teams.map((team) => {
      const memberCount = Array.from(this.members.values()).filter(
        (member) => member.teamId === team.id && member.status === "active",
      ).length;

      return {
        ...team,
        memberCount,
        activeOkrCount: 0, // Simplified
      };
    });

    // Apply pagination
    const startIndex = (query.pagination.page - 1) * query.pagination.limit;
    const endIndex = startIndex + query.pagination.limit;
    const paginatedTeams = teamsWithStats.slice(startIndex, endIndex);

    return ok({
      items: paginatedTeams,
      count: teamsWithStats.length,
    });
  }

  async addMember(
    params: AddTeamMemberParams,
  ): Promise<Result<TeamMember, TeamRepositoryError>> {
    if (!this.teams.has(params.teamId)) {
      return err(new TeamRepositoryError("Team not found"));
    }

    const id = uuidv7();
    const now = new Date();

    const member: TeamMember = {
      id,
      teamId: params.teamId,
      userId: params.userId,
      roleId: params.roleId,
      invitedById: params.invitedById,
      invitedAt: now,
      joinedAt: now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.members.set(id, member);

    // Update user memberships index
    const userMemberships =
      this.userTeamMemberships.get(params.userId) || new Set();
    userMemberships.add(params.teamId);
    this.userTeamMemberships.set(params.userId, userMemberships);

    return ok(member);
  }

  async findMember(
    teamId: string,
    userId: string,
  ): Promise<Result<TeamMember | null, TeamRepositoryError>> {
    for (const member of this.members.values()) {
      if (member.teamId === teamId && member.userId === userId) {
        return ok(member);
      }
    }
    return ok(null);
  }

  async findMemberById(
    id: string,
  ): Promise<Result<TeamMember | null, TeamRepositoryError>> {
    const member = this.members.get(id);
    return ok(member || null);
  }

  async updateMember(
    params: UpdateTeamMemberParams,
  ): Promise<Result<TeamMember, TeamRepositoryError>> {
    const member = this.members.get(params.id);
    if (!member) {
      return err(new TeamRepositoryError("Team member not found"));
    }

    const updatedMember: TeamMember = {
      ...member,
      roleId: params.roleId ?? member.roleId,
      status: params.status ?? member.status,
      updatedAt: new Date(),
    };

    this.members.set(params.id, updatedMember);
    return ok(updatedMember);
  }

  async removeMember(id: string): Promise<Result<void, TeamRepositoryError>> {
    const member = this.members.get(id);
    if (!member) {
      return err(new TeamRepositoryError("Team member not found"));
    }

    this.members.delete(id);

    // Update user memberships index
    const userMemberships = this.userTeamMemberships.get(member.userId);
    if (userMemberships) {
      userMemberships.delete(member.teamId);
      if (userMemberships.size === 0) {
        this.userTeamMemberships.delete(member.userId);
      }
    }

    return ok(undefined);
  }

  async listMembers(
    teamId: string,
    query: ListTeamMembersQuery,
  ): Promise<
    Result<{ items: TeamMember[]; count: number }, TeamRepositoryError>
  > {
    let members = Array.from(this.members.values()).filter(
      (member) => member.teamId === teamId,
    );

    // Apply filters
    if (query.filter?.status) {
      members = members.filter(
        (member) => member.status === query.filter?.status,
      );
    }

    if (query.filter?.roleId) {
      members = members.filter(
        (member) => member.roleId === query.filter?.roleId,
      );
    }

    // Apply pagination
    const startIndex = (query.pagination.page - 1) * query.pagination.limit;
    const endIndex = startIndex + query.pagination.limit;
    const paginatedMembers = members.slice(startIndex, endIndex);

    return ok({
      items: paginatedMembers,
      count: members.length,
    });
  }

  async createInvitation(
    params: CreateTeamInvitationParams,
  ): Promise<Result<TeamInvitation, TeamRepositoryError>> {
    const id = uuidv7();
    const now = new Date();

    const invitation: TeamInvitation = {
      id,
      teamId: params.teamId,
      email: params.email,
      roleId: params.roleId,
      invitedById: params.invitedById,
      token: params.token,
      expiresAt: params.expiresAt,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    this.invitations.set(id, invitation);
    return ok(invitation);
  }

  async findInvitationByToken(
    token: string,
  ): Promise<Result<TeamInvitation | null, TeamRepositoryError>> {
    for (const invitation of this.invitations.values()) {
      if (invitation.token === token) {
        return ok(invitation);
      }
    }
    return ok(null);
  }

  async findInvitationById(
    id: string,
  ): Promise<Result<TeamInvitation | null, TeamRepositoryError>> {
    const invitation = this.invitations.get(id);
    return ok(invitation || null);
  }

  async updateInvitationStatus(
    id: string,
    status: "accepted" | "expired" | "cancelled",
  ): Promise<Result<void, TeamRepositoryError>> {
    const invitation = this.invitations.get(id);
    if (!invitation) {
      return err(new TeamRepositoryError("Invitation not found"));
    }

    const updatedInvitation: TeamInvitation = {
      ...invitation,
      status,
      updatedAt: new Date(),
    };

    this.invitations.set(id, updatedInvitation);
    return ok(undefined);
  }

  async listInvitations(
    teamId: string,
  ): Promise<Result<TeamInvitation[], TeamRepositoryError>> {
    const invitations = Array.from(this.invitations.values()).filter(
      (invitation) => invitation.teamId === teamId,
    );
    return ok(invitations);
  }

  async isUserMember(
    teamId: string,
    userId: string,
  ): Promise<Result<boolean, TeamRepositoryError>> {
    const userMemberships = this.userTeamMemberships.get(userId);
    return ok(userMemberships ? userMemberships.has(teamId) : false);
  }

  async getUserRoleInTeam(
    teamId: string,
    userId: string,
  ): Promise<Result<string | null, TeamRepositoryError>> {
    for (const member of this.members.values()) {
      if (
        member.teamId === teamId &&
        member.userId === userId &&
        member.status === "active"
      ) {
        return ok(member.roleId);
      }
    }
    return ok(null);
  }

  // Helper methods for testing
  clear(): void {
    this.teams.clear();
    this.members.clear();
    this.invitations.clear();
    this.userTeamMemberships.clear();
  }

  seedTeams(teams: Team[]): void {
    for (const team of teams) {
      this.teams.set(team.id, team);
    }
  }

  seedMembers(members: TeamMember[]): void {
    for (const member of members) {
      this.members.set(member.id, member);

      const userMemberships =
        this.userTeamMemberships.get(member.userId) || new Set();
      userMemberships.add(member.teamId);
      this.userTeamMemberships.set(member.userId, userMemberships);
    }
  }
}
