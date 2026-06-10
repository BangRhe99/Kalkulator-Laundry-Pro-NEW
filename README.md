# Kalkulator Laundry Pro

Platform: Google Apps Script V8 Web App.

Kalkulator Laundry Pro adalah aplikasi kalkulator laundry untuk profil outlet, kapasitas, HPP, BEP, ROI, dashboard, dan struktur biaya. Project ini sudah dimodularisasi agar debugging lebih cepat dan perubahan fitur tidak mudah merusak domain lain.

# Dokumentasi

* `PEDOMAN.md` = aturan kerja AI/Codex/developer.
* `PROJECT_STRUCTURE_CURRENT.md` = struktur file terbaru.
* `DEBUG_ROUTING_MAP.md` = peta debug cepat.
* `PERFORMANCE_AND_DATA_INTEGRITY.md` = aturan performa, multi-user, dan keamanan data.
* `CHANGELOG.md` = catatan perubahan besar.

# Aturan Singkat

* Jangan ubah logic global tanpa izin.
* Debug berdasarkan file terkait.
* Jangan membaca seluruh project jika tidak perlu.
* Untuk bug HPP, buka file HPP terkait.
* Untuk bug kapasitas, buka JS2_CapacityEngine/Utils/Form.
* Untuk bug BEP, buka V4.
* Untuk bug server, buka Code.gs.
