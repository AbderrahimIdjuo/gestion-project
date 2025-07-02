"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { addtransaction } from "@/app/api/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  CircleDollarSign,
  Landmark,
  CalendarDays,
  Trash2,
  Printer,
  Phone,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CompteBancairesSelectMenu from "@/components/compteBancairesSelectMenu";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

function formatPhoneNumber(phone) {
  return phone?.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function PaiementDialog({
  isOpen,
  onClose,
  onConfirm,
  compte,
  setCompte,
  setMontant,
  transactions,
  devis,
}) {
  const [transList, setTransList] = useState();
  const [date, setDate] = useState(null);

  const queryClient = useQueryClient();
  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm();
  const handlePrint = () => {
    window.print();
  };
  const transactionsList = useQuery({
    queryKey: ["devis"],
    queryFn: async () => {
      const response = await axios.get(`/api/tresorie/${devis?.numero}`);
      // console.log("Listes des transaction :", response.data.transactions);
      setTransList(response.data.transactions);
      return response.data.transactions;
    },
  });

  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
  });
  const transactionsDevis = (numero) => {
    const trans = transList?.filter((c) => c.reference === numero);
    // console.log("trans", trans);
    return trans;
  };

  const totalPaye = transactions?.reduce((acc, transaction) => {
    return acc + transaction.montant;
  }, 0);

  const createTransaction = useMutation({
    mutationFn: async () => {
      const data = {
        ...watch(),
        numero: devis.numero,
        type: "recette",
        lable: "paiement devis",
        description: "",
        date: date || new Date(),
      };

      console.log("transData : ", data);
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
      queryClient.invalidateQueries(["devis"]);
    },
  });
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paiement du devis {devis.numero}</DialogTitle>
            <DialogDescription>
              Déterminer le montant et sélectionnez le compte que vous souhaitez
              utiliser pour ce paiement.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={watch("methodePaiement")}
              onValueChange={(value) => {
                reset();
                setValue("methodePaiement", value);
                if (value === "espece") {
                  setValue("compte", "caisse");
                }
              }}
              className="flex flex-row flex-wrap gap-4 justify-evenly"
            >
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="espece"
                  id="espece"
                  className="text-green-600 "
                />
                <Label
                  htmlFor="espece"
                  className="text-green-600 font-medium cursor-pointer"
                >
                  Espèce
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="cheque"
                  id="cheque"
                  className="text-violet-600 "
                />
                <Label
                  htmlFor="cheque"
                  className="text-violet-600 font-medium cursor-pointer"
                >
                  Chèque
                </Label>
              </div>
            </RadioGroup>

            {watch("methodePaiement") === "espece" && (
              <div className="space-y-4 items-end grid grid-cols-3 gap-4">
                <div className="w-full space-y-3 mt-3">
                  <Label htmlFor="client">Date : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="montant">Montant</Label>
                  <Input
                    {...register("montant", { valueAsNumber: true })}
                    className="w-full mt-1 focus-visible:ring-purple-500"
                    id="montant"
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="compte">Compte bancaire</Label>
                  <Select
                    value={watch("compte")}
                    name="compte"
                    onValueChange={(value) => setValue("compte", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data?.map((element) => (
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
            )}
            {watch("methodePaiement") === "cheque" && (
              <div className="space-y-4 items-end grid grid-cols-3 gap-4">
                <div className="w-full space-y-3 mt-3">
                  <Label htmlFor="client">Date : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
                </div>
                <div className="grid w-full items-center gap-3">
                  <Label htmlFor="montant">Montant</Label>
                  <Input
                    {...register("montant", { valueAsNumber: true })}
                    className="w-full mt-1 focus-visible:ring-purple-500"
                    id="montant"
                  />
                </div>
              <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="compte">Compte bancaire</Label>
                  <Select
                    value={watch("compte")}
                    name="compte"
                    onValueChange={(value) => setValue("compte", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data
                        ?.filter((c) => c.compte !== "caisse")
                        .map((element) => (
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
            )}
          </div>

          {/* <div className="grid grid-cols-2 gap-3">
            <div className="relative space-y-2">
              <Label htmlFor="montant" className="text-left mb-2 mb-2">
                Montant :
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">
                <Input
                  id="montant"
                  name="montant"
                  className="col-span-3 focus-visible:ring-purple-500"
                  onChange={(e) => setMontant(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                  <span className="text-sm text-gray-600">MAD</span>
                </div>
              </div>
            </div>
            <CompteBancairesSelectMenu compte={compte} setCompte={setCompte} />
          </div> */}
          <div className="mt-4 mb-2 flex justify-end">
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              onClick={() => {
                // console.log("data:", {
                //   ...watch(),
                //   date,
                // });
                //onConfirm();
                onClose();
                createTransaction.mutate();
              }}
              disabled={!watch("montant") || !watch("compte")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Confirmer le paiement
            </Button>
          </div>

          {/* <div className=" border rounded-lg p-4 space-y-4">
            <div className="flex justify-start items-center gap-3 p-1 w-full min-w-[500]">
              <Label htmlFor="montant" className="text-left mb-2 mb-2">
                Historique des paiements :
              </Label>
            </div>

            <div className="space-y-2">
              {transList?.map((trans) => (
                <div
                  key={trans.id}
                  className="flex justify-between items-center gap-3 p-1 bg-slate-100 rounded-full border border-border/50 hover:bg-slate-100 transition-colors w-full min-w-[500]"
                >
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <div className="bg-slate-700 text-white p-2 rounded-full">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-800 font-medium">
                      {formatDate(trans.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-[150px]">
                    <div className="bg-slate-700 text-white p-2 rounded-full">
                      <CircleDollarSign className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-800 font-semibold">
                      {trans.montant} DH
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-slate-700 text-white p-2 rounded-full">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-800 font-medium">
                      {trans.compte}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                    onClick={() => {
                      setDeleteTransDialog(true);
                      setDeletedTrans(trans);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  window.open(
                    `/ventes/devis/${devis.id}/historiquePaiements`,
                    "_blank"
                  );
                  localStorage.setItem("commande", JSON.stringify(devis));
                  localStorage.setItem(
                    "transactions",
                    JSON.stringify(transList)
                  );
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimer
              </Button>
            </div>
          </div> */}
        </DialogContent>
      </Dialog>
    </>
  );
}
