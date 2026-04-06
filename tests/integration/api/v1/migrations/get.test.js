import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retriving pending migrations", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para fazer essa ação.",
        action:
          'Verifique se seu usuario possui a feature "read:migration" e tente novamente.',
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("Retriving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userSessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para fazer essa ação.",
        action:
          'Verifique se seu usuario possui a feature "read:migration" e tente novamente.',
        status_code: 403,
      });
    });
  });
  describe("Privileged user", () => {
    test("Retriving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["read:migration"]);
      const userSessionObject = await orchestrator.createSession(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${userSessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
