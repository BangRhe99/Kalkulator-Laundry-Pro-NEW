# AI PATCH RULES — FAST SCOPE, ZERO GUESSING & SCALE-SAFE ARCHITECTURE

Dokumen ini adalah aturan kerja utama untuk setiap proses perbaikan bug, penyempurnaan UI/UX, pemecahan file, optimasi performa, atau penambahan fitur pada aplikasi **Kalkulator Laundry Pro** berbasis Google Apps Script, HTML, CSS, dan JavaScript native.

Tujuan utama dokumen ini adalah membuat proses patch berjalan **cepat, presisi, langsung ke file yang benar**, tanpa menebak-nebak, tanpa refactor besar, tanpa melebar ke modul lain, dan tetap aman untuk aplikasi yang ditargetkan semakin kokoh saat dipakai banyak user.

**Update penting:** repo ini mulai diarahkan ke struktur file yang lebih modular. Setelah file dipecah, setiap patch wajib membaca **PROJECT_FILE_MAP.md** lebih dulu agar AI/developer langsung menuju file yang benar.

---

## 0. Visi Arsitektur Aplikasi

Aplikasi ini tidak hanya harus rapi secara file, tetapi juga harus kokoh secara arsitektur.

Target jangka panjang:

1. Proses perbaikan bug bisa langsung menuju titik file yang benar.
2. Penambahan fitur tidak merusak modul lama.
3. Tampilan tetap premium, presisi, dan konsisten.
4. Frontend bekerja cepat dan tidak sering menunggu backend.
5. Backend hanya dipanggil saat benar-benar perlu.
6. Google Sheet tidak dibaca/ditulis berulang-ulang untuk data yang sama.
7. Data outlet aktif sebaiknya dicache di frontend/state lokal.
8. Render UI tidak boleh menggambar ulang seluruh dashboard jika hanya satu card yang berubah.
9. Struktur file harus membantu AI/developer bekerja cepat, bukan membuat pencarian semakin melebar.

Catatan skala:

Jika banyak user memakai aplikasi bersamaan, bottleneck dapat terjadi di jalur berikut:

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

Karena itu, arah arsitektur yang wajib dijaga:

```text
Frontend bekerja lokal sebanyak mungkin
Backend dipanggil hanya saat perlu
Sheet dibaca/ditulis secara batch
Data aktif dicache
Render UI dilakukan parsial
Patch dilakukan sempit dan terukur
```

---

## 1. Prinsip Utama

Setiap pekerjaan wajib mengikuti prinsip berikut:

1. **Tepat titik**  
   Kerjakan hanya bagian yang diminta user.

2. **Tepat file**  
   Jangan membuka, mengubah, atau menganalisis file yang tidak berhubungan langsung dengan masalah.

3. **Tepat fungsi**  
   Cari fungsi, selector, class, ID, event handler, atau nama file yang memang menjadi sumber masalah.

4. **Patch kecil lebih utama daripada refactor besar**  
   Solusi harus berupa patch terarah, bukan membongkar struktur besar.

5. **Tidak boleh mengubah struktur utuh**  
   Jangan mengubah arsitektur aplikasi, struktur HTML utama, struktur sheet, database, mapping header, flow data, atau pola include kecuali user meminta secara eksplisit.

6. **Tidak boleh menebak**  
   Jika belum yakin file mana yang relevan, lakukan pencarian cepat berdasarkan ID, class, nama fungsi, teks UI, nama view, atau PROJECT_FILE_MAP.md.

7. **Tidak boleh melebar**  
   Jangan memperbaiki hal lain yang tidak diminta walaupun terlihat kurang rapi.

8. **Tidak boleh patch massal tanpa alasan**  
   Jangan membersihkan duplicate, menghapus legacy, atau memindahkan blok besar jika user hanya minta bug kecil.

9. **Tampilan tidak boleh berubah jika tugasnya hanya pecah file**  
   Jika tugasnya split file, hasil visual harus sama seperti sebelum split.

10. **Performa harus dipikirkan dari awal**  
   Jangan menambah panggilan backend, render full dashboard, atau read/write sheet berulang tanpa kebutuhan.

---

## 2. Mode Kerja Cepat

Sebelum menulis kode, AI wajib melakukan langkah singkat berikut.

### Langkah A — Pahami Permintaan User

Ringkas permintaan menjadi 3 bagian:

```text
Target fitur/view:
Masalah utama:
Batasan yang tidak boleh disentuh:
```

Contoh:

```text
Target fitur/view: Dashboard Struktur Biaya HPP
Masalah utama: card tidak penuh satu layar, font tidak presisi, transisi outlet kasar
Batasan: jangan ubah rumus, jangan ubah sheet, jangan ubah backend, jangan sentuh BEP/ROI/dashboard lain
```

### Langkah B — Baca PROJECT_FILE_MAP.md

Jika repo sudah memiliki `PROJECT_FILE_MAP.md`, AI wajib membaca file tersebut lebih dulu sebelum menebak file target.

Urutan pencarian:

```text
1. PROJECT_FILE_MAP.md
2. Nama view / teks UI
3. ID / class / selector
4. Nama fungsi render / event
5. File prioritas sesuai map
```

### Langkah C — Cari File Relevan Saja

Gunakan pencarian berdasarkan kata kunci yang paling dekat dengan masalah:

```text
ID view       : #view-hpp, #view-bep, #dashboard-view, #mainViewScroller
ID elemen     : dash-card-gas, dash-card-listrik, dash-hpp-total
Class         : hpp-card-dash, hpp-dashboard-view, hpp-process-card, bep-fixed-cost-premium
Fungsi        : calculateListrik, StateMachine.calculateTotal, switchMainTab, handleGlobalOutletChange
Teks UI       : Struktur Biaya, Target Titik Impas, Total HPP Variabel, Biaya Tetap Bulanan
File map      : HPP_Style_03_VariableCards.html, HPP_Style_04_CompositionDonut.html, HPP_Style_05_OutletTransition.html
```

AI wajib menemukan lokasi nyata sebelum memberi patch.

### Langkah D — Buat Scope Lock

Sebelum patch, tulis scope kerja:

```text
SCOPE LOCK:
File yang disentuh:
Bagian yang disentuh:
Bagian yang tidak disentuh:
Alasan file ini yang relevan:
```

Jika file yang relevan hanya 1 file, jangan menyentuh 2–5 file.

---

## 3. Peta File Utama Repo

Gunakan peta ini sebagai arahan awal. Tetap verifikasi dengan pencarian di repo sebelum patch.

| Area Masalah | File Prioritas | Alasan |
|---|---|---|
| Struktur Biaya HPP / dashboard HPP | `PROJECT_FILE_MAP.md` lalu file HPP terkait | Setelah CSS HPP dipecah, map menjadi pintu pertama agar tidak menebak. |
| Aggregator style HPP | `HPP_Styles.html` | Hanya berisi include berurutan. Jangan taruh CSS panjang di sini. |
| Layout besar HPP | `HPP_Style_01_ViewShell.html` | Untuk lebar dashboard, tinggi layar, grid utama, wrapper, background. |
| 3 card HPP atas | `HPP_Style_02_TopCards.html` | Untuk HPP Cuci, HPP Kering, HPP Setrika. |
| Card variabel bawah | `HPP_Style_03_VariableCards.html` | Untuk Gas, Listrik, Air, Packing, Chemical, Admin/Nota. |
| Donut komposisi biaya | `HPP_Style_04_CompositionDonut.html` | Untuk donut panel, legend, label persen, dan style komposisi biaya. |
| Transisi pindah outlet HPP | `HPP_Style_05_OutletTransition.html` | Untuk fade, switching state, loading, skeleton visual HPP. |
| Responsive HPP | `HPP_Style_06_Responsive.html` | Untuk HP, tablet, laptop, PC. |
| Legacy CSS HPP | `HPP_Style_90_LegacyReview.html` | Tempat CSS lama yang belum aman dihapus. |
| Hotfix HPP | `HPP_Style_99_Hotfix.html` | Tempat patch sementara. Setelah stabil, pindahkan ke file kategori. |
| Navigasi antar menu / tab utama | `JS3.html` atau script navigasi aktif | Berisi logika pindah view seperti `switchMainTab` dan aktivasi `main-view`. |
| Header global / outlet selector global | `Index.html` | Berisi shell aplikasi, header, `inputNamaHPP`, include file view, dan konteks outlet global. |
| Target Titik Impas / BEP | `V4.html` dan file JS terkait BEP | Untuk dashboard BEP, grafik BEP, biaya tetap bulanan, margin kontribusi, dan volume BEP. |
| Kalkulasi listrik HPP | `JS2.html` atau file kalkulasi HPP aktual | Untuk fungsi seperti `calculateListrik`, `zettRenderElectricCard`, dan binding input listrik. |
| Backend, database, spreadsheet, API Apps Script | `Code.gs` / `Code.js` | Hanya disentuh jika masalah benar-benar berasal dari server, sheet, load/save, include, atau endpoint. |

Catatan penting:

- Peta file ini bukan izin untuk membuka semua file.
- Peta ini hanya membantu menentukan titik awal.
- File final yang disentuh tetap harus berdasarkan bukti dari pencarian selector/fungsi.
- Setelah split file, jangan lagi menaruh patch CSS HPP langsung di `HPP_Styles.html` kecuali masalahnya aggregator/include.

---

## 4. Aturan Khusus Setelah File Dipecah

Setelah file besar dipecah menjadi banyak file, AI wajib mengikuti aturan berikut:

1. Baca `PROJECT_FILE_MAP.md` sebelum patch.
2. Tentukan file kategori yang paling relevan.
3. Jangan patch di aggregator jika bukan masalah include.
4. Jangan membuat file baru jika file kategori sudah ada.
5. Jangan menghapus legacy CSS kecuali terbukti aman.
6. Jika ragu style lama masih dipakai, pindahkan ke `HPP_Style_90_LegacyReview.html` atau pertahankan dulu.
7. Hotfix kecil boleh masuk `HPP_Style_99_Hotfix.html` sementara.
8. Setelah hotfix stabil, pindahkan ke file kategori yang benar.
9. Jangan membuat 30 file kecil untuk 1 fitur. File harus berbasis area besar.
10. Jangan mengubah nama class/ID karena JS mungkin bergantung pada selector tersebut.

### Aturan Tag Style untuk File Pecahan

Setiap file pecahan CSS yang di-include ke HTML wajib aman secara output browser.

Format aman:

```html
<style id="hpp-style-03-variable-cards">
/* =========================================================
   FILE: HPP_Style_03_VariableCards.html
   TITLE: HPP VARIABLE COST CARDS
   SCOPE: #view-hpp only
   PURPOSE: Mengatur card Gas, Listrik, Air, Packing, Chemical, Admin/Nota.
   DO NOT PLACE: BEP, Dashboard lain, Backend, Sheet, Formula, Global CSS.
========================================================= */

/* CSS di sini */
</style>
```

Larangan:

```text
- Jangan menaruh komentar CSS di luar <style>.
- Jangan membuat <style> nested di dalam <style>.
- Jangan membiarkan teks FILE/TITLE/SCOPE tampil sebagai teks mentah di halaman.
- Jangan menaruh CSS di HPP_Styles.html aggregator.
```

---

## 5. Struktur Resmi CSS HPP

Gunakan struktur resmi berikut untuk Dashboard Struktur Biaya / HPP.

```text
HPP_Styles.html
```

Fungsi:

```text
Aggregator utama style HPP. Hanya berisi include berurutan.
```

Urutan include wajib:

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

### File Kategori CSS HPP

| File | Judul | Fungsi | Kapan disentuh |
|---|---|---|---|
| `HPP_Style_00_Tokens.html` | HPP Style Tokens | Warna, radius, shadow, spacing, font scale, CSS variable | Jika masalah warna/spacing pondasi visual HPP |
| `HPP_Style_01_ViewShell.html` | HPP View Shell & Main Layout | Layout besar, lebar, tinggi, grid utama, background | Jika dashboard tidak full layar, kepotong, atau grid besar bermasalah |
| `HPP_Style_02_TopCards.html` | HPP Top Summary Cards | 3 card HPP atas | Jika HPP Cuci/Kering/Setrika font, nominal, spacing bermasalah |
| `HPP_Style_03_VariableCards.html` | HPP Variable Cost Cards | Gas, Listrik, Air, Packing, Chemical, Admin/Nota | Jika card bawah, deskripsi, alignment, list, persen bermasalah |
| `HPP_Style_04_CompositionDonut.html` | HPP Composition Donut & Legend | Donut panel, legend, label persen | Jika donut/legend/komposisi biaya bermasalah |
| `HPP_Style_05_OutletTransition.html` | HPP Outlet Switching & Transition | Loading, switching, fade, skeleton | Jika pindah outlet terasa kasar/blank/lompat |
| `HPP_Style_06_Responsive.html` | HPP Responsive Rules | Media query HP/tablet/laptop/PC | Jika masalah hanya muncul di ukuran layar tertentu |
| `HPP_Style_90_LegacyReview.html` | HPP Legacy Review | CSS lama yang belum aman dihapus | Jika audit duplicate belum berani hapus |
| `HPP_Style_99_Hotfix.html` | HPP Hotfix Overrides | Patch sementara yang harus menang cascade | Jika patch cepat perlu diterapkan tanpa refactor |

---

## 6. Struktur Rencana JS HPP

JS HPP tidak wajib dipecah sekarang kecuali user meminta. Jika nanti dipecah, gunakan arah berikut agar proses debugging semakin cepat.

| File Rencana | Fungsi | Kapan disentuh |
|---|---|---|
| `HPP_00_State.html` | State outlet aktif, layanan aktif, cache data HPP | Jika masalah state/cache/outlet aktif |
| `HPP_01_Utils.html` | Formatter rupiah, persen, safe number, clamp | Jika format angka/persen/rupiah salah |
| `HPP_02_RenderTopCards.html` | Render HPP Cuci, Kering, Setrika | Jika 3 card atas datanya salah/tidak update |
| `HPP_03_RenderVariableCards.html` | Render Gas, Listrik, Air, Packing, Chemical, Admin/Nota | Jika card bawah data/HTML render bermasalah |
| `HPP_04_RenderDonutChart.html` | Render donut chart dan warna kategori | Jika warna slice canvas/donut tidak berubah dari CSS |
| `HPP_05_OutletSwitch.html` | Proses pindah outlet HPP | Jika transisi data outlet lambat/tidak sinkron |
| `HPP_06_Events.html` | Event listener khusus dashboard HPP | Jika klik/input/tab tidak bekerja |

Aturan penting:

```text
Jangan pecah JS dan CSS sekaligus dalam satu patch besar.
Pecah CSS dulu sampai stabil.
Pecah JS hanya setelah struktur CSS aman dan visual sudah kembali normal.
```

---

## 7. Aturan Anti-Refactor Besar

AI dilarang melakukan hal berikut kecuali user meminta secara eksplisit:

1. Mengganti struktur HTML utama secara total.
2. Mengubah nama ID penting.
3. Mengubah nama class yang sudah dipakai JavaScript.
4. Mengubah mapping header spreadsheet.
5. Mengubah struktur sheet.
6. Mengubah fungsi save/load tanpa alasan kuat.
7. Mengubah rumus HPP, BEP, ROI, margin, depresiasi, atau payback.
8. Menggabungkan banyak file menjadi satu.
9. Memindahkan seluruh logic antar file.
10. Membuat framework baru.
11. Menambahkan library eksternal.
12. Mengubah semua desain aplikasi padahal user hanya minta satu bagian.
13. Membersihkan kode lama secara massal.
14. Mengubah flow outlet global jika masalah hanya tampilan card.
15. Menyentuh modul lain hanya karena terlihat berhubungan secara visual.
16. Melakukan optimasi performa yang mengubah hasil data tanpa test pembanding.
17. Menghapus CSS legacy hanya karena terlihat bertumpuk.

---

## 8. Aturan Penambahan Fitur

Saat user meminta fitur baru, AI wajib membedakan apakah fitur tersebut:

```text
A. Fitur visual saja
B. Fitur interaksi frontend
C. Fitur kalkulasi
D. Fitur penyimpanan data
E. Fitur backend/server
F. Fitur export/PDF
G. Fitur performa/cache
```

### Jika fitur visual saja

Prioritas file:

```text
View terkait + CSS lokal view tersebut
```

Jangan ubah backend.

### Jika fitur interaksi frontend

Prioritas file:

```text
View terkait + JS handler terkait
```

Jangan ubah sheet kecuali fitur membutuhkan penyimpanan.

### Jika fitur kalkulasi

Prioritas file:

```text
Fungsi kalkulasi terkait saja
```

Wajib sebutkan rumus lama dan rumus baru sebelum patch.

### Jika fitur penyimpanan data

Prioritas file:

```text
Frontend form + fungsi save/load + Code.gs/Code.js + sheet mapping
```

Wajib sangat hati-hati karena berisiko merusak data.

### Jika fitur performa/cache

Prioritas file:

```text
State/cache frontend + fungsi load/save terkait + backend endpoint terkait jika terbukti perlu
```

Wajib membuktikan titik lambatnya dulu. Jangan membuat cache baru tanpa tahu invalidation/reset-nya.

---

## 9. Aturan Performa dan Skala Banyak User

Untuk menjaga aplikasi tetap cepat dan lebih aman saat dipakai banyak user, AI wajib mengikuti aturan berikut.

### Frontend Local-First

```text
1. Ambil data penting sekali saat dibutuhkan.
2. Simpan data aktif di state/cache frontend.
3. Saat user berpindah tab, render dari state lokal jika data masih valid.
4. Saat user mengubah satu input, update card terkait saja.
5. Jangan full render dashboard jika hanya satu nilai berubah.
```

### Backend Minimal Call

```text
1. google.script.run hanya dipanggil saat perlu load/save/sync.
2. Jangan memanggil backend hanya untuk format angka, persen, atau filter sederhana.
3. Jangan memanggil backend berulang saat user mengetik kecuali ada debounce yang jelas.
4. Saat pindah outlet, gunakan cache jika data outlet sudah pernah dimuat dan belum invalid.
```

### Spreadsheet Batch Operation

```text
1. Baca data sheet secara batch.
2. Tulis data sheet secara batch.
3. Hindari getValue/setValue berulang dalam loop besar.
4. Hindari membaca ulang sheet yang sama untuk data yang sama dalam satu flow.
5. Gunakan LockService hanya saat benar-benar perlu menulis data kritis.
```

### Cache dan Invalidation

Jika menambah cache, wajib jelaskan:

```text
Cache key:
Data yang disimpan:
Kapan cache dipakai:
Kapan cache dihapus/di-refresh:
Risiko data stale:
Cara test:
```

### Render Parsial

Jika patch menyentuh render UI, prioritaskan:

```text
Update angka card terkait
Update persen terkait
Update chart terkait jika sumber datanya berubah
Jangan rebuild seluruh view jika tidak perlu
```

---

## 10. Aturan Debugging Cepat

Jika user melaporkan bug, AI wajib menjawab dengan format kerja berikut:

```text
1. Gejala yang terlihat:
2. Dugaan area file:
3. Selector/fungsi yang harus dicari:
4. File yang boleh disentuh:
5. File yang tidak boleh disentuh:
6. Patch minimal:
7. Cara cek hasil:
```

AI tidak boleh langsung memberi patch panjang sebelum jelas area masalahnya.

---

## 11. Aturan Patch Output

Setiap jawaban patch wajib mencantumkan:

```text
FILE YANG DIUBAH:
- Nama file
- Lokasi pencarian: ID / class / fungsi / komentar terdekat
- Letakkan patch sebelum/sesudah bagian apa

YANG DIUBAH:
- Ringkasan singkat

YANG TIDAK DIUBAH:
- Rumus
- Backend
- Spreadsheet
- Struktur utama
- Modul lain

CARA TEST:
- Langkah 1
- Langkah 2
- Langkah 3
```

Jika diminta baris, tetapi nomor baris tidak tersedia, AI wajib memberi patokan pencarian yang presisi:

```text
Cari komentar/fungsi/ID berikut:
Letakkan patch tepat setelah/sebelum bagian ini:
```

Jangan mengarang nomor baris.

---

## 12. Aturan Khusus UI/UX Hyper Premium

Untuk pekerjaan tampilan, AI hanya boleh mengubah area visual yang diminta:

```text
CSS lokal view
Class tambahan scoped
Animasi scoped
Spacing scoped
Typography scoped
Responsive scoped
```

Semua CSS wajib memakai scope view agar tidak bocor ke modul lain.

Contoh scope aman:

```css
#view-hpp .hpp-card-dash { }
#view-bep .bep-fixed-cost-premium { }
#dashboard-view .executive-card { }
```

Hindari selector global seperti:

```css
.card { }
button { }
.grid { }
```

Kecuali memang berada di dalam scope view:

```css
#view-hpp button { }
```

---

## 13. Aturan Transisi

Jika menambahkan animasi atau transisi:

1. Gunakan `opacity`, `transform`, dan `filter` secara ringan.
2. Hindari animasi layout berat seperti mengubah `width`, `height`, `top`, `left` terus-menerus.
3. Gunakan `requestAnimationFrame` untuk transisi render.
4. Jangan membuat loading yang menutup seluruh layar jika masalah hanya satu card.
5. Tambahkan `prefers-reduced-motion` bila animasi cukup banyak.
6. Jangan menjalankan transisi berulang pada setiap input kecil jika hanya dibutuhkan saat pindah outlet.
7. Saat outlet berganti, transisi cukup di view aktif, bukan seluruh aplikasi.

---

## 14. Aturan Outlet Change

Jika masalah terjadi saat pindah outlet, AI wajib mencari jalur berikut lebih dulu:

```text
inputNamaHPP
handleGlobalOutletChange
outletContext
StateMachine.calculateTotal
restoreOldHppData
applyCabangUIData
render function terkait view aktif
cache/state outlet aktif
```

Patch harus dibatasi pada:

```text
1. Handler outlet terkait view aktif
2. Render function view terkait
3. Loading/transisi lokal view terkait
4. Cache/state view terkait jika terbukti perlu
```

Jangan mengubah semua mekanisme outlet global jika masalah hanya terjadi di satu dashboard.

---

## 15. Aturan Pecah File

Jika user meminta pecah file besar:

1. Pecah berdasarkan area fitur, bukan asal potong baris.
2. Buat aggregator agar include lama tidak rusak.
3. Jangan mengubah tampilan saat proses split.
4. Jangan membersihkan duplicate besar pada patch yang sama kecuali duplicate identik dan aman.
5. Style yang belum aman dipindahkan ke LegacyReview.
6. Hotfix terakhir harus tetap menang cascade.
7. Lakukan validasi style balance.
8. Pastikan tidak ada teks CSS/comment tampil mentah di browser.
9. Jangan pecah terlalu banyak file kecil yang membuat navigasi sulit.
10. Setelah split, update `PROJECT_FILE_MAP.md`.

Checklist split CSS:

```text
[ ] Aggregator include benar
[ ] Semua file pecahan punya <style>...</style>
[ ] Tidak ada <style> nested
[ ] Tidak ada komentar di luar <style>
[ ] Visual sama seperti sebelum split
[ ] Responsive aman
[ ] Hotfix tetap paling bawah
[ ] Legacy belum dihapus jika belum aman
[ ] PROJECT_FILE_MAP.md diperbarui
```

---

## 16. Format Permintaan Ideal dari User

Saat user memberi tugas, AI sebaiknya mendorong format ini:

```text
Baca dan patuhi AI_PATCH_RULES_FAST_SCOPE.md.
Baca PROJECT_FILE_MAP.md.
Gunakan FAST SCOPE MODE.

Fokus view:
Masalah:
File yang ingin disentuh:
File yang tidak boleh disentuh:
Target hasil:
Screenshot/error jika ada:
```

Tetapi jika user sudah memberi cukup konteks, AI tidak perlu bertanya lagi. Langsung kerjakan dengan best effort.

---

## 17. Checklist Sebelum Patch

Sebelum memberi kode, jawab dalam hati:

```text
Apakah saya sudah membaca PROJECT_FILE_MAP.md?
Apakah saya sudah tahu view yang dimaksud?
Apakah saya sudah tahu ID/class/fungsi yang relevan?
Apakah file yang disentuh benar-benar perlu?
Apakah patch ini bisa lebih kecil?
Apakah ada risiko mengubah rumus/data/sheet?
Apakah selector CSS sudah scoped?
Apakah patch ini bisa merusak modul lain?
Apakah patch ini menambah panggilan backend?
Apakah patch ini melakukan render full tanpa kebutuhan?
```

Jika salah satu belum jelas, jangan melebar. Cari bukti selector/fungsi dulu.

---

## 18. Checklist Setelah Patch

Setelah patch, AI wajib memastikan:

```text
Tidak ada struktur utama yang berubah.
Tidak ada rumus yang berubah.
Tidak ada mapping sheet yang berubah.
Tidak ada fitur lain yang ikut tersentuh.
Patch hanya berada di file yang relevan.
CSS/JS memakai scope view.
Tidak ada panggilan backend baru tanpa alasan.
Tidak ada full render baru tanpa kebutuhan.
Ada cara test sederhana.
```

---

## 19. Standar Jawaban Singkat untuk Patch Cepat

Gunakan format ini agar proses cepat dan tidak bertele-tele:

```text
Target: [nama view/fitur]
File disentuh: [nama file]
Lokasi patch: [ID/class/fungsi]
Jenis patch: [CSS/JS/HTML kecil]
Risiko: rendah/sedang/tinggi

Patch:
[kode]

Test:
[langkah cek]
```

---

## 20. Perintah Wajib untuk AI Saat Mengerjakan Repo Ini

Gunakan instruksi berikut setiap kali mengerjakan patch:

```text
Kerjakan dengan mode FAST SCOPE.
Baca AI_PATCH_RULES_FAST_SCOPE.md.
Baca PROJECT_FILE_MAP.md.
Jangan menebak file.
Cari selector, fungsi, ID, atau teks UI yang relevan dulu.
Sentuh file sesedikit mungkin.
Jangan refactor besar.
Jangan ubah struktur utuh.
Jangan ubah rumus, sheet, backend, mapping header, atau modul lain jika tidak diminta.
Jangan menambah panggilan backend jika masalah bisa selesai di frontend.
Jangan render seluruh dashboard jika cukup update satu bagian.
Berikan patch yang langsung bisa ditempel.
Sebutkan lokasi tempel berdasarkan ID/class/fungsi, bukan nomor baris palsu.
```

---

## 21. Contoh Scope untuk Dashboard Struktur Biaya HPP

Jika user meminta perbaikan tampilan dashboard Struktur Biaya HPP, scope default adalah:

```text
Target view: #view-hpp
Target container: #hpp-dashboard-view
Target card atas: .hpp-process-card
Target card bawah: .hpp-card-dash / selector variable card existing
Target angka: #dash-hpp-total, #dash-card-gas, #dash-card-listrik, #dash-card-air, #dash-card-packing, #dash-card-bahan, #dash-card-nota
Target persen: #dash-card-gas-pct, #dash-card-listrik-pct, #dash-card-air-pct, #dash-card-packing-pct, #dash-card-bahan-pct, #dash-card-nota-pct
File prioritas layout: HPP_Style_01_ViewShell.html
File prioritas card atas: HPP_Style_02_TopCards.html
File prioritas card bawah: HPP_Style_03_VariableCards.html
File prioritas donut: HPP_Style_04_CompositionDonut.html
File prioritas transisi: HPP_Style_05_OutletTransition.html
File prioritas responsive: HPP_Style_06_Responsive.html
Tidak boleh disentuh: Code.gs/Code.js, sheet, BEP, ROI, dashboard utama, katalog layanan kecuali terbukti perlu
```

Aturan patch:

```text
Jika hanya masalah layout/font/spacing/warna, cukup patch CSS scoped di file HPP_Style terkait.
Jika masalah transisi saat pindah outlet, cek HPP_Style_05_OutletTransition.html dan JS outlet hanya jika style tidak cukup.
Jika data tidak muncul, baru cek fungsi kalkulasi/render terkait.
Jika warna slice donut canvas tidak berubah, cari renderer JS donut, bukan memaksa CSS.
```

---

## 22. Kesimpulan Operasional

Dokumen ini wajib menjadi pagar kerja utama:

- Cepat karena langsung mencari file yang relevan.
- Aman karena tidak refactor besar.
- Presisi karena berdasarkan selector/fungsi nyata.
- Stabil karena tidak menyentuh rumus, sheet, backend, dan modul lain tanpa kebutuhan.
- Siap untuk repo modular karena selalu memakai PROJECT_FILE_MAP.md.
- Lebih kokoh untuk banyak user karena mendorong frontend local-first, backend minimal call, batch operation, cache, dan render parsial.

Setiap patch harus selesai sebagai perbaikan kecil yang jelas, bukan perubahan besar yang membuat aplikasi sulit dikontrol.
