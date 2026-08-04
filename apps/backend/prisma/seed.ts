import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface PromptSeedData {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  expectedPatterns: string[];
  evaluationTemplate: Prisma.InputJsonValue;
}

async function main() {
  const dataPath = path.join(__dirname, '../src/prompts/data/prompts.json');
  const prompts: PromptSeedData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Seeding ${prompts.length} prompts...`);

  for (const prompt of prompts) {
    await prisma.prompt.upsert({
      where: { title: prompt.title },
      update: {
        description: prompt.description,
        difficulty: prompt.difficulty,
        expectedPatterns: prompt.expectedPatterns,
        evaluationTemplate: prompt.evaluationTemplate,
      },
      create: {
        title: prompt.title,
        description: prompt.description,
        difficulty: prompt.difficulty,
        expectedPatterns: prompt.expectedPatterns,
        evaluationTemplate: prompt.evaluationTemplate,
        isActive: true,
      },
    });
    console.log(`  ✓ ${prompt.title}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
