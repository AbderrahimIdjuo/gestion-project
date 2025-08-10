"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArticleSelectionDialog } from "@/components/articls-selection-dialog";
import { Trash2, Copy, Plus } from "lucide-react";
import { customAlphabet } from "nanoid";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { AddButton } from "@/components/customUi/styledButton";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ComboBoxClients from "@/components/comboBox-clients";

export default function CreateFactureDialog() {
  const [items, setItems] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [date, setDate] = useState(null);
  const [numero, setNumero] = useState(null);
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
  const createFacture = useMutation({
    mutationFn: async () => {
      const data = {
        date: date || new Date(),
        numero,
        articls: items,
        total: total(),
        clientId: client.id,
      };

      console.log("Facture data : ", data);
      const loadingToast = toast.loading("Opération en cours...");
      try {
        const response = await axios.post("/api/factures", data);
        toast.success("Opération éffectué avec succès");
        return response.data;
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["factures"]);
      setIsDialogOpen(false);
      resetDialog();
    },
  });
  const removeItem = (deletedItem) => {
    console.log("deletedItem", deletedItem);
    console.log("items", items);
    setItems((prev) => prev.filter((item) => item.key !== deletedItem.key));
  };
  const unites = ["U", "m²", "m"];
  const resetDialog = () => {
    setItems([]);
    setClient(null);
    setDate(null);
    setNumero(null);
    setIsArticleDialogOpen(false);
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
  const validateFloat = (value) => {
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }
    // const number = parseFloat(value);
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      // throw new Error("The value must be a float.");
      return false;
    }
    return parsed;
  };
  const handleAddArticles = (newArticles) => {
    setItems((prevItems) => [
      ...prevItems,
      ...newArticles.map((article) => ({
        ...article,
      })),
    ]);
  };
  return (
    <>
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une facture
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader>
            <DialogTitle>Créer une facture</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <ComboBoxClients setClient={setClient} client={client} />
              </div>
              <div className="w-full space-y-2">
                <Label className="text-sm font-medium block pt-1">Numéro</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => {
                    setNumero(e.target.value);
                  }}
                  className="col-span-3 focus:!ring-purple-500 "
                  spellCheck={false}
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="client">Date : </Label>
                <CustomDatePicker date={date} onDateChange={setDate} />
              </div>
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
                              className="focus:!ring-purple-500 w-24 "
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
                                <SelectValue placeholder="Séléctionner un statut" />
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
                                type="button" // <- important pour ne PAS soumettre
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const origineItem = items.find(
                                    (i) => i.key === item.key
                                  );
                                  //   console.log("origineItem", origineItem);

                                  setItems((prevItems) => [
                                    ...prevItems,
                                    {
                                      ...item,
                                      designation: origineItem.designation,
                                      quantite: origineItem.quantite,
                                      prixUnite: origineItem.prixUnite,
                                      length: origineItem.length,
                                      width: origineItem.width,
                                      unite: origineItem.unite,
                                      key: generateUniqueKey(),
                                    },
                                  ]);
                                  //  console.log("Cloned item");
                                  // console.log("items", items);
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
          <DialogFooter>
            <div className="flex  gap-2">
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  createFacture.mutate();
                }}
              >
                Enregisrer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
