require("dotenv").config();
const prisma = require("../src/services/db");
const { auth } = require("../src/auth");

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists for ${email}, skipping.`);
    process.exit(0);
  }

  await auth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  console.log(`Admin account created for ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin account:", err);
  process.exit(1);
});
