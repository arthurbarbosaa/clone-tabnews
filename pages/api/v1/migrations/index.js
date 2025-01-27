import { createRouter } from "next-connect";
import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandrer);
router.post(postHandrer);

export default router.handler(controller.errorHandlers);

async function getHandrer(request, response) {
  const pendingMigrations = await runMigrations({ dryRun: true });
  return response.status(200).json(pendingMigrations);
}
async function postHandrer(request, response) {
  const migratedMigrations = await runMigrations({ dryRun: false });

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }
  return response.status(200).json(migratedMigrations);
}

async function runMigrations({ dryRun }) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const defaultMigrationOptions = {
      dbClient: dbClient,
      dryRun,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    return await migrationRunner(defaultMigrationOptions);
  } finally {
    await dbClient.end();
  }
}
