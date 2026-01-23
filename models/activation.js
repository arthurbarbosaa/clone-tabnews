import database from "infra/database";
import webserver from "infra/webserver";
import email from "infra/email";
import user from "./user";
import authorization from "./authorization";
import { ForbiddenError, NotFoundError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 15 * 60 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }
}

async function findOneValidById(tokenId) {
  const validToken = await runSelectQuery(tokenId);

  if (!validToken) {
    throw new NotFoundError({
      message:
        "O token de ativação usado não foi encontrado no sistema ou expirou.",
      action: `Faça um novo cadastro.`,
    });
  }

  return validToken;

  async function runSelectQuery(tokenId) {
    console.log("Finding token:", tokenId);
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT 1
      ;`,
      values: [tokenId],
    });
    return result.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "BoilerSaaS <contato@boilersaas.com.br>",
    to: user.email,
    subject: "Ative seu cadastro",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro.


${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe BoilerSaaS
`,
  });
}

async function markTokenAsUsed(tokenId) {
  const updatedToken = await runUpdateQuery(tokenId);

  return updatedToken;

  async function runUpdateQuery(tokenId) {
    const result = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [tokenId],
    });
    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActive = await user.findOneById(userId);

  if (!authorization.can(userToActive, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const actvatedUser = await user.setFeatures(userId, [
    "create:session",
    "update:user",
    "read:session",
  ]);
  return actvatedUser;
}

const activation = {
  create,
  findOneValidById,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
