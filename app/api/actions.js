"use server";
import prisma from "../../lib/prisma";

export async function deleteManyFactures(selectedFactures) {
  const result = await prisma.factures.deleteMany({
    where: {
      id: { in: selectedFactures },
    },
  });
  return result;
}

export async function payeManyFactures(selectedFactures) {
  const result = await prisma.factures.updateMany({
    where: { id: { in: selectedFactures } },
    data: {
      payer: true,
    },
  });
  return result;
}

export async function addCategorieProduits(categorie) {
  if (categorie !== "") {
    const result = await prisma.categoriesProduits.create({
      data: {
        categorie,
      },
    });
    return result;
  }
}

export async function addCharge(charge) {
  if (charge !== "") {
    const result = await prisma.charges.create({
      data: {
        charge,
      },
    });
    return result;
  }
}

export async function deleteCategorieProduits(id) {
  const result = await prisma.categoriesProduits.delete({
    where: { id },
  });
  return result;
}

export async function updateCategorieProduits(id, categorie) {
  if (categorie !== "" && id) {
    const result = await prisma.categoriesProduits.update({
      where: { id },
      data: {
        categorie,
      },
    });
    return result;
  }
}

export async function addCompteBancaire(compte) {
  if (compte !== "") {
    const result = await prisma.comptesBancaires.create({
      data: {
        compte,
      },
    });
    return result;
  }
}

export async function deleteCompteBancaire(id) {
  const result = await prisma.comptesBancaires.delete({
    where: { id },
  });
  return result;
}

export async function addTacheEmploye(tache) {
  if (tache !== "") {
    const result = await prisma.tachesEmployes.create({
      data: {
        tache,
      },
    });
    return result;
  }
}

export async function deleteTacheEmploye(id) {
  const result = await prisma.tachesEmployes.delete({
    where: { id },
  });
  return result;
}

export async function addModePaiementProduits(modePaiement) {
  if (modePaiement !== "") {
    const result = await prisma.modesPaiement.create({
      data: {
        modePaiement,
      },
    });
    return result;
  }
}

export async function deleteModePaiementProduits(id) {
  const result = await prisma.modesPaiement.delete({
    where: { id },
  });
  return result;
}

export async function addInfoEntreprise(info) {
  const { nom, telephone, mobile, email, adresse, slogan, logoUrl } = info;

  const result = await prisma.infoEntreprise.upsert({
    where: { id: 1 },
    update: { nom, telephone, mobile, email, adresse, slogan, logoUrl },
    create: { id: 1, nom, telephone, mobile, email, adresse, slogan, logoUrl },
  });
  return result;
}

export async function addtransaction(data) {
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
  const result = await prisma.$transaction(async prisma => {
    if (lable === "paiement devis") {
      const devis = await prisma.devis.findUnique({
        where: { numero: numero },
      });
      const diff = devis.total - (devis.totalPaye + montant);
      const statutPaiement =
        diff === 0 ? "paye" : diff > 0 ? "enPartie" : "impaye";
      // Modifier le statut de devis en cas de paiement d'un client
      await prisma.devis.update({
        where: { numero: numero },
        data: {
          ...(devis.dateStart === null && { dateStart: date || new Date() }),
          ...(devis.statut !== "Terminer" && { statut: "Accepté" }),
          totalPaye: {
            increment: montant, //augmente le montant paye
          },
          statutPaiement,
        },
      });

      // La dette du client sera décrémentée
      //   await prisma.clients.update({
      //     where: { id: clientId },
      //     data: {
      //       dette: {
      //         decrement: montant, // Decrement la dette du client
      //       },
      //     },
      //   });
    }
    //Creation du chèque
    let cheque = null;

    if (methodePaiement === "cheque") {
      cheque = await prisma.cheques.create({
        data: {
          type:
            type === "depense" ? "EMIS" : type === "recette" ? "RECU" : null,
          montant,
          compte,
          numero: numeroCheque,
          dateReglement: date || null,
        },
      });
    }
    await prisma.transactions.create({
      data: {
        reference: numero,
        type,
        montant,
        compte: type === "vider" ? "caisse" : compte,
        lable,
        description,
        methodePaiement,
        clientId,
        date: date || new Date(),
        typeDepense,
        cheque: cheque
          ? {
              connect: { id: cheque.id }, // ✅ association one-to-one
            }
          : undefined,
      },
    });

    if (type === "vider") {
      await prisma.comptesBancaires.updateMany({
        where: { compte: "caisse" },
        data: {
          solde: { decrement: montant },
        },
      });
      await prisma.comptesBancaires.updateMany({
        where: { compte: compte },
        data: {
          solde: { increment: montant },
        },
      });
      // Si la destination est le compte professionnel, créer un versement (source = caisse)
      const compteDest = (compte || "").toLowerCase();
      if (
        compteDest === "compte professionnel" ||
        compteDest === "compte professionel"
      ) {
        const caisseAccount = await prisma.comptesBancaires.findFirst({
          where: { compte: "caisse" },
        });
        const compteProAccount = await prisma.comptesBancaires.findFirst({
          where: {
            OR: [
              { compte: { equals: "compte professionnel", mode: "insensitive" } },
              { compte: "compte professionel" },
            ],
          },
        });
        if (caisseAccount && compteProAccount) {
          await prisma.versement.create({
            data: {
              montant,
              sourceCompteId: caisseAccount.id,
              compteProId: compteProAccount.id,
              note: "Vider la caisse vers compte pro",
            },
          });
        }
      }
    } else if (type === "depense" || type === "recette") {
      // Mise à jour d'un compte bancaire
      await prisma.comptesBancaires.updateMany({
        where: { compte: compte },
        data: {
          solde:
            type === "recette"
              ? { increment: montant }
              : { decrement: montant },
        },
      });
    }

    if (numero && numero.slice(0, 3) === "CMD") {
      await prisma.commandes.update({
        where: { numero: numero },
        data: {
          totalPaye: { increment: montant },
        },
      });
    } else if (numero && numero.slice(0, 2) === "BL") {
      await prisma.bonLivraison.update({
        where: { numero: numero },
        data: {
          totalPaye: { increment: montant },
        },
      });
    }
  });

  return { result };
}
