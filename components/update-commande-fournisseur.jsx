"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, X, CalendarIcon, Pen } from "lucide-react";
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
import { AddButton } from "@/components/customUi/styledButton";
import { Label } from "@/components/ui/label";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import ComboBoxDevis from "@/components/comboBox-devis";
import { ProduitsSelection } from "@/components/produits-selection-CMDF";
import axios from "axios";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";

export default function UpdateCommandeFournisseur({ commande }) {
  const [open, setOpen] = useState(false);
  const [orderGroups, setOrderGroups] = useState([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [selectedDevis, setSelectedDevis] = useState({});

  const {
    setValue,
    watch,
    control,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { date: commande?.date } });
  const selectedDate = watch("date");

  const formatCommandeGroups = (groups) => {
    return groups.map((group) => ({
      id: group.id,
      devisNumber: group.devisNumero,
      items: group.produits.map((produit) => ({
        id: produit.produitId,
        quantite: produit.quantite,
        designation: produit.produit.designation,
        prixUnite: produit.prixUnite,
        uniqueKey: `${produit.produitId}-${crypto.randomUUID()}`,
      })),
    }));
  };

  //Initialisation
  useEffect(() => {
    setSelectedFournisseur(commande?.fournisseur);

    setOrderGroups(formatCommandeGroups(commande?.groups));
    // console.log("commande", commande);
   // console.log("commande groups", commande?.groups);
   // console.log("formatCommandeGroups", formatCommandeGroups(commande?.groups));
  }, [commande]);

  const generateCommandeNumber = () => {
    const numero = 0;
    return `CMDF-${numero + 1}`;
  };
  // Ajout d'un groupe de commande
  const addOrderGroup = useCallback(() => {
    const newGroup = {
      id: crypto.randomUUID(), // Génération d'un ID unique
      items: [],
      devisNumber: null,
      clientName: null,
      clientId: null,
    };
    setOrderGroups((prev) => [...prev, newGroup]);
  }, []);

  // modifier le numero de commande d'un groupe
  const updateDevisNumberOfGroup = useCallback(
    (groupId, devisNumber, clientName, clientId, numero, totalDevi) => {
      setOrderGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                devisNumber: devisNumber,
                clientName,
                clientId,
                numero,
                totalDevi,
              } // Met à jour la commande
            : group
        )
      );
    },
    []
  );
  // Suppression d'un groupe
  const removeOrderGroup = useCallback((groupId) => {
    setOrderGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedDevis((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
  }, []);

  // Gestion des articles
  const handleAddArticles = useCallback((groupId, newArticles) => {
    //console.log("newArticles", newArticles);
    //console.log("orderGroups", orderGroups);
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
  const handleDevisSelect = useCallback((groupId, devis) => {
    setSelectedDevis((prev) => ({
      ...prev,
      [groupId]: devis,
    }));
  }, []);

  const queryClient = useQueryClient();
  const updateCommande = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Modification de la commande...");
      try {
        const response = await axios.put("/api/achats-commandes", data);
        toast.success("Commande modifier avec succès!");
        return response.data;
      } catch (error) {
        toast.error("Échec de la modification ");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["commandeFournisseur"]);
      queryClient.invalidateQueries(["commandes"]);

      setOpen(false);
    },
  });

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
        onClick={() => setOpen(true)}
      >
        <Pen className="h-4 w-4" />
        <span className="sr-only">Modifier</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande fourniture</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-end mb-4">
            <div className="w-1/3 pr-2">
              <ComboBoxFournisseur
                fournisseur={commande?.fournisseur}
                setFournisseur={setSelectedFournisseur}
              />
            </div>
            <div className="w-1/3 px-2 space-y-2">
              <Label htmlFor="client" >Date : </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal hover:text-purple-600 hover:bg-white hover:border-2 hover:border-purple-500",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2" />
                    {selectedDate ? (
                      format(new Date(selectedDate), "PPP", { locale: fr })
                    ) : (
                      <span>Choisis une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Set to midnight UTC
                            const utcMidnight = new Date(
                              Date.UTC(
                                date.getFullYear(),
                                date.getMonth(),
                                date.getDate()
                              )
                            );
                            field.onChange(utcMidnight);
                          }
                        }}
                        initialFocus
                      />
                    )}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-1/3 pl-2">
              <div className="col-span-2 grid gap-3">
                <Label htmlFor="statut" className="text-left text-black">
                  Commande numéro :
                </Label>
                <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                  {commande?.numero}
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
                      <ComboBoxDevis
                        onClick={() => console.log(group.id)}
                        onSelect={(devis) => {
                          handleDevisSelect(group.id, devis);
                          updateDevisNumberOfGroup(
                            group.id,
                            devis.numero,
                            devis.client.nom,
                            devis.clientId,
                            `CMD-${devis?.numero?.slice(4, 13)}`,
                            devis.total
                          );
                        }}
                        setSelectedDevis={(devis) =>
                          setSelectedDevis((prev) => ({
                            ...prev,
                            [group.id]: devis,
                          }))
                        }
                        Devisnumero={group.devisNumber}
                      />
                    </div>
                    <div className="w-1/2 pr-2">
                      <div className="col-span-2 grid gap-3">
                        <Label className="text-left text-black">Client :</Label>
                        <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                          {selectedDevis[group.id]?.client?.nom ||
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
                            <TableHead>Prix unitaire</TableHead>
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
                              <TableCell>
                                <Input
                                  value={item.prixUnite}
                                  onChange={(e) =>
                                    handleItemChange(
                                      group.id,
                                      item.uniqueKey,
                                      "prixUnite",
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

          <div className="w-fit">
            <AddButton
              type="button"
              onClick={addOrderGroup}
              title="Ajouter un groupe"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
              onClick={() => {
                const Data = {
                  id: commande?.id,
                  date: selectedDate,
                  numero: commande?.numero,
                  fournisseurId: selectedFournisseur.id,
                  orderGroups,
                };
                console.log("Data to submit:", Data);
                updateCommande.mutate(Data);
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
