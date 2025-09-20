import email from "infra/email";
import orcherstrator from "tests/orchestrator";

beforeAll(async () => {
  await orcherstrator.waitFroAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orcherstrator.deleteAllEmails();

    await email.send({
      from: "Template <template@email.com >",
      to: "contato@curso.dev",
      subject: "Test subject",
      text: "Test body.",
    });

    await email.send({
      from: "Template <template@email.com >",
      to: "contato@curso.dev",
      subject: "Last email subject",
      text: "Last email body.",
    });

    const lastEmail = await orcherstrator.getLastEmail();
    expect(lastEmail.sender).toBe("<template@email.com>");
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe("Last email subject");
    expect(lastEmail.text).toBe("Last email body.\n");
  });
});
