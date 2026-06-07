import { prisma } from "../src/lib/prisma";

async function verify() {
  try {
    // Perform a simple read from the permission table
    await prisma.permission.findFirst();
    console.log("✅ Connected");
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
