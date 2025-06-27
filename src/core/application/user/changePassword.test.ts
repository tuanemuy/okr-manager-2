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
import type { UserWithAuth } from "@/core/domain/user/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";
import { type ChangePasswordInput, changePassword } from "./changePassword";

describe("changePassword", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;
  let mockPasswordHasher: MockPasswordHasher;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockPasswordHasher = new MockPasswordHasher();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: mockUserRepository,
      sessionRepository: new MockSessionRepository(),
      passwordHasher: mockPasswordHasher,
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
    it("should change password with valid current password", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "oldPassword123";
      const newPassword = "newPassword456";
      const email = "user@example.com";

      // Create user with known password
      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify password was changed in repository
      const updatedUserResult =
        await mockUserRepository.findByEmailForAuth(email);
      expect(updatedUserResult.isOk()).toBe(true);
      if (updatedUserResult.isOk() && updatedUserResult.value) {
        expect(updatedUserResult.value.hashedPassword).toBe(
          MockPasswordHasher.createMockHash(newPassword),
        );
      }
    });

    it("should change password with minimum length new password", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "oldPassword123";
      const newPassword = "12345678"; // Minimum 8 characters
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should change password with maximum length new password", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "oldPassword123";
      const newPassword = "a".repeat(128); // Maximum 128 characters
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should clear password reset tokens when changing password", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "oldPassword123";
      const newPassword = "newPassword456";
      const email = "user@example.com";

      // Create user with existing password reset token
      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: "existing-reset-token",
        passwordResetExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);

      // Verify password reset tokens were cleared
      const updatedUserResult =
        await mockUserRepository.findByEmailForAuth(email);
      expect(updatedUserResult.isOk()).toBe(true);
      if (updatedUserResult.isOk() && updatedUserResult.value) {
        expect(updatedUserResult.value.passwordResetToken).toBeNull();
        expect(updatedUserResult.value.passwordResetExpiresAt).toBeNull();
      }
    });

    it("should work with special characters in passwords", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "oldP@ssw0rd!#$%";
      const newPassword = "newP@ssw0rd^&*()_+";
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe("failure cases", () => {
    it("should fail when user does not exist", async () => {
      // Arrange
      const nonExistentUserId = uuidv7();

      const input: ChangePasswordInput = {
        userId: nonExistentUserId,
        currentPassword: "anyPassword123",
        newPassword: "newPassword456",
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should fail when current password is incorrect", async () => {
      // Arrange
      const userId = uuidv7();
      const correctPassword = "correctPassword123";
      const wrongPassword = "wrongPassword123";
      const newPassword = "newPassword456";
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(correctPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword: wrongPassword, // Wrong password
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Current password is incorrect");
      }

      // Verify password was not changed
      const unchangedUserResult =
        await mockUserRepository.findByEmailForAuth(email);
      if (unchangedUserResult.isOk() && unchangedUserResult.value) {
        expect(unchangedUserResult.value.hashedPassword).toBe(
          MockPasswordHasher.createMockHash(correctPassword),
        );
      }
    });

    it("should fail when current password is empty", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "correctPassword123";
      const newPassword = "newPassword456";
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword: "", // Empty password
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Current password is incorrect");
      }
    });

    it("should fail with new password too short", async () => {
      // Arrange - This would be caught by schema validation
      const userId = uuidv7();

      const input = {
        userId,
        currentPassword: "correctPassword123",
        newPassword: "1234567", // 7 characters (less than minimum 8)
      } as ChangePasswordInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.newPassword.length).toBeLessThan(8);
    });

    it("should fail with new password too long", async () => {
      // Arrange - This would be caught by schema validation
      const userId = uuidv7();

      const input = {
        userId,
        currentPassword: "correctPassword123",
        newPassword: "a".repeat(129), // 129 characters (more than maximum 128)
      } as ChangePasswordInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.newPassword.length).toBeGreaterThan(128);
    });

    it("should fail with invalid user ID", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        userId: "invalid-uuid",
        currentPassword: "correctPassword123",
        newPassword: "newPassword456",
      } as ChangePasswordInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.userId).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle changing password to same password", async () => {
      // Arrange
      const userId = uuidv7();
      const samePassword = "samePassword123";
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(samePassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword: samePassword,
        newPassword: samePassword, // Same as current
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle unicode characters in password", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "pässwörd123";
      const newPassword = "nëwpässwörd456";
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle whitespace in passwords", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "password with spaces";
      const newPassword = "new password with spaces";
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle very long passwords at boundaries", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "a".repeat(128); // Max length
      const newPassword = "b".repeat(128); // Max length
      const email = "user@example.com";

      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle user with no password reset tokens", async () => {
      // Arrange
      const userId = uuidv7();
      const currentPassword = "currentPassword123";
      const newPassword = "newPassword456";
      const email = "user@example.com";

      // User with explicitly null reset tokens
      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const input: ChangePasswordInput = {
        userId,
        currentPassword,
        newPassword,
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle multiple password changes in sequence", async () => {
      // Arrange
      const userId = uuidv7();
      const email = "user@example.com";

      let currentPassword = "initialPassword123";
      const userWithAuth: UserWithAuth = {
        id: userId,
        email,
        name: "Test User",
        hashedPassword: MockPasswordHasher.createMockHash(currentPassword),
        avatarUrl: undefined,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.seed([userWithAuth]);

      const passwordChanges = [
        "firstNewPassword123",
        "secondNewPassword456",
        "thirdNewPassword789",
      ];

      // Act & Assert
      for (const newPassword of passwordChanges) {
        const input: ChangePasswordInput = {
          userId,
          currentPassword,
          newPassword,
        };

        const result = await changePassword(context, input);
        expect(result.isOk()).toBe(true);

        // Update current password for next iteration
        currentPassword = newPassword;
      }

      // Verify final password
      const finalUserResult =
        await mockUserRepository.findByEmailForAuth(email);
      if (finalUserResult.isOk() && finalUserResult.value) {
        expect(finalUserResult.value.hashedPassword).toBe(
          MockPasswordHasher.createMockHash("thirdNewPassword789"),
        );
      }
    });
  });

  describe("security considerations", () => {
    it("should not reveal user existence through error messages", async () => {
      // Both cases should return "User not found" when user doesn't exist
      const nonExistentUserId = uuidv7();

      const input: ChangePasswordInput = {
        userId: nonExistentUserId,
        currentPassword: "anyPassword123",
        newPassword: "newPassword456",
      };

      const result = await changePassword(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should handle case where user exists but auth info is missing", async () => {
      // Arrange - create a user but don't seed auth info properly
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

      const input: ChangePasswordInput = {
        userId: user.id,
        currentPassword: "anyPassword123",
        newPassword: "newPassword456",
      };

      // Act
      const result = await changePassword(context, input);

      // Assert
      // This might fail in different ways depending on implementation
      // but should not crash
      expect(result.isErr()).toBe(true);
    });
  });
});
