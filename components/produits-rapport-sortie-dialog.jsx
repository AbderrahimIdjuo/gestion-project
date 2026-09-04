"use client";

import PeriodeFilter from "@/components/customUi/periode-filter";
import Spinner from "@/components/customUi/Spinner";
import { RapportEntete } from "@/components/rapport-entete";
import {
  RapportMultiSelect,
  produitRapportLabel,
} from "@/components/rapport-multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { entrepotBadgeClass } from "@/lib/entrepot-badge";
import { formatCurrency } from "@/lib/functions";
import { getDateRangeFromPeriode, getPeriodeLabel } from "@/lib/periode";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutList,
  Package,
  Printer,
  ScrollText,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

const TABLE_OPTIONS = [
  {
    id: "recap",
    label: "Récapitulatif par produit",
    description: "Quantités sorties, avec BL et devis au clic",
    icon: Package,
  },
  {
    id: "bl",
    label: "Bons de livraison STOCK(sortie)",
    description: "Détail de chaque mouvement de sortie",
    icon: ScrollText,
  },
  {
    id: "devis",
    label: "Bilan des devis",
    description: "Devis liés et produits utilisés par entrepôt",
    icon: LayoutList,
  },
];

function formatQty(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR");
}

function statutDevisColor(statut) {
  switch (statut) {
    case "En attente":
      return "bg-amber-100 text-amber-700";
    case "Accepté":
      return "bg-green-100 text-green-700";
    case "Annulé":
      return "bg-red-100 text-red-700";
    case "Terminer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function ProduitsRapportSortieDialog({
  embedded = false,
  onBack,
  onClose,
}) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectedEntrepotIds, setSelectedEntrepotIds] = useState([]);
  const [selectedCategorieIds, setSelectedCategorieIds] = useState([]);
  const [selectedProduitIds, setSelectedProduitIds] = useState([]);
  const [periode, setPeriode] = useState("ce-mois");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [initialized, setInitialized] = useState(false);
  const [expandedProduitIds, setExpandedProduitIds] = useState([]);

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);

  const entrepotsQuery = useQuery({
    queryKey: ["entrepots"],
    queryFn: async () => {
      const response = await axios.get("/api/entrepots");
      return response.data.entrepots || [];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories || [];
    },
  });

  const produitsListeQuery = useQuery({
    queryKey: ["produits-liste-rapport"],
    queryFn: async () => {
      const response = await axios.get("/api/produits/liste");
      return response.data.produits || [];
    },
  });

  const entrepots = entrepotsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const produitsListe = produitsListeQuery.data || [];

  const allCategoriesSelected =
    categories.length > 0 &&
    categories.every(c => selectedCategorieIds.includes(c.id));

  const produitsFiltres = useMemo(() => {
    if (allCategoriesSelected || selectedCategorieIds.length === 0) {
      return produitsListe;
    }
    return produitsListe.filter(p =>
      selectedCategorieIds.includes(p.categorieId)
    );
  }, [produitsListe, selectedCategorieIds, allCategoriesSelected]);

  useEffect(() => {
    if (initialized) return;
    if (
      entrepotsQuery.isLoading ||
      categoriesQuery.isLoading ||
      produitsListeQuery.isLoading
    ) {
      return;
    }
    setSelectedEntrepotIds(entrepots.map(e => e.id));
    setSelectedCategorieIds(categories.map(c => c.id));
    setSelectedProduitIds(produitsListe.map(p => p.id));
    setInitialized(true);
  }, [
    entrepots,
    categories,
    produitsListe,
    initialized,
    entrepotsQuery.isLoading,
    categoriesQuery.isLoading,
    produitsListeQuery.isLoading,
  ]);

  useEffect(() => {
    if (!initialized) return;
    const validIds = new Set(produitsFiltres.map(p => p.id));
    setSelectedProduitIds(prev => {
      const next = prev.filter(id => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [produitsFiltres, initialized]);

  const allEntrepotsSelected =
    entrepots.length > 0 &&
    entrepots.every(e => selectedEntrepotIds.includes(e.id));
  const allProduitsSelected =
    produitsFiltres.length > 0 &&
    produitsFiltres.every(p => selectedProduitIds.includes(p.id));

  const showRecap = selectedTables.includes("recap");
  const showBl = selectedTables.includes("bl");
  const showDevis = selectedTables.includes("devis");

  const canSubmit =
    selectedTables.length > 0 &&
    selectedEntrepotIds.length > 0 &&
    (selectedCategorieIds.length > 0 || categories.length === 0) &&
    (selectedProduitIds.length > 0 || produitsFiltres.length === 0) &&
    !!periode &&
    (periode !== "personnalisee" || (!!startDate && !!endDate));

  const rapportQuery = useQuery({
    queryKey: [
      "produits-rapport-sortie",
      selectedEntrepotIds,
      selectedCategorieIds,
      selectedProduitIds,
      periode,
      from,
      to,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/produits/rapport-sortie", {
        params: {
          entrepotIds: allEntrepotsSelected
            ? "all"
            : selectedEntrepotIds.join(","),
          categorieIds: allCategoriesSelected
            ? "all"
            : selectedCategorieIds.join(","),
          produitIds: allProduitsSelected
            ? "all"
            : selectedProduitIds.join(","),
          from: from?.toISOString?.() ?? undefined,
          to: to?.toISOString?.() ?? undefined,
        },
      });
      return response.data;
    },
    enabled: currentStep === 2 && canSubmit,
  });

  const resume = rapportQuery.data?.resume || {};
  const parProduit = rapportQuery.data?.parProduit || [];
  const mouvements = rapportQuery.data?.mouvements || [];
  const devis = rapportQuery.data?.devis || [];

  const selectedEntrepotNames = entrepots
    .filter(e => selectedEntrepotIds.includes(e.id))
    .map(e => e.nom);
  const selectedCategorieNames = categories
    .filter(c => selectedCategorieIds.includes(c.id))
    .map(c => c.categorie);
  const selectedProduitNames = produitsFiltres
    .filter(p => selectedProduitIds.includes(p.id))
    .map(p => produitRapportLabel(p));

  const periodeLabel =
    periode === "personnalisee" && startDate && endDate
      ? `${formatDate(startDate)} → ${formatDate(endDate)}`
      : getPeriodeLabel(periode);

  const toggleTable = id => {
    setSelectedTables(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleProduit = id => {
    setExpandedProduitIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setCurrentStep(1);
    setPeriode("ce-mois");
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedTables([]);
    setExpandedProduitIds([]);
    setSelectedEntrepotIds(entrepots.map(e => e.id));
    setSelectedCategorieIds(categories.map(c => c.id));
    setSelectedProduitIds(produitsListe.map(p => p.id));
  };

  useEffect(() => {
    if (!embedded && !open) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, embedded]);

  const handleCancel = () => {
    if (embedded && onClose) {
      onClose();
    } else {
      setOpen(false);
      reset();
    }
  };

  const handlePrint = () => {
    const data = {
      resume,
      parProduit,
      mouvements,
      devis,
      tables: selectedTables,
      entrepots: allEntrepotsSelected
        ? "Tous les entrepôts"
        : selectedEntrepotNames,
      categories: allCategoriesSelected
        ? "Toutes les catégories"
        : selectedCategorieNames,
      produitsFiltres: allProduitsSelected
        ? "Tous les produits"
        : selectedProduitNames,
      periode: periodeLabel,
    };
    localStorage.setItem("produits-rapport-sortie", JSON.stringify(data));
    window.open("/produits/imprimer-rapport-sortie", "_blank");
  };

  const hasData =
    (showRecap && parProduit.length > 0) ||
    (showBl && mouvements.length > 0) ||
    (showDevis && devis.length > 0);

  const content = (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
          <FileText className="h-5 w-5 text-purple-600" />
          Rapport du stock (Sortie)
        </DialogTitle>
        <DialogDescription>
          {currentStep === 1
            ? "Choisissez le tableau à afficher, puis les filtres du rapport."
            : ""}
        </DialogDescription>
      </DialogHeader>

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tableau à afficher</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TABLE_OPTIONS.map(option => {
                const Icon = option.icon;
                const selected = selectedTables.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleTable(option.id)}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-purple-500 bg-purple-50 shadow-sm ring-2 ring-purple-200"
                        : "border-purple-100 bg-white hover:border-purple-300"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        selected
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <PeriodeFilter
              periode={periode}
              onPeriodeChange={setPeriode}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              includeToutes
              id="periode-stock-sortie"
            />
            <RapportMultiSelect
              label="Entrepôts"
              items={entrepots}
              selectedIds={selectedEntrepotIds}
              onChange={setSelectedEntrepotIds}
              allLabel="Tous les entrepôts"
              placeholder="Sélectionner les entrepôts"
              nameKey="nom"
            />
            <RapportMultiSelect
              label="Catégories"
              items={categories}
              selectedIds={selectedCategorieIds}
              onChange={setSelectedCategorieIds}
              allLabel="Toutes les catégories"
              placeholder="Sélectionner les catégories"
              nameKey="categorie"
            />
            <RapportMultiSelect
              label="Produits"
              items={produitsFiltres}
              selectedIds={selectedProduitIds}
              onChange={setSelectedProduitIds}
              allLabel="Tous les produits"
              placeholder="Sélectionner les produits"
              getLabel={produitRapportLabel}
              searchable
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 print:hidden">
            {embedded && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="rounded-full"
              >
                Retour
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="rounded-full"
            >
              Annuler
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              disabled={!canSubmit}
              onClick={() => setCurrentStep(2)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <RapportEntete
            stats={[
              {
                label: "Période",
                value: periodeLabel,
              },
              {
                label: "Catégories",
                value: allCategoriesSelected
                  ? "Toutes les catégories"
                  : selectedCategorieNames.join(", ") || "—",
              },
              {
                label: "Produits",
                value: allProduitsSelected
                  ? "Tous les produits"
                  : selectedProduitNames.length > 3
                    ? `${selectedProduitNames.length} produits`
                    : selectedProduitNames.join(", ") || "—",
              },
              {
                label: "BL sortie",
                value: rapportQuery.isLoading ? "…" : resume.nbBl || 0,
              },
              {
                label: "Qté sortie",
                value: rapportQuery.isLoading
                  ? "…"
                  : formatQty(resume.quantiteTotale),
              },
              {
                label: "Valeur sortie",
                value: rapportQuery.isLoading
                  ? "…"
                  : formatCurrency(resume.valeurTotale || 0),
                valueClassName: "text-rose-700",
              },
              {
                label: "Devis liés",
                value: rapportQuery.isLoading ? "…" : resume.nbDevis || 0,
              },
            ]}
          />

          {rapportQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
              <Spinner className="w-10 h-10 border-2 border-purple-200 border-t-purple-600" />
              <p className="text-sm font-medium">Chargement du rapport...</p>
            </div>
          ) : (
            <>
              {showRecap && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Récapitulatif par produit
                  </h4>
                  <div className="rounded-xl border shadow-sm overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b z-10">
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead className="font-semibold">
                            Référence
                          </TableHead>
                          <TableHead className="font-semibold">
                            Désignation
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            Quantité sortie
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            Valeur
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            BL
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            Devis
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parProduit.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-10 text-muted-foreground"
                            >
                              Aucune sortie STOCK(sortie) pour cette sélection
                            </TableCell>
                          </TableRow>
                        ) : (
                          parProduit.map(produit => {
                            const expanded = expandedProduitIds.includes(
                              produit.id
                            );
                            const Chevron = expanded
                              ? ChevronDown
                              : ChevronRight;
                            return (
                              <Fragment key={produit.id}>
                                <TableRow
                                  className="border-b hover:bg-purple-50/50 cursor-pointer"
                                  onClick={() => toggleProduit(produit.id)}
                                >
                                  <TableCell className="py-2 w-8">
                                    <Chevron className="h-4 w-4 text-purple-600" />
                                  </TableCell>
                                  <TableCell className="py-2 font-medium">
                                    {produit.reference || "—"}
                                  </TableCell>
                                  <TableCell className="py-2">
                                    {produit.designation}
                                  </TableCell>
                                  <TableCell className="py-2 text-right tabular-nums font-medium">
                                    {formatQty(produit.quantite)} {produit.unite}
                                  </TableCell>
                                  <TableCell className="py-2 text-right tabular-nums">
                                    {formatCurrency(produit.valeur)}
                                  </TableCell>
                                  <TableCell className="py-2 text-right tabular-nums">
                                    {produit.nbBl}
                                  </TableCell>
                                  <TableCell className="py-2 text-right tabular-nums">
                                    {produit.nbDevis}
                                  </TableCell>
                                </TableRow>
                                {expanded && (
                                  <TableRow className="border-b bg-purple-50/40">
                                    <TableCell colSpan={7} className="py-3 px-6">
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                          <p className="text-xs font-semibold text-gray-500 mb-1.5">
                                            Bons de livraison
                                          </p>
                                          {(produit.bls || []).length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                              Aucun BL
                                            </p>
                                          ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                              {(produit.bls || []).map(bl => (
                                                <Badge
                                                  key={bl.id}
                                                  variant="outline"
                                                  className="rounded-full font-normal"
                                                >
                                                  {bl.numero}
                                                  {bl.devisNumero
                                                    ? ` · ${bl.devisNumero}`
                                                    : ""}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-gray-500 mb-1.5">
                                            Devis
                                          </p>
                                          {(produit.devis || []).length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                              Aucun devis
                                            </p>
                                          ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                              {(produit.devis || []).map(d => (
                                                <Badge
                                                  key={d.numero}
                                                  className="rounded-full font-normal bg-violet-100 text-violet-800 hover:bg-violet-100"
                                                >
                                                  {d.numero}
                                                  {d.clientName
                                                    ? ` · ${d.clientName}`
                                                    : ""}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            );
                          })
                        )}
                      </TableBody>
                      {parProduit.length > 0 && (
                        <TableFooter className="bg-gray-50">
                          <TableRow className="border-t font-semibold">
                            <TableCell colSpan={3} className="text-right">
                              Total
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatQty(resume.quantiteTotale)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-rose-700">
                              {formatCurrency(resume.valeurTotale || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {resume.nbBl || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {resume.nbDevis || 0}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </div>
                </div>
              )}

              {showBl && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Bons de livraison STOCK(sortie)
                  </h4>
                  <div className="rounded-xl border shadow-sm overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b z-10">
                        <TableRow>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">N° BL</TableHead>
                          <TableHead className="font-semibold">Produit</TableHead>
                          <TableHead className="font-semibold">Entrepôt</TableHead>
                          <TableHead className="font-semibold">Devis</TableHead>
                          <TableHead className="font-semibold">Client</TableHead>
                          <TableHead className="text-right font-semibold">
                            Quantité
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            Valeur
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mouvements.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Aucun BL de sortie pour cette sélection
                            </TableCell>
                          </TableRow>
                        ) : (
                          mouvements.map(m => (
                            <TableRow
                              key={m.id}
                              className="border-b hover:bg-purple-50/50"
                            >
                              <TableCell className="py-2">
                                {formatDate(m.date)}
                              </TableCell>
                              <TableCell className="py-2 font-medium">
                                {m.blNumero}
                              </TableCell>
                              <TableCell className="py-2">
                                {m.designation}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge
                                  variant="outline"
                                  className={`rounded-full font-normal border ${entrepotBadgeClass(
                                    m.entrepotId
                                  )}`}
                                >
                                  {m.entrepot}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                {m.devisNumero || "—"}
                              </TableCell>
                              <TableCell className="py-2">
                                {m.clientName || "—"}
                              </TableCell>
                              <TableCell className="py-2 text-right tabular-nums font-medium">
                                {formatQty(m.quantite)} {m.unite}
                              </TableCell>
                              <TableCell className="py-2 text-right tabular-nums">
                                {formatCurrency(m.valeur)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {showDevis && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Bilan des devis
                  </h4>
                  <div className="rounded-xl border shadow-sm overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b z-10">
                        <TableRow>
                          <TableHead className="font-semibold">
                            N° Devis
                          </TableHead>
                          <TableHead className="font-semibold">Client</TableHead>
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold">
                            Produits utilisés
                          </TableHead>
                          <TableHead className="text-right font-semibold">
                            Coût sortie
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devis.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Aucun devis lié aux sorties sélectionnées
                            </TableCell>
                          </TableRow>
                        ) : (
                          devis.map(d => {
                            return (
                              <TableRow
                                key={d.numero}
                                className="border-b hover:bg-purple-50/50"
                              >
                                <TableCell className="py-2 font-medium">
                                  {d.numero}
                                </TableCell>
                                <TableCell className="py-2">{d.client}</TableCell>
                                <TableCell className="py-2">
                                  <Badge
                                    className={`rounded-full font-normal ${statutDevisColor(
                                      d.statut
                                    )}`}
                                  >
                                    {d.statut}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {(d.produits || []).map(p => (
                                      <Badge
                                        key={`${p.id}-${p.entrepotId || "none"}`}
                                        variant="outline"
                                        className={`rounded-full font-normal border ${entrepotBadgeClass(
                                          p.entrepotId
                                        )}`}
                                      >
                                        {p.designation} : {formatQty(p.quantite)}{" "}
                                        {p.unite}
                                        {p.entrepot && p.entrepot !== "—"
                                          ? ` · ${p.entrepot}`
                                          : ""}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 text-right tabular-nums">
                                  {formatCurrency(d.valeurFournitures)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                      {devis.length > 0 && (
                        <TableFooter className="bg-gray-50">
                          <TableRow className="border-t font-semibold">
                            <TableCell colSpan={4} className="text-right">
                              Total coût sortie
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-rose-700">
                              {formatCurrency(
                                devis.reduce(
                                  (acc, d) =>
                                    acc + (Number(d.valeurFournitures) || 0),
                                  0
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => {
                setExpandedProduitIds([]);
                setCurrentStep(1);
              }}
            >
              Retour
            </Button>
            <Button
              className="rounded-full"
              variant="outline"
              onClick={handleCancel}
            >
              Fermer
            </Button>
            {hasData && (
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimer
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport (Sortie)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}
