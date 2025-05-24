"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { customAlphabet } from "nanoid";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import ComboBoxCommandes from "@/components/comboBox-CMD";
import { ProduitsSelection } from "@/components/produits-selection-CMDF";
import axios from "axios";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function AddCommandeFournisseur() {
  const [open, setOpen] = useState(false);
  const [orderGroups, setOrderGroups] = useState([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [selectedCommandes, setSelectedCommandes] = useState({});
  const [commande, setCommande] = useState(null);
  const [groupId, setGroupeId] = useState(null);

  const {
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  // Génération de numéro de commande mémoïsée
  const generateCommandeNumber = useCallback(() => {
    const digits = "1234567890";
    const nanoidCustom = customAlphabet(digits, 8);
    return `CMDF-${nanoidCustom()}`;
  }, []);

  // Ajout d'un groupe de commande
  const addOrderGroup = useCallback(() => {
    const newGroup = {
      id: crypto.randomUUID(), // Génération d'un ID unique
      items: [],
      commande: null,
      clientName: null,
    };
    setOrderGroups((prev) => [...prev, newGroup]);
  }, []);

  // modifier le numero de commande d'un groupe
  const updateCommandeNumberOfGroup = useCallback(
    (groupId, commandeNumber, clientName) => {
      setOrderGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId
            ? { ...group, commande: commandeNumber, clientName: clientName } // Met à jour la commande
            : group
        )
      );
    },
    []
  );
  // Suppression d'un groupe
  const removeOrderGroup = useCallback((groupId) => {
    setOrderGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedCommandes((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
  }, []);

  // Gestion des articles
  const handleAddArticles = useCallback((groupId, newArticles) => {
    setOrderGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const existingIds = new Set(group.items.map((item) => item.id));
          const filteredArticles = newArticles.filter(
            (article) => !existingIds.has(article.id)
          );

          return {
            ...group,
            items: [
              ...group.items,
              ...filteredArticles.map((article) => ({
                ...article,
                uniqueKey: `${article.id}-${crypto.randomUUID()}`, // Clé vraiment unique
              })),
            ],
          };
        }
        return group;
      })
    );
  }, []);

  // Suppression d'un article
  const removeItem = useCallback((groupId, itemId) => {
    setOrderGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: group.items.filter((item) => item.uniqueKey !== itemId),
          };
        }
        return group;
      })
    );
  }, []);

  // Mise à jour d'un article
  const handleItemChange = useCallback((groupId, itemId, field, value) => {
    setOrderGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: group.items.map((item) =>
              item.uniqueKey === itemId
                ? { ...item, [field]: Number(value) || 0 }
                : item
            ),
          };
        }
        return group;
      })
    );
  }, []);

  // Mise à jour de la commande sélectionnée
  const handleCommandeSelect = useCallback((groupId, commande) => {
    setSelectedCommandes((prev) => ({
      ...prev,
      [groupId]: commande,
    }));
    console.log("selected commandes : ", selectedCommandes);
  }, []);

  // Initialisation
  useEffect(() => {
    if (open) {
      setValue("numero", generateCommandeNumber());
      setOrderGroups([]);
      setSelectedFournisseur(null);
      setSelectedCommandes({});
    }
  }, [open, setValue, generateCommandeNumber]);
  const queryClient = useQueryClient();
  const ajouterCommande = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout de la commande...");
      try {
        const response = await axios.post("/api/achats-commandes", data);
        toast.success("Commande ajouté avec succès!");
        return response.data;
      } catch (error) {
        toast.error("Échec de l'ajout ");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["commandeFournisseur"]);
      reset();
    },
  });

  return (
    <div>
      <Button
        className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une commande
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande fourniture</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="w-1/2 pr-2">
              <ComboBoxFournisseur setFournisseur={setSelectedFournisseur} />
            </div>
            <div className="w-1/2 pl-2">
              <div className="col-span-2 grid gap-3">
                <Label htmlFor="statut" className="text-left text-black">
                  Commande numéro :
                </Label>
                <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                  {watch("numero")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {orderGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Groupe{" "}
                      {orderGroups.findIndex((g) => g.id === group.id) + 1}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrderGroup(group.id)}
                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="w-1/2 pr-2">
                      <ComboBoxCommandes
                        onClick={() => console.log(group.id)}
                        onSelect={(commande) => {
                          handleCommandeSelect(group.id, commande);
                          updateCommandeNumberOfGroup(
                            group.id,
                            commande.numero,
                            commande.client.nom
                          );
                        }}
                      />
                    </div>
                    <div className="w-1/2 pr-2">
                      <div className="col-span-2 grid gap-3">
                        <Label className="text-left text-black">Client :</Label>
                        <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                          {selectedCommandes[group.id]?.client?.nom ||
                            "Non sélectionné"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex justify-end items-center gap-3 mb-4">
                    <ProduitsSelection
                      onArticlesAdd={(articles) =>
                        handleAddArticles(group.id, articles)
                      }
                    />
                  </div>

                  {group.items.length > 0 && (
                    <div className="overflow-hidden border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60%]">Produits</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((item) => (
                            <TableRow key={item.uniqueKey}>
                              <TableCell>
                                <span className="text-md">
                                  {item.designation}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.quantite}
                                  onChange={(e) =>
                                    handleItemChange(
                                      group.id,
                                      item.uniqueKey,
                                      "quantite",
                                      e.target.value
                                    )
                                  }
                                  className="focus:!ring-purple-500 w-20"
                                  type="number"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItem(group.id, item.uniqueKey)
                                  }
                                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={addOrderGroup}
            className="mb-4 w-fit bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold rounded-full"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un groupe de produits
          </Button>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                console.log("Data", {
                  numero: watch("numero"),
                  fournisseurId: selectedFournisseur.id,
                  selectedFournisseur,
                  orderGroups,
                });
                const Data = {
                  numero: watch("numero"),
                  fournisseurId: selectedFournisseur.id,
                  orderGroups,
                };
                ajouterCommande.mutate(Data);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
