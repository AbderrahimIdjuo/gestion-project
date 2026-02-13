"use client";

import Spinner from "@/components/customUi/Spinner";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subQuarters,
  subYears,
} from "date-fns";
import { ChevronDown, FileText, Printer, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("fr-FR");
}

const getStatutColor = (statut) => {
  switch (statut) {
    case "En attente":
      return "bg-amber-100 text-amber-700";
    case "Accepté":
      return "bg-green-100 text-green-700";
    case "Annulé":
      return "bg-red-100 text-red-700";
    case "Terminer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const statutPaiementBadge = (devis) => {
  if (!devis?.statutPaiement) return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
  switch (devis.statutPaiement) {
    case "paye":
      return { lable: "Payé", color: "bg-green-100 text-green-600" };
    case "enPartie":
      return { lable: "En partie", color: "bg-orange-100 text-orange-500" };
    case "impaye":
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
    default:
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
  }
};

const totalBlFourniture = (produits) =>
  produits?.reduce((acc, p) => acc + (p.quantite || 0) * (p.prixUnite || 0), 0) ?? 0;

const totalFourniture = (group) =>
  group?.reduce((acc, item) => {
    const type = item?.bonLivraison?.type;
    if (type === "achats") return acc + totalBlFourniture(item.produits);
    if (type === "retour") return acc - totalBlFourniture(item.produits);
    return acc;
  }, 0) ?? 0;

function getDateRangeFromPeriode(periode, startDate, endDate) {
  const now = new Date();
  switch (periode) {
    case "aujourd'hui":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "ce-mois":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "mois-dernier": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "trimestre-actuel":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "trimestre-precedent": {
      const prevQuarter = subQuarters(now, 1);
      return { from: startOfQuarter(prevQuarter), to: endOfQuarter(prevQuarter) };
    }
    case "cette-annee":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "annee-derniere": {
      const lastYear = subYears(now, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    }
    case "personnalisee":
      return {
        from: startDate ? new Date(startDate) : null,
        to: endDate ? new Date(endDate) : null,
      };
    default:
      return { from: null, to: null };
  }
}

export default function DevisRapportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [commercant, setCommercant] = useState("all");
  const [periode, setPeriode] = useState("");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [statutPaiement, setStatutPaiement] = useState([]);
  const [statut, setStatut] = useState([]);
  const [pourcentageBenefice, setPourcentageBenefice] = useState("");

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);

  const handleStatutPaiementChange = (value, checked) => {
    setStatutPaiement((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value)
    );
  };
  const handleStatutChange = (value, checked) => {
    setStatut((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value)
    );
  };
  const removeStatutPaiement = (value) => {
    setStatutPaiement((prev) => prev.filter((s) => s !== value));
  };
  const removeStatut = (value) => {
    setStatut((prev) => prev.filter((s) => s !== value));
  };

  const reset = () => {
    setStep(1);
    setCommercant("all");
    setPeriode("");
    setStartDate(undefined);
    setEndDate(undefined);
    setStatutPaiement([]);
    setStatut([]);
    setPourcentageBenefice("");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const commercantsQuery = useQuery({
    queryKey: ["commercants-rapport"],
    queryFn: async () => {
      const res = await axios.get("/api/employes/managersList");
      return res.data.employes || [];
    },
    enabled: open,
  });

  const rapportQuery = useQuery({
    queryKey: [
      "devis-rapport",
      commercant,
      periode,
      startDate,
      endDate,
      from,
      to,
      statutPaiement,
      statut,
    ],
    queryFn: async () => {
      const params = {
        limit: 9999,
        commercant: commercant !== "all" ? commercant : undefined,
        dateStartFrom: from?.toISOString?.() ?? undefined,
        dateStartTo: to?.toISOString?.() ?? undefined,
        statutPaiement:
          statutPaiement.length > 0 ? statutPaiement.join("-") : undefined,
        statut: statut.length > 0 ? statut.join("-") : undefined,
      };
      const res = await axios.get("/api/devis", { params });
      return res.data;
    },
    enabled: step === 2 && open && !!periode,
  });

  const devis = rapportQuery.data?.devis ?? [];
  const bLGroupsList = rapportQuery.data?.bLGroupsList ?? [];

  const filteredOrders = useCallback(
    (numero) => bLGroupsList.filter((o) => o.devisNumero === numero),
    [bLGroupsList]
  );

  const totals = useCallback(() => {
    let montantTotalDevis = 0;
    let montantTotalPaye = 0;
    let totalMarge = 0;
    devis.forEach((d) => {
      montantTotalDevis += Number(d.total) || 0;
      montantTotalPaye += Number(d.totalPaye) || 0;
      const fourn = totalFourniture(filteredOrders(d.numero));
      totalMarge += (Number(d.total) || 0) - fourn;
    });
    const montantTotalRestant = montantTotalDevis - montantTotalPaye;
    const pctBenefice = parseFloat(pourcentageBenefice) || 0;
    const beneficeFromMarge = (pctBenefice / 100) * totalMarge;
    return {
      montantTotalDevis,
      montantTotalPaye,
      montantTotalRestant,
      totalMarge,
      pctBenefice,
      beneficeFromMarge,
    };
  }, [devis, filteredOrders, pourcentageBenefice]);

  const t = step === 2 && rapportQuery.data ? totals() : null;

  const statutPaiementOptions = [
    { value: "paye", label: "Payé", color: "green" },
    { value: "impaye", label: "Impayé", color: "slate" },
    { value: "enPartie", label: "En partie", color: "amber" },
  ];
  const statutOptions = [
    { value: "En attente", label: "En attente", color: "amber" },
    { value: "Accepté", label: "Accepté", color: "green" },
    { value: "Annulé", label: "Annulé", color: "red" },
    { value: "Terminer", label: "Terminer", color: "purple" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport devis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] max-h-[900vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-purple-600" />
            {step === 1 ? "Rapport devis" : "Aperçu du rapport"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Remplissez les informations ci-dessous pour créer votre rapport."
              : "Montants agrégés et liste des devis correspondants."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div
              className={`grid grid-cols-2 gap-4 ${periode === "personnalisee" ? "grid-cols-3" : ""}`}
            >
              <div className="grid gap-2">
                <Label>Commerçant</Label>
                <Select value={commercant} onValueChange={setCommercant}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {(commercantsQuery.data || []).map((c) => (
                      <SelectItem key={c.id} value={c.nom}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="periode" className="text-sm font-medium">
                  Période (date de début)
                </Label>
                <Select value={periode} onValueChange={setPeriode}>
                  <SelectTrigger id="periode" className="focus:ring-2 focus:ring-purple-500">
                    <SelectValue placeholder="Sélectionnez la période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aujourd'hui">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="ce-mois">Ce mois</SelectItem>
                    <SelectItem value="mois-dernier">Le mois dernier</SelectItem>
                    <SelectItem value="trimestre-actuel">Trimestre actuel</SelectItem>
                    <SelectItem value="trimestre-precedent">Trimestre précédent</SelectItem>
                    <SelectItem value="cette-annee">Cette année</SelectItem>
                    <SelectItem value="annee-derniere">L&apos;année dernière</SelectItem>
                    <SelectItem value="personnalisee">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {periode === "personnalisee" && (
                <div className="grid gap-2">
                  <Label className="text-left text-black">Date</Label>
                  <CustomDateRangePicker
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Statut de paiement</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <div className="flex flex-wrap gap-1">
                        {statutPaiement.length === 0 ? (
                          <span className="text-muted-foreground">
                            Sélectionner les statuts
                          </span>
                        ) : (
                          statutPaiement.map((v) => {
                            const opt = statutPaiementOptions.find((o) => o.value === v);
                            const label = opt?.label ?? v;
                            return (
                              <Badge
                                key={v}
                                variant="secondary"
                                className={`text-xs ${
                                  v === "paye"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : v === "impaye"
                                    ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }`}
                              >
                                {label}
                                <X
                                  className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStatutPaiement(v);
                                  }}
                                />
                              </Badge>
                            );
                          })
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-3" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="sp-tous"
                          checked={statutPaiement.length === statutPaiementOptions.length}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setStatutPaiement(statutPaiementOptions.map((o) => o.value));
                            } else {
                              setStatutPaiement([]);
                            }
                          }}
                        />
                        <Label
                          htmlFor="sp-tous"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Tous
                        </Label>
                      </div>
                      {statutPaiementOptions.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sp-${opt.value}`}
                            checked={statutPaiement.includes(opt.value)}
                            onCheckedChange={(checked) =>
                              handleStatutPaiementChange(opt.value, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`sp-${opt.value}`}
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                opt.color === "green"
                                  ? "bg-green-500"
                                  : opt.color === "slate"
                                  ? "bg-slate-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Statut</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <div className="flex flex-wrap gap-1">
                        {statut.length === 0 ? (
                          <span className="text-muted-foreground">
                            Sélectionner les statuts
                          </span>
                        ) : (
                          statut.map((v) => {
                            const opt = statutOptions.find((o) => o.value === v);
                            const label = opt?.label ?? v;
                            return (
                              <Badge
                                key={v}
                                variant="secondary"
                                className={`text-xs ${
                                  v === "En attente"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    : v === "Accepté"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : v === "Annulé"
                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                }`}
                              >
                                {label}
                                <X
                                  className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStatut(v);
                                  }}
                                />
                              </Badge>
                            );
                          })
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-3" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="st-tous"
                          checked={statut.length === statutOptions.length}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setStatut(statutOptions.map((o) => o.value));
                            } else {
                              setStatut([]);
                            }
                          }}
                        />
                        <Label
                          htmlFor="st-tous"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Tous
                        </Label>
                      </div>
                      {statutOptions.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`st-${opt.value}`}
                            checked={statut.includes(opt.value)}
                            onCheckedChange={(checked) =>
                              handleStatutChange(opt.value, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`st-${opt.value}`}
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                opt.color === "amber"
                                  ? "bg-amber-500"
                                  : opt.color === "green"
                                  ? "bg-green-500"
                                  : opt.color === "red"
                                  ? "bg-red-500"
                                  : "bg-purple-500"
                              }`}
                            />
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Pourcentage de bénéfice (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 25"
                  value={pourcentageBenefice}
                  onChange={(e) => setPourcentageBenefice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={
                  !periode ||
                  (periode === "personnalisee" && (!startDate || !endDate))
                }
                type="button"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            {rapportQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
                <Spinner className="w-10 h-10 border-2 border-purple-200 border-t-purple-600" />
                <p className="text-sm font-medium">Chargement…</p>
              </div>
            ) : (
              <>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Commerçant</p>
                    <p className="text-lg font-semibold text-foreground">
                      {commercant === "all" ? "Tous" : commercant}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total devis</p>
                    <p className="text-lg font-semibold text-fuchsia-600">
                      {formatCurrency(t?.montantTotalDevis ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total payé</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(t?.montantTotalPaye ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Restant à payer</p>
                    <p className="text-lg font-semibold text-amber-600">
                      {formatCurrency(t?.montantTotalRestant ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total marge</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(t?.totalMarge ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">% bénéfice (saisi)</p>
                    <p className="text-lg font-semibold">
                      {t?.pctBenefice != null ? `${t.pctBenefice}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Bénéfice (marge × %)</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(t?.beneficeFromMarge ?? 0)}
                    </p>
                  </div>
                </div>



                <div className="rounded-md border overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>N°</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead className="text-right">Reste</TableHead>
                        <TableHead className="text-right">Marge</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Statut paiement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devis.map((d) => {
                        const fourn = totalFourniture(filteredOrders(d.numero));
                        const marge = (Number(d.total) || 0) - fourn;
                        const reste = (Number(d.total) || 0) - (Number(d.totalPaye) || 0);
                        return (
                          <TableRow key={d.id}>
                            <TableCell>{formatDate(d.date)}</TableCell>
                            <TableCell className="font-medium">{d.numero}</TableCell>
                            <TableCell>{d.client?.nom ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(d.total)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(d.totalPaye)}
                            </TableCell>
                            <TableCell className="text-right text-amber-600">
                              {formatCurrency(reste)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              {formatCurrency(marge)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  getStatutColor(d.statut) ?? "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {d.statut ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  statutPaiementBadge(d)?.color
                                }`}
                              >
                                {statutPaiementBadge(d)?.lable}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-3 pt-2 print:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-full"
                  >
                    Retour
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const payload = {
                        devis,
                        bLGroupsList,
                        totals: t ?? {},
                        commercant,
                        periode,
                        from: from?.toISOString?.() ?? null,
                        to: to?.toISOString?.() ?? null,
                      };
                      localStorage.setItem("devis-rapport", JSON.stringify(payload));
                      window.open("/ventes/devis/impressionRapport", "_blank");
                    }}
                    className="rounded-full"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer
                  </Button>
                  <Button
                    className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                    onClick={() => setOpen(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
