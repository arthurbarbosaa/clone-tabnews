import authentication from "models/authentication";
import controller from "infra/controller.js";
import { createRouter } from "next-connect";
import session from "models/session";
import * as cookie from "cookie";

const router = createRouter();

router.post(postHandrer);

export default router.handler(controller.errorHandlers);

async function postHandrer(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);

  return response.status(201).json(newSession);
}
