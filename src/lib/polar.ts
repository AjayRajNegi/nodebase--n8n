import { Polar } from "@polar-sh/sdk";

// Polar api client instance
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});
