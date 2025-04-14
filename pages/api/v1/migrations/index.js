import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator";

const router = createRouter();

router.get(getHandrer);
router.post(postHandrer);

export default router.handler(controller.errorHandlers);

async function getHandrer(request, response) {
  const pendingMigrations = await migrator.runMigrations({ dryRun: true });
  return response.status(200).json(pendingMigrations);
}
async function postHandrer(request, response) {
  const migratedMigrations = await migrator.runMigrations({ dryRun: false });

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }
  return response.status(200).json(migratedMigrations);
}
