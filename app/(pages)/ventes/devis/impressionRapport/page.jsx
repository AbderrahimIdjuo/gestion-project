"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { DirectPrintButton } from "@/components/ui/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/functions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./page.css";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("fr-FR");
}

const statutPaiementBadge = (devis) => {
  if (!devis?.statutPaiement) return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
  switch (devis.statutPaiement) {
    case "paye":
      return { lable: "Payé", color: "bg-green-100 text-green-600" };
    case "enPartie":
      return { lable: "En partie", color: "bg-orange-100 text-orange-500" };
    case "impaye":
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
    default:
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
  }
};

const totalBlFourniture = (produits) =>
  produits?.reduce((acc, p) => acc + (p.quantite || 0) * (p.prixUnite || 0), 0) ?? 0;

const totalFourniture = (group) =>
  group?.reduce((acc, item) => {
    const type = item?.bonLivraison?.type;
    if (type === "achats") return acc + totalBlFourniture(item.produits);
    if (type === "retour") return acc - totalBlFourniture(item.produits);
    return acc;
  }, 0) ?? 0;

function RapportSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {/* Barre Commerçant + Période */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* Grille 6 stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-muted/50 rounded-lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* Tableau : en-têtes + lignes */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 9 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-14" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: 9 }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton
                      className={`h-5 ${
                        colIndex === 0 ? "w-20" : colIndex === 1 ? "w-16" : colIndex === 2 ? "w-28" : "w-20"
                      }`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ImpressionRapportDevis() {
  const { user } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/ventes/devis");
      return;
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    const stored = localStorage.getItem("devis-rapport");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(null);
      }
    }
    setIsLoading(false);
  }, []);

  if (user && !isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 w-[90vw] max-w-6xl bg-white min-h-screen">
        <div className="print-block mb-6">
          <EnteteDevis />
        </div>
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Rapport des devis</h3>
        <RapportSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <p className="text-muted-foreground">
          Aucun rapport à afficher. Générez un rapport devis puis cliquez sur Imprimer.
        </p>
      </div>
    );
  }

  const { devis = [], bLGroupsList = [], totals = {}, commercant, from, to } = data;
  const t = totals;
  const filteredOrders = (numero) => bLGroupsList.filter((o) => o.devisNumero === numero);

  return (
    <>
      <div className="mx-auto p-8 w-[90vw] max-w-7xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-4 py-4">
          <div className="print-block">
            <EnteteDevis />
          </div>


          <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-muted/50  text-sm print-block">
          <div>
                 <span className="font-medium text-muted-foreground">Commerçant : </span>
            <span className="font-semibold text-foreground">
              {commercant === "all" ? "Tous" : commercant ?? "—"}
            </span>
          </div>
       
         {from && to && (
              <div>
                <span className="font-medium text-muted-foreground ml-4">Période : </span>
                <span className="font-semibold text-foreground">
                  {formatDate(from)} → {formatDate(to)}
                </span>
              </div>
            )}
       
           
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-muted/50 rounded-lg print-block">

            <div>
              <p className="text-xs font-medium text-muted-foreground">Total devis</p>
              <p className="text-lg font-semibold text-fuchsia-600">
                {formatCurrency(t?.montantTotalDevis ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total payé</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(t?.montantTotalPaye ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Restant à payer</p>
              <p className="text-lg font-semibold text-amber-600">
                {formatCurrency(t?.montantTotalRestant ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total marge</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(t?.totalMarge ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">% bénéfice (saisi)</p>
              <p className="text-lg font-semibold">
                {t?.pctBenefice != null ? `${t.pctBenefice}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bénéfice (marge × %)</p>
              <p className="text-lg font-semibold text-purple-600">
                {formatCurrency(t?.beneficeFromMarge ?? 0)}
              </p>
            </div>
          </div>



          <div className="rounded-md border overflow-x-auto max-h-[50vh] overflow-y-auto main-table-container print-block">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Statut paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devis.length > 0 ? (
                  devis.map((d) => {
                    const fourn = totalFourniture(filteredOrders(d.numero));
                    const marge = (Number(d.total) || 0) - fourn;
                    const reste = (Number(d.total) || 0) - (Number(d.totalPaye) || 0);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>{formatDate(d.date)}</TableCell>
                        <TableCell className="font-medium">{d.numero}</TableCell>
                        <TableCell>{d.client?.nom ?? "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.total)}</TableCell>
                        <TableCell className="text-right text-foreground">
                          {formatCurrency(d.totalPaye)}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {formatCurrency(reste)}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          {formatCurrency(marge)}
                        </TableCell>
                        <TableCell>{d.statut ?? "—"}</TableCell>
                        <TableCell>{statutPaiementBadge(d)?.lable ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucun devis trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="fixed bottom-4 right-4 z-50 print:hidden">
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full shadow-lg">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
