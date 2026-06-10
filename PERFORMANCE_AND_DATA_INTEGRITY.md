# PERFORMANCE PRINCIPLES

* Jangan panggil google.script.run berulang tanpa kebutuhan.
* Gunakan cache/client state jika data belum berubah.
* Hindari render ulang seluruh halaman.
* Update DOM sebagian saja jika memungkinkan.
* Gunakan debounce/throttle untuk input yang sering berubah.
* Jangan bind event listener berkali-kali.
* MutationObserver dan ResizeObserver harus terbatas.
* Hindari loop berat saat outlet switch.
* Hindari hitungan berat pada setiap keypress tanpa guard.
* Gunakan loading state yang jelas agar user tidak klik berkali-kali.

# GOOGLE APPS SCRIPT SERVER RULES

* Kurangi baca spreadsheet berulang.
* Batch read/write jika memungkinkan.
* Hindari operasi berat dalam loop.
* Gunakan LockService untuk operasi tulis penting.
* Selalu return response yang jelas.
* Jangan silent fail.
* Semua fungsi server yang dipanggil client harus punya try/catch jika berisiko.

# DATA INTEGRITY RULES

* Jangan ubah nama sheet/kolom tanpa migrasi.
* Jangan ubah struktur payload tanpa backward compatibility.
* Jika menambah field baru, beri fallback untuk data lama.
* Validasi ID outlet sebelum update/delete.
* Validasi row index sebelum write/delete.
* Jangan hapus data sebelum validasi.
* Simpan/update/delete harus punya success/failure handler.
* Jika ada optimistic update, siapkan rollback atau refresh ulang data.
* Hindari race condition saat banyak user simpan bersamaan.

# MULTI USER SAFETY

* LockService wajib untuk write penting.
* Jangan membuat dua jalur write untuk data yang sama.
* Hindari global server variable untuk state user.
* State user sebaiknya di client/local atau spreadsheet per request.
* Jangan asumsikan satu user saja.
* Semua save harus tahan terhadap request hampir bersamaan.
* Error harus tampil jelas ke user.

# OUTLET SWITCH SAFETY

* HPP switch dan BEP switch tidak boleh saling memicu loop.
* Gunakan lock/flag yang sudah ada.
* Jangan panggil refresh HPP/BEP berulang tanpa guard.
* Saat outlet berubah, bersihkan loader dengan aman.
* Pastikan data outlet valid sebelum render.

# FEATURE ADDITION RULES

Saat menambah fitur:

1. Tentukan domain fitur.
2. Pilih file partial sesuai domain.
3. Jangan masukkan logic baru ke Index.html.
4. Jangan gabungkan CSS besar dengan logic.
5. Jangan ubah flow fitur lain.
6. Tambahkan fallback untuk data lama.
7. Pastikan kompatibel dengan existing spreadsheet.
8. Tambahkan checklist test manual.
9. Jika fitur baru butuh server, pastikan success/failure handler.
10. Jika fitur menulis data, pastikan LockService.
