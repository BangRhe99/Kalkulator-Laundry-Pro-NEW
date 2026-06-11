# PROJECT FILE MAP — KALKULATOR LAUNDRY PRO

Dokumen ini adalah peta navigasi file untuk membantu AI/developer langsung menuju file yang benar saat memperbaiki bug, menyempurnakan UI/UX, memecah file, atau menambah fitur.

Tujuan utama:

1. Mengurangi tebak-tebakan file.
2. Mempercepat proses patch.
3. Membatasi perubahan hanya pada titik yang diperlukan.
4. Menjaga struktur aplikasi tetap kokoh.
5. Menjaga performa aplikasi agar frontend bekerja lokal sebanyak mungkin dan backend hanya dipanggil saat perlu.

Aturan wajib:

```text
Baca AI_PATCH_RULES_FAST_SCOPE.md terlebih dahulu.
Baca PROJECT_FILE_MAP.md sebelum mencari file target.
Gunakan FAST SCOPE MODE.
Jangan menyentuh file di luar scope tanpa bukti kuat.
Jangan ubah rumus, sheet, backend, atau struktur utama jika masalahnya hanya visual.
```

---

## 1. Visi Performa dan Skala

Aplikasi ini diarahkan agar tetap cepat dan lebih kokoh saat dipakai banyak user.

Potensi bottleneck aplikasi Google Apps Script:

```text
google.script.run
↓
Apps Script execution quota
↓
Spreadsheet read/write
↓
LockService
↓
Response ke frontend
```

Arah arsitektur yang wajib dijaga:

```text
Frontend harus banyak bekerja lokal.
Backend hanya dipanggil saat benar-benar perlu.
Sheet jangan dibaca berkali-kali untuk data yang sama.
Data outlet aktif sebaiknya di-cache.
Render UI jangan full ulang kalau hanya satu card berubah.
```

Prinsip patch performa:

1. Jangan menambah `google.script.run` jika masalah bisa selesai di frontend.
2. Jangan membaca sheet berulang untuk data yang sama.
3. Jangan full render dashboard jika cukup update satu card.
4. Gunakan state/cache frontend untuk data yang sudah dimuat.
5. Gunakan batch read/write di backend jika menyentuh sheet.
6. Setiap cache wajib punya aturan refresh/invalidation.

---

## 2. Dashboard Struktur Biaya / HPP

### CSS Resmi Saat Ini

#### `HPP_Styles.html`

Fungsi:

```text
Aggregator utama style HPP.
```

Maksud:

```text
Menjaga include lama tetap aman setelah file style HPP dipecah.
```

Tujuan:

```text
File ini tidak berisi CSS panjang. Hanya include berurutan ke file pecahan.
```

Isi ideal:

```html
<?!= include('HPP_Style_00_Tokens'); ?>
<?!= include('HPP_Style_01_ViewShell'); ?>
<?!= include('HPP_Style_02_TopCards'); ?>
<?!= include('HPP_Style_03_VariableCards'); ?>
<?!= include('HPP_Style_04_CompositionDonut'); ?>
<?!= include('HPP_Style_05_OutletTransition'); ?>
<?!= include('HPP_Style_06_Responsive'); ?>
<?!= include('HPP_Style_90_LegacyReview'); ?>
<?!= include('HPP_Style_99_Hotfix'); ?>
```

Jangan disentuh kecuali:

```text
- Ada masalah include.
- Ada file style HPP baru yang memang sudah disetujui.
- Ada urutan cascade yang salah.
```

---

#### `HPP_Style_00_Tokens.html`

Judul:

```text
HPP STYLE TOKENS
```

Fungsi:

```text
Menyimpan pondasi visual HPP.
```

Maksud:

```text
Tempat warna, radius, shadow, spacing, font scale, dan CSS variable HPP.
```

Tujuan:

```text
Agar perubahan pondasi visual HPP tidak tersebar di banyak file.
```

Kapan disentuh:

```text
- Warna pondasi HPP berubah.
- Radius/shadow/spacing global HPP berubah.
- Font scale global HPP perlu distabilkan.
```

Jangan taruh di sini:

```text
- Detail card Gas/Listrik/Air.
- Detail donut chart.
- Media query besar.
- Style dashboard lain.
```

---

#### `HPP_Style_01_ViewShell.html`

Judul:

```text
HPP VIEW SHELL & MAIN LAYOUT
```

Fungsi:

```text
Mengatur layout besar dashboard Struktur Biaya/HPP.
```

Maksud:

```text
Tempat container utama, wrapper, grid besar, background, panel utama, dan area halaman HPP.
```

Tujuan:

```text
Jika dashboard tidak full layar, kepotong, terlalu sempit, atau scroll berlebihan, file ini yang dicek pertama.
```

Kapan disentuh:

```text
- Dashboard HPP belum full satu halaman.
- Area card terlalu sempit.
- Grid utama tidak memenuhi sisa layar setelah sidebar.
- Ada horizontal scroll.
- Tinggi viewport tidak pas.
```

Jangan taruh di sini:

```text
- Detail isi card variabel.
- Detail 3 card atas.
- Donut legend.
- Hotfix sementara.
```

---

#### `HPP_Style_02_TopCards.html`

Judul:

```text
HPP TOP SUMMARY CARDS
```

Fungsi:

```text
Mengatur 3 card HPP atas.
```

Maksud:

```text
Tempat style HPP Cuci, HPP Kering, HPP Setrika.
```

Tujuan:

```text
Jika masalah ada pada font, alignment, nominal, rincian, atau ukuran 3 card atas, file ini yang dituju.
```

Kapan disentuh:

```text
- Font 3 card atas tidak presisi.
- Nominal HPP Cuci/Kering/Setrika terlalu besar/kecil.
- Rincian dalam card atas berantakan.
- Card atas terlalu tinggi atau terlalu padat.
```

Jangan taruh di sini:

```text
- Card Gas/Listrik/Air/Packing/Chemical/Admin Nota.
- Donut chart.
- Transisi outlet.
```

---

#### `HPP_Style_03_VariableCards.html`

Judul:

```text
HPP VARIABLE COST CARDS
```

Fungsi:

```text
Mengatur card biaya variabel bawah.
```

Maksud:

```text
Tempat style Gas LPG, Listrik, Air PDAM, Packing, Chemical, Admin/Nota.
```

Tujuan:

```text
Jika bug ada pada alignment icon, nama card, nominal total, persentase, deskripsi, list rincian, atau card bawah terpotong, file ini yang dituju.
```

Kapan disentuh:

```text
- Card Gas/Listrik/Air/Packing/Chemical/Admin Nota tidak sejajar.
- Deskripsi Packing/Chemical terlalu turun.
- Isi card Listrik terpotong.
- Badge persen tidak presisi.
- Header card bawah perlu dirapikan.
```

Jangan taruh di sini:

```text
- Rumus.
- Data.
- JS render.
- Donut canvas.
- Dashboard BEP/ROI.
```

---

#### `HPP_Style_04_CompositionDonut.html`

Judul:

```text
HPP COMPOSITION DONUT & LEGEND
```

Fungsi:

```text
Mengatur visual komposisi biaya variabel.
```

Maksud:

```text
Tempat style donut chart, legend, warna kategori, label persentase donut, dan panel komposisi biaya.
```

Tujuan:

```text
Jika masalah ada pada donut chart, warna legend, label persen, atau panel komposisi biaya, file ini yang dituju.
```

Catatan penting:

```text
Jika donut dibuat dengan canvas/Chart.js, warna slice chart kemungkinan tidak bisa diubah dari CSS.
Jika warna slice tidak berubah, cari renderer JS donut yang relevan.
```

---

#### `HPP_Style_05_OutletTransition.html`

Judul:

```text
HPP OUTLET SWITCHING & TRANSITION
```

Fungsi:

```text
Mengatur transisi visual saat pindah outlet laundry.
```

Maksud:

```text
Tempat loading state, fade, soft blur, skeleton, smooth transition, dan animasi ringan khusus HPP.
```

Tujuan:

```text
Jika pindah outlet terasa kasar, angka lompat, card blank, atau transisi tidak premium, file ini yang dicek.
```

Jangan taruh di sini:

```text
- JS outlet switch.
- Flow data.
- Rumus.
- Save/load backend.
```

---

#### `HPP_Style_06_Responsive.html`

Judul:

```text
HPP RESPONSIVE RULES
```

Fungsi:

```text
Mengatur responsive HPP untuk HP, tablet, laptop, dan PC.
```

Maksud:

```text
Tempat semua media query HPP.
```

Tujuan:

```text
Jika masalah muncul hanya di ukuran layar tertentu, file ini yang dituju.
```

Kapan disentuh:

```text
- Desktop/laptop tidak satu frame.
- Tablet kepotong.
- HP horizontal scroll.
- Font/spacing perlu beda antar device.
```

---

#### `HPP_Style_90_LegacyReview.html`

Judul:

```text
HPP LEGACY REVIEW
```

Fungsi:

```text
Menampung CSS lama yang belum aman dihapus.
```

Maksud:

```text
Agar pembersihan tetap aman dan tidak langsung merusak tampilan.
```

Tujuan:

```text
Memudahkan review lanjutan sebelum style benar-benar dihapus permanen.
```

Aturan:

```text
Jika masih ragu style dipakai atau tidak, jangan hapus.
Jika sudah pasti tidak dipakai setelah visual test, baru boleh dihapus pada patch berikutnya.
```

---

#### `HPP_Style_99_Hotfix.html`

Judul:

```text
HPP HOTFIX OVERRIDES
```

Fungsi:

```text
Tempat patch cepat sementara.
```

Maksud:

```text
Agar patch baru tidak langsung menumpuk di file utama.
```

Tujuan:

```text
Saat ada bug kecil, patch bisa ditaruh di sini dulu. Setelah stabil, pindahkan ke file kategori yang tepat.
```

Aturan:

```text
Hotfix harus diberi komentar tanggal dan tujuan.
Jangan jadikan file ini tempat permanen semua style.
Setelah stabil, pindahkan ke file sesuai kategori.
```

---

## 3. JS HPP — Struktur Rencana Saat Nanti Dipecah

JS HPP belum wajib dipecah jika belum diminta. Jika nanti dipecah, gunakan struktur berikut.

### `HPP_00_State.html`

Fungsi:

```text
State outlet aktif, layanan aktif, dan cache data HPP.
```

Kapan disentuh:

```text
- Outlet aktif tidak sinkron.
- Data outlet lama masih terbawa.
- Cache perlu refresh.
```

---

### `HPP_01_Utils.html`

Fungsi:

```text
Formatter rupiah, persen, safe number, clamp number, normalisasi angka.
```

Kapan disentuh:

```text
- Format Rp salah.
- Persen salah.
- Angka NaN/undefined muncul.
```

---

### `HPP_02_RenderTopCards.html`

Fungsi:

```text
Render HPP Cuci, HPP Kering, HPP Setrika.
```

Kapan disentuh:

```text
- 3 card atas tidak update.
- HPP Cuci/Kering/Setrika salah tampil.
```

---

### `HPP_03_RenderVariableCards.html`

Fungsi:

```text
Render Gas, Listrik, Air, Packing, Chemical, Admin/Nota.
```

Kapan disentuh:

```text
- Card bawah datanya salah/tidak muncul.
- HTML render card bawah perlu perbaikan mikro.
```

---

### `HPP_04_RenderDonutChart.html`

Fungsi:

```text
Render donut chart dan mapping warna kategori.
```

Kapan disentuh:

```text
- Donut tidak muncul.
- Slice warna salah.
- Legend tidak sinkron dengan chart.
```

---

### `HPP_05_OutletSwitch.html`

Fungsi:

```text
Proses pindah outlet HPP.
```

Kapan disentuh:

```text
- Pindah outlet lambat.
- Data tidak langsung berubah.
- Transisi outlet tidak sinkron.
```

---

### `HPP_06_Events.html`

Fungsi:

```text
Event listener khusus dashboard HPP.
```

Kapan disentuh:

```text
- Dropdown, input, tab, tombol, atau event khusus HPP tidak bekerja.
```

---

## 4. Panduan Cepat Memilih File Saat Bug HPP

| Gejala | File Pertama yang Dicek | Jangan Langsung Sentuh |
|---|---|---|
| Dashboard tidak full layar | `HPP_Style_01_ViewShell.html` | JS render, backend |
| Card bawah tidak sejajar | `HPP_Style_03_VariableCards.html` | Rumus, sheet |
| 3 card atas font/spacing bermasalah | `HPP_Style_02_TopCards.html` | Card bawah, backend |
| Donut/legend berantakan | `HPP_Style_04_CompositionDonut.html` | Code.gs/Code.js |
| Slice warna donut canvas salah | Renderer donut JS terkait | CSS jika chart canvas |
| Transisi pindah outlet kasar | `HPP_Style_05_OutletTransition.html` lalu JS outlet jika perlu | Flow outlet global |
| Masalah hanya HP/tablet | `HPP_Style_06_Responsive.html` | Desktop CSS utama |
| CSS/comment tampil sebagai teks | File pecahan HPP style + `HPP_Styles.html` + include di `Code.js` jika perlu | Desain card |
| Data Rp0 sebelum pilih cabang | Jangan dianggap bug jika memang belum ada outlet aktif | Rumus/backend |
| Save data gagal | JS save terkait + `Code.gs/Code.js` | CSS |
| Data sheet tidak terbaca | `Code.gs/Code.js` + mapping sheet | CSS/UI |

---

## 5. Aturan Include Apps Script

Untuk file style pecahan:

```text
Setiap file CSS pecahan wajib punya <style>...</style> sendiri.
HPP_Styles.html hanya include.
Jangan taruh komentar CSS di luar <style>.
Jangan membuat <style> nested.
```

Jika memakai nested include, fungsi include di backend harus mendukung template evaluation untuk aggregator yang berisi `<?!= include(...) ?>`.

Pola aman jika memang dibutuhkan:

```javascript
function include(filename) {
  if (filename === 'HPP_Styles') {
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
  }
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

Catatan:

```text
Jangan ubah Code.js jika include sudah berjalan.
Code.js hanya disentuh jika masalah benar-benar include/nested include.
```

---

## 6. Lifecycle Hotfix

Gunakan alur ini setiap ada patch cepat:

```text
1. Patch kecil masuk HPP_Style_99_Hotfix.html.
2. Visual test.
3. Jika stabil, pindahkan ke file kategori yang benar.
4. Hapus override duplicate yang sudah tidak perlu.
5. Update PROJECT_FILE_MAP.md jika ada file/fungsi baru.
```

Jangan biarkan `HPP_Style_99_Hotfix.html` menjadi tempat permanen seluruh style.

---

## 7. Aturan Audit Duplicate CSS

Saat menemukan style duplicate:

```text
1. Duplicate identik: boleh sisakan satu setelah cek cascade.
2. Duplicate beda nilai: jangan hapus tanpa visual test.
3. Duplicate dalam media query: jangan hapus jika masih mengatur responsive.
4. Hotfix terbaru: biasanya tetap dipertahankan sampai stabil.
5. Legacy yang belum aman: pindahkan atau pertahankan di HPP_Style_90_LegacyReview.html.
```

Larangan:

```text
Jangan menghapus style hanya karena terlihat mirip.
Jangan menghapus class/ID yang kemungkinan dipakai JS.
Jangan menghapus fallback mobile walaupun tidak aktif di desktop.
```

---

## 8. Template Header File Baru

Setiap file pecahan wajib diawali header seperti ini di dalam `<style>` atau di dalam komentar JS sesuai jenis file:

```css
/* =========================================================
   FILE: HPP_Style_03_VariableCards.html
   TITLE: HPP VARIABLE COST CARDS
   SCOPE: #view-hpp only
   PURPOSE: Mengatur card Gas, Listrik, Air, Packing, Chemical, Admin/Nota.
   DO NOT PLACE: BEP, Dashboard lain, Backend, Sheet, Formula, Global CSS.
   LAST UPDATED: 2026-06-11
========================================================= */
```

Marker blok:

```css
/* [HPP_VARIABLE_CARD_HEADER] */
/* [HPP_VARIABLE_CARD_BODY] */
/* [HPP_VARIABLE_CARD_PERCENT_BADGE] */
/* [HPP_VARIABLE_CARD_DETAILS] */
```

---

## 9. Output Wajib Saat AI Memberi Patch

Setiap patch harus melaporkan:

```text
1. Target view/fitur
2. File yang diubah
3. Selector/fungsi yang ditemukan
4. Alasan file dipilih
5. Bagian yang tidak disentuh
6. Cara test
7. Risiko kecil jika ada
```

Untuk patch performa/cache, tambahkan:

```text
1. Apakah ada google.script.run baru?
2. Apakah ada read/write sheet baru?
3. Apakah render full atau parsial?
4. Cache key dan aturan refresh jika ada.
```

---

## 10. Ringkasan Larangan Utama

```text
Jangan ubah struktur besar.
Jangan refactor total.
Jangan ubah rumus.
Jangan ubah database/sheet.
Jangan sentuh fitur lain.
Jangan menebak-nebak file.
Jangan patch di aggregator jika file kategori tersedia.
Jangan menambah backend call jika tidak perlu.
Jangan render full dashboard jika cukup render parsial.
Jangan hapus CSS legacy sebelum aman.
```

---

## 11. Cara Pakai Dokumen Ini di Prompt Harian

Gunakan format berikut:

```text
Baca dan patuhi AI_PATCH_RULES_FAST_SCOPE.md.
Baca PROJECT_FILE_MAP.md.
Gunakan FAST SCOPE MODE.

Fokus hanya pada:
[nama view / fitur]

Masalah:
[masalah spesifik]

Batasan wajib:
- Jangan ubah struktur besar.
- Jangan refactor total.
- Jangan ubah rumus.
- Jangan ubah database/sheet.
- Jangan sentuh fitur lain.
- Jangan menebak file.
- Patch hanya di titik yang diperlukan.

Sebelum patch, tuliskan file target dan alasan singkat.
Setelah itu berikan patch final.
```
