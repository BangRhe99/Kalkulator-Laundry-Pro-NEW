# AI PATCH RULES — FAST SCOPE & ZERO GUESSING

Dokumen ini adalah aturan kerja utama untuk setiap proses perbaikan bug, penyempurnaan UI/UX, atau penambahan fitur pada aplikasi **Kalkulator Laundry Pro** berbasis Google Apps Script, HTML, CSS, dan JavaScript native.

Tujuan utama dokumen ini adalah membuat proses patch berjalan **cepat, presisi, langsung ke file yang benar**, tanpa menebak-nebak, tanpa refactor besar, dan tanpa melebar ke modul lain.

---

## 1. Prinsip Utama

Setiap pekerjaan wajib mengikuti prinsip berikut:

1. **Tepat titik**  
   Kerjakan hanya bagian yang diminta user.

2. **Tepat file**  
   Jangan membuka, mengubah, atau menganalisis file yang tidak berhubungan langsung dengan masalah.

3. **Tepat fungsi**  
   Cari fungsi, selector, class, ID, atau event handler yang memang menjadi sumber masalah.

4. **Patch kecil lebih utama daripada refactor besar**  
   Solusi harus berupa patch terarah, bukan membongkar struktur besar.

5. **Tidak boleh mengubah struktur utuh**  
   Jangan mengubah arsitektur aplikasi, struktur HTML utama, struktur sheet, database, mapping header, atau alur data kecuali user meminta secara eksplisit.

6. **Tidak boleh menebak**  
   Jika belum yakin file mana yang relevan, lakukan pencarian cepat berdasarkan ID, class, nama fungsi, teks UI, atau nama view.

7. **Tidak boleh melebar**  
   Jangan memperbaiki hal lain yang tidak diminta walaupun terlihat kurang rapi.

---

## 2. Mode Kerja Cepat

Sebelum menulis kode, AI wajib melakukan langkah singkat berikut:

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

### Langkah B — Cari File Relevan Saja

Gunakan pencarian berdasarkan kata kunci yang paling dekat dengan masalah:

```text
ID view       : #view-hpp, #view-bep, #dashboard-view, #mainViewScroller
ID elemen     : dash-card-gas, dash-card-listrik, dash-hpp-total
Class         : hpp-card-dash, hpp-dashboard-view, bep-fixed-cost-premium
Fungsi        : calculateListrik, StateMachine.calculateTotal, switchMainTab, handleGlobalOutletChange
Teks UI       : Struktur Biaya, Target Titik Impas, Total HPP Variabel, Biaya Tetap Bulanan
```

AI wajib menemukan lokasi nyata sebelum memberi patch.

### Langkah C — Buat Scope Lock

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

## 3. Peta File Awal

Gunakan peta ini sebagai arahan awal. Tetap verifikasi dengan pencarian di repo sebelum patch.

| Area Masalah | File Prioritas | Alasan |
|---|---|---|
| Struktur Biaya HPP / dashboard HPP | `Modal.html` | Berisi `#view-hpp`, dashboard HPP, card biaya, form HPP, dan elemen seperti `dash-card-gas`, `dash-card-listrik`, `dash-hpp-total`. |
| Navigasi antar menu / tab utama | `JS3.html` atau script navigasi aktif | Berisi logika pindah view seperti `switchMainTab` dan aktivasi `main-view`. |
| Header global / outlet selector global | `Index.html` | Berisi shell aplikasi, header, `inputNamaHPP`, include file view, dan konteks outlet global. |
| Target Titik Impas / BEP | `V4.html` dan file JS terkait BEP | Untuk dashboard BEP, grafik BEP, biaya tetap bulanan, margin kontribusi, dan volume BEP. |
| Kalkulasi listrik HPP | `JS2.html` atau file kalkulasi HPP aktual | Untuk fungsi seperti `calculateListrik`, `zettRenderElectricCard`, dan binding input listrik. |
| Backend, database, spreadsheet, API Apps Script | `Code.gs` / `Code.js` | Hanya disentuh jika masalah benar-benar berasal dari server, sheet, load/save, atau endpoint. |
| Style global tambahan | file style khusus seperti `V5.styles.html` jika tersedia | Hanya untuk token visual global, bukan untuk patch view spesifik jika CSS lokal cukup. |

Catatan penting:
- Peta file ini bukan izin untuk membuka semua file.
- Peta ini hanya membantu menentukan titik awal.
- File final yang disentuh tetap harus berdasarkan bukti dari pencarian selector/fungsi.

---

## 4. Aturan Anti-Refactor Besar

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

---

## 5. Aturan Penambahan Fitur

Saat user meminta fitur baru, AI wajib membedakan apakah fitur tersebut:

```text
A. Fitur visual saja
B. Fitur interaksi frontend
C. Fitur kalkulasi
D. Fitur penyimpanan data
E. Fitur backend/server
F. Fitur export/PDF
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

---

## 6. Aturan Debugging Cepat

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

## 7. Aturan Patch Output

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

## 8. Aturan Khusus UI/UX Hyper Premium

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

## 9. Aturan Transisi dan Performa

Jika menambahkan animasi atau transisi:

1. Gunakan `opacity`, `transform`, dan `filter` secara ringan.
2. Hindari animasi layout berat seperti mengubah `width`, `height`, `top`, `left` terus-menerus.
3. Gunakan `requestAnimationFrame` untuk transisi render.
4. Jangan membuat loading yang menutup seluruh layar jika masalah hanya satu card.
5. Tambahkan `prefers-reduced-motion` bila animasi cukup banyak.
6. Jangan menjalankan transisi berulang pada setiap input kecil jika hanya dibutuhkan saat pindah outlet.

---

## 10. Aturan Outlet Change

Jika masalah terjadi saat pindah outlet:

AI wajib mencari jalur berikut lebih dulu:

```text
inputNamaHPP
handleGlobalOutletChange
outletContext
StateMachine.calculateTotal
restoreOldHppData
applyCabangUIData
render function terkait view aktif
```

Patch harus dibatasi pada:

```text
1. Handler outlet terkait view aktif
2. Render function view terkait
3. Loading/transisi lokal view terkait
```

Jangan mengubah semua mekanisme outlet global jika masalah hanya terjadi di satu dashboard.

---

## 11. Format Permintaan Ideal dari User

Saat user memberi tugas, AI sebaiknya mendorong format ini:

```text
Fokus view:
Masalah:
File yang ingin disentuh:
File yang tidak boleh disentuh:
Target hasil:
Screenshot/error jika ada:
```

Tetapi jika user sudah memberi cukup konteks, AI tidak perlu bertanya lagi. Langsung kerjakan dengan best effort.

---

## 12. Checklist Sebelum Patch

Sebelum memberi kode, jawab dalam hati:

```text
Apakah saya sudah tahu view yang dimaksud?
Apakah saya sudah tahu ID/class/fungsi yang relevan?
Apakah file yang disentuh benar-benar perlu?
Apakah patch ini bisa lebih kecil?
Apakah ada risiko mengubah rumus/data/sheet?
Apakah selector CSS sudah scoped?
Apakah patch ini bisa merusak modul lain?
```

Jika salah satu belum jelas, jangan melebar. Cari bukti selector/fungsi dulu.

---

## 13. Checklist Setelah Patch

Setelah patch, AI wajib memastikan:

```text
Tidak ada struktur utama yang berubah.
Tidak ada rumus yang berubah.
Tidak ada mapping sheet yang berubah.
Tidak ada fitur lain yang ikut tersentuh.
Patch hanya berada di file yang relevan.
CSS/JS memakai scope view.
Ada cara test sederhana.
```

---

## 14. Standar Jawaban Singkat untuk Patch Cepat

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

## 15. Perintah Wajib untuk AI Saat Mengerjakan Repo Ini

Gunakan instruksi berikut setiap kali mengerjakan patch:

```text
Kerjakan dengan mode FAST SCOPE.
Jangan menebak file.
Cari selector, fungsi, ID, atau teks UI yang relevan dulu.
Sentuh file sesedikit mungkin.
Jangan refactor besar.
Jangan ubah struktur utuh.
Jangan ubah rumus, sheet, backend, mapping header, atau modul lain jika tidak diminta.
Berikan patch yang langsung bisa ditempel.
Sebutkan lokasi tempel berdasarkan ID/class/fungsi, bukan nomor baris palsu.
```

---

## 16. Contoh Scope untuk Dashboard Struktur Biaya HPP

Jika user meminta perbaikan tampilan dashboard Struktur Biaya HPP, scope default adalah:

```text
Target view: #view-hpp
Target container: #hpp-dashboard-view
Target card: .hpp-card-dash
Target angka: #dash-hpp-total, #dash-card-gas, #dash-card-listrik, #dash-card-air, #dash-card-packing, #dash-card-bahan, #dash-card-nota
Target persen: #dash-card-gas-pct, #dash-card-listrik-pct, #dash-card-air-pct, #dash-card-packing-pct, #dash-card-bahan-pct, #dash-card-nota-pct
File prioritas: Modal.html
File tambahan hanya jika perlu: Index.html untuk outlet selector, JS3.html untuk navigasi tab, JS2.html untuk kalkulasi HPP
Tidak boleh disentuh: Code.gs/Code.js, sheet, BEP, ROI, dashboard utama, katalog layanan
```

Aturan patch:

```text
Jika hanya masalah layout/font/spacing/warna, cukup patch CSS scoped di Modal.html.
Jika masalah transisi saat pindah outlet, boleh tambah JS kecil scoped ke #view-hpp.
Jika data tidak muncul, baru cek fungsi kalkulasi/render terkait.
```

---

## 17. Kesimpulan Operasional

Dokumen ini wajib menjadi pagar kerja utama:

- Cepat karena langsung mencari file yang relevan.
- Aman karena tidak refactor besar.
- Presisi karena berdasarkan selector/fungsi nyata.
- Stabil karena tidak menyentuh rumus, sheet, backend, dan modul lain tanpa kebutuhan.
- Cocok untuk repo yang sudah dipecah menjadi banyak file.

Setiap patch harus selesai sebagai perbaikan kecil yang jelas, bukan perubahan besar yang membuat aplikasi sulit dikontrol.
