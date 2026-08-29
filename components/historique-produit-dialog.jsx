"use client";

import PeriodeFilter, {
  usePeriodeFilter,
} from "@/components/customUi/periode-filter";
import Spinner from "@/components/customUi/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { entrepotBadgeClass } from "@/lib/entrepot-badge";
import { formatCurrency, formatDate, formatMontant } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function dateLabel(value) {
  if (!value) return "—";
  const str = typeof value === "string" ? value : new Date(value).toISOString();
  return formatDate(str) || "—";
}

function formatQty(value, unite) {
  const formatted = Number(value ?? 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return unite ? `${formatted} ${unite}` : formatted;
}

function formatDelta(delta) {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatMontant(delta)} DH`;
}

function PeriodeDates({ dateDebut, dateFin }) {
  const debut = dateLabel(dateDebut);
  const fin = dateLabel(dateFin);
  if (debut === fin) return debut;
  return `${debut} → ${fin}`;
}

function EvolutionPrixTooltip({ active, payload, unite }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold text-gray-800">{row.periode}</p>
      <p>Prix : {formatMontant(row.prix)} DH</p>
      <p>Qté : {formatQty(row.quantite, unite)}</p>
      <p>Qté retournée : {formatQty(row.quantiteRetournee, unite)}</p>
      <p>Différence de prix : {formatDelta(row.delta)}</p>
    </div>
  );
}

function EvolutionPrixGraph({ paliers, unite }) {
  const data = (paliers || []).map(palier => ({
    periode: dateLabel(palier.dateDebut),
    prix: palier.prix ?? 0,
    quantite: palier.quantite ?? 0,
    quantiteRetournee: palier.quantiteRetournee ?? 0,
    delta: palier.delta,
  }));

  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucune donnée à afficher.
      </p>
    );
  }

  return (
    <div className="h-[300px] w-full px-2 py-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="periode" fontSize={12} tickLine={false} />
          <YAxis
            yAxisId="prix"
            fontSize={12}
            tickLine={false}
            tickFormatter={v => `${v}`}
            label={{ value: "Prix (DH)", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <YAxis
            yAxisId="qty"
            orientation="right"
            fontSize={12}
            tickLine={false}
            label={{ value: "Quantité", angle: 90, position: "insideRight", fontSize: 11 }}
          />
          <Tooltip content={<EvolutionPrixTooltip unite={unite} />} />
          <Legend />
          <Bar
            yAxisId="qty"
            dataKey="quantite"
            name="Qté"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={22}
          />
          <Bar
            yAxisId="qty"
            dataKey="quantiteRetournee"
            name="Qté retournée"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            barSize={22}
          />
          <Line
            yAxisId="prix"
            type="monotone"
            dataKey="prix"
            name="Prix (DH)"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 4, fill: "#7c3aed" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function HistoriqueProduitDialog({ product, isOpen, onClose }) {
  const [graphFournisseurKey, setGraphFournisseurKey] = useState(null);
  const {
    periode,
    setPeriode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    from,
    to,
  } = usePeriodeFilter("all");

  const fromIso = from ? from.toISOString() : undefined;
  const toIso = to ? to.toISOString() : undefined;

  const historique = useQuery({
    queryKey: ["produit-historique", product?.id, fromIso, toIso],
    queryFn: async () => {
      const response = await axios.get(
        `/api/produits/${product.id}/historique`,
        {
          params: {
            ...(fromIso && { from: fromIso }),
            ...(toIso && { to: toIso }),
          },
        }
      );
      return response.data;
    },
    enabled: isOpen && !!product?.id,
    refetchOnWindowFocus: false,
  });

  const data = historique.data;
  const produit = data?.produit || product;
  const resume = data?.resume;
  const lignes = data?.lignes || [];
  const parFournisseur = data?.parFournisseur || [];
  const unite = produit?.Unite;
  const stocksEntrepot = (
    data?.produit?.stocksEntrepot ||
    product?.stocksEntrepot ||
    []
  ).filter(s => Number(s.quantite) !== 0);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose?.()}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0 border-2 sm:border-4 border-white/30 mx-auto sm:mx-0">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="flex-1 w-full">
              <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-2 text-white text-center sm:text-left">
                {produit?.designation || "Produit"}
              </DialogTitle>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8">
                <div>
                  <p className="text-xs text-purple-200 mb-1">Référence</p>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {produit?.reference || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-200 mb-1">Prix catalogue</p>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {produit?.prixAchat != null
                      ? `${formatMontant(produit.prixAchat)} DH`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-200 mb-1">Stock total</p>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {formatQty(produit?.stock ?? 0, unite)}
                  </p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <p className="text-xs text-purple-200 mb-2">Stock par entrepôt</p>
                {stocksEntrepot.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {stocksEntrepot.map(s => (
                      <Badge
                        key={s.id || s.entrepotId}
                        variant="outline"
                        className={`rounded-full font-medium border ${entrepotBadgeClass(
                          s.entrepotId
                        )}`}
                      >
                        {s.entrepot?.nom || "—"} : {formatQty(s.quantite, unite)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/80">Aucun stock réparti</p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          <div className="mt-4 max-w-sm">
            <PeriodeFilter
              periode={periode}
              onPeriodeChange={setPeriode}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              id="periode-historique-produit"
            />
          </div>

          {historique.isLoading && (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          )}

          {historique.isError && (
            <p className="text-center text-red-600 py-8">
              Impossible de charger l&apos;historique de ce produit.
            </p>
          )}

          {!historique.isLoading && data && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        Quantité achetée
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatQty(resume?.quantiteTotale ?? 0, unite)}
                      </p>
                      {(resume?.quantiteRetournee ?? 0) > 0 && (
                        <p className="text-xs text-blue-600">
                          {formatQty(resume.quantiteAchetee, unite)} achetés −{" "}
                          {formatQty(resume.quantiteRetournee, unite)} retournés
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">
                        Montant total
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        {formatCurrency(resume?.montantTotal ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-700">
                        Dernier prix
                      </p>
                      <p className="text-lg font-bold text-purple-900">
                        {resume?.dernierPrix != null
                          ? `${formatMontant(resume.dernierPrix)} DH`
                          : "—"}
                      </p>
                      {resume?.dernierFournisseur?.nom && (
                        <p className="text-xs text-purple-600 truncate max-w-[160px]">
                          {resume.dernierFournisseur.nom}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 p-4 shadow-sm">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Prix min / max / moyen
                  </p>
                  <p className="text-sm font-bold text-amber-900">
                    {resume?.prixMin != null
                      ? `${formatMontant(resume.prixMin)} / ${formatMontant(resume.prixMax)} / ${formatMontant(resume.prixMoyen)} DH`
                      : "—"}
                  </p>
                </div>
              </div>

              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b py-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                    Achats et retours ({lignes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {lignes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">
                      Aucun mouvement pour ce produit sur la période.
                    </p>
                  ) : (
                    <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-zinc-50 z-10">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>BL</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead className="text-right">Qté</TableHead>
                            <TableHead className="text-right">Prix U</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lignes.map(ligne => (
                            <TableRow key={ligne.id}>
                              <TableCell className="!py-2">
                                {dateLabel(ligne.date)}
                              </TableCell>
                              <TableCell className="!py-2 font-medium">
                                {ligne.numero || "—"}
                              </TableCell>
                              <TableCell className="!py-2">
                                {ligne.type === "retour" ? (
                                  <Badge
                                    variant="outline"
                                    className="border-red-300 text-red-700 bg-red-50"
                                  >
                                    Retour
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 bg-emerald-50"
                                  >
                                    Achat
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="!py-2">
                                {ligne.fournisseur?.nom || "—"}
                              </TableCell>
                              <TableCell
                                className={`!py-2 text-right tabular-nums ${
                                  ligne.type === "retour" ? "text-red-600" : ""
                                }`}
                              >
                                {formatQty(ligne.quantite, unite)}
                              </TableCell>
                              <TableCell className="!py-2 text-right tabular-nums">
                                {formatMontant(ligne.prixUnite)} DH
                              </TableCell>
                              <TableCell
                                className={`!py-2 text-right tabular-nums font-medium ${
                                  ligne.type === "retour" ? "text-red-600" : ""
                                }`}
                              >
                                {formatMontant(ligne.montant)} DH
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="h-5 w-5 text-purple-600" />
                  Évolution des prix par fournisseur
                </h3>
                {parFournisseur.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    Aucune évolution de prix à afficher.
                  </p>
                ) : (
                  parFournisseur.map(item => {
                    const fournisseurKey =
                      item.fournisseur?.id || item.fournisseur?.nom;
                    const graphOpen = graphFournisseurKey === fournisseurKey;
                    return (
                    <Card key={fournisseurKey} className="border shadow-sm">
                      <CardHeader className="py-3 px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <CardTitle className="text-base font-semibold">
                            {item.fournisseur?.nom || "Fournisseur"}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full border-purple-500 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900"
                              onClick={() =>
                                setGraphFournisseurKey(
                                  graphOpen ? null : fournisseurKey
                                )
                              }
                            >
                              <BarChart3 className="h-4 w-4" />
                              {graphOpen ? "Tableau" : "Graph"}
                            </Button>
                            <Badge variant="secondary">
                              {item.nbAchats} achat{item.nbAchats > 1 ? "s" : ""}
                            </Badge>
                            {(item.nbRetours ?? 0) > 0 && (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-700 bg-red-50"
                              >
                                {item.nbRetours} retour
                                {item.nbRetours > 1 ? "s" : ""}
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {formatQty(item.quantite, unite)}
                            </Badge>
                            {(item.quantiteRetournee ?? 0) > 0 && (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-700 bg-red-50"
                              >
                                {formatQty(item.quantiteRetournee, unite)}{" "}
                                retournés
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {formatCurrency(item.montant)}
                            </Badge>
                            {item.dernierPrix != null && (
                              <Badge className="bg-purple-600 hover:bg-purple-700">
                                Dernier : {formatMontant(item.dernierPrix)} DH
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {graphOpen ? (
                          <EvolutionPrixGraph
                            paliers={item.evolutionPrix}
                            unite={unite}
                          />
                        ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Prix</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead className="text-right">
                                  Achats
                                </TableHead>
                                <TableHead className="text-right">Qté</TableHead>
                                <TableHead className="text-right">
                                  Qté retournée
                                </TableHead>
                                <TableHead className="text-right">
                                  Différence de prix
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.evolutionPrix.map((palier, index) => (
                                <TableRow
                                  key={`${item.fournisseur?.id}-${palier.prix}-${index}`}
                                >
                                  <TableCell className="!py-2 font-medium tabular-nums">
                                    {formatMontant(palier.prix)} DH
                                  </TableCell>
                                  <TableCell className="!py-2">
                                    <PeriodeDates
                                      dateDebut={palier.dateDebut}
                                      dateFin={palier.dateFin}
                                    />
                                  </TableCell>
                                  <TableCell className="!py-2 text-right tabular-nums">
                                    {palier.nbAchats}
                                  </TableCell>
                                  <TableCell className="!py-2 text-right tabular-nums">
                                    {formatQty(palier.quantite, unite)}
                                  </TableCell>
                                  <TableCell
                                    className={`!py-2 text-right tabular-nums ${
                                      (palier.quantiteRetournee ?? 0) > 0
                                        ? "text-red-600"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {formatQty(
                                      palier.quantiteRetournee ?? 0,
                                      unite
                                    )}
                                  </TableCell>
                                  <TableCell className="!py-2 text-right">
                                    {palier.delta == null ? (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center justify-end gap-1 font-medium tabular-nums ${
                                          palier.delta > 0
                                            ? "text-red-600"
                                            : palier.delta < 0
                                              ? "text-emerald-600"
                                              : "text-muted-foreground"
                                        }`}
                                      >
                                        {palier.delta > 0 ? (
                                          <ArrowUpRight className="h-3.5 w-3.5" />
                                        ) : palier.delta < 0 ? (
                                          <ArrowDownRight className="h-3.5 w-3.5" />
                                        ) : null}
                                        {formatDelta(palier.delta)}
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
