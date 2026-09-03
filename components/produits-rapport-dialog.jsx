"use client";

import Spinner from "@/components/customUi/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { entrepotBadgeClass } from "@/lib/entrepot-badge";
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  FileText,
  Printer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatQty(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

function MultiSelect({
  label,
  items,
  selectedIds,
  onChange,
  allLabel,
  placeholder,
  idKey = "id",
  nameKey,
}) {
  const allIds = items.map(item => item[idKey]);
  const allSelected =
    allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

  const toggleAll = checked => {
    onChange(checked ? allIds : []);
  };

  const toggleOne = (id, checked) => {
    if (checked) {
      onChange([...new Set([...selectedIds, id])]);
    } else {
      onChange(selectedIds.filter(selected => selected !== id));
    }
  };

  const selectedNames = items
    .filter(item => selectedIds.includes(item[idKey]))
    .map(item => item[nameKey]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-transparent min-h-10 h-auto"
          >
            <div className="flex flex-wrap gap-1">
              {selectedIds.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : allSelected ? (
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                >
                  {allLabel}
                </Badge>
              ) : (
                selectedNames.slice(0, 3).map(name => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                  >
                    {name}
                  </Badge>
                ))
              )}
              {!allSelected && selectedNames.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedNames.length - 3}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-3" align="start">
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id={`${label}-all`}
                  checked={allSelected}
                  onCheckedChange={checked => toggleAll(!!checked)}
                />
                <Label
                  htmlFor={`${label}-all`}
                  className="text-sm font-semibold cursor-pointer"
                >
                  {allLabel}
                </Label>
              </div>
              {items.map(item => {
                const id = item[idKey];
                const name = item[nameKey];
                const checkboxId = `${label}-${id}`;
                return (
                  <div key={id} className="flex items-center space-x-2">
                    <Checkbox
                      id={checkboxId}
                      checked={selectedIds.includes(id)}
                      onCheckedChange={checked => toggleOne(id, !!checked)}
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {name}
                    </Label>
                  </div>
                );
              })}
            </div>
        </PopoverContent>
      </Popover>
    </div>
  );
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

  const entrepots = entrepotsQuery.data || [];
  const categories = categoriesQuery.data || [];

  useEffect(() => {
    if (initialized) return;
    if (entrepotsQuery.isLoading || categoriesQuery.isLoading) return;
    setSelectedEntrepotIds(entrepots.map(e => e.id));
    setSelectedCategorieIds(categories.map(c => c.id));
    setInitialized(true);
  }, [
    entrepots,
    categories,
    initialized,
    entrepotsQuery.isLoading,
    categoriesQuery.isLoading,
  ]);

  const allEntrepotsSelected =
    entrepots.length > 0 &&
    entrepots.every(e => selectedEntrepotIds.includes(e.id));
  const allCategoriesSelected =
    categories.length > 0 &&
    categories.every(c => selectedCategorieIds.includes(c.id));

  const canSubmit =
    selectedEntrepotIds.length > 0 &&
    (selectedCategorieIds.length > 0 || categories.length === 0);

  const rapportQuery = useQuery({
    queryKey: [
      "produits-rapport",
      selectedEntrepotIds,
      selectedCategorieIds,
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
          Rapport de stock
        </DialogTitle>
        <DialogDescription>
          {currentStep === 1
            ? "Sélectionnez les entrepôts et les catégories à inclure dans le rapport."
            : ""}
        </DialogDescription>
      </DialogHeader>

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              label="Entrepôts"
              items={entrepots}
              selectedIds={selectedEntrepotIds}
              onChange={setSelectedEntrepotIds}
              allLabel="Tous les entrepôts"
              placeholder="Sélectionner les entrepôts"
              nameKey="nom"
            />
            <MultiSelect
              label="Catégories"
              items={categories}
              selectedIds={selectedCategorieIds}
              onChange={setSelectedCategorieIds}
              allLabel="Toutes les catégories"
              placeholder="Sélectionner les catégories"
              nameKey="categorie"
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
          Rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}
