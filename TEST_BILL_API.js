// Test script to verify the bills API is working correctly
// Run this in the browser console while logged in to test bill creation

async function testBillCreation() {
    console.log('Testing bill creation with billed_by and igst fields...');

    // Get current user
    const currentUser = Auth.getCurrentUser();
    console.log('Current user:', currentUser);

    if (!currentUser) {
        console.error('ERROR: No user logged in!');
        return;
    }

    if (!currentUser.name) {
        console.error('ERROR: User object missing name property!');
        console.log('User object:', currentUser);
        return;
    }

    // Create test bill data
    const testBillData = {
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        items: [
            {
                productId: 'test_prod',
                name: 'Test Product',
                qty: 1,
                price: 100,
                gstRate: 18
            }
        ],
        subtotal: 100,
        cgst: 9,
        sgst: 9,
        igst: 0,
        total: 118,
        billedBy: currentUser.name
    };

    console.log('Test bill data:', testBillData);

    try {
        const response = await fetch('/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testBillData)
        });

        console.log('Response status:', response.status);

        const result = await response.json();
        console.log('Response data:', result);

        if (response.ok) {
            console.log('✅ SUCCESS! Bill created with billed_by:', result.billedBy);
        } else {
            console.error('❌ ERROR:', result.error);
        }
    } catch (error) {
        console.error('❌ EXCEPTION:', error);
    }
}

// Run the test
testBillCreation();
