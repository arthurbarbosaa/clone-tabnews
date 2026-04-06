import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para fazer essa ação.",
        action:
          'Verifique se seu usuario possui a feature "create:migration" e tente novamente.',
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
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
          'Verifique se seu usuario possui a feature "create:migration" e tente novamente.',
        status_code: 403,
      });
    });
  });
  describe("Privileged user", () => {
    test("Running pending migrations with `create:migration` feature", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      await orchestrator.addFeaturesToUser(createdUser, ["create:migration"]);
      const userSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
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
