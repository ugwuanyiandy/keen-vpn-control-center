import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient, SubscriptionHistorySource, SubscriptionStatus, UserRole } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

const servers = [
  { country: "United Kingdom", city: "London", hostname: "lon-01.keenvpn.net", latencyMs: 28, active: true },
  { country: "Germany", city: "Frankfurt", hostname: "fra-01.keenvpn.net", latencyMs: 34, active: true },
  { country: "France", city: "Paris", hostname: "par-01.keenvpn.net", latencyMs: 41, active: true },
  { country: "Netherlands", city: "Amsterdam", hostname: "ams-01.keenvpn.net", latencyMs: 37, active: true },
  { country: "United States", city: "New York", hostname: "nyc-01.keenvpn.net", latencyMs: 72, active: true },
  { country: "United States", city: "Los Angeles", hostname: "lax-01.keenvpn.net", latencyMs: 96, active: true },
  { country: "Canada", city: "Toronto", hostname: "yyz-01.keenvpn.net", latencyMs: 78, active: true },
  { country: "Singapore", city: "Singapore", hostname: "sin-01.keenvpn.net", latencyMs: 118, active: true },
  { country: "Japan", city: "Tokyo", hostname: "tyo-01.keenvpn.net", latencyMs: 132, active: true },
  { country: "Australia", city: "Sydney", hostname: "syd-01.keenvpn.net", latencyMs: 164, active: true },
  { country: "Nigeria", city: "Lagos", hostname: "los-01.keenvpn.net", latencyMs: 52, active: false },
  { country: "Brazil", city: "São Paulo", hostname: "gru-01.keenvpn.net", latencyMs: 149, active: false },
  { country: "Ireland", city: "Dublin", hostname: "dub-01.keenvpn.net", latencyMs: 31, active: true },
  { country: "Spain", city: "Madrid", hostname: "mad-01.keenvpn.net", latencyMs: 46, active: true },
  { country: "Italy", city: "Milan", hostname: "mxp-01.keenvpn.net", latencyMs: 49, active: true },
  { country: "Switzerland", city: "Zurich", hostname: "zrh-01.keenvpn.net", latencyMs: 43, active: true },
  { country: "Austria", city: "Vienna", hostname: "vie-01.keenvpn.net", latencyMs: 51, active: true },
  { country: "Sweden", city: "Stockholm", hostname: "sto-01.keenvpn.net", latencyMs: 58, active: true },
  { country: "Norway", city: "Oslo", hostname: "osl-01.keenvpn.net", latencyMs: 61, active: true },
  { country: "Denmark", city: "Copenhagen", hostname: "cph-01.keenvpn.net", latencyMs: 55, active: true },
  { country: "Finland", city: "Helsinki", hostname: "hel-01.keenvpn.net", latencyMs: 64, active: true },
  { country: "Poland", city: "Warsaw", hostname: "waw-01.keenvpn.net", latencyMs: 59, active: true },
  { country: "Czech Republic", city: "Prague", hostname: "prg-01.keenvpn.net", latencyMs: 54, active: true },
  { country: "Portugal", city: "Lisbon", hostname: "lis-01.keenvpn.net", latencyMs: 62, active: true },
  { country: "United States", city: "Chicago", hostname: "ord-01.keenvpn.net", latencyMs: 81, active: true },
  { country: "United States", city: "Seattle", hostname: "sea-01.keenvpn.net", latencyMs: 101, active: true },
  { country: "United States", city: "Miami", hostname: "mia-01.keenvpn.net", latencyMs: 88, active: true },
  { country: "Canada", city: "Vancouver", hostname: "yvr-01.keenvpn.net", latencyMs: 109, active: true },
  { country: "Mexico", city: "Mexico City", hostname: "mex-01.keenvpn.net", latencyMs: 112, active: true },
  { country: "Argentina", city: "Buenos Aires", hostname: "eze-01.keenvpn.net", latencyMs: 158, active: true },
  { country: "Chile", city: "Santiago", hostname: "scl-01.keenvpn.net", latencyMs: 171, active: true },
  { country: "South Africa", city: "Johannesburg", hostname: "jnb-01.keenvpn.net", latencyMs: 126, active: true },
  { country: "Kenya", city: "Nairobi", hostname: "nbo-01.keenvpn.net", latencyMs: 97, active: true },
  { country: "United Arab Emirates", city: "Dubai", hostname: "dxb-01.keenvpn.net", latencyMs: 91, active: true },
  { country: "India", city: "Mumbai", hostname: "bom-01.keenvpn.net", latencyMs: 108, active: true },
  { country: "Hong Kong", city: "Hong Kong", hostname: "hkg-01.keenvpn.net", latencyMs: 121, active: true },
  { country: "South Korea", city: "Seoul", hostname: "icn-01.keenvpn.net", latencyMs: 137, active: true },
  { country: "Taiwan", city: "Taipei", hostname: "tpe-01.keenvpn.net", latencyMs: 129, active: true },
  { country: "New Zealand", city: "Auckland", hostname: "akl-01.keenvpn.net", latencyMs: 182, active: true },
  { country: "Turkey", city: "Istanbul", hostname: "ist-01.keenvpn.net", latencyMs: 73, active: false },
];

const accounts = [
  { fullName: "Amara Okafor", email: "active@keenvpn.demo", role: UserRole.CUSTOMER, status: SubscriptionStatus.ACTIVE, plan: "Keen Plus", days: 30 },
  { fullName: "Daniel Mensah", email: "trial@keenvpn.demo", role: UserRole.CUSTOMER, status: SubscriptionStatus.TRIAL, plan: "Keen Trial", days: 7 },
  { fullName: "Sofia Martins", email: "expired@keenvpn.demo", role: UserRole.CUSTOMER, status: SubscriptionStatus.EXPIRED, plan: "Keen Plus", days: -30 },
  { fullName: "Noah Williams", email: "none@keenvpn.demo", role: UserRole.CUSTOMER },
  { fullName: "Keen Administrator", email: "admin@keenvpn.demo", role: UserRole.ADMIN },
];

async function main() {
  const demoPasswordHash = await hash("DemoPass123!", 12);
  const adminPasswordHash = await hash("AdminPass123!", 12);

  const savedServers = new Map<string, string>();
  for (const server of servers) {
    const saved = await prisma.server.upsert({
      where: { hostname: server.hostname },
      update: server,
      create: server,
    });
    savedServers.set(server.hostname, saved.id);
  }

  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        fullName: account.fullName,
        role: account.role,
        passwordHash: account.role === UserRole.ADMIN ? adminPasswordHash : demoPasswordHash,
      },
      create: {
        fullName: account.fullName,
        email: account.email,
        role: account.role,
        passwordHash: account.role === UserRole.ADMIN ? adminPasswordHash : demoPasswordHash,
      },
    });

    if (account.status && account.plan && account.days !== undefined) {
      const currentPeriodEnd = new Date(Date.now() + account.days * 24 * 60 * 60 * 1000);
      const subscription = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { status: account.status, plan: account.plan, currentPeriodEnd },
        create: { userId: user.id, status: account.status, plan: account.plan, currentPeriodEnd },
      });
      const existingHistory = await prisma.subscriptionHistory.count({ where: { userId: user.id } });
      if (existingHistory === 0) {
        await prisma.subscriptionHistory.create({
          data: {
            userId: user.id,
            plan: subscription.plan,
            status: subscription.status,
            periodStart: new Date(currentPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000),
            periodEnd: currentPeriodEnd,
            source: SubscriptionHistorySource.SEED,
            sourceKey: `seed:${account.email}:initial`,
          },
        });
      }
    } else {
      await prisma.subscription.deleteMany({ where: { userId: user.id } });
    }
  }

  const londonId = savedServers.get("lon-01.keenvpn.net");
  if (londonId) {
    await prisma.user.update({
      where: { email: "active@keenvpn.demo" },
      data: { pinnedServerId: londonId },
    });
  }

  console.info(`Seeded ${servers.length} servers and ${accounts.length} demo accounts.`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
