import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const positions = [
    {
      title: "Full-stack Engineer",
      department: "ENGINEERING" as const,
      description: "Ship end-to-end features across the product.",
    },
    {
      title: "ML Infrastructure Engineer",
      department: "ENGINEERING" as const,
      description: "Build training + inference infra.",
    },
    {
      title: "Product Engineer",
      department: "ENGINEERING" as const,
      description: "Own small product surfaces end-to-end.",
    },
    {
      title: "Research Scientist",
      department: "RESEARCH" as const,
      description: "Drive research directions.",
    },
    {
      title: "Business Operations Lead",
      department: "BUSINESS_OPS" as const,
      description: "Scale org + go-to-market ops.",
    },
  ];

  for (const p of positions) {
    await prisma.position.upsert({
      where: { id: p.title.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: p.title.toLowerCase().replace(/\s+/g, "-"),
        title: p.title,
        department: p.department,
        description: p.description,
      },
    });
  }

  console.log(`Seeded ${positions.length} positions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
