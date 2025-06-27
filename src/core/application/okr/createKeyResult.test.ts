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
import type { CreateKeyResultInput, Objective } from "@/core/domain/okr/types";
import type { Context } from "../context";
import { createKeyResult } from "./createKeyResult";

describe("createKeyResult", () => {
  let context: Context;
  let mockOkrRepository: MockOkrRepository;

  beforeEach(() => {
    mockOkrRepository = new MockOkrRepository();

    context = {
      publicUrl: "http://localhost:3000",
      userRepository: new MockUserRepository(),
      sessionRepository: new MockSessionRepository(),
      passwordHasher: new MockPasswordHasher(),
      teamRepository: new MockTeamRepository(),
      roleRepository: new MockRoleRepository(),
      okrRepository: mockOkrRepository,
      emailService: new MockEmailService(),
      logger: new MockLogger(),
    };

    // Clear all mock data
    mockOkrRepository.clear();
  });

  describe("success cases", () => {
    it("should create percentage key result with valid input", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Increase completion rate",
        description: "Improve task completion rate",
        type: "percentage",
        targetValue: 85,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResult = result.value;

        expect(keyResult.objectiveId).toBe(objectiveId);
        expect(keyResult.title).toBe(input.title);
        expect(keyResult.description).toBe(input.description);
        expect(keyResult.type).toBe(input.type);
        expect(keyResult.targetValue).toBe(input.targetValue);
        expect(keyResult.currentValue).toBe(0); // Default starting value
        expect(keyResult.unit).toBe(input.unit);
        expect(keyResult.startDate).toEqual(input.startDate);
        expect(keyResult.endDate).toEqual(input.endDate);
        expect(keyResult.status).toBe("active");
        expect(keyResult.id).toBeDefined();
        expect(keyResult.createdAt).toBeInstanceOf(Date);
        expect(keyResult.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create number key result with valid input", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Sales Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Generate revenue",
        description: "Achieve sales target",
        type: "number",
        targetValue: 1000000,
        unit: "USD",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResult = result.value;
        expect(keyResult.type).toBe("number");
        expect(keyResult.targetValue).toBe(1000000);
        expect(keyResult.unit).toBe("USD");
      }
    });

    it("should create boolean key result with valid input", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Compliance Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Complete audit",
        description: "Pass security audit",
        type: "boolean",
        targetValue: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResult = result.value;
        expect(keyResult.type).toBe("boolean");
        expect(keyResult.targetValue).toBe(1);
        expect(keyResult.unit).toBeUndefined();
      }
    });

    it("should create key result with minimal valid data", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Minimal Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-02"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Minimal KR",
        type: "number",
        targetValue: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-02"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const keyResult = result.value;
        expect(keyResult.description).toBeUndefined();
        expect(keyResult.unit).toBeUndefined();
      }
    });
  });

  describe("failure cases", () => {
    it("should fail when objective does not exist", async () => {
      // Arrange
      const userId = uuidv7();
      const nonExistentObjectiveId = uuidv7();

      const input: CreateKeyResultInput = {
        objectiveId: nonExistentObjectiveId,
        title: "Orphaned key result",
        type: "number",
        targetValue: 100,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Objective not found");
      }
    });

    it("should fail when user cannot edit objective", async () => {
      // Arrange
      const userId = uuidv7();
      const otherUserId = uuidv7();
      const objectiveId = uuidv7();

      // Create objective owned by another user
      const objective: Objective = {
        id: objectiveId,
        title: "Other user's objective",
        type: "personal",
        ownerId: otherUserId, // Different owner
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Unauthorized key result",
        type: "number",
        targetValue: 100,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "No permission to add key results to this objective",
        );
      }
    });

    it("should fail when start date is after end date", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Invalid dates key result",
        type: "number",
        targetValue: 100,
        startDate: new Date("2024-12-31"),
        endDate: new Date("2024-01-01"), // Before start date
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Start date must be before end date");
      }
    });

    it("should fail when key result dates are outside objective dates", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Limited Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-06-30"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Out of bounds key result",
        type: "number",
        targetValue: 100,
        startDate: new Date("2024-01-01"), // Before objective start
        endDate: new Date("2024-12-31"), // After objective end
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Key result dates must be within objective date range",
        );
      }
    });

    it("should fail when percentage target value is below 0", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Invalid percentage",
        type: "percentage",
        targetValue: -10, // Invalid negative percentage
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Percentage target value must be between 0 and 100",
        );
      }
    });

    it("should fail when percentage target value is above 100", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Invalid percentage",
        type: "percentage",
        targetValue: 150, // Invalid over 100%
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Percentage target value must be between 0 and 100",
        );
      }
    });

    it("should fail when boolean target value is not 1", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Invalid boolean",
        type: "boolean",
        targetValue: 0, // Invalid boolean target (should be 1)
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Boolean target value must be 1");
      }
    });

    it("should fail when number target value is negative", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Invalid number",
        type: "number",
        targetValue: -100, // Invalid negative number
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Number target value must be non-negative",
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle percentage target value at boundary (0)", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Zero percentage",
        type: "percentage",
        targetValue: 0, // Valid boundary value
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle percentage target value at boundary (100)", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Full percentage",
        type: "percentage",
        targetValue: 100, // Valid boundary value
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle number target value at boundary (0)", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Zero target",
        type: "number",
        targetValue: 0, // Valid boundary value
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it("should handle very large number target value", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Huge target",
        type: "number",
        targetValue: Number.MAX_SAFE_INTEGER,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.targetValue).toBe(Number.MAX_SAFE_INTEGER);
      }
    });

    it("should handle fractional percentage values", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Fractional percentage",
        type: "percentage",
        targetValue: 85.5,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.targetValue).toBe(85.5);
      }
    });

    it("should handle unicode characters in title and description", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const unicodeTitle = "売上を向上させる 📈";
      const unicodeDescription = "収益を25%増加させる 💰";
      const unicodeUnit = "円";

      const input: CreateKeyResultInput = {
        objectiveId,
        title: unicodeTitle,
        description: unicodeDescription,
        type: "number",
        targetValue: 1000000,
        unit: unicodeUnit,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe(unicodeTitle);
        expect(result.value.description).toBe(unicodeDescription);
        expect(result.value.unit).toBe(unicodeUnit);
      }
    });

    it("should handle key result dates exactly matching objective dates", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-03-31");

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate,
        endDate,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);

      const input: CreateKeyResultInput = {
        objectiveId,
        title: "Matching dates",
        type: "number",
        targetValue: 100,
        startDate, // Same as objective
        endDate, // Same as objective
      };

      // Act
      const result = await createKeyResult(context, userId, input);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.startDate).toEqual(startDate);
        expect(result.value.endDate).toEqual(endDate);
      }
    });
  });
});
