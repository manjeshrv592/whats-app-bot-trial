const { betterAuth } = require("better-auth");
const { prismaAdapter } = require("better-auth/adapters/prisma");
const prisma = require("./services/db");

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: { modelName: "adminUser" },
  session: { modelName: "adminSession" },
  account: { modelName: "adminAccount" },
  verification: { modelName: "adminVerification" },
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env.ADMIN_FRONTEND_URL || "http://localhost:5173"],
});

module.exports = { auth };
