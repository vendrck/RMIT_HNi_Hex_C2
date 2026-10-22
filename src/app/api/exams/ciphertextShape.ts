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
