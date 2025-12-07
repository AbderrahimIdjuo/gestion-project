"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function ViewReglementDialog({
  reglementId,
  open,
  onOpenChange,
}) {
  const { data: reglementData, isLoading } = useQuery({
    queryKey: ["reglement", reglementId],
    queryFn: async () => {
      const response = await axios.get(`/api/reglement/${reglementId}`);
      return response.data.reglement;
    },
    enabled: open && !!reglementId,
  });

  const reglement = reglementData;

  if (!open || !reglementId) return null;

  const getStatutBadgeClass = statut => {
    switch (statut) {
      case "paye":
        return "bg-green-100 text-green-700";
      case "en_attente":
        return "bg-amber-100 text-amber-700";
      case "en_retard":
        return "bg-red-100 text-red-700";
      case "annule":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getMethodePaiementBadgeClass = methode => {
    switch (methode) {
      case "espece":
        return "bg-green-100 text-green-700";
      case "cheque":
        return "bg-purple-100 text-purple-700";
      case "versement":
        return "bg-blue-100 text-blue-700";
      case "traite":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du règlement</DialogTitle>
          <DialogDescription>
            Informations complètes du règlement
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : reglement ? (
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Montant</p>
                <p className="font-semibold text-lg text-purple-600">
                  {formatCurrency(reglement.montant)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge className={getStatutBadgeClass(reglement.statut)}>
                  {reglement.statut}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Méthode de paiement
                </p>
                <Badge
                  className={getMethodePaiementBadgeClass(
                    reglement.methodePaiement
                  )}
                >
                  {reglement.methodePaiement}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compte</p>
                <p className="font-semibold">
                  {reglement.compte?.replace("compte ", "") || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Date de règlement
                </p>
                <p className="font-semibold">
                  {formatDate(reglement.dateReglement) || "—"}
                </p>
              </div>
              {reglement.datePrelevement && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Date de prélèvement
                  </p>
                  <p className="font-semibold">
                    {formatDate(reglement.datePrelevement)}
                  </p>
                </div>
              )}
              {reglement.motif && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Motif</p>
                  <p className="font-semibold">{reglement.motif}</p>
                </div>
              )}
            </div>

            {/* Informations fournisseur */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Fournisseur</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-semibold">{reglement.fournisseur.nom}</p>
                </div>
                {reglement.fournisseur.ice && (
                  <div>
                    <p className="text-sm text-muted-foreground">ICE</p>
                    <p className="font-semibold">{reglement.fournisseur.ice}</p>
                  </div>
                )}
                {reglement.fournisseur.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">
                      {reglement.fournisseur.email}
                    </p>
                  </div>
                )}
                {reglement.fournisseur.telephone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-semibold">
                      {reglement.fournisseur.telephone}
                    </p>
                  </div>
                )}
                {reglement.fournisseur.adresse && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-semibold">
                      {reglement.fournisseur.adresse}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations chèque */}
            {reglement.cheque && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Détails du chèque
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                  {reglement.cheque.numero && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Numéro de chèque
                      </p>
                      <p className="font-semibold">{reglement.cheque.numero}</p>
                    </div>
                  )}
                  {reglement.cheque.dateReglement && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date de règlement
                      </p>
                      <p className="font-semibold">
                        {formatDate(reglement.cheque.dateReglement)}
                      </p>
                    </div>
                  )}
                  {reglement.cheque.datePrelevement && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date de prélèvement
                      </p>
                      <p className="font-semibold">
                        {formatDate(reglement.cheque.datePrelevement)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Facture liée */}
            {reglement.factureAchats && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Facture liée</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Numéro de facture
                  </p>
                  <p className="font-semibold">
                    {reglement.factureAchats.numero || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Règlement non trouvé
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
