import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function validateUniqueUsername(username) {
    const result = await database.query({
      text: "SELECT username FROM users WHERE LOWER(username) = LOWER($1);",
      values: [username],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado.",
        action: "Informe outro username para realizar o cadastro.",
      });
    }
  }
  async function validateUniqueEmail(email) {
    const result = await database.query({
      text: "SELECT email FROM users WHERE LOWER(email) = LOWER($1);",
      values: [email],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado.",
        action: "Informe outro email para realizar o cadastro.",
      });
    }
  }
  async function runInsertQuery(userInputValues) {
    const result = await database.query({
      text: "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *;",
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });
    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  const user = await runSelectQuery(username);
  return user;

  async function runSelectQuery(username) {
    console.log(username);
    const result = await database.query({
      text: `
      SELECT
        * 
      FROM 
        users
      WHERE 
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });
    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado.",
        action: "Verifique o username informado e tente novamente.",
      });
    }
    return result.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
