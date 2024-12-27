import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma"

export async function DELETE(req , {params}){
    const id = params.id
    
    const client = await prisma.clients.delete({
        where : {id}
    })
    return NextResponse.json(client)
    
}


