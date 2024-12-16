import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitFroAllServices();
});

test("GET to /api/v1/status shold return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status/");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();

  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  expect(responseBody.dependencies.database.postgres_version).toBe("16.0");
  expect(responseBody.dependencies.database.max_connections).toBe(100);
  expect(responseBody.dependencies.database.using_connections).toBe(1);
});
