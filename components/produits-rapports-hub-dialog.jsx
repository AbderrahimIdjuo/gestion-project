"use client";

import ProduitsRapportDialog from "@/components/produits-rapport-dialog";
import ProduitsRapportSortieDialog from "@/components/produits-rapport-sortie-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, PackageMinus, PackagePlus } from "lucide-react";
import { useEffect, useState } from "react";

const STOCK_REPORTS = [
  {
    id: "entree",
    title: "Rapport du stock (Entrée)",
    description: "Quantités positives et valeur du stock par entrepôt",
    icon: PackagePlus,
  },
  {
    id: "sortie",
    title: "Rapport du stock (Sortie)",
    description: "BL STOCK(sortie) et bilan des devis liés",
    icon: PackageMinus,
  },
];

export default function ProduitsRapportsHubDialog() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState(null);

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
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport du stock
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
                Sélectionnez le rapport de stock à générer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {STOCK_REPORTS.map(type => {
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

        {reportType === "entree" && (
          <ProduitsRapportDialog
            embedded
            onBack={handleBack}
            onClose={handleClose}
          />
        )}

        {reportType === "sortie" && (
          <ProduitsRapportSortieDialog
            embedded
            onBack={handleBack}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
