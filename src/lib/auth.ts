import prisma from "./db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { polarClient } from "./polar";

// Creates a better-auth instance
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    polar({
      client: polarClient,
      // Creates a polar customer on new signup
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "396e1a28-f02f-405d-bb23-4ec865d5c368",
              slug: "pro",
            },
          ],
          successUrl: "/",
          authenticatedUsersOnly: true,
        }),
        // Polar customer portal
        portal(),
      ],
    }),
  ],
});
