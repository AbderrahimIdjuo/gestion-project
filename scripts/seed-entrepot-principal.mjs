import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const existing = await prisma.$queryRaw`
    SELECT id FROM "Entrepots" WHERE nom = 'Entrepôt principal' LIMIT 1
  `;

  let entrepotId = existing?.[0]?.id;
  if (!entrepotId) {
    const created = await prisma.$queryRaw`
      INSERT INTO "Entrepots" ("id", "nom", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'Entrepôt principal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    entrepotId = created[0].id;
    console.log("Created Entrepôt principal:", entrepotId);
  } else {
    console.log("Entrepôt principal already exists:", entrepotId);
  }

  const inserted = await prisma.$executeRaw`
    INSERT INTO "ProduitEntrepot" ("id", "produitId", "entrepotId", "quantite")
    SELECT gen_random_uuid()::text, p."id", ${entrepotId}, COALESCE(p."stock", 0)
    FROM "Produits" p
    WHERE COALESCE(p."stock", 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM "ProduitEntrepot" pe
        WHERE pe."produitId" = p."id" AND pe."entrepotId" = ${entrepotId}
      )
  `;

  console.log("Migrated product stock rows:", inserted);
}

seed()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
