"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArticleSelectionDialog } from "@/components/produits-selection-NouveauBL";
import { Badge } from "@/components/ui/badge";
import ComboBoxCommandesFournitures from "@/components/comboBox-commandesFournitures";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import axios from "axios";
import { AddButton } from "@/components/customUi/styledButton";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Données mockées pour les commandes de fourniture
const commandesFourniture = [
  {
    id: "CMD-001",
    numero: "CMD-2024-001",
    fournisseur: "Fournisseur Alpha",
    date: "2024-01-15",
    statut: "En attente",
    produits: [
      {
        id: 1,
        nom: "Ordinateur portable Dell",
        quantite: 5,
        prixUnitaire: 850.0,
      },
      { id: 2, nom: "Souris sans fil", quantite: 10, prixUnitaire: 25.0 },
      { id: 3, nom: "Clavier mécanique", quantite: 8, prixUnitaire: 120.0 },
    ],
  },
  {
    id: "CMD-002",
    numero: "CMD-2024-002",
    fournisseur: "TechSupply Pro",
    date: "2024-01-18",
    statut: "Confirmée",
    produits: [
      { id: 4, nom: "Écran 24 pouces", quantite: 12, prixUnitaire: 280.0 },
      { id: 5, nom: "Câble HDMI", quantite: 15, prixUnitaire: 15.0 },
      { id: 6, nom: "Hub USB-C", quantite: 6, prixUnitaire: 45.0 },
    ],
  },
  {
    id: "CMD-003",
    numero: "CMD-2024-003",
    fournisseur: "Bureau Solutions",
    date: "2024-01-20",
    statut: "En attente",
    produits: [
      {
        id: 7,
        nom: "Chaise de bureau ergonomique",
        quantite: 20,
        prixUnitaire: 180.0,
      },
      { id: 8, nom: "Bureau réglable", quantite: 8, prixUnitaire: 450.0 },
      { id: 9, nom: "Lampe de bureau LED", quantite: 15, prixUnitaire: 35.0 },
    ],
  },
];

export default function AddBonLivraison() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [commandeDetails, setCommandeDetails] = useState(null);
  const [produits, setProduits] = useState([]);
  const [commande, setCommande] = useState(null);
  const [reference, setReference] = useState(null);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
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

  const lastBon = useQuery({
    queryKey: ["lastBon"],
    queryFn: async () => {
      const response = await axios.get("/api/bonLivraison/lastBon");
      console.log("lastBon : ", response.data);

      return response.data;
    },
  });

  // const generateBLNumber = () => {
  //   const numero = Number(lastBon.data.numero.replace("BL-", "")) || 0;
  //   console.log("numero : ", `BL-${numero + 1}`);
  //   return `BL-${numero + 1}`;
  // };

  const generateBLNumber = () => {
  const lastNumber = lastBon?.data?.numero
    ? Number(lastBon.data.numero.replace("BL-", ""))
    : 0;

  const nextNumber = lastNumber + 1;
  console.log("numero :", `BL-${nextNumber}`);
  return `BL-${nextNumber}`;
};
  const handleAddArticles = (newArticles) => {
    // console.log("Produits### :", produits);
    // console.log("newArticles", newArticles);
    const produitsAjouter = newArticles.map((p) => ({
      produitId: p.id,
      quantite: p.quantite,
      prixUnite: p.prixUnite,
      produit: {
        designation: p.designation,
        prixAchat: p.prixUnite,
      },
    }));
    setProduits((prevItems) => [
      ...prevItems,
      ...produitsAjouter.map((article) => ({
        ...article,
      })),
    ]);
  };

  // const handleCreateBL = () => {
  //   const data = {
  //     numero: "BL-1",
  //     date,
  //     produits,
  //     reference,
  //     fournisseurId: commande.fournisseurId,
  //     commandeFourniture: commande.numero,
  //     total: total().toFixed(2),
  //     type: "Achats",
  //   };
  //   console.log("Data :", data);

  //   // Ici vous pouvez traiter la création du BL
  //   console.log("Création du BL avec:", { commandeDetails, produits });
  //   setIsDialogOpen(false);
  //   resetDialog();
  // };

  const resetDialog = () => {
    setCurrentStep(1);
    setReference(null);
    setCommande(null);
    setCommandeDetails(null);
    setProduits([]);
  };

  const total = () => {
    return produits.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const handleItemChange = (produitId, field, value) => {
    setProduits((prev) =>
      prev.map((p) =>
        p.produitId === produitId
          ? { ...p, [field]: Number.parseFloat(value) || 0 }
          : p
      )
    );
  };

  const removeItem = (produitId) => {
    setProduits((prev) =>
      prev.filter((produit) => produit.produitId !== produitId)
    );
  };
  const handleCreateBL = useMutation({
    mutationFn: async () => {
      const data = {
        numero: generateBLNumber(),
        date,
        produits,
        reference,
        fournisseurId: commande.fournisseurId,
        commandeFourniture: commande.numero,
        total: total().toFixed(2),
        type: "Achats",
        totalPaye: 0,
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

          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                {currentStep === 1
                  ? "Sélectionner une commande"
                  : "Nouveau bon de livraison"}
              </DialogTitle>
              <DialogDescription>
                {currentStep === 1
                  ? "Choisissez une commande de fourniture pour créer le bon de livraison"
                  : "Vérifiez et modifiez les informations avant de créer le BL"}
              </DialogDescription>
            </DialogHeader>

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="w-full space-y-2">
                    <Label htmlFor="client">Date : </Label>
                    <CustomDatePicker date={date} onDateChange={setDate} />
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
                  <ComboBoxCommandesFournitures
                    setCommande={setCommande}
                    commande={commande}
                  />
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
                <div className="flex justify-between gap-8 mb-4 p-4 border-t border-gray-300">
                  <div className="space-y-1 col-span-1">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Référence :
                    </h3>
                    <p className="font-semibold">{reference} </p>
                  </div>
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
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center gap-2">
                      <div className="flex gap-2 items-center">
                        Produits
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-purple-50 text-violet-700"
                        >
                          {produits.length} articles
                        </Badge>
                      </div>

                      <AddButton
                        type="button"
                        onClick={() => setIsArticleDialogOpen(true)}
                        title="Ajouter des produits"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {
                        <div className="overflow-hidden border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[60%]">
                                  Désignation
                                </TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead>Prix unitaire</TableHead>
                                <TableHead className="text-right">
                                  Action
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {produits.map((articl) => (
                                <TableRow key={articl.id}>
                                  <TableCell>
                                    <span className="text-md">
                                      {articl.produit.designation}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={articl.quantite}
                                      onChange={(e) =>
                                        handleItemChange(
                                          articl.produitId,
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
                                      value={articl.prixUnite}
                                      onChange={(e) =>
                                        handleItemChange(
                                          articl.produitId,
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
                                        removeItem(articl.produitId)
                                      }
                                      className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter className="font-medium ">
                              <TableRow>
                                <TableCell
                                  colSpan={2}
                                  className=" p-4 text-right font-bold  text-xl"
                                >
                                  Total :
                                </TableCell>
                                <TableCell
                                  colSpan={2}
                                  className=" border-zinc-500  p-4 text-left font-bold text-xl "
                                >
                                  {total().toFixed(2)} DH
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </div>
                      }
                    </div>
                  </CardContent>
                </Card>
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
                  disabled={!commande || !reference}
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
