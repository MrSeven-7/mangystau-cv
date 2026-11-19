import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!password || password.length < 12 || !adminEmail) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters");
  }
  const passwordHash = await hash(password);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      passwordHash,
      fullName: "Администратор Mangystau CV",
    },
    create: {
      email: adminEmail,
      fullName: "Администратор Mangystau CV",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("\n✅ Аккаунт администратора успешно настроен:");
  console.log("-----------------------------------------");
  console.log(`📧 Email:   ${admin.email}`);
  console.log(`👤 Роль:    ${admin.role}`);
  console.log("-----------------------------------------");

  const allAdmins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true, email: true, fullName: true, role: true },
  });

  console.log(`\nВсего администраторов в системе: ${allAdmins.length}`);
  allAdmins.forEach((u, i) => {
    console.log(` ${i + 1}. ${u.fullName} (${u.email}) [${u.role}]`);
  });
}

main()
  .catch((e) => {
    console.error("Ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
