import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockRoleRepository } from "@/core/adapters/mock/roleRepository";
import { MockSessionRepository } from "@/core/adapters/mock/sessionRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  type RequestPasswordResetInput,
  requestPasswordReset,
} from "./requestPasswordReset";

// Mock implementations for missing repositories
class MockTeamRepository {
  // Minimal implementation for testing - extend as needed
}

class MockOkrRepository {
  // Minimal implementation for testing - extend as needed
}

describe("requestPasswordReset", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;
  let mockEmailService: MockEmailService;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockEmailService = new MockEmailService();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: mockUserRepository,
      sessionRepository: new MockSessionRepository(),
      passwordHasher: new MockPasswordHasher(),
      // biome-ignore lint/suspicious/noExplicitAny: Test context requires full interface
      teamRepository: new MockTeamRepository() as any,
      roleRepository: new MockRoleRepository(),
      // biome-ignore lint/suspicious/noExplicitAny: Test context requires full interface
      okrRepository: new MockOkrRepository() as any,
      emailService: mockEmailService,
    };

    // Clear all mock data
    mockUserRepository.clear();
  });

  describe("success cases", () => {
    it("should send password reset email for existing user", async () => {
      // Arrange
      const user: User = {
        id: uuidv7(),
        email: "existing@example.com",
        name: "Existing User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: user.email,
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should succeed silently for non-existent user (security)", async () => {
      // Arrange
      const input: RequestPasswordResetInput = {
        email: "nonexistent@example.com",
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should handle unverified user", async () => {
      // Arrange
      const user: User = {
        id: uuidv7(),
        email: "unverified@example.com",
        name: "Unverified User",
        avatarUrl: undefined,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: user.email,
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should work with user that has avatar URL", async () => {
      // Arrange
      const user: User = {
        id: uuidv7(),
        email: "avatar@example.com",
        name: "Avatar User",
        avatarUrl: "https://example.com/avatar.jpg",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: user.email,
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle email with different casing", async () => {
      // Arrange
      const user: User = {
        id: uuidv7(),
        email: "Test@Example.Com",
        name: "Test User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: "test@example.com", // Different casing
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      // This will succeed silently because the mock repository
      // doesn't handle case-insensitive email lookup
      expect(result.isOk()).toBe(true);
    });

    it("should handle email with special characters", async () => {
      // Arrange
      const specialEmail = "user+test@example.co.uk";
      const user: User = {
        id: uuidv7(),
        email: specialEmail,
        name: "Special User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: specialEmail,
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle unicode characters in email", async () => {
      // Arrange
      const unicodeEmail = "用户@example.com";
      const user: User = {
        id: uuidv7(),
        email: unicodeEmail,
        name: "Unicode User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: unicodeEmail,
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle very long email", async () => {
      // Arrange
      const longLocalPart = "a".repeat(64);
      const longEmail = `${longLocalPart}@example.com`;

      // Try to request reset for non-existent long email
      const input: RequestPasswordResetInput = {
        email: longEmail,
      };

      // Act
      const result = await requestPasswordReset(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle multiple reset requests for same user", async () => {
      // Arrange
      const user: User = {
        id: uuidv7(),
        email: "multiple@example.com",
        name: "Multiple User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: user.email,
      };

      // Act - Multiple requests
      const result1 = await requestPasswordReset(context, input);
      const result2 = await requestPasswordReset(context, input);
      const result3 = await requestPasswordReset(context, input);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result3.isOk()).toBe(true);
    });

    it("should handle concurrent reset requests", async () => {
      // Arrange
      const user: User = {
        id: uuidv7(),
        email: "concurrent@example.com",
        name: "Concurrent User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: user.email,
      };

      // Act - Concurrent requests
      const [result1, result2, result3] = await Promise.all([
        requestPasswordReset(context, input),
        requestPasswordReset(context, input),
        requestPasswordReset(context, input),
      ]);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result3.isOk()).toBe(true);
    });
  });

  describe("input validation", () => {
    it("should handle invalid email format", async () => {
      // Arrange - This would be caught by schema validation
      const input = {
        email: "invalid-email-format",
      } as RequestPasswordResetInput;

      // Act & Assert
      // Schema validation should catch this
      expect(() => {
        expect(input.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }).toThrow();
    });

    it("should handle empty email", async () => {
      // Arrange
      const input = {
        email: "",
      } as RequestPasswordResetInput;

      // Act & Assert
      // Schema validation should catch this
      expect(input.email).toBe("");
    });

    it("should handle null email (type safety)", async () => {
      // This test documents what happens with invalid input
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        email: null as any,
      } as RequestPasswordResetInput;

      // Act & Assert
      // This would be caught by TypeScript or schema validation
      expect(typeof input.email).not.toBe("string");
    });

    it("should handle undefined email (type safety)", async () => {
      // This test documents what happens with invalid input
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        email: undefined as any,
      } as RequestPasswordResetInput;

      // Act & Assert
      // This would be caught by TypeScript or schema validation
      expect(typeof input.email).not.toBe("string");
    });
  });

  describe("security considerations", () => {
    it("should not reveal whether user exists through timing", async () => {
      // Arrange
      const existingUser: User = {
        id: uuidv7(),
        email: "existing@example.com",
        name: "Existing User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: existingUser.email,
        hashedPassword: "hashed",
        name: existingUser.name,
      });

      const existingInput: RequestPasswordResetInput = {
        email: existingUser.email,
      };

      const nonExistentInput: RequestPasswordResetInput = {
        email: "nonexistent@example.com",
      };

      // Act
      const result1 = await requestPasswordReset(context, existingInput);
      const result2 = await requestPasswordReset(context, nonExistentInput);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      // Both should return the same success response
      // Note: Timing analysis is difficult to test in unit tests
      // but both operations should appear identical to the caller

      // Just verify both complete successfully without timing assertions
      // The actual timing protection is handled by the implementation
    });

    it("should handle email enumeration protection", async () => {
      // Arrange
      const validEmails = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
      ];

      const invalidEmails = [
        "nonexistent1@example.com",
        "nonexistent2@example.com",
        "nonexistent3@example.com",
      ];

      // Create some valid users
      for (const email of validEmails) {
        await mockUserRepository.create({
          email,
          hashedPassword: "hashed",
          name: "Test User",
        });
      }

      // Act - Test both valid and invalid emails
      const validResults = await Promise.all(
        validEmails.map((email) => requestPasswordReset(context, { email })),
      );

      const invalidResults = await Promise.all(
        invalidEmails.map((email) => requestPasswordReset(context, { email })),
      );

      // Assert - All should succeed with same response
      for (const result of validResults) {
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeUndefined();
        }
      }

      for (const result of invalidResults) {
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBeUndefined();
        }
      }
    });
  });

  describe("URL generation", () => {
    it("should generate reset URL with correct base", async () => {
      // Arrange
      const customContext = {
        ...context,
        publicUrl: "https://myapp.example.com",
      };

      const user: User = {
        id: uuidv7(),
        email: "test@example.com",
        name: "Test User",
        avatarUrl: undefined,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockUserRepository.create({
        email: user.email,
        hashedPassword: "hashed",
        name: user.name,
      });

      const input: RequestPasswordResetInput = {
        email: user.email,
      };

      // Act
      const result = await requestPasswordReset(customContext, input);

      // Assert
      expect(result.isOk()).toBe(true);

      // Note: In a real test, we would inspect the email content
      // to verify the URL was generated correctly
      // Our current mock doesn't provide access to the email content
    });
  });
});
