// Plan C (https://tide.org/unlocked/#plan-c): while the Tide network can't license realms, sign-in,
// roles and access checks are simulated. Shared by the browser (simulation.ts) and the API
// (src/app/api/exams/simulatedAuth.ts). Only active when NEXT_PUBLIC_MOCK_TIDE=1.

export const SIMULATED = process.env.NEXT_PUBLIC_MOCK_TIDE === "1";

export const SIM_USERS = [
  { id: "setter", name: "Exam setter", blurb: "Uploads papers. Write-only: can't read them back." },
  { id: "admin1", name: "Admin 1", blurb: "Committee member" },
  { id: "admin2", name: "Admin 2", blurb: "Committee member" },
  { id: "admin3", name: "Admin 3", blurb: "Committee member" },
] as const;

export type SimUserId = (typeof SIM_USERS)[number]["id"];

export const isSimUserId = (v: unknown): v is SimUserId => SIM_USERS.some((u) => u.id === v);

export const simUserName = (id: SimUserId) => SIM_USERS.find((u) => u.id === id)!.name;

/** Header the simulated API reads instead of a Tide JWT. */
export const SIM_USER_HEADER = "x-simulated-user";
