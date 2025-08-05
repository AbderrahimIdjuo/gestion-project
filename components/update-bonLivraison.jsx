"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Trash2, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComboBoxDevis from "@/components/comboBox-devis";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArticleSelectionDialog } from "@/components/produits-selection-NouveauBL";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import { ProduitsSelection } from "@/components/produits-selection-CMDF";
import { Switch } from "@/components/ui/switch";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { AddButton } from "@/components/customUi/styledButton";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function UpdateBonLivraison({ isOpen, onClose, bonLivraison }) {
  const [date, setDate] = useState(null);
  const [reference, setReference] = useState("");
  const [type, setType] = useState();
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [bLGroups, setBLGroups] = useState([]);
  const [selectedDevis, setSelectedDevis] = useState({});
  const queryClient = useQueryClient();
  const [groupModes, setGroupModes] = useState({}); // Track mode for each group (devis/charge)

  const formatCommandeGroups = (groups) => {
    return groups?.map((group) => ({
      id: group.id,
      devisNumber: group.devisNumero,
      charge: group.charge,
      items: group.produits?.map((produit) => ({
        id: produit.id,
        produitId: produit.produitId,
        quantite: produit.quantite,
        designation: produit.produit.designation,
        prixUnite: produit.prixUnite,
        uniqueKey: `${produit.produitId}-${crypto.randomUUID()}`,
      })),
    }));
  };
  // Toggle group mode between devis and charge
  const toggleGroupMode = useCallback((groupId, isDevis) => {
    setGroupModes((prev) => ({ ...prev, [groupId]: isDevis }));

    if (isDevis) {
      // Switching to devis mode - clear charge
      setBLGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId ? { ...group, charge: null } : group
        )
      );
    } else {
      // Switching to charge mode - clear all devis-related data
      setBLGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                charge: null, // Also clear charge to reset
                devisNumber: null,
                clientName: null,
                clientId: null,
                numero: null,
                totalDevi: null,
              }
            : group
        )
      );

      // Clear the selected devis for this group
      setSelectedDevis((prev) => {
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      });
    }
  }, []);
useEffect(() => {
  if (bonLivraison) {
    if (typeof bonLivraison?.date === "string") {
      const [day, month, year] = bonLivraison?.date?.split("-");
      const isoDate = `${year}-${month}-${day}`;
      const dateObj = new Date(isoDate);
      setDate(dateObj);
    }

    setReference(bonLivraison?.reference);
    setSelectedFournisseur({
      id: bonLivraison?.fournisseurId,
      nom: bonLivraison?.fournisseur,
    });
    setType(bonLivraison?.type);

    const formattedGroups = formatCommandeGroups(bonLivraison?.groups);
    setBLGroups(formattedGroups);

    // 👉 Initialisation de groupModes
    const initialModes = {};
    formattedGroups.forEach((group) => {
      initialModes[group.id] = group.charge === null;
    });
    setGroupModes(initialModes);
  }
}, [bonLivraison]);


  const total = () => {
    const produits = bLGroups.flatMap((group) => group.items);
    return produits.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const sousTotal = (group) => {
    return group.items
      .reduce((acc, produit) => {
        return acc + produit.quantite * produit.prixUnite;
      }, 0)
      .toFixed(2);
  };
  const statutPaiement = () => {
    if (
      bonLivraison?.statutPaiement === "paye" &&
      bonLivraison?.totalPaye < parseFloat(total())
    ) {
      return "enPartie";
    } else bonLivraison?.statutPaiement;
  };
  const handleUpdateBL = useMutation({
    mutationFn: async () => {
      const data = {
        id: bonLivraison?.id,
        date,
        reference,
        fournisseurId: selectedFournisseur.id,
        total: total().toFixed(2),
        type,
        bLGroups,
        statutPaiement: statutPaiement(),
      };
      console.log("data", data);

      const loadingToast = toast.loading("Opération en cours ...");
      try {
        await axios.put("/api/bonLivraison", data);
        toast.success("Opération éffectué avec succès");
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      onClose();
     queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
    },
  });

  // Ajout d'un groupe de BL
  const addBlGroup = useCallback(() => {
    const newGroupId = crypto.randomUUID();
    const newGroup = {
      id: newGroupId, // Génération d'un ID unique
      items: [],
      devisNumber: null,
      clientName: null,
      clientId: null,
      charge: null,
    };
    setBLGroups((prev) => [...prev, newGroup]);
    // Initialize group mode as devis by default
    setGroupModes((prev) => ({ ...prev, [newGroupId]: true }));
  }, []);
  // modifier le numero de commande d'un groupe
  const updateDevisNumberOfGroup = useCallback(
    (groupId, devisNumber, clientName, clientId, numero, totalDevi) => {
      setBLGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                devisNumber,
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

  const updateChargeOfGroup = useCallback((groupId, newCharge) => {
    setBLGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              charge: newCharge,
              devisNumber: null,
              clientName: null,
              clientId: null,
              numero: null,
              totalDevi: null,
            }
          : group
      )
    );

    setSelectedDevis((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
  }, []);

  // Suppression d'un groupe
  const removeBlGroup = useCallback((groupId) => {
    setBLGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedDevis((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
    setGroupModes((prev) => {
      const newState = { ...prev };
      delete newState[groupId];
      return newState;
    });
  }, []);

  // Gestion des articles
  const handleAddArticles = useCallback((groupId, newArticles) => {
    setBLGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: [
              ...group.items,
              ...newArticles.map((article) => {
                const uuid = crypto.randomUUID();
                return {
                  ...article,
                  id: uuid, // assign a unique UUID as the ID
                  produitId: article.id,
                  uniqueKey: `${article.id}-${uuid}`, // ensure key is still unique and traceable
                };
              }),
            ],
          };
        }
        return group;
      })
    );
  }, []);

  // Suppression d'un article
  const removeItem = useCallback((groupId, itemId) => {
    setBLGroups((prev) =>
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
    setBLGroups((prev) =>
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

  const handlCopyItem = (groupId, item) => {
    setBLGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: [
              ...group.items,
              {
                ...item,
                designation: item.designation,
                quantite: item.quantite,
                prixUnite: item.prixUnite,
                id: crypto.randomUUID(),
                produitId: item.produitId,
                uniqueKey: `${item.id}-${crypto.randomUUID()}`, // Clé vraiment unique,
              },
            ],
          };
        }
        return group;
      })
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
  const charges = useQuery({
    queryKey: ["charges"],
    queryFn: async () => {
      const response = await axios.get("/api/charges");
      return response.data.charges;
    },
  });
  return (
    <div className="">
      <div className="flex items-center justify-between">
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Modifier bon de livraison
              </DialogTitle>
              <DialogDescription>
                Vérifiez et modifiez les informations avant de créer le BL
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                <div className="w-full space-y-2">
                  <Label htmlFor="client">Date : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
                </div>
                <div className="w-full space-y-2">
                  <Label className="text-sm font-medium block pt-1">Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value)}
                  >
                    <SelectTrigger className="w-full col-span-3 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Séléctionnez ..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="achats">Achats</SelectItem>
                        <SelectItem value="retour">Retour</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-2">
                  <Label className="text-sm font-medium block pt-1">
                    Référence
                  </Label>
                  <Input
                    id="reference"
                    value={reference}
                    onChange={(e) => {
                      setReference(e.target.value);
                    }}
                    className="col-span-3 focus:!ring-purple-500 "
                    spellCheck={false}
                  />
                </div>
                <div className="w-full space-y-2">
                  <ComboBoxFournisseur
                    fournisseur={selectedFournisseur}
                    setFournisseur={setSelectedFournisseur}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-6 ">
              {bLGroups?.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Groupe{" "}
                        {bLGroups?.findIndex((g) => g.id === group.id) + 1}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlGroup(group.id)}
                        className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 ">
                      <Switch
                        id={`switch-${group.id}`}
                        checked={groupModes[group.id] || false}
                        onCheckedChange={(checked) =>
                          toggleGroupMode(group.id, checked)
                        }
                      />
                      <Label htmlFor={`switch-${group.id}`}>
                        {groupModes[group.id] ? "Devis" : "Charge"}
                      </Label>
                    </div>
                    {groupModes[group.id] ? (
                      <div className="flex justify-between items-center mt-2">
                        <div className="w-1/2 pr-2">
                          <ComboBoxDevis
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
                            <Label className="text-left text-black">
                              Client :
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-purple-50 h-[2.5rem]">
                              {selectedDevis[group.id]?.client?.nom ||
                                "Non sélectionné"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid w-[50%] items-center gap-2 mt-2">
                        <Label htmlFor="label">Label</Label>
                        <Select
                          defaultValue={group.charge}
                          value={group.charge || ""}
                          name="charge"
                          onValueChange={(value) => {
                            updateChargeOfGroup(group.id, value);
                          }}
                        >
                          <SelectTrigger className="col-span-3  bg-white focus:ring-purple-500">
                            <SelectValue placeholder="Séléctionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {charges.data?.map((element) => (
                              <SelectItem
                                key={element.id}
                                value={element.charge}
                              >
                                <div className="flex items-center gap-2">
                                  {element.charge}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-end items-center gap-3 mb-4">
                      <ProduitsSelection
                        onArticlesAdd={(articles) =>
                          handleAddArticles(group.id, articles)
                        }
                      />
                    </div>

                    {group.items?.length > 0 && (
                      <div className="overflow-hidden border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60%]">
                                Produits
                              </TableHead>
                              <TableHead>Quantité</TableHead>
                              <TableHead>Prix unitaire</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead className="text-right">
                                Action
                              </TableHead>
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
                                    defaultValue={item.quantite}
                                    onChange={(e) =>
                                      handleItemChange(
                                        group.id,
                                        item.uniqueKey,
                                        "quantite",
                                        validateFloat(e.target.value)
                                      )
                                    }
                                    className="focus:!ring-purple-500 w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    defaultValue={item.prixUnite}
                                    onChange={(e) =>
                                      handleItemChange(
                                        group.id,
                                        item.uniqueKey,
                                        "prixUnite",
                                        validateFloat(e.target.value)
                                      )
                                    }
                                    className="focus:!ring-purple-500 w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  {(item.prixUnite * item.quantite).toFixed(2)}{" "}
                                  DH
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
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
                                    <Button
                                      type="button" // <- important pour ne PAS soumettre
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        handlCopyItem(group.id, item);
                                        console.log("bLGroups", bLGroups);
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
                                colSpan={3}
                                className="text-right text-xl font-semibold"
                              >
                                Total :
                              </TableCell>
                              <TableCell
                                colSpan={2}
                                className="text-left text-xl font-semibold"
                              >
                                {sousTotal(group)} DH
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <div className="w-fit">
                <AddButton
                  type="button"
                  onClick={addBlGroup}
                  title="Ajouter un groupe"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => handleUpdateBL.mutate()}
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ArticleSelectionDialog
        open={isArticleDialogOpen}
        onOpenChange={setIsArticleDialogOpen}
        onArticlesAdd={handleAddArticles}
      />
    </div>
  );
}
