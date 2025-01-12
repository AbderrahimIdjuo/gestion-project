"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, CreditCard } from "lucide-react";

export function ClientInfoCard({ client }) {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };
  return (
    <Card className="w-full h-auto !border-0 !shadow-0">
      <CardContent className="grid grid-cols-4 gap-5 p-2">
        <div className="flex flex-col justify-center items-center">
          <Avatar className="w-16 h-16 mb-4">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.nom}`}
            />
            <AvatarFallback>{getInitials(client.nom)}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{client.nom.toUpperCase()}</h2>
          {client.entreprise && (
            <p className="text-sm text-muted-foreground">{client.entreprise}</p>
          )}
        </div>
        <div className="col-span-3  grid container-[1000px]:grid-cols-4 container-[300px]:grid-rows-4 lg:grid-cols-4 space-y-4">
          <div className="flex  justify-center gap-2 items-center">
            {client.email && (
              <>
                <Mail className="w-5 h-5 mr-2 text-muted-foreground" />
                <span>{client.email}</span>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 items-center">
            {client.telephone && (
              <>
                <Phone className="w-5 h-5 mr-2 text-muted-foreground" />
                <span>{client.telephone}</span>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 items-center">
            {client.adresse && (
              <>
                <MapPin className="w-5 h-5 mr-2 text-muted-foreground" />
                <span>{client.adresse}</span>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 items-center">
            <CreditCard className="w-5 h-5 mr-2 text-muted-foreground" />
            <span>Crédit : 1500 DH</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
