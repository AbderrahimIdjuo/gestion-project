"use client";

import Spinner from "@/components/customUi/Spinner";
import PeriodeFilter from "@/components/customUi/periode-filter";
import { LoadingDots } from "@/components/loading-dots";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { getDateRangeFromPeriode } from "@/lib/periode";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronDown, FileText, Printer, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("fr-FR");
}

const getStatutColor = statut => {
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

const statutPaiementBadge = devis => {
  if (!devis?.statutPaiement)
    return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
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

const totalBlFourniture = produits =>
  produits?.reduce(
    (acc, p) => acc + (p.quantite || 0) * (p.prixUnite || 0),
    0
  ) ?? 0;

const totalFourniture = group =>
  group?.reduce((acc, item) => {
    const type = item?.bonLivraison?.type;
    if (type === "achats") return acc + totalBlFourniture(item.produits);
    if (type === "retour") return acc - totalBlFourniture(item.produits);
    return acc;
  }, 0) ?? 0;

export default function DevisRapportDialog({
  embedded = false,
  onBack,
  onClose,
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [commercant, setCommercant] = useState("all");
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [debouncedClientQuery, setDebouncedClientQuery] = useState("");
  const [periode, setPeriode] = useState("");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [statutPaiement, setStatutPaiement] = useState([]);
  const [statut, setStatut] = useState([]);
  const [pourcentageBenefice, setPourcentageBenefice] = useState("");
  const { ref: clientsInViewRef, inView: clientsInView } = useInView();

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);

  const handleStatutPaiementChange = (value, checked) => {
    setStatutPaiement(prev =>
      checked ? [...prev, value] : prev.filter(s => s !== value)
    );
  };
  const handleStatutChange = (value, checked) => {
    setStatut(prev =>
      checked ? [...prev, value] : prev.filter(s => s !== value)
    );
  };
  const removeStatutPaiement = value => {
    setStatutPaiement(prev => prev.filter(s => s !== value));
  };
  const removeStatut = value => {
    setStatut(prev => prev.filter(s => s !== value));
  };

  const toggleClient = (client, checked) => {
    setSelectedClients(prev => {
      if (checked) {
        if (prev.some(c => c.id === client.id)) return prev;
        return [...prev, { id: client.id, nom: client.nom }];
      }
      return prev.filter(c => c.id !== client.id);
    });
  };

  const removeClient = id => {
    setSelectedClients(prev => prev.filter(c => c.id !== id));
  };

  const reset = () => {
    setStep(1);
    setCommercant("all");
    setSelectedClients([]);
    setClientSearchQuery("");
    setDebouncedClientQuery("");
    setPeriode("");
    setStartDate(undefined);
    setEndDate(undefined);
    setStatutPaiement([]);
    setStatut([]);
    setPourcentageBenefice("");
  };

  useEffect(() => {
    if (!embedded && !open) reset();
  }, [open, embedded]);

  const handleCancel = () => {
    if (embedded && onClose) {
      onClose();
    } else {
      setOpen(false);
      reset();
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedClientQuery(clientSearchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [clientSearchQuery]);

  const commercantsQuery = useQuery({
    queryKey: ["commercants-rapport"],
    queryFn: async () => {
      const res = await axios.get("/api/employes/managersList");
      return res.data.employes || [];
    },
    enabled: embedded || open,
  });

  const clientsQuery = useInfiniteQuery({
    queryKey: ["clients-rapport-select", debouncedClientQuery],
    queryFn: async ({ pageParam = null }) => {
      const response = await axios.get("/api/clients/clientsList", {
        params: {
          limit: 20,
          query: debouncedClientQuery,
          cursor: pageParam,
        },
      });
      return response.data;
    },
    getNextPageParam: lastPage => lastPage.nextCursor || null,
    keepPreviousData: true,
    enabled: (embedded || open) && step === 1,
  });

  const clientsList =
    clientsQuery.data?.pages.flatMap(page => page.clients) || [];

  useEffect(() => {
    if (clientsInView && clientsQuery.hasNextPage) {
      clientsQuery.fetchNextPage();
    }
  }, [clientsInView, clientsQuery.hasNextPage, clientsQuery.fetchNextPage]);

  const selectedClientIds = selectedClients.map(c => c.id);

  const rapportQuery = useQuery({
    queryKey: [
      "devis-rapport",
      commercant,
      selectedClientIds,
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
        clientIds:
          selectedClientIds.length > 0
            ? selectedClientIds.join(",")
            : undefined,
        dateStartFrom: from?.toISOString?.() ?? undefined,
        dateStartTo: to?.toISOString?.() ?? undefined,
        statutPaiement:
          statutPaiement.length > 0 ? statutPaiement.join("-") : undefined,
        statut: statut.length > 0 ? statut.join("-") : undefined,
      };
      const res = await axios.get("/api/devis", { params });
      return res.data;
    },
    enabled: step === 2 && (embedded || open) && !!periode,
  });

  const devis = rapportQuery.data?.devis ?? [];
  const bLGroupsList = rapportQuery.data?.bLGroupsList ?? [];

  const filteredOrders = useCallback(
    numero => bLGroupsList.filter(o => o.devisNumero === numero),
    [bLGroupsList]
  );

  const totals = useCallback(() => {
    let montantTotalDevis = 0;
    let montantTotalPaye = 0;
    let totalMarge = 0;
    devis.forEach(d => {
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

  const content = (
    <>
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
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* 1. Période */}
              <PeriodeFilter
                periode={periode}
                onPeriodeChange={setPeriode}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                includeToutes={false}
                id="periode-devis-rapport"
              />

              {/* 2. Statut */}
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
                          statut.map(v => {
                            const opt = statutOptions.find(o => o.value === v);
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
                                  onClick={e => {
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
                          onCheckedChange={checked => {
                            if (checked === true) {
                              setStatut(statutOptions.map(o => o.value));
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
                      {statutOptions.map(opt => (
                        <div
                          key={opt.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`st-${opt.value}`}
                            checked={statut.includes(opt.value)}
                            onCheckedChange={checked =>
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

              {/* 3. Statut de paiement */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Statut de paiement
                </Label>
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
                          statutPaiement.map(v => {
                            const opt = statutPaiementOptions.find(
                              o => o.value === v
                            );
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
                                  onClick={e => {
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
                          checked={
                            statutPaiement.length ===
                            statutPaiementOptions.length
                          }
                          onCheckedChange={checked => {
                            if (checked === true) {
                              setStatutPaiement(
                                statutPaiementOptions.map(o => o.value)
                              );
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
                      {statutPaiementOptions.map(opt => (
                        <div
                          key={opt.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`sp-${opt.value}`}
                            checked={statutPaiement.includes(opt.value)}
                            onCheckedChange={checked =>
                              handleStatutPaiementChange(
                                opt.value,
                                checked === true
                              )
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

              {/* 4. Clients */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Clients</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-white min-h-10 h-auto"
                    >
                      <div className="flex flex-wrap gap-1">
                        {selectedClients.length === 0 ? (
                          <span className="text-muted-foreground">
                            Tous les clients
                          </span>
                        ) : (
                          selectedClients.map(c => (
                            <Badge
                              key={c.id}
                              variant="secondary"
                              className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                            >
                              {c.nom}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                onClick={e => {
                                  e.stopPropagation();
                                  removeClient(c.id);
                                }}
                              />
                            </Badge>
                          ))
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-3"
                    align="start"
                  >
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher un client…"
                          value={clientSearchQuery}
                          onChange={e => setClientSearchQuery(e.target.value)}
                          className="pl-8 h-9 focus-visible:ring-purple-500"
                        />
                      </div>
                      {selectedClients.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => setSelectedClients([])}
                        >
                          Effacer la sélection
                        </Button>
                      )}
                      <ScrollArea className="h-56">
                        <div className="space-y-2 pr-2">
                          {clientsQuery.isLoading ? (
                            <div className="flex justify-center py-6">
                              <LoadingDots size={6} />
                            </div>
                          ) : clientsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                              Aucun client trouvé
                            </p>
                          ) : (
                            <>
                              {clientsList.map(client => (
                                <div
                                  key={client.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`client-${client.id}`}
                                    checked={selectedClients.some(
                                      c => c.id === client.id
                                    )}
                                    onCheckedChange={checked =>
                                      toggleClient(client, checked === true)
                                    }
                                  />
                                  <Label
                                    htmlFor={`client-${client.id}`}
                                    className="text-sm font-medium cursor-pointer flex-1 truncate"
                                  >
                                    {client.nom}
                                  </Label>
                                </div>
                              ))}
                              <div ref={clientsInViewRef} className="h-4" />
                              {clientsQuery.isFetchingNextPage && (
                                <div className="flex justify-center py-2">
                                  <LoadingDots size={5} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 5. Commerçant */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Commerçant</Label>
                <Select value={commercant} onValueChange={setCommercant}>
                  <SelectTrigger className="h-10 w-full bg-white focus:ring-2 focus:ring-purple-500">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {(commercantsQuery.data || []).map(c => (
                      <SelectItem key={c.id} value={c.nom}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Pourcentage */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Pourcentage de bénéfice (%)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 25"
                  value={pourcentageBenefice}
                  onChange={e => setPourcentageBenefice(e.target.value)}
                  className="h-10 focus-visible:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 print:hidden">
              {embedded && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="rounded-full"
                >
                  Retour
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Commerçant
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {commercant === "all" ? "Tous" : commercant}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Clients
                    </p>
                    <p className="text-sm font-semibold text-foreground line-clamp-2">
                      {selectedClients.length === 0
                        ? "Tous"
                        : selectedClients.map(c => c.nom).join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total devis
                    </p>
                    <p className="text-lg font-semibold text-fuchsia-600">
                      {formatCurrency(t?.montantTotalDevis ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total payé
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(t?.montantTotalPaye ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Restant à payer
                    </p>
                    <p className="text-lg font-semibold text-amber-600">
                      {formatCurrency(t?.montantTotalRestant ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total marge
                    </p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(t?.totalMarge ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      % bénéfice (saisi)
                    </p>
                    <p className="text-lg font-semibold">
                      {t?.pctBenefice != null ? `${t.pctBenefice}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Bénéfice (marge × %)
                    </p>
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
                      {devis.map(d => {
                        const fourn = totalFourniture(filteredOrders(d.numero));
                        const marge = (Number(d.total) || 0) - fourn;
                        const reste =
                          (Number(d.total) || 0) - (Number(d.totalPaye) || 0);
                        return (
                          <TableRow key={d.id}>
                            <TableCell>{formatDate(d.date)}</TableCell>
                            <TableCell className="font-medium">
                              {d.numero}
                            </TableCell>
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
                                  getStatutColor(d.statut) ??
                                  "bg-gray-100 text-gray-700"
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
                        clients: selectedClients,
                        periode,
                        from: from?.toISOString?.() ?? null,
                        to: to?.toISOString?.() ?? null,
                      };
                      localStorage.setItem(
                        "devis-rapport",
                        JSON.stringify(payload)
                      );
                      window.open("/ventes/devis/impressionRapport", "_blank");
                    }}
                    className="rounded-full"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer
                  </Button>
                  <Button
                    className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                    onClick={handleCancel}
                  >
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport devis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] max-h-[900vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
        {content}
      </DialogContent>
    </Dialog>
  );
}
