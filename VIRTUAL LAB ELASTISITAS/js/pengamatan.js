
const STORAGE_KEY = "virtualLabElastisitasData";

const observationBody =
    document.getElementById("observationBody");

function loadData() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Gagal membaca data:", error);
        return [];
    }
}

function formatNumber(value, digits = 3) {
    return Number(value).toLocaleString("id-ID", {
        maximumFractionDigits: digits
    });
}

// MENAMPILKAN TABEL
function renderObservations() {

    const data = loadData();

    observationBody.innerHTML = "";

    if (data.length === 0) {

        observationBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-data">
                    Belum ada data pengamatan.
                    Silakan lakukan percobaan terlebih dahulu.
                </td>
            </tr>
        `;

    } else {

        data.forEach((item, index) => {

            const row = document.createElement("tr");

            const values = [
                index + 1,
                item.material,
                formatNumber(item.mass, 1),
                formatNumber(item.force, 2),
                formatNumber(item.extension, 6),
                formatNumber(item.finalLength, 6)
            ];

            values.forEach(value => {

                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);

            });

            observationBody.appendChild(row);

        });

    }

    updateSummary(data);
}

// RINGKASAN DATA
function updateSummary(data) {

    document.getElementById("totalExperiments").textContent =
        data.length;

    const materials = new Set(
        data.map(item => item.material)
    );

    document.getElementById("totalMaterials").textContent =
        materials.size;

    const maxForce = data.length
        ? Math.max(...data.map(item => Number(item.force) || 0))
        : 0;

    document.getElementById("maxForce").textContent =
        formatNumber(maxForce, 2) + " N";
}

// EKSPOR CSV
document.getElementById("exportButton").addEventListener("click", () => {

    const data = loadData();

    if (data.length === 0) {
        alert("Belum ada data yang dapat diekspor.");
        return;
    }

    const headers = [
        "No",
        "Bahan",
        "Massa (kg)",
        "Gaya (N)",
        "Pertambahan Panjang (mm)",
        "Panjang Akhir (mm)"
    ];

    const rows = data.map((item, index) => [
        index + 1,
        item.material,
        item.mass,
        item.force,
        item.extension,
        item.finalLength
    ]);

    const csvContent = [
        headers,
        ...rows
    ].map(row =>
        row.map(value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(";")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "data-pengamatan-elastisitas.csv";

    link.click();

    URL.revokeObjectURL(url);

});

// HAPUS DATA
document.getElementById("deleteButton").addEventListener("click", () => {

    const data = loadData();

    if (data.length === 0) {
        alert("Tidak ada data yang perlu dihapus.");
        return;
    }

    const confirmation = confirm(
        "Apakah kamu yakin ingin menghapus seluruh data pengamatan?"
    );

    if (!confirmation) return;

    localStorage.removeItem(STORAGE_KEY);

    renderObservations();

});

// PEMBARUAN OTOMATIS KETIKA HALAMAN DIBUKA KEMBALI
window.addEventListener("storage", renderObservations);

renderObservations();
