# Virtual Lab: Elastisitas

Laboratorium virtual fisika SMA untuk mempelajari tegangan, regangan, Modulus Young, dan Hukum Hooke.
Situs statis (HTML/CSS/JS murni, tanpa build). Data siswa disimpan di `localStorage` browser, bukan di server.

## Struktur

```
public/            ← seluruh isi situs (folder yang dideploy)
  index.html, login.html, materi.html, simulasi.html,
  pengamatan.html, grafik.html, lkpd.html, evaluasi.html
  css/, js/, vendor/ (Chart.js lokal), icons/
  sw.js, manifest.json  ← PWA / offline
  _headers, 404.html    ← konfigurasi Cloudflare
wrangler.toml
```

## Jalankan lokal

```bash
npx serve public
```

## Deploy ke Cloudflare

**Cloudflare Pages (disarankan, terhubung ke GitHub):**
1. Workers & Pages → Create → Pages → Connect to Git → pilih repo ini.
2. Framework preset: `None`
3. Build command: *(kosongkan)*
4. Build output directory: `public`
5. Save and Deploy.

**Atau via CLI:** `npx wrangler deploy` (memakai `wrangler.toml`).

## Catatan rilis

Setiap mengubah file yang di-cache, naikkan `CACHE_NAME` di `public/sw.js`.
