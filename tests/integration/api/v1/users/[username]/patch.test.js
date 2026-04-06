import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "uniqueUser1",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          'Verifique se seu usuario possui a feature "update:user" e tente novamente.',
        message: "Você não tem permissão para fazer essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/NonExistentUsername",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado.",
        action: "Verifique o username informado e tente novamente.",
        status_code: 404,
      });
    });
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });
      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      await orchestrator.activateUser(createdUser2);
      const user2SessionObject = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user2SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Informe outro username para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With `userB` targeting `userA`", async () => {
      await orchestrator.createUser({
        username: "userA",
      });
      const createdUser2 = await orchestrator.createUser({
        username: "userB",
      });
      await orchestrator.activateUser(createdUser2);
      const user2SessionObject = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/userA", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user2SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "userC",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário.",
        message: "Você não tem permissão para atualizar outro usuário.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@email.com",
      });
      const createdUser2 = await orchestrator.createUser({
        email: "email2@email.com",
      });
      await orchestrator.activateUser(createdUser2);
      const user2SessionObject = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user2SessionObject.token}`,
          },
          body: JSON.stringify({
            email: "email1@email.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Informe outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With unique 'username'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "uniqueUsername1",
      });
      await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUsername1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUsername2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUsername2",
        features: ["create:session", "update:user", "read:session"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser({
        email: "uniqueEmail1@email.com",
      });
      await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@email.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ["create:session", "update:user", "read:session"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser({
        password: "newPassword1",
      });
      await orchestrator.activateUser(createdUser);
      const userSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userSessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        features: ["create:session", "update:user", "read:session"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
  describe("Privileged user", () => {
    test("With `update:user:others` feature targeting `defaultUser`", async () => {
      const privlegedUser = await orchestrator.createUser();
      const activatedPrivlegedUser =
        await orchestrator.activateUser(privlegedUser);
      const privlegedUserSessionObject = await orchestrator.createSession(
        activatedPrivlegedUser.id,
      );

      await orchestrator.addFeaturesToUser(activatedPrivlegedUser, [
        "update:user:others",
      ]);

      const defaultUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privlegedUserSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "changedByPrivlegedUser",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: "changedByPrivlegedUser",
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
