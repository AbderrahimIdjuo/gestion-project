import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  console.log("the route is fired");
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet data to JSON
    const data = XLSX.utils.sheet_to_json(sheet);

    // Format data to match Prisma schema
    const clients = data.map((row) => ({
      id: row.id || undefined, // Prisma will generate a UUID if not provided
      nom: row.nom,
      email: row.email || null,
      telephone: row.telephone.toString() || null,
      adresse: row.adresse || null,
      ice: row.ice || null,
    }));

    // Insert into database
    await prisma.clients.createMany({ data: clients });

    return NextResponse.json({ message: "Import successful" }, { status: 200 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
