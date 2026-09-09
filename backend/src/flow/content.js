// Option row/button titles must respect WhatsApp limits: button titles <= 20 chars,
// list row titles <= 24 chars. Longer detail goes into a row's `description` instead.

const STATIONS = {
  en: [
    { id: "MAJESTIC", title: "Majestic (KSR)" },
    { id: "MG_ROAD", title: "MG Road" },
    { id: "YELACHENAHALLI", title: "Yelachenahalli" },
    { id: "BAIYAPPANAHALLI", title: "Baiyappanahalli" },
    { id: "WHITEFIELD", title: "Whitefield (Kadugodi)" },
    { id: "OTHERS", title: "Others" },
  ],
  kn: [
    { id: "MAJESTIC", title: "ಮೆಜೆಸ್ಟಿಕ್ (KSR)" },
    { id: "MG_ROAD", title: "ಎಂಜಿ ರೋಡ್" },
    { id: "YELACHENAHALLI", title: "ಯಲಚೇನಹಳ್ಳಿ" },
    { id: "BAIYAPPANAHALLI", title: "ಬಾಯಪ್ಪನಹಳ್ಳಿ" },
    { id: "WHITEFIELD", title: "ವೈಟ್‌ಫೀಲ್ಡ್ (ಕಾಡುಗೋಡಿ)" },
    { id: "OTHERS", title: "ಇತರೆ" },
  ],
};

const TRAVEL_MODES = {
  en: [
    { id: "WALK", title: "Walk" },
    { id: "BICYCLE", title: "Bicycle" },
    { id: "AUTO_RICKSHAW", title: "Auto-rickshaw" },
    { id: "BMTC_BUS", title: "BMTC Bus" },
    { id: "PRIVATE_VEHICLE", title: "Private Vehicle", description: "Car / Bike" },
    { id: "CAB", title: "Cab", description: "Ola / Uber" },
    { id: "OTHERS", title: "Others" },
  ],
  kn: [
    { id: "WALK", title: "ನಡಿಗೆ" },
    { id: "BICYCLE", title: "ಸೈಕಲ್" },
    { id: "AUTO_RICKSHAW", title: "ಆಟೋ-ರಿಕ್ಷಾ" },
    { id: "BMTC_BUS", title: "BMTC ಬಸ್" },
    { id: "PRIVATE_VEHICLE", title: "ಸ್ವಂತ ವಾಹನ", description: "ಕಾರ್ / ಬೈಕ್" },
    { id: "CAB", title: "ಕ್ಯಾಬ್", description: "Ola / Uber" },
    { id: "OTHERS", title: "ಇತರೆ" },
  ],
};

const FREQUENCY = {
  en: [
    { id: "DAILY", title: "Daily" },
    { id: "FEW_TIMES_WEEK", title: "Few times a week" },
    { id: "RARELY", title: "Rarely" },
    { id: "FIRST_TIME", title: "First time" },
  ],
  kn: [
    { id: "DAILY", title: "ಪ್ರತಿದಿನ" },
    { id: "FEW_TIMES_WEEK", title: "ವಾರಕ್ಕೆ ಕೆಲವು ಬಾರಿ" },
    { id: "RARELY", title: "ಅಪರೂಪವಾಗಿ" },
    { id: "FIRST_TIME", title: "ಮೊದಲ ಬಾರಿ" },
  ],
};

const YES_NO = {
  en: [
    { id: "YES", title: "YES" },
    { id: "NO", title: "NO" },
  ],
  kn: [
    { id: "YES", title: "ಹೌದು" },
    { id: "NO", title: "ಇಲ್ಲ" },
  ],
};

const OPTION_SETS = {
  stations: STATIONS,
  travelModes: TRAVEL_MODES,
  frequency: FREQUENCY,
  yesNo: YES_NO,
};

const CONTENT = {
  welcomeLanguage: {
    body:
      "Welcome to Namma Transit last mile commute survey! Which language do you want to continue with?\n\n" +
      "ನಮ್ಮ ಟ್ರಾನ್ಸಿಟ್ ಕೊನೆಯ ಮೈಲಿ ಪ್ರಯಾಣ ಸಮೀಕ್ಷೆಗೆ ಸುಸ್ವಾಗತ! ನೀವು ಯಾವ ಭಾಷೆಯಲ್ಲಿ ಮುಂದುವರಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    buttons: [
      { id: "en", title: "English" },
      { id: "kn", title: "ಕನ್ನಡ" },
    ],
  },

  askConsent: {
    en: {
      body:
        "We'd appreciate a minute of your time to gather your last mile commuter experience through a quick survey. " +
        "As a thank you, you'll receive reward points on your Smart Card. Ready to help us improve your journey?",
      options: "yesNo",
    },
    kn: {
      body:
        "ನಿಮ್ಮ ಕೊನೆಯ ಮೈಲಿ ಪ್ರಯಾಣದ ಅನುಭವವನ್ನು ಸಂಗ್ರಹಿಸಲು ದಯವಿಟ್ಟು ಒಂದು ನಿಮಿಷ ಸಮಯ ನೀಡಿ. " +
        "ಧನ್ಯವಾದವಾಗಿ, ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್‌ಗೆ ರಿವಾರ್ಡ್ ಪಾಯಿಂಟ್‌ಗಳು ಸಿಗುತ್ತವೆ. ನಿಮ್ಮ ಪ್ರಯಾಣ ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧರಿದ್ದೀರಾ?",
      options: "yesNo",
    },
  },

  consentDeclined: {
    en: { body: "Thanks for your choice. Have a nice day from TRANSIT CORPORATION!" },
    kn: { body: "ನಿಮ್ಮ ಆಯ್ಕೆಗೆ ಧನ್ಯವಾದಗಳು. TRANSIT CORPORATION ಕಡೆಯಿಂದ ಶುಭ ದಿನ!" },
  },

  askName: {
    en: { body: "Before we begin, may I have your name, please?" },
    kn: { body: "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ತಿಳಿಸುವಿರಾ?" },
  },

  askFrequency: {
    en: { body: "Awesome {name}! Let's begin. How often do you use the Transit?", options: "frequency" },
    kn: { body: "ಅದ್ಭುತ {name}! ಪ್ರಾರಂಭಿಸೋಣ. ನೀವು ಎಷ್ಟು ಬಾರಿ ಟ್ರಾನ್ಸಿಟ್ ಬಳಸುತ್ತೀರಿ?", options: "frequency" },
  },

  askHomeArea: {
    en: { body: "Which area or locality do you live in?\nEx. Indiranagar, Jayanagar, Whitefield" },
    kn: { body: "ನೀವು ಯಾವ ಪ್ರದೇಶ ಅಥವಾ ಬಡಾವಣೆಯಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?\nಉದಾ. ಇಂದಿರಾನಗರ, ಜಯನಗರ, ವೈಟ್‌ಫೀಲ್ಡ್" },
  },

  askShareOriginGeo: {
    en: {
      body: "To help us better understand travel patterns, would you like to share your Geo location?",
      options: "yesNo",
    },
    kn: {
      body: "ಪ್ರಯಾಣದ ಮಾದರಿಗಳನ್ನು ಚೆನ್ನಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು, ನಿಮ್ಮ ಜಿಯೋ ಲೊಕೇಶನ್ ಹಂಚಿಕೊಳ್ಳಲು ಇಚ್ಛಿಸುತ್ತೀರಾ?",
      options: "yesNo",
    },
  },

  askOriginLocation: {
    en: { body: "Please share your location by clicking the Location icon in WhatsApp and send your current location." },
    kn: { body: "ದಯವಿಟ್ಟು WhatsApp ನಲ್ಲಿ ಲೊಕೇಶನ್ ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಕಳುಹಿಸಿ." },
  },

  askNearestStation: {
    en: { body: "Please select your nearest Transit station:", options: "stations" },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹತ್ತಿರದ ಟ್ರಾನ್ಸಿಟ್ ನಿಲ್ದಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ:", options: "stations" },
  },

  askNearestStationOther: {
    en: { body: "Please type your Transit station name." },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಟ್ರಾನ್ಸಿಟ್ ನಿಲ್ದಾಣದ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ." },
  },

  askFeederMode: {
    en: { body: "How do you usually travel from your home to the nearest Transit station?", options: "travelModes" },
    kn: { body: "ನಿಮ್ಮ ಮನೆಯಿಂದ ಹತ್ತಿರದ ಟ್ರಾನ್ಸಿಟ್ ನಿಲ್ದಾಣಕ್ಕೆ ಸಾಮಾನ್ಯವಾಗಿ ಹೇಗೆ ಪ್ರಯಾಣಿಸುತ್ತೀರಿ?", options: "travelModes" },
  },

  askFeederModeOther: {
    en: { body: "Please type your mode of travel." },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಯಾಣದ ವಿಧಾನವನ್ನು ಟೈಪ್ ಮಾಡಿ." },
  },

  askDestinationStation: {
    en: { body: "Please select your destination Transit station:", options: "stations" },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನದ ಟ್ರಾನ್ಸಿಟ್ ನಿಲ್ದಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ:", options: "stations" },
  },

  askDestinationStationOther: {
    en: { body: "Please type your destination Transit station name." },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನದ ಟ್ರಾನ್ಸಿಟ್ ನಿಲ್ದಾಣದ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ." },
  },

  askDistributionMode: {
    en: {
      body: "After exiting the Transit at your destination station, how do you usually reach your final destination?",
      options: "travelModes",
    },
    kn: {
      body: "ಗಮ್ಯಸ್ಥಾನದ ನಿಲ್ದಾಣದಿಂದ ಹೊರಬಂದ ನಂತರ, ನಿಮ್ಮ ಅಂತಿಮ ಗಮ್ಯಸ್ಥಾನವನ್ನು ಸಾಮಾನ್ಯವಾಗಿ ಹೇಗೆ ತಲುಪುತ್ತೀರಿ?",
      options: "travelModes",
    },
  },

  askDistributionModeOther: {
    en: { body: "Please type how you reach your final destination." },
    kn: { body: "ದಯವಿಟ್ಟು ನೀವು ಅಂತಿಮ ಗಮ್ಯಸ್ಥಾನ ತಲುಪುವ ವಿಧಾನವನ್ನು ಟೈಪ್ ಮಾಡಿ." },
  },

  askDestArea: {
    en: { body: "Which area or locality is your final destination situated in?\nEx. Indiranagar, Jayanagar, Whitefield" },
    kn: { body: "ನಿಮ್ಮ ಅಂತಿಮ ಗಮ್ಯಸ್ಥಾನ ಯಾವ ಪ್ರದೇಶ ಅಥವಾ ಬಡಾವಣೆಯಲ್ಲಿದೆ?\nಉದಾ. ಇಂದಿರಾನಗರ, ಜಯನಗರ, ವೈಟ್‌ಫೀಲ್ಡ್" },
  },

  askShareDestGeo: {
    en: {
      body: "To help us better understand travel patterns, would you like to share your final destination Geo location?",
      options: "yesNo",
    },
    kn: {
      body: "ಪ್ರಯಾಣದ ಮಾದರಿಗಳನ್ನು ಚೆನ್ನಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು, ನಿಮ್ಮ ಅಂತಿಮ ಗಮ್ಯಸ್ಥಾನದ ಜಿಯೋ ಲೊಕೇಶನ್ ಹಂಚಿಕೊಳ್ಳಲು ಇಚ್ಛಿಸುತ್ತೀರಾ?",
      options: "yesNo",
    },
  },

  askDestLocation: {
    en: { body: "Please share your location by clicking the Location icon in WhatsApp and send your current location." },
    kn: { body: "ದಯವಿಟ್ಟು WhatsApp ನಲ್ಲಿ ಲೊಕೇಶನ್ ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಕಳುಹಿಸಿ." },
  },

  askEmail: {
    en: { body: "Could you please share your email ID?" },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ಐಡಿ ಹಂಚಿಕೊಳ್ಳುವಿರಾ?" },
  },

  askSmartCard: {
    en: { body: "Now, please share your 11-digit Transit Smart Card number so that we can redeem your bonus points for completing this survey." },
    kn: { body: "ಈಗ, ಈ ಸಮೀಕ್ಷೆ ಪೂರ್ಣಗೊಳಿಸಿದ್ದಕ್ಕಾಗಿ ನಿಮ್ಮ ಬೋನಸ್ ಪಾಯಿಂಟ್‌ಗಳನ್ನು ರಿಡೀಮ್ ಮಾಡಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ 11-ಅಂಕಿಯ ಟ್ರಾನ್ಸಿಟ್ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ." },
  },

  done: {
    en: { body: "Thank you for your feedback! You've earned your reward. Happy traveling with TRANSIT CORPORATION, have a nice day!!!" },
    kn: { body: "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು! ನೀವು ನಿಮ್ಮ ರಿವಾರ್ಡ್ ಗಳಿಸಿದ್ದೀರಿ. TRANSIT CORPORATION ಜೊತೆ ಸಂತೋಷದ ಪ್ರಯಾಣ, ಶುಭ ದಿನ!!!" },
  },

  alreadyCompleted: {
    en: { body: "You've already completed the survey. Thanks again!" },
    kn: { body: "ನೀವು ಈಗಾಗಲೇ ಸಮೀಕ್ಷೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ. ಮತ್ತೊಮ್ಮೆ ಧನ್ಯವಾದಗಳು!" },
  },

  pleaseUseButtons: {
    en: { body: "Sorry, please select one of the options below." },
    kn: { body: "ಕ್ಷಮಿಸಿ, ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆರಿಸಿ." },
  },

  pleaseShareLocation: {
    en: { body: "Please use the Location icon in WhatsApp to share your location." },
    kn: { body: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹಂಚಿಕೊಳ್ಳಲು WhatsApp ನ ಲೊಕೇಶನ್ ಐಕಾನ್ ಬಳಸಿ." },
  },

  invalidText: {
    en: { body: "Please enter a valid answer." },
    kn: { body: "ದಯವಿಟ್ಟು ಮಾನ್ಯ ಉತ್ತರ ನಮೂದಿಸಿ." },
  },

  invalidEmail: {
    en: { body: "That doesn't look like a valid email address. Please try again." },
    kn: { body: "ಅದು ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸದಂತೆ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." },
  },

  invalidSmartCard: {
    en: { body: "That doesn't look like a valid Smart Card number. Please enter exactly 11 digits, numbers only." },
    kn: { body: "ಅದು ಮಾನ್ಯ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆಯಂತೆ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಖರವಾಗಿ 11 ಅಂಕೆಗಳನ್ನು ಮಾತ್ರ ನಮೂದಿಸಿ." },
  },
};

function getOptions(optionSetKey, language) {
  return OPTION_SETS[optionSetKey][language];
}

function render(stepContentKey, language, vars = {}) {
  const entry = CONTENT[stepContentKey][language];
  let body = entry.body;
  for (const [key, value] of Object.entries(vars)) {
    body = body.replace(`{${key}}`, value);
  }
  return {
    body,
    options: entry.options ? getOptions(entry.options, language) : null,
  };
}

module.exports = { CONTENT, OPTION_SETS, getOptions, render };
