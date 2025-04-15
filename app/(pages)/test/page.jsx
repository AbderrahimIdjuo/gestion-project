"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { AddInfoEntrepriseForm } from "@/components/add-info-entreprise-form";
import SittingsSideBar from "@/components/sittingsSideBar";
import { useQuery } from "@tanstack/react-query";

export default function InfoEntreprise() {
  const [openDialog, setOpenDialog] = useState(false);
  const [infos, setInfos] = useState();

  const getInfoEntreprise = async () => {
    const response = await axios.get("/api/infoEntreprise");
    const infoEntreprise = response.data.infoEntreprise;
    setInfos(infoEntreprise);
  };

  useEffect(() => {
    getInfoEntreprise();
  }, []);

  useEffect(() => {
    console.log("infos", infos);
  }, [infos]);

  const info = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: async () => {
      const response = await axios.get("/api/infoEntreprise");
      const infoEntreprise = response.data.infoEntreprise;
      return infoEntreprise;
    },
  });
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const clients = useQuery({
    queryKey: ["clients", page, debouncedQuery],
    queryFn: async () => {
      const response = await axios.get("/api/clients", {
        params: {
          query: debouncedQuery,
          page,
        },
      });
      return response.data.clients;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });
  const categories = useQuery({
    queryKey: ["categories", page],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduitsTest", {
        params: {
          page,
        },
      });
      return response.data.categories;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log("clients", clients.data);
  }, [clients]);

  useEffect(() => {
    console.log("categories", categories.data);
  }, [categories]);
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Informations de la société</h1>
        </div>
        <div className="flex justify between gap-6 items-start">
          <div className="flex-col flex gap-3 w-[80%]">
            <div className="flex justify-end">
              <Button
                onClick={() => setOpenDialog(true)}
                className="rounded-full bg-orange-400 hover:bg-emerald-400"
              >
                {infos
                  ? "Modifier les informations de la société"
                  : "Ajouter les informations de la société"}
              </Button>
            </div>
            {infos && (
              <div className="rounded-lg border h-full w-full flex-grow-3 p-5">
                <div className="flex gap-3 justify-between">
                  <div className="w-full grid grid-cols-1 my-4">
                    <Label htmlFor="nom" className="text-left mb-2 mb-2">
                      Raison sociale
                    </Label>
                    <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                      {infos?.nom}
                    </span>
                  </div>
                  <div className="w-full grid grid-cols-1 my-4">
                    <Label htmlFor="slogan" className="text-left mb-2 mb-2">
                      Slogan
                    </Label>
                    <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                      {infos?.slogan}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 justify-between">
                  <div className="w-full grid grid-cols-1 my-4">
                    <Label htmlFor="nom" className="text-left mb-2 mb-2">
                      Téléphone
                    </Label>
                    <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                      {infos?.telephone}
                    </span>
                  </div>
                  <div className="w-full grid grid-cols-1 my-4">
                    <Label htmlFor="nom" className="text-left mb-2 mb-2">
                      Mobile
                    </Label>
                    <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                      {infos?.mobile}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 justify-between">
                  <div className="w-full grid grid-cols-1 my-4">
                    <Label htmlFor="email" className="text-left mb-2 mb-2">
                      Email
                    </Label>
                    <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                      {infos?.email}
                    </span>
                  </div>
                  <div className="w-full grid grid-cols-1 my-4">
                    <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                      Adresse
                    </Label>
                    <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                      {infos?.adresse}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AddInfoEntrepriseForm
        isOpen={openDialog}
        onClose={() => {
          setOpenDialog(false);
        }}
        onConfirm={() => {
          console.log("confirm dialog");
        }}
      />
    </>
  );
}
