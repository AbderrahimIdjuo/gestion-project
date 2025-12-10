import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCategories() {
  try {
    console.log('🚀 Starting category migration...');

    // Load all products
    const produits = await prisma.produits.findMany({
      select: {
        id: true,
        designation: true,
        categorie: true,
        categorieId: true,
      },
    });

    console.log(`📦 Found ${produits.length} products to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each product
    for (const produit of produits) {
      try {
        // Skip products with null/empty categorie or already has categorieId
        if (!produit.categorie || produit.categorie.trim() === '' || produit.categorieId) {
          skippedCount++;
          continue;
        }

        const categorieName = produit.categorie.trim();

        // Find or create the category
        let categorie = await prisma.categoriesProduits.findFirst({
          where: {
            categorie: categorieName,
          },
        });

        // If category doesn't exist, create it
        if (!categorie) {
          categorie = await prisma.categoriesProduits.create({
            data: {
              categorie: categorieName,
            },
          });
        }

        // Update the product with categorieId
        await prisma.produits.update({
          where: {
            id: produit.id,
          },
          data: {
            categorieId: categorie.id,
          },
        });

        updatedCount++;
        console.log(
          `✅ Updated product "${produit.designation}" with category "${categorieName}" (ID: ${categorie.id})`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error processing product "${produit.designation}":`,
          error.message
        );
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    console.log('\n✨ Migration completed!');
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCategories()
  .then(() => {
    console.log('🎉 Migration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });

