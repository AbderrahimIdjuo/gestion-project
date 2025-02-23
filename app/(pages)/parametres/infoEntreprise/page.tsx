"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import CustomTooltip from "@/components/customUi/customTooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomPagination from "@/components/customUi/customPagination";
import { Info, Landmark, Tags, List, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavItem from "@/components/customUi/customNavItem";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/customUi/styledButton";
import SittingsSideBar from "@/components/sittingsSideBar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
export default function infoEntreprise() {
  const infoEntrepriseSchema = z.object({
    name: z.string(),
    telephone: z.preprocess((telephone) => {
      // If telephone is empty or undefined, return null
      return telephone === "" ? null : telephone;
    }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres")),
    email: z.string().email("Email invalide"),
    adresse: z.string(),
  });
  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(infoEntrepriseSchema),
  });
  return (
    <>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Informations de la société</h1>
        </div>

        <div className="grid grid-cols-4 gap-2 items-start">
          <SittingsSideBar page={"infoEntreprise"} />
          <div className="rounded-lg border h-full w-full col-span-3 p-5">
            <div className="w-full grid grid-cols-1 my-4">
              <Label htmlFor="name" className="text-left mb-2 mb-2">
                Logo
              </Label>
              <div className="w-full">
                <Input
                  id="name"
                  {...register("name")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.name && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="w-full grid grid-cols-1 my-4">
              <Label htmlFor="name" className="text-left mb-2 mb-2">
                Raison sociale
              </Label>
              <div className="w-full">
                <Input
                  id="name"
                  {...register("name")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.name && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-between">
              <div className="w-full grid grid-cols-1 my-4">
                <Label htmlFor="telephone" className="text-left mb-2 mb-2">
                  téléphone
                </Label>
                <div className="w-full">
                  <Input
                    id="telephone"
                    {...register("telephone")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.telephone && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="w-full grid grid-cols-1 my-4">
                <Label htmlFor="email" className="text-left mb-2 mb-2">
                  Email
                </Label>
                <div className="w-full">
                  <Input
                    id="email"
                    {...register("email")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.email && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-between">
              <div className="w-full grid grid-cols-1 my-4 flex-grow-2">
                <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                  Adresse
                </Label>
                <div className="w-full">
                  <Input
                    id="adresse"
                    {...register("adresse")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.adresse && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="w-full grid grid-cols-1 my-4 flex-grow-1">
                <Label htmlFor="ville" className="text-left mb-2 mb-2">
                  Ville
                </Label>
                <div className="w-full">
                  <Input
                    id="ville"
                    {...register("ville")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.ville && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end my-4">
              <SaveButton
                onClick={() => {
                  console.log("save");
                }}
                disabled={isSubmitting}
                type="submit"
                title="Enregistrer"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
