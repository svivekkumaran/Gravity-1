// ============================================
// MIGRATION SCRIPT: Add Unit Field to Old Bill Items
// Run this ONCE in browser console on the admin page
// ============================================

async function migrateOldBillsWithUnits() {
    console.log('🔄 Starting migration: Adding unit field to old bill items...');

    try {
        // Get all bills
        const bills = await DB.getAllBills();
        console.log(`📋 Found ${bills.length} total bills`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const bill of bills) {
            let billNeedsUpdate = false;
            const updatedItems = [];

            for (const item of bill.items) {
                // Check if item already has unit field
                if (item.unit) {
                    updatedItems.push(item);
                    continue;
                }

                // Item missing unit, look up product
                billNeedsUpdate = true;
                const product = await DB.getProductById(item.productId);

                if (product) {
                    // Add unit from product
                    updatedItems.push({
                        ...item,
                        unit: product.unit || 'units'
                    });
                    console.log(`  ✅ Added unit "${product.unit || 'units'}" to ${item.name} in bill ${bill.invoiceNo}`);
                } else {
                    // Product not found, use default
                    updatedItems.push({
                        ...item,
                        unit: 'units'
                    });
                    console.warn(`  ⚠️  Product not found for ${item.name}, using default "units"`);
                }
            }

            // Update bill if needed
            if (billNeedsUpdate) {
                await DB.updateBill(bill.id, {
                    ...bill,
                    items: updatedItems
                });
                updatedCount++;
                console.log(`✅ Updated bill ${bill.invoiceNo}`);
            } else {
                skippedCount++;
            }
        }

        console.log('\n✅ Migration completed!');
        console.log(`📊 Summary:`);
        console.log(`   - Total bills: ${bills.length}`);
        console.log(`   - Updated: ${updatedCount}`);
        console.log(`   - Already had units (skipped): ${skippedCount}`);

        return { success: true, total: bills.length, updated: updatedCount, skipped: skippedCount };

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return { success: false, error: error.message };
    }
}

// Auto-run the migration
console.log('🚀 Running migration script...\n');
migrateOldBillsWithUnits().then(result => {
    if (result.success) {
        console.log('\n🎉 Migration successful! You can now regenerate old invoices and they will show correct units.');
    } else {
        console.log('\n❌ Migration failed:', result.error);
    }
});
