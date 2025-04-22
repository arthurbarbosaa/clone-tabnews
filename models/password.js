import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return bcryptjs.hash(password, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(password, storedPassword) {
  return bcryptjs.compare(password, storedPassword);
}

const password = { hash, compare };
export default password;
