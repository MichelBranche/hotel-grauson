import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { propertyConfig } from "../config/property";
import { assertPostgresUrl, developerSeedInput, loadLocalEnv, ownerSeedInput, requireSeedPassword } from "./env";

loadLocalEnv();
assertPostgresUrl();

const prisma = new PrismaClient();

async function ensureUser(input: {
  organizationId: string;
  propertyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "DEVELOPER" | "OWNER";
  passwordEnv: "SEED_DEVELOPER_PASSWORD" | "SEED_OWNER_PASSWORD";
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(requireSeedPassword(input.passwordEnv), 12);
    await prisma.user.create({
      data: {
        organizationId: input.organizationId,
        propertyId: input.propertyId,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    });
    console.log(`${input.role} created for ${input.email}. Password is ${input.passwordEnv} and is not printed.`);
    return;
  }
  if (existing.role !== input.role) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: input.role } });
    console.log(`${input.email} is now ${input.role}. Password was not changed.`);
    return;
  }
  console.log(`${input.email} already exists as ${input.role}. Password was not changed.`);
}

async function main() {
  const developer = developerSeedInput();
  const owner = ownerSeedInput();
  if (developer.email === owner.email) {
    throw new Error("SEED_DEVELOPER_EMAIL and SEED_OWNER_EMAIL must be different.");
  }

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

  // One sellable rate plan so the booking engine works as soon as room types have prices.
  const activePlans = await prisma.ratePlan.count({ where: { propertyId: property.id, active: true } });
  if (!activePlans) {
    await prisma.ratePlan.upsert({
      where: { propertyId_code: { propertyId: property.id, code: "STD" } },
      create: {
        propertyId: property.id,
        code: "STD",
        name: "Tariffa standard",
        cancellationPolicy: "Cancellazione gratuita fino a 48 ore prima dell'arrivo.",
      },
      update: { active: true },
    });
    console.log("Default rate plan «Tariffa standard» ready.");
  }

  await ensureUser({
    organizationId: organization.id,
    propertyId: property.id,
    ...developer,
    role: "DEVELOPER",
    passwordEnv: "SEED_DEVELOPER_PASSWORD",
  });
  await ensureUser({
    organizationId: organization.id,
    propertyId: property.id,
    ...owner,
    role: "OWNER",
    passwordEnv: "SEED_OWNER_PASSWORD",
  });
  console.log("Clean seed completed.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
