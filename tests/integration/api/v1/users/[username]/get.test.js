import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitFroAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With with exact case match", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "SameCaseUsername",
          email: "same.case@email.com",
          password: "123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/SameCaseUsername",
        {
          method: "GET",
        },
      );

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "SameCaseUsername",
        email: "same.case@email.com",
        password: "123",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
      expect(response2.status).toBe(200);
    });
    test("With case mismatch", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "MismatchCaseUsername",
          email: "mismatch.case@email.com",
          password: "123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/mismatchcaseusername",
        {
          method: "GET",
        },
      );

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "MismatchCaseUsername",
        email: "mismatch.case@email.com",
        password: "123",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
      expect(response2.status).toBe(200);
    });
    test("With nonexistent user", async () => {
      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/NonExistentUsername",
        {
          method: "GET",
        },
      );

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });
  });
});
