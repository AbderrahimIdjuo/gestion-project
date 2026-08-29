import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entrepots = await prisma.entrepots.findMany({
      orderBy: { nom: "asc" },
    });
    return NextResponse.json({ entrepots });
  } catch (error) {
    console.error("GET /api/entrepots:", error);
    return NextResponse.json(
      { message: "Erreur lors du chargement des entrepôts." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
    if (!nom) {
      return NextResponse.json(
        { message: "Le nom de l'entrepôt est requis." },
        { status: 400 }
      );
    }

    const result = await prisma.entrepots.create({ data: { nom } });
    return NextResponse.json({ result });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "Un entrepôt avec ce nom existe déjà." },
        { status: 409 }
      );
    }
    console.error("POST /api/entrepots:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de l'entrepôt." },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = body?.id;
    const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
    if (!id || !nom) {
      return NextResponse.json(
        { message: "Identifiant et nom requis." },
        { status: 400 }
      );
    }

    const result = await prisma.entrepots.update({
      where: { id },
      data: { nom },
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "Un entrepôt avec ce nom existe déjà." },
        { status: 409 }
      );
    }
    console.error("PUT /api/entrepots:", error);
    return NextResponse.json(
      { message: "Erreur lors de la modification de l'entrepôt." },
      { status: 500 }
    );
  }
}
