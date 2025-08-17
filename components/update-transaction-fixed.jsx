"use client";

import { addCharge } from "@/app/api/actions";
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
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import z from "zod";

export default function UpdateTransactionDialog({
  transaction,
  isOpen,
  onClose,
}) {
  const [isCharge, setIsCharge] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [date, setDate] = useState(null);

  // Déterminer le type de transaction basé sur les données
  const isClientTransaction = transaction?.clientId !== null;
  const isChequeTransaction = transaction?.chequeId !== null;
  const isFournisseurTransaction = transaction?.fournisseurId !== null;
  const isGeneralTransaction =
    transaction?.clientId === null && transaction?.fournisseurId === null;
  
  const newTransactionSchema = z
    .object({
      type: z.enum(["recette", "depense", "vider"]),
      lable: z.string().optional(),
      numero: z.string().optional(),
      montant: z
        .number({ invalid_type_error: "Le montant est requis" })
        .optional(),
      compte: z.string().optional(),
      description: z.string().optional(),
      methodePaiement: z.string().optional(),
      numeroCheque: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (["recette", "depense"].includes(data.type)) {
        if (!data.lable || data.lable.trim() === "") {
          ctx.addIssue({
            path: ["lable"],
            code: z.ZodIssueCode.custom,
            message: "Le label est requis pour une recette ou une dépense.",
          });
        }
        if (typeof data.montant !== "number" || data.montant <= 0) {
          ctx.addIssue({
            path: ["montant"],
            code: z.ZodIssueCode.custom,
            message: "Le montant doit être supérieur à 0.",
          });
        }
        if (!data.compte || data.compte.trim() === "") {
          ctx.addIssue({
            path: ["compte"],
            code: z.ZodIssueCode.custom,
            message: "Le compte bancaire est requis.",
          });
        }
      }

      if (data.type === "vider") {
        if (typeof data.montant !== "number" || data.montant <= 0) {
          ctx.addIssue({
            path: ["montant"],
            code: z.ZodIssueCode.custom,
            message: "Le montant à vider doit être supérieur à 0.",
          });
        }
      }
    });

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm({
    resolver: zodResolver(newTransactionSchema),
  });

  const queryClient = useQueryClient();

  // Mettre à jour les valeurs du formulaire quand la transaction change
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type || "recette",
        lable: transaction.lable || "",
        montant: transaction.montant || 0,
        compte: transaction.compte || "",
        description: transaction.description || "",
        methodePaiement: transaction.methodePaiement || "",
        numeroCheque: transaction.cheque?.numero || "",
      });
      setDate(new Date(transaction.date));
    }
  }, [transaction, reset]);

  const charges = useQuery({
    queryKey: ["charges"],
    queryFn: async () => {
      const response = await axios.get("/api/charges");
      return response.data.charges;
    },
  });

  const addCharges = useMutation({
    mutationFn: async charge => {
      const loadingToast = toast.loading("Opération en cours...");
      try {
        await addCharge(charge);
        toast.success("Opération efféctué avec succès");
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
    },
  });

  const handleUpdateTransaction = useMutation({
    mutationFn: async data => {
      const loadingToast = toast.loading("Opération en cours ...");
      try {
        await axios.put("/api/tresorie/update", data);
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
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const onSubmit = async data => {
    console.log("🔍 Données du formulaire reçues:", data);
    console.log("👀 Valeurs actuelles du formulaire:", watch());
    console.log("📅 Date sélectionnée:", date);
    console.log("💳 Méthode de paiement dans data:", data.methodePaiement);
    console.log("🏦 Numéro de chèque dans data:", data.numeroCheque);

    const Data = {
      ...data,
      id: transaction.id, // Ajouter l'ID de la transaction
      date,
      reference: transaction.reference,
      clientId: transaction.clientId,
      fournisseurId: transaction.fournisseurId,
    };

    console.log("📤 Données envoyées à l'API:", Data);
    console.log("💳 Méthode de paiement finale:", Data.methodePaiement);
    console.log("🏦 Numéro de chèque final:", Data.numeroCheque);

    handleUpdateTransaction.mutate(Data);
    // onClose();
  };

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
  });

  // Si c'est une transaction client, afficher les champs de modification
  if (isClientTransaction || isFournisseurTransaction) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Modifier la Transaction </DialogTitle>
              <DialogDescription>
                Modifiez les détails de la transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="lable">Label</Label>
                <div className="w-full h-10 px-3 py-2 bg-purple-50  rounded-md flex items-center text-sm">
                  {transaction?.lable || "Aucun label"}
                </div>
              </div>

              <div className="w-full">
                <Label htmlFor="date">Date : </Label>
                <CustomDatePicker date={date} onDateChange={setDate} />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="montant">Montant</Label>
                <Input
                  {...register("montant", { valueAsNumber: true })}
                  className="w-full focus-visible:ring-purple-500"
                  id="montant"
                  placeholder="Entrez le montant"
                />
                {errors.montant && (
                  <p className="text-red-500 text-sm">
                    {errors.montant.message}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="compte">Compte bancaire</Label>
                <Select
                  value={watch("compte")}
                  name="compte"
                  onValueChange={value => setValue("compte", value)}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Séléctionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comptes.data?.map(element => (
                      <SelectItem key={element.id} value={element.compte}>
                        <div className="flex items-center gap-2">
                          {element.compte}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.compte && (
                  <p className="text-red-500 text-sm">
                    {errors.compte.message}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="methodePaiement">Méthode de paiement</Label>
                <Select
                  value={watch("methodePaiement")}
                  name="methodePaiement"
                  onValueChange={value => setValue("methodePaiement", value)}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Séléctionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espece">Éspece</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="versement">Versement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watch("methodePaiement") === "cheque" && (
                <div className="grid w-full items-center gap-2 col-span-3">
                  <Label htmlFor="numeroCheque">Numéro de chèque</Label>
                  <Input
                    {...register("numeroCheque")}
                    className="w-full focus-visible:ring-purple-500"
                    id="numeroCheque"
                    placeholder="Numéro de chèque"
                  />
                </div>
              )}

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="description">Description</Label>
                <div className="w-full h-10 px-3 py-2 bg-purple-50 rounded-md flex items-center text-sm">
                  {transaction?.description || "Aucune description"}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                type="submit"
                disabled={isSubmiting}
              >
                {isSubmiting ? "En cours..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Si c'est une transaction avec chèque, afficher les champs de modification du chèque
  if (
    isChequeTransaction &&
    (isClientTransaction || isFournisseurTransaction)
  ) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Modifier la Transaction Chèque</DialogTitle>
              <DialogDescription>
                Modifiez les détails du chèque.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="lable">Label</Label>
                <div className="w-full h-10 px-3 py-2 bg-purple-50 rounded-md flex items-center text-sm">
                  {transaction?.lable || "Aucun label"}
                </div>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="numeroCheque">Numéro de chèque</Label>
                <Input
                  {...register("numeroCheque")}
                  className="w-full focus-visible:ring-purple-500"
                  id="numeroCheque"
                  placeholder="Numéro de chèque"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="montant">Montant</Label>
                <Input
                  {...register("montant", { valueAsNumber: true })}
                  className="w-full focus-visible:ring-purple-500"
                  id="montant"
                  placeholder="Entrez le montant"
                />
                {errors.montant && (
                  <p className="text-red-500 text-sm">
                    {errors.montant.message}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="compte">Compte bancaire</Label>
                <Select
                  value={watch("compte")}
                  name="compte"
                  onValueChange={value => setValue("compte", value)}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Séléctionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comptes.data?.map(element => (
                      <SelectItem key={element.id} value={element.compte}>
                        <div className="flex items-center gap-2">
                          {element.compte}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.compte && (
                  <p className="text-red-500 text-sm">
                    {errors.compte.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                type="submit"
                disabled={isSubmiting}
              >
                {isSubmiting ? "En cours..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Si c'est une transaction générale (ni client ni fournisseur), afficher les champs de modification
  if (isGeneralTransaction) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Modifier la Transaction Générale</DialogTitle>
              <DialogDescription>
                Modifiez les détails de la transaction générale.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex items-center space-x-2 ">
                <Switch
                  id="switch"
                  checked={isCharge}
                  onCheckedChange={setIsCharge}
                />
                <Label htmlFor="switch">
                  {isCharge ? "Charges récurrentes" : "Charges variantes"}
                </Label>
              </div>
              {isCharge ? (
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="label">Label</Label>
                  <Select
                    value={watch("label")}
                    name="label"
                    onValueChange={value => setValue("lable", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {charges.data?.map(element => (
                        <SelectItem key={element.id} value={element.charge}>
                          <div className="flex items-center gap-2">
                            {element.charge}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="label">Label</Label>
                  <div className="grid  gap-2">
                    <Input
                      {...register("lable")}
                      className="w-full focus-visible:ring-purple-500"
                      id="lable"
                      placeholder="Entrez un label"
                    />
                    {errors.label && (
                      <p className="text-red-500 text-sm">
                        {errors.label.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full">
                <Label htmlFor="date">Date : </Label>
                <CustomDatePicker date={date} onDateChange={setDate} />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="montant">Montant</Label>
                <Input
                  {...register("montant", { valueAsNumber: true })}
                  className="w-full focus-visible:ring-purple-500"
                  id="montant"
                  placeholder="Entrez le montant"
                />
                {errors.montant && (
                  <p className="text-red-500 text-sm">
                    {errors.montant.message}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="compte">Compte bancaire</Label>
                <Select
                  value={watch("compte")}
                  name="compte"
                  onValueChange={value => setValue("compte", value)}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Séléctionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comptes.data?.map(element => (
                      <SelectItem key={element.id} value={element.compte}>
                        <div className="flex items-center gap-2">
                          {element.compte}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.compte && (
                  <p className="text-red-500 text-sm">
                    {errors.compte.message}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="methodePaiement">Méthode de paiement</Label>
                <Select
                  value={watch("methodePaiement")}
                  name="methodePaiement"
                  onValueChange={value => setValue("methodePaiement", value)}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Séléctionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espece">Éspece</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="versement">Versement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watch("methodePaiement") === "cheque" && (
                <div className="grid w-full items-center gap-2 col-span-3">
                  <Label htmlFor="numeroCheque">Numéro de chèque</Label>
                  <Input
                    {...register("numeroCheque")}
                    className="w-full focus-visible:ring-purple-500"
                    id="numeroCheque"
                    placeholder="Numéro de chèque"
                  />
                </div>
              )}

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="description">Description</Label>
                <div className="w-full h-10 px-3 py-2 bg-purple-50 rounded-md flex items-center text-sm">
                  {transaction?.description || "Aucune description"}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                type="submit"
                disabled={isSubmiting}
              >
                {isSubmiting ? "En cours..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
}

