
/* =================================================
   VIRTUAL LAB: ELASTISITAS
   SIMULATION ENGINE V6
================================================= */


/* =================================================
   1. ELEMEN HTML
================================================= */

const canvas = document.getElementById("experimentCanvas");

if (!canvas) {
    throw new Error("Canvas experimentCanvas tidak ditemukan.");
}

const ctx = canvas.getContext("2d");

const materialSelect = document.getElementById("materialSelect");
const massSlider = document.getElementById("massSlider");
const massInput = document.getElementById("massInput");
const massDisplay = document.getElementById("massDisplay");

const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const saveButton = document.getElementById("saveButton");

const statusText = document.getElementById("simulationStatus");

const massValue = document.getElementById("massValue");
const forceValue = document.getElementById("forceValue");
const extensionValue = document.getElementById("extensionValue");
const initialValue = document.getElementById("initialValue");
const finalValue = document.getElementById("finalValue");
const stiffnessValue = document.getElementById("stiffnessValue");

const observationBody = document.getElementById("observationBody");


/* =================================================
   2. PEMERIKSAAN ELEMEN HTML
================================================= */

const requiredElements = {
    materialSelect,
    massSlider,
    massInput,
    massDisplay,
    startButton,
    resetButton,
    saveButton,
    statusText,
    massValue,
    forceValue,
    extensionValue,
    initialValue,
    finalValue,
    stiffnessValue
};

for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) {
        throw new Error(`Elemen HTML ${name} tidak ditemukan.`);
    }
}


/* =================================================
   3. KONSTANTA FISIKA
================================================= */

const GRAVITY = 10;
const INITIAL_LENGTH = 0.1;
const AREA = 0.0001;


/* =================================================
   4. DATA MATERIAL
================================================= */

const materials = {

    steel: {
        name: "Baja",
        type: "solid",
        young: 200e9,
        elasticLimit: 0.002,
        color: "#64748b"
    },

    aluminum: {
        name: "Aluminium",
        type: "solid",
        young: 69e9,
        elasticLimit: 0.002,
        color: "#a7b1bc"
    },

    copper: {
        name: "Tembaga",
        type: "solid",
        young: 110e9,
        elasticLimit: 0.001,
        color: "#bd7548"
    },

    brass: {
        name: "Kuningan",
        type: "solid",
        young: 100e9,
        elasticLimit: 0.001,
        color: "#d3ae48"
    },

    wood: {
        name: "Kayu",
        type: "solid",
        young: 10e9,
        elasticLimit: 0.001,
        color: "#a87945"
    },

    rubber: {
        name: "Karet",
        type: "solid",
        young: 10e6,
        elasticLimit: 0.5,
        color: "#258a73"
    },

    plastic: {
        name: "Plastik PVC",
        type: "solid",
        young: 3e9,
        elasticLimit: 0.02,
        color: "#8b78b8"
    },

    spring: {
        name: "Pegas",
        type: "spring",
        stiffness: 250,
        elasticLimit: 2.2,
        color: "#397fc1"
    }

};


/* =================================================
   5. VARIABEL SIMULASI DAN PENYIMPANAN
================================================= */

const STORAGE_KEY = "virtualLabElastisitasData";

function loadObservations() {

    try {

        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        return Array.isArray(parsedData) ? parsedData : [];

    } catch (error) {

        console.error("Gagal membaca data pengamatan:", error);

        return [];

    }

}

let observations = loadObservations();

let selectedMaterial = materials[materialSelect.value]
    ? materialSelect.value
    : "steel";

let selectedMass = Number(massSlider.value) || 1;

let running = false;
let animationFrame = null;

let currentExtension = 0;
let targetExtension = 0;

let hasCompletedExperiment = false;


/* =================================================
   6. FORMAT ANGKA
================================================= */

function formatNumber(value, digits = 3) {

    return Number(value).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    });

}


/* =================================================
   7. PERHITUNGAN FISIKA
================================================= */

function calculatePhysics() {

    const material = materials[selectedMaterial];

    const force = selectedMass * GRAVITY;

    let stiffness;
    let extensionMeter;

    if (material.type === "spring") {

        stiffness = material.stiffness;

        extensionMeter = force / stiffness;

    } else {

        stiffness = material.young * AREA / INITIAL_LENGTH;

        extensionMeter =
            force * INITIAL_LENGTH /
            (material.young * AREA);

    }

    const strain = extensionMeter / INITIAL_LENGTH;

    const extensionMM = extensionMeter * 1000;

    const finalLength =
        INITIAL_LENGTH * 1000 + extensionMM;

    const stress = force / AREA;

    return {
        force,
        stiffness,
        extensionMeter,
        extensionMM,
        finalLength,
        strain,
        stress
    };

}


/* =================================================
   8. PEMERIKSAAN BATAS ELASTIS
================================================= */

function isWithinElasticLimit(result) {

    const material = materials[selectedMaterial];

    return result.strain <= material.elasticLimit;

}


/* =================================================
   9. RESIZE CANVAS
================================================= */

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) {
        return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawExperiment();

}

window.addEventListener("resize", resizeCanvas);


/* =================================================
   10. GRADIENT BAHAN
================================================= */

function createMaterialGradient(x, top, width, color) {

    const gradient = ctx.createLinearGradient(
        x - width / 2,
        top,
        x + width / 2,
        top
    );

    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, "#ffffff");
    gradient.addColorStop(1, color);

    return gradient;

}


/* =================================================
   11. PENYANGGA
================================================= */

function drawSupport(centerX) {

    ctx.fillStyle = "#243b53";

    ctx.fillRect(centerX - 100, 35, 200, 15);

    ctx.fillRect(centerX - 95, 35, 12, 25);

    ctx.fillRect(centerX + 83, 35, 12, 25);

    ctx.fillStyle = "#64748b";

    ctx.beginPath();

    ctx.arc(centerX, 53, 6, 0, Math.PI * 2);

    ctx.fill();

}


/* =================================================
   12. PEGAS
================================================= */

function drawSpring(x, top, length, color) {

    const coils = 18;
    const width = 22;
    const coilHeight = length / coils;

    ctx.beginPath();

    ctx.moveTo(x, top);

    for (let i = 0; i < coils; i++) {

        const y = top + i * coilHeight;

        ctx.lineTo(x + width, y + coilHeight * 0.25);

        ctx.lineTo(x - width, y + coilHeight * 0.75);

    }

    ctx.lineTo(x, top + length);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";

    ctx.stroke();

}


/* =================================================
   13. BAHAN
================================================= */

function drawMaterial(x, top, length) {

    const material = materials[selectedMaterial];

    if (material.type === "spring") {

        drawSpring(x, top, length, material.color);

    } else {

        const width = selectedMaterial === "rubber" ? 27 : 34;

        ctx.fillStyle = createMaterialGradient(
            x,
            top,
            width,
            material.color
        );

        ctx.fillRect(
            x - width / 2,
            top,
            width,
            length
        );

        ctx.strokeStyle = "#34495e";
        ctx.lineWidth = 1.5;

        ctx.strokeRect(
            x - width / 2,
            top,
            width,
            length
        );

    }

}


/* =================================================
   14. PENGAIT
================================================= */

function drawHook(x, y) {

    ctx.strokeStyle = "#34495e";
    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 13);

    ctx.arc(x + 7, y + 13, 7, Math.PI, 0);

    ctx.stroke();

}


/* =================================================
   15. BEBAN
================================================= */

function drawMass(x, y) {

    const width = 100;
    const height = 65;

    const left = x - width / 2;
    const right = x + width / 2;
    const bottom = y + height;
    const radius = 8;

    const gradient = ctx.createLinearGradient(
        left,
        y,
        right,
        bottom
    );

    gradient.addColorStop(0, "#435c75");
    gradient.addColorStop(1, "#172c42");

    ctx.beginPath();

    ctx.moveTo(left + radius, y);
    ctx.lineTo(right - radius, y);

    ctx.quadraticCurveTo(right, y, right, y + radius);

    ctx.lineTo(right, bottom - radius);

    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);

    ctx.lineTo(left + radius, bottom);

    ctx.quadraticCurveTo(left, bottom, left, bottom - radius);

    ctx.lineTo(left, y + radius);

    ctx.quadraticCurveTo(left, y, left + radius, y);

    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#10243a";
    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        formatNumber(selectedMass, 1) + " kg",
        x,
        y + 39
    );

}


/* =================================================
   16. PENGGARIS
================================================= */

function drawRuler(x, top, length) {

    ctx.fillStyle = "#dbe5ed";

    ctx.fillRect(x - 4, top, 24, length);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.2;

    ctx.beginPath();

    ctx.moveTo(x, top);
    ctx.lineTo(x, top + length);

    ctx.stroke();

    for (let i = 0; i <= 10; i++) {

        const y = top + i * length / 10;

        ctx.beginPath();

        ctx.moveTo(x, y);
        ctx.lineTo(x + 13, y);

        ctx.stroke();

        if (i < 10) {

            ctx.beginPath();

            ctx.moveTo(x, y + length / 20);
            ctx.lineTo(x + 7, y + length / 20);

            ctx.stroke();

        }

    }

    ctx.fillStyle = "#64748b";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";

    ctx.fillText("100 mm", x + 24, top + 5);

    ctx.fillText("0 mm", x + 24, top + length);

}


/* =================================================
   17. PEMBESARAN VISUAL
================================================= */

function calculateVisualExtension(extensionMM) {

    if (extensionMM <= 0) {
        return 0;
    }

    const amplified =
        18 + 35 * Math.log10(1 + extensionMM * 1000);

    return Math.min(amplified, 150);

}


/* =================================================
   18. VISUALISASI UTAMA
================================================= */

function drawExperiment() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) {
        return;
    }

    ctx.clearRect(0, 0, width, height);

    const isMobile = width <= 500;

    const centerX = isMobile
        ? width * 0.43
        : width / 2;

    const infoAreaHeight = isMobile ? 85 : 65;
    const top = 65;

    const initialVisual = isMobile ? 145 : 220;

    const availableLength =
        Math.max(0, height - top - infoAreaHeight - 105);

    const calculatedExtension =
        calculateVisualExtension(currentExtension);

    const extensionVisual = Math.min(
        calculatedExtension,
        Math.max(0, availableLength - initialVisual)
    );

    const totalLength = initialVisual + extensionVisual;

    drawSupport(centerX);

    drawMaterial(centerX, top, totalLength);

    const rulerX = isMobile
        ? centerX + 48
        : centerX + 75;

    drawRuler(rulerX, top, totalLength);

    const materialEnd = top + totalLength;

    drawHook(centerX, materialEnd);

    drawMass(centerX, materialEnd + 25);

    ctx.fillStyle = "#20334a";

    ctx.font = isMobile
        ? "bold 16px Arial"
        : "bold 18px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        materials[selectedMaterial].name,
        centerX,
        22
    );

    const infoTop = height - infoAreaHeight;

    if (isMobile) {

        ctx.strokeStyle = "#d5e0e9";
        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(12, infoTop);
        ctx.lineTo(width - 12, infoTop);

        ctx.stroke();

    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#435c75";

    ctx.font = isMobile
        ? "12px Arial"
        : "14px Arial";

    const firstInfoY = infoTop + 20;

    ctx.fillText(
        "Panjang awal: 100 mm",
        15,
        firstInfoY
    );

    ctx.fillText(
        "Pertambahan panjang: " +
        formatNumber(currentExtension, 6) + " mm",
        15,
        firstInfoY + 23
    );

    ctx.fillText(
        "Massa beban: " +
        formatNumber(selectedMass, 1) + " kg",
        15,
        firstInfoY + 46
    );

    if (!isMobile) {

        ctx.textAlign = "right";
        ctx.font = "11px Arial";
        ctx.fillStyle = "#718096";

        ctx.fillText(
            "Deformasi visual diperbesar",
            width - 15,
            height - 12
        );

    }

}


/* =================================================
   19. HASIL PENGUKURAN
================================================= */

function updateMeasurements() {

    const result = calculatePhysics();

    massValue.textContent =
        formatNumber(selectedMass, 1) + " kg";

    forceValue.textContent =
        formatNumber(result.force) + " N";

    extensionValue.textContent =
        formatNumber(currentExtension, 6) + " mm";

    initialValue.textContent = "100 mm";

    finalValue.textContent =
        formatNumber(100 + currentExtension, 6) + " mm";

    stiffnessValue.textContent =
        formatNumber(result.stiffness, 2) + " N/m";

}


/* =================================================
   20. ANIMASI
================================================= */

function animate() {

    if (!running) {
        return;
    }

    const difference = targetExtension - currentExtension;

    currentExtension += difference * 0.08;

    if (Math.abs(difference) < 0.00001) {

        currentExtension = targetExtension;

        running = false;
        animationFrame = null;
        hasCompletedExperiment = true;

        startButton.textContent = "▶ Mulai";

        statusText.textContent =
            "Status: Percobaan selesai. Data siap disimpan.";

    }

    drawExperiment();
    updateMeasurements();

    if (running) {

        animationFrame = requestAnimationFrame(animate);

    }

}


/* =================================================
   21. MULAI DAN JEDA SIMULASI
================================================= */

startButton.addEventListener("click", () => {

    if (running) {

        running = false;

        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        startButton.textContent = "▶ Lanjutkan";

        statusText.textContent = "Status: Simulasi dijeda.";

        return;

    }

    const result = calculatePhysics();

    if (!isWithinElasticLimit(result)) {

        statusText.textContent =
            "Peringatan: Beban melampaui batas elastis model.";

        return;

    }

    if (result.extensionMM > 250) {

        statusText.textContent =
            "Peringatan: Pertambahan panjang melebihi batas visual.";

        return;

    }

    // Mulai kembali dari posisi awal jika percobaan sebelumnya selesai.
    if (hasCompletedExperiment) {
        currentExtension = 0;
    }

    targetExtension = result.extensionMM;

    hasCompletedExperiment = false;
    running = true;

    startButton.textContent = "Ⅱ Jeda";

    statusText.textContent =
        "Status: Simulasi sedang berjalan...";

    animate();

});


/* =================================================
   22. PENGATURAN MASSA
================================================= */

function updateMass(value) {

    const mass = Number(value);

    if (
        !Number.isFinite(mass) ||
        mass < 0.1 ||
        mass > 5
    ) {
        return;
    }

    selectedMass = Math.round(mass * 10) / 10;

    massSlider.value = selectedMass;
    massInput.value = selectedMass;

    massDisplay.textContent =
        formatNumber(selectedMass, 1) + " kg";

    resetSimulation();

}

massSlider.addEventListener("input", () => {

    updateMass(massSlider.value);

});

massInput.addEventListener("change", () => {

    let value = Number(massInput.value);

    if (!Number.isFinite(value)) {
        value = selectedMass;
    }

    value = Math.min(5, Math.max(0.1, value));

    updateMass(value);

});


/* =================================================
   23. MEMILIH BAHAN
================================================= */

materialSelect.addEventListener("change", () => {

    if (!materials[materialSelect.value]) {
        return;
    }

    selectedMaterial = materialSelect.value;

    resetSimulation();

});


/* =================================================
   24. RESET SIMULASI
================================================= */

function resetSimulation() {

    running = false;

    if (animationFrame !== null) {

        cancelAnimationFrame(animationFrame);

        animationFrame = null;

    }

    currentExtension = 0;
    targetExtension = 0;

    hasCompletedExperiment = false;

    startButton.textContent = "▶ Mulai";

    statusText.textContent =
        "Status: Siap melakukan percobaan.";

    drawExperiment();

    updateMeasurements();

}

resetButton.addEventListener("click", resetSimulation);


/* =================================================
   25. SIMPAN DATA PENGAMATAN
================================================= */

saveButton.addEventListener("click", () => {

    if (!hasCompletedExperiment || running) {

        alert("Jalankan dan selesaikan simulasi terlebih dahulu.");

        return;

    }

    const result = calculatePhysics();

    const observation = {

        number: observations.length + 1,

        material: materials[selectedMaterial].name,

        mass: selectedMass,

        force: result.force,

        extension: result.extensionMM,

        finalLength: result.finalLength,

        timestamp: new Date().toISOString()

    };

    observations.push(observation);

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(observations)
        );

        renderTable();

        // Kembali ke posisi awal untuk percobaan berikutnya.
        resetSimulation();

        statusText.textContent =
            "Status: Data berhasil disimpan. Siap melakukan percobaan berikutnya.";

    } catch (error) {

        observations.pop();

        alert(
            "Data gagal disimpan. Periksa kapasitas penyimpanan browser."
        );

        console.error("Kesalahan penyimpanan:", error);

    }

});


/* =================================================
   26. TABEL PENGAMATAN
================================================= */

function renderTable() {

    if (!observationBody) {
        return;
    }

    observationBody.innerHTML = "";

    if (observations.length === 0) {

        observationBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Belum ada data pengamatan.
                </td>
            </tr>
        `;

        return;

    }

    observations.forEach((item, index) => {

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


/* =================================================
   27. INISIALISASI SIMULASI
================================================= */

function initializeSimulation() {

    selectedMaterial = materials[materialSelect.value]
        ? materialSelect.value
        : "steel";

    selectedMass = Number(massSlider.value) || 1;

    massDisplay.textContent =
        formatNumber(selectedMass, 1) + " kg";

    renderTable();

    resizeCanvas();

    updateMeasurements();

    statusText.textContent =
        "Status: Siap melakukan percobaan.";

}


/* =================================================
   28. JALANKAN APLIKASI
================================================= */

function startApplication() {

    initializeSimulation();

    requestAnimationFrame(() => {

        resizeCanvas();

        drawExperiment();

        updateMeasurements();

    });

}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );

} else {

    startApplication();

}
