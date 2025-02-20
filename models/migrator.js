import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database.js";

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
    await dbClient?.end();
  }
}

const migrator = {
  runMigrations,
};
export default migrator;
