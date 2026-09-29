import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { propertyConfig } from "../config/property";
import { assertPostgresUrl, loadLocalEnv, ownerSeedInput, requireOwnerPassword } from "./env";

loadLocalEnv();
assertPostgresUrl();

const prisma = new PrismaClient();

async function main() {
  const { email, firstName, lastName } = ownerSeedInput();

  const organization = await prisma.organization.upsert({
    where: { slug: propertyConfig.organizationSlug },
    create: {
      name: propertyConfig.organizationName,
      slug: propertyConfig.organizationSlug,
    },
    update: {},
  });

  const property = await prisma.property.upsert({
    where: { slug: propertyConfig.propertySlug },
    create: {
      organizationId: organization.id,
      name: propertyConfig.propertyName,
      slug: propertyConfig.propertySlug,
      address: propertyConfig.address,
      city: propertyConfig.city,
      postalCode: propertyConfig.postalCode,
      country: propertyConfig.country,
      timezone: propertyConfig.timezone,
      currency: propertyConfig.currency,
      language: propertyConfig.language,
      settings: JSON.stringify(propertyConfig.settings),
    },
    update: {},
  });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(requireOwnerPassword(), 12);
    await prisma.user.create({
      data: {
        organizationId: organization.id,
        propertyId: property.id,
        email,
        passwordHash,
        firstName,
        lastName,
        role: "OWNER",
      },
    });
    console.log("Clean seed completed. Owner created.");
    console.log("Password is SEED_OWNER_PASSWORD from the environment and is not printed. Change it after the first login.");
  } else {
    console.log("Clean seed completed. Owner already exists; password was not changed.");
  }
  console.log(`Owner email: ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
