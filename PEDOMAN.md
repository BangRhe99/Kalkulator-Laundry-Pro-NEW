# PEDOMAN ENGINEERING KALKULATOR LAUNDRY PRO

Pedoman ini dipakai saat memperbaiki bug atau menambah fitur aplikasi. Fokus utama: stabil, cepat, mudah di-debug, dan aman untuk banyak user.

## Prioritas
1. Stabilitas sistem.
2. Integritas database dan spreadsheet.
3. Kompatibilitas fitur existing.
4. Minimal perubahan kode.
5. Performa dan efisiensi token.

<<<<<<< HEAD
## Aturan Mutlak
Dilarang melakukan refactor global, rewrite massal, redesign UI, rename variabel massal
=======
Fokus:

* stabilitas sistem
* integritas database
* kompatibilitas fitur existing
* performa aplikasi
* minimal perubahan kode
* efisiensi token/context
* debugging terarah

# PRIORITAS UTAMA

1. Stabilitas sistem
2. Integritas database
3. Kompatibilitas fitur existing
4. Performa aplikasi
5. Kemudahan debugging
6. Minimal perubahan kode
7. Efisiensi token/context

# ATURAN MUTLAK

Dilarang:

* refactor global tanpa izin
* rewrite massal
* redesign UI tanpa izin
* rename variabel massal
* mengubah flow utama
* mengubah struktur spreadsheet/database
* mengubah sinkronisasi spreadsheet tanpa izin
* mengubah fitur lain yang tidak terkait bug
* membuka seluruh project jika bug sudah jelas domainnya
* menambah logic panjang ke Index.html

# PROTOKOL ANALISIS

Server:

* syntax error
* runtime error
* TypeError
* undefined/null
* HtmlService conflict
* template literal conflict

Client:

* DOM error
* event listener dobel
* overlay/z-index
* konflik CSS/Tailwind
* loading/render issue

Data Flow:

* google.script.run
* parameter mismatch
* async flow
* silent fail
* success/failure handler

Data Integrity:

* LockService
* race condition
* spreadsheet write
* sinkronisasi data
* payload lama vs payload baru

# PROTOKOL ISOLASI

* Fokus hanya file terkait.
* Fokus hanya function terkait.
* Fokus hanya bug yang diminta.
* Jika patch berpotensi menyentuh fitur lain, berhenti dan jelaskan risiko.
* Jangan ubah struktur existing jika tidak perlu.
* Jangan tampilkan full code kecuali diminta.

# FORMAT BALASAN

Gunakan:

[KATEGORI ERROR]

[HASIL ANALISIS]

[RENCANA PERBAIKAN]

[STATUS AMAN]

[FILE DIUBAH]

[RINGKASAN REVISI]
>>>>>>> 455f771 (update)
