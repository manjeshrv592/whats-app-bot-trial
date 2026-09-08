const prisma = require("../services/db");
const { CONTENT, render } = require("./content");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each step: contentKey into CONTENT, expected input `type`, the User `field`
// it saves to (if any), and `next(answerId, user)` to compute the following step.
const STEPS = {
  ASK_CONSENT: {
    contentKey: "askConsent",
    type: "buttons",
  },
  ASK_NAME: {
    contentKey: "askName",
    type: "text",
    field: "name",
    next: () => "ASK_FREQUENCY",
  },
  ASK_FREQUENCY: {
    contentKey: "askFrequency",
    type: "list",
    field: "travelFrequency",
    vars: (user) => ({ name: user.name }),
    next: () => "ASK_HOME_AREA",
  },
  ASK_HOME_AREA: {
    contentKey: "askHomeArea",
    type: "text",
    field: "homeArea",
    next: () => "ASK_SHARE_ORIGIN_GEO",
  },
  ASK_SHARE_ORIGIN_GEO: {
    contentKey: "askShareOriginGeo",
    type: "buttons",
    next: (answerId) => (answerId === "YES" ? "ASK_ORIGIN_LOCATION" : "ASK_NEAREST_STATION"),
  },
  ASK_ORIGIN_LOCATION: {
    contentKey: "askOriginLocation",
    type: "location",
    locationFields: ["originLat", "originLng"],
    next: () => "ASK_NEAREST_STATION",
  },
  ASK_NEAREST_STATION: {
    contentKey: "askNearestStation",
    type: "list",
    field: "nearestStation",
    skipSaveWhen: (id) => id === "OTHERS",
    next: (answerId) => (answerId === "OTHERS" ? "ASK_NEAREST_STATION_OTHER" : "ASK_FEEDER_MODE"),
  },
  ASK_NEAREST_STATION_OTHER: {
    contentKey: "askNearestStationOther",
    type: "text",
    field: "nearestStation",
    next: () => "ASK_FEEDER_MODE",
  },
  ASK_FEEDER_MODE: {
    contentKey: "askFeederMode",
    type: "list",
    field: "feederMode",
    skipSaveWhen: (id) => id === "OTHERS",
    next: (answerId) => (answerId === "OTHERS" ? "ASK_FEEDER_MODE_OTHER" : "ASK_DESTINATION_STATION"),
  },
  ASK_FEEDER_MODE_OTHER: {
    contentKey: "askFeederModeOther",
    type: "text",
    field: "feederMode",
    next: () => "ASK_DESTINATION_STATION",
  },
  ASK_DESTINATION_STATION: {
    contentKey: "askDestinationStation",
    type: "list",
    field: "destinationStation",
    skipSaveWhen: (id) => id === "OTHERS",
    next: (answerId) => (answerId === "OTHERS" ? "ASK_DESTINATION_STATION_OTHER" : "ASK_DISTRIBUTION_MODE"),
  },
  ASK_DESTINATION_STATION_OTHER: {
    contentKey: "askDestinationStationOther",
    type: "text",
    field: "destinationStation",
    next: () => "ASK_DISTRIBUTION_MODE",
  },
  ASK_DISTRIBUTION_MODE: {
    contentKey: "askDistributionMode",
    type: "list",
    field: "distributionMode",
    skipSaveWhen: (id) => id === "OTHERS",
    next: (answerId) => (answerId === "OTHERS" ? "ASK_DISTRIBUTION_MODE_OTHER" : "ASK_DEST_AREA"),
  },
  ASK_DISTRIBUTION_MODE_OTHER: {
    contentKey: "askDistributionModeOther",
    type: "text",
    field: "distributionMode",
    next: () => "ASK_DEST_AREA",
  },
  ASK_DEST_AREA: {
    contentKey: "askDestArea",
    type: "text",
    field: "destinationArea",
    next: () => "ASK_SHARE_DEST_GEO",
  },
  ASK_SHARE_DEST_GEO: {
    contentKey: "askShareDestGeo",
    type: "buttons",
    next: (answerId) => (answerId === "YES" ? "ASK_DEST_LOCATION" : "ASK_EMAIL"),
  },
  ASK_DEST_LOCATION: {
    contentKey: "askDestLocation",
    type: "location",
    locationFields: ["destLat", "destLng"],
    next: () => "ASK_EMAIL",
  },
  ASK_EMAIL: {
    contentKey: "askEmail",
    type: "text",
    field: "email",
    validate: (value) => EMAIL_REGEX.test(value),
    invalidValueContentKey: "invalidEmail",
    next: () => "ASK_SMART_CARD",
  },
  ASK_SMART_CARD: {
    contentKey: "askSmartCard",
    type: "text",
    field: "smartCardNumber",
    next: () => "DONE",
  },
};

function getSelectLabel(language) {
  return language === "kn" ? "ಆಯ್ಕೆಮಾಡಿ" : "Select";
}

function toSendSpec(rendered, type, language) {
  if (type === "buttons") {
    return { kind: "buttons", body: rendered.body, buttons: rendered.options };
  }
  if (type === "list") {
    return { kind: "list", body: rendered.body, buttonLabel: getSelectLabel(language), rows: rendered.options };
  }
  return { kind: "text", body: rendered.body };
}

function textReply(contentKey, language, vars = {}) {
  return toSendSpec(render(contentKey, language, vars), "text", language);
}

function renderStep(stepKey, language, user) {
  if (stepKey === "DONE") return textReply("done", language);
  const step = STEPS[stepKey];
  const vars = step.vars ? step.vars(user) : {};
  const rendered = render(step.contentKey, language, vars);
  return toSendSpec(rendered, step.type, language);
}

function validateInput(step, input, language) {
  if (step.type === "text") {
    let textValue = null;
    if (input.type === "text") textValue = input.value.trim();
    else if (input.type === "interactive") textValue = input.title;
    else return { ok: false, reason: "expected_text" };

    if (!textValue) return { ok: false, reason: "invalid_value" };
    if (step.validate && !step.validate(textValue)) return { ok: false, reason: "invalid_value" };
    return { ok: true, textValue };
  }

  if (step.type === "buttons" || step.type === "list") {
    if (input.type !== "interactive") return { ok: false, reason: "expected_choice" };
    const rendered = render(step.contentKey, language, {});
    const match = (rendered.options || []).find((o) => o.id === input.id);
    if (!match) return { ok: false, reason: "expected_choice" };
    return { ok: true, answerId: input.id, answerTitle: input.title || match.title };
  }

  if (step.type === "location") {
    if (input.type !== "location") return { ok: false, reason: "expected_location" };
    return { ok: true };
  }

  return { ok: false, reason: "expected_choice" };
}

function buildMismatchReply(step, language, reason, user) {
  const vars = step.vars ? step.vars(user) : {};
  const rendered = render(step.contentKey, language, vars);

  let nudgeKey;
  if (reason === "expected_location") nudgeKey = "pleaseShareLocation";
  else if (reason === "invalid_value") nudgeKey = step.invalidValueContentKey || "invalidText";
  else nudgeKey = "pleaseUseButtons";

  const nudge = CONTENT[nudgeKey][language].body;
  const body = `${nudge}\n\n${rendered.body}`;
  return toSendSpec({ body, options: rendered.options }, step.type, language);
}

async function handleIncomingMessage(phoneNumber, input) {
  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: {},
    create: { phoneNumber },
  });

  let session = await prisma.session.findUnique({ where: { phoneNumber } });

  if (!session) {
    await prisma.session.create({ data: { phoneNumber, currentStep: "ASK_LANGUAGE" } });
    return { kind: "buttons", body: CONTENT.welcomeLanguage.body, buttons: CONTENT.welcomeLanguage.buttons };
  }

  const currentStep = session.currentStep;
  const language = user.language || "en";

  if (currentStep === "DONE" || currentStep === "CANCELLED") {
    return textReply("alreadyCompleted", language);
  }

  if (currentStep === "ASK_LANGUAGE") {
    if (input.type === "interactive" && (input.id === "en" || input.id === "kn")) {
      await prisma.user.update({ where: { phoneNumber }, data: { language: input.id } });
      await prisma.session.update({ where: { phoneNumber }, data: { currentStep: "ASK_CONSENT" } });
      return toSendSpec(render("askConsent", input.id, {}), "buttons", input.id);
    }
    return { kind: "buttons", body: CONTENT.welcomeLanguage.body, buttons: CONTENT.welcomeLanguage.buttons };
  }

  const step = STEPS[currentStep];
  const validation = validateInput(step, input, language);

  if (!validation.ok) {
    return buildMismatchReply(step, language, validation.reason, user);
  }

  if (currentStep === "ASK_CONSENT") {
    const consented = validation.answerId === "YES";
    await prisma.user.update({ where: { phoneNumber }, data: { consented } });
    if (!consented) {
      await prisma.session.update({ where: { phoneNumber }, data: { currentStep: "CANCELLED" } });
      return textReply("consentDeclined", language);
    }
    await prisma.session.update({ where: { phoneNumber }, data: { currentStep: "ASK_NAME" } });
    return renderStep("ASK_NAME", language, user);
  }

  if (step.type === "location") {
    const data = {
      [step.locationFields[0]]: input.lat,
      [step.locationFields[1]]: input.lng,
    };
    await prisma.user.update({ where: { phoneNumber }, data });
    const nextStep = step.next();
    await prisma.session.update({ where: { phoneNumber }, data: { currentStep: nextStep } });
    return renderStep(nextStep, language, { ...user, ...data });
  }

  const updates = {};
  if (step.field && !(step.skipSaveWhen && step.skipSaveWhen(validation.answerId))) {
    updates[step.field] = step.type === "text" ? validation.textValue : validation.answerTitle;
  }
  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { phoneNumber }, data: updates });
  }

  const nextStep = step.next(validation.answerId, user);
  await prisma.session.update({ where: { phoneNumber }, data: { currentStep: nextStep } });

  return renderStep(nextStep, language, { ...user, ...updates });
}

module.exports = { handleIncomingMessage, STEPS };
