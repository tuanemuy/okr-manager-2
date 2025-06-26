import { v7 as uuidv7 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import { MockOkrRepository } from "@/core/adapters/mock/okrRepository";
import { MockPasswordHasher } from "@/core/adapters/mock/passwordHasher";
import { MockRoleRepository } from "@/core/adapters/mock/roleRepository";
import { MockSessionRepository } from "@/core/adapters/mock/sessionRepository";
import { MockTeamRepository } from "@/core/adapters/mock/teamRepository";
import { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type {
  KeyResult,
  Objective,
  UpdateKeyResultProgressInput,
} from "@/core/domain/okr/types";
import type { Context } from "../context";
import { updateKeyResultProgress } from "./updateKeyResult";

describe("updateKeyResultProgress", () => {
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
    };

    // Clear all mock data
    mockOkrRepository.clear();
  });

  describe("success cases", () => {
    it("should update percentage key result progress", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Completion rate",
        type: "percentage",
        targetValue: 100,
        currentValue: 0,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 75,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedKeyResult = result.value;
        expect(updatedKeyResult.currentValue).toBe(75);
        expect(updatedKeyResult.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should update number key result progress", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Revenue target",
        type: "number",
        targetValue: 1000000,
        currentValue: 0,
        unit: "USD",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 750000,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedKeyResult = result.value;
        expect(updatedKeyResult.currentValue).toBe(750000);
      }
    });

    it("should update boolean key result progress to completed", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Complete audit",
        type: "boolean",
        targetValue: 1,
        currentValue: 0,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 1, // Mark as completed
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedKeyResult = result.value;
        expect(updatedKeyResult.currentValue).toBe(1);
      }
    });

    it("should update boolean key result progress to not completed", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

      const objective: Objective = {
        id: objectiveId,
        title: "Test Objective",
        type: "personal",
        ownerId: userId,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Complete task",
        type: "boolean",
        targetValue: 1,
        currentValue: 1, // Currently completed
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 0, // Mark as not completed
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedKeyResult = result.value;
        expect(updatedKeyResult.currentValue).toBe(0);
      }
    });

    it("should allow progress beyond target for number type", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Revenue target",
        type: "number",
        targetValue: 1000000,
        currentValue: 500000,
        unit: "USD",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 1200000, // Exceeds target
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedKeyResult = result.value;
        expect(updatedKeyResult.currentValue).toBe(1200000);
      }
    });
  });

  describe("failure cases", () => {
    it("should fail when key result does not exist", async () => {
      // Arrange
      const userId = uuidv7();
      const nonExistentKeyResultId = uuidv7();

      const input: UpdateKeyResultProgressInput = {
        currentValue: 50,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        nonExistentKeyResultId,
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Key result not found");
      }
    });

    it("should fail when user cannot edit objective", async () => {
      // Arrange
      const userId = uuidv7();
      const otherUserId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Unauthorized key result",
        type: "number",
        targetValue: 100,
        currentValue: 0,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 50,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "No permission to update this key result progress",
        );
      }
    });

    it("should fail when percentage current value is below 0", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Percentage KR",
        type: "percentage",
        targetValue: 100,
        currentValue: 50,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: -10, // Invalid negative percentage
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Percentage current value must be between 0 and 100",
        );
      }
    });

    it("should fail when percentage current value is above 100", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Percentage KR",
        type: "percentage",
        targetValue: 100,
        currentValue: 50,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 150, // Invalid over 100%
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Percentage current value must be between 0 and 100",
        );
      }
    });

    it("should fail when boolean current value is not 0 or 1", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Boolean KR",
        type: "boolean",
        targetValue: 1,
        currentValue: 0,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 0.5, // Invalid boolean value
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Boolean current value must be 0 or 1",
        );
      }
    });

    it("should fail when current value is negative for number type", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Number KR",
        type: "number",
        targetValue: 100,
        currentValue: 50,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: -10, // Invalid negative number
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Current value must be non-negative");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle percentage current value at boundary (0)", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Percentage KR",
        type: "percentage",
        targetValue: 100,
        currentValue: 50,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 0, // Valid boundary value
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(0);
      }
    });

    it("should handle percentage current value at boundary (100)", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Percentage KR",
        type: "percentage",
        targetValue: 100,
        currentValue: 50,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 100, // Valid boundary value
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(100);
      }
    });

    it("should handle number current value at boundary (0)", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Number KR",
        type: "number",
        targetValue: 100,
        currentValue: 50,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 0, // Valid boundary value
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(0);
      }
    });

    it("should handle very large number current value", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Number KR",
        type: "number",
        targetValue: 1000000,
        currentValue: 0,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: Number.MAX_SAFE_INTEGER,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(Number.MAX_SAFE_INTEGER);
      }
    });

    it("should handle fractional percentage values", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Percentage KR",
        type: "percentage",
        targetValue: 100,
        currentValue: 0,
        unit: "%",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 87.5,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(87.5);
      }
    });

    it("should handle fractional number values", async () => {
      // Arrange
      const userId = uuidv7();
      const objectiveId = uuidv7();
      const keyResultId = uuidv7();

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

      const keyResult: KeyResult = {
        id: keyResultId,
        objectiveId,
        title: "Number KR",
        type: "number",
        targetValue: 1000,
        currentValue: 0,
        unit: "units",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOkrRepository.seedObjectives([objective]);
      mockOkrRepository.seedKeyResults([keyResult]);

      const input: UpdateKeyResultProgressInput = {
        currentValue: 876.25,
      };

      // Act
      const result = await updateKeyResultProgress(
        context,
        userId,
        keyResultId,
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.currentValue).toBe(876.25);
      }
    });
  });
});
