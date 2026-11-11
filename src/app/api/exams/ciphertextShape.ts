// Server-side guard: the API stores ciphertext only, so anything that could be plaintext is refused.

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
export const MAX_CIPHERTEXT = 2_000_000;

export function isCiphertext(value: string, mock: boolean): boolean {
  // The mock's "ciphertext" is MOCK:<base64>; only accept it while the mock is on. It is plain
  // base64 of the text, so a short exam gives a short body: any non-empty base64 is fine there.
  // Real Tide ciphertext always carries headers, so a 16-character floor still applies to it.
  const isMock = mock && value.startsWith("MOCK:");
  const body = isMock ? value.slice(5) : value;
  const min = isMock ? 4 : 16;
  return body.length >= min && body.length % 4 === 0 && body.length <= MAX_CIPHERTEXT && BASE64.test(body);
}

/** Bytes the base64 body decodes to, ignoring a leading MOCK: prefix. Anything that is not base64 counts as 0. */
export function ciphertextByteLength(value: string): number {
  const body = value.startsWith("MOCK:") ? value.slice(5) : value;
  if (body.length === 0 || body.length % 4 !== 0 || !BASE64.test(body)) return 0;
  const padding = body.endsWith("==") ? 2 : body.endsWith("=") ? 1 : 0;
  return (body.length / 4) * 3 - padding;
}
