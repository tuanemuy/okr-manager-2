import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockRoleRepository } from "@/core/adapters/mock/roleRepository";
import { MockSessionRepository } from "@/core/adapters/mock/sessionRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { Session } from "@/core/domain/auth/types";
import type { Context } from "../context";
import { ApplicationError } from "./register";
import { type ValidateSessionInput, validateSession } from "./validateSession";

// Mock implementations for missing repositories
class MockTeamRepository {
  // Minimal implementation for testing - extend as needed
}

class MockOkrRepository {
  // Minimal implementation for testing - extend as needed
}

describe("validateSession", () => {
  let context: Context;
  let mockUserRepository: MockUserRepository;
  let mockSessionRepository: MockSessionRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    mockSessionRepository = new MockSessionRepository();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: mockUserRepository,
      sessionRepository: mockSessionRepository,
      passwordHasher: new MockPasswordHasher(),
      // biome-ignore lint/suspicious/noExplicitAny: Test context requires full interface
      teamRepository: new MockTeamRepository() as any,
      roleRepository: new MockRoleRepository(),
      // biome-ignore lint/suspicious/noExplicitAny: Test context requires full interface
      okrRepository: new MockOkrRepository() as any,
      emailService: new MockEmailService(),
    };

    // Clear all mock data
    mockUserRepository.clear();
    mockSessionRepository.clear();
  });

  describe("success cases", () => {
    it("should validate valid session and return user", async () => {
      // Arrange
      const sessionToken = "valid-session-token";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "test@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const session: Session = {
        id: uuidv7(),
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Seed data
      mockSessionRepository.seedSessions([session]);
      mockSessionRepository.seedUsers([user]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { user: returnedUser, session: returnedSession } = result.value;

        expect(returnedUser.id).toBe(user.id);
        expect(returnedUser.email).toBe(user.email);
        expect(returnedUser.name).toBe(user.name);

        expect(returnedSession.id).toBe(session.id);
        expect(returnedSession.token).toBe(sessionToken);
        expect(returnedSession.userId).toBe(user.id);
      }
    });

    it("should work with session that expires soon but is still valid", async () => {
      // Arrange
      const sessionToken = "soon-expiring-token";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "test@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const session: Session = {
        id: uuidv7(),
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);
      mockSessionRepository.seedUsers([user]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should work with user that has avatar URL", async () => {
      // Arrange
      const sessionToken = "avatar-user-token";
      const avatarUrl = "https://example.com/avatar.jpg";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "avatar@example.com",
        hashedPassword: "hashed",
        name: "Avatar User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      // Update user with avatar URL
      const updateResult = await mockUserRepository.update({
        id: user.id,
        avatarUrl,
      });
      expect(updateResult.isOk()).toBe(true);

      const session: Session = {
        id: uuidv7(),
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { user: returnedUser } = result.value;
        expect(returnedUser.avatarUrl).toBe(avatarUrl);
      }
    });
  });

  describe("failure cases", () => {
    it("should fail with non-existent session token", async () => {
      // Arrange
      const input: ValidateSessionInput = {
        token: "non-existent-token",
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid session");
      }
    });

    it("should fail and delete expired session", async () => {
      // Arrange
      const sessionToken = "expired-session-token";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "test@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const session: Session = {
        id: uuidv7(),
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago (expired)
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Session expired");
      }

      // Verify session was deleted
      const sessionCheck =
        await mockSessionRepository.findByToken(sessionToken);
      expect(sessionCheck.isOk()).toBe(true);
      if (sessionCheck.isOk()) {
        expect(sessionCheck.value).toBeNull();
      }
    });

    it("should fail and delete session when user does not exist", async () => {
      // Arrange
      const nonExistentUserId = uuidv7();
      const sessionToken = "orphaned-session-token";

      const session: Session = {
        id: uuidv7(),
        userId: nonExistentUserId,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("User not found");
      }

      // Verify session was deleted
      const sessionCheck =
        await mockSessionRepository.findByToken(sessionToken);
      expect(sessionCheck.isOk()).toBe(true);
      if (sessionCheck.isOk()) {
        expect(sessionCheck.value).toBeNull();
      }
    });

    it("should fail with empty token", async () => {
      // Arrange
      const input: ValidateSessionInput = {
        token: "",
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ApplicationError);
        expect(result.error.message).toBe("Invalid session");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle session that expired exactly now", async () => {
      // Arrange
      const sessionToken = "exactly-expired-token";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "test@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const session: Session = {
        id: uuidv7(),
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now()), // Expires exactly now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);
      mockSessionRepository.seedUsers([user]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      // This could pass or fail depending on timing
      // but the session expiry check uses < not <=
      // so sessions that expire exactly now should still be valid
      expect(result.isOk()).toBe(true);
    });

    it("should handle session that expired 1ms ago", async () => {
      // Arrange
      const sessionToken = "just-expired-token";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "test@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const session: Session = {
        id: uuidv7(),
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() - 1), // 1ms ago
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: ValidateSessionInput = {
        token: sessionToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Session expired");
      }
    });

    it("should handle very long session token", async () => {
      // Arrange
      const longToken = "a".repeat(1000);
      const input: ValidateSessionInput = {
        token: longToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid session");
      }
    });

    it("should handle session token with special characters", async () => {
      // Arrange
      const specialToken = "token-with-special!@#$%^&*()_+chars";
      const input: ValidateSessionInput = {
        token: specialToken,
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid session");
      }
    });

    it("should handle whitespace-only token", async () => {
      // Arrange
      const input: ValidateSessionInput = {
        token: "   \t\n  ",
      };

      // Act
      const result = await validateSession(context, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid session");
      }
    });
  });

  describe("cleanup behavior", () => {
    it("should clean up expired sessions when validating", async () => {
      // Arrange
      const expiredToken = "expired-token";
      const validToken = "valid-token";

      // Create user and get the actual user ID
      const createUserResult = await mockUserRepository.create({
        email: "test@example.com",
        hashedPassword: "hashed",
        name: "Test User",
      });
      expect(createUserResult.isOk()).toBe(true);
      if (!createUserResult.isOk()) {
        throw new Error("Failed to create user");
      }
      const user = createUserResult.value;

      const expiredSession: Session = {
        id: uuidv7(),
        userId: user.id,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validSession: Session = {
        id: uuidv7(),
        userId: user.id,
        token: validToken,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([expiredSession, validSession]);
      mockSessionRepository.seedUsers([user]);

      // Act - Try to validate expired session
      const expiredResult = await validateSession(context, {
        token: expiredToken,
      });

      // Assert expired session validation fails
      expect(expiredResult.isErr()).toBe(true);

      // Verify expired session was deleted
      const expiredCheck =
        await mockSessionRepository.findByToken(expiredToken);
      if (expiredCheck.isOk()) {
        expect(expiredCheck.value).toBeNull();
      }

      // Verify valid session still exists
      const validCheck = await mockSessionRepository.findByToken(validToken);
      if (validCheck.isOk()) {
        expect(validCheck.value).not.toBeNull();
      }
    });

    it("should clean up orphaned sessions when validating", async () => {
      // Arrange
      const nonExistentUserId = uuidv7();
      const orphanedToken = "orphaned-token";

      const orphanedSession: Session = {
        id: uuidv7(),
        userId: nonExistentUserId,
        token: orphanedToken,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([orphanedSession]);

      // Act - Try to validate orphaned session
      const result = await validateSession(context, { token: orphanedToken });

      // Assert validation fails
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("User not found");
      }

      // Verify orphaned session was deleted
      const sessionCheck =
        await mockSessionRepository.findByToken(orphanedToken);
      if (sessionCheck.isOk()) {
        expect(sessionCheck.value).toBeNull();
      }
    });
  });
});
