import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].max_connections;

    const databaseName = process.env.POSTGRES_DB;
    const databaseOpenedConnectionsResult = await database.query({
      text: "SELECT COUNT(*)::int as opened_connections FROM pg_stat_activity WHERE datname = $1 ;",
      values: [databaseName],
    });
    const databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].opened_connections;

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          postgres_version: databaseVersionValue,
          max_connections: parseInt(databaseMaxConnectionsValue),
          using_connections: databaseOpenedConnectionsValue,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    console.log(publicErrorObject);
    return response.status(500).json(publicErrorObject);
  }
}

export default status;
