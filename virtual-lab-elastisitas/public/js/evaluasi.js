document.addEventListener("DOMContentLoaded", () => {

    const RESULT_KEY = "virtualLabElastisitasEvaluasi";

    const QUESTIONS = [
        {
            q: "Kawat ditarik dengan gaya 100 N. Luas penampangnya 5 mm². Besar tegangan pada kawat adalah ...",
            o: ["2 × 10⁷ Pa", "5 × 10⁻⁴ Pa", "2 × 10⁴ Pa", "5 × 10⁸ Pa"],
            a: 0,
            e: "A = 5 mm² = 5 × 10⁻⁶ m². σ = F/A = 100 / (5 × 10⁻⁶) = 2 × 10⁷ Pa."
        },
        {
            q: "Satuan regangan (strain) adalah ...",
            o: ["N/m²", "Tidak memiliki satuan", "N/m", "Meter"],
            a: 1,
            e: "Regangan = ΔL/L₀, perbandingan dua besaran sejenis (panjang), sehingga tidak bersatuan."
        },
        {
            q: "Sebatang kawat panjang mula-mula 50 cm bertambah panjang 0,5 cm. Regangan kawat tersebut adalah ...",
            o: ["0,1", "0,01", "0,001", "1"],
            a: 1,
            e: "e = ΔL/L₀ = 0,5 / 50 = 0,01."
        },
        {
            q: "Pada kawat bekerja tegangan 4 × 10⁸ Pa dan regangannya 2 × 10⁻³. Modulus Young bahan kawat adalah ...",
            o: ["8 × 10⁵ Pa", "2 × 10⁵ Pa", "2 × 10¹¹ Pa", "8 × 10¹¹ Pa"],
            a: 2,
            e: "E = σ/e = (4 × 10⁸) / (2 × 10⁻³) = 2 × 10¹¹ Pa (sesuai nilai baja)."
        },
        {
            q: "Dua kawat A dan B sebahan, sama panjang, ditarik gaya yang sama. Diameter B dua kali diameter A. Perbandingan pertambahan panjang ΔL_A : ΔL_B adalah ...",
            o: ["1 : 4", "1 : 2", "2 : 1", "4 : 1"],
            a: 3,
            e: "ΔL = FL/(AE) dan A ∝ d². Diameter B dua kali, maka A_B = 4 A_A, sehingga ΔL_B = ¼ ΔL_A. Jadi ΔL_A : ΔL_B = 4 : 1."
        },
        {
            q: "Sebuah pegas ditarik gaya 10 N sehingga bertambah panjang 5 cm. Konstanta pegas tersebut adalah ...",
            o: ["2 N/m", "50 N/m", "200 N/m", "500 N/m"],
            a: 2,
            e: "k = F/Δx = 10 / 0,05 = 200 N/m."
        },
        {
            q: "Pegas dengan k = 200 N/m diregangkan 10 cm. Energi potensial pegas adalah ...",
            o: ["0,5 J", "1 J", "10 J", "20 J"],
            a: 1,
            e: "Ep = ½ k Δx² = ½ × 200 × (0,1)² = 1 J."
        },
        {
            q: "Dua pegas identik, masing-masing k = 300 N/m, disusun seri. Konstanta pengganti susunan adalah ...",
            o: ["600 N/m", "300 N/m", "150 N/m", "75 N/m"],
            a: 2,
            e: "1/k_s = 1/300 + 1/300 = 2/300, sehingga k_s = 150 N/m."
        },
        {
            q: "Pegas k₁ = 100 N/m dan k₂ = 200 N/m disusun paralel. Konstanta pengganti susunan adalah ...",
            o: ["300 N/m", "150 N/m", "67 N/m", "20.000 N/m"],
            a: 0,
            e: "Paralel: k_p = k₁ + k₂ = 100 + 200 = 300 N/m."
        },
        {
            q: "Jika gaya tarik pada suatu bahan melampaui batas elastisnya, maka ...",
            o: [
                "Hukum Hooke tetap berlaku",
                "Bahan selalu kembali ke bentuk semula",
                "Bahan tidak kembali ke bentuk semula dan Hukum Hooke tidak berlaku",
                "Modulus Young bahan menjadi nol"
            ],
            a: 2,
            e: "Di luar batas elastis terjadi deformasi plastis: bahan tidak pulih sepenuhnya dan hubungan F–Δx tidak lagi linear."
        }
    ];

    const $ = id => document.getElementById(id);
    const startPanel = $("startPanel"), quizPanel = $("quizPanel"), resultPanel = $("resultPanel");

    let order = [], idx = 0, score = 0, answers = [], locked = false;

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function readHistory() {
        try {
            const h = JSON.parse(localStorage.getItem(RESULT_KEY) || "[]");
            return Array.isArray(h) ? h : [];
        } catch (e) { return []; }
    }

    function saveResult(value) {
        const h = readHistory();
        const user = window.VLAuth && VLAuth.getUser();
        h.push({ score: value, date: new Date().toISOString(), name: user ? user.name : "" });
        try { localStorage.setItem(RESULT_KEY, JSON.stringify(h.slice(-20))); } catch (e) {}
    }

    function renderHistory() {
        const box = $("history");
        const h = readHistory().slice().reverse().slice(0, 5);
        if (!h.length) { box.innerHTML = ""; return; }
        const rows = h.map(r => {
            const d = new Date(r.date).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
            return `<tr><td>${d}</td><td><strong>${r.score}</strong></td></tr>`;
        }).join("");
        box.innerHTML = `<h3 style="font-size:14px;margin-bottom:8px">Riwayat Nilai Terakhir</h3>
            <div class="table-wrapper"><table class="mat-table"><tr><th>Waktu</th><th>Nilai</th></tr>${rows}</table></div>`;
    }

    function start() {
        order = shuffle(QUESTIONS.map((_, i) => i));
        idx = 0; score = 0; answers = [];
        startPanel.hidden = true; resultPanel.hidden = true; quizPanel.hidden = false;
        showQuestion();
    }

    function showQuestion() {
        locked = false;
        const item = QUESTIONS[order[idx]];
        // acak urutan pilihan
        const opts = shuffle(item.o.map((text, i) => ({ text, correct: i === item.a })));
        item._shown = opts;

        $("qCount").textContent = `Soal ${idx + 1} dari ${QUESTIONS.length}`;
        $("qScore").textContent = `Benar: ${score}`;
        $("qBar").style.width = (idx / QUESTIONS.length * 100) + "%";
        $("qText").textContent = item.q;
        $("qFeedback").hidden = true;
        $("nextBtn").hidden = true;

        const box = $("qOptions");
        box.innerHTML = "";
        opts.forEach((opt, i) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "quiz-option";
            b.textContent = String.fromCharCode(65 + i) + ". " + opt.text;
            b.addEventListener("click", () => choose(i, b));
            box.appendChild(b);
        });
    }

    function choose(i, btn) {
        if (locked) return;
        locked = true;

        const item = QUESTIONS[order[idx]];
        const opts = item._shown;
        const ok = opts[i].correct;
        if (ok) score++;

        answers.push({
            q: item.q,
            chosen: opts[i].text,
            correct: opts.find(o => o.correct).text,
            ok,
            e: item.e
        });

        [...$("qOptions").children].forEach((b, k) => {
            b.disabled = true;
            if (opts[k].correct) b.classList.add("correct");
        });
        if (!ok) btn.classList.add("wrong");

        const fb = $("qFeedback");
        fb.innerHTML = (ok ? "<strong style='color:#168E7D'>Benar!</strong> " : "<strong style='color:#C0392B'>Belum tepat.</strong> ") + item.e;
        fb.hidden = false;
        $("qScore").textContent = `Benar: ${score}`;

        const nb = $("nextBtn");
        nb.textContent = idx === QUESTIONS.length - 1 ? "Lihat Hasil" : "Lanjut →";
        nb.hidden = false;
    }

    function finish() {
        const value = Math.round(score / QUESTIONS.length * 100);
        saveResult(value);

        quizPanel.hidden = true; resultPanel.hidden = false;
        $("rScore").textContent = value;

        let msg;
        if (value >= 80) msg = "Sangat baik! Kamu menguasai konsep elastisitas dengan baik.";
        else if (value >= 60) msg = "Cukup baik. Pelajari kembali bagian yang masih keliru lalu coba lagi.";
        else msg = "Ayo pelajari materi sekali lagi, lalu ulangi evaluasi.";
        $("rText").textContent = `Kamu menjawab benar ${score} dari ${QUESTIONS.length} soal. ` + msg;

        const review = $("review");
        review.innerHTML = "<h3 style='font-size:15px;margin-bottom:6px'>Pembahasan</h3>";
        answers.forEach((a, n) => {
            const div = document.createElement("div");
            div.className = "review-item";
            const head = document.createElement("div");
            head.innerHTML = `<span class="${a.ok ? "ok" : "no"}">${a.ok ? "✓" : "✗"}</span> `;
            head.appendChild(document.createTextNode(`${n + 1}. ${a.q}`));
            const det = document.createElement("div");
            det.style.color = "#51647A";
            det.textContent = a.ok
                ? `Jawabanmu: ${a.chosen}. ${a.e}`
                : `Jawabanmu: ${a.chosen} • Jawaban benar: ${a.correct}. ${a.e}`;
            div.append(head, det);
            review.appendChild(div);
        });
    }

    $("startBtn").addEventListener("click", start);
    $("retryBtn").addEventListener("click", start);
    $("nextBtn").addEventListener("click", () => {
        idx++;
        if (idx >= QUESTIONS.length) finish(); else showQuestion();
    });

    renderHistory();
});
