"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [deleteTransDialog, setDeleteTransDialog] = useState(false);
  const [deletedTrans, setDeletedTrans] = useState();
  const [transList, setTransList] = useState();
  const queryClient = useQueryClient();

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


  const transactionsDevis = (numero) => {
    const trans = transList?.filter((c) => c.reference === numero);
   // console.log("trans", trans);
    return trans;
  };
  const deleteTrans = useMutation({
    mutationFn: async (id) => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete("/api/tresorie", {
          params: {
            id,
          },
        });
        toast(<span>Transaction supprimé avec succée!</span>, {
          icon: "🗑️",
        });
      } catch (error) {
        toast.error("Échec de la suppression");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
        const updatedTransactions = transactions.filter(
          (transaction) => transaction.id !== deleteTrans.id
        );
        console.log("Updated Transactions:", updatedTransactions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // queryClient.invalidateQueries({ queryKey: ["factures"] });
      // queryClient.invalidateQueries({ queryKey: ["depensesVariantes"] });
      // queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });
  const totalPaye = transactions?.reduce((acc, transaction) => {
    return acc + transaction.montant;
  }, 0);
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choisir le montant et le compte à débiter</DialogTitle>
            <DialogDescription>
              Déterminer le montant et sélectionnez le compte que vous souhaitez
              utiliser pour ce paiement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="mt-4 mb-2 flex justify-end">
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              onClick={() => {
                console.log(`Paiement effectué depuis le compte: ${compte}`);
                onConfirm();
                onClose();
              }}
              disabled={!compte}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Confirmer le paiement
            </Button>
          </div>

          <div className=" border rounded-lg p-4 space-y-4">
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
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        recordName={"le paiement"}
        isOpen={deleteTransDialog}
        onClose={() => {
          setDeleteTransDialog(false);
        }}
        onConfirm={() => {
          deleteTrans.mutate(deletedTrans.id);
          setDeleteTransDialog(false);
        }}
      />
    </>
  );
}
