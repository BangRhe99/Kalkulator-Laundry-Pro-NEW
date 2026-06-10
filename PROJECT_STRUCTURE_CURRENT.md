# STATUS PROJECT TERBARU

* Index.html sekarang menjadi shell utama.
* HPP sudah modular per domain.
* JS2 sudah dipisah menjadi partial kecil.
* App shell sudah dipisah.
* V4/BEP masih besar dan perlu hati-hati.
* HPP_Styles masih besar dan mayoritas CSS.
* JS3 masih besar dan perlu audit sebelum dipecah.
* Code.gs masih besar dan server-side, pecah terakhir jika diperlukan.

# STRUKTUR FILE UTAMA

Index.html:

* Shell utama.
* Memuat view dan include partial.
* Jangan taruh logic panjang baru di sini.

View:

* V1.html = Dashboard utama.
* V2.html = Profil/Kapasitas outlet.
* V3.html = Katalog.
* V4.html = BEP/Target Titik Impas/ROI.
* V5.html = Cost Structure Dashboard jika masih dipakai.
* Modal.html = struktur utama view HPP.

App Shell:

* App_Loading.html = loading overlay.
* App_Navigation.html = sidebar/menu.
* App_Header.html = header dan kategori outlet.
* App_Router.html = switchMainTab/routing view.
* App_OutletBridge.html = handleGlobalOutletChange.
* App_Init.html = init awal.
* App_GlobalStyles.html = CSS global.
* App_UIBridge.html = UI bridge, observer, animation.

HPP:

* HPP_Styles.html = CSS HPP.
* HPP_State.html = state HPP.
* HPP_DashboardRender.html = dashboard HPP, total, donut, card.
* HPP_FormController.html = open/close form HPP.
* HPP_Bridge.html = bridge visual/interaksi HPP.
* HPP_OutletSwitch.html = switch outlet HPP, loader, refresh row.
* HPP_Gas.html = logic gas.
* HPP_Electric.html = logic listrik.
* HPP_Water.html = logic air.
* HPP_Packing.html = logic packing.
* HPP_Chemical.html = logic chemical.
* HPP_Nota.html = logic nota/admin.

JS2 Modular:

* JS2_StateCache.html = APP_STATE, masterDataCabang, masterDataHPP, cache.
* JS2_CapacityUtils.html = helper kapasitas, normalize, hybrid rows, zettBotFastBoot.
* JS2_UIFeedback.html = runServer, toast, confirm, alert.
* JS2_GlobalStateMachine.html = StateMachine dan resetHPPDashboardToZero.
* JS2_OutletDataBridge.html = applyCabangUIData, loadDaftarCabang.
* JS2_KapasitasForm.html = helper form kapasitas, pilihCabang, filterCabang.
* JS2_CapacityEngine.html = addMesin, _extractMesin, validasi outlet, calculateCapacity.
* JS2_HPPBridge.html = resetFormHPP, populateFormHPP, HPP listener, checkHPPLock.
* JS2.html = sisa save/sync/delete/HPP save. Jangan dipindah lagi tanpa instruksi.

Server:

* Code.gs = server-side Apps Script, spreadsheet, API, HtmlService, data operation.
* Pecah Code.gs hanya jika sangat perlu dan dengan hati-hati.

# INCLUDE ORDER TERBARU

Urutan include terbaru di Index.html:

* V1
* V2
* V3
* V4
* V5
* HPP_Styles
* Modal
* HPP_State
* HPP_DashboardRender
* HPP_FormController
* HPP_Bridge
* HPP_OutletSwitch
* HPP_Gas
* HPP_Electric
* HPP_Water
* HPP_Packing
* HPP_Chemical
* HPP_Nota
* App_Loading
* JS1
* JS2_StateCache
* JS2_CapacityUtils
* JS2_UIFeedback
* JS2_GlobalStateMachine
* JS2_OutletDataBridge
* JS2_KapasitasForm
* JS2_CapacityEngine
* JS2_HPPBridge
* JS2
* JS3
* JS5
* App_Navigation
* App_Header
* App_Router
* App_OutletBridge
* App_Init
* App_GlobalStyles
* App_UIBridge

Catatan:

* Jangan mengubah include order tanpa alasan kuat.
* Jika mengubah include order, wajib cek dependency.

# LARGE FILE WATCHLIST

* HPP_Styles.html = besar, CSS HPP, kandidat pecah nanti.
* V4.html = besar, BEP/ROI, kandidat modularisasi BEP.
* JS3.html = besar, perlu audit sebelum pecah.
* Code.gs = besar, server-side, pecah terakhir.
* JS2.html = sudah diperkecil, sisa save/sync/delete/HPP save.

# LEGACY NOTES

Catatan relevan dari INTEGRATION_AUDIT_V5.md:

* V5 pernah menjadi Premium Cost Structure Dashboard.
* V5 pernah sync dari HPP card dan membaca nilai:
  * dash-hpp-total
  * dash-card-gas
  * dash-card-listrik
  * dash-card-air
  * dash-card-packing
  * dash-card-bahan
  * dash-card-nota
  * varian persentase masing-masing card
* Mapping ID V5 lama pernah memakai suffix `-v5`, misalnya `dash-hpp-total-v5`, `dash-card-gas-v5`, dan seterusnya.
* V5 pernah memakai MutationObserver dan interval fallback untuk sinkronisasi dari HPP.
* Informasi legacy ini hanya referensi debug. Jangan menghidupkan ulang flow V5 lama tanpa audit struktur saat ini.
