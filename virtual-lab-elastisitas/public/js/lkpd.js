
document.addEventListener("DOMContentLoaded", () => {
  const OBSERVATION_KEY = "virtualLabElastisitasData";
  const ANSWER_KEY = "virtualLabElastisitasLKPDAnswers";

  const GRAVITY = 10;

  const answerFields = document.querySelectorAll("[data-save]");
  const saveStatus = document.getElementById("saveStatus");

  // ==========================================
  // 1. MEMBACA DATA LOCAL STORAGE
  // ==========================================

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (error) {
      console.error("Gagal membaca data:", error);
      return fallback;
    }
  }

  function getObservations() {
    const data = readJSON(OBSERVATION_KEY, []);
    return Array.isArray(data) ? data : [];
  }

  // ==========================================
  // 2. MENYIMPAN JAWABAN LKPD
  // ==========================================

  function saveAnswers() {
    const answers = {};

    answerFields.forEach(field => {
      answers[field.id] = field.value;
    });

    try {
      localStorage.setItem(ANSWER_KEY, JSON.stringify(answers));

      if (saveStatus) {
        saveStatus.textContent =
          "Jawaban berhasil tersimpan otomatis pada perangkat ini.";
      }
    } catch (error) {
      console.error("Gagal menyimpan jawaban:", error);

      if (saveStatus) {
        saveStatus.textContent =
          "Penyimpanan gagal. Periksa ruang penyimpanan browser.";
      }
    }
  }

  function loadAnswers() {
    const answers = readJSON(ANSWER_KEY, {});

    answerFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(answers, field.id)) {
        field.value = answers[field.id];
      }
    });
  }

  answerFields.forEach(field => {
    field.addEventListener("input", saveAnswers);
    field.addEventListener("change", saveAnswers);
  });

  // ==========================================
  // 3. FORMAT ANGKA
  // ==========================================

  function formatNumber(value, digits = 4) {
    if (!Number.isFinite(value)) return "-";

    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: digits
    }).format(value);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  // ==========================================
  // 4. MENGAMBIL PANJANG AWAL
  // ==========================================

  function getInitialLength() {
    const input = document.getElementById("initialLength");

    if (!input || input.value.trim() === "") {
      return null;
    }

    const value = Number(input.value);

    return Number.isFinite(value) && value >= 0
      ? value
      : null;
  }

  // ==========================================
  // 5. MENAMPILKAN DATA PENGAMATAN DINAMIS
  // ==========================================

  function renderObservationTable() {
    const observationBody =
      document.getElementById("lkpdObservationBody");

    const calculationBody =
      document.getElementById("calculationBody");

    const observationStatus =
      document.getElementById("observationStatus");

    const averageOutput =
      document.getElementById("averageSpringConstant");

    if (!observationBody || !calculationBody) return;

    const observations = getObservations();
    const initialLength = getInitialLength();

    const selectedMaterial =
      document.getElementById("springType")?.value.trim().toLowerCase() || "";

    // Jika jenis pegas diisi, tampilkan data jenis tersebut saja.
    // Jika kosong, tampilkan seluruh data percobaan.
    const filteredData = observations.filter(item => {
      if (!selectedMaterial) return true;

      return String(item.material ?? "").toLowerCase() === selectedMaterial;
    });

    observationBody.innerHTML = "";
    calculationBody.innerHTML = "";

    let validConstants = [];

    if (filteredData.length === 0) {
      observationBody.innerHTML = `
        <tr>
          <td colspan="4">
            Belum ada data percobaan yang sesuai.
          </td>
        </tr>
      `;

      calculationBody.innerHTML = `
        <tr>
          <td colspan="5">
            Data perhitungan belum tersedia.
          </td>
        </tr>
      `;

      if (observationStatus) {
        observationStatus.textContent =
          "Belum ada data pengamatan. Silakan lakukan percobaan dan simpan hasilnya di Virtual Laboratory.";
      }

      if (averageOutput) {
        averageOutput.textContent = "Belum dihitung";
      }

      return;
    }

    filteredData.forEach((item, index) => {
      const mass = Number(item.mass);
      const force = Number(item.force);
      const finalLength = Number(item.finalLength);

      const validMass = Number.isFinite(mass);
      const validForce = Number.isFinite(force);
      const validFinalLength = Number.isFinite(finalLength);

      // Menghitung pertambahan panjang dari panjang akhir - panjang awal.
      const extension =
        initialLength !== null && validFinalLength
          ? finalLength - initialLength
          : null;

      const validExtension =
        extension !== null && extension > 0;

      // Konstanta pegas hanya dihitung jika Δx valid.
      const stiffness =
        validExtension && validForce && force > 0
          ? force / extension
          : null;

      if (
        Number.isFinite(stiffness) &&
        stiffness > 0
      ) {
        validConstants.push(stiffness);
      }

      // TABEL 1: DATA PENGAMATAN
      observationBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${validMass ? formatNumber(mass, 3) : "-"}</td>
          <td>${validFinalLength ? formatNumber(finalLength, 5) : "-"}</td>
          <td>${validExtension ? formatNumber(extension, 5) : "-"}</td>
        </tr>
      `;

      // TABEL 2: HASIL PERHITUNGAN
      calculationBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${validMass ? formatNumber(mass, 3) : "-"}</td>
          <td>${validForce ? formatNumber(force, 3) : "-"}</td>
          <td>${validExtension ? formatNumber(extension, 5) : "-"}</td>
          <td>${
            Number.isFinite(stiffness)
              ? formatNumber(stiffness, 2)
              : "-"
          }</td>
        </tr>
      `;
    });

    // ==========================================
    // 6. RATA-RATA KONSTANTA PEGAS
    // ==========================================

    if (averageOutput) {
      if (validConstants.length > 0) {
        const average =
          validConstants.reduce((sum, value) => sum + value, 0) /
          validConstants.length;

        averageOutput.textContent =
          `${formatNumber(average, 2)} N/m`;
      } else {
        averageOutput.textContent =
          "Belum dapat dihitung. Isi panjang awal pegas.";
      }
    }

    // ==========================================
    // 7. STATUS DATA
    // ==========================================

    if (observationStatus) {
      observationStatus.textContent =
        `${filteredData.length} data percobaan ditampilkan. ` +
        "Data berasal dari hasil simulasi yang tersimpan.";
        
      if (initialLength === null) {
        observationStatus.textContent +=
          " Isi panjang awal pegas untuk menghitung pertambahan panjang dan konstanta pegas.";
      }
    }
  }

  // ==========================================
  // 8. EVENT INPUT
  // ==========================================

  document.getElementById("initialLength")
    ?.addEventListener("input", renderObservationTable);

  document.getElementById("springType")
    ?.addEventListener("input", renderObservationTable);

  document.getElementById("refreshLKPD")
    ?.addEventListener("click", renderObservationTable);

  // ==========================================
  // 9. CETAK / SIMPAN PDF
  // ==========================================

  document.getElementById("printLKPD")
    ?.addEventListener("click", () => {
      saveAnswers();
      window.print();
    });

  // ==========================================
  // 10. HAPUS JAWABAN LKPD
  // ==========================================

  document.getElementById("clearAnswers")
    ?.addEventListener("click", () => {
      const confirmed = confirm(
        "Apakah kamu yakin ingin menghapus seluruh identitas dan jawaban LKPD? Data pengamatan simulasi tidak akan dihapus."
      );

      if (!confirmed) return;

      answerFields.forEach(field => {
        field.value = "";
      });

      localStorage.removeItem(ANSWER_KEY);

      renderObservationTable();

      if (saveStatus) {
        saveStatus.textContent =
          "Jawaban LKPD telah dihapus. Data simulasi tetap tersimpan.";
      }
    });

  // ==========================================
  // 11. MEMANTAU PERUBAHAN DATA SIMULASI
  // ==========================================

  window.addEventListener("storage", event => {
    if (event.key === OBSERVATION_KEY) {
      renderObservationTable();
    }
  });

  // ==========================================
  // 12. INISIALISASI
  // ==========================================

  loadAnswers();
  renderObservationTable();
});
