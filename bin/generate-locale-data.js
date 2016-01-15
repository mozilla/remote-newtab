#! /usr/bin/env node
"use strict";
const path = require("path");
const fs = require("fs");

const LOCALE_DATA_PATH = path.join(__dirname, "../node_modules/react-intl/lib/locale-data");
const MESSAGES_PATH = path.join(__dirname, "../l10n");
const DEFAULT_LOCALE = "en-US";

function template(options) {
  const locale = options.locale;
  const messages = options.messages;
  const localeData = options.localeData;
  return `
// GENERATED FILE

// These are our strings
window.newTabLocaleInfo = {locale: "${locale}", messages: ${JSON.stringify(messages)}};

// This is locale-specific code for react-intl
${localeData}
`;
}

function readFileIfExists(filepath) {
  try {
    return fs.readFileSync(filepath, "utf8");
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    } else {
      return;
    }
  }
}

function readLocaleDataFile(locale, sync) {
  const text = readFileIfExists(path.join(LOCALE_DATA_PATH, locale + ".js"));
  return text ? text.replace("module.exports", "window.reactIntlLocaleData") : text;
}

function getMessages(locale) {
  // TODO - figure out how we handle these cases
  if (locale === "en") locale = "en-US";
  const text = readFileIfExists(path.join(MESSAGES_PATH, locale + "/strings.json"));
  return text ? JSON.parse(text) : text;
}

const defaultLocaleData = readLocaleDataFile(DEFAULT_LOCALE);
const defaultMessages = getMessages(DEFAULT_LOCALE);

function generateFile(locale) {
  locale = locale || DEFAULT_LOCALE;
  const baseLocale = locale.split("-")[0];
  const localeData = readLocaleDataFile(locale) || readLocaleDataFile(baseLocale) || defaultLocaleData;
  const messages = getMessages(locale) || getMessages(baseLocale) || defaultMessages;
  return {
    fileString: template({locale, messages, localeData}),
    messages
  };
}

module.exports = generateFile;

if (require.main === module)  {
  // called from command line
  const args = require("minimist")(process.argv.slice(2), {alias: {locale: 'l'}});
  process.stdout.write(generateFile(args.locale).fileString);
}
