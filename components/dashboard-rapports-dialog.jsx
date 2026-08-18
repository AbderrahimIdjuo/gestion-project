"use client";

import BonLivraisonRapportDialog from "@/components/bonLivraison-rapport-dialog";
import ClientsRapportDialog from "@/components/clients-rapport-dialog";
import ComptesRapportContent from "@/components/comptes-rapport-dialog";
import DevisRapportDialog from "@/components/devis-rapport-dialog";
import { ChargesRapportContent } from "@/components/transactions-rapport-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import {
  Building2,
  FileText,
  Landmark,
  ScrollText,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

const REPORT_TYPES = [
  {
    id: "clients",
    title: "Crédits clients",
    description: "Reste d'avances et paiements par client",
    icon: Users,
    adminOnly: false,
  },
  {
    id: "achats",
    title: "Rapport des achats",
    description: "Bons de livraison et règlements fournisseurs",
    icon: ScrollText,
    adminOnly: false,
  },
  {
    id: "devis",
    title: "Rapport devis",
    description: "Devis, marges et totaux par période",
    icon: FileText,
    adminOnly: true,
  },
  {
    id: "comptes",
    title: "Rapport comptes",
    description: "Mouvements et solde par compte",
    icon: Landmark,
    adminOnly: false,
  },
  {
    id: "charges-fixes",
    title: "Charges fixes",
    description: "Rapport des charges fixes",
    icon: Building2,
    adminOnly: false,
  },
  {
    id: "charges-variantes",
    title: "Charges variantes",
    description: "Rapport des charges variantes",
    icon: Wallet,
    adminOnly: false,
  },
];

export default function DashboardRapportsDialog() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState(null);

  const visibleReports = REPORT_TYPES.filter(
    type => !type.adminOnly || isAdmin
  );

  useEffect(() => {
    if (!open) {
      setReportType(null);
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setReportType(null);
  };

  const handleBack = () => setReportType(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="size-24 flex-col gap-1.5 rounded-full border-0 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-600 px-3 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(139,92,246,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(139,92,246,0.42)] max-md:mx-auto [&_svg]:size-5">
          <FileText />
          Rapports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {!reportType && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
                <FileText className="h-5 w-5 text-purple-600" />
                Choisir le type de rapport
              </DialogTitle>
              <DialogDescription>
                Sélectionnez le rapport que vous souhaitez générer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {visibleReports.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setReportType(type.id)}
                    className="flex flex-col items-start gap-3 rounded-xl border border-purple-100 bg-white p-5 text-left shadow-sm transition hover:border-purple-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{type.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-full"
              >
                Annuler
              </Button>
            </div>
          </>
        )}

        {reportType === "clients" && (
          <ClientsRapportDialog
            embedded
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        {reportType === "achats" && (
          <BonLivraisonRapportDialog
            embedded
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        {reportType === "devis" && isAdmin && (
          <DevisRapportDialog
            embedded
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        {reportType === "comptes" && (
          <ComptesRapportContent
            embedded
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        {reportType === "charges-fixes" && (
          <ChargesRapportContent
            typeDepense="fixe"
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        {reportType === "charges-variantes" && (
          <ChargesRapportContent
            typeDepense="variante"
            onBack={handleBack}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
