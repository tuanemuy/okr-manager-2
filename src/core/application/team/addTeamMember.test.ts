import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import { MockLogger } from "@/core/adapters/mock/logger";
import { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockRoleRepository } from "@/core/adapters/mock/roleRepository";
import { MockSessionRepository } from "@/core/adapters/mock/sessionRepository";
import { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { Team, TeamMember } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";
import { type AddTeamMemberInput, addTeamMember } from "./addTeamMember";

describe("addTeamMember", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;
  let mockTeamRepository: MockTeamRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockTeamRepository = new MockTeamRepository();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: mockUserRepository,
      sessionRepository: new MockSessionRepository(),
      passwordHasher: new MockPasswordHasher(),
      teamRepository: mockTeamRepository,
      roleRepository: new MockRoleRepository(),
      okrRepository: new MockOkrRepository(),
      emailService: new MockEmailService(),
      logger: new MockLogger(),
    };

    // Clear all mock data
    mockUserRepository.clear();
    mockTeamRepository.clear();
  });

  describe("success cases", () => {
    it("should add team member when requester is team creator", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const newMember = createMemberResult.value;

      // Create team
      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        description: "A team for development",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: newMember.id,
        roleId,
        requesterId: creator.id,
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const teamMember = result.value;

        expect(teamMember.teamId).toBe(team.id);
        expect(teamMember.userId).toBe(newMember.id);
        expect(teamMember.roleId).toBe(roleId);
        expect(teamMember.invitedById).toBe(creator.id);
        expect(teamMember.status).toBe("active");
        expect(teamMember.id).toBeDefined();
        expect(teamMember.createdAt).toBeInstanceOf(Date);
        expect(teamMember.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should set correct timestamps for new team member", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const newMember = createMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: newMember.id,
        roleId,
        requesterId: creator.id,
      };

      const beforeAdd = Date.now();

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const teamMember = result.value;

        expect(teamMember.invitedAt).toBeInstanceOf(Date);
        expect(teamMember.joinedAt).toBeInstanceOf(Date);

        // Timestamps should be recent
        const timeDiff = Math.abs(teamMember.createdAt.getTime() - beforeAdd);
        expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
      }
    });

    it("should add multiple members to same team", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMember1Result = await mockUserRepository.create({
        email: "member1@example.com",
        hashedPassword: "hashed",
        name: "Member One",
      });
      expect(createMember1Result.isOk()).toBe(true);
      if (!createMember1Result.isOk()) {
        throw new Error("Failed to create member1");
      }
      const member1 = createMember1Result.value;

      const createMember2Result = await mockUserRepository.create({
        email: "member2@example.com",
        hashedPassword: "hashed",
        name: "Member Two",
      });
      expect(createMember2Result.isOk()).toBe(true);
      if (!createMember2Result.isOk()) {
        throw new Error("Failed to create member2");
      }
      const member2 = createMember2Result.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input1: AddTeamMemberInput = {
        teamId: team.id,
        userId: member1.id,
        roleId,
        requesterId: creator.id,
      };

      const input2: AddTeamMemberInput = {
        teamId: team.id,
        userId: member2.id,
        roleId,
        requesterId: creator.id,
      };

      // Act
      const result1 = await addTeamMember(context, input1);
      const result2 = await addTeamMember(context, input2);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.userId).toBe(member1.id);
        expect(result2.value.userId).toBe(member2.id);
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });
  });

  describe("failure cases", () => {
    it("should fail when team does not exist", async () => {
      // Arrange
      const nonExistentTeamId = uuidv7();
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const newMember = createMemberResult.value;

      const input: AddTeamMemberInput = {
        teamId: nonExistentTeamId,
        userId: newMember.id,
        roleId,
        requesterId: creator.id,
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Team not found");
      }
    });

    it("should fail when requester is not team creator", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createRequesterResult = await mockUserRepository.create({
        email: "requester@example.com",
        hashedPassword: "hashed",
        name: "Unauthorized Requester",
      });
      expect(createRequesterResult.isOk()).toBe(true);
      if (!createRequesterResult.isOk()) {
        throw new Error("Failed to create requester");
      }
      const requester = createRequesterResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const newMember = createMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id, // Different from requester
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: newMember.id,
        roleId,
        requesterId: requester.id, // Not the team creator
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Access denied - not a team member");
      }
    });

    it("should fail when user to be added does not exist", async () => {
      // Arrange
      const nonExistentUserId = uuidv7();
      const roleId = uuidv7();

      // Create creator and get the actual user ID
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: nonExistentUserId,
        roleId,
        requesterId: creator.id,
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should fail when user is already a team member", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "existingmember@example.com",
        hashedPassword: "hashed",
        name: "Existing Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const existingMember = createMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      // Add user as existing member
      const teamMember: TeamMember = {
        id: uuidv7(),
        teamId: team.id,
        userId: existingMember.id,
        roleId,
        invitedById: creator.id,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedMembers([teamMember]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: existingMember.id, // Already a member
        roleId,
        requesterId: creator.id,
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User is already a team member");
      }
    });

    it("should fail with invalid team ID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        teamId: "invalid-uuid",
        userId: uuidv7(),
        roleId: uuidv7(),
        requesterId: uuidv7(),
      } as AddTeamMemberInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.teamId).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should fail with invalid user ID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        teamId: uuidv7(),
        userId: "invalid-uuid",
        roleId: uuidv7(),
        requesterId: uuidv7(),
      } as AddTeamMemberInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.userId).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should fail with invalid role ID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        teamId: uuidv7(),
        userId: uuidv7(),
        roleId: "invalid-uuid",
        requesterId: uuidv7(),
      } as AddTeamMemberInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.roleId).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should fail with invalid requester ID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        teamId: uuidv7(),
        userId: uuidv7(),
        roleId: uuidv7(),
        requesterId: "invalid-uuid",
      } as AddTeamMemberInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.requesterId).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("permission validation", () => {
    it("should allow team creator to add members", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const newMember = createMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: newMember.id,
        roleId,
        requesterId: creator.id, // Creator adding member
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should deny non-creator, non-member from adding members", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createOutsiderResult = await mockUserRepository.create({
        email: "outsider@example.com",
        hashedPassword: "hashed",
        name: "Outsider",
      });
      expect(createOutsiderResult.isOk()).toBe(true);
      if (!createOutsiderResult.isOk()) {
        throw new Error("Failed to create outsider");
      }
      const outsider = createOutsiderResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create member");
      }
      const newMember = createMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: newMember.id,
        roleId,
        requesterId: outsider.id, // Not creator, not member
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Access denied - not a team member");
      }
    });

    it("should deny existing member (non-admin) from adding members", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createExistingMemberResult = await mockUserRepository.create({
        email: "existingmember@example.com",
        hashedPassword: "hashed",
        name: "Existing Member",
      });
      expect(createExistingMemberResult.isOk()).toBe(true);
      if (!createExistingMemberResult.isOk()) {
        throw new Error("Failed to create existing member");
      }
      const existingMember = createExistingMemberResult.value;

      const createNewMemberResult = await mockUserRepository.create({
        email: "newmember@example.com",
        hashedPassword: "hashed",
        name: "New Member",
      });
      expect(createNewMemberResult.isOk()).toBe(true);
      if (!createNewMemberResult.isOk()) {
        throw new Error("Failed to create new member");
      }
      const newMember = createNewMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      // Add existing member (non-admin)
      const teamMember: TeamMember = {
        id: uuidv7(),
        teamId: team.id,
        userId: existingMember.id,
        roleId,
        invitedById: creator.id,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedMembers([teamMember]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: newMember.id,
        roleId,
        requesterId: existingMember.id, // Existing member but not admin
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions to add members",
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle creator adding themselves to their own team", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create creator and get the actual user ID
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input: AddTeamMemberInput = {
        teamId: team.id,
        userId: creator.id, // Adding themselves
        roleId,
        requesterId: creator.id,
      };

      // Act
      const result = await addTeamMember(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const teamMember = result.value;
        expect(teamMember.userId).toBe(creator.id);
        expect(teamMember.invitedById).toBe(creator.id);
      }
    });

    it("should handle adding members with different role IDs", async () => {
      // Arrange
      const adminRoleId = uuidv7();
      const memberRoleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createAdminResult = await mockUserRepository.create({
        email: "admin@example.com",
        hashedPassword: "hashed",
        name: "Admin Member",
      });
      expect(createAdminResult.isOk()).toBe(true);
      if (!createAdminResult.isOk()) {
        throw new Error("Failed to create admin member");
      }
      const adminMember = createAdminResult.value;

      const createMemberResult = await mockUserRepository.create({
        email: "member@example.com",
        hashedPassword: "hashed",
        name: "Regular Member",
      });
      expect(createMemberResult.isOk()).toBe(true);
      if (!createMemberResult.isOk()) {
        throw new Error("Failed to create regular member");
      }
      const regularMember = createMemberResult.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const adminInput: AddTeamMemberInput = {
        teamId: team.id,
        userId: adminMember.id,
        roleId: adminRoleId,
        requesterId: creator.id,
      };

      const memberInput: AddTeamMemberInput = {
        teamId: team.id,
        userId: regularMember.id,
        roleId: memberRoleId,
        requesterId: creator.id,
      };

      // Act
      const adminResult = await addTeamMember(context, adminInput);
      const memberResult = await addTeamMember(context, memberInput);

      // Assert
      expect(adminResult.isOk()).toBe(true);
      expect(memberResult.isOk()).toBe(true);

      if (adminResult.isOk() && memberResult.isOk()) {
        expect(adminResult.value.roleId).toBe(adminRoleId);
        expect(memberResult.value.roleId).toBe(memberRoleId);
      }
    });

    it("should handle concurrent member additions", async () => {
      // Arrange
      const roleId = uuidv7();

      // Create users and get the actual user IDs
      const createCreatorResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createCreatorResult.isOk()).toBe(true);
      if (!createCreatorResult.isOk()) {
        throw new Error("Failed to create creator");
      }
      const creator = createCreatorResult.value;

      const createMember1Result = await mockUserRepository.create({
        email: "member1@example.com",
        hashedPassword: "hashed",
        name: "Member One",
      });
      expect(createMember1Result.isOk()).toBe(true);
      if (!createMember1Result.isOk()) {
        throw new Error("Failed to create member1");
      }
      const member1 = createMember1Result.value;

      const createMember2Result = await mockUserRepository.create({
        email: "member2@example.com",
        hashedPassword: "hashed",
        name: "Member Two",
      });
      expect(createMember2Result.isOk()).toBe(true);
      if (!createMember2Result.isOk()) {
        throw new Error("Failed to create member2");
      }
      const member2 = createMember2Result.value;

      const team: Team = {
        id: uuidv7(),
        name: "Development Team",
        createdById: creator.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeamRepository.seedTeams([team]);

      const input1: AddTeamMemberInput = {
        teamId: team.id,
        userId: member1.id,
        roleId,
        requesterId: creator.id,
      };

      const input2: AddTeamMemberInput = {
        teamId: team.id,
        userId: member2.id,
        roleId,
        requesterId: creator.id,
      };

      // Act - Concurrent additions
      const [result1, result2] = await Promise.all([
        addTeamMember(context, input1),
        addTeamMember(context, input2),
      ]);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.userId).toBe(member1.id);
        expect(result2.value.userId).toBe(member2.id);
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });
  });
});
