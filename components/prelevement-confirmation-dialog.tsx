"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/functions";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ban, CalendarClock, CalendarIcon, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type PrelevementStatus = "confirme" | "annule" | "reporte";

interface PrelevementConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reglement: {
    id: string;
    montant: number;
    fournisseur: {
      nom: string;
    };
    datePrelevement: string | null;
  } | null;
  onConfirm: () => void;
}

export function PrelevementConfirmationDialog({
  isOpen,
  onClose,
  reglement,
  onConfirm,
}: PrelevementConfirmationDialogProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] =
    useState<PrelevementStatus | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset state when dialog closes
  const handleClose = () => {
    setSelectedStatus(null);
    setNewDate(undefined);
    setShowDatePicker(false);
    onClose();
  };

  // Handle date selection for "reporte" status
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to UTC midnight
      const utcMidnight = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      setNewDate(utcMidnight);
      setShowDatePicker(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedStatus || !reglement) return;

    // Validate that newDate is provided if status is "reporte"
    if (selectedStatus === "reporte" && !newDate) {
      toast.error("Veuillez sélectionner une nouvelle date pour le report");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Mise à jour en cours...");

    try {
      await axios.post(`/api/reglements/${reglement.id}/confirm`, {
        status: selectedStatus,
        newDate: newDate ? newDate.toISOString() : undefined,
      });

      toast.success("Statut de prélèvement mis à jour avec succès!", {
        id: loadingToast,
      });

      // Invalider les queries pour mettre à jour les notifications
      queryClient.invalidateQueries({ queryKey: ["today-prelevements"] });
      queryClient.invalidateQueries({ queryKey: ["reglements"] });

      // Reset state
      setSelectedStatus(null);
      setNewDate(undefined);
      setShowDatePicker(false);

      // Call the onConfirm callback to refresh data
      onConfirm();

      // Close the dialog
      handleClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          "Erreur lors de la mise à jour du statut",
        { id: loadingToast }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusButton = (
    status: PrelevementStatus,
    label: string,
    icon: React.ReactNode,
    className: string
  ) => {
    const isSelected = selectedStatus === status;
    return (
      <Button
        type="button"
        variant={isSelected ? "default" : "outline"}
        onClick={() => {
          setSelectedStatus(status);
          if (status !== "reporte") {
            setNewDate(undefined);
            setShowDatePicker(false);
          }
        }}
        className={cn(
          "flex-1 flex flex-col items-center gap-2 h-auto py-4 px-4 transition-all",
          isSelected && className,
          !isSelected && "hover:bg-gray-50"
        )}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </Button>
    );
  };

  if (!reglement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] animate-in fade-in-0 zoom-in-95">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Confirmation de prélèvement
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Le prélèvement prévu pour aujourd&apos;hui a-t-il été effectué ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reglement Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fournisseur:</span>
              <span className="font-semibold">{reglement.fournisseur.nom}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Montant:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(reglement.montant)}
              </span>
            </div>
            {reglement.datePrelevement && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date prévue:</span>
                <span className="font-medium">
                  {format(new Date(reglement.datePrelevement), "PPP", {
                    locale: fr,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Status Selection Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {getStatusButton(
              "confirme",
              "Confirmer",
              <CheckCircle2 className="h-5 w-5" />,
              "bg-green-500 hover:bg-green-600 text-white"
            )}
            {getStatusButton(
              "reporte",
              "Reporté",
              <CalendarClock className="h-5 w-5" />,
              "bg-purple-500 hover:bg-purple-600 text-white"
            )}
            {getStatusButton(
              "annule",
              "Annulé",
              <Ban className="h-5 w-5" />,
              "bg-rose-500 hover:bg-rose-600 text-white"
            )}
          </div>

          {/* Date Picker for "reporte" status */}
          {selectedStatus === "reporte" && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="newDate" className="text-sm font-medium">
                Nouvelle date de prélèvement
              </Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? (
                      format(newDate, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={handleDateSelect}
                    disabled={date => {
                      // Disable past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedStatus ||
              isSubmitting ||
              (selectedStatus === "reporte" && !newDate)
            }
            className="rounded-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isSubmitting ? "En cours..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
