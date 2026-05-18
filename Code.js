/**
 * ==========================================
 * 🤖 BangRhe - Kalkulator HPP & BEP Backend
 * ==========================================
 * Arsitektur: Dynamic Header Mapping & Flat Columns
 * Fase: HYPER-PERFORMANCE (Server-Side Cache & Optimistic UI)
 */

const SHEET_ID = '1i_4Ik6hiFYRU0mi0gAB8nzgbE3G6TG3nCT1lkhcqBU0';

const SHEET_NAME_BEP = 'Riwayat_BEP_V2';
const SHEET_NAME_KAPASITAS = 'Master_Kapasitas_V2';

// Database untuk Struktur Biaya
const SHEET_HPP_1 = 'Struktur_Biaya_1';

// =========================================================================
// FIX RUNTIME ERROR
// =========================================================================

const SHEET_HPP_2 = 'Struktur_Biaya_2';
const SHEET_HPP_3 = 'Struktur_Biaya_3';

// =========================================================================
// [FITUR SIDEBAR SPREADSHEET (FILTER KOLOM)]
// =========================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 BangRhe Menu')
    .addItem('Buka Panel Filter Biaya', 'showFilterSidebar')
    .addToUi();
}

function showFilterSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Navigasi Kolom Biaya')
    .setWidth(320);

  SpreadsheetApp.getUi().showSidebar(html);
}
function getSidebarGroupData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) return { status: 'error', message: 'Sheet Struktur_Biaya_1 tidak ditemukan' };
    
    const lastCol = sheet.getLastColumn();
    
    if (lastCol <= 13) return { status: 'success', data: [] };
    
    const row1 = sheet.getRange(1, 14, 1, lastCol - 13).getDisplayValues()[0];
    
    const groups = [];
    let currentGroup = null;
    
    for (let i = 0; i < row1.length; i++) {
      const val = String(row1[i]).trim();
      const colIndex = 14 + i;
      
      if (val !== "") {
        if (currentGroup) {
          currentGroup.end = colIndex - 1;
          groups.push(currentGroup);
        }
        currentGroup = { name: val, start: colIndex, end: colIndex };
      } else if (currentGroup) {
        currentGroup.end = colIndex;
      }
    }
    
    if (currentGroup) {
      currentGroup.end = lastCol;
      groups.push(currentGroup);
    }
    
    return { status: 'success', data: groups };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function applySidebarFilter(startCol, endCol) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) return;
    
    const maxCols = sheet.getMaxColumns();
    
    if (maxCols >= 14) {
      sheet.hideColumns(14, maxCols - 13);
    }
    
    const start = Number(startCol);
    const end = Number(endCol);
    if (!isNaN(start) && !isNaN(end) && start >= 1 && end >= start && start <= maxCols) {
      const safeEnd = Math.min(end, maxCols);
      const numColsToShow = safeEnd - start + 1;
      if (numColsToShow > 0) {
        sheet.showColumns(start, numColsToShow);
      }
    }
    
    sheet.showColumns(1, 13);
    
  } catch (error) {
    console.error("Gagal filter kolom:", error);
  }
}

function resetSidebarFilter() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) return;
    
    sheet.showColumns(1, sheet.getMaxColumns());
  } catch (error) {
    console.error("Gagal reset filter:", error);
  }
}

// =========================================================================
// [ZETTBOT RE-ARCHITECTURE: CHUNKED SERVER-SIDE CACHING (ANTI-CRASH)]
// =========================================================================

function clearServerCache() {
  const cache = CacheService.getScriptCache();
  const chunks = cache.get('ZETT_MASTER_PAYLOAD_chunks');
  
  cache.remove('ZETT_MASTER_PAYLOAD');
  cache.remove('ZETT_MASTER_PAYLOAD_chunks');
  cache.remove('ZETT_PROFIL_OPERASIONAL_PAYLOAD');
  
  const chunkCount = parseInt(chunks, 10);
  if (!isNaN(chunkCount) && chunkCount > 0) {
    for (let i = 0; i < chunkCount; i++) {
      cache.remove('ZETT_MASTER_PAYLOAD_' + i);
    }
  }
}

function getZettBotInitialPayload(forceFresh) {
  try {
    // LAYER 3 CACHE: MULTI-CHUNK SERVER SIDE
    // Mencegah error cache size limit (max 100KB per item) dari Google
    const cache = CacheService.getScriptCache();
    const chunks = forceFresh === true ? null : cache.get('ZETT_MASTER_PAYLOAD_chunks');
    
    if (chunks) {
      if (chunks === '1') {
        const cachedData = cache.get('ZETT_MASTER_PAYLOAD');
        if (cachedData) return JSON.parse(cachedData);
      } else {
        let fullString = '';
        let isValid = true;
        for (let i = 0; i < parseInt(chunks); i++) {
          const chunkData = cache.get('ZETT_MASTER_PAYLOAD_' + i);
          if (!chunkData) { isValid = false; break; }
          fullString += chunkData;
        }
        if (isValid) return JSON.parse(fullString);
      }
    }
    
    const payload = {
      status: 'success',
      kapasitas: getDaftarKapasitas(),
      hpp: getAllHPPData(),
      transactions: getTransactions()
    };
    
    const payloadString = JSON.stringify(payload);
    const maxChunkSize = 90000; // Aman di bawah limit 100KB Google Cache
    
    if (payloadString.length <= maxChunkSize) {
      cache.put('ZETT_MASTER_PAYLOAD', payloadString, 300);
      cache.put('ZETT_MASTER_PAYLOAD_chunks', '1', 300);
    } else {
      const numChunks = Math.ceil(payloadString.length / maxChunkSize);
      cache.put('ZETT_MASTER_PAYLOAD_chunks', numChunks.toString(), 300);
      for (let i = 0; i < numChunks; i++) {
        cache.put('ZETT_MASTER_PAYLOAD_' + i, payloadString.substring(i * maxChunkSize, (i + 1) * maxChunkSize), 300);
      }
    }
    
    return payload;
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

function getProfilOperasionalPayload(forceFresh) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'ZETT_PROFIL_OPERASIONAL_PAYLOAD';

    if (forceFresh !== true) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) return JSON.parse(cachedData);
    }

    const payload = {
      status: 'success',
      kapasitas: getDaftarKapasitas()
    };

    cache.put(cacheKey, JSON.stringify(payload), 300);
    return payload;
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

// [ZETTBOT REVISI: SMART HEADER MAPPER]
function getHeaderMap(sheet) {
  try {
    if (!sheet) return {};
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return {}; 
    
    const maxRows = sheet.getMaxRows();
    if (maxRows < 1) return {};
    
    const topRows = sheet.getRange(1, 1, Math.min(2, maxRows), lastCol).getValues();
    
    let headers = topRows[0];
    
    if (topRows.length > 1) {
      const row2String = topRows[1].join('').toLowerCase();
      if (row2String.includes('timestamp') || row2String.includes('nama outlet') || row2String.includes('nama_outlet') || row2String.includes('kap gas') || row2String.includes('tdl')) {
        headers = topRows[1];
      }
    }

    return headers.reduce((acc, header, index) => {
      if (header !== undefined && header !== null && header !== "") {
        acc[String(header).trim()] = index;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Header Map Error dicegat: " + error.message);
    return {}; 
  }
}

function _getSpreadsheet() {
  try {
    const activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) return activeSS;
    return SpreadsheetApp.openById(SHEET_ID);
  } catch (error) {
    throw new Error("Gagal mengakses Spreadsheet. Pastikan ID benar dan memiliki akses.");
  }
}

// [ZETTBOT REVISI: ZERO BLOCKING HTML RENDER]
function doGet(e) {
  // setupDatabase() dihapus dari sini agar UI terbuka dalam 0.x detik
  const template = HtmlService.createTemplateFromFile('Index');
  template.userEmail = Session.getActiveUser().getEmail() || "pengguna@tidak-diketahui.com";
  return template.evaluate()
    .setTitle('Kalkulator Laundry Pro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupDatabase() {
  try {
    const ss = _getSpreadsheet();
    
    const headersBep = [
      'Timestamp', 'Nama_Outlet', 'Jam_Operasional', 
      'Biaya_Tetap', 'Biaya_Variabel_Per_Kg', 'Kapasitas_Per_Bulan', 
      'HPP_Per_Kg', 'Harga_Acuan_BEP', 'BEP_Kg', 'BEP_Rupiah',
      'Paket_Cuci_Setrika', 'Paket_Cuci_Lipat', 'Paket_Cuci_Saja', 'Paket_Setrika_Saja'
    ];
        const headersKap = [
      'Timestamp', 'Nama Outlet', 
      'Jam Buka', 'Jam Tutup', 'Tutup Hari Minggu', 
      'Target Okupansi Cuci', 'Target Okupansi Kering', 'Target Okupansi Setrika', 
      'Estimasi Cuci', 'Estimasi Kering', 'Estimasi Setrika',
      'Durasi Operasional', 'Kategori Laundry', 
      'Mesin Cuci', 'Mesin Pengering', 'Kap Cuci', 'Kap Kering', 'Durasi Cuci', 'Durasi Kering', 
      'Alat Setrika', 'Kap Setrika', 'Durasi Setrika', 
      'Tipe Mesin Cuci', 'Tipe Mesin Pengering', 'Tipe Setrika',
      'Pakai Pengering', 'Metode Pengeringan'
    ];

    const headersHPP1 = [
      'Timestamp', 'Nama Outlet', 'Kategori Laundry', 
      'Mesin Cuci', 'Kap Cuci', 'Durasi Cuci', 
      'Mesin Pengering', 'Kap Kering', 'Durasi Kering', 
      'Alat Setrika', 'Kap Setrika', 'Durasi Setrika', 'Tipe Setrika', 
      'Kap Gas', 'Harga Gas', 'Jam Gas', 'Menit Gas',
      'Estimasi Load Gas', 'Estimasi Biaya Gas', 'Gas Per Jam', 'Gas Per Menit',
      'Gas Per Load', 'Gas Per Kg', 'Setrika Per Jam', 'Setrika Per Kg',
      'TDL', 'Watt Cuci', 'kW Watt Cuci', 'Watt Kering', 'kW Watt Kering', 'Watt Pompa', 'kW Watt Pompa', 'Watt Setrika', 'kW Watt Setrika',
      'Cuci Per Load', 'Cuci Per Kg', 'Kering Per Load', 'Kering Per Kg', 'Listrik Setrika Jam', 'Listrik Setrika Kg',
      'Sumber Air', 'Harga Air', 'Harga Tangki', 'Liter Tangki', 'Air Cuci', 'Sumber Setrika', 'Galon Setrika', 'Vol Setrika', 'Liter Setrika', 'Jam Setrika', 'Kg Setrika',
      'Air Per Load', 'Air Per Kg', 'Air Setrika Jam', 'Air Setrika Kg'
    ];
    
    const headersHPP2 = [
      'Timestamp', 'Nama Outlet', 
      'Packing_PP_Active', 'Packing_PP_Harga', 'Packing_PP_Isi', 'Packing_PP_Kg', 
      'Packing_HD_Active', 'Packing_HD_Harga', 'Packing_HD_Isi', 'Packing_HD_Kg', 
      'Packing_Jinjing_Active', 'Packing_Jinjing_Harga', 'Packing_Jinjing_Isi', 'Packing_Jinjing_Kg'
    ];
    
    const headersHPP3 = [
      'Timestamp', 'Nama Outlet', 
      'Chem_Det_Active', 'Chem_Det_Type', 'Chem_Det_Harga', 'Chem_Det_Kapasitas', 'Chem_Det_Pemakaian', 
      'Chem_Sof_Active', 'Chem_Sof_Type', 'Chem_Sof_Harga', 'Chem_Sof_Kapasitas', 'Chem_Sof_Pemakaian', 
      'Chem_Par_Active', 'Chem_Par_Harga', 'Chem_Par_Kapasitas', 'Chem_Par_Pemakaian', 
      'Chem_Pel_Active', 'Chem_Pel_Type', 'Chem_Pel_Harga', 'Chem_Pel_Kapasitas', 'Chem_Pel_Pemakaian', 
      'Nota_Type', 'Nota_App_FeeType', 'Nota_App_HargaBulan', 'Nota_App_TrxBulan', 'Nota_App_HargaTrx', 'Nota_Thermal_Harga', 'Nota_Manual_Harga', 'Nota_Manual_LembarTotal', 'Nota_Manual_LembarTrx', 'Nota_RataKg'
    ];

    const initSheet = (sheetName, headerArr) => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, headerArr.length).setValues([headerArr]).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      } else if (sheet.getLastColumn() === 0) {
        sheet.getRange(1, 1, 1, headerArr.length).setValues([headerArr]).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
      }
      return sheet;
    };

    initSheet(SHEET_NAME_BEP, headersBep);
    
    let sheetKapasitas = ss.getSheetByName(SHEET_NAME_KAPASITAS);
    if (!sheetKapasitas || sheetKapasitas.getLastColumn() === 0) {
        initSheet(SHEET_NAME_KAPASITAS, headersKap);
    } else {
        const colMap = getHeaderMap(sheetKapasitas);
        const missingHeaders = [];
        if (!('Tipe Mesin Cuci' in colMap)) missingHeaders.push('Tipe Mesin Cuci');
        if (!('Tipe Mesin Pengering' in colMap)) missingHeaders.push('Tipe Mesin Pengering');
        if (!('Tipe Setrika' in colMap)) missingHeaders.push('Tipe Setrika');
        if (!('Pakai Pengering' in colMap)) missingHeaders.push('Pakai Pengering');
        if (!('Metode Pengeringan' in colMap)) missingHeaders.push('Metode Pengeringan');
        if (missingHeaders.length > 0) {
          const lastCol = sheetKapasitas.getLastColumn();
          const newRange = sheetKapasitas.getRange(1, lastCol + 1, 1, missingHeaders.length);
          newRange.setValues([missingHeaders]).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
        }
    }

    let sheetHPP1 = ss.getSheetByName(SHEET_HPP_1);
    if (!sheetHPP1 || sheetHPP1.getLastColumn() === 0) {
        initSheet(SHEET_HPP_1, headersHPP1);
    } else {
        const renameMap = {
          'Air_Sumber': 'Sumber Air',
          'Air_HargaM3': 'Harga Air',
          'Air_HargaTangki': 'Harga Tangki',
          'Air_LiterTangki': 'Liter Tangki',
          'Air_CuciLiter': 'Air Cuci',
          'Air_BoilerSumber': 'Sumber Setrika',
          'Air_HargaGalon': 'Galon Setrika',
          'Air_LiterGalon': 'Vol Setrika',
          'Air_BoilerLiter': 'Liter Setrika',
          'Air_BoilerJam': 'Jam Setrika',
          'Air_BoilerKgJam': 'Kg Setrika'
        };
        
        let headerRowValues = sheetHPP1.getRange(1, 1, 1, sheetHPP1.getLastColumn()).getValues()[0];
        let changed = false;
        for(let i=0; i<headerRowValues.length; i++) {
            if(renameMap[headerRowValues[i]]) {
                headerRowValues[i] = renameMap[headerRowValues[i]];
                changed = true;
            }
        }
        if(changed) {
            sheetHPP1.getRange(1, 1, 1, headerRowValues.length).setValues([headerRowValues]);
            SpreadsheetApp.flush();
        }

        const colMap = getHeaderMap(sheetHPP1);
        const missingHeaders = [];
        if (!('Cuci Per Load' in colMap)) missingHeaders.push('Cuci Per Load');
        if (!('Cuci Per Kg' in colMap)) missingHeaders.push('Cuci Per Kg');
        if (!('Kering Per Load' in colMap)) missingHeaders.push('Kering Per Load');
        if (!('Kering Per Kg' in colMap)) missingHeaders.push('Kering Per Kg');
        if (!('Listrik Setrika Jam' in colMap)) missingHeaders.push('Listrik Setrika Jam');
        if (!('Listrik Setrika Kg' in colMap)) missingHeaders.push('Listrik Setrika Kg');
        
        if (!('Air Per Load' in colMap)) missingHeaders.push('Air Per Load');
        if (!('Air Per Kg' in colMap)) missingHeaders.push('Air Per Kg');
        if (!('Air Setrika Jam' in colMap)) missingHeaders.push('Air Setrika Jam');
        if (!('Air Setrika Kg' in colMap)) missingHeaders.push('Air Setrika Kg');

        if (missingHeaders.length > 0) {
          const lastCol = sheetHPP1.getLastColumn();
          const newRange = sheetHPP1.getRange(1, lastCol + 1, 1, missingHeaders.length);
          newRange.setValues([missingHeaders]).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
        }
    }

    initSheet(SHEET_HPP_2, headersHPP2);
    initSheet(SHEET_HPP_3, headersHPP3);
    
    applySmartColumnGrouping(ss.getSheetByName(SHEET_HPP_1));

  } catch (error) {
    console.error("Setup Database Error: " + error.toString());
  }
}

function applySmartColumnGrouping(sheet) {
  try {
    if(!sheet) return;
    const maxCols = sheet.getMaxColumns();
    
    for (let i = 1; i <= maxCols; i++) {
      let depth = sheet.getColumnGroupDepth(i);
      if (depth > 0) {
        sheet.getRange(1, i).shiftColumnGroupDepth(-depth);
      }
    }

    const colMap = getHeaderMap(sheet);
    const groups = [
      { start: 'Kap Gas', end: 'Setrika Per Kg' },
      { start: 'TDL', end: 'Listrik Setrika Kg' },
      { start: 'Sumber Air', end: 'Air Setrika Kg' }
    ];

    groups.forEach(g => {
      if (g.start in colMap && g.end in colMap) {
        const startIdx = colMap[g.start] + 1; 
        const endIdx = colMap[g.end] + 1;
        const numCols = endIdx - startIdx + 1;
        
        if (numCols > 1) {
          sheet.getRange(1, startIdx, 1, numCols).shiftColumnGroupDepth(1);
        }
      }
    });
  } catch(e) {
    console.error("Gagal melakukan Smart Grouping: " + e.message);
  }
}

function getAllHPPData() {
  try {
    const ss = _getSpreadsheet();
    const s1 = ss.getSheetByName(SHEET_HPP_1);
    const s2 = ss.getSheetByName(SHEET_HPP_2);
    const s3 = ss.getSheetByName(SHEET_HPP_3);

    if(!s1 || !s2 || !s3) return [];

    const d1 = s1.getDataRange().getDisplayValues();
    const d2 = s2.getDataRange().getDisplayValues();
    const d3 = s3.getDataRange().getDisplayValues();

    const m1 = getHeaderMap(s1);
    const m2 = getHeaderMap(s2);
    const m3 = getHeaderMap(s3);

    let result = {};

    const process = (data, map) => {
        if(data.length < 2) return;
        let nameCol = 'Nama Outlet' in map ? map['Nama Outlet'] : null;
        if(nameCol === null) return;

        for(let i=1; i<data.length; i++){
            let name = String(data[i][nameCol]).trim();
            if(name.toLowerCase().includes('nama outlet') || !name) continue;

            if(!result[name]) result[name] = { namaOutlet: name };

            Object.keys(map).forEach(key => {
                result[name][key] = data[i][map[key]];
            });
        }
    };

    process(d1, m1);
    process(d2, m2);
    process(d3, m3);

    return Object.values(result);
  } catch(e) {
    console.error("Error getHPPData: ", e);
    return [];
  }
}

function getTransactions() {
  try {
    const ss = _getSpreadsheet();
    const sheetBep = ss.getSheetByName(SHEET_NAME_BEP);
    const sheetKap = ss.getSheetByName(SHEET_NAME_KAPASITAS);
    
    const dataBep = sheetBep ? sheetBep.getDataRange().getDisplayValues() : [];
    const dataKap = sheetKap ? sheetKap.getDataRange().getDisplayValues() : [];

        
    const bepMap = new Map();
    if (sheetBep && dataBep.length > 1) {
      const colMapBep = getHeaderMap(sheetBep);
      let colNameBep = 'Nama_Outlet' in colMapBep ? 'Nama_Outlet' : ('Nama_Laundry' in colMapBep ? 'Nama_Laundry' : null);
      
      for (let i = 1; i < dataBep.length; i++) {
        const row = dataBep[i];
        const namaOutlet = colNameBep ? String(row[colMapBep[colNameBep]]) : '';
        
        if (namaOutlet && !namaOutlet.toLowerCase().includes('nama outlet') && !namaOutlet.toLowerCase().includes('nama_outlet')) {
          const namaKey = namaOutlet.trim().toUpperCase();
          bepMap.set(namaKey, {
            tanggal: row[colMapBep['Timestamp']],
            hpp: row[colMapBep['HPP_Per_Kg']],
            bepKg: row[colMapBep['BEP_Kg']],
            bepRupiah: row[colMapBep['BEP_Rupiah']],
            biayaTetap: row[colMapBep['Biaya_Tetap']],
            biayaVariabel: row[colMapBep['Biaya_Variabel_Per_Kg']],
            kapasitas: row[colMapBep['Kapasitas_Per_Bulan']],
            hargaAcuan: row[colMapBep['Harga_Acuan_BEP']]
          });
        }
      }
    }
    
    const result = [];
    if (sheetKap && dataKap.length > 1) {
      const colMapKap = getHeaderMap(sheetKap);
      for (let i = dataKap.length - 1; i > 0; i--) {
        const row = dataKap[i];
        
        let checkColName = 'Nama Outlet' in colMapKap ? colMapKap['Nama Outlet'] : ('Nama Cabang/Outlet' in colMapKap ? colMapKap['Nama Cabang/Outlet'] : null);
        const namaAsli = checkColName !== null ? String(row[checkColName]) : 'Unknown';
        
        if (namaAsli.toLowerCase().includes('nama outlet') || namaAsli.toLowerCase().includes('nama cabang')) continue;

        const namaKey = namaAsli.trim().toUpperCase();
        const bepData = bepMap.get(namaKey);
        
        result.push({
          tanggal: bepData ? bepData.tanggal : '-',
          nama: namaAsli,
          hpp: bepData ? parseFloat(bepData.hpp.toString().replace(/[^\d.-]/g, '')) || 0 : 0,
          bepKg: bepData ? parseFloat(bepData.bepKg.toString().replace(/[^\d.-]/g, '')) || 0 : 0,
          bepRupiah: bepData ? parseFloat(bepData.bepRupiah.toString().replace(/[^\d.-]/g, '')) || 0 : 0,
          biayaTetap: bepData ? parseFloat(bepData.biayaTetap.toString().replace(/[^\d.-]/g, '')) || 0 : 0,
          biayaVariabel: bepData ? parseFloat(bepData.biayaVariabel.toString().replace(/[^\d.-]/g, '')) || 0 : 0,
          kapasitas: bepData ? parseFloat(bepData.kapasitas.toString().replace(/[^\d.-]/g, '')) || 0 : 0,
          hargaAcuan: bepData ? parseFloat(bepData.hargaAcuan.toString().replace(/[^\d.-]/g, '')) || 0 : 0
        });
      }
    }
    return result;
  } catch (error) {
    throw new Error("Sinkronisasi gagal: " + error.message);
  }
}

function saveTransaction(payload) {
  try {
    const ss = _getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_BEP);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    
    const colMap = getHeaderMap(sheet);
    const headersLength = sheet.getLastColumn();
    
    let targetRow = -1;
    const data = sheet.getDataRange().getDisplayValues();
    let checkColName = 'Nama_Outlet' in colMap ? colMap['Nama_Outlet'] : ('Nama_Laundry' in colMap ? colMap['Nama_Laundry'] : null);
    
    const sanitizedNama = String(payload.namaOutlet).trim().toLowerCase();
    
    if(checkColName !== null) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][checkColName]).trim().toLowerCase() === sanitizedNama) {
          targetRow = i + 1;
          break;
        }
      }
    }

    const applyData = (rowArr, isUpdate, rNum) => {
        const setVal = (key, val) => {
            if(key in colMap) {
                rowArr[colMap[key]] = val;
            }
        };
        
        setVal('Timestamp', timestamp);
        if('Nama_Outlet' in colMap) setVal('Nama_Outlet', payload.namaOutlet);
        else setVal('Nama_Laundry', payload.namaOutlet);

        setVal('Jam_Operasional', payload.jamOperasional);
        setVal('Biaya_Tetap', payload.biayaTetap);
        setVal('Biaya_Variabel_Per_Kg', payload.biayaVariabel);
        setVal('Kapasitas_Per_Bulan', payload.kapasitas);
        setVal('HPP_Per_Kg', payload.hpp);
        setVal('Harga_Acuan_BEP', payload.hargaJualAcuan);
        setVal('BEP_Kg', payload.bepKg);
        setVal('BEP_Rupiah', payload.bepRupiah);
        setVal('Paket_Cuci_Setrika', payload.cuciSetrika);
        setVal('Paket_Cuci_Lipat', payload.cuciLipat);
        setVal('Paket_Cuci_Saja', payload.cuciSaja);
        setVal('Paket_Setrika_Saja', payload.setrikaSaja);
    };

    if(targetRow !== -1) {
        const updatedRow = new Array(headersLength).fill("");
        applyData(updatedRow, true, targetRow);
        sheet.getRange(targetRow, 1, 1, headersLength).setValues([updatedRow]);
    } else {
        const newRow = new Array(headersLength).fill("");
        applyData(newRow, false, 0);
        sheet.appendRow(newRow);
    }
    
    SpreadsheetApp.flush();
    clearServerCache(); // <--- Reset server cache after update
    return { status: 'success', message: 'Kalkulasi HPP & BEP berhasil disimpan ke Cloud!' };
  } catch (error) {
    throw new Error("Gagal menyimpan data transaksi: " + error.toString());
  }
}

function saveStrukturBiaya(payload) {
  try {
    const ss = _getSpreadsheet();
    setupDatabase(); // Pastikan struktur siap saat menyimpan

    const sheet1 = ss.getSheetByName(SHEET_HPP_1);
    const sheet2 = ss.getSheetByName(SHEET_HPP_2);
    const sheet3 = ss.getSheetByName(SHEET_HPP_3);

    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const sanitizedNama = String(payload.namaOutlet).trim().toLowerCase();

    const dataHPP1 = sheet1.getDataRange().getDisplayValues();
    const colMapHPP1 = getHeaderMap(sheet1);
    let checkColName1 = 'Nama Outlet' in colMapHPP1 ? colMapHPP1['Nama Outlet'] : null;
    
    let kategoriLaundry = 'Drop Off/Kiloan';
    let kapKering = 1;
    let kapSetrika = 1;
    let tipeSetrika = '';
    let pakaiMesinPengering = true;

    if (checkColName1 !== null) {
      for (let i = 1; i < dataHPP1.length; i++) {
        if (String(dataHPP1[i][checkColName1]).trim().toLowerCase() === sanitizedNama) {
          if ('Kategori Laundry' in colMapHPP1) {
            kategoriLaundry = String(dataHPP1[i][colMapHPP1['Kategori Laundry']] || 'Drop Off/Kiloan');
          }
          if ('Kap Kering' in colMapHPP1) {
            kapKering = parseFloat(String(dataHPP1[i][colMapHPP1['Kap Kering']]).replace(/[^\d.-]/g, '')) || 1;
          }
          if ('Kap Setrika' in colMapHPP1) {
            kapSetrika = parseFloat(String(dataHPP1[i][colMapHPP1['Kap Setrika']]).replace(/[^\d.-]/g, '')) || 1;
          }
          if ('Tipe Setrika' in colMapHPP1) {
            tipeSetrika = String(dataHPP1[i][colMapHPP1['Tipe Setrika']] || '');
          }
          pakaiMesinPengering = zettDryerActiveFromRow_(dataHPP1[i], colMapHPP1);
          break;
        }
      }
    }

    let targetRow1 = -1;
    if(checkColName1 !== null) {
      for (let i = 1; i < dataHPP1.length; i++) {
          if(String(dataHPP1[i][checkColName1]).trim().toLowerCase() === sanitizedNama) {
              targetRow1 = i + 1;
              break;
          }
      }
    }

    const colMap1 = colMapHPP1;
    const rowLength1 = sheet1.getLastColumn();
    
    const gasJam = parseFloat(payload.gasJam) || 0;
    const gasHarga = parseFloat(payload.gasHarga) || 0;
    const gasPerLoad = parseFloat(payload.gasPerLoad) || 0;
    const gasMenit = zettToNumber_(payload.gasMenit);
    const gasPerJam = zettToNumber_(payload.gasPerJam) || (gasJam > 0 ? gasHarga / gasJam : 0);
    const gasPerMenit = zettToNumber_(payload.gasPerMenit) || (gasMenit > 0 ? gasHarga / gasMenit : 0);
    const estimasiLoadGas = zettToNumber_(payload.estimasiLoadGas);
    const estimasiBiayaGas = zettToNumber_(payload.estimasiBiayaGas) || gasPerLoad;
    
    let gasPerKgStr = "";
    let setrikaPerJamStr = "";
    let setrikaPerKgStr = "";

    if (zettIsSelfServiceCategory_(kategoriLaundry)) {
      gasPerKgStr = "";
      setrikaPerJamStr = "";
      setrikaPerKgStr = "";
    } else {
      const gasPerKg = kapKering > 0 ? gasPerLoad / kapKering : 0;

      gasPerKgStr = (zettIsHybridCategory_(kategoriLaundry) || (zettIsDropOffCategory_(kategoriLaundry) && pakaiMesinPengering)) ? gasPerKg : "";
      if (zettGasIronRelevant_(kategoriLaundry, tipeSetrika)) {
        const setrikaPerJam = gasPerJam;
        const setrikaPerKg = kapSetrika > 0 ? setrikaPerJam / kapSetrika : "";
        setrikaPerJamStr = setrikaPerJam;
        setrikaPerKgStr = setrikaPerKg;
      }
    }
    
    const applyHPP1 = (rowArr, isUpdate, rNum) => {
      const setVal = (key, val) => {
        if (key in colMap1) {
          if (isUpdate) sheet1.getRange(rNum, colMap1[key] + 1).setValue(val);
          else rowArr[colMap1[key]] = val;
        } else if (key === 'Setrika Per Jam' || key === 'Setrika Per Kg') {
          zettWarnMissingHeader_(key, SHEET_HPP_1);
        }
      };
      
      const setFormula = (key, formula) => {
        if (key in colMap1) {
          const colNum = colMap1[key] + 1;
          let formulaWithRow = formula;
          Object.keys(colMap1).forEach(headerKey => {
            const headerColNum = colMap1[headerKey] + 1;
            const colLetter = String.fromCharCode(64 + headerColNum);
            formulaWithRow = formulaWithRow.replace(new RegExp(`\\{${headerKey}\\}`, 'g'), `${colLetter}${rNum}`);
          });
          if (isUpdate) {
            sheet1.getRange(rNum, colNum).setFormula(formulaWithRow);
          } else {
            rowArr[colMap1[key]] = formulaWithRow;
          }
        }
      };

      setVal('Timestamp', timestamp);
      setVal('Nama Outlet', payload.namaOutlet);

      setVal('Kap Gas', payload.gasKapasitas);
      setVal('Harga Gas', payload.gasHarga);
      setVal('Jam Gas', payload.gasJam);
      setVal('Menit Gas', gasMenit);
      setVal('Estimasi Load Gas', estimasiLoadGas);
      setVal('Estimasi Biaya Gas', estimasiBiayaGas);
      setVal('Gas Per Jam', gasPerJam);
      setVal('Gas Per Menit', gasPerMenit);
      setVal('Gas Per Load', estimasiBiayaGas || payload.gasPerLoad);
      setVal('Gas Per Kg', gasPerKgStr);
      setVal('Setrika Per Jam', setrikaPerJamStr);
      setVal('Setrika Per Kg', setrikaPerKgStr);

      setVal('TDL', payload.listrikTDL);
      setVal('Watt Cuci', payload.listrikCuci);
      setVal('Watt Kering', payload.listrikPengering);
      setVal('Watt Pompa', payload.listrikPompa);
      setVal('Watt Setrika', payload.listrikSetrika);

      setFormula('kW Watt Cuci', '=IF({Watt Cuci}="";"";{Watt Cuci}/1000)');
      setFormula('kW Watt Kering', '=IF({Watt Kering}="";"";{Watt Kering}/1000)');
      setFormula('kW Watt Pompa', '=IF({Watt Pompa}="";"";{Watt Pompa}/1000)');
      setFormula('kW Watt Setrika', '=IF({Watt Setrika}="";"";{Watt Setrika}/1000)');
      setFormula('Cuci Per Load', '=IF({kW Watt Cuci}="";"";{kW Watt Cuci}*{TDL}*1)');
      setFormula('Cuci Per Kg', '=IF(OR({Kategori Laundry}="Self Service";{Cuci Per Load}="");"";{Cuci Per Load}/{Kap Cuci})');
      setFormula('Kering Per Load', '=IF({kW Watt Kering}="";"";{kW Watt Kering}*{TDL}*1)');
      setFormula('Kering Per Kg', '=IF(OR({Kategori Laundry}="Self Service";{Kering Per Load}="");"";{Kering Per Load}/{Kap Kering})');
      setFormula('Listrik Setrika Jam', '=IF(OR({Kategori Laundry}="Self Service";{kW Watt Setrika}="");"";{kW Watt Setrika}*{TDL}*1)');
      setFormula('Listrik Setrika Kg', '=IF(OR({Kategori Laundry}="Self Service";{Listrik Setrika Jam}="");"";{Listrik Setrika Jam}/{Kap Setrika})');

            setVal('Sumber Air', payload.airSumber);
      setVal('Harga Air', payload.airHargaM3);
      setVal('Harga Tangki', payload.airHargaTangki);
      setVal('Liter Tangki', payload.airLiterTangki);
      setVal('Air Cuci', payload.airCuciLiter);
      setVal('Sumber Setrika', payload.airBoilerSumber);
      setVal('Galon Setrika', payload.airHargaGalon);
      setVal('Vol Setrika', payload.airLiterGalon);
      setVal('Liter Setrika', payload.airBoilerLiter);
      setVal('Jam Setrika', payload.airBoilerJam);
      setVal('Kg Setrika', payload.airBoilerKgJam);

      setFormula('Air Per Load', '=IF({Sumber Air}="pdam";({Harga Air}/1000)*{Air Cuci};IF({Sumber Air}="tangki";({Harga Tangki}/{Liter Tangki})*{Air Cuci};0))');
      setFormula('Air Per Kg', '=IF(OR({Kategori Laundry}="Self Service";{Air Per Load}="");"";{Air Per Load}/{Kap Cuci})');
      setFormula('Air Setrika Jam', '=IF(OR({Kategori Laundry}="Self Service";{Liter Setrika}="");"";IF({Sumber Setrika}="galon";({Galon Setrika}/{Vol Setrika})*({Liter Setrika}/{Jam Setrika});IF({Sumber Air}="pdam";({Harga Air}/1000)*({Liter Setrika}/{Jam Setrika});IF({Sumber Air}="tangki";({Harga Tangki}/{Liter Tangki})*({Liter Setrika}/{Jam Setrika});0))))');
      setFormula('Air Setrika Kg', '=IF(OR({Kategori Laundry}="Self Service";{Air Setrika Jam}="");"";{Air Setrika Jam}/{Kg Setrika})');
    };
    
    if (targetRow1 !== -1) {
      applyHPP1([], true, targetRow1);
    } else {
      const newRow = new Array(rowLength1).fill("");
      applyHPP1(newRow, false, sheet1.getLastRow() + 1);
      sheet1.appendRow(newRow);
      targetRow1 = sheet1.getLastRow();
    }
    
    const dataHPP2 = sheet2.getDataRange().getDisplayValues();
    const colMapHPP2 = getHeaderMap(sheet2);
    let checkColName2 = 'Nama Outlet' in colMapHPP2 ? colMapHPP2['Nama Outlet'] : null;
    let targetRow2 = -1;
    
    if (checkColName2 !== null) {
      for (let i = 1; i < dataHPP2.length; i++) {
        if (String(dataHPP2[i][checkColName2]).trim().toLowerCase() === sanitizedNama) {
          targetRow2 = i + 1;
          break;
        }
      }
    }

    const colMap2 = colMapHPP2;
    const rowLength2 = sheet2.getLastColumn();

    const applyHPP2 = (rowArr, isUpdate, rNum) => {
      const setVal = (key, val) => {
        if (key in colMap2) {
          if (isUpdate) sheet2.getRange(rNum, colMap2[key] + 1).setValue(val);
          else rowArr[colMap2[key]] = val;
        }
      };

      setVal('Timestamp', timestamp);
      setVal('Nama Outlet', payload.namaOutlet);
      setVal('Packing_PP_Active', payload.packPPActive);
      setVal('Packing_PP_Harga', payload.packPPHarga);
      setVal('Packing_PP_Isi', payload.packPPIsi);
      setVal('Packing_PP_Kg', payload.packPPKg);
      setVal('Packing_HD_Active', payload.packHDActive);
      setVal('Packing_HD_Harga', payload.packHDHarga);
      setVal('Packing_HD_Isi', payload.packHDIsi);
      setVal('Packing_HD_Kg', payload.packHDKg);
      setVal('Packing_Jinjing_Active', payload.packJinjingActive);
      setVal('Packing_Jinjing_Harga', payload.packJinjingHarga);
      setVal('Packing_Jinjing_Isi', payload.packJinjingIsi);
      setVal('Packing_Jinjing_Kg', payload.packJinjingKg);
    };

    if (targetRow2 !== -1) {
      applyHPP2([], true, targetRow2);
    } else {
      const newRow = new Array(rowLength2).fill("");
      applyHPP2(newRow, false, 0);
      sheet2.appendRow(newRow);
    }

    const dataHPP3 = sheet3.getDataRange().getDisplayValues();
    const colMapHPP3 = getHeaderMap(sheet3);
    let checkColName3 = 'Nama Outlet' in colMapHPP3 ? colMapHPP3['Nama Outlet'] : null;
    let targetRow3 = -1;
    
    if (checkColName3 !== null) {
      for (let i = 1; i < dataHPP3.length; i++) {
        if (String(dataHPP3[i][checkColName3]).trim().toLowerCase() === sanitizedNama) {
          targetRow3 = i + 1;
          break;
        }
      }
    }

    const colMap3 = colMapHPP3;
    const rowLength3 = sheet3.getLastColumn();

    const applyHPP3 = (rowArr, isUpdate, rNum) => {
      const setVal = (key, val) => {
        if (key in colMap3) {
          if (isUpdate) sheet3.getRange(rNum, colMap3[key] + 1).setValue(val);
          else rowArr[colMap3[key]] = val;
        }
      };

      setVal('Timestamp', timestamp);
      setVal('Nama Outlet', payload.namaOutlet);

      setVal('Chem_Det_Active', payload.chemDetActive);
      setVal('Chem_Det_Type', payload.chemDetType);
      setVal('Chem_Det_Harga', payload.chemDetHargaBulk);
      setVal('Chem_Det_Kapasitas', payload.chemDetKapBulk);
      setVal('Chem_Det_Pemakaian', payload.chemDetPakai);

      setVal('Chem_Sof_Active', payload.chemSofActive);
      setVal('Chem_Sof_Type', payload.chemSofType);
      setVal('Chem_Sof_Harga', payload.chemSofHargaBulk);
      setVal('Chem_Sof_Kapasitas', payload.chemSofKapBulk);
      setVal('Chem_Sof_Pemakaian', payload.chemSofPakai);

      setVal('Chem_Par_Active', payload.chemParActive);
      setVal('Chem_Par_Harga', payload.chemParHargaBulk);
      setVal('Chem_Par_Kapasitas', payload.chemParKapBulk);
      setVal('Chem_Par_Pemakaian', payload.chemParPakai);

      setVal('Chem_Pel_Active', payload.chemPelActive);
      setVal('Chem_Pel_Type', payload.chemPelType);
      setVal('Chem_Pel_Harga', payload.chemPelHargaBulk);
      setVal('Chem_Pel_Kapasitas', payload.chemPelKapBulk);
      setVal('Chem_Pel_Pemakaian', payload.chemPelPakai);

      setVal('Nota_Type', payload.notaType);
      setVal('Nota_App_FeeType', payload.notaAppFeeType);
      setVal('Nota_App_HargaBulan', payload.notaAppHargaBulan);
      setVal('Nota_App_TrxBulan', payload.notaAppTrxBulan);
      setVal('Nota_App_HargaTrx', payload.notaAppHargaTrx);
      setVal('Nota_Thermal_Harga', payload.notaThermalHarga);
      setVal('Nota_Manual_Harga', payload.notaManualHarga);
      setVal('Nota_Manual_LembarTotal', payload.notaManualLbrTotal);
      setVal('Nota_Manual_LembarTrx', payload.notaManualLbrTrx);
      setVal('Nota_RataKg', payload.notaRataKg);
    };

    if (targetRow3 !== -1) {
      applyHPP3([], true, targetRow3);
    } else {
      const newRow = new Array(rowLength3).fill("");
      applyHPP3(newRow, false, 0);
      sheet3.appendRow(newRow);
    }

    SpreadsheetApp.flush();
    clearServerCache(); // <--- Reset server cache after update
    return { status: 'success', message: 'Data Struktur Biaya berhasil disimpan ke Cloud!' };
  } catch (error) {
    throw new Error("Gagal menyimpan data Struktur Biaya: " + error.toString());
  }
}

function saveGasHPPData(payload) {
  try {
    const ss = _getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) throw new Error('Sheet Struktur_Biaya_1 tidak ditemukan.');

    const headerMap = zettGetHeaderMap_(sheet);
    const nameCol = headerMap['Nama Outlet'];
    if (typeof nameCol !== 'number') throw new Error('Header "Nama Outlet" tidak ditemukan.');

    const normalize = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const outletNorm = normalize(payload.namaOutlet);
    if (!outletNorm) throw new Error('Nama outlet wajib diisi.');

    const data = sheet.getDataRange().getDisplayValues();
    const headerRow = zettHppHeaderRow_(sheet);
    let targetRow = -1;
    for (let i = headerRow; i < data.length; i++) {
      if (normalize(data[i][nameCol]) === outletNorm) {
        targetRow = i + 1;
        break;
      }
    }

    const col = (key) => (typeof headerMap[key] === 'number' ? headerMap[key] + 1 : 0);
    const hargaGas = zettToNumber_(payload.hargaGas);
    const jamGas = zettToNumber_(payload.jamGas);
    const menitGas = zettToNumber_(payload.menitGas);
    const estimasiBiayaGas = zettToNumber_(payload.estimasiBiayaGas);
    let kategoriLaundry = '';
    let tipeSetrika = '';
    let kapSetrika = 0;
    let kapKering = 0;
    let pakaiMesinPengering = true;
    if (targetRow > 0) {
      const row = data[targetRow - 1] || [];
      if (typeof headerMap['Kategori Laundry'] === 'number') kategoriLaundry = String(row[headerMap['Kategori Laundry']] || '');
      if (typeof headerMap['Tipe Setrika'] === 'number') tipeSetrika = String(row[headerMap['Tipe Setrika']] || '');
      if (typeof headerMap['Kap Setrika'] === 'number') kapSetrika = zettToNumber_(row[headerMap['Kap Setrika']]);
      if (typeof headerMap['Kap Kering'] === 'number') kapKering = zettToNumber_(row[headerMap['Kap Kering']]);
      pakaiMesinPengering = zettDryerActiveFromRow_(row, headerMap);
    }
    const gasPerJamValue = zettToNumber_(payload.gasPerJam) || (jamGas > 0 ? hargaGas / jamGas : 0);
    const steamIronRelevant = zettGasIronRelevant_(kategoriLaundry, tipeSetrika);
    const setrikaPerJamValue = steamIronRelevant ? gasPerJamValue : '';
    const setrikaPerKgValue = steamIronRelevant && kapSetrika > 0 ? setrikaPerJamValue / kapSetrika : '';
    const dryerGasRelevant = zettIsSelfServiceCategory_(kategoriLaundry) || zettIsHybridCategory_(kategoriLaundry) || (zettIsDropOffCategory_(kategoriLaundry) && pakaiMesinPengering);
    const gasPerKgValue = dryerGasRelevant
      ? (zettToNumber_(payload.gasPerKg) || (kapKering > 0 ? (estimasiBiayaGas || zettToNumber_(payload.gasPerLoad)) / kapKering : ''))
      : '';
    const values = {
      'Nama Outlet': String(payload.namaOutlet || '').trim(),
      'Kap Gas': payload.kapGas,
      'Harga Gas': hargaGas,
      'Jam Gas': jamGas,
      'Menit Gas': menitGas,
      'Estimasi Load Gas': zettToNumber_(payload.estimasiLoadGas),
      'Estimasi Biaya Gas': estimasiBiayaGas,
      'Gas Per Jam': gasPerJamValue,
      'Gas Per Menit': zettToNumber_(payload.gasPerMenit) || (menitGas > 0 ? hargaGas / menitGas : 0),
      'Gas Per Load': estimasiBiayaGas || zettToNumber_(payload.gasPerLoad),
      'Gas Per Kg': gasPerKgValue,
      'Setrika Per Jam': setrikaPerJamValue,
      'Setrika Per Kg': setrikaPerKgValue,
      'Timestamp': Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss')
    };

    if (targetRow > 0) {
      Object.keys(values).forEach((k) => {
        const c = col(k);
        if (c > 0) sheet.getRange(targetRow, c).setValue(values[k]);
        else if (k === 'Setrika Per Jam' || k === 'Setrika Per Kg') zettWarnMissingHeader_(k, SHEET_HPP_1);
      });
    } else {
      const row = new Array(sheet.getLastColumn()).fill('');
      Object.keys(values).forEach((k) => {
        const idx = headerMap[k];
        if (typeof idx === 'number') row[idx] = values[k];
        else if (k === 'Setrika Per Jam' || k === 'Setrika Per Kg') zettWarnMissingHeader_(k, SHEET_HPP_1);
      });
      sheet.appendRow(row);
      targetRow = sheet.getLastRow();
    }

    SpreadsheetApp.flush();
    clearServerCache();
    return { status: 'success', message: 'Data gas berhasil disimpan', data: { row: targetRow, ...values } };
  } catch (error) {
    throw new Error('Gagal simpan data gas: ' + error.message);
  }
}

function saveKapasitas(payload) {
  try {
    const ss = _getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_KAPASITAS);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    
    const colMap = getHeaderMap(sheet);
    const headersLength = sheet.getLastColumn();
    
    let targetRow = -1;
    const data = sheet.getDataRange().getDisplayValues();
    let checkColName = 'Nama Outlet' in colMap ? colMap['Nama Outlet'] : ('Nama Cabang/Outlet' in colMap ? colMap['Nama Cabang/Outlet'] : null);
    
    const sanitizedNama = zettNormalizeOutletName_(payload.namaOutlet);

    if (checkColName !== null) {
      for (let i = 1; i < data.length; i++) {
        if (zettNormalizeOutletName_(data[i][checkColName]) === sanitizedNama) {
          targetRow = i + 1;
          break;
        }
      }
    }

    const applyData = (rowArr, isUpdate, rNum) => {
      const setVal = (key, val) => {
        if(key in colMap) {
          rowArr[colMap[key]] = val;
        }
      };
      const pickPayload = (...keys) => {
        for (let i = 0; i < keys.length; i++) {
          const val = payload[keys[i]];
          if (val !== undefined && val !== null && val !== '') return val;
        }
        return '';
      };

      setVal('Timestamp', timestamp);
      if('Nama Outlet' in colMap) setVal('Nama Outlet', payload.namaOutlet);
      else setVal('Nama Cabang/Outlet', payload.namaOutlet);

      setVal('Jam Buka', payload.jamBuka);
      setVal('Jam Tutup', payload.jamTutup);
      setVal('Tutup Hari Minggu', payload.mingguTutup === true ? 'Ya (Tutup)' : pickPayload('tutupMinggu') || 'Tidak');
      setVal('Target Okupansi Cuci', pickPayload('targetOkupansiCuci', 'okupansiCuci'));
      setVal('Target Okupansi Kering', pickPayload('targetOkupansiKering', 'okupansiKering'));
      setVal('Target Okupansi Setrika', pickPayload('targetOkupansiSetrika', 'okupansiSetrika'));
      setVal('Estimasi Cuci', pickPayload('estimasiCuciKgBulan', 'estimasiCuci'));
      setVal('Estimasi Kering', pickPayload('estimasiKeringKgBulan', 'estimasiKering'));
      setVal('Estimasi Setrika', pickPayload('estimasiSetrikaKgBulan', 'estimasiSetrika'));
      setVal('Durasi Operasional', payload.durasiOperasional);
      setVal('Kategori Laundry', pickPayload('kategori', 'kategoriLaundry'));
      setVal('Mesin Cuci', pickPayload('cuciUnit', 'mesinCuci'));
      const pakaiPengering = payload.pakaiPengering === false || String(payload.pakaiPengering).toLowerCase() === 'false' ? 'Tidak' : 'Ya';
      setVal('Mesin Pengering', pakaiPengering === 'Tidak' ? 0 : pickPayload('pengeringUnit', 'mesinPengering'));
      setVal('Kap Cuci', pickPayload('cuciKg', 'kapCuci'));
      setVal('Kap Kering', pakaiPengering === 'Tidak' ? 0 : pickPayload('pengeringKg', 'kapKering'));
      setVal('Durasi Cuci', pickPayload('cuciDurasi', 'durasiCuci'));
      setVal('Durasi Kering', pakaiPengering === 'Tidak' ? 0 : pickPayload('pengeringDurasi', 'durasiKering'));
      setVal('Alat Setrika', pickPayload('setrikaUnit', 'alatSetrika'));
      setVal('Kap Setrika', pickPayload('setrikaKg', 'kapSetrika'));
      setVal('Durasi Setrika', pickPayload('setrikaDurasi', 'durasiSetrika'));
      setVal('Tipe Mesin Cuci', payload.tipeMesinCuci);
      setVal('Tipe Mesin Pengering', payload.tipeMesinPengering);
      setVal('Tipe Setrika', pickPayload('tipeSetrikaUtama', 'tipeSetrika'));
      setVal('Pakai Pengering', pakaiPengering);
      setVal('Metode Pengeringan', pakaiPengering === 'Tidak' ? 'jemur' : (pickPayload('metodePengeringan') || 'mesin'));
    };

    if (targetRow !== -1) {
      const updatedRow = new Array(headersLength).fill("");
      applyData(updatedRow, true, targetRow);
      sheet.getRange(targetRow, 1, 1, headersLength).setValues([updatedRow]);
    } else {
      const newRow = new Array(headersLength).fill("");
      applyData(newRow, false, 0);
      sheet.appendRow(newRow);
    }

    // [PROFIL->HPP SYNC] Jaga field operasional HPP tetap sama dengan Master_Kapasitas_V2.
    zettSyncOperationalProfileToHPP_(payload, timestamp);

    SpreadsheetApp.flush();
    clearServerCache(); // <--- Reset server cache after update
    return { status: 'success', message: 'Data Kapasitas berhasil disimpan ke Cloud!' };
  } catch (error) {
    throw new Error("Gagal menyimpan data Kapasitas: " + error.toString());
  }
}

function saveKapasitasPremium(payload) {
  return saveKapasitas(payload);
}

function zettBuildOperationalHPPValues_(payload, timestamp) {
  const pick = function() {
    for (let i = 0; i < arguments.length; i++) {
      const key = arguments[i];
      if (payload && payload[key] !== undefined && payload[key] !== null && payload[key] !== '') return payload[key];
    }
    return '';
  };
  const pakaiPengering = payload && (payload.pakaiPengering === false || String(payload.pakaiPengering).toLowerCase() === 'false') ? 'Tidak' : 'Ya';
  const values = {
    'Timestamp': timestamp,
    'Nama Outlet': pick('namaOutlet'),
    'Kategori Laundry': pick('kategori', 'kategoriLaundry'),
    'Mesin Cuci': pick('cuciUnit', 'mesinCuci'),
    'Kap Cuci': pick('cuciKg', 'kapCuci'),
    'Durasi Cuci': pick('cuciDurasi', 'durasiCuci'),
    'Mesin Pengering': pakaiPengering === 'Tidak' ? 0 : pick('pengeringUnit', 'mesinPengering'),
    'Kap Kering': pakaiPengering === 'Tidak' ? 0 : pick('pengeringKg', 'kapKering'),
    'Durasi Kering': pakaiPengering === 'Tidak' ? 0 : pick('pengeringDurasi', 'durasiKering'),
    'Alat Setrika': pick('setrikaUnit', 'alatSetrika'),
    'Kap Setrika': pick('setrikaKg', 'kapSetrika'),
    'Durasi Setrika': pick('setrikaDurasi', 'durasiSetrika'),
    'Tipe Setrika': pick('tipeSetrikaUtama', 'tipeSetrika'),
    'Pakai Pengering': pakaiPengering,
    'Metode Pengeringan': pakaiPengering === 'Tidak' ? 'jemur' : (pick('metodePengeringan') || 'mesin')
  };
  Object.keys(values).forEach(function(key) {
    if (values[key] === undefined || values[key] === null) values[key] = '';
  });
  return values;
}

function zettGetOperationalProfileForHPP_(namaOutlet, timestamp) {
  const ss = _getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_KAPASITAS);
  if (!sheet || sheet.getLastRow() < 2) return {};

  const data = sheet.getDataRange().getDisplayValues();
  const map = getHeaderMap(sheet);
  const nameCol = ('Nama Outlet' in map) ? map['Nama Outlet'] : (('Nama Cabang/Outlet' in map) ? map['Nama Cabang/Outlet'] : null);
  if (nameCol === null) return {};

  const target = zettNormalizeOutletName_(namaOutlet);
  for (let i = 1; i < data.length; i++) {
    if (zettNormalizeOutletName_(data[i][nameCol]) !== target) continue;
    const row = data[i];
    const get = function(header) { return header in map ? row[map[header]] : ''; };
    return zettBuildOperationalHPPValues_({
      namaOutlet: get('Nama Outlet') || get('Nama Cabang/Outlet') || namaOutlet,
      kategori: get('Kategori Laundry'),
      cuciUnit: get('Mesin Cuci'),
      cuciKg: get('Kap Cuci'),
      cuciDurasi: get('Durasi Cuci'),
      pengeringUnit: get('Mesin Pengering'),
      pengeringKg: get('Kap Kering'),
      pengeringDurasi: get('Durasi Kering'),
      setrikaUnit: get('Alat Setrika'),
      setrikaKg: get('Kap Setrika'),
      setrikaDurasi: get('Durasi Setrika'),
      tipeSetrika: get('Tipe Setrika'),
      pakaiPengering: String(get('Pakai Pengering') || '').toLowerCase() === 'tidak' ? false : true,
      metodePengeringan: get('Metode Pengeringan')
    }, timestamp || get('Timestamp'));
  }
  return {};
}

function zettSyncOperationalProfileToHPP_(payload, timestamp) {
  const ss = _getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_HPP_1);
  if (!sheet) sheet = ss.insertSheet(SHEET_HPP_1);
  if (sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, zettCombinedHPPHeaders_().length).setValues([zettCombinedHPPHeaders_()]);
    sheet.setFrozenRows(1);
  } else {
    zettEnsureHeaders_(sheet, zettCombinedHPPHeaders_());
  }

  const map = zettGetHeaderMap_(sheet);
  const nameCol = ('Nama Outlet' in map) ? map['Nama Outlet'] : null;
  if (nameCol === null) throw new Error('Header "Nama Outlet" tidak ditemukan di Struktur_Biaya_1.');

  const values = zettBuildOperationalHPPValues_(payload, timestamp);
  const target = zettNormalizeOutletName_(values['Nama Outlet']);
  if (!target) return;

  const data = sheet.getDataRange().getDisplayValues();
  const headerRow = zettHppHeaderRow_(sheet);
  let rowNum = -1;
  let duplicateCount = 0;
  for (let i = headerRow; i < data.length; i++) {
    if (zettNormalizeOutletName_(data[i][nameCol]) === target) {
      duplicateCount++;
      if (rowNum === -1) rowNum = i + 1;
    }
  }
  if (duplicateCount > 1) Logger.log('[HPP SYNC] Duplikat Nama Outlet "%s" di %s. Hanya row pertama yang disinkronkan.', values['Nama Outlet'], SHEET_HPP_1);

  if (rowNum === -1) rowNum = sheet.getLastRow() + 1;
  const row = rowNum <= sheet.getLastRow()
    ? sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0]
    : new Array(sheet.getLastColumn()).fill('');

  Object.keys(values).forEach(function(header) {
    if (header in map) row[map[header]] = values[header];
  });
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
}


function getDaftarKapasitas() {
  try {
    const ss = _getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME_KAPASITAS);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getDataRange().getDisplayValues();
    const colMap = getHeaderMap(sheet);
    const result = [];
    
    let getValue = (row, keyA, keyB = null) => {
      if (keyA in colMap) return row[colMap[keyA]];
      if (keyB && keyB in colMap) return row[colMap[keyB]];
      return "";
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const namaOutlet = getValue(row, 'Nama Outlet', 'Nama Cabang/Outlet');
      if (!namaOutlet || String(namaOutlet).toLowerCase().includes('nama outlet')) continue;

      const tutupMinggu = getValue(row, 'Tutup Hari Minggu');
      const okupansiCuci = getValue(row, 'Target Okupansi Cuci');
      const okupansiKering = getValue(row, 'Target Okupansi Kering');
      const okupansiSetrika = getValue(row, 'Target Okupansi Setrika');
      const kategoriLaundry = getValue(row, 'Kategori Laundry');
      const mesinCuci = getValue(row, 'Mesin Cuci');
      const mesinPengering = getValue(row, 'Mesin Pengering');
      const kapCuci = getValue(row, 'Kap Cuci');
      const kapKering = getValue(row, 'Kap Kering');
      const durasiCuci = getValue(row, 'Durasi Cuci');
      const durasiKering = getValue(row, 'Durasi Kering');
      const alatSetrika = getValue(row, 'Alat Setrika');
      const kapSetrika = getValue(row, 'Kap Setrika');
      const durasiSetrika = getValue(row, 'Durasi Setrika');
      const tipeSetrika = getValue(row, 'Tipe Setrika');
      const pakaiPengeringRaw = getValue(row, 'Pakai Pengering');
      const metodePengeringanRaw = getValue(row, 'Metode Pengeringan');
      const pakaiPengering = String(pakaiPengeringRaw || '').trim().toLowerCase();
      const metodePengeringan = String(metodePengeringanRaw || '').trim().toLowerCase();
      const dryerActive = !(pakaiPengering === 'tidak' || pakaiPengering === 'false' || pakaiPengering === '0' || metodePengeringan === 'jemur');

      result.push({
        namaOutlet: namaOutlet,
        jamBuka: getValue(row, 'Jam Buka'),
        jamTutup: getValue(row, 'Jam Tutup'),
        tutupMinggu: tutupMinggu,
        mingguTutup: tutupMinggu,
        okupansiCuci: okupansiCuci,
        okupansiKering: okupansiKering,
        okupansiSetrika: okupansiSetrika,
        targetOkupansiCuci: okupansiCuci,
        targetOkupansiKering: okupansiKering,
        targetOkupansiSetrika: okupansiSetrika,
        estimasiCuci: getValue(row, 'Estimasi Cuci'),
        estimasiKering: getValue(row, 'Estimasi Kering'),
        estimasiSetrika: getValue(row, 'Estimasi Setrika'),
        durasiOperasional: getValue(row, 'Durasi Operasional'),
        kategoriLaundry: kategoriLaundry,
        kategori: kategoriLaundry,
        mesinCuci: mesinCuci,
        mesinPengering: mesinPengering,
        kapCuci: kapCuci,
        kapKering: kapKering,
        durasiCuci: durasiCuci,
        durasiKering: durasiKering,
        alatSetrika: alatSetrika,
        kapSetrika: kapSetrika,
        durasiSetrika: durasiSetrika,
        cuciUnit: mesinCuci,
        pengeringUnit: mesinPengering,
        setrikaUnit: alatSetrika,
        cuciKg: kapCuci,
        pengeringKg: kapKering,
        setrikaKg: kapSetrika,
        cuciDurasi: durasiCuci,
        pengeringDurasi: durasiKering,
        setrikaDurasi: durasiSetrika,
        tipeMesinCuci: getValue(row, 'Tipe Mesin Cuci'),
        tipeMesinPengering: getValue(row, 'Tipe Mesin Pengering'),
        tipeSetrika: tipeSetrika,
        tipeSetrikaUtama: tipeSetrika,
        pakaiPengering: dryerActive,
        metodePengeringan: dryerActive ? (metodePengeringan || 'mesin') : 'jemur'
      });
    }

    return result;
  } catch (error) {
    throw new Error("Gagal mengambil daftar kapasitas: " + error.toString());
  }
}

function deleteEntity(namaOutletRequest) {
  try {
    const ss = _getSpreadsheet();
    const sheetKap = ss.getSheetByName(SHEET_NAME_KAPASITAS);
    if (!sheetKap) return { status: 'error', message: 'Sheet Master Kapasitas tidak ditemukan.' };
    
    const targetNama = String(namaOutletRequest).trim().toLowerCase();

    const dataKap = sheetKap.getDataRange().getDisplayValues();
    const colMapKap = getHeaderMap(sheetKap);
    let checkColKap = 'Nama Outlet' in colMapKap ? colMapKap['Nama Outlet'] : ('Nama Cabang/Outlet' in colMapKap ? colMapKap['Nama Cabang/Outlet'] : null);
    
    let isDeleted = false;
    if(checkColKap !== null) {
      for (let i = dataKap.length - 1; i >= 1; i--) {
        if (String(dataKap[i][checkColKap]).trim().toLowerCase() === targetNama) {
          sheetKap.deleteRow(i + 1);
          isDeleted = true;
        }
      }
    }

    if (!isDeleted) {
      throw new Error("Data outlet tidak ditemukan di database.");
    }

    const sheetsToCascade = [SHEET_HPP_1, SHEET_HPP_2, SHEET_HPP_3, SHEET_NAME_BEP];
    
    sheetsToCascade.forEach(sheetName => {
        const s = ss.getSheetByName(sheetName);
        if(s) {
            const colMap = getHeaderMap(s);
            const data = s.getDataRange().getDisplayValues();
            let checkColName = 'Nama Outlet' in colMap ? colMap['Nama Outlet'] : ('Nama_Outlet' in colMap ? colMap['Nama_Outlet'] : ('Nama_Laundry' in colMap ? colMap['Nama_Laundry'] : null));
            
            if(checkColName !== null) {
                for (let i = data.length - 1; i >= 1; i--) {
                    if (String(data[i][checkColName]).trim().toLowerCase() === targetNama) {
                        s.deleteRow(i + 1);
                    }
                }
            }
        }
    });

    SpreadsheetApp.flush(); 
    clearServerCache(); // <--- Reset server cache after update
    return { status: 'success', message: 'Data Outlet dan seluruh Riwayat Finansialnya berhasil dihapus permanen.' };
  } catch(error) {
    throw new Error("Gagal menghapus entitas: " + error.toString());
  }
}

function deleteKapasitas(namaOutletRequest) {
  return deleteEntity(namaOutletRequest);
}

/**
 * =====================================================================
 * ZETTBOT SINGLE-SHEET HPP OVERRIDE
 * Tujuan: semua Struktur Biaya (Gas, Listrik, Air, Packing, Chemical,
 * Nota) disimpan dan dibaca dari SATU sheet: Struktur_Biaya_1.
 * Setelah blok ini aktif, sheet Struktur_Biaya_2 dan Struktur_Biaya_3
 * aman dihapus karena fungsi getAllHPPData(), saveStrukturBiaya(), dan
 * setupDatabase() di bawah menimpa versi lama di atas.
 * =====================================================================
 */

function zettHppHeaderRow_(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return 1;
  const lastCol = sheet.getLastColumn();
  const rows = sheet.getRange(1, 1, Math.min(2, sheet.getMaxRows()), lastCol).getDisplayValues();
  if (rows.length > 1) {
    const row2 = rows[1].join(' ').toLowerCase();
    if (row2.includes('timestamp') || row2.includes('nama outlet') || row2.includes('kap gas') || row2.includes('harga pp') || row2.includes('harga plastik')) {
      return 2;
    }
  }
  return 1;
}

function zettGetHeaderMap_(sheet) {
  try {
    if (!sheet || sheet.getLastColumn() === 0) return {};
    const headerRow = zettHppHeaderRow_(sheet);
    const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    return headers.reduce(function(acc, header, index) {
      if (header !== undefined && header !== null && String(header).trim() !== '') {
        acc[String(header).trim()] = index;
      }
      return acc;
    }, {});
  } catch (e) {
    console.error('zettGetHeaderMap_ error: ' + e.message);
    return {};
  }
}

function zettEnsureHeaders_(sheet, headers) {
  if (!sheet) return;
  const headerRow = zettHppHeaderRow_(sheet);
  let colMap = zettGetHeaderMap_(sheet);
  const packingNewHeaders = zettPackingHeaders20260518_();
  const packingOldHeaders = zettPackingOldHeaders20260518_();
  const hasOldPackingBlock = packingOldHeaders.some(function(h) { return h in colMap; });
  const missing = headers.filter(function(h) {
    if (hasOldPackingBlock && packingNewHeaders.indexOf(h) >= 0) return false;
    return !(h in colMap);
  });
  if (missing.length === 0) return;

  const startCol = sheet.getLastColumn() + 1;
  sheet.getRange(headerRow, startCol, 1, missing.length)
    .setValues([missing])
    .setFontWeight('bold')
    .setBackground('#0f172a')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  SpreadsheetApp.flush();
}

function zettCombinedHPPHeaders_() {
  return [
    'Timestamp', 'Nama Outlet', 'Kategori Laundry',
    'Mesin Cuci', 'Kap Cuci', 'Durasi Cuci',
    'Mesin Pengering', 'Kap Kering', 'Durasi Kering',
    'Alat Setrika', 'Kap Setrika', 'Durasi Setrika', 'Tipe Setrika',
    'Kap Gas', 'Harga Gas', 'Jam Gas', 'Menit Gas',
    'Estimasi Load Gas', 'Estimasi Biaya Gas', 'Gas Per Jam', 'Gas Per Menit',
    'Gas Per Load', 'Gas Per Kg', 'Setrika Per Jam', 'Setrika Per Kg',
    'TDL', 'Watt Cuci', 'kW Watt Cuci', 'Watt Kering', 'kW Watt Kering',
    'Watt Pompa', 'kW Watt Pompa', 'Watt Setrika', 'kW Watt Setrika',
    'Cuci Per Load', 'Cuci Per Kg', 'Kering Per Load', 'Kering Per Kg',
    'Listrik Setrika Jam', 'Listrik Setrika Kg',
    'Sumber Air', 'Harga Air', 'Harga Tangki', 'Liter Tangki', 'Air Cuci',
    'Sumber Setrika', 'Galon Setrika', 'Vol Setrika', 'Liter Setrika',
    'Jam Setrika', 'Kg Setrika', 'Air Per Load', 'Air Per Kg',
    'Air Setrika Jam', 'Air Setrika Kg',

    // [PACKING HEADER MIGRATION ONLY - 2026-05-18]
    // Packing memakai header utama baru. Alias lama tetap dibaca/ditulis secara kondisional di mapping.
    ...zettPackingHeaders20260518_(),

    // Chemical dan Nota tetap memakai nama field stabil agar frontend lama tetap terbaca
    'Chem_Det_Active', 'Chem_Det_Type', 'Chem_Det_Harga', 'Chem_Det_Kapasitas', 'Chem_Det_Pemakaian',
    'Chem_Sof_Active', 'Chem_Sof_Type', 'Chem_Sof_Harga', 'Chem_Sof_Kapasitas', 'Chem_Sof_Pemakaian',
    'Chem_Par_Active', 'Chem_Par_Harga', 'Chem_Par_Kapasitas', 'Chem_Par_Pemakaian',
    'Chem_Pel_Active', 'Chem_Pel_Type', 'Chem_Pel_Harga', 'Chem_Pel_Kapasitas', 'Chem_Pel_Pemakaian',
    'Nota_Type', 'Nota_App_FeeType', 'Nota_App_HargaBulan', 'Nota_App_TrxBulan', 'Nota_App_HargaTrx',
    'Nota_Thermal_Harga', 'Nota_Manual_Harga', 'Nota_Manual_LembarTotal', 'Nota_Manual_LembarTrx', 'Nota_RataKg'
  ];
}

function zettToNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const str = String(value).replace(/Rp/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function zettFormatPlainNumber_(value) {
  const n = zettToNumber_(value);
  return n || '';
}

function zettFirst_(obj, names, fallback) {
  for (let i = 0; i < names.length; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, names[i]) && obj[names[i]] !== '') return obj[names[i]];
  }
  return fallback;
}

// [PACKING HEADER MIGRATION ONLY - 2026-05-18]
function zettPackingHeaders20260518_() {
  return [
    'PP Aktif',
    'PP Lebar (cm)',
    'PP Panjang (cm)',
    'PP Harga/Pack (Rp)',
    'PP Isi/Pack (Lembar)',
    'PP Kapasitas (Kg/Lembar)',
    'PP Biaya/Lembar (Rp)',
    'PP Biaya/Kg (Rp)',
    'HD Aktif',
    'HD Lebar (cm)',
    'HD Panjang (cm)',
    'HD Harga/Pack (Rp)',
    'HD Isi/Pack (Lembar)',
    'HD Kapasitas (Kg/Lembar)',
    'HD Biaya/Lembar (Rp)',
    'HD Biaya/Kg (Rp)',
    'Jinjing Aktif',
    'Jinjing Lebar (cm)',
    'Jinjing Panjang (cm)',
    'Jinjing Harga/Pack (Rp)',
    'Jinjing Isi/Pack (Lembar)',
    'Jinjing Kapasitas (Kg/Lembar)',
    'Jinjing Biaya/Lembar (Rp)',
    'Jinjing Biaya/Kg (Rp)',
    'Solasi Aktif',
    'Solasi Harga/Roll (Rp)',
    'Solasi Panjang/Roll (Meter)',
    'Solasi Pemakaian/Kg (Meter)',
    'Solasi Biaya/Meter (Rp)',
    'Solasi Biaya/Kg (Rp)',
    'Total Biaya Packing/Kg (Rp)'
  ];
}

function zettPackingOldHeaders20260518_() {
  return [
    'Plastik PP', 'Ukr PP', 'Ukr Plastik', 'Harga PP', 'Harga Plastik', 'Isi PP', 'Isi Plastik',
    'Kap PP', 'Isi Per Lembar', 'PP Lembar', 'Plastik Per Lbr', 'Plastik Per Kg', 'Packing Per Kg',
    'Plastik HD', 'Ukr HD', 'Ukur HD', 'Harga HD', 'Isi HD', 'Kap HD', 'Isi HD Per Lbr',
    'HD Lembar Per Kg', 'HD Lembar', 'HD Per Lbr', 'HD Per Kg',
    'Plastik Jinjing', 'Ukr Jinjing', 'Ukur Jinjing', 'Harga Jinjing', 'Isi Jinjing',
    'Kap Jinjing', 'Isi Jinjing Per Lbr', 'Jinjing Lembar', 'Jinjing Per Lbr', 'Jinjing Per Kg',
    'Solasi Aktif', 'Solasi Harga/Roll (Rp)', 'Solasi Panjang/Roll (Meter)',
    'Solasi Pemakaian/Kg (Meter)', 'Solasi Biaya/Meter (Rp)', 'Solasi Biaya/Kg (Rp)',
    'Total Biaya Packing', 'Total Biaya Packing Kg'
  ];
}

function zettSplitPackingSize20260518_(value, context) {
  const raw = String(value || '').trim();
  if (!raw) return { width: '', length: '' };
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/);
  if (!match) {
    Logger.log('[PACKING HEADER MIGRATION ONLY - 2026-05-18] Ukuran tidak valid%s: "%s"', context ? ' ' + context : '', raw);
    return { width: '', length: '' };
  }
  return {
    width: match[1].replace(',', '.'),
    length: match[2].replace(',', '.')
  };
}

function zettJoinPackingSize20260518_(width, length, fallback) {
  const w = String(width || '').trim();
  const l = String(length || '').trim();
  if (w && l) return w + 'x' + l;
  return fallback || '';
}

function zettAddPackingAliases20260518_(obj) {
  if (!obj) return obj;

  const ppSize = zettJoinPackingSize20260518_(
    zettFirst_(obj, ['PP Lebar (cm)'], ''),
    zettFirst_(obj, ['PP Panjang (cm)'], ''),
    zettFirst_(obj, ['Ukr PP', 'Ukr Plastik', 'Packing_PP_Ukuran'], '')
  );
  const hdSize = zettJoinPackingSize20260518_(
    zettFirst_(obj, ['HD Lebar (cm)'], ''),
    zettFirst_(obj, ['HD Panjang (cm)'], ''),
    zettFirst_(obj, ['Ukr HD', 'Ukur HD', 'Packing_HD_Ukuran'], '')
  );
  const jinjingSize = zettJoinPackingSize20260518_(
    zettFirst_(obj, ['Jinjing Lebar (cm)'], ''),
    zettFirst_(obj, ['Jinjing Panjang (cm)'], ''),
    zettFirst_(obj, ['Ukr Jinjing', 'Ukur Jinjing', 'Packing_Jinjing_Ukuran'], '')
  );

  obj['Packing_PP_Active'] = zettFirst_(obj, ['PP Aktif', 'Packing_PP_Active', 'Plastik PP'], obj['Plastik PP'] || '');
  obj['Packing_PP_Ukuran'] = ppSize;
  obj['Packing_PP_Harga'] = zettFirst_(obj, ['PP Harga/Pack (Rp)', 'Packing_PP_Harga', 'Harga PP', 'Harga Plastik'], '');
  obj['Packing_PP_Isi'] = zettFirst_(obj, ['PP Isi/Pack (Lembar)', 'Packing_PP_Isi', 'Isi PP', 'Isi Plastik'], '');
  obj['Packing_PP_Kg'] = zettFirst_(obj, ['PP Kapasitas (Kg/Lembar)', 'Packing_PP_Kg', 'Kap PP', 'Isi Per Lembar'], '');
  obj['Packing_PP_Lembar'] = zettFirst_(obj, ['PP Biaya/Lembar (Rp)', 'Packing_PP_Lembar', 'PP Lembar', 'Plastik Per Lbr'], '');
  obj['Packing_PP_PerKg'] = zettFirst_(obj, ['PP Biaya/Kg (Rp)', 'Packing_PP_PerKg', 'Plastik Per Kg', 'Packing Per Kg'], '');

  obj['Packing_HD_Active'] = zettFirst_(obj, ['HD Aktif', 'Packing_HD_Active', 'Plastik HD'], obj['Plastik HD'] || '');
  obj['Packing_HD_Ukuran'] = hdSize;
  obj['Packing_HD_Harga'] = zettFirst_(obj, ['HD Harga/Pack (Rp)', 'Packing_HD_Harga', 'Harga HD'], '');
  obj['Packing_HD_Isi'] = zettFirst_(obj, ['HD Isi/Pack (Lembar)', 'Packing_HD_Isi', 'Isi HD'], '');
  obj['Packing_HD_Kg'] = zettFirst_(obj, ['HD Kapasitas (Kg/Lembar)', 'Packing_HD_Kg', 'Kap HD', 'Isi HD Per Lbr'], '');
  obj['Packing_HD_Lembar'] = zettFirst_(obj, ['HD Biaya/Lembar (Rp)', 'Packing_HD_Lembar', 'HD Lembar Per Kg', 'HD Lembar', 'HD Per Lbr'], '');
  obj['Packing_HD_PerKg'] = zettFirst_(obj, ['HD Biaya/Kg (Rp)', 'Packing_HD_PerKg', 'HD Per Kg'], '');

  obj['Packing_Jinjing_Active'] = zettFirst_(obj, ['Jinjing Aktif', 'Packing_Jinjing_Active', 'Plastik Jinjing'], obj['Plastik Jinjing'] || '');
  obj['Packing_Jinjing_Ukuran'] = jinjingSize;
  obj['Packing_Jinjing_Harga'] = zettFirst_(obj, ['Jinjing Harga/Pack (Rp)', 'Packing_Jinjing_Harga', 'Harga Jinjing'], '');
  obj['Packing_Jinjing_Isi'] = zettFirst_(obj, ['Jinjing Isi/Pack (Lembar)', 'Packing_Jinjing_Isi', 'Isi Jinjing'], '');
  obj['Packing_Jinjing_Kg'] = zettFirst_(obj, ['Jinjing Kapasitas (Kg/Lembar)', 'Packing_Jinjing_Kg', 'Kap Jinjing', 'Isi Jinjing Per Lbr'], '');
  obj['Packing_Jinjing_Lembar'] = zettFirst_(obj, ['Jinjing Biaya/Lembar (Rp)', 'Packing_Jinjing_Lembar', 'Jinjing Lembar', 'Jinjing Per Lbr'], '');
  obj['Packing_Jinjing_PerKg'] = zettFirst_(obj, ['Jinjing Biaya/Kg (Rp)', 'Packing_Jinjing_PerKg', 'Jinjing Per Kg'], '');

  obj['Total Biaya Packing'] = zettFirst_(obj, ['Total Biaya Packing/Kg (Rp)', 'Total Biaya Packing', 'Total Biaya Packing Kg'], '');
  return obj;
}

function zettNormalizeOutletName_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// [PACKING HEADER MIGRATION ONLY - 2026-05-18]
function migratePackingHeadersOnly_20260518() {
  const ss = _getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_HPP_1);
  if (!sheet) throw new Error('Sheet Struktur_Biaya_1 tidak ditemukan. Migrasi Packing dibatalkan.');

  const headerRow = zettHppHeaderRow_(sheet);
  const groupRow = Math.max(1, headerRow - 1);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) throw new Error('Sheet Struktur_Biaya_1 kosong. Migrasi Packing dibatalkan.');

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getDisplayValues()[0].map(function(h) { return String(h || '').trim(); });
  const groupHeaders = sheet.getRange(groupRow, 1, 1, lastCol).getDisplayValues()[0].map(function(h) { return String(h || '').trim(); });
  const newHeaders = zettPackingHeaders20260518_();
  const oldHeaders = zettPackingOldHeaders20260518_();
  const allPackingHeaders = newHeaders.concat(oldHeaders);

  const existingNewIndexes = newHeaders
    .map(function(h) { return headers.indexOf(h); })
    .filter(function(index) { return index >= 0; });
  const hasCompleteNew = existingNewIndexes.length === newHeaders.length;
  const contiguousNewStart = hasCompleteNew ? existingNewIndexes[0] : -1;
  const hasContiguousNew = hasCompleteNew && newHeaders.every(function(h, offset) {
    return headers[contiguousNewStart + offset] === h;
  });
  if (hasContiguousNew) {
    const duplicateNew = newHeaders.filter(function(h) {
      return headers.filter(function(header) { return header === h; }).length > 1;
    });
    if (duplicateNew.length > 0) {
      throw new Error('Header Packing baru sudah ada tetapi duplikat ditemukan: ' + duplicateNew.join(', '));
    }
    Logger.log('[PACKING HEADER MIGRATION ONLY - 2026-05-18] Header Packing sudah sesuai. Tidak ada kolom baru dibuat.');
    return {
      status: 'skipped',
      message: 'Header Packing sudah sesuai.',
      rowsMigrated: Math.max(0, lastRow - headerRow)
    };
  }

  let blockStart = groupHeaders.findIndex(function(value) {
    return zettNormalizeOutletName_(value) === zettNormalizeOutletName_('Analisa Biaya Packing');
  });
  const packingIndexes = [];
  headers.forEach(function(header, index) {
    if (allPackingHeaders.indexOf(header) >= 0) packingIndexes.push(index);
  });
  if (blockStart < 0 && packingIndexes.length > 0) blockStart = Math.min.apply(null, packingIndexes);
  if (blockStart < 0) {
    throw new Error('Grup/header Analisa Biaya Packing tidak ditemukan. Migrasi Packing dibatalkan.');
  }

  let blockEnd = -1;
  for (let i = blockStart + 1; i < groupHeaders.length; i++) {
    const label = String(groupHeaders[i] || '').trim();
    if (label && zettNormalizeOutletName_(label) !== zettNormalizeOutletName_('Analisa Biaya Packing')) {
      blockEnd = i - 1;
      break;
    }
  }
  const maxPackingIndex = packingIndexes.length > 0 ? Math.max.apply(null, packingIndexes) : blockStart;
  if (blockEnd < maxPackingIndex) blockEnd = maxPackingIndex;
  if (blockEnd < blockStart) blockEnd = blockStart;

  const blockWidth = blockEnd - blockStart + 1;
  const dataStartRow = headerRow + 1;
  const dataRowCount = Math.max(0, lastRow - headerRow);
  const oldValues = dataRowCount > 0
    ? sheet.getRange(dataStartRow, blockStart + 1, dataRowCount, blockWidth).getValues()
    : [];
  const oldHeaderSlice = headers.slice(blockStart, blockEnd + 1);
  const oldMap = oldHeaderSlice.reduce(function(acc, header, index) {
    if (header) acc[header] = index;
    return acc;
  }, {});

  let backup;
  try {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
    const backupName = SHEET_HPP_1 + '_BACKUP_BEFORE_PACKING_HEADER_MIGRATION_' + stamp;
    backup = sheet.copyTo(ss).setName(backupName);
    ss.setActiveSheet(sheet);
    Logger.log('[PACKING HEADER MIGRATION ONLY - 2026-05-18] Backup berhasil dibuat: %s', backupName);
  } catch (error) {
    throw new Error('Backup sheet gagal dibuat. Migrasi Packing dihentikan. Detail: ' + error.message);
  }
  if (!backup) throw new Error('Backup sheet gagal dibuat. Migrasi Packing dihentikan.');

  function readOld(row, names, fallback) {
    for (let i = 0; i < names.length; i++) {
      const key = names[i];
      if (Object.prototype.hasOwnProperty.call(oldMap, key)) {
        const value = row[oldMap[key]];
        if (value !== '' && value !== null && value !== undefined) return value;
      }
    }
    return fallback || '';
  }

  function buildNewRow(row, rowNumber) {
    const ppSize = zettSplitPackingSize20260518_(readOld(row, ['Ukr PP', 'Ukr Plastik'], ''), 'row ' + rowNumber + ' PP');
    const hdSize = zettSplitPackingSize20260518_(readOld(row, ['Ukr HD', 'Ukur HD'], ''), 'row ' + rowNumber + ' HD');
    const jinjingSize = zettSplitPackingSize20260518_(readOld(row, ['Ukr Jinjing', 'Ukur Jinjing'], ''), 'row ' + rowNumber + ' Jinjing');
    return [
      readOld(row, ['PP Aktif', 'Plastik PP', 'Packing_PP_Active'], ''),
      readOld(row, ['PP Lebar (cm)'], ppSize.width),
      readOld(row, ['PP Panjang (cm)'], ppSize.length),
      readOld(row, ['PP Harga/Pack (Rp)', 'Harga PP', 'Harga Plastik', 'Packing_PP_Harga'], ''),
      readOld(row, ['PP Isi/Pack (Lembar)', 'Isi PP', 'Isi Plastik', 'Packing_PP_Isi'], ''),
      readOld(row, ['PP Kapasitas (Kg/Lembar)', 'Kap PP', 'Isi Per Lembar', 'Packing_PP_Kg'], ''),
      readOld(row, ['PP Biaya/Lembar (Rp)', 'PP Lembar', 'Plastik Per Lbr', 'Packing_PP_Lembar'], ''),
      readOld(row, ['PP Biaya/Kg (Rp)', 'Plastik Per Kg', 'Packing Per Kg', 'Packing_PP_PerKg'], ''),
      readOld(row, ['HD Aktif', 'Plastik HD', 'Packing_HD_Active'], ''),
      readOld(row, ['HD Lebar (cm)'], hdSize.width),
      readOld(row, ['HD Panjang (cm)'], hdSize.length),
      readOld(row, ['HD Harga/Pack (Rp)', 'Harga HD', 'Packing_HD_Harga'], ''),
      readOld(row, ['HD Isi/Pack (Lembar)', 'Isi HD', 'Packing_HD_Isi'], ''),
      readOld(row, ['HD Kapasitas (Kg/Lembar)', 'Kap HD', 'Isi HD Per Lbr', 'Packing_HD_Kg'], ''),
      readOld(row, ['HD Biaya/Lembar (Rp)', 'HD Lembar Per Kg', 'HD Lembar', 'HD Per Lbr', 'Packing_HD_Lembar'], ''),
      readOld(row, ['HD Biaya/Kg (Rp)', 'HD Per Kg', 'Packing_HD_PerKg'], ''),
      readOld(row, ['Jinjing Aktif', 'Plastik Jinjing', 'Packing_Jinjing_Active'], ''),
      readOld(row, ['Jinjing Lebar (cm)'], jinjingSize.width),
      readOld(row, ['Jinjing Panjang (cm)'], jinjingSize.length),
      readOld(row, ['Jinjing Harga/Pack (Rp)', 'Harga Jinjing', 'Packing_Jinjing_Harga'], ''),
      readOld(row, ['Jinjing Isi/Pack (Lembar)', 'Isi Jinjing', 'Packing_Jinjing_Isi'], ''),
      readOld(row, ['Jinjing Kapasitas (Kg/Lembar)', 'Kap Jinjing', 'Isi Jinjing Per Lbr', 'Packing_Jinjing_Kg'], ''),
      readOld(row, ['Jinjing Biaya/Lembar (Rp)', 'Jinjing Lembar', 'Jinjing Per Lbr', 'Packing_Jinjing_Lembar'], ''),
      readOld(row, ['Jinjing Biaya/Kg (Rp)', 'Jinjing Per Kg', 'Packing_Jinjing_PerKg'], ''),
      readOld(row, ['Solasi Aktif'], ''),
      readOld(row, ['Solasi Harga/Roll (Rp)'], ''),
      readOld(row, ['Solasi Panjang/Roll (Meter)'], ''),
      readOld(row, ['Solasi Pemakaian/Kg (Meter)'], ''),
      readOld(row, ['Solasi Biaya/Meter (Rp)'], ''),
      readOld(row, ['Solasi Biaya/Kg (Rp)'], ''),
      readOld(row, ['Total Biaya Packing/Kg (Rp)', 'Total Biaya Packing', 'Total Biaya Packing Kg'], '')
    ];
  }

  const newWidth = newHeaders.length;
  const widthDiff = newWidth - blockWidth;
  if (widthDiff > 0) {
    sheet.insertColumnsAfter(blockEnd + 1, widthDiff);
  } else if (widthDiff < 0) {
    sheet.deleteColumns(blockStart + 1 + newWidth, Math.abs(widthDiff));
  }

  const headerRange = sheet.getRange(headerRow, blockStart + 1, 1, newWidth);
  headerRange
    .setValues([newHeaders])
    .setFontWeight('bold')
    .setBackground('#0f172a')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  if (groupRow < headerRow) {
    const groupRange = sheet.getRange(groupRow, blockStart + 1, 1, newWidth);
    try { groupRange.breakApart(); } catch (error) {}
    groupRange
      .setValue('Analisa Biaya Packing')
      .setFontWeight('bold')
      .setBackground('#f97316')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    try { groupRange.mergeAcross(); } catch (error) {}
  }

  if (dataRowCount > 0) {
    const migratedValues = oldValues.map(function(row, index) {
      return buildNewRow(row, dataStartRow + index);
    });
    sheet.getRange(dataStartRow, blockStart + 1, dataRowCount, newWidth).setValues(migratedValues);
  }

  SpreadsheetApp.flush();

  const finalHeaders = sheet.getRange(headerRow, blockStart + 1, 1, newWidth).getDisplayValues()[0].map(function(h) { return String(h || '').trim(); });
  const missing = newHeaders.filter(function(h) { return finalHeaders.indexOf(h) < 0; });
  const duplicates = newHeaders.filter(function(h) {
    return finalHeaders.filter(function(header) { return header === h; }).length > 1;
  });
  if (missing.length > 0 || duplicates.length > 0) {
    throw new Error('Validasi header Packing gagal. Missing: ' + missing.join(', ') + '. Duplikat: ' + duplicates.join(', '));
  }

  Logger.log('[PACKING HEADER MIGRATION ONLY - 2026-05-18] Migrasi selesai. Row data: %s, kolom lama: %s, kolom baru: %s.', dataRowCount, blockWidth, newWidth);
  return {
    status: 'success',
    message: 'Migrasi header Packing selesai.',
    rowsMigrated: dataRowCount,
    oldColumnCount: blockWidth,
    newColumnCount: newWidth
  };
}

function setupDatabase() {
  try {
    const ss = _getSpreadsheet();

    const headersBep = [
      'Timestamp', 'Nama_Outlet', 'Jam_Operasional',
      'Biaya_Tetap', 'Biaya_Variabel_Per_Kg', 'Kapasitas_Per_Bulan',
      'HPP_Per_Kg', 'Harga_Acuan_BEP', 'BEP_Kg', 'BEP_Rupiah',
      'Paket_Cuci_Setrika', 'Paket_Cuci_Lipat', 'Paket_Cuci_Saja', 'Paket_Setrika_Saja'
    ];
        const headersKap = [
      'Timestamp', 'Nama Outlet', 'Jam Buka', 'Jam Tutup', 'Tutup Hari Minggu',
      'Target Okupansi Cuci', 'Target Okupansi Kering', 'Target Okupansi Setrika',
      'Estimasi Cuci', 'Estimasi Kering', 'Estimasi Setrika', 'Durasi Operasional', 'Kategori Laundry',
      'Mesin Cuci', 'Mesin Pengering', 'Kap Cuci', 'Kap Kering', 'Durasi Cuci', 'Durasi Kering',
      'Alat Setrika', 'Kap Setrika', 'Durasi Setrika', 'Tipe Mesin Cuci', 'Tipe Mesin Pengering', 'Tipe Setrika',
      'Pakai Pengering', 'Metode Pengeringan'
    ];

    const initSheet = function(sheetName, headerArr) {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      if (sheet.getLastColumn() === 0) {
        sheet.getRange(1, 1, 1, headerArr.length)
          .setValues([headerArr])
          .setFontWeight('bold')
          .setBackground('#0f172a')
          .setFontColor('#ffffff')
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle')
          .setWrap(true);
        sheet.setFrozenRows(1);
      } else {
        zettEnsureHeaders_(sheet, headerArr);
      }
      return sheet;
    };

    initSheet(SHEET_NAME_BEP, headersBep);
    initSheet(SHEET_NAME_KAPASITAS, headersKap);
    const sheetHPP = initSheet(SHEET_HPP_1, zettCombinedHPPHeaders_());
    applySmartColumnGrouping(sheetHPP);
    clearServerCache();
  } catch (error) {
    console.error('Setup Database Single-Sheet Error: ' + error.toString());
  }
}

function getAllHPPData() {
  try {
    const ss = _getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) return [];

    zettEnsureHeaders_(sheet, zettCombinedHPPHeaders_());

    const data = sheet.getDataRange().getDisplayValues();
    const map = zettGetHeaderMap_(sheet);
    const nameCol = ('Nama Outlet' in map) ? map['Nama Outlet'] : null;
    if (nameCol === null || data.length < 2) return [];

    const headerRow = zettHppHeaderRow_(sheet);
    const result = [];
    for (let i = headerRow; i < data.length; i++) {
      const row = data[i];
      const name = String(row[nameCol] || '').trim();
      if (!name || name.toLowerCase().includes('nama outlet')) continue;

      const obj = { namaOutlet: name };
      Object.keys(map).forEach(function(key) {
        obj[key] = row[map[key]];
      });

      // [PACKING HEADER MIGRATION ONLY - 2026-05-18]
      // Alias baca Packing agar frontend lama tetap aman setelah header utama diganti.
      zettAddPackingAliases20260518_(obj);

      result.push(obj);
    }
    return result;
  } catch (e) {
    console.error('Error getAllHPPData Single-Sheet: ' + e.message);
    return [];
  }
}

function getHPPRowByOutlet(namaOutlet) {
  try {
    const targetName = String(namaOutlet || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!targetName) return { status: 'error', message: 'Nama outlet kosong.' };

    const ss = _getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) return { status: 'error', message: 'Sheet Struktur_Biaya_1 tidak ditemukan.' };

    const data = sheet.getDataRange().getDisplayValues();
    const map = zettGetHeaderMap_(sheet);
    const nameCol = ('Nama Outlet' in map) ? map['Nama Outlet'] : null;
    if (nameCol === null || data.length < 2) return { status: 'error', message: 'Data HPP belum tersedia.' };

    const headerRow = zettHppHeaderRow_(sheet);
    for (let i = headerRow; i < data.length; i++) {
      const row = data[i];
      const name = String(row[nameCol] || '').trim();
      if (name.toLowerCase().replace(/\s+/g, ' ') !== targetName) continue;

      const obj = { namaOutlet: name };
      Object.keys(map).forEach(function(key) {
        obj[key] = row[map[key]];
      });

      // [PACKING HEADER MIGRATION ONLY - 2026-05-18]
      zettAddPackingAliases20260518_(obj);

      return { status: 'success', data: obj };
    }

    return { status: 'error', message: 'Data HPP outlet tidak ditemukan.' };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

function zettIsSelfServiceCategory_(kategori) {
  return String(kategori || '').toLowerCase().includes('self');
}

function zettIsHybridCategory_(kategori) {
  return String(kategori || '').toLowerCase().includes('hybrid');
}

function zettIsDropOffCategory_(kategori) {
  const text = String(kategori || '').toLowerCase();
  return text.includes('drop') || text.includes('kiloan');
}

function zettUsesSteamIron_(tipeSetrika) {
  const text = String(tipeSetrika || '').toLowerCase();
  return text.includes('uap') || text.includes('steam') || text.includes('gas');
}

function zettGasIronRelevant_(kategori, tipeSetrika) {
  return !zettIsSelfServiceCategory_(kategori)
    && (zettIsDropOffCategory_(kategori) || zettIsHybridCategory_(kategori))
    && zettUsesSteamIron_(tipeSetrika);
}

function zettDryerActiveFromRow_(row, colMap) {
  if (!row || !colMap) return true;
  const get = (key) => (key in colMap ? row[colMap[key]] : '');
  const pakaiRaw = String(get('Pakai Pengering') || '').trim().toLowerCase();
  const metodeRaw = String(get('Metode Pengeringan') || '').trim().toLowerCase();
  if (pakaiRaw === 'tidak' || pakaiRaw === 'false' || pakaiRaw === '0' || metodeRaw === 'jemur') return false;
  const mesin = zettToNumber_(get('Mesin Pengering') || get('Mesin Kering'));
  const kap = zettToNumber_(get('Kap Kering'));
  if ((('Mesin Pengering' in colMap) || ('Mesin Kering' in colMap)) && ('Kap Kering' in colMap) && mesin <= 0 && kap <= 0) return false;
  return true;
}

function zettWarnMissingHeader_(headerName, sheetName) {
  try {
    Logger.log('[HPP] Header "%s" tidak ditemukan di %s. Field dilewati.', headerName, sheetName || SHEET_HPP_1);
  } catch (e) {}
}

function saveStrukturBiaya(payload) {
  try {
    const ss = _getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_HPP_1);
    if (!sheet) sheet = ss.insertSheet(SHEET_HPP_1);
    if (sheet.getLastColumn() === 0) {
      sheet.getRange(1, 1, 1, zettCombinedHPPHeaders_().length)
        .setValues([zettCombinedHPPHeaders_()])
        .setFontWeight('bold')
        .setBackground('#0f172a')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle')
        .setWrap(true);
      sheet.setFrozenRows(1);
    } else {
      zettEnsureHeaders_(sheet, zettCombinedHPPHeaders_());
    }

    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    const sanitizedNama = zettNormalizeOutletName_(payload.namaOutlet);
    if (!sanitizedNama) throw new Error('Nama outlet kosong. Pilih cabang terlebih dahulu.');

    const data = sheet.getDataRange().getDisplayValues();
    const colMap = zettGetHeaderMap_(sheet);
    const nameCol = ('Nama Outlet' in colMap) ? colMap['Nama Outlet'] : null;
    if (nameCol === null) throw new Error('Header "Nama Outlet" tidak ditemukan di Struktur_Biaya_1.');

    let targetRow = -1;
    const headerRow = zettHppHeaderRow_(sheet);
    for (let i = headerRow; i < data.length; i++) {
      if (zettNormalizeOutletName_(data[i][nameCol]) === sanitizedNama) {
        targetRow = i + 1;
        break;
      }
    }

    const operationalValues = zettGetOperationalProfileForHPP_(payload.namaOutlet, timestamp);
    const payloadOperationalValues = zettBuildOperationalHPPValues_(payload, timestamp);
    Object.keys(payloadOperationalValues).forEach(function(key) {
      if ((key === 'Pakai Pengering' || key === 'Metode Pengeringan') &&
          payload.pakaiPengering === undefined && payload.metodePengeringan === undefined) return;
      if (key === 'Timestamp' || key === 'Nama Outlet' || payloadOperationalValues[key] !== '') {
        operationalValues[key] = payloadOperationalValues[key];
      }
    });

    let kategoriLaundry = 'Drop Off/Kiloan';
    let kapKering = 1;
    let kapSetrika = 1;
    let tipeSetrika = '';
    let pakaiMesinPengering = true;
    if (operationalValues['Kategori Laundry']) kategoriLaundry = String(operationalValues['Kategori Laundry']);
    if (operationalValues['Kap Kering'] !== '') kapKering = zettToNumber_(operationalValues['Kap Kering']) || 1;
    if (operationalValues['Kap Setrika'] !== '') kapSetrika = zettToNumber_(operationalValues['Kap Setrika']) || 1;
    if (operationalValues['Tipe Setrika']) tipeSetrika = String(operationalValues['Tipe Setrika']);
    if (operationalValues['Pakai Pengering'] || operationalValues['Metode Pengeringan']) {
      pakaiMesinPengering = String(operationalValues['Pakai Pengering'] || '').toLowerCase() !== 'tidak'
        && String(operationalValues['Metode Pengeringan'] || '').toLowerCase() !== 'jemur';
    }
    if (targetRow !== -1) {
      const row = data[targetRow - 1];
      if (!operationalValues['Kategori Laundry'] && 'Kategori Laundry' in colMap) kategoriLaundry = String(row[colMap['Kategori Laundry']] || kategoriLaundry);
      if (operationalValues['Kap Kering'] === '' && 'Kap Kering' in colMap) kapKering = zettToNumber_(row[colMap['Kap Kering']]) || 1;
      if (operationalValues['Kap Setrika'] === '' && 'Kap Setrika' in colMap) kapSetrika = zettToNumber_(row[colMap['Kap Setrika']]) || 1;
      if (!operationalValues['Tipe Setrika'] && 'Tipe Setrika' in colMap) tipeSetrika = String(row[colMap['Tipe Setrika']] || '');
      if (!operationalValues['Pakai Pengering'] && !operationalValues['Metode Pengeringan']) pakaiMesinPengering = zettDryerActiveFromRow_(row, colMap);
    }

    const gasJam = zettToNumber_(payload.gasJam);
    const gasHarga = zettToNumber_(payload.gasHarga);
    const gasMenit = zettToNumber_(payload.gasMenit);
    const gasPerJam = zettToNumber_(payload.gasPerJam) || (gasJam > 0 ? gasHarga / gasJam : 0);
    const gasPerMenit = zettToNumber_(payload.gasPerMenit) || (gasMenit > 0 ? gasHarga / gasMenit : 0);
    const estimasiLoadGas = zettToNumber_(payload.estimasiLoadGas);
    const estimasiBiayaGas = zettToNumber_(payload.estimasiBiayaGas) || zettToNumber_(payload.gasPerLoad);
    const gasPerLoad = estimasiBiayaGas;
    let gasPerKgStr = '';
    let setrikaPerJamStr = '';
    let setrikaPerKgStr = '';

    if (!zettIsSelfServiceCategory_(kategoriLaundry)) {
      gasPerKgStr = (zettIsHybridCategory_(kategoriLaundry) || (zettIsDropOffCategory_(kategoriLaundry) && pakaiMesinPengering))
        ? (kapKering > 0 ? gasPerLoad / kapKering : 0)
        : '';
      if (zettGasIronRelevant_(kategoriLaundry, tipeSetrika)) {
        setrikaPerJamStr = gasPerJam;
        setrikaPerKgStr = kapSetrika > 0 ? setrikaPerJamStr / kapSetrika : '';
      }
    }

    const ppHarga = zettToNumber_(payload.packPPHarga);
    const ppIsi = zettToNumber_(payload.packPPIsi) || 1;
    const ppKap = zettToNumber_(payload.packPPKg) || 1;
    const ppLembar = ppHarga / ppIsi;
    const ppKg = payload.packPPActive ? (ppLembar / ppKap) : 0;

    const hdHarga = zettToNumber_(payload.packHDHarga);
    const hdIsi = zettToNumber_(payload.packHDIsi) || 1;
    const hdKap = zettToNumber_(payload.packHDKg) || 1;
    const hdLembar = hdHarga / hdIsi;
    const hdKg = payload.packHDActive ? (hdLembar / hdKap) : 0;

    const jHarga = zettToNumber_(payload.packJinjingHarga);
    const jIsi = zettToNumber_(payload.packJinjingIsi) || 1;
    const jKap = zettToNumber_(payload.packJinjingKg) || 1;
    const jLembar = jHarga / jIsi;
    const jKg = payload.packJinjingActive ? (jLembar / jKap) : 0;

    // [PACKING HEADER MIGRATION ONLY - 2026-05-18]
    const ppSize = zettSplitPackingSize20260518_(payload.packPPUkuran || payload.packPPSize || '', 'simpan PP');
    const hdSize = zettSplitPackingSize20260518_(payload.packHDUkuran || payload.packHDSize || '', 'simpan HD');
    const jinjingSize = zettSplitPackingSize20260518_(payload.packJinjingUkuran || payload.packJinjingSize || '', 'simpan Jinjing');
    const solasiActive = payload.packSolasiActive === true || String(payload.packSolasiActive || '').toLowerCase() === 'true' || String(payload.packSolasiActive || '').toLowerCase() === 'ya';
    const solasiHarga = zettToNumber_(payload.packSolasiHarga);
    const solasiPanjang = zettToNumber_(payload.packSolasiPanjang);
    const solasiPemakaian = zettToNumber_(payload.packSolasiPemakaian);
    const solasiBiayaMeter = solasiPanjang > 0 ? solasiHarga / solasiPanjang : 0;
    const solasiBiayaKg = solasiActive ? solasiBiayaMeter * solasiPemakaian : 0;
    const totalPacking = kategoriLaundry.toLowerCase().includes('self service') ? 0 : (ppKg + hdKg + jKg);
    const sumberAir = String(payload.airSumber || '').trim().toLowerCase() || 'pdam';
    const sumberSetrika = String(payload.airBoilerSumber || '').trim().toLowerCase() || 'sama';
    const hargaAir = sumberAir === 'pdam' ? payload.airHargaM3 : '';
    const hargaTangki = sumberAir === 'tangki' ? payload.airHargaTangki : '';
    const literTangki = sumberAir === 'tangki' ? payload.airLiterTangki : '';
    const galonSetrika = sumberSetrika === 'galon' ? payload.airHargaGalon : '';
    const volSetrika = sumberSetrika === 'galon' ? payload.airLiterGalon : '';

    const mapping = {
      'Kategori Laundry': kategoriLaundry,
      'Mesin Cuci': operationalValues['Mesin Cuci'],
      'Kap Cuci': operationalValues['Kap Cuci'],
      'Durasi Cuci': operationalValues['Durasi Cuci'],
      'Mesin Pengering': operationalValues['Mesin Pengering'],
      'Kap Kering': operationalValues['Kap Kering'],
      'Durasi Kering': operationalValues['Durasi Kering'],
      'Alat Setrika': operationalValues['Alat Setrika'],
      'Kap Setrika': operationalValues['Kap Setrika'],
      'Durasi Setrika': operationalValues['Durasi Setrika'],
      'Tipe Setrika': tipeSetrika,
      'Pakai Pengering': operationalValues['Pakai Pengering'],
      'Metode Pengeringan': operationalValues['Metode Pengeringan'],

      'Kap Gas': payload.gasKapasitas,
      'Harga Gas': gasHarga,
      'Jam Gas': gasJam,
      'Menit Gas': gasMenit,
      'Estimasi Load Gas': estimasiLoadGas,
      'Estimasi Biaya Gas': estimasiBiayaGas,
      'Gas Per Jam': gasPerJam,
      'Gas Per Menit': gasPerMenit,
      'Gas Per Load': estimasiBiayaGas,
      'Gas Per Kg': gasPerKgStr,
      'Setrika Per Jam': setrikaPerJamStr,
      'Setrika Per Kg': setrikaPerKgStr,

      'TDL': payload.listrikTDL,
      'Watt Cuci': payload.listrikCuci,
      'kW Watt Cuci': '=IF({COL:Watt Cuci}{ROW}="";""; {COL:Watt Cuci}{ROW}/1000)',
      'Watt Kering': payload.listrikPengering,
      'kW Watt Kering': '=IF({COL:Watt Kering}{ROW}="";""; {COL:Watt Kering}{ROW}/1000)',
      'Watt Pompa': payload.listrikPompa,
      'kW Watt Pompa': '=IF({COL:Watt Pompa}{ROW}="";""; {COL:Watt Pompa}{ROW}/1000)',
      'Watt Setrika': payload.listrikSetrika,
      'kW Watt Setrika': '=IF({COL:Watt Setrika}{ROW}="";""; {COL:Watt Setrika}{ROW}/1000)',
      'Cuci Per Load': '=IF({COL:kW Watt Cuci}{ROW}="";""; {COL:kW Watt Cuci}{ROW}*{COL:TDL}{ROW}*1)',
      'Cuci Per Kg': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:Cuci Per Load}{ROW}="");""; {COL:Cuci Per Load}{ROW}/{COL:Kap Cuci}{ROW})',
      'Kering Per Load': '=IF({COL:kW Watt Kering}{ROW}="";""; {COL:kW Watt Kering}{ROW}*{COL:TDL}{ROW}*1)',
      'Kering Per Kg': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:Kering Per Load}{ROW}="");""; {COL:Kering Per Load}{ROW}/{COL:Kap Kering}{ROW})',
      'Listrik Setrika Jam': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:kW Watt Setrika}{ROW}="");""; {COL:kW Watt Setrika}{ROW}*{COL:TDL}{ROW}*1)',
      'Listrik Setrika Kg': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:Listrik Setrika Jam}{ROW}="");""; {COL:Listrik Setrika Jam}{ROW}/{COL:Kap Setrika}{ROW})',

      'Sumber Air': sumberAir,
      'Harga Air': hargaAir,
      'Harga Tangki': hargaTangki,
      'Liter Tangki': literTangki,
      'Air Cuci': payload.airCuciLiter,
      'Sumber Setrika': sumberSetrika,
      'Galon Setrika': galonSetrika,
      'Vol Setrika': volSetrika,
      'Liter Setrika': payload.airBoilerLiter,
      'Jam Setrika': payload.airBoilerJam,
      'Kg Setrika': payload.airBoilerKgJam,
      'Air Per Load': '=IF({COL:Sumber Air}{ROW}="pdam"; {COL:Harga Air}{ROW}/1000; IF(AND({COL:Sumber Air}{ROW}="tangki"; {COL:Liter Tangki}{ROW}>0); {COL:Harga Tangki}{ROW}/{COL:Liter Tangki}{ROW}; 0)) * {COL:Air Cuci}{ROW}',
      'Air Per Kg': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:Air Per Load}{ROW}="");""; {COL:Air Per Load}{ROW}/{COL:Kap Cuci}{ROW})',
      'Air Setrika Jam': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:Liter Setrika}{ROW}=""; {COL:Jam Setrika}{ROW}<=0);""; IF(AND({COL:Sumber Setrika}{ROW}="galon"; {COL:Vol Setrika}{ROW}>0); {COL:Galon Setrika}{ROW}/{COL:Vol Setrika}{ROW}; IF({COL:Sumber Air}{ROW}="pdam"; {COL:Harga Air}{ROW}/1000; IF(AND({COL:Sumber Air}{ROW}="tangki"; {COL:Liter Tangki}{ROW}>0); {COL:Harga Tangki}{ROW}/{COL:Liter Tangki}{ROW}; 0))) * ({COL:Liter Setrika}{ROW} / {COL:Jam Setrika}{ROW}))',
      'Air Setrika Kg': '=IF(OR({COL:Kategori Laundry}{ROW}="Self Service"; {COL:Air Setrika Jam}{ROW}="");""; {COL:Air Setrika Jam}{ROW} / {COL:Kg Setrika}{ROW})',

      // [PACKING HEADER MIGRATION ONLY - 2026-05-18]
      'PP Aktif': payload.packPPActive ? 'Ya' : 'Tidak',
      'PP Lebar (cm)': ppSize.width,
      'PP Panjang (cm)': ppSize.length,
      'PP Harga/Pack (Rp)': payload.packPPHarga,
      'PP Isi/Pack (Lembar)': payload.packPPIsi,
      'PP Kapasitas (Kg/Lembar)': payload.packPPKg,
      'PP Biaya/Lembar (Rp)': ppLembar,
      'PP Biaya/Kg (Rp)': ppKg,
      'HD Aktif': payload.packHDActive ? 'Ya' : 'Tidak',
      'HD Lebar (cm)': hdSize.width,
      'HD Panjang (cm)': hdSize.length,
      'HD Harga/Pack (Rp)': payload.packHDHarga,
      'HD Isi/Pack (Lembar)': payload.packHDIsi,
      'HD Kapasitas (Kg/Lembar)': payload.packHDKg,
      'HD Biaya/Lembar (Rp)': hdLembar,
      'HD Biaya/Kg (Rp)': hdKg,
      'Jinjing Aktif': payload.packJinjingActive ? 'Ya' : 'Tidak',
      'Jinjing Lebar (cm)': jinjingSize.width,
      'Jinjing Panjang (cm)': jinjingSize.length,
      'Jinjing Harga/Pack (Rp)': payload.packJinjingHarga,
      'Jinjing Isi/Pack (Lembar)': payload.packJinjingIsi,
      'Jinjing Kapasitas (Kg/Lembar)': payload.packJinjingKg,
      'Jinjing Biaya/Lembar (Rp)': jLembar,
      'Jinjing Biaya/Kg (Rp)': jKg,
      'Solasi Aktif': solasiActive ? 'Ya' : 'Tidak',
      'Solasi Harga/Roll (Rp)': payload.packSolasiHarga || '',
      'Solasi Panjang/Roll (Meter)': payload.packSolasiPanjang || '',
      'Solasi Pemakaian/Kg (Meter)': payload.packSolasiPemakaian || '',
      'Solasi Biaya/Meter (Rp)': solasiBiayaMeter,
      'Solasi Biaya/Kg (Rp)': solasiBiayaKg,
      'Total Biaya Packing/Kg (Rp)': totalPacking,

      'Chem_Det_Active': payload.chemDetActive,
      'Chem_Det_Type': payload.chemDetType,
      'Chem_Det_Harga': payload.chemDetHargaBulk,
      'Chem_Det_Kapasitas': payload.chemDetKapBulk,
      'Chem_Det_Pemakaian': payload.chemDetPakai,
      'Chem_Sof_Active': payload.chemSofActive,
      'Chem_Sof_Type': payload.chemSofType,
      'Chem_Sof_Harga': payload.chemSofHargaBulk,
      'Chem_Sof_Kapasitas': payload.chemSofKapBulk,
      'Chem_Sof_Pemakaian': payload.chemSofPakai,
      'Chem_Par_Active': payload.chemParActive,
      'Chem_Par_Harga': payload.chemParHargaBulk,
      'Chem_Par_Kapasitas': payload.chemParKapBulk,
      'Chem_Par_Pemakaian': payload.chemParPakai,
      'Chem_Pel_Active': payload.chemPelActive,
      'Chem_Pel_Type': payload.chemPelType,
      'Chem_Pel_Harga': payload.chemPelHargaBulk,
      'Chem_Pel_Kapasitas': payload.chemPelKapBulk,
      'Chem_Pel_Pemakaian': payload.chemPelPakai,
      'Nota_Type': payload.notaType,
      'Nota_App_FeeType': payload.notaAppFeeType,
      'Nota_App_HargaBulan': payload.notaAppHargaBulan,
      'Nota_App_TrxBulan': payload.notaAppTrxBulan,
      'Nota_App_HargaTrx': payload.notaAppHargaTrx,
      'Nota_Thermal_Harga': payload.notaThermalHarga,
      'Nota_Manual_Harga': payload.notaManualHarga,
      'Nota_Manual_LembarTotal': payload.notaManualLbrTotal,
      'Nota_Manual_LembarTrx': payload.notaManualLbrTrx,
      'Nota_RataKg': payload.notaRataKg,

      // Alias untuk header packing yang sudah terlanjur ada pada sheet lama/screenshot.
      'Plastik PP': payload.packPPActive ? 'Ya' : 'Tidak',
      'Ukr PP': payload.packPPUkuran || payload.packPPSize || '',
      'Harga PP': payload.packPPHarga,
      'Isi PP': payload.packPPIsi,
      'Kap PP': payload.packPPKg,
      'PP Lembar': ppLembar,
      'Plastik Per Kg': ppKg,
      'Plastik HD': payload.packHDActive ? 'Ya' : 'Tidak',
      'Ukr HD': payload.packHDUkuran || payload.packHDSize || '',
      'Harga HD': payload.packHDHarga,
      'Isi HD': payload.packHDIsi,
      'Kap HD': payload.packHDKg,
      'HD Lembar': hdLembar,
      'HD Lembar Per Kg': hdLembar,
      'HD Per Kg': hdKg,
      'Plastik Jinjing': payload.packJinjingActive ? 'Ya' : 'Tidak',
      'Ukr Jinjing': payload.packJinjingUkuran || payload.packJinjingSize || '',
      'Harga Jinjing': payload.packJinjingHarga,
      'Isi Jinjing': payload.packJinjingIsi,
      'Kap Jinjing': payload.packJinjingKg,
      'Jinjing Lembar': jLembar,
      'Jinjing Per Kg': jKg,
      'Total Biaya Packing': totalPacking,
      'Total Biaya Packing Kg': totalPacking,
      'Harga Plastik': payload.packPPHarga,
      'Isi Plastik': payload.packPPIsi,
      'Ukr Plastik': payload.packPPUkuran || payload.packPPSize || '',
      'Isi Per Lembar': payload.packPPKg,
      'Plastik Per Lbr': ppLembar,
      'Packing Per Kg': ppKg,
      'Isi HD Per Lbr': payload.packHDKg,
      'HD Per Lbr': hdLembar,
      'Isi Jinjing Per Lbr': payload.packJinjingKg,
      'Jinjing Per Lbr': jLembar,

      // Alias lama agar kalau header lama masih ada tetap ikut terisi.
      'Packing_PP_Active': payload.packPPActive,
      'Packing_PP_Harga': payload.packPPHarga,
      'Packing_PP_Isi': payload.packPPIsi,
      'Packing_PP_Kg': payload.packPPKg,
      'Packing_HD_Active': payload.packHDActive,
      'Packing_HD_Harga': payload.packHDHarga,
      'Packing_HD_Isi': payload.packHDIsi,
      'Packing_HD_Kg': payload.packHDKg,
      'Packing_Jinjing_Active': payload.packJinjingActive,
      'Packing_Jinjing_Harga': payload.packJinjingHarga,
      'Packing_Jinjing_Isi': payload.packJinjingIsi,
      'Packing_Jinjing_Kg': payload.packJinjingKg
    };

    function getColLetter(colIndex) {
      let temp, letter = '';
      let col = colIndex + 1;
      while (col > 0) {
        temp = (col - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        col = (col - temp - 1) / 26;
      }
      return letter;
    }

    function resolveFormula(val, rowNum) {
      if (typeof val !== 'string' || !val.startsWith('=')) return val;
      return val
        .replace(/\{ROW\}/g, rowNum)
        .replace(/\{COL:(.*?)\}/g, function(match, colName) {
          return (colName in colMap) ? getColLetter(colMap[colName]) : 'A';
        });
    }

    let rowNum = targetRow;
    if (rowNum === -1) {
      rowNum = sheet.getLastRow() + 1;
      const newRow = new Array(sheet.getLastColumn()).fill('');
      if ('Timestamp' in colMap) newRow[colMap['Timestamp']] = timestamp;
      newRow[nameCol] = payload.namaOutlet;
      Object.keys(mapping).forEach(function(key) {
        if (key in colMap) newRow[colMap[key]] = resolveFormula(mapping[key], rowNum);
        else if (key === 'Setrika Per Jam' || key === 'Setrika Per Kg') zettWarnMissingHeader_(key, SHEET_HPP_1);
      });
      sheet.appendRow(newRow);
    } else {
      const updatedRow = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
      if ('Timestamp' in colMap) updatedRow[colMap['Timestamp']] = timestamp;
      Object.keys(mapping).forEach(function(key) {
        if (!(key in colMap)) {
          if (key === 'Setrika Per Jam' || key === 'Setrika Per Kg') zettWarnMissingHeader_(key, SHEET_HPP_1);
          return;
        }
        updatedRow[colMap[key]] = resolveFormula(mapping[key], rowNum);
      });
      sheet.getRange(rowNum, 1, 1, updatedRow.length).setValues([updatedRow]);
    }

    SpreadsheetApp.flush();
    clearServerCache();
    return { status: 'success', message: 'Data Struktur Biaya (HPP) berhasil tersimpan ke Struktur_Biaya_1.' };
  } catch (error) {
    throw new Error('Gagal menyimpan Struktur Biaya Single-Sheet: ' + error.toString());
  }
}
function getHPPDashboardData() {

  return {
    gas: 150000,
    listrik: 250000,
    air: 100000,
    packing: 50000,
    bahan: 175000,
    nota: 25000
  };

}
