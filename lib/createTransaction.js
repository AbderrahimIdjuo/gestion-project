import prisma from "./prisma";

function toDateOrNow(date) {
  if (!date) return new Date();
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date invalide");
  }
  return parsed;
}

export function getCreateTransactionErrorMessage(error) {
  const message = error?.message || "";
  if (error?.code === "P1001" || error?.code === "P1017" || error?.code === "P2024") {
    return "Impossible de joindre la base de données. Réessayez dans quelques instants.";
  }
  if (error?.code === "P2022" || message.includes("does not exist")) {
    return "La base de données n'est pas à jour. Contactez l'administrateur.";
  }
  if (error?.code === "P2003") {
    return "Référence invalide (compte, client ou chèque).";
  }
  if (error?.code === "P2002") {
    return "Une contrainte d'unicité a été violée.";
  }
  if (message.includes("Invalid `prisma")) {
    return "Erreur lors de l'enregistrement de la transaction.";
  }
  if (message) return message;
  return "Échec de la création de la transaction";
}

export async function createTresorieTransaction(data) {
  const {
    numero,
    type,
    montant,
    compte,
    lable,
    description,
    date,
    methodePaiement,
    numeroCheque,
    clientId,
    typeDepense,
  } = data;

  const dateValue = toDateOrNow(date);
  const montantNumber = Number(montant);

  if (!type) {
    throw new Error("Le type de transaction est requis.");
  }
  if (!Number.isFinite(montantNumber) || montantNumber <= 0) {
    throw new Error("Le montant doit être supérieur à 0.");
  }

  const result = await prisma.$transaction(async tx => {
    if (type === "vider") {
      const caisseAccount = await tx.comptesBancaires.findFirst({
        where: { compte: "caisse" },
      });
      const soldeCaisse = Number(caisseAccount?.solde ?? 0);
      if (montantNumber > soldeCaisse) {
        throw new Error(
          `Le montant ne peut pas dépasser le solde de la caisse (${soldeCaisse} DH).`
        );
      }
    }
    if (lable === "paiement devis") {
      if (!numero) {
        throw new Error("Le numéro de devis est requis pour un paiement devis.");
      }
      const devis = await tx.devis.findUnique({
        where: { numero: numero },
      });
      if (!devis) {
        throw new Error(`Devis introuvable: ${numero}`);
      }
      const diff = devis.total - (devis.totalPaye + montantNumber);
      const statutPaiement =
        diff === 0 ? "paye" : diff > 0 ? "enPartie" : "impaye";
      await tx.devis.update({
        where: { numero: numero },
        data: {
          ...(devis.dateStart === null && { dateStart: dateValue }),
          ...(devis.statut !== "Terminer" && { statut: "Accepté" }),
          totalPaye: {
            increment: montantNumber,
          },
          statutPaiement,
        },
      });
    }

    let cheque = null;

    if (methodePaiement === "cheque") {
      cheque = await tx.cheques.create({
        data: {
          type: type === "recette" ? "RECU" : "EMIS",
          montant: montantNumber,
          compte,
          numero: numeroCheque,
          dateReglement: date ? dateValue : null,
        },
      });
    }

    const transaction = await tx.transactions.create({
      data: {
        reference: numero || undefined,
        type,
        montant: montantNumber,
        compte,
        lable:
          type === "vider"
            ? lable && String(lable).trim()
              ? lable
              : "Vider la caisse"
            : lable,
        description,
        methodePaiement,
        clientId: clientId || undefined,
        date: dateValue,
        typeDepense: typeDepense || undefined,
        cheque: cheque
          ? {
              connect: { id: cheque.id },
            }
          : undefined,
      },
    });

    if (type === "vider") {
      await tx.comptesBancaires.updateMany({
        where: { compte: "caisse" },
        data: {
          solde: { decrement: montantNumber },
        },
      });
      await tx.comptesBancaires.updateMany({
        where: { compte: compte },
        data: {
          solde: { increment: montantNumber },
        },
      });
      const compteDest = (compte || "").toLowerCase();
      if (
        compteDest === "compte professionnel" ||
        compteDest === "compte professionel"
      ) {
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
        if (caisseAccount && compteProAccount) {
          await tx.versement.create({
            data: {
              montant: montantNumber,
              sourceCompteId: caisseAccount.id,
              compteProId: compteProAccount.id,
              note: "Vider la caisse vers compte pro",
            },
          });
        }
      }
    } else if (type === "depense" || type === "recette") {
      await tx.comptesBancaires.updateMany({
        where: { compte: compte },
        data: {
          solde:
            type === "recette"
              ? { increment: montantNumber }
              : { decrement: montantNumber },
        },
      });
    }

    if (numero && numero.slice(0, 3) === "CMD") {
      await tx.commandes.update({
        where: { numero: numero },
        data: {
          totalPaye: { increment: montantNumber },
        },
      });
    } else if (numero && numero.slice(0, 2) === "BL") {
      await tx.bonLivraison.update({
        where: { numero: numero },
        data: {
          totalPaye: { increment: montantNumber },
        },
      });
    }

    return transaction;
  });

  return { success: true, result };
}
