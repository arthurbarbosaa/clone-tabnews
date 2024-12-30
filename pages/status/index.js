import useSwr from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSwr("api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAt = "Carregando...";
  if (!isLoading && data) {
    updatedAt = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Última atualização: {updatedAt}</div>;
}

function DatabaseStatus() {
  const { isLoading, data } = useSwr("api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let databaseInfo = "Carreagando...";
  if (!isLoading && data) {
    databaseInfo = (
      <>
        <h2>Database:</h2>
        <div>Versão: {data.dependencies.database.postgres_version}</div>
        <div>
          Conexões abertas: {data.dependencies.database.using_connections}
        </div>
        <div>
          Conexões máximas: {data.dependencies.database.max_connections}
        </div>
      </>
    );
  }

  return databaseInfo;
}
