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
import { Mail, Phone, MapPin, CreditCard } from "lucide-react";

export function ClientInfoDialog({ client, children }) {
  const [open, setOpen] = useState(false);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Informations du client</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.nom}`}
                />
                <AvatarFallback>{getInitials(client.nom)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{client.nom.toUpperCase()}</h2>
              {client.entreprise && (
                <p className="text-sm text-muted-foreground">
                  {client.entreprise}
                </p>
              )}
            </div>
            <div className="space-y-4">
              {client.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span>{client.telephone}</span>
                </div>
              )}
              {client.adresse && (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span>{client.adresse}</span>
                </div>
              )}

              {/* <div className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-muted-foreground" />
                <span>Crédit : 1500 DH</span>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
