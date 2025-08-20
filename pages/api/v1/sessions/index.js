import authentication from "models/authentication";
import controller from "infra/controller.js";
import { createRouter } from "next-connect";
import session from "models/session";

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

  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}
