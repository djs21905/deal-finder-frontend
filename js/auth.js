// Authentication functions

window.login = async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await window.supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else {
        // Reset viewport zoom after login
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
        window.showApp();
    }
}

window.logout = async function () {
    await window.supabase.auth.signOut({ scope: 'local' });
    window.closeLogoutModal();
    location.reload();
}

window.confirmLogout = function () {
    document.getElementById('logout-modal').classList.add('active');
}

window.closeLogoutModal = function () {
    document.getElementById('logout-modal').classList.remove('active');
}
