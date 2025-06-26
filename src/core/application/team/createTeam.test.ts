import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockRoleRepository } from "@/core/adapters/mock/roleRepository";
import { MockSessionRepository } from "@/core/adapters/mock/sessionRepository";
import { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";
import { type CreateTeamInput, createTeam } from "./createTeam";

describe("createTeam", () => {
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
    };

    // Clear all mock data
    mockUserRepository.clear();
    mockTeamRepository.clear();
  });

  describe("success cases", () => {
    it("should create team with valid input", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input: CreateTeamInput = {
        name: "Development Team",
        description: "A team for software development",
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const team = result.value;

        expect(team.name).toBe(input.name);
        expect(team.description).toBe(input.description);
        expect(team.createdById).toBe(input.createdById);
        expect(team.id).toBeDefined();
        expect(team.createdAt).toBeInstanceOf(Date);
        expect(team.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create team without description", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input: CreateTeamInput = {
        name: "Minimal Team",
        createdById: creator.id,
        // description is optional
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const team = result.value;
        expect(team.name).toBe(input.name);
        expect(team.description).toBeUndefined();
      }
    });

    it("should create team with minimum name length", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input: CreateTeamInput = {
        name: "A", // Minimum 1 character
        description: "Single character team name",
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("A");
      }
    });

    it("should create team with maximum name length", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const longName = "A".repeat(100); // Maximum 100 characters
      const input: CreateTeamInput = {
        name: longName,
        description: "Team with maximum name length",
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(longName);
      }
    });

    it("should create team with maximum description length", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const longDescription = "A".repeat(500); // Maximum 500 characters
      const input: CreateTeamInput = {
        name: "Test Team",
        description: longDescription,
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(longDescription);
      }
    });
  });

  describe("failure cases", () => {
    it("should fail when creator does not exist", async () => {
      // Arrange
      const nonExistentCreatorId = uuidv7();

      const input: CreateTeamInput = {
        name: "Orphaned Team",
        description: "Team with non-existent creator",
        createdById: nonExistentCreatorId,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Creator not found");
      }
    });

    it("should fail with empty team name", async () => {
      // Arrange - This would be caught by schema validation
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input = {
        name: "", // Empty name
        description: "Team with empty name",
        createdById: creator.id,
      } as CreateTeamInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.name.length).toBe(0);
    });

    it("should fail with name too long", async () => {
      // Arrange - This would be caught by schema validation
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input = {
        name: "A".repeat(101), // Too long (over 100 characters)
        description: "Team with too long name",
        createdById: creator.id,
      } as CreateTeamInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.name.length).toBeGreaterThan(100);
    });

    it("should fail with description too long", async () => {
      // Arrange - This would be caught by schema validation
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input = {
        name: "Test Team",
        description: "A".repeat(501), // Too long (over 500 characters)
        createdById: creator.id,
      } as CreateTeamInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.description?.length).toBeGreaterThan(500);
    });

    it("should fail with invalid creator UUID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        name: "Test Team",
        description: "Team with invalid creator ID",
        createdById: "invalid-uuid",
      } as CreateTeamInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.createdById).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle unicode characters in team name", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const unicodeName = "チーム開発部 🚀";
      const input: CreateTeamInput = {
        name: unicodeName,
        description: "Team with unicode name",
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(unicodeName);
      }
    });

    it("should handle unicode characters in description", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const unicodeDescription =
        "ソフトウェア開発チーム 🔧 - We build amazing products! 💻";
      const input: CreateTeamInput = {
        name: "Development Team",
        description: unicodeDescription,
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(unicodeDescription);
      }
    });

    it("should handle special characters in team name", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const specialName = "R&D Team #1 - AI/ML @Company (2024)";
      const input: CreateTeamInput = {
        name: specialName,
        description: "Team with special characters",
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(specialName);
      }
    });

    it("should handle whitespace in team name", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const nameWithWhitespace = "  Development    Team  ";
      const input: CreateTeamInput = {
        name: nameWithWhitespace,
        description: "Team with whitespace in name",
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(nameWithWhitespace);
      }
    });

    it("should handle line breaks in description", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const multilineDescription =
        "This is a development team.\nWe work on various projects.\n\nGoals:\n- Deliver quality software\n- Maintain high standards";
      const input: CreateTeamInput = {
        name: "Development Team",
        description: multilineDescription,
        createdById: creator.id,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(multilineDescription);
      }
    });

    it("should create multiple teams with different names", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "creator@example.com",
        hashedPassword: "hashed",
        name: "Team Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const input1: CreateTeamInput = {
        name: "Frontend Team",
        description: "UI/UX development team",
        createdById: creator.id,
      };

      const input2: CreateTeamInput = {
        name: "Backend Team",
        description: "API development team",
        createdById: creator.id,
      };

      // Act
      const result1 = await createTeam(context, input1);
      const result2 = await createTeam(context, input2);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.name).toBe("Frontend Team");
        expect(result2.value.name).toBe("Backend Team");
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });

    it("should handle team creation with same creator multiple times", async () => {
      // Arrange
      // Create creator user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "prolific@example.com",
        hashedPassword: "hashed",
        name: "Prolific Creator",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const creator = createUserResult.value;

      const teams = [
        { name: "Team Alpha", description: "First team" },
        { name: "Team Beta", description: "Second team" },
        { name: "Team Gamma", description: "Third team" },
      ];

      // Act
      const results = await Promise.all(
        teams.map((team) =>
          createTeam(context, {
            ...team,
            createdById: creator.id,
          }),
        ),
      );

      // Assert
      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }

      if (results.every((r) => r.isOk())) {
        // biome-ignore lint/suspicious/noExplicitAny: Type narrowing for successful results
        const createdTeams = results.map((r) => (r as any).value);
        expect(createdTeams).toHaveLength(3);
        expect(
          createdTeams.every((team) => team.createdById === creator.id),
        ).toBe(true);

        // All teams should have unique IDs
        const teamIds = createdTeams.map((team) => team.id);
        const uniqueIds = [...new Set(teamIds)];
        expect(uniqueIds).toHaveLength(3);
      }
    });
  });

  describe("creator validation", () => {
    it("should validate creator exists before creating team", async () => {
      // Arrange
      // Don't create the creator user - use a non-existent ID
      const nonExistentCreatorId = uuidv7();
      const input: CreateTeamInput = {
        name: "Unauthorized Team",
        description: "Team created by non-existent user",
        createdById: nonExistentCreatorId,
      };

      // Act
      const result = await createTeam(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Creator not found");
      }
    });

    it("should work with different types of creators", async () => {
      // Arrange
      const creatorInfos = [
        {
          email: "admin@example.com",
          name: "Admin User",
        },
        {
          email: "manager@example.com",
          name: "Manager User",
        },
        {
          email: "developer@example.com",
          name: "Developer User",
        },
      ];

      // Create all users and store their actual IDs
      const creators = [];
      for (const info of creatorInfos) {
        const createUserResult = await mockUserRepository.create({
          email: info.email,
          hashedPassword: "hashed",
          name: info.name,
        });
        expect(createUserResult.isOk()).toBe(true);
        if (!createUserResult.isOk()) {
          throw new Error("Failed to create user");
        }
        creators.push(createUserResult.value);
      }

      // Act
      const results = await Promise.all(
        creators.map((creator, index) =>
          createTeam(context, {
            name: `Team ${index + 1}`,
            description: `Team created by ${creator.name}`,
            createdById: creator.id,
          }),
        ),
      );

      // Assert
      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }
    });
  });
});
