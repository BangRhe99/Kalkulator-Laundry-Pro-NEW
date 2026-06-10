# DEBUG ROUTING MAP

## Bug Aplikasi Blank Saat Dibuka

Cek:

* Index.html
* App_Init.html
* App_Router.html
* App_Loading.html
* JS2_StateCache.html
* JS2_OutletDataBridge.html

## Bug Sidebar/Menu Tidak Pindah

Cek:

* App_Navigation.html
* App_Router.html
* App_Header.html

## Bug Loading Tidak Hilang

Cek:

* App_Loading.html
* App_UIBridge.html
* function yang memanggil showLoading/hideLoading

## Bug Header Kategori Outlet Salah

Cek:

* App_Header.html
* JS2_OutletDataBridge.html
* App_OutletBridge.html

## Bug Dropdown Outlet Kosong

Cek:

* JS2_StateCache.html
* JS2_OutletDataBridge.html
* JS2_CapacityUtils.html
* Code.gs jika data server tidak masuk

## Bug Profil/Kapasitas Outlet

Cek:

* JS2_KapasitasForm.html
* JS2_CapacityEngine.html
* JS2_CapacityUtils.html
* JS2_OutletDataBridge.html

## Bug Hitungan Kapasitas Salah

Cek:

* JS2_CapacityEngine.html
* JS2_CapacityUtils.html

## Bug Simpan/Edit Outlet

Cek:

* JS2.html
* JS2_CapacityEngine.html
* JS2_OutletDataBridge.html
* JS2_UIFeedback.html
* Code.gs

## Bug Hapus Outlet

Cek:

* JS2.html
* JS2_OutletDataBridge.html
* Code.gs

## Bug HPP Pilih Outlet Lambat/Blank

Cek:

* HPP_OutletSwitch.html
* JS2_HPPBridge.html
* HPP_State.html
* HPP_DashboardRender.html
* App_OutletBridge.html

## Bug HPP Dashboard/Total/Donut/Card

Cek:

* HPP_DashboardRender.html
* HPP_State.html
* HPP_Styles.html

## Bug HPP Form Tidak Buka/Tutup

Cek:

* HPP_FormController.html
* HPP_Bridge.html
* Modal.html

## Bug HPP Gas

Cek:

* HPP_Gas.html
* JS2_HPPBridge.html

## Bug HPP Listrik

Cek:

* HPP_Electric.html
* JS2_HPPBridge.html

## Bug HPP Air

Cek:

* HPP_Water.html
* JS2_HPPBridge.html

## Bug HPP Packing

Cek:

* HPP_Packing.html
* JS2_HPPBridge.html

## Bug HPP Chemical

Cek:

* HPP_Chemical.html
* JS2_HPPBridge.html

## Bug HPP Nota/Admin

Cek:

* HPP_Nota.html
* JS2_HPPBridge.html

## Bug Simpan HPP

Cek:

* JS2.html
* file HPP komponen terkait
* Code.gs

## Bug BEP/Target Titik Impas

Cek:

* V4.html
* App_OutletBridge.html
* data HPP terkait
* Code.gs jika data server bermasalah

## Bug Katalog

Cek:

* V3.html
* JS terkait jika ada
* Code.gs jika data dari server

## Bug Server/Spreadsheet

Cek:

* Code.gs
* google.script.run caller di client
* LockService
* nama sheet/kolom

## Bug Performa Lambat

Cek:

* google.script.run berulang
* render ulang full DOM
* event listener dobel
* MutationObserver/ResizeObserver
* loop outlet/HPP/BEP
* spreadsheet read/write di Code.gs
