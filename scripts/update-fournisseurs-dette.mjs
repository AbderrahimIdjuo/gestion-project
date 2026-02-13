/**
 * Script one-shot : calcule la dette de chaque fournisseur à partir des BL impayés/en partie,
 * puis met à jour fournisseur.dette.
 *
 * Dette = (somme des restes à payer des BL "achats" impayés/enPartie) - (somme des montants des BL "retour" impayés/enPartie)
 *
 * Exécution : node scripts/update-fournisseurs-dette.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Calcul des dettes fournisseurs à partir des BL impayés / en partie...\n");

  // 1. Récupérer tous les BL impayés ou en partie
  const bls = await prisma.bonLivraison.findMany({
    where: {
      statutPaiement: {
        in: ["impaye", "enPartie"],
      },
    },
    select: {
      id: true,
      fournisseurId: true,
      type: true,
      total: true,
      totalPaye: true,
    },
  });

  console.log(`📦 ${bls.length} BL impayés ou en partie trouvés.\n`);

  // 2. Calculer la dette par fournisseur
  // dette = somme(restAPayer pour BL achats) - somme(total pour BL retour)
  const detteParFournisseur = new Map();

  for (const bl of bls) {
    const fournisseurId = bl.fournisseurId;
    if (!detteParFournisseur.has(fournisseurId)) {
      detteParFournisseur.set(fournisseurId, { achatsRestAPayer: 0, retoursTotal: 0 });
    }
    const acc = detteParFournisseur.get(fournisseurId);
    const total = bl.total ?? 0;
    const totalPaye = bl.totalPaye ?? 0;
    const restAPayer = total - totalPaye;

    if (bl.type === "achats") {
      acc.achatsRestAPayer += restAPayer;
    } else if (bl.type === "retour") {
      acc.retoursTotal += total;
    }
  }

  // 3. Liste de tous les fournisseurs (pour mettre à 0 ceux sans BL impayés/enPartie)
  const allFournisseurs = await prisma.fournisseurs.findMany({
    select: { id: true, nom: true },
  });

  let updated = 0;
  let unchanged = 0;

  for (const f of allFournisseurs) {
    const acc = detteParFournisseur.get(f.id);
    const achatsRestAPayer = acc ? acc.achatsRestAPayer : 0;
    const retoursTotal = acc ? acc.retoursTotal : 0;
    const nouvelleDette = Math.round((achatsRestAPayer - retoursTotal) * 100) / 100;

    const current = await prisma.fournisseurs.findUnique({
      where: { id: f.id },
      select: { dette: true },
    });
    const currentDette = current?.dette ?? 0;

    if (currentDette !== nouvelleDette) {
      await prisma.fournisseurs.update({
        where: { id: f.id },
        data: { dette: nouvelleDette },
      });
      console.log(`  ✅ ${f.nom}: dette ${currentDette} → ${nouvelleDette}`);
      updated++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n📊 Résumé : ${updated} fournisseur(s) mis à jour, ${unchanged} inchangé(s).`);
}

main()
  .then(() => {
    console.log("\n✨ Script terminé avec succès.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
