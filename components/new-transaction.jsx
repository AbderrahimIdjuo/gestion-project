"use client";

import { addCharge, addtransaction } from "@/app/api/actions";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import z from "zod";
export default function TransactionDialog() {
  const [open, setOpen] = useState(false);
  const [isCharge, setIsCharge] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [date, setDate] = useState(null);
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
    defaultValues: {
      type: "recette",
      reference: "",
      description: "",
      compte: "",
    },
    resolver: zodResolver(newTransactionSchema),
  });
  const queryClient = useQueryClient();
  useEffect(() => {
    setDate(null);
  }, [watch("type")]);
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
  const createTransaction = useMutation({
    mutationFn: async data => {
      const loadingToast = toast.loading("Paiement en cours...");
      try {
        await addtransaction(data);
        toast.success("Paiement éffectué avec succès");
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
    },
  });
  const onSubmit = async data => {
    const Data = { ...data, date };
    console.log("Data", Data);
    if (isChecked && !isCharge) {
      console.log("enrgistrer la charge");
      addCharges.mutate(watch("lable"));
    }
    createTransaction.mutate(Data);
    setOpen(false);
    reset();
  };
  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nouvelle Transaction</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de transaction et remplissez les détails
              nécessaires.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={watch("type")}
              onValueChange={value => {
                reset();
                setValue("type", value);
              }}
              className="flex flex-row flex-wrap gap-4 justify-evenly"
            >
              {/* <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="recette"
                  id="recette"
                  className="text-green-600 "
                />
                <Label
                  htmlFor="recette"
                  className="text-green-600 font-medium cursor-pointer"
                >
                  Recette
                </Label>
              </div> */}
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="depense"
                  id="depense"
                  className="text-red-600 "
                />
                <Label
                  htmlFor="depense"
                  className="text-red-600 font-medium cursor-pointer"
                >
                  Dépense
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="vider"
                  id="vider"
                  className="text-blue-600 "
                />
                <Label
                  htmlFor="vider"
                  className="text-blue-600 font-medium cursor-pointer"
                >
                  Vider la caisse
                </Label>
              </div>
            </RadioGroup>

            {watch("type") === "recette" && (
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="label">Label</Label>
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
                <div className="w-full">
                  <Label htmlFor="client">Date : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="numero">Numero de devis</Label>
                  <Input
                    {...register("numero")}
                    className="w-full focus-visible:ring-purple-500"
                    id="numero"
                    placeholder="Exemple : DEV-12"
                  />
                  {errors.numero && (
                    <p className="text-red-500 text-sm">
                      {errors.numero.message}
                    </p>
                  )}
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
                  <Label htmlFor="compte">Méthode de paiement</Label>
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
                    />
                  </div>
                )}
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    {...register("description")}
                    id="description"
                    className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
                  />
                </div>
              </div>
            )}
            {watch("type") === "depense" && (
              <div className="space-y-4">
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
                <div className="w-full space-y-1">
                  <Label htmlFor="client">Date : </Label>
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
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 ">
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
                  <Label htmlFor="compte">Méthode de paiement</Label>
                  <Select
                    value={watch("methodePaiement")}
                    name="methodePaiement"
                    onValueChange={value => setValue("methodePaiement", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 ">
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
                    />
                  </div>
                )}
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    {...register("description")}
                    id="description"
                    className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 "
                  />
                </div>
                {!isCharge && (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="terms"
                      checked={isChecked}
                      onCheckedChange={checked => {
                        setIsChecked(checked === true); // force un boolean
                      }}
                    />
                    <Label htmlFor="terms">
                      Ajouter à la liste des charges récurrentes
                    </Label>
                  </div>
                )}
              </div>
            )}
            {watch("type") === "vider" && (
              <>
                <div className="w-full">
                  <Label htmlFor="client">Date : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="montant-vider">Montant</Label>
                  <Input
                    {...register("montant", { valueAsNumber: true })}
                    className="w-full focus-visible:ring-purple-500"
                    id="montant-vider"
                    type="number"
                    placeholder="Entrez le montant"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="compte">Compte bancaire</Label>
                  <Select
                    value={watch("compte")}
                    name="compte"
                    onValueChange={value => setValue("compte", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data
                        ?.filter(c => c.compte !== "caisse")
                        .map(element => (
                          <SelectItem key={element.id} value={element.compte}>
                            <div className="flex items-center gap-2">
                              {element.compte}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                const result = newTransactionSchema.safeParse(watch());

                if (result.success) {
                  console.log("✅ Données valides :", watch());
                } else {
                  console.log(
                    "❌ Erreurs de validation :",
                    result.error.format()
                  );
                }
              }}
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
