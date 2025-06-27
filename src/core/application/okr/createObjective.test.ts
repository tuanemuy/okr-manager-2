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
import type { CreateObjectiveInput, Objective } from "@/core/domain/okr/types";
import type { Permission } from "@/core/domain/role/types";
import type { Context } from "../context";
import { createObjective } from "./createObjective";

describe("createObjective", () => {
  let context: Context;
  let mockOkrRepository: MockOkrRepository;
  let mockTeamRepository: MockTeamRepository;
  let mockRoleRepository: MockRoleRepository;

  beforeEach(() => {
    mockOkrRepository = new MockOkrRepository();
    mockTeamRepository = new MockTeamRepository();
    mockRoleRepository = new MockRoleRepository();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: new MockUserRepository(),
      sessionRepository: new MockSessionRepository(),
      passwordHasher: new MockPasswordHasher(),
      teamRepository: mockTeamRepository,
      roleRepository: mockRoleRepository,
      okrRepository: mockOkrRepository,
      emailService: new MockEmailService(),
      logger: new MockLogger(),
    };

    // Clear all mock data
    mockOkrRepository.clear();
    mockTeamRepository.clear();
    mockRoleRepository.clear();
  });

  describe("success cases", () => {
    it("should create personal objective with valid input", async () => {
      // Arrange
      const userId = uuidv7();
      const input: CreateObjectiveInput = {
        title: "Complete project milestone",
        description: "Finish the Q1 project deliverables",
        type: "personal",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const objective = result.value;

        expect(objective.title).toBe(input.title);
        expect(objective.description).toBe(input.description);
        expect(objective.type).toBe(input.type);
        expect(objective.ownerId).toBe(userId);
        expect(objective.startDate).toEqual(input.startDate);
        expect(objective.endDate).toEqual(input.endDate);
        expect(objective.status).toBe("draft");
        expect(objective.id).toBeDefined();
        expect(objective.createdAt).toBeInstanceOf(Date);
        expect(objective.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create team objective when user is team member", async () => {
      // Arrange
      // Create user first
      const createUserResult = await context.userRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      // Create team first
      const createTeamResult = await context.teamRepository.create({
        name: "Test Team",
        description: "A test team",
        createdById: user.id,
      });
      expect(createTeamResult.isOk()).toBe(true);
      if (!createTeamResult.isOk()) {
        throw new Error("Failed to create team");
      }
      const team = createTeamResult.value;

      // Add user to team
      await mockTeamRepository.addMember({
        teamId: team.id,
        userId: user.id,
        roleId: uuidv7(),
        invitedById: user.id,
      });

      const input: CreateObjectiveInput = {
        title: "Team sales target",
        description: "Achieve quarterly sales goal",
        type: "team",
        teamId: team.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, user.id, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const objective = result.value;
        expect(objective.type).toBe("team");
        expect(objective.teamId).toBe(team.id);
      }
    });

    it("should create organization objective when user has permission", async () => {
      // Arrange
      const userId = uuidv7();

      // Create permission and assign to user's role
      const permission: Permission = {
        id: uuidv7(),
        name: "manage_organization_objectives",
        description: "Can manage organization objectives",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRoleRepository.seedPermissions([permission]);
      mockRoleRepository.assignPermissionsByNameToUser(userId, [
        "manage_organization_objectives",
      ]);

      const input: CreateObjectiveInput = {
        title: "Company growth objective",
        description: "Increase company revenue by 25%",
        type: "organization",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const objective = result.value;
        expect(objective.type).toBe("organization");
      }
    });

    it("should create objective with parent when user has access", async () => {
      // Arrange
      const userId = uuidv7();
      const parentId = uuidv7();

      // Create parent objective
      const parentObjective: Objective = {
        id: parentId,
        title: "Parent Objective",
        description: "Parent description",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([parentObjective]);

      const input: CreateObjectiveInput = {
        title: "Child objective",
        description: "Child description",
        type: "personal",
        parentId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const objective = result.value;
        expect(objective.parentId).toBe(parentId);
      }
    });

    it("should create objective with minimal valid data", async () => {
      // Arrange
      const userId = uuidv7();
      const input: CreateObjectiveInput = {
        title: "Minimum objective",
        type: "personal",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-02"), // Next day
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const objective = result.value;
        expect(objective.title).toBe(input.title);
        expect(objective.description).toBeUndefined();
        expect(objective.teamId).toBeUndefined();
        expect(objective.parentId).toBeUndefined();
      }
    });
  });

  describe("failure cases", () => {
    it("should fail when start date is after end date", async () => {
      // Arrange
      const userId = uuidv7();
      const input: CreateObjectiveInput = {
        title: "Invalid date objective",
        type: "personal",
        startDate: new Date("2024-12-31"),
        endDate: new Date("2024-01-01"), // Before start date
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Start date must be before end date");
      }
    });

    it("should fail when start date equals end date", async () => {
      // Arrange
      const userId = uuidv7();
      const sameDate = new Date("2024-06-15");
      const input: CreateObjectiveInput = {
        title: "Same date objective",
        type: "personal",
        startDate: sameDate,
        endDate: sameDate,
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Start date must be before end date");
      }
    });

    it("should fail when creating team objective but user is not team member", async () => {
      // Arrange
      const userId = uuidv7();
      const teamId = uuidv7();

      const input: CreateObjectiveInput = {
        title: "Unauthorized team objective",
        type: "team",
        teamId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User is not a member of the team");
      }
    });

    it("should fail when creating organization objective without permission", async () => {
      // Arrange
      const userId = uuidv7();

      const input: CreateObjectiveInput = {
        title: "Unauthorized organization objective",
        type: "organization",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "User does not have permission to create organization objectives",
        );
      }
    });

    it("should fail when parent objective does not exist", async () => {
      // Arrange
      const userId = uuidv7();
      const nonExistentParentId = uuidv7();

      const input: CreateObjectiveInput = {
        title: "Orphan objective",
        type: "personal",
        parentId: nonExistentParentId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Parent objective not found");
      }
    });

    it("should fail when user has no access to parent objective", async () => {
      // Arrange
      const userId = uuidv7();
      const otherUserId = uuidv7();
      const parentId = uuidv7();

      // Create parent objective owned by another user
      const parentObjective: Objective = {
        id: parentId,
        title: "Other user's objective",
        description: "Not accessible",
        type: "personal",
        ownerId: otherUserId, // Different owner
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([parentObjective]);

      const input: CreateObjectiveInput = {
        title: "Unauthorized child objective",
        type: "personal",
        parentId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("No access to parent objective");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle very long title", async () => {
      // Arrange
      const userId = uuidv7();
      const longTitle = "a".repeat(200); // Maximum length

      const input: CreateObjectiveInput = {
        title: longTitle,
        type: "personal",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(longTitle);
      }
    });

    it("should handle very long description", async () => {
      // Arrange
      const userId = uuidv7();
      const longDescription = "a".repeat(1000); // Maximum length

      const input: CreateObjectiveInput = {
        title: "Test objective",
        description: longDescription,
        type: "personal",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(longDescription);
      }
    });

    it("should handle unicode characters in title and description", async () => {
      // Arrange
      const userId = uuidv7();
      const unicodeTitle = "目標を達成する 🎯";
      const unicodeDescription =
        "詳細な説明 📊 with émojis and spéciål çhâráctërs";

      const input: CreateObjectiveInput = {
        title: unicodeTitle,
        description: unicodeDescription,
        type: "personal",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(unicodeTitle);
        expect(result.value.description).toBe(unicodeDescription);
      }
    });

    it("should handle dates far in the future", async () => {
      // Arrange
      const userId = uuidv7();
      const input: CreateObjectiveInput = {
        title: "Future objective",
        type: "personal",
        startDate: new Date("2030-01-01"),
        endDate: new Date("2030-12-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.startDate).toEqual(input.startDate);
        expect(result.value.endDate).toEqual(input.endDate);
      }
    });

    it("should handle dates in the past", async () => {
      // Arrange
      const userId = uuidv7();
      const input: CreateObjectiveInput = {
        title: "Historical objective",
        type: "personal",
        startDate: new Date("2020-01-01"),
        endDate: new Date("2020-12-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.startDate).toEqual(input.startDate);
        expect(result.value.endDate).toEqual(input.endDate);
      }
    });

    it("should handle very short duration (1 day)", async () => {
      // Arrange
      const userId = uuidv7();
      const startDate = new Date("2024-06-15T09:00:00Z");
      const endDate = new Date("2024-06-15T17:00:00Z"); // Same day, different time

      const input: CreateObjectiveInput = {
        title: "One day objective",
        type: "personal",
        startDate,
        endDate,
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle multiple nested parent-child relationships", async () => {
      // Arrange
      const userId = uuidv7();

      // Create grandparent objective
      const grandparentId = uuidv7();
      const grandparent: Objective = {
        id: grandparentId,
        title: "Grandparent Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create parent objective
      const parentId = uuidv7();
      const parent: Objective = {
        id: parentId,
        title: "Parent Objective",
        type: "personal",
        ownerId: userId,
        parentId: grandparentId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([grandparent, parent]);

      const input: CreateObjectiveInput = {
        title: "Child objective",
        type: "personal",
        parentId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.parentId).toBe(parentId);
      }
    });
  });

  describe("team membership validation", () => {
    it("should validate team membership for team objectives", async () => {
      // Arrange
      const userId = uuidv7();
      const roleId = uuidv7();

      // Create team and get the actual team ID
      const createTeamResult = await mockTeamRepository.create({
        name: "Test Team",
        createdById: userId,
      });
      expect(createTeamResult.isOk()).toBe(true);
      if (!createTeamResult.isOk()) {
        throw new Error("Failed to create team");
      }
      const team = createTeamResult.value;

      await mockTeamRepository.addMember({
        teamId: team.id,
        userId,
        roleId,
        invitedById: userId,
      });

      const input: CreateObjectiveInput = {
        title: "Team objective with valid membership",
        type: "team",
        teamId: team.id,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle team objective without teamId", async () => {
      // Arrange
      const userId = uuidv7();

      const input: CreateObjectiveInput = {
        title: "Team objective without teamId",
        type: "team",
        // teamId is undefined
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createObjective(context, userId, input);

      // Assert
      // This should succeed because teamId check only happens when teamId is provided
      expect(result.isOk()).toBe(true);
    });
  });
});
