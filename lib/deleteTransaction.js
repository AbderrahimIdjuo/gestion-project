// lib/deleteTransaction.ts
import prisma from "../lib/prisma";

export async function deleteTransactionById(deletedTransaction) {
  return await prisma.$transaction(async (prisma) => {
    await prisma.transactions.delete({
      where: { id: deletedTransaction.id },
    });

    if (deletedTransaction.type === "vider") {
      await prisma.comptesBancaires.updateMany({
        where: { compte: "caisse" },
        data: {
          solde: { increment: deletedTransaction.montant },
        },
      });
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
