import retry from "async-retry";
import { faker } from "@faker-js/faker/.";
import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";

async function waitFroAllServices() {
  await waitFroWebServer();

  async function waitFroWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runMigrations({ dryRun: false });
}

async function createUser(userObject) {
  return await user.create({
    username:
      userObject.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email || faker.internet.email(),
    password: userObject.password || "validpassword",
  });
}

const orcherstrator = {
  waitFroAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orcherstrator;
