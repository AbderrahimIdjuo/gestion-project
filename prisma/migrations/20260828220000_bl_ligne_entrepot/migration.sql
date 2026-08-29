-- AlterTable
ALTER TABLE "BlGroupsProduits" ADD COLUMN "entrepotId" TEXT;

-- AddForeignKey
ALTER TABLE "BlGroupsProduits" ADD CONSTRAINT "BlGroupsProduits_entrepotId_fkey" FOREIGN KEY ("entrepotId") REFERENCES "Entrepots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
