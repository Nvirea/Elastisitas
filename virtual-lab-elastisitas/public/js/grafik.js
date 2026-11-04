
/* =================================================
   VIRTUAL LAB ELASTISITAS
   GRAPH ANALYSIS ENGINE
================================================= */

const STORAGE_KEY = "virtualLabElastisitasData";

const materialFilter = document.getElementById("materialFilter");
const chartCanvas = document.getElementById("elasticityChart");
const emptyChart = document.getElementById("emptyChart");

let elasticityChart = null;
let currentData = [];


/* =================================================
   1. MEMBACA DATA PENGAMATAN
================================================= */

function loadObservationData() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return [];

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {

        console.error("Gagal membaca data:", error);

        return [];

    }

}


/* =================================================
   2. FORMAT ANGKA
================================================= */

function formatNumber(value, digits = 3) {

    return Number(value).toLocaleString("id-ID", {
        maximumFractionDigits: digits
    });

}


/* =================================================
   3. MEMPERBARUI RINGKASAN
================================================= */

function updateSummary(data) {

    document.getElementById("totalExperiments").textContent =
        data.length;

    const maximumForce = data.length
        ? Math.max(...data.map(item => Number(item.force) || 0))
        : 0;

    const maximumExtension = data.length
        ? Math.max(...data.map(item => Number(item.extension) || 0))
        : 0;

    document.getElementById("maximumForce").textContent =
        formatNumber(maximumForce, 2) + " N";

    document.getElementById("maximumExtension").textContent =
        formatNumber(maximumExtension, 4) + " mm";

}


/* =================================================
   4. FILTER MATERIAL
================================================= */

function populateMaterialFilter(data) {

    const selectedValue = materialFilter.value || "all";

    const materials = [
        ...new Set(data.map(item => item.material).filter(Boolean))
    ];

    materialFilter.innerHTML = `
        <option value="all">Semua Material</option>
    `;

    materials.forEach(material => {

        const option = document.createElement("option");

        option.value = material;
        option.textContent = material;

        materialFilter.appendChild(option);

    });

    if (
        selectedValue === "all" ||
        materials.includes(selectedValue)
    ) {
        materialFilter.value = selectedValue;
    }

}


/* =================================================
   5. REGRESI LINEAR
   GAYA = k × PERTAMBAHAN PANJANG + INTERSEP
================================================= */

function calculateRegression(data) {

    const points = data
        .map(item => ({
            x: Number(item.extension),
            y: Number(item.force)
        }))
        .filter(point =>
            Number.isFinite(point.x) &&
            Number.isFinite(point.y)
        );

    if (points.length < 2) return null;

    const n = points.length;

    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);

    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const denominator = n * sumXX - sumX * sumX;

    if (Math.abs(denominator) < 1e-12) {
        return null;
    }

    const slope =
        (n * sumXY - sumX * sumY) / denominator;

    const intercept =
        (sumY - slope * sumX) / n;

    const meanY = sumY / n;

    const totalVariation = points.reduce(
        (sum, p) => sum + Math.pow(p.y - meanY, 2),
        0
    );

    const residualVariation = points.reduce(
        (sum, p) => {
            const predicted = slope * p.x + intercept;
            return sum + Math.pow(p.y - predicted, 2);
        },
        0
    );

    const rSquared = totalVariation === 0
        ? null
        : 1 - residualVariation / totalVariation;

    return {
        slope,
        intercept,
        rSquared,
        points
    };

}


/* =================================================
   6. MEMPERBARUI ANALISIS
================================================= */

function updateAnalysis(data) {

    const equationElement =
        document.getElementById("trendEquation");

    const stiffnessElement =
        document.getElementById("springConstant");

    const countElement =
        document.getElementById("analyzedCount");

    const noteElement =
        document.getElementById("analysisNote");

    countElement.textContent = data.length;

    const regression = calculateRegression(data);

    if (!regression) {

        equationElement.textContent = "Belum tersedia";

        stiffnessElement.textContent = "-";

        noteElement.textContent =
            "Diperlukan minimal dua data dengan pertambahan panjang berbeda untuk menghitung garis tren.";

        return null;

    }

    const slope = regression.slope;
    const intercept = regression.intercept;

    // Data extension menggunakan mm.
    // Maka slope awal mempunyai satuan N/mm.
    const stiffnessNPerMeter = slope * 1000;

    equationElement.textContent =
        `F = ${formatNumber(slope, 4)} ΔL ${intercept >= 0 ? "+" : "-"} ${formatNumber(Math.abs(intercept), 4)}`;

    stiffnessElement.textContent =
        formatNumber(stiffnessNPerMeter, 2) + " N/m";

    const rSquaredText = regression.rSquared === null
        ? "Tidak dapat dihitung"
        : formatNumber(regression.rSquared, 4);

    noteElement.textContent =
        `Kemiringan garis tren menunjukkan konstanta kekakuan sebesar ${formatNumber(stiffnessNPerMeter, 2)} N/m. Nilai R² = ${rSquaredText}.`;

    return regression;

}


/* =================================================
   7. MEMBUAT GRAFIK
================================================= */

function renderChart(data) {

    if (elasticityChart) {

        elasticityChart.destroy();

        elasticityChart = null;

    }

    if (!data.length) {

        chartCanvas.style.display = "none";
        emptyChart.style.display = "block";

        updateAnalysis([]);

        return;

    }

    chartCanvas.style.display = "block";
    emptyChart.style.display = "none";

    const sortedData = [...data]
        .map(item => ({
            x: Number(item.extension),
            y: Number(item.force)
        }))
        .filter(point =>
            Number.isFinite(point.x) &&
            Number.isFinite(point.y)
        )
        .sort((a, b) => a.x - b.x);

    const regression = calculateRegression(data);

    const datasets = [
        {
            label: "Data Pengamatan",
            data: sortedData,
            backgroundColor: "#16b8a6",
            borderColor: "#16b8a6",
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
        }
    ];

    if (regression) {

        const minX = Math.min(...sortedData.map(point => point.x));
        const maxX = Math.max(...sortedData.map(point => point.x));

        datasets.push({
            label: "Garis Tren",
            data: [
                {
                    x: minX,
                    y: regression.slope * minX + regression.intercept
                },
                {
                    x: maxX,
                    y: regression.slope * maxX + regression.intercept
                }
            ],
            borderColor: "#e58a36",
            backgroundColor: "#e58a36",
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            fill: false
        });

    }

    elasticityChart = new Chart(chartCanvas, {

        type: "scatter",

        data: {
            datasets
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {

                        label: function(context) {

                            return (
                                "Pertambahan panjang: " +
                                formatNumber(context.parsed.x, 6) +
                                " mm, Gaya: " +
                                formatNumber(context.parsed.y, 2) +
                                " N"
                            );

                        }

                    }
                }

            },

            scales: {

                x: {
                    type: "linear",
                    title: {
                        display: true,
                        text: "Pertambahan Panjang (mm)"
                    }
                },

                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Gaya (N)"
                    }
                }

            }

        }

    });

    updateAnalysis(data);

}


/* =================================================
   8. FILTER DAN PEMBARUAN
================================================= */

function updateChart() {

    currentData = loadObservationData();

    updateSummary(currentData);

    populateMaterialFilter(currentData);

    const selectedMaterial = materialFilter.value;

    const filteredData = selectedMaterial === "all"
        ? currentData
        : currentData.filter(
            item => item.material === selectedMaterial
        );

    renderChart(filteredData);

}


/* =================================================
   9. EVENT FILTER
================================================= */

materialFilter.addEventListener("change", () => {

    const selectedMaterial = materialFilter.value;

    const filteredData = selectedMaterial === "all"
        ? currentData
        : currentData.filter(
            item => item.material === selectedMaterial
        );

    renderChart(filteredData);

});


/* =================================================
   10. UNDUH GRAFIK
================================================= */

document.getElementById("downloadChart").addEventListener("click", () => {

    if (!elasticityChart) {

        alert("Belum ada grafik yang dapat diunduh.");

        return;

    }

    const link = document.createElement("a");

    link.href = elasticityChart.toBase64Image();

    link.download = "grafik-elastisitas.png";

    link.click();

});


/* =================================================
   11. TOMBOL PERBARUI
================================================= */

document.getElementById("refreshChart").addEventListener("click", () => {

    updateChart();

});


/* =================================================
   12. PEMBARUAN OTOMATIS
================================================= */

// Event storage untuk perubahan dari tab lain.
window.addEventListener("storage", event => {

    if (event.key === STORAGE_KEY) {
        updateChart();
    }

});

// Memuat data saat halaman pertama kali dibuka.
updateChart();
