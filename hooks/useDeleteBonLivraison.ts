import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { BonLivraisonT } from "@/app/(pages)/achats/bonLivraison/columns"; // adapte le chemin

export function useDeleteBonLivraison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bonLivraison: any) => {
      const loadingToast = toast.loading("Suppression...");
      try {
        await axios.delete(
          `/api/bonLivraison/${bonLivraison.id}?fournisseurId=${bonLivraison.fournisseurId}&type=${bonLivraison.type}`
        );
        toast.success(
          `Le bon de livraison ${bonLivraison.numero} a été supprimé`
        );
        console.log("BL supprimée avec succès !");
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        toast.error("Échec de la suppression");
        throw error; // Relancez l'erreur pour que `onError` soit déclenché
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["bonLivraison"]);
    },
  });
}
