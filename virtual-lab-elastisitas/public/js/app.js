
document.addEventListener("DOMContentLoaded", () => {

    console.log("VIRTUAL LAB: ELASTISITAS aktif!");

    // =====================================
    // SERVICE WORKER
    // =====================================

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log("Service Worker berhasil didaftarkan.");
            })
            .catch(error => {
                console.error("Service Worker error:", error);
            });
    }

    // =====================================
    // SIDEBAR
    // =====================================

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");

    // Tombol buka dan tutup sidebar
    if (sidebar && menuToggle) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });

        // Tutup sidebar setelah memilih menu
        const menuItems = document.querySelectorAll(".menu-item");

        menuItems.forEach(item => {
            item.addEventListener("click", () => {
                sidebar.classList.remove("open");
            });
        });
    }

    // =====================================
    // NAVIGASI HALAMAN
    // =====================================

    const menuItems = document.querySelectorAll(".menu-item");

    // Mengambil nama file halaman saat ini
    let currentPage = window.location.pathname
        .split("/")
        .pop();

    // Jika halaman utama, gunakan index.html; tambahkan .html bila URL tanpa ekstensi
    if (currentPage === "") {
        currentPage = "index.html";
    } else if (!currentPage.includes(".")) {
        currentPage += ".html";
    }

    // Menentukan menu yang aktif
    menuItems.forEach(item => {

        const linkPage = item.getAttribute("href")
            .split("/")
            .pop()
            .split("?")[0]
            .split("#")[0];

        item.classList.remove("active");

        if (linkPage === currentPage) {
            item.classList.add("active");
        }

    });

});
