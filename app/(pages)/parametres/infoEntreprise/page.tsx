"use client";

import { AddInfoEntrepriseForm } from "@/components/add-info-entreprise-form";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import SittingsSideBar from "@/components/sittingsSideBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function InfoEntreprise() {
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const info = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: async () => {
      const response = await axios.get("/api/infoEntreprise");
      const infoEntreprise = response.data.infoEntreprise;
      return infoEntreprise;
    },
  });

  useEffect(() => {
    console.log("info", info.data);
  }, [info]);

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen ">
        {/* Navbar - prend toute la largeur */}
        <Navbar />

        {/* Container principal avec sidebar et contenu */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Page content */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">
                    Informations de la société
                  </h1>
                </div>
                <div className="flex justify between gap-6 items-start">
                  <SittingsSideBar page={"infoEntreprise"} />
                  <div className="flex-col flex gap-3 w-[80%]">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setOpenDialog(true)}
                        className="rounded-full bg-orange-400 hover:bg-emerald-400"
                      >
                        {info.data
                          ? "Modifier les informations de la société"
                          : "Ajouter les informations de la société"}
                      </Button>
                    </div>
                    {info.data && (
                      <div className="rounded-lg border h-full w-full flex-grow-3 p-5">
                        <div className="flex gap-3 justify-between">
                          <div className="w-full grid grid-cols-1 my-4">
                            <Label
                              htmlFor="nom"
                              className="text-left mb-2 "
                            >
                              Raison sociale
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                              {info.data?.nom}
                            </span>
                          </div>
                          <div className="w-full grid grid-cols-1 my-4">
                            <Label
                              htmlFor="slogan"
                              className="text-left  mb-2"
                            >
                              Slogan
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                              {info.data?.slogan}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-between">
                          <div className="w-full grid grid-cols-1 my-4">
                            <Label
                              htmlFor="nom"
                              className="text-left  mb-2"
                            >
                              Téléphone
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                              {info.data?.telephone}
                            </span>
                          </div>
                          <div className="w-full grid grid-cols-1 my-4">
                            <Label
                              htmlFor="nom"
                              className="text-left mb-2"
                            >
                              Mobile
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                              {info.data?.mobile}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-between">
                          <div className="w-full grid grid-cols-1 my-4">
                            <Label
                              htmlFor="email"
                              className="text-left mb-2"
                            >
                              Email
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                              {info.data?.email}
                            </span>
                          </div>
                          <div className="w-full grid grid-cols-1 my-4">
                            <Label
                              htmlFor="adresse"
                              className="text-left mb-2"
                            >
                              Adresse
                            </Label>
                            <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                              {info.data?.adresse}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
