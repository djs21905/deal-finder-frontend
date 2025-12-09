// Global state and initialization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jjjekqaopeaxspzxrxid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamVrcWFvcGVheHNwenhyeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTI0OTYsImV4cCI6MjA4MDY2ODQ5Nn0.KWft22KvscGdHxaBp5FXk4xWhBq1WDiQYyFnlZJ9ajs';

// Expose Supabase to global scope for other scripts
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
window.deals = [];
window.allDeals = [];
window.currentSort = 'random';
window.viewMode = 'card';
window.dealsLoaded = false;
window.currentDetailDeal = null;

// Initialize app
async function init() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) window.showApp();
}

// Event listeners
document.addEventListener('click', function (event) {
    const modal = document.getElementById('delete-modal');
    if (event.target === modal) {
        window.closeDeleteModal();
    }

    const logoutModal = document.getElementById('logout-modal');
    if (event.target === logoutModal) {
        window.closeLogoutModal();
    }
});

// Start app
init();
