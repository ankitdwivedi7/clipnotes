import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret";

describe("Auth utilities", () => {
  describe("password hashing", () => {
    it("should hash and verify password", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare("wrong", hash)).toBe(false);
    });
  });

  describe("JWT tokens", () => {
    it("should create and verify valid token", () => {
      const payload = { userId: "test-id", email: "test@example.com" };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;
      expect(decoded.userId).toBe("test-id");
      expect(decoded.email).toBe("test@example.com");
    });

    it("should reject invalid token", () => {
      expect(() => jwt.verify("invalid-token", JWT_SECRET)).toThrow();
    });

    it("should reject token with wrong secret", () => {
      const token = jwt.sign({ userId: "test" }, JWT_SECRET);
      expect(() => jwt.verify(token, "wrong-secret")).toThrow();
    });
  });
});
