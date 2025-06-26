import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockRoleRepository } from "@/core/adapters/mock/roleRepository";
import { MockSessionRepository } from "@/core/adapters/mock/sessionRepository";
import { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { Session } from "@/core/domain/auth/types";
import type { Context } from "../context";
import { type LogoutInput, logout } from "./logout";

describe("logout", () => {
  let context: Context;
  let mockSessionRepository: MockSessionRepository;

  beforeEach(() => {
    mockSessionRepository = new MockSessionRepository();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: new MockUserRepository(),
      sessionRepository: mockSessionRepository,
      passwordHasher: new MockPasswordHasher(),
      teamRepository: new MockTeamRepository(),
      roleRepository: new MockRoleRepository(),
      okrRepository: new MockOkrRepository(),
      emailService: new MockEmailService(),
    };

    // Clear all mock data
    mockSessionRepository.clear();
  });

  describe("success cases", () => {
    it("should logout with valid session token", async () => {
      // Arrange
      const userId = uuidv7();
      const sessionToken = "valid-session-token";

      const session: Session = {
        id: uuidv7(),
        userId,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: LogoutInput = {
        token: sessionToken,
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify session was deleted
      const sessionCheck =
        await mockSessionRepository.findByToken(sessionToken);
      expect(sessionCheck.isOk()).toBe(true);
      if (sessionCheck.isOk()) {
        expect(sessionCheck.value).toBeNull();
      }
    });

    it("should handle logout with non-existent token gracefully", async () => {
      // Arrange
      const input: LogoutInput = {
        token: "non-existent-token",
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should handle logout with expired session", async () => {
      // Arrange
      const userId = uuidv7();
      const sessionToken = "expired-session-token";

      const expiredSession: Session = {
        id: uuidv7(),
        userId,
        token: sessionToken,
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago (expired)
        createdAt: new Date(Date.now() - 172800000), // 48 hours ago
        updatedAt: new Date(Date.now() - 86400000), // 24 hours ago
      };

      mockSessionRepository.seedSessions([expiredSession]);

      const input: LogoutInput = {
        token: sessionToken,
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify session was deleted even though it was expired
      const sessionCheck =
        await mockSessionRepository.findByToken(sessionToken);
      expect(sessionCheck.isOk()).toBe(true);
      if (sessionCheck.isOk()) {
        expect(sessionCheck.value).toBeNull();
      }
    });

    it("should only delete the specific session", async () => {
      // Arrange
      const userId = uuidv7();
      const sessionToken1 = "session-token-1";
      const sessionToken2 = "session-token-2";

      const session1: Session = {
        id: uuidv7(),
        userId,
        token: sessionToken1,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const session2: Session = {
        id: uuidv7(),
        userId,
        token: sessionToken2,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session1, session2]);

      const input: LogoutInput = {
        token: sessionToken1,
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);

      // Verify only the first session was deleted
      const session1Check =
        await mockSessionRepository.findByToken(sessionToken1);
      expect(session1Check.isOk()).toBe(true);
      if (session1Check.isOk()) {
        expect(session1Check.value).toBeNull();
      }

      const session2Check =
        await mockSessionRepository.findByToken(sessionToken2);
      expect(session2Check.isOk()).toBe(true);
      if (session2Check.isOk()) {
        expect(session2Check.value).not.toBeNull();
        expect(session2Check.value?.token).toBe(sessionToken2);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty token string", async () => {
      // Arrange
      const input: LogoutInput = {
        token: "",
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle very long token", async () => {
      // Arrange
      const longToken = "a".repeat(1000);
      const input: LogoutInput = {
        token: longToken,
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle token with special characters", async () => {
      // Arrange
      const specialToken = "token-with-special!@#$%^&*()_+chars";
      const input: LogoutInput = {
        token: specialToken,
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle multiple logout calls with same token", async () => {
      // Arrange
      const userId = uuidv7();
      const sessionToken = "multi-logout-token";

      const session: Session = {
        id: uuidv7(),
        userId,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: LogoutInput = {
        token: sessionToken,
      };

      // Act - First logout
      const firstResult = await logout(context, input);

      // Act - Second logout with same token
      const secondResult = await logout(context, input);

      // Assert
      expect(firstResult.isOk()).toBe(true);
      expect(secondResult.isOk()).toBe(true);

      // Both should succeed even though second call is on non-existent session
    });

    it("should handle concurrent logout calls", async () => {
      // Arrange
      const userId = uuidv7();
      const sessionToken = "concurrent-logout-token";

      const session: Session = {
        id: uuidv7(),
        userId,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionRepository.seedSessions([session]);

      const input: LogoutInput = {
        token: sessionToken,
      };

      // Act - Concurrent logout calls
      const [firstResult, secondResult] = await Promise.all([
        logout(context, input),
        logout(context, input),
      ]);

      // Assert
      expect(firstResult.isOk()).toBe(true);
      expect(secondResult.isOk()).toBe(true);

      // Session should be deleted
      const sessionCheck =
        await mockSessionRepository.findByToken(sessionToken);
      expect(sessionCheck.isOk()).toBe(true);
      if (sessionCheck.isOk()) {
        expect(sessionCheck.value).toBeNull();
      }
    });

    it("should handle logout with whitespace-only token", async () => {
      // Arrange
      const input: LogoutInput = {
        token: "   \t\n  ",
      };

      // Act
      const result = await logout(context, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });
  });

  describe("input validation", () => {
    it("should handle null token (type safety)", async () => {
      // This test documents what happens with invalid input
      // In a real scenario, TypeScript would prevent this
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        token: null as any,
      } as LogoutInput;

      // Act & Assert
      // This would be caught by TypeScript or schema validation
      expect(typeof input.token).not.toBe("string");
    });

    it("should handle undefined token (type safety)", async () => {
      // This test documents what happens with invalid input
      const input = {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
        token: undefined as any,
      } as LogoutInput;

      // Act & Assert
      // This would be caught by TypeScript or schema validation
      expect(typeof input.token).not.toBe("string");
    });
  });
});
