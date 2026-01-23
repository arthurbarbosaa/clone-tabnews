import activation from "models/activation";
import orchestrator from "tests/orchestrator";
import webserver from "infra/webserver";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitFroAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: registration flow (all successful)", () => {
  let createUserResponseBody;
  let activationTokenId;
  let createSessionResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "registration-flow-user",
          email: "registration.flow@email.com",
          password: "registration-flow-password",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "registration-flow-user",
      email: "registration.flow@email.com",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@boilersaas.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@email.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro");
    expect(lastEmail.text).toContain("registration-flow-user");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findOneValidById(activationTokenId);

    expect(activationTokenId).toBe(activationTokenObject.id);
    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used_at).toBeNull();
  });

  test("Activate user account", async () => {
    const activateUserResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activateUserResponse.status).toBe(200);

    const updatedToken = await activateUserResponse.json();

    expect(Date.parse(updatedToken.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(
      "registration-flow-user",
    );

    expect(activatedUser.features).toEqual([
      "create:session",
      "update:user",
      "read:session",
    ]);
  });
  test("Login", async () => {
    const createSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@email.com",
          password: "registration-flow-password",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createUserResponseBody.id);
  });
  test("Get user information", async () => {
    const getUserResponse = await fetch("http://localhost:3000/api/v1/user", {
      method: "GET",
      headers: {
        Cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });

    expect(getUserResponse.status).toBe(200);

    const getUserResponseBody = await getUserResponse.json();

    expect(getUserResponseBody.id).toBe(createUserResponseBody.id);
  });
});
