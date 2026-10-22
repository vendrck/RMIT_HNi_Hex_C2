const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadModule(relativePath) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports }, { filename });
  return module.exports;
}

const { isCiphertext } = loadModule("src/app/api/exams/ciphertextShape.ts");
const mockOf = (text) => `MOCK:${Buffer.from(text, "utf8").toString("base64")}`;

test("mock mode accepts a short exam (regression: 'hi' was refused)", () => {
  assert.equal(isCiphertext(mockOf("hi"), true), true);
  assert.equal(isCiphertext(mockOf("a"), true), true);
});

test("mock mode still accepts a long exam", () => {
  assert.equal(isCiphertext(mockOf("Section A\n1. Solve 3x + 7 = 22. [2 marks]"), true), true);
});

test("the MOCK: prefix is refused when the mock is off", () => {
  assert.equal(isCiphertext(mockOf("hi"), false), false);
  assert.equal(isCiphertext(mockOf("a long enough exam paper text"), false), false);
});

test("plaintext and empty mock bodies are refused", () => {
  assert.equal(isCiphertext("hello, this is the exam", true), false);
  assert.equal(isCiphertext("MOCK:", true), false);
  assert.equal(isCiphertext("MOCK:not base64!", true), false);
});

test("real ciphertext keeps the 16-character floor", () => {
  assert.equal(isCiphertext("aGk=", false), false);
  assert.equal(isCiphertext(Buffer.alloc(48, 7).toString("base64"), false), true);
});
