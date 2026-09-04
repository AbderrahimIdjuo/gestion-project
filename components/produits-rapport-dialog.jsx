"use client";

import Spinner from "@/components/customUi/Spinner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RapportEntete } from "@/components/rapport-entete";
import {
  RapportMultiSelect,
  produitRapportLabel,
} from "@/components/rapport-multi-select";
import { entrepotBadgeClass } from "@/lib/entrepot-badge";
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileText,
  Printer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatQty(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

function SortableHead({ column, sortKey, sortDir, onSort, children, className }) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  const isRight = className?.includes("text-right");
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 font-semibold hover:text-purple-700 ${
          isRight ? "w-full justify-end" : ""
        }`}
      >
        {children}
        <Icon className={`h-3.5 w-3.5 ${active ? "text-purple-600" : "text-muted-foreground"}`} />
      </button>
    </TableHead>
  );
}

export default function ProduitsRapportDialog({
  embedded = false,
  onBack,
  onClose,
}) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEntrepotIds, setSelectedEntrepotIds] = useState([]);
  const [selectedCategorieIds, setSelectedCategorieIds] = useState([]);
  const [selectedProduitIds, setSelectedProduitIds] = useState([]);
  const [sortKey, setSortKey] = useState("valeurStock");
  const [sortDir, setSortDir] = useState("desc");
  const [initialized, setInitialized] = useState(false);

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

  const canSubmit =
    selectedEntrepotIds.length > 0 &&
    (selectedCategorieIds.length > 0 || categories.length === 0) &&
    (selectedProduitIds.length > 0 || produitsListe.length === 0);

  const rapportQuery = useQuery({
    queryKey: [
      "produits-rapport",
      selectedEntrepotIds,
      selectedCategorieIds,
      selectedProduitIds,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/produits/rapport", {
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
        },
      });
      return response.data;
    },
    enabled: currentStep === 2 && canSubmit,
  });

  const sortedProduits = useMemo(() => {
    const list = [...(rapportQuery.data?.produits || [])];
    list.sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [rapportQuery.data?.produits, sortKey, sortDir]);

  const valeurGlobale = rapportQuery.data?.valeurGlobale || 0;

  const selectedEntrepotNames = entrepots
    .filter(e => selectedEntrepotIds.includes(e.id))
    .map(e => e.nom);
  const selectedCategorieNames = categories
    .filter(c => selectedCategorieIds.includes(c.id))
    .map(c => c.categorie);
  const selectedProduitNames = produitsFiltres
    .filter(p => selectedProduitIds.includes(p.id))
    .map(p => produitRapportLabel(p));
  const showEntrepotColumn = selectedEntrepotIds.length > 1;

  const handleSort = column => {
    if (sortKey === column) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("desc");
    }
  };

  const reset = () => {
    setCurrentStep(1);
    setSortKey("valeurStock");
    setSortDir("desc");
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
      produits: sortedProduits,
      valeurGlobale,
      entrepots: allEntrepotsSelected ? "Tous les entrepôts" : selectedEntrepotNames,
      categories: allCategoriesSelected
        ? "Toutes les catégories"
        : selectedCategorieNames,
      produitsFiltres: allProduitsSelected
        ? "Tous les produits"
        : selectedProduitNames,
      showEntrepotColumn,
      sortKey,
      sortDir,
    };
    localStorage.setItem("produits-rapport", JSON.stringify(data));
    window.open("/produits/imprimer-rapport", "_blank");
  };

  const content = (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
          <FileText className="h-5 w-5 text-purple-600" />
          Rapport du stock (Entrée)
        </DialogTitle>
        <DialogDescription>
          {currentStep === 1
            ? "Sélectionnez les entrepôts, les catégories et les produits à inclure dans le rapport."
            : ""}
        </DialogDescription>
      </DialogHeader>

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="md:col-span-2">
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
        <div className="space-y-4">
          <RapportEntete
            stats={[
              {
                label: "Entrepôts",
                value: allEntrepotsSelected
                  ? "Tous les entrepôts"
                  : selectedEntrepotNames.join(", ") || "—",
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
                label: "Nombre de produits",
                value: rapportQuery.isLoading ? "…" : sortedProduits.length,
              },
              {
                label: "Valeur du stock",
                value: rapportQuery.isLoading
                  ? "…"
                  : formatCurrency(valeurGlobale),
                valueClassName: "text-emerald-700",
              },
            ]}
          />

          <div className="rounded-xl border shadow-sm overflow-x-auto">
            {rapportQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
                <Spinner className="w-10 h-10 border-2 border-purple-200 border-t-purple-600" />
                <p className="text-sm font-medium">Chargement du rapport...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b z-10">
                  <TableRow>
                    <TableHead className="font-semibold">Référence</TableHead>
                    <TableHead className="font-semibold">Désignation</TableHead>
                    <TableHead className="font-semibold">Catégorie</TableHead>
                    {showEntrepotColumn && (
                      <TableHead className="font-semibold">Entrepôt</TableHead>
                    )}
                    <SortableHead
                      column="quantite"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    >
                      Quantité
                    </SortableHead>
                    <SortableHead
                      column="prixUnite"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    >
                      Prix d&apos;unité
                    </SortableHead>
                    <SortableHead
                      column="valeurStock"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    >
                      Valeur en stock
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProduits.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={showEntrepotColumn ? 7 : 6}
                        className="text-center py-10 text-muted-foreground"
                      >
                        Aucun produit en stock positif pour cette sélection
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProduits.map(produit => (
                      <TableRow
                        key={produit.id}
                        className="border-b hover:bg-purple-50/50"
                      >
                        <TableCell className="py-2 font-medium">
                          {produit.reference || "—"}
                        </TableCell>
                        <TableCell className="py-2">
                          {produit.designation}
                        </TableCell>
                        <TableCell className="py-2">
                          {produit.categorie}
                        </TableCell>
                        {showEntrepotColumn && (
                          <TableCell className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {(produit.entrepots || []).map(stock => (
                                <Badge
                                  key={stock.id}
                                  variant="outline"
                                  className={`rounded-full font-normal border ${entrepotBadgeClass(
                                    stock.id
                                  )}`}
                                >
                                  {stock.nom} : {formatQty(stock.quantite)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="py-2 text-right tabular-nums font-medium">
                          {formatQty(produit.quantite)} {produit.unite}
                        </TableCell>
                        <TableCell className="py-2 text-right tabular-nums">
                          {formatCurrency(produit.prixUnite)}
                        </TableCell>
                        <TableCell className="py-2 text-right tabular-nums font-semibold">
                          {formatCurrency(produit.valeurStock)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {sortedProduits.length > 0 && (
                  <TableFooter className="bg-gray-50">
                    <TableRow className="border-t font-semibold">
                      <TableCell
                        colSpan={showEntrepotColumn ? 6 : 5}
                        className="text-right text-emerald-700 text-lg"
                      >
                        Valeur du stock :
                      </TableCell>
                      <TableCell className="text-right text-emerald-700 text-lg">
                        {formatCurrency(valeurGlobale)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => setCurrentStep(1)}
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
            {sortedProduits.length > 0 && (
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
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport (Entrée)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}
