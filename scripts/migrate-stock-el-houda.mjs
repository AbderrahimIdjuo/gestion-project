/**
 * One-shot : place le stock non affecté de chaque produit dans l'entrepôt « El houda ».
 * N'augmente pas Produits.stock. Idempotent.
 *
 * Exécution : npm run migrate:stock-el-houda
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/prisma");

const ENTREPOT_NOM = "El houda";
const prisma = new PrismaClient();

function isMissingTableError(error) {
  const code = error?.code;
  const message = String(error?.message || "");
  return (
    code === "P2021" ||
    code === "P2010" ||
    /relation .* does not exist/i.test(message) ||
    /table .* does not exist/i.test(message)
  );
}

async function main() {
  console.log(`Affectation du stock vers l'entrepôt « ${ENTREPOT_NOM} »…\n`);

  let entrepot;
  try {
    entrepot = await prisma.entrepots.findFirst({
      where: { nom: { equals: ENTREPOT_NOM, mode: "insensitive" } },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      console.error(
        "Tables Entrepots / ProduitEntrepot introuvables. Appliquez d'abord le schéma : npx prisma db push (ou npx prisma migrate deploy)."
      );
      process.exit(1);
    }
    throw error;
  }

  if (!entrepot) {
    entrepot = await prisma.entrepots.create({ data: { nom: ENTREPOT_NOM } });
    console.log(`Entrepôt créé : ${entrepot.nom} (${entrepot.id})`);
  } else {
    console.log(`Entrepôt trouvé : ${entrepot.nom} (${entrepot.id})`);
  }

  const produits = await prisma.produits.findMany({
    select: {
      id: true,
      designation: true,
      stock: true,
      stocksEntrepot: { select: { entrepotId: true, quantite: true } },
    },
  });

  let updated = 0;
  let alreadyOk = 0;
  let zeroStock = 0;
  const details = [];

  await prisma.$transaction(async tx => {
    for (const produit of produits) {
      const globalStock = Number(produit.stock ?? 0);
      const allocated = (produit.stocksEntrepot || []).reduce(
        (sum, row) => sum + Number(row.quantite ?? 0),
        0
      );
      const reste = globalStock - allocated;

      if (globalStock <= 0 && reste <= 0) {
        zeroStock++;
        continue;
      }

      if (reste <= 0.0001) {
        alreadyOk++;
        continue;
      }

      const existing = await tx.produitEntrepot.findUnique({
        where: {
          produitId_entrepotId: {
            produitId: produit.id,
            entrepotId: entrepot.id,
          },
        },
      });

      if (existing) {
        await tx.produitEntrepot.update({
          where: { id: existing.id },
          data: { quantite: existing.quantite + reste },
        });
      } else {
        await tx.produitEntrepot.create({
          data: {
            produitId: produit.id,
            entrepotId: entrepot.id,
            quantite: reste,
          },
        });
      }

      updated++;
      details.push({
        designation: produit.designation,
        reste,
        stock: globalStock,
      });
    }
  });

  console.log("");
  console.log(`Produits traités       : ${produits.length}`);
  console.log(`Stock affecté          : ${updated}`);
  console.log(`Déjà réparti           : ${alreadyOk}`);
  console.log(`Stock à 0 (ignorés)    : ${zeroStock}`);

  if (details.length > 0) {
    console.log("\nDétail :");
    for (const row of details) {
      console.log(
        `  - ${row.designation} : +${row.reste.toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })} → ${ENTREPOT_NOM} (total ${row.stock.toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })})`
      );
    }
  }
}

main()
  .catch(error => {
    if (isMissingTableError(error)) {
      console.error(
        "Tables Entrepots / ProduitEntrepot introuvables. Appliquez d'abord le schéma : npx prisma db push (ou npx prisma migrate deploy)."
      );
    } else {
      console.error(error);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
