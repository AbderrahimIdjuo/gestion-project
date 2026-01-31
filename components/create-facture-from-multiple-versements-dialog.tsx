"use client";

import { ArticleSelectionDialog } from "@/components/articls-selection-dialog";
import ComboBoxClients from "@/components/comboBox-clients";
import { AddButton } from "@/components/customUi/styledButton";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Copy, Trash2, X } from "lucide-react";
import { customAlphabet } from "nanoid";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/functions";

type Versement = {
  id: string;
  montant: number;
  date: string;
  reference: string | null;
  note: string | null;
  sourceCompte: {
    compte: string;
  };
  affectationsVersement: {
    montant: number;
  }[];
};

type FactureItem = {
  key: string;
  designation?: string;
  quantite?: number;
  prixUnite?: number;
  unite?: string;
  height?: number;
  length?: number;
  width?: number;
  id?: string;
};

type CreateFactureFromMultipleVersementsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateFactureFromMultipleVersementsDialog({
  open,
  onOpenChange,
}: CreateFactureFromMultipleVersementsDialogProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [numero, setNumero] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<{ id: string } | null>(null);
  const [items, setItems] = useState<FactureItem[]>([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [selectedVersements, setSelectedVersements] = useState<Versement[]>([]);
  const [versementMontants, setVersementMontants] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  // Query pour récupérer les versements disponibles
  const versementsQuery = useQuery({
    queryKey: ["versements", "all"],
    queryFn: async () => {
      const response = await axios.get("/api/versements", {
        params: {
          page: 1,
          limit: 1000, // Récupérer tous les versements
        },
      });
      return response.data.versements || [];
    },
  });

  const generateUniqueKey = () => {
    const digits = "1234567890";
    const nanoidCustom = customAlphabet(digits, 6);
    return nanoidCustom();
  };

  const handleItemChange = (key: string, field: string, value: string | number | false) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (deletedItem: { key: string }) => {
    setItems((prev) => prev.filter((item) => item.key !== deletedItem.key));
  };

  const validateFloat = (value: string | number): number | false => {
    const str = typeof value === "string" ? value.replace(",", ".").trim() : String(value);
    const parsed = parseFloat(str);
    if (isNaN(parsed)) {
      return false;
    }
    return parsed;
  };

  const handleAddArticles = (newArticles: FactureItem[]) => {
    setItems((prevItems) => [
      ...prevItems,
      ...newArticles.map((article: FactureItem) => ({
        ...article,
        key: typeof article.key === "string" ? article.key : generateUniqueKey(),
      })),
    ]);
  };

  const total = () => {
    return parseFloat(
      items
        .reduce((acc, item) => {
          const total = (item.quantite ?? 0) * (item.prixUnite ?? 0);
          return acc + (isNaN(total) ? 0 : total);
        }, 0)
        .toFixed(2)
    );
  };

  // Calculer le montant disponible pour un versement
  const getMontantDisponible = (versement: Versement) => {
    const montantAffecte = versement.affectationsVersement?.reduce(
      (sum, aff) => sum + aff.montant,
      0
    ) || 0;
    return versement.montant - montantAffecte;
  };

  // Calculer le statut d'un versement
  const getVersementStatut = (versement: Versement) => {
    const montantDisponible = getMontantDisponible(versement);
    if (montantDisponible <= 0) return "complet";
    if (montantDisponible < versement.montant) return "en_partie";
    return "sans_facture";
  };

  const handleVersementSelect = (versementId: string) => {
    const versement = versementsQuery.data?.find((v: Versement) => v.id === versementId);
    if (!versement) return;

    if (!selectedVersements.find((v) => v.id === versementId)) {
      setSelectedVersements([...selectedVersements, versement]);
      setVersementMontants({
        ...versementMontants,
        [versementId]: getMontantDisponible(versement),
      });
    }
  };

  const removeVersement = (versementId: string) => {
    setSelectedVersements(selectedVersements.filter((v) => v.id !== versementId));
    const newMontants = { ...versementMontants };
    delete newMontants[versementId];
    setVersementMontants(newMontants);
  };

  const updateVersementMontant = (versementId: string, montant: number) => {
    const versement = selectedVersements.find((v) => v.id === versementId);
    if (!versement) return;

    const montantDisponible = getMontantDisponible(versement);
    if (montant < 0) montant = 0;
    if (montant > montantDisponible) montant = montantDisponible;

    setVersementMontants({
      ...versementMontants,
      [versementId]: montant,
    });
  };

  const totalMontantVersements = () => {
    return Object.values(versementMontants).reduce((sum, montant) => sum + montant, 0);
  };

  useEffect(() => {
    if (open) {
      setDate(new Date());
      setNumero(null);
      setItems([]);
      setSelectedClient(null);
      setIsArticleDialogOpen(false);
      setSelectedVersements([]);
      setVersementMontants({});
    }
  }, [open]);

  const createFacture = useMutation({
    mutationFn: async () => {
      if (!selectedClient) {
        throw new Error("Client non trouvé");
      }

      if (items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      if (selectedVersements.length === 0) {
        throw new Error("Veuillez sélectionner au moins un versement");
      }

      const totalMontant = total();
      const totalVersements = totalMontantVersements();

      if (totalMontant > totalVersements) {
        throw new Error(
          `Le total de la facture (${formatCurrency(totalMontant)}) ne peut pas dépasser le total des montants des versements (${formatCurrency(totalVersements)})`
        );
      }

      const versements = selectedVersements.map((v) => ({
        versementId: v.id,
        montant: versementMontants[v.id] || 0,
      }));

      const data = {
        date: date || new Date(),
        numero,
        articls: items.map((item) => ({
          designation: item.designation,
          quantite: item.quantite || 1,
          prixUnite: item.prixUnite || 0,
          unite: item.unite || "U",
          height: item.height || 0,
          length: item.length || 0,
          width: item.width || 0,
        })),
        total: totalMontant,
        clientId: selectedClient.id,
        versements,
      };

      const loadingToast = toast.loading("Création de la facture...");
      try {
        const response = await axios.post("/api/factures", data);
        toast.success("Facture créée avec succès");
        return response.data;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Échec de la création de la facture!"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      queryClient.invalidateQueries({ queryKey: ["versements"] });
      onOpenChange(false);
      resetDialog();
    },
  });

  const resetDialog = () => {
    setDate(null);
    setNumero(null);
    setItems([]);
    setSelectedClient(null);
    setIsArticleDialogOpen(false);
    setSelectedVersements([]);
    setVersementMontants({});
  };

  const unites = ["U", "m²", "m"];

  // Filtrer les versements disponibles (exclure ceux qui sont complètement affectés)
  const availableVersements = versementsQuery.data?.filter(
    (v: Versement) => getMontantDisponible(v) > 0
  ) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Créer une facture à partir de plusieurs versements
            </DialogTitle>
            <DialogDescription>
              Créer une facture client liée à plusieurs versements vers le compte professionnel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <ComboBoxClients
                  client={selectedClient}
                  setClient={setSelectedClient}
                />
              </div>
              <div className="w-full space-y-2">
                <Label className="text-sm font-medium block pt-1">
                  Numéro *
                </Label>
                <Input
                  id="numero"
                  value={numero || ""}
                  onChange={(e) => {
                    setNumero(e.target.value);
                  }}
                  className="col-span-3 focus:!ring-purple-500"
                  spellCheck={false}
                  placeholder="Ex: FACT-2024-001"
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="date">Date *</Label>
                <CustomDatePicker date={date} onDateChange={setDate} />
              </div>
            </div>

            {/* Sélection des versements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Versements sélectionnés</Label>
                <Select
                  onValueChange={handleVersementSelect}
                  value=""
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Ajouter un versement" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVersements.map((versement: Versement) => {
                      const montantDisponible = getMontantDisponible(versement);
                      const statut = getVersementStatut(versement);
                      return (
                        <SelectItem
                          key={versement.id}
                          value={versement.id}
                          disabled={selectedVersements.some((v) => v.id === versement.id)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {versement.reference || "Sans référence"} - {formatCurrency(montantDisponible)} disponible
                            </span>
                            <span
                              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                statut === "complet"
                                  ? "bg-green-100 text-green-700"
                                  : statut === "en_partie"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {statut === "complet" ? "Complet" : statut === "en_partie" ? "En partie" : "Sans facture"}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedVersements.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Compte source</TableHead>
                        <TableHead>Montant disponible</TableHead>
                        <TableHead>Montant à affecter</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedVersements.map((versement) => {
                        const montantDisponible = getMontantDisponible(versement);
                        const montantAffecte = versementMontants[versement.id] || 0;
                        return (
                          <TableRow key={versement.id}>
                            <TableCell>
                              {versement.reference || "Sans référence"}
                            </TableCell>
                            <TableCell>
                              {new Date(versement.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{versement.sourceCompte.compte}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-700">
                                {formatCurrency(montantDisponible)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={montantDisponible}
                                value={montantAffecte}
                                onChange={(e) => {
                                  updateVersementMontant(
                                    versement.id,
                                    parseFloat(e.target.value) || 0
                                  );
                                }}
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVersement(versement.id)}
                                className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-semibold">
                          Total des montants affectés :
                        </TableCell>
                        <TableCell className="font-semibold text-lg">
                          {formatCurrency(totalMontantVersements())}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </div>

            {/* Articles */}
            <div className="space-y-4">
              {items.length > 0 && (
                <>
                  <div className="overflow-hidden border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Articls</TableHead>
                          <TableHead className="w-[10%] text-center">
                            Hauteur
                          </TableHead>
                          <TableHead className="w-[10%] text-center">
                            Longueur
                          </TableHead>
                          <TableHead className="w-[10%] text-center">
                            Largeur
                          </TableHead>
                          <TableHead className="w-[10%] text-center">
                            Unité
                          </TableHead>
                          <TableHead>Quantité</TableHead>
                          <TableHead>Prix d&apos;unité</TableHead>
                          <TableHead className="text-left">Montant</TableHead>
                          <TableHead className="text-right pr-3">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.key}>
                            <TableCell>
                              <Input
                                spellCheck="false"
                                defaultValue={item.designation}
                                onChange={(e) => {
                                  handleItemChange(
                                    item.key,
                                    "designation",
                                    e.target.value
                                  );
                                }}
                                className="focus:!ring-purple-500 w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                defaultValue={item.height}
                                onChange={(e) => {
                                  handleItemChange(
                                    item.key,
                                    "height",
                                    validateFloat(e.target.value)
                                  );
                                }}
                                className="focus:!ring-purple-500 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                defaultValue={item.length}
                                onChange={(e) => {
                                  handleItemChange(
                                    item.key,
                                    "length",
                                    validateFloat(e.target.value)
                                  );
                                }}
                                className="focus:!ring-purple-500 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                defaultValue={item.width}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.key,
                                    "width",
                                    validateFloat(e.target.value)
                                  )
                                }
                                className="focus:!ring-purple-500 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                defaultValue={item.unite || "U"}
                                name="unites"
                                onValueChange={(value) =>
                                  handleItemChange(item.key, "unite", value)
                                }
                              >
                                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                                  <SelectValue placeholder="Sélectionner une unité" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unites.map((unite) => (
                                    <SelectItem key={unite} value={unite}>
                                      {unite}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                defaultValue={item.quantite}
                                type="number"
                                min={1}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.key,
                                    "quantite",
                                    Number(e.target.value)
                                  )
                                }
                                className="focus:!ring-purple-500 w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                defaultValue={item.prixUnite}
                                onChange={(e) => {
                                  handleItemChange(
                                    item.key,
                                    "prixUnite",
                                    validateFloat(e.target.value)
                                  );
                                }}
                                className="focus:!ring-purple-500 w-24"
                              />
                            </TableCell>
                            <TableCell>
                              {!isNaN((item.quantite ?? 0) * (item.prixUnite ?? 0))
                                ? ((item.quantite ?? 0) * (item.prixUnite ?? 0)).toFixed(2)
                                : 0}{" "}
                              DH
                            </TableCell>
                            <TableCell className="pr-3">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item)}
                                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const orig = items.find(
                                      (i) => i.key === item.key
                                    );
                                    if (!orig) return;
                                    setItems((prevItems) => [
                                      ...prevItems,
                                      {
                                        ...item,
                                        designation: orig.designation,
                                        quantite: orig.quantite,
                                        prixUnite: orig.prixUnite,
                                        length: orig.length,
                                        width: orig.width,
                                        height: orig.height,
                                        unite: orig.unite,
                                        key: generateUniqueKey(),
                                      },
                                    ]);
                                  }}
                                  className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-right text-lg pr-3"
                          >
                            Total :
                          </TableCell>
                          <TableCell colSpan={2} className="text-left text-lg">
                            {total()} DH
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </>
              )}
              <div className="w-full flex items-center justify-start">
                <AddButton
                  type="button"
                  onClick={() => setIsArticleDialogOpen(true)}
                  title="Ajouter des articls"
                />
              </div>

              <ArticleSelectionDialog
                open={isArticleDialogOpen}
                onOpenChange={setIsArticleDialogOpen}
                onArticlesAdd={handleAddArticles}
              />
            </div>

            {/* Résumé */}
            {selectedVersements.length > 0 && items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total de la facture :</span>
                    <span className="ml-2 font-semibold text-lg">
                      {formatCurrency(total())}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total des versements :</span>
                    <span className="ml-2 font-semibold text-lg">
                      {formatCurrency(totalMontantVersements())}
                    </span>
                  </div>
                  {total() > totalMontantVersements() && (
                    <div className="col-span-2">
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Le total de la facture dépasse le total des montants des versements
                      </p>
                    </div>
                  )}
                  {total() <= totalMontantVersements() && total() > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Montant disponible : {formatCurrency(totalMontantVersements() - total())}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                className="rounded-full"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetDialog();
                }}
              >
                Annuler
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  if (!selectedClient) {
                    toast.error("Veuillez sélectionner un client");
                    return;
                  }
                  if (!numero || (typeof numero === "string" && numero.trim() === "")) {
                    toast.error("Veuillez saisir un numéro de facture");
                    return;
                  }
                  if (items.length === 0) {
                    toast.error("Veuillez ajouter au moins un article");
                    return;
                  }
                  if (selectedVersements.length === 0) {
                    toast.error("Veuillez sélectionner au moins un versement");
                    return;
                  }
                  const totalMontant = total();
                  const totalVersements = totalMontantVersements();
                  if (totalMontant > totalVersements) {
                    toast.error(
                      `Le total de la facture ne peut pas dépasser ${formatCurrency(totalVersements)}`
                    );
                    return;
                  }
                  createFacture.mutate();
                }}
                disabled={
                  (createFacture as { isLoading?: boolean }).isLoading ||
                  !numero ||
                  (typeof numero === "string" && numero.trim() === "") ||
                  items.length === 0 ||
                  selectedVersements.length === 0 ||
                  !selectedClient ||
                  total() > totalMontantVersements()
                }
              >
                {(createFacture as { isLoading?: boolean }).isLoading ? "En cours..." : "Créer la facture"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

