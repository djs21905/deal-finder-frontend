// Global state and initialization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jjjekqaopeaxspzxrxid.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1v-KQGZ_fFn7APIEwk8tLw_apGG73ET';

// Expose Supabase to global scope for other scripts
window.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Global variables
window.deals = [];
window.allDeals = [];
window.currentSort = 'random';
window.viewMode = 'card';
window.dealsLoaded = false;
window.currentDetailDeal = null;

// Initialize app
async function init() {
    // Use getSession() to properly restore session from localStorage
    const { data: { session }, error } = await window.supabase.auth.getSession();
    if (session && !error) {
        window.showApp();
    } else {
        // No session - show login screen
        document.getElementById('login-container').style.display = 'flex';
    }
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
