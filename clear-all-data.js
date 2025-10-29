// Clear all application data - localStorage and Supabase
(async function clearAllData() {
    console.log('🧹 Clearing all application data...');
    
    // Clear localStorage
    localStorage.removeItem('skillquest.data.v1');
    localStorage.removeItem('skillquest.session.v1');
    console.log('✅ localStorage cleared');
    
    // Clear Supabase if available
    try {
        if (typeof Store !== 'undefined' && Store.useSupabase()) {
            await Store.clearAllDataSupabase();
            console.log('✅ Supabase data cleared');
        } else {
            console.log('ℹ️ Supabase not available - only localStorage cleared');
        }
    } catch (error) {
        console.log('⚠️ Supabase clear failed - localStorage cleared only');
    }
    
    console.log('🎉 All data cleared! Fresh start ready.');
    alert('All data cleared successfully! The application is now reset to a fresh state.');
})();