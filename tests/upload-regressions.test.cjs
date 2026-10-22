const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Run browser modules with controlled SDK boundaries; no realm or credentials needed.
function loadModule(relativePath, imports, globals = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    URL, Uint8Array, TextDecoder, btoa, atob,
    ...globals,
  }, { filename });
  return module.exports;
}

test("policy creation sends an absolute URL to DPoP secureFetch", async () => {
  const requests = [];
  const grants = [];
  const crypto = loadModule("src/lib/vault/crypto.ts", {
    "../../../data/tidecloak.json": { vendorId: "test-vendor" },
    "@tidecloak/js": { IAMService: {
      async secureFetch(url) {
        requests.push(new URL(url).href); // SDK rejects relative URLs here.
        return Response.json({ policy: btoa("signed-admin-policy") });
      },
    } },
    "@/lib/tide/relationship": {
      readSession: () => ({ tideUserKey: "test-user" }),
      async signRelationshipPolicy(grant, policy) {
        assert.equal(new TextDecoder().decode(policy), "signed-admin-policy");
        grants.push(grant);
        return `signed-${grant.access}`;
      },
    },
  }, {
    process: { env: {} },
    window: { location: { origin: "https://vault.example" } },
  });

  const policies = await crypto.createExamPolicies("exam-test");
  assert.deepEqual(requests, ["https://vault.example/api/admin-policy"]);
  assert.equal(policies.writePolicy, "signed-write");
  assert.equal(policies.readPolicy, "signed-read");
  assert.equal(grants[0].subject.id, "test-user");
  assert.equal(grants[1].subject.id, "exam-opener");
});

test("encryption handles binary ciphertext up to the API size limit", async () => {
  const bytes = Uint8Array.from({ length: 1_500_000 }, (_, i) => i % 256);
  const relationship = loadModule("src/lib/tide/relationship.ts", {
    "@tidecloak/js": { IAMService: {
      async doEncrypt(items, policy) {
        assert.equal(items[0].tags[0], "exam-test");
        assert.equal(new TextDecoder().decode(policy), "signed-policy");
        return [bytes];
      },
    } },
    "@tideorg/js": { Models: {} },
    "heimdall-tide": { PolicySignRequest: {} },
  });
  const encrypted = await relationship.encryptForRecord("exam text", "exam-test", btoa("signed-policy"));
  assert.equal(encrypted, Buffer.from(bytes).toString("base64"));
});
