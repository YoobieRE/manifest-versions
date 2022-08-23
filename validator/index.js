const fs = require('fs');
const path = require('path');
const { parse, printParseErrorCode } = require('jsonc-parser');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const versionSchema = require('./version.schema.json');
const { exit } = require('process');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(versionSchema);
const errors = [];
const versionsDir = path.join(__dirname, '../versions');

const files = fs.readdirSync(versionsDir);
files.forEach(async (file) => {
  try {
    const jsonText = fs.readFileSync(path.join(versionsDir, file), 'utf-8');
    const parseErrors = [];
    const productVersions = parse(jsonText, parseErrors);
    if (parseErrors.length) {
      const textErrors = parseErrors.map(e => ({ ...e, error: printParseErrorCode(e.error) }));
      errors.push({ file, error: textErrors });
      return;
    }
    const valid = validate(productVersions);
    if (!valid) {
      errors.push({ file, error: validate.errors });
    }
  } catch (err) {
    errors.push({ file, error: err });
  }
});

if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  exit(1);
}