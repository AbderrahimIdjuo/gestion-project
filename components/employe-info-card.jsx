"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserRoundCog,
  Phone,
  MapPin,
  IdCard,
  HandCoins,
  ReceiptText,
} from "lucide-react";

export function EmployeInfoDialog({ employe, children }) {
  const [open, setOpen] = useState(false);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };
  function formatRIB(rib) {
    return `${rib.slice(0, 3)}  ${rib.slice(3, 6)}  ${rib.slice(
      6,
      19
    )}  ${rib.slice(19, 21)}`;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Informations de l&apos;employé</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${employe.nom}`}
                />
                <AvatarFallback>{getInitials(employe.nom)}</AvatarFallback>
              </Avatar>
              <h2 className="text-3xl font-bold">
                {employe.nom.toUpperCase()}
              </h2>
              {employe.entreprise && (
                <p className="text-sm text-muted-foreground">
                  {employe.entreprise}
                </p>
              )}
            </div>
            <div className="space-y-4">
              {employe.telephone && (
                <div className="flex items-center text-xl">
                  <Phone className="w-8 h-8 mr-2 text-muted-foreground" />
                  <span>{employe.telephone}</span>
                </div>
              )}
              {employe.cin && (
                <div className="flex items-center text-xl">
                  <IdCard className="w-8 h-8 mr-2 text-muted-foreground" />
                  <span>{employe.cin}</span>
                </div>
              )}
              {employe.role && (
                <div className="flex items-center text-xl">
                  <UserRoundCog className="w-8 h-8 mr-2 text-muted-foreground" />
                  <span>{employe.role}</span>
                </div>
              )}
              {employe.adresse && (
                <div className="flex items-center text-xl">
                  <MapPin className="w-8 h-8 mr-2 text-muted-foreground" />
                  <span>{employe.adresse}</span>
                </div>
              )}
              {employe.salaire && (
                <div className="flex items-center text-xl">
                  <HandCoins className="w-8 h-8 mr-2 text-muted-foreground" />
                  <span>{employe.salaire}</span>
                </div>
              )}
              {employe.rib && (
                <div className="flex items-center text-xl">
                  <ReceiptText className="w-8 h-8 mr-2 text-muted-foreground" />
                  <span>{formatRIB(employe.rib)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
