// =====================================
// AUTENTIKASI SISWA (tersimpan di perangkat)
// Catatan: ini identitas lokal untuk pembelajaran,
// bukan sistem keamanan server.
// =====================================
(function () {
    const USER_KEY = "virtualLabElastisitasUser";

    function getUser() {
        try {
            const u = JSON.parse(localStorage.getItem(USER_KEY));
            return u && u.name ? u : null;
        } catch (e) {
            return null;
        }
    }

    function logout() {
        try { localStorage.removeItem(USER_KEY); } catch (e) {}
        window.location.href = "login.html";
    }

    window.VLAuth = { getUser, logout, USER_KEY };

    const onLogin = /login\.html$/.test(window.location.pathname);
    const user = getUser();

    // Penjaga halaman
    if (!onLogin && !user) {
        window.location.replace("login.html");
        return;
    }

    if (onLogin) return;

    document.addEventListener("DOMContentLoaded", () => {
        const initial = user.name.trim().charAt(0).toUpperCase();
        const profile = document.querySelector(".topbar .profile");

        if (profile) {
            const avatar = profile.querySelector(".profile-avatar");
            if (avatar) avatar.textContent = initial;

            const strong = profile.querySelector("strong");
            const small = profile.querySelector("small");
            const span = profile.querySelector(":scope > span");

            if (strong) strong.textContent = user.name;
            if (small) small.textContent = user.kelas ? "Kelas " + user.kelas : "Siswa Fisika SMA";
            if (!strong && span) span.textContent = user.name;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "logout-button";
            btn.textContent = "Keluar";
            btn.addEventListener("click", () => {
                if (confirm("Keluar dari Virtual Lab?")) logout();
            });
            profile.appendChild(btn);
        } else {
            // Halaman tanpa topbar (mis. simulasi)
            const chip = document.createElement("div");
            chip.className = "floating-user";
            chip.innerHTML = '<span></span><button type="button">Keluar</button>';
            chip.querySelector("span").textContent = user.name;
            chip.querySelector("button").addEventListener("click", () => {
                if (confirm("Keluar dari Virtual Lab?")) logout();
            });
            document.body.appendChild(chip);
        }
    });
})();
