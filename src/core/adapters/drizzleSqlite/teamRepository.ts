import { and, count, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type {
  TeamRepository,
  TeamRepositoryError,
} from "@/core/domain/team/ports/teamRepository";
import { TeamRepositoryError as TeamRepoError } from "@/core/domain/team/ports/teamRepository";
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
import {
  teamInvitationSchema,
  teamMemberSchema,
  teamSchema,
  teamWithStatsSchema,
} from "@/core/domain/team/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { objectives, teamInvitations, teamMembers, teams } from "./schema";

export class DrizzleSqliteTeamRepository implements TeamRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateTeamParams,
  ): Promise<Result<Team, TeamRepositoryError>> {
    try {
      const result = await this.db
        .insert(teams)
        .values({
          name: params.name,
          description: params.description,
          createdById: params.createdById,
        })
        .returning();

      const team = result[0];
      if (!team) {
        return err(new TeamRepoError("Failed to create team"));
      }

      return validate(teamSchema, team).mapErr((error) => {
        return new TeamRepoError("Invalid team data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to create team", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Team | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
        .limit(1);

      const team = result[0];
      if (!team) {
        return ok(null);
      }

      return validate(teamSchema, team).mapErr((error) => {
        return new TeamRepoError("Invalid team data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to find team", error));
    }
  }

  async findByIdWithStats(
    id: string,
  ): Promise<Result<TeamWithStats | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          createdById: teams.createdById,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
          memberCount: count(teamMembers.id),
          activeOkrCount: count(objectives.id),
        })
        .from(teams)
        .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
        .leftJoin(
          objectives,
          and(eq(teams.id, objectives.teamId), eq(objectives.status, "active")),
        )
        .where(eq(teams.id, id))
        .groupBy(teams.id)
        .limit(1);

      const team = result[0];
      if (!team) {
        return ok(null);
      }

      return validate(teamWithStatsSchema, team).mapErr((error) => {
        return new TeamRepoError("Invalid team data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to find team with stats", error));
    }
  }

  async update(
    params: UpdateTeamParams,
  ): Promise<Result<Team, TeamRepositoryError>> {
    try {
      const updateData: Partial<typeof teams.$inferInsert> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;

      if (Object.keys(updateData).length === 0) {
        const existingTeam = await this.findById(params.id);
        if (existingTeam.isErr()) return err(existingTeam.error);
        if (!existingTeam.value) {
          return err(new TeamRepoError("Team not found"));
        }
        return ok(existingTeam.value);
      }

      const result = await this.db
        .update(teams)
        .set(updateData)
        .where(eq(teams.id, params.id))
        .returning();

      const team = result[0];
      if (!team) {
        return err(new TeamRepoError("Team not found"));
      }

      return validate(teamSchema, team).mapErr((error) => {
        return new TeamRepoError("Invalid team data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to update team", error));
    }
  }

  async delete(id: string): Promise<Result<void, TeamRepositoryError>> {
    try {
      const result = await this.db.delete(teams).where(eq(teams.id, id));

      if (result.rowsAffected === 0) {
        return err(new TeamRepoError("Team not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new TeamRepoError("Failed to delete team", error));
    }
  }

  async list(
    query: ListTeamsQuery,
  ): Promise<
    Result<{ items: TeamWithStats[]; count: number }, TeamRepositoryError>
  > {
    try {
      const { pagination, filter } = query;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const whereConditions = [];

      if (filter?.search) {
        whereConditions.push(like(teams.name, `%${filter.search}%`));
      }

      if (filter?.userId) {
        // Filter teams where user is a member
        const userTeamsSubquery = this.db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.userId, filter.userId));

        whereConditions.push(sql`${teams.id} IN ${userTeamsSubquery}`);
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await this.db
        .select({ count: count() })
        .from(teams)
        .where(whereClause);

      const totalCount = countResult[0]?.count ?? 0;

      // Get teams with stats
      const teamsResult = await this.db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          createdById: teams.createdById,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
          memberCount: count(teamMembers.id),
          activeOkrCount: count(objectives.id),
        })
        .from(teams)
        .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
        .leftJoin(
          objectives,
          and(eq(teams.id, objectives.teamId), eq(objectives.status, "active")),
        )
        .where(whereClause)
        .groupBy(teams.id)
        .limit(limit)
        .offset(offset);

      const validatedTeams = [];
      for (const team of teamsResult) {
        const validationResult = validate(teamWithStatsSchema, team);
        if (validationResult.isErr()) {
          return err(
            new TeamRepoError("Invalid team data", validationResult.error),
          );
        }
        validatedTeams.push(validationResult.value);
      }

      return ok({
        items: validatedTeams,
        count: totalCount,
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to list teams", error));
    }
  }

  async addMember(
    params: AddTeamMemberParams,
  ): Promise<Result<TeamMember, TeamRepositoryError>> {
    try {
      const result = await this.db
        .insert(teamMembers)
        .values({
          teamId: params.teamId,
          userId: params.userId,
          roleId: params.roleId,
          invitedById: params.invitedById,
          invitedAt: new Date(),
          status: "invited",
        })
        .returning();

      const member = result[0];
      if (!member) {
        return err(new TeamRepoError("Failed to add team member"));
      }

      return validate(teamMemberSchema, member).mapErr((error) => {
        return new TeamRepoError("Invalid team member data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to add team member", error));
    }
  }

  async findMember(
    teamId: string,
    userId: string,
  ): Promise<Result<TeamMember | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teamMembers)
        .where(
          and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        )
        .limit(1);

      const member = result[0];
      if (!member) {
        return ok(null);
      }

      return validate(teamMemberSchema, member).mapErr((error) => {
        return new TeamRepoError("Invalid team member data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to find team member", error));
    }
  }

  async findMemberById(
    id: string,
  ): Promise<Result<TeamMember | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, id))
        .limit(1);

      const member = result[0];
      if (!member) {
        return ok(null);
      }

      return validate(teamMemberSchema, member).mapErr((error) => {
        return new TeamRepoError("Invalid team member data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to find team member", error));
    }
  }

  async updateMember(
    params: UpdateTeamMemberParams,
  ): Promise<Result<TeamMember, TeamRepositoryError>> {
    try {
      const updateData: Partial<typeof teamMembers.$inferInsert> = {};
      if (params.roleId !== undefined) updateData.roleId = params.roleId;
      if (params.status !== undefined) updateData.status = params.status;

      if (Object.keys(updateData).length === 0) {
        const existingMember = await this.findMemberById(params.id);
        if (existingMember.isErr()) return err(existingMember.error);
        if (!existingMember.value) {
          return err(new TeamRepoError("Team member not found"));
        }
        return ok(existingMember.value);
      }

      // Set joinedAt if status is being changed to active
      if (params.status === "active") {
        updateData.joinedAt = new Date();
      }

      const result = await this.db
        .update(teamMembers)
        .set(updateData)
        .where(eq(teamMembers.id, params.id))
        .returning();

      const member = result[0];
      if (!member) {
        return err(new TeamRepoError("Team member not found"));
      }

      return validate(teamMemberSchema, member).mapErr((error) => {
        return new TeamRepoError("Invalid team member data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to update team member", error));
    }
  }

  async removeMember(id: string): Promise<Result<void, TeamRepositoryError>> {
    try {
      const result = await this.db
        .delete(teamMembers)
        .where(eq(teamMembers.id, id));

      if (result.rowsAffected === 0) {
        return err(new TeamRepoError("Team member not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new TeamRepoError("Failed to remove team member", error));
    }
  }

  async listMembers(
    teamId: string,
    query: ListTeamMembersQuery,
  ): Promise<
    Result<{ items: TeamMember[]; count: number }, TeamRepositoryError>
  > {
    try {
      const { pagination, filter } = query;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const whereConditions = [eq(teamMembers.teamId, teamId)];

      if (filter?.status) {
        whereConditions.push(eq(teamMembers.status, filter.status));
      }

      if (filter?.roleId) {
        whereConditions.push(eq(teamMembers.roleId, filter.roleId));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const countResult = await this.db
        .select({ count: count() })
        .from(teamMembers)
        .where(whereClause);

      const totalCount = countResult[0]?.count ?? 0;

      // Get members
      const membersResult = await this.db
        .select()
        .from(teamMembers)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      const validatedMembers = [];
      for (const member of membersResult) {
        const validationResult = validate(teamMemberSchema, member);
        if (validationResult.isErr()) {
          return err(
            new TeamRepoError(
              "Invalid team member data",
              validationResult.error,
            ),
          );
        }
        validatedMembers.push(validationResult.value);
      }

      return ok({
        items: validatedMembers,
        count: totalCount,
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to list team members", error));
    }
  }

  async createInvitation(
    params: CreateTeamInvitationParams,
  ): Promise<Result<TeamInvitation, TeamRepositoryError>> {
    try {
      const result = await this.db
        .insert(teamInvitations)
        .values({
          teamId: params.teamId,
          email: params.email,
          roleId: params.roleId,
          invitedById: params.invitedById,
          token: params.token,
          expiresAt: params.expiresAt,
          status: "pending",
        })
        .returning();

      const invitation = result[0];
      if (!invitation) {
        return err(new TeamRepoError("Failed to create team invitation"));
      }

      return validate(teamInvitationSchema, invitation).mapErr((error) => {
        return new TeamRepoError("Invalid team invitation data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to create team invitation", error));
    }
  }

  async findInvitationByToken(
    token: string,
  ): Promise<Result<TeamInvitation | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teamInvitations)
        .where(eq(teamInvitations.token, token))
        .limit(1);

      const invitation = result[0];
      if (!invitation) {
        return ok(null);
      }

      return validate(teamInvitationSchema, invitation).mapErr((error) => {
        return new TeamRepoError("Invalid team invitation data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to find team invitation", error));
    }
  }

  async findInvitationById(
    id: string,
  ): Promise<Result<TeamInvitation | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teamInvitations)
        .where(eq(teamInvitations.id, id))
        .limit(1);

      const invitation = result[0];
      if (!invitation) {
        return ok(null);
      }

      return validate(teamInvitationSchema, invitation).mapErr((error) => {
        return new TeamRepoError("Invalid team invitation data", error);
      });
    } catch (error) {
      return err(new TeamRepoError("Failed to find team invitation", error));
    }
  }

  async updateInvitationStatus(
    id: string,
    status: "accepted" | "expired" | "cancelled",
  ): Promise<Result<void, TeamRepositoryError>> {
    try {
      const result = await this.db
        .update(teamInvitations)
        .set({ status })
        .where(eq(teamInvitations.id, id));

      if (result.rowsAffected === 0) {
        return err(new TeamRepoError("Team invitation not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new TeamRepoError("Failed to update team invitation status", error),
      );
    }
  }

  async listInvitations(
    teamId: string,
  ): Promise<Result<TeamInvitation[], TeamRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(teamInvitations)
        .where(eq(teamInvitations.teamId, teamId));

      const validatedInvitations = [];
      for (const invitation of result) {
        const validationResult = validate(teamInvitationSchema, invitation);
        if (validationResult.isErr()) {
          return err(
            new TeamRepoError(
              "Invalid team invitation data",
              validationResult.error,
            ),
          );
        }
        validatedInvitations.push(validationResult.value);
      }

      return ok(validatedInvitations);
    } catch (error) {
      return err(new TeamRepoError("Failed to list team invitations", error));
    }
  }

  async isUserMember(
    teamId: string,
    userId: string,
  ): Promise<Result<boolean, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId),
            eq(teamMembers.status, "active"),
          ),
        );

      const memberCount = result[0]?.count ?? 0;
      return ok(memberCount > 0);
    } catch (error) {
      return err(new TeamRepoError("Failed to check user membership", error));
    }
  }

  async getUserRoleInTeam(
    teamId: string,
    userId: string,
  ): Promise<Result<string | null, TeamRepositoryError>> {
    try {
      const result = await this.db
        .select({ roleId: teamMembers.roleId })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId),
            eq(teamMembers.status, "active"),
          ),
        )
        .limit(1);

      const member = result[0];
      return ok(member?.roleId ?? null);
    } catch (error) {
      return err(new TeamRepoError("Failed to get user role in team", error));
    }
  }
}
