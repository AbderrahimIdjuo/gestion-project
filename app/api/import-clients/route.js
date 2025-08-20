import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
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

    // Parse Excel file using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    if (!worksheet) {
      return NextResponse.json({ error: "No worksheet found" }, { status: 400 });
    }

    // Convert sheet data to JSON
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value;
        if (header) {
          rowData[header] = cell.value;
        }
      });
      
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });

    // Format data to match Prisma schema
    const clients = data.map((row) => ({
      id: row.id || undefined, // Prisma will generate a UUID if not provided
      nom: row.nom,
      email: row.email || null,
      telephone:
        row.telephone !== undefined && row.telephone !== null
          ? row.telephone.toString()
          : null,
      adresse: row.adresse  || null,
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
