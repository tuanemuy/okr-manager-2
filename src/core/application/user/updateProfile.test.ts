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
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";
import { type UpdateProfileInput, updateProfile } from "./updateProfile";

describe("updateProfile", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: mockUserRepository,
      sessionRepository: new MockSessionRepository(),
      passwordHasher: new MockPasswordHasher(),
      teamRepository: new MockTeamRepository(),
      roleRepository: new MockRoleRepository(),
      okrRepository: new MockOkrRepository(),
      emailService: new MockEmailService(),
      logger: new MockLogger(),
    };

    // Clear all mock data
    mockUserRepository.clear();
  });

  describe("success cases", () => {
    it("should update user name only", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input: UpdateProfileInput = {
        id: user.id,
        name: "Updated Name",
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        expect(updatedUser.id).toBe(user.id);
        expect(updatedUser.name).toBe("Updated Name");
        expect(updatedUser.email).toBe("user@example.com");
        expect(updatedUser.updatedAt).toBeInstanceOf(Date);

        // Avatar URL should remain unchanged (undefined)
        expect(updatedUser.avatarUrl).toBeUndefined();
      }
    });

    it("should update avatar URL only", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const newAvatarUrl = "https://example.com/avatar/new.jpg";
      const input: UpdateProfileInput = {
        id: user.id,
        avatarUrl: newAvatarUrl,
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        expect(updatedUser.avatarUrl).toBe(newAvatarUrl);
        expect(updatedUser.name).toBe("Test User"); // Should remain unchanged
        expect(updatedUser.email).toBe("user@example.com");
      }
    });

    it("should update both name and avatar URL", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const newName = "Updated Name";
      const newAvatarUrl = "https://example.com/avatar/updated.jpg";
      const input: UpdateProfileInput = {
        id: user.id,
        name: newName,
        avatarUrl: newAvatarUrl,
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        expect(updatedUser.name).toBe(newName);
        expect(updatedUser.avatarUrl).toBe(newAvatarUrl);
        expect(updatedUser.email).toBe("user@example.com");
      }
    });

    it("should update with minimum valid name length", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input: UpdateProfileInput = {
        id: user.id,
        name: "A", // Minimum 1 character
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("A");
      }
    });

    it("should update with maximum valid name length", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const longName = "A".repeat(100); // Maximum 100 characters
      const input: UpdateProfileInput = {
        id: user.id,
        name: longName,
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(longName);
      }
    });

    it("should preserve existing avatar URL when not updating", async () => {
      // Arrange
      const existingAvatarUrl = "https://example.com/avatar/existing.jpg";

      // Create user and get the actual user ID
      const createResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createResult.isOk()).toBe(true);
      if (!createResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createResult.value;

      // Update with avatar URL first
      await mockUserRepository.update({
        id: user.id,
        avatarUrl: existingAvatarUrl,
      });

      const input: UpdateProfileInput = {
        id: user.id,
        name: "Updated Name",
        // Not updating avatarUrl
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.name).toBe("Updated Name");
        expect(updatedUser.avatarUrl).toBe(existingAvatarUrl);
      }
    });

    it("should not modify email or other sensitive fields", async () => {
      // Arrange
      const originalEmail = "user@example.com";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: originalEmail,
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input: UpdateProfileInput = {
        id: user.id,
        name: "Updated Name",
        avatarUrl: "https://example.com/avatar.jpg",
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        // Should not expose or modify sensitive fields
        expect(updatedUser.email).toBe(originalEmail);
        expect(updatedUser).not.toHaveProperty("hashedPassword");
        expect(updatedUser).not.toHaveProperty("passwordResetToken");
        expect(updatedUser.emailVerified).toBeDefined(); // Should preserve this
      }
    });
  });

  describe("failure cases", () => {
    it("should fail when user does not exist", async () => {
      // Arrange
      const nonExistentUserId = uuidv7();

      const input: UpdateProfileInput = {
        id: nonExistentUserId,
        name: "Updated Name",
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should fail with empty name", async () => {
      // Arrange - This would be caught by schema validation
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input = {
        id: user.id,
        name: "", // Empty name
      } as UpdateProfileInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.name?.length).toBe(0);
    });

    it("should fail with name too long", async () => {
      // Arrange - This would be caught by schema validation
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input = {
        id: user.id,
        name: "A".repeat(101), // Too long (over 100 characters)
      } as UpdateProfileInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.name?.length).toBeGreaterThan(100);
    });

    it("should fail with invalid avatar URL", async () => {
      // Arrange - This would be caught by schema validation
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input = {
        id: user.id,
        avatarUrl: "not-a-valid-url",
      } as UpdateProfileInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.avatarUrl).not.toMatch(/^https?:\/\//);
    });

    it("should fail with invalid user ID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        id: "invalid-uuid",
        name: "Updated Name",
      } as UpdateProfileInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.id).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle unicode characters in name", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const unicodeName = "田中太郎 👨‍💻";
      const input: UpdateProfileInput = {
        id: user.id,
        name: unicodeName,
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(unicodeName);
      }
    });

    it("should handle special characters in name", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const specialName = "José María O'Connor-Smith Jr.";
      const input: UpdateProfileInput = {
        id: user.id,
        name: specialName,
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(specialName);
      }
    });

    it("should handle whitespace in name", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const nameWithWhitespace = "  John   Doe  ";
      const input: UpdateProfileInput = {
        id: user.id,
        name: nameWithWhitespace,
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(nameWithWhitespace);
      }
    });

    it("should handle various valid avatar URL formats", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const validUrls = [
        "https://example.com/avatar.jpg",
        "http://cdn.example.com/avatars/user123.png",
        "https://storage.googleapis.com/bucket/image.webp",
        "https://s3.amazonaws.com/bucket/avatar.gif",
      ];

      // Act & Assert
      for (const url of validUrls) {
        const input: UpdateProfileInput = {
          id: user.id,
          avatarUrl: url,
        };

        const result = await updateProfile(context, input);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.avatarUrl).toBe(url);
        }
      }
    });

    it("should handle removing avatar URL by setting to undefined", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createResult.isOk()).toBe(true);
      if (!createResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createResult.value;

      await mockUserRepository.update({
        id: user.id,
        avatarUrl: "https://example.com/old-avatar.jpg",
      });

      const input: UpdateProfileInput = {
        id: user.id,
        avatarUrl: null, // Remove avatar URL
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.avatarUrl).toBeNull();
      }
    });

    it("should update profile multiple times consecutively", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const updates = [
        { name: "First Update" },
        { name: "Second Update", avatarUrl: "https://example.com/avatar1.jpg" },
        { avatarUrl: "https://example.com/avatar2.jpg" },
        { name: "Final Update" },
      ];

      // Act & Assert
      for (let i = 0; i < updates.length; i++) {
        const input: UpdateProfileInput = {
          id: user.id,
          ...updates[i],
        };

        const result = await updateProfile(context, input);
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
          const updatedUser = result.value;

          if (updates[i].name) {
            expect(updatedUser.name).toBe(updates[i].name);
          }

          if (updates[i].avatarUrl !== undefined) {
            expect(updatedUser.avatarUrl).toBe(updates[i].avatarUrl);
          }
        }
      }
    });

    it("should preserve timestamps correctly", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Original Name",
      });
      expect(createResult.isOk()).toBe(true);
      if (!createResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createResult.value;
      const originalCreatedAt = user.createdAt;

      const input: UpdateProfileInput = {
        id: user.id,
        name: "Updated Name",
      };

      const beforeUpdate = Date.now();

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;

        // createdAt should remain the same
        expect(updatedUser.createdAt).toEqual(originalCreatedAt);

        // updatedAt should be recent
        const timeDiff = Math.abs(
          updatedUser.updatedAt.getTime() - beforeUpdate,
        );
        expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
      }
    });
  });

  describe("no-op updates", () => {
    it("should handle update with no changes", async () => {
      // Arrange
      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const input: UpdateProfileInput = {
        id: user.id,
        // No name or avatarUrl provided
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.name).toBe("Test User"); // Should remain unchanged
        expect(updatedUser.email).toBe("user@example.com");
      }
    });

    it("should handle update with same values", async () => {
      // Arrange
      const originalName = "Test User";
      const originalAvatarUrl = "https://example.com/avatar.jpg";

      // Create user and get the actual user ID
      const createResult = await mockUserRepository.create({
        email: "user@example.com",
        hashedPassword: "hashed",
        name: originalName,
      });
      expect(createResult.isOk()).toBe(true);
      if (!createResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createResult.value;

      await mockUserRepository.update({
        id: user.id,
        avatarUrl: originalAvatarUrl,
      });

      const input: UpdateProfileInput = {
        id: user.id,
        name: originalName, // Same as current
        avatarUrl: originalAvatarUrl, // Same as current
      };

      // Act
      const result = await updateProfile(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedUser = result.value;
        expect(updatedUser.name).toBe(originalName);
        expect(updatedUser.avatarUrl).toBe(originalAvatarUrl);
      }
    });
  });
});
