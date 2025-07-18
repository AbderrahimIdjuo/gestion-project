"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Package, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComboBoxDevis from "@/components/comboBox-devis";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleSelectionDialog } from "@/components/produits-selection-NouveauBL";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import { ProduitsSelection } from "@/components/produits-selection-CMDF";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function AddBonLivraison({ lastBonLivraison }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [commandeDetails, setCommandeDetails] = useState(null);
  const [produits, setProduits] = useState([]);
  const [commande, setCommande] = useState(null);
  const [reference, setReference] = useState("");
  const [type, setType] = useState();
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [bLGroups, setBLGroups] = useState([]);
  const [selectedDevis, setSelectedDevis] = useState({});

  const queryClient = useQueryClient();
  function regrouperProduitsParQuantite(groups) {
    const produitMap = new Map();

    for (const group of groups) {
      for (const item of group.produits) {
        const id = item.produitId;

        if (produitMap.has(id)) {
          // Ajouter la quantité à l'existant
          produitMap.get(id).quantite += item.quantite;
        } else {
          // Cloner l'objet produit pour éviter les effets de bord
          produitMap.set(id, {
            ...item,
            quantite: item.quantite,
          });
        }
      }
    }

    // Retourner une liste de produits avec les quantités cumulées
    return Array.from(produitMap.values());
  }

  useEffect(() => {
    if (Array.isArray(commande?.groups)) {
      setProduits(regrouperProduitsParQuantite(commande?.groups));
    } else {
      console.warn("groups n’est pas un tableau :", commande?.groups);
    }
  }, [commande]);

  function formatDate(date) {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0"); // mois commence à 0
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const generateBLNumber = () => {
    const lastNumber = lastBonLivraison
      ? Number(lastBonLivraison.numero.replace("BL-", ""))
      : 0;

    const nextNumber = lastNumber + 1;
    console.log("numero :", `BL-${nextNumber}`);
    return `BL-${nextNumber}`;
  };

  const resetDialog = () => {
    setCurrentStep(1);
    setReference(null);
    setType();
    setDate(null);
    setBLGroups([]);
    setSelectedFournisseur(null);
  };

  const total = () => {
    const produits = bLGroups.flatMap((group) => group.items);
    return produits.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const sousTotal = (group) => {
    return group.items.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const handleCreateBL = useMutation({
    mutationFn: async () => {
      const data = {
        numero: generateBLNumber(),
        date,
        reference,
        fournisseurId: selectedFournisseur.id,
        total: total().toFixed(2),
        type,
        totalPaye: 0,
        bLGroups,
      };
      const loadingToast = toast.loading("Ajout du bon de livraison...");
      try {
        await axios.post("/api/bonLivraison", data);
        toast.success("bon ajouter avec succès");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      resetDialog();
      queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
    },
  });
  //////////////Fonction pour gérer la sélection des Groupes de BL//////////////
  // Ajout d'un groupe de commande
  const addOrderGroup = useCallback(() => {
    const newGroup = {
      id: crypto.randomUUID(), // Génération d'un ID unique
      items: [],
      devisNumber: null,
      clientName: null,
      clientId: null,
    };
    setBLGroups((prev) => [...prev, newGroup]);
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
  // Suppression d'un groupe
  const removeOrderGroup = useCallback((groupId) => {
    setBLGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSelectedDevis((prev) => {
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
  return (
    <div className="">
      <div className="flex items-center justify-between">
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
              Ajouter un BL
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Nouveau bon de livraison
              </DialogTitle>
              <DialogDescription>
                Vérifiez et modifiez les informations avant de créer le BL
              </DialogDescription>
            </DialogHeader>

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 grid-rows-2 gap-3">
                  <div className="w-full space-y-2">
                    <Label htmlFor="client">Date : </Label>
                    <CustomDatePicker date={date} onDateChange={setDate} />
                  </div>
                  <div className="w-full space-y-2">
                    <Label className="text-sm font-medium block pt-1">
                      Type
                    </Label>
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
                  {/* <div className="w-full space-y-2">
                    <ComboBoxCommandesFournitures
                      setCommande={setCommande}
                      commande={commande}
                    />
                  </div> */}
                </div>
                {commande !== null && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Détails de la commande
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">
                              Numéro
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {commande?.numero}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Fournisseur
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {commande?.fournisseur?.nom.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Produits
                          </Label>
                          <div className="mt-2 space-y-1">
                            {Array.isArray(commande.groups) &&
                              regrouperProduitsParQuantite(
                                commande?.groups
                              )?.map((articl) => (
                                <div
                                  key={articl.id}
                                  className="text-sm text-muted-foreground"
                                >
                                  • {articl.produit.designation} (Qté:{" "}
                                  {articl.quantite})
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 ">
                <div className="grid gap-4 mb-4 p-4 border-t border-gray-300 grid-cols-5">
                  {date && (
                    <div className="space-y-1 col-span-1">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Date :
                      </h3>
                      <p className="font-semibold">{formatDate(date)} </p>
                    </div>
                  )}
                  {reference && (
                    <div className="space-y-1 col-span-1">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Référence :
                      </h3>
                      <p className="font-semibold">{reference} </p>
                    </div>
                  )}
                  {type && (
                    <div className="space-y-1 col-span-1">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Type :
                      </h3>
                      <p className="font-semibold">{type} </p>
                    </div>
                  )}
                  {selectedFournisseur && (
                    <div className="space-y-1 col-span-1">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Fournisseur :
                      </h3>
                      <p className="font-semibold">
                        {selectedFournisseur?.nom}{" "}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1 col-span-1">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Total du BL:
                    </h3>
                    <p className="font-semibold">{total().toFixed()} DH</p>
                  </div>
                  {commande ? (
                    <>
                      {" "}
                      <div className="space-y-1 col-span-1">
                        <h3 className="font-medium text-sm text-muted-foreground">
                          Fournisseur :
                        </h3>
                        <p className="font-semibold">
                          {commande?.fournisseur.nom.toUpperCase()}{" "}
                        </p>
                      </div>
                      <div className="space-y-1 col-span-1">
                        <h3 className="font-medium text-sm text-muted-foreground">
                          Numero de commande :
                        </h3>
                        <p className="font-semibold">{commande?.numero} </p>
                      </div>{" "}
                    </>
                  ) : (
                    ""
                  )}
                </div>
                {bLGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          Groupe{" "}
                          {bLGroups.findIndex((g) => g.id === group.id) + 1}
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
                                  <TableCell>
                                    {item.prixUnite * item.quantite} DH
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
                    onClick={addOrderGroup}
                    title="Ajouter un groupe"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              {currentStep === 1 ? (
                <Button
                  className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(2);
                  }}
                  disabled={!selectedFournisseur || !type}
                >
                  Suivant
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="rounded-full"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Retour
                  </Button>
                  <Button
                    className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                    variant="outline"
                    onClick={() => handleCreateBL.mutate()}
                  >
                    Créer le BL
                  </Button>
                </div>
              )}
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
