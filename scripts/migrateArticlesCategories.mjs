import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateItemsCategories() {
  try {
    console.log("🚀 Starting items category migration...");

    // Load all items
    console.log("📖 Loading items from database...");
    const items = await prisma.items.findMany({
      select: {
        id: true,
        designation: true,
        categorie: true,
        categorieId: true,
      },
    });

    console.log(`📦 Found ${items.length} items to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each item
    for (const item of items) {
      try {
        // Skip items with null/empty categorie or already has categorieId
        if (
          !item.categorie ||
          item.categorie.trim() === "" ||
          item.categorieId
        ) {
          skippedCount++;
          continue;
        }

        const categorieName = item.categorie.trim();

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

        // Update the item with categorieId
        await prisma.items.update({
          where: {
            id: item.id,
          },
          data: {
            categorieId: categorie.id,
          },
        });

        updatedCount++;
        console.log(
          `✅ Updated item "${item.designation}" with category "${categorieName}" (ID: ${categorie.id})`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error processing item "${item.designation}":`,
          error.message
        );
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Updated: ${updatedCount} items`);
    console.log(`   ⏭️  Skipped: ${skippedCount} items`);
    console.log(`   ❌ Errors: ${errorCount} items`);
    console.log("\n✨ Migration completed!");
  } catch (error) {
    console.error("💥 Fatal error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateItemsCategories()
  .then(() => {
    console.log("🎉 Migration script finished successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
