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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Copy, Trash2 } from "lucide-react";
import { customAlphabet } from "nanoid";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/functions";

export default function CreateFactureFromVersementDialog({
  versement,
  open,
  onOpenChange,
}) {
  const [date, setDate] = useState(null);
  const [numero, setNumero] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems] = useState([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const generateUniqueKey = () => {
    const digits = "1234567890";
    const nanoidCustom = customAlphabet(digits, 6);
    return nanoidCustom();
  };

  const handleItemChange = (key, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (deletedItem) => {
    setItems((prev) => prev.filter((item) => item.key !== deletedItem.key));
  };

  const validateFloat = (value) => {
    if (typeof value === "string") {
      value = value.replace(",", ".");
      value = value.trim();
    }
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return false;
    }
    return parsed;
  };

  const handleAddArticles = (newArticles) => {
    setItems((prevItems) => [
      ...prevItems,
      ...newArticles.map((article) => ({
        ...article,
        key: article.key || generateUniqueKey(),
      })),
    ]);
  };

  const total = () => {
    return parseFloat(
      items
        .reduce((acc, item) => {
          const total = item.quantite * item.prixUnite;
          return acc + (isNaN(total) ? 0 : total);
        }, 0)
        .toFixed(2)
    );
  };

  useEffect(() => {
    if (open && versement) {
      // Reset form when dialog opens
      setDate(new Date());
      setNumero(null);
      setItems([]);
      setSelectedClient(null);
      setIsArticleDialogOpen(false);
    }
  }, [open, versement]);

  const createFacture = useMutation({
    mutationFn: async () => {
      if (!selectedClient) {
        throw new Error("Client non trouvé");
      }

      if (items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      const totalMontant = total();

      if (totalMontant > versement.montant) {
        throw new Error(
          `Le total de la facture (${formatCurrency(totalMontant)}) ne peut pas dépasser le montant du versement (${formatCurrency(versement.montant)})`
        );
      }

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
        versementId: versement.id,
      };

      const loadingToast = toast.loading("Création de la facture...");
      try {
        const response = await axios.post("/api/factures", data);
        toast.success("Facture créée avec succès");
        return response.data;
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
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
  };

  const unites = ["U", "m²", "m"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Créer une facture à partir du versement
            </DialogTitle>
            <DialogDescription>
              Créer une facture client liée à ce versement vers le compte professionnel
            </DialogDescription>
          </DialogHeader>

          {versement && (
            <div className="space-y-6 py-4">
              {/* Informations du versement */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Informations du versement
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Montant du versement :</span>
                    <span className="ml-2 font-semibold text-green-700">
                      {formatCurrency(versement.montant)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date :</span>
                    <span className="ml-2 font-semibold">
                      {new Date(versement.date).toLocaleDateString()}
                    </span>
                  </div>
                  {versement.reference && (
                    <div>
                      <span className="text-gray-600">Référence :</span>
                      <span className="ml-2 font-semibold">
                        {versement.reference}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Compte source :</span>
                    <span className="ml-2 font-semibold">
                      {versement.sourceCompte.compte}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-600">Total de la facture :</span>
                  <span className="ml-2 font-semibold text-lg">
                    {formatCurrency(total())}
                  </span>
                  {total() > versement.montant && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Le total dépasse le montant du versement
                    </p>
                  )}
                  {total() <= versement.montant && total() > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Montant disponible : {formatCurrency(versement.montant - total())}
                    </p>
                  )}
                </div>
              </div>

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

              {/* Items Table */}
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
                                {!isNaN(item.quantite * item.prixUnite)
                                  ? (item.quantite * item.prixUnite).toFixed(2)
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
                                      const origineItem = items.find(
                                        (i) => i.key === item.key
                                      );
                                      setItems((prevItems) => [
                                        ...prevItems,
                                        {
                                          ...item,
                                          designation: origineItem.designation,
                                          quantite: origineItem.quantite,
                                          prixUnite: origineItem.prixUnite,
                                          length: origineItem.length,
                                          width: origineItem.width,
                                          height: origineItem.height,
                                          unite: origineItem.unite,
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
              </div>
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
          )}

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
                  if (!numero || numero.trim() === "") {
                    toast.error("Veuillez saisir un numéro de facture");
                    return;
                  }
                  if (items.length === 0) {
                    toast.error("Veuillez ajouter au moins un article");
                    return;
                  }
                  const totalMontant = total();
                  if (totalMontant > versement.montant) {
                    toast.error(
                      `Le total de la facture ne peut pas dépasser ${formatCurrency(versement.montant)}`
                    );
                    return;
                  }
                  createFacture.mutate();
                }}
                disabled={
                  createFacture.isPending ||
                  !numero ||
                  numero.trim() === "" ||
                  items.length === 0 ||
                  !selectedClient ||
                  total() > versement.montant
                }
              >
                {createFacture.isPending ? "En cours..." : "Créer la facture"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
