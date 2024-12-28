import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma"

export async function DELETE(req , {params}){
    const id = params.id
    
    const fournisseur = await prisma.fournisseurs.delete({
        where : {id}
    })
    return NextResponse.json(fournisseur)
    
}


