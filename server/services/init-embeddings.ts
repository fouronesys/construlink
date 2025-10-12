import { db } from "../db";
import { suppliers, supplierSpecialties } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { generateSupplierEmbedding } from "./embedding-service";

export async function initializeEmbeddings() {
  try {
    console.log('🔍 Verificando embeddings de proveedores...');

    // Get suppliers without embeddings
    const suppliersWithoutEmbeddings = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.status, 'approved'),
          sql`${suppliers.searchEmbedding} IS NULL`
        )
      );

    if (suppliersWithoutEmbeddings.length === 0) {
      console.log('✅ Todos los proveedores aprobados ya tienen embeddings');
      return;
    }

    console.log(`📝 Generando embeddings para ${suppliersWithoutEmbeddings.length} proveedores...`);

    let successCount = 0;
    let errorCount = 0;

    for (const supplier of suppliersWithoutEmbeddings) {
      try {
        // Get specialties
        const specs = await db
          .select({ specialty: supplierSpecialties.specialty })
          .from(supplierSpecialties)
          .where(eq(supplierSpecialties.supplierId, supplier.id));

        const specialties = specs.map(s => s.specialty);

        // Generate embedding
        const embedding = await generateSupplierEmbedding(
          supplier.legalName,
          supplier.description,
          specialties,
          supplier.location
        );

        // Update supplier
        await db
          .update(suppliers)
          .set({ searchEmbedding: embedding as any })
          .where(eq(suppliers.id, supplier.id));

        successCount++;
        console.log(`  ✓ Embedding generado para: ${supplier.legalName}`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error generando embedding para ${supplier.legalName}:`, error);
      }
    }

    console.log(`✅ Proceso completado: ${successCount} exitosos, ${errorCount} errores`);
  } catch (error) {
    console.error('❌ Error inicializando embeddings:', error);
  }
}

export async function ensureSupplierEmbedding(supplierId: string) {
  try {
    // Check if supplier exists and get its data
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (supplier.length === 0) {
      return; // Doesn't exist
    }

    // Skip if already has embedding
    if (supplier[0].searchEmbedding) {
      return;
    }

    // Get specialties
    const specs = await db
      .select({ specialty: supplierSpecialties.specialty })
      .from(supplierSpecialties)
      .where(eq(supplierSpecialties.supplierId, supplierId));

    const specialties = specs.map(s => s.specialty);

    // Generate and update embedding
    const embedding = await generateSupplierEmbedding(
      supplier[0].legalName,
      supplier[0].description,
      specialties,
      supplier[0].location
    );

    await db
      .update(suppliers)
      .set({ searchEmbedding: embedding as any })
      .where(eq(suppliers.id, supplierId));

    console.log(`✓ Embedding generado para proveedor: ${supplier[0].legalName}`);
  } catch (error) {
    console.error(`Error generando embedding para proveedor ${supplierId}:`, error);
    throw error; // Re-throw to allow caller to handle
  }
}
