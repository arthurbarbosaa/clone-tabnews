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
      const createdUser = await orchestrator.createUser({
        username: "SameCaseUsername",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/SameCaseUsername",
        {
          method: "GET",
        },
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "SameCaseUsername",
        email: createdUser.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(response.status).toBe(200);
    });
    test("With case mismatch", async () => {
      const createdUser = await orchestrator.createUser({
        username: "MismatchCaseUsername",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/mismatchcaseusername",
        {
          method: "GET",
        },
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "MismatchCaseUsername",
        email: createdUser.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(response.status).toBe(200);
    });
    test("With nonexistent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/NonExistentUsername",
        {
          method: "GET",
        },
      );

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });
  });
});
