// lib/deleteTransaction.ts
import prisma from "../lib/prisma";
import { isCompteProfessionnel } from "./functions";

async function deleteViderVersementIfNeeded(tx, deletedTransaction) {
  if (!isCompteProfessionnel(deletedTransaction.compte)) {
    return;
  }

  const caisseAccount = await tx.comptesBancaires.findFirst({
    where: { compte: "caisse" },
  });
  const compteProAccount = await tx.comptesBancaires.findFirst({
    where: {
      OR: [
        { compte: { equals: "compte professionnel", mode: "insensitive" } },
        { compte: "compte professionel" },
      ],
    },
  });

  if (!caisseAccount || !compteProAccount) {
    return;
  }

  const versement = await tx.versement.findFirst({
    where: {
      sourceCompteId: caisseAccount.id,
      compteProId: compteProAccount.id,
      montant: deletedTransaction.montant,
      note: "Vider la caisse vers compte pro",
    },
    orderBy: { createdAt: "desc" },
  });

  if (versement) {
    await tx.versement.delete({
      where: { id: versement.id },
    });
  }
}

export async function reverseViderTransaction(tx, deletedTransaction) {
  await tx.comptesBancaires.updateMany({
    where: { compte: "caisse" },
    data: {
      solde: { increment: deletedTransaction.montant },
    },
  });

  if (deletedTransaction.compte) {
    await tx.comptesBancaires.updateMany({
      where: { compte: deletedTransaction.compte },
      data: {
        solde: { decrement: deletedTransaction.montant },
      },
    });
  }

  await deleteViderVersementIfNeeded(tx, deletedTransaction);
}

export async function deleteTransactionById(deletedTransaction) {
  return await prisma.$transaction(async prisma => {
    await prisma.transactions.delete({
      where: { id: deletedTransaction.id },
    });

    if (deletedTransaction.type === "vider") {
      await reverseViderTransaction(prisma, deletedTransaction);
    } else if (
      deletedTransaction.type === "depense" ||
      deletedTransaction.type === "recette"
    ) {
      await prisma.comptesBancaires.updateMany({
        where: { compte: deletedTransaction.compte },
        data: {
          solde:
            deletedTransaction.type === "recette"
              ? { decrement: deletedTransaction.montant }
              : { increment: deletedTransaction.montant },
        },
      });
    }
  });
}
