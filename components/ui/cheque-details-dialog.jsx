"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Landmark } from "lucide-react";
import { useState } from "react";

function nombreEnLettres(n) {
  const unites = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ];
  const dizaines = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
  ];
  const dizainesSpeciales = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
  ];

  function convertMoinsDeCent(value) {
    if (value < 10) return unites[value];
    if (value < 17) return dizainesSpeciales[value - 10];
    if (value < 20) return "dix-" + unites[value - 10];
    if (value < 70) {
      const dizaine = Math.floor(value / 10);
      const unite = value % 10;
      return (
        dizaines[dizaine] +
        (unite === 1 ? "-et-un" : unite > 0 ? "-" + unites[unite] : "")
      );
    }
    if (value < 80) return "soixante-" + convertMoinsDeCent(value - 60);
    if (value < 100)
      return (
        "quatre-vingt" +
        (value === 80 ? "s" : "-" + convertMoinsDeCent(value - 80))
      );
    return "";
  }

  function convertMoinsDeMille(value) {
    if (value < 100) return convertMoinsDeCent(value);
    const centaine = Math.floor(value / 100);
    const reste = value % 100;
    return (
      (centaine === 1
        ? "cent"
        : unites[centaine] + " cent" + (reste === 0 ? "s" : "")) +
      (reste > 0 ? " " + convertMoinsDeCent(reste) : "")
    );
  }

  function convertir(value) {
    if (value === 0) return "zéro";
    if (value < 1000) return convertMoinsDeMille(value);
    const mille = Math.floor(value / 1000);
    const reste = value % 1000;
    return (
      (mille === 1 ? "mille" : convertMoinsDeMille(mille) + " mille") +
      (reste > 0 ? " " + convertMoinsDeMille(reste) : "")
    );
  }

  return convertir(Math.floor(Number(n) || 0)).trim();
}

function getBadgeStyle(methode) {
  if (methode === "cheque") {
    return "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer";
  }
  if (methode === "traite") {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer";
  }
  if (methode === "espece") {
    return "bg-green-100 text-green-800 hover:bg-green-100";
  }
  if (methode === "versement") {
    return "bg-sky-100 text-sky-800 hover:bg-sky-100";
  }
  return "bg-gray-100 text-gray-800 hover:bg-gray-100";
}

function getMethodeLabel(methode) {
  if (methode === "espece") return "Espèce";
  if (methode === "cheque") return "Chèque";
  if (methode === "versement") return "Versement";
  if (methode === "traite") return "Traite";
  return methode || "—";
}

export function ChequeDetailsDialog({
  methodePaiement,
  cheque,
  montant,
  compte,
  date,
  datePrelevement,
  motif,
  beneficiaire,
  formatDate,
  type = "EMIS", // "RECU" = une seule date (chèque client)
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isChequeOrTraite =
    methodePaiement === "cheque" || methodePaiement === "traite";
  const isRecu = type === "RECU" || cheque?.type === "RECU";

  const dateReglementValue =
    cheque?.dateReglement || date || null;
  const datePrelevementValue =
    cheque?.datePrelevement || datePrelevement || null;
  const montantValue = Number(montant) || 0;

  return (
    <>
      <Badge
        variant="secondary"
        className={`text-xs ${getBadgeStyle(methodePaiement)}`}
        onClick={isChequeOrTraite ? () => setIsOpen(true) : undefined}
      >
        {getMethodeLabel(methodePaiement)}
      </Badge>

      {isChequeOrTraite && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
            <div className="space-y-4 p-6">
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold">
                  {methodePaiement === "cheque"
                    ? "CHÈQUE BANCAIRE"
                    : "TRAITE"}
                </DialogTitle>
              </DialogHeader>

              {/* Simulation d'un vrai chèque */}
              <div className="border-2 border-gray-800 bg-white p-8 shadow-2xl relative overflow-hidden min-h-[280px]">
                <div className="absolute top-0 left-0 right-0 h-1 border-b border-dotted border-gray-400" />
                <div className="absolute bottom-0 left-0 right-0 h-1 border-t border-dotted border-gray-400" />
                <div className="absolute left-0 top-0 bottom-0 w-1 border-r border-dotted border-gray-400" />
                <div className="absolute right-0 top-0 bottom-0 w-1 border-l border-dotted border-gray-400" />
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)",
                  }}
                />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400">
                        <Landmark className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-xs text-gray-700">
                        <div className="text-[10px] text-gray-600">
                          Compte bancaire
                        </div>
                        <div className="font-bold text-sm mb-0.5 text-gray-900 uppercase">
                          {compte || cheque?.compte || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="text-left flex gap-4">
                      {isRecu ? (
                        <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                          Date: <br />
                          <span className="font-bold text-sm text-gray-900">
                            {dateReglementValue
                              ? formatDate(dateReglementValue)
                              : "—"}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                            Date de création: <br />
                            <span className="font-bold text-sm text-gray-900">
                              {dateReglementValue
                                ? formatDate(dateReglementValue)
                                : "—"}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                            Date de prélèvement: <br />
                            <span className="font-bold text-sm text-gray-900">
                              {datePrelevementValue
                                ? formatDate(datePrelevementValue)
                                : "—"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-6 gap-8">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wide">
                        PAYEZ À L&apos;ORDRE DE
                      </div>
                      <div className="text-xl font-extrabold border-b-2 border-gray-900 pb-2 uppercase tracking-wide min-h-[2.5rem] flex items-end">
                        {beneficiaire || "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="border-2 border-gray-900 px-4 py-2 min-w-[150px]">
                        <div className="text-2xl font-extrabold text-gray-900 text-right">
                          {montantValue.toFixed(2)} DH
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-base font-bold border-b-2 border-gray-900 pb-2 min-h-[2rem] flex items-end tracking-wide">
                      {nombreEnLettres(montantValue)}{" "}
                      <span className="ml-2">dirhams</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-auto pt-4">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Motif :
                      </div>
                      <div className="text-sm font-semibold pb-1 text-gray-800 min-h-[1.5rem]">
                        {motif || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-gray-400">
                    <div className="text-[30px] text-gray-600 font-mono tracking-widest text-center">
                      ⑆ {cheque?.numero || "—"} ⑆
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
