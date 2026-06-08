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
      'TDL', 'Watt Cuci', 'kW Watt Cuci', 'Watt Kering', 'kW Watt Kering', 'Watt Pompa', 'kW Watt Pompa', 'Listrik Pompa Per Load', 'Watt Setrika', 'kW Watt Setrika',
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
      ...zettChemicalHeaders_(),
      ...zettNotaKasirHeaders_()
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
        if (!('Listrik Pompa Per Load' in colMap)) {
          const insertAfter = ('kW Watt Pompa' in colMap) ? colMap['kW Watt Pompa'] + 1 : sheetHPP1.getLastColumn();
          sheetHPP1.insertColumnAfter(insertAfter);
          sheetHPP1.getRange(1, insertAfter + 1)
            .setValue('Listrik Pompa Per Load')
            .setBackground('#0f172a')
            .setFontColor('#ffffff')
            .setFontWeight('bold')
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');
        }
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
      setFormula('Listrik Pompa Per Load', '=IFERROR(({Watt Pompa}/1000)*({Durasi Cuci}/60)*{TDL}/MAX({Mesin Cuci};1);0)');
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

      setVal('Deterjen Aktif', payload.chemDetActive ? 'Ya' : 'Tidak');
      setVal('Tipe Deterjen', payload.chemDetType);
      setVal('Harga Total Deterjen', payload.chemDetHargaBulk);
      setVal('Kap Deterjen Liter', payload.chemDetKapBulk);
      setFormula('Harga Deterjen Per Ltr', '=IFERROR({Harga Total Deterjen}/MAX({Kap Deterjen Liter};1);0)');
      setFormula('Harga Deterjen Per Ml', '=IFERROR({Harga Deterjen Per Ltr}/1000;0)');
      setVal('Pemakaian Deterjen Per Kg Ml', payload.chemDetPakai);
      setFormula('Estimasi Deterjen Per Load', '=IFERROR(IF({Deterjen Aktif}="Tidak";0;{Kap Cuci}*{Pemakaian Deterjen Per Kg Ml}*{Harga Deterjen Per Ml});0)');
      setFormula('Estimasi Deterjen Per Kg', '=IFERROR({Estimasi Deterjen Per Load}/MAX({Kap Cuci};1);0)');
      setVal('Pewangi Aktif', payload.chemParActive ? 'Ya' : 'Tidak');
      setVal('Harga Total Pewangi', payload.chemParHargaBulk);
      setVal('Kap Pewangi Liter', payload.chemParKapBulk);
      setFormula('Harga Pewangi Per Ltr', '=IFERROR({Harga Total Pewangi}/MAX({Kap Pewangi Liter};1);0)');
      setFormula('Harga Pewangi Per Ml', '=IFERROR({Harga Pewangi Per Ltr}/1000;0)');
      setVal('Pemakaian Pewangi Per Kg Ml', payload.chemParPakai);
      setFormula('Estimasi Pewangi Per Load', '=IFERROR(IF({Pewangi Aktif}="Tidak";0;{Kap Cuci}*{Pemakaian Pewangi Per Kg Ml}*{Harga Pewangi Per Ml});0)');
      setFormula('Estimasi Pewangi Per Kg', '=IFERROR({Estimasi Pewangi Per Load}/MAX({Kap Cuci};1);0)');
      setVal('Softener Aktif', payload.chemSofActive ? 'Ya' : 'Tidak');
      setVal('Tipe Softener', payload.chemSofType);
      setVal('Harga Total Softener', payload.chemSofHargaBulk);
      setVal('Kap Softener Liter', payload.chemSofKapBulk);
      setFormula('Harga Softener Per Ltr', '=IFERROR({Harga Total Softener}/MAX({Kap Softener Liter};1);0)');
      setFormula('Harga Softener Per Ml', '=IFERROR({Harga Softener Per Ltr}/1000;0)');
      setVal('Pemakaian Softener Per Kg Ml', payload.chemSofPakai);
      setFormula('Estimasi Softener Per Load', '=IFERROR(IF({Softener Aktif}="Tidak";0;{Kap Cuci}*{Pemakaian Softener Per Kg Ml}*{Harga Softener Per Ml});0)');
      setFormula('Estimasi Softener Per Kg', '=IFERROR({Estimasi Softener Per Load}/MAX({Kap Cuci};1);0)');
      setVal('Pelicin Setrika Aktif', payload.chemPelActive ? 'Ya' : 'Tidak');
      setVal('Tipe Pelicin Setrika', payload.chemPelType);
      setVal('Harga Total Pelicin Setrika', payload.chemPelHargaBulk);
      setVal('Kap Pelicin Setrika Liter', payload.chemPelKapBulk);
      setFormula('Harga Pelicin Setrika Per Ltr', '=IFERROR({Harga Total Pelicin Setrika}/MAX({Kap Pelicin Setrika Liter};1);0)');
      setFormula('Harga Pelicin Setrika Per Ml', '=IFERROR({Harga Pelicin Setrika Per Ltr}/1000;0)');
      setVal('Pemakaian Pelicin Setrika Per Kg Ml', payload.chemPelPakai);
      setFormula('Estimasi Pelicin Setrika Per Load', '=IFERROR(IF({Pelicin Setrika Aktif}="Tidak";0;{Kap Cuci}*{Pemakaian Pelicin Setrika Per Kg Ml}*{Harga Pelicin Setrika Per Ml});0)');
      setFormula('Estimasi Pelicin Setrika Per Kg', '=IFERROR({Estimasi Pelicin Setrika Per Load}/MAX({Kap Cuci};1);0)');
      setFormula('Chemical Cuci Per Load', '=IFERROR({Estimasi Deterjen Per Load}+{Estimasi Softener Per Load}+{Estimasi Pewangi Per Load}+{Estimasi Pelicin Setrika Per Load};0)');
      setFormula('Chemical Cuci Per Kg', '=IFERROR({Chemical Cuci Per Load}/MAX({Kap Cuci};1);0)');

      setFormula('Admin Per Order', '=IFERROR({Gaji Admin Bulanan}/MAX({Hari Kerja Admin Bulanan}*{Target Order Admin Per Hari};1);0)');
      setVal('Harga Buku Nota', payload.notaManualHarga);
      setVal('Isi Nota', payload.notaManualLbrTotal);
      setVal('Lembar Nota Per Order', payload.notaManualLbrTrx);
      setFormula('Nota Per Order', '=IFERROR(({Harga Buku Nota}/MAX({Isi Nota};1))*MAX({Lembar Nota Per Order};1);0)');
      setVal('Biaya Kasir Bulanan', payload.notaAppHargaBulan);
      setVal('Target Order Kasir Per Hari', payload.notaAppTrxBulan);
      setFormula('Kasir Per Order', '=IFERROR({Biaya Kasir Bulanan}/MAX({Hari Kerja Kasir Bulanan}*{Target Order Kasir Per Hari};1);0)');
      setFormula('Admin Nota Kasir Per Order', '=IFERROR({Admin Per Order}+{Nota Per Order}+{Kasir Per Order};0)');
      setFormula('Admin Nota Kasir Per Load', '=IFERROR({Admin Nota Kasir Per Order};0)');
      setFormula('Admin Nota Kasir Per Kg', '=IFERROR({Admin Nota Kasir Per Load}/MAX({Kap Cuci};1);0)');
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
    const pickPayload = function(keys) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') return payload[key];
      }
      return '';
    };
    const kapGas = pickPayload(['gasKapasitas', 'kapGas', 'Kapasitas Gas LPG', 'Kap Gas']);
    const hargaGas = zettToNumber_(pickPayload(['gasHarga', 'hargaGas', 'Harga Per Tabung Gas', 'Harga Gas']));
    const jamGas = zettToNumber_(pickPayload(['gasJam', 'jamGas', 'Estimasi Pemakaian Gas Jam', 'Jam Gas']));
    const menitGas = zettToNumber_(pickPayload(['gasMenit', 'menitGas', 'Konversi Waktu Gas', 'Menit Gas']));
    const estimasiLoadGas = zettToNumber_(pickPayload(['estimasiLoadGas', 'Estimasi Load Pemakaian Gas', 'Estimasi Load Gas']));
    const estimasiBiayaGas = zettToNumber_(pickPayload(['estimasiBiayaGas', 'gasPerLoad', 'HPP Gas Per Load', 'Gas Per Load', 'Estimasi Biaya Gas']));
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
    const gasPerJamValue = zettToNumber_(pickPayload(['gasPerJam', 'HPP Gas Per Jam', 'Gas Per Jam'])) || (jamGas > 0 ? hargaGas / jamGas : 0);
    const steamIronRelevant = zettGasIronRelevant_(kategoriLaundry, tipeSetrika);
    const setrikaPerJamValue = steamIronRelevant ? gasPerJamValue : '';
    const setrikaPerKgValue = steamIronRelevant && kapSetrika > 0 ? setrikaPerJamValue / kapSetrika : '';
    const dryerGasRelevant = zettIsSelfServiceCategory_(kategoriLaundry) || zettIsHybridCategory_(kategoriLaundry) || (zettIsDropOffCategory_(kategoriLaundry) && pakaiMesinPengering);
    const gasPerKgValue = dryerGasRelevant
      ? (zettToNumber_(pickPayload(['gasPerKg', 'Gas Per Kg'])) || (kapKering > 0 ? estimasiBiayaGas / kapKering : ''))
      : '';
    const values = {
      'Nama Outlet': String(payload.namaOutlet || '').trim(),
      'Kap Gas': kapGas,
      'Harga Gas': hargaGas,
      'Jam Gas': jamGas,
      'Menit Gas': menitGas,
      'Estimasi Load Gas': estimasiLoadGas,
      'Estimasi Biaya Gas': estimasiBiayaGas,
      'Gas Per Jam': gasPerJamValue,
      'Gas Per Menit': zettToNumber_(pickPayload(['gasPerMenit', 'HPP Gas Per Menit', 'Gas Per Menit'])) || (menitGas > 0 ? hargaGas / menitGas : 0),
      'Gas Per Load': estimasiBiayaGas,
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
    syncMasterKapasitasToBEPFixed_({ outletName: payload.namaOutlet });

    SpreadsheetApp.flush();
    clearServerCache(); // <--- Reset server cache after update
    return { status: 'success', message: 'Data Kapasitas berhasil disimpan ke Cloud!' };
  } catch (error) {
    throw new Error("Gagal menyimpan data Kapasitas: " + error.toString());
  }
}

/* =====================================================================
 * BEP FIXED COST DATA STORE
 * Sheet: BEP_Fixed. Semua mapping berdasarkan nama header.
 * ===================================================================== */
const SHEET_NAME_BEP_FIXED = 'BEP_Fixed';
const BEP_FIXED_HEADERS_ = [
  'Timestamp',
  'Nama Outlet',
  'Status Sewa',
  'Biaya Sewa Tahunan',
  'Biaya Sewa Bulanan',
  'Detail Gaji JSON',
  'Total Gaji Bulanan',
  'Detail Mesin JSON',
  'Total Depresiasi Mesin Bulanan',
  'Total Cadangan Perawatan Mesin Bulanan',
  'Total Biaya Mesin Bulanan',
  'Provider Internet',
  'Biaya Internet Bulanan',
  'Detail Lain Lain JSON',
  'Total Lain Lain Bulanan',
  'Total Fixed Cost Bulanan',
  'Catatan'
];
const BEP_FIXED_OPERATIONAL_HEADERS_ = [
  'Kategori Laundry',
  'Jam Buka',
  'Jam Tutup',
  'Tutup Hari Minggu',
  'Durasi Operasional',
  'Target Okupansi Cuci',
  'Target Okupansi Kering',
  'Target Okupansi Setrika',
  'Estimasi Cuci',
  'Estimasi Kering',
  'Estimasi Setrika',
  'Mesin Cuci',
  'Mesin Pengering',
  'Kap Cuci',
  'Kap Kering',
  'Durasi Cuci',
  'Durasi Kering',
  'Alat Setrika',
  'Kap Setrika',
  'Durasi Setrika',
  'Tipe Mesin Cuci',
  'Tipe Mesin Pengering',
  'Tipe Setrika',
  'Pakai Pengering',
  'Metode Pengeringan'
];

function normalizeOutletName_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getHeaderMapByName_(sheet) {
  const map = {};
  if (!sheet || sheet.getLastColumn() < 1) return map;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((header, index) => {
    const key = String(header || '').trim();
    if (!key) return;
    map[key] = index + 1;
    map[key.toLowerCase()] = index + 1;
  });
  return map;
}

function ensureBEPFixedSheet_() {
  const ss = _getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_BEP_FIXED);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME_BEP_FIXED);

  const requiredHeaders = BEP_FIXED_HEADERS_.concat(BEP_FIXED_OPERATIONAL_HEADERS_);
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  let map = getHeaderMapByName_(sheet);
  const missing = requiredHeaders.filter(header => !map[header] && !map[header.toLowerCase()]);
  if (missing.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
    map = getHeaderMapByName_(sheet);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureBEPFixedHeaders_() {
  return ensureBEPFixedSheet_();
}

function isNonEmptyBEPValue_(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function pickBEPRowValue_(row, map, headers) {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const idx = Object.prototype.hasOwnProperty.call(map, header) ? map[header] : null;
    if (idx === null) continue;
    const value = row[idx];
    if (isNonEmptyBEPValue_(value)) return value;
  }
  return '';
}

function buildBEPFixedOperationalValuesFromMaster_(row, map) {
  const name = pickBEPRowValue_(row, map, ['Nama Outlet', 'Nama Cabang/Outlet']);
  return {
    'Nama Outlet': name,
    'Kategori Laundry': pickBEPRowValue_(row, map, ['Kategori Laundry']),
    'Jam Buka': pickBEPRowValue_(row, map, ['Jam Buka']),
    'Jam Tutup': pickBEPRowValue_(row, map, ['Jam Tutup']),
    'Tutup Hari Minggu': pickBEPRowValue_(row, map, ['Tutup Hari Minggu']),
    'Durasi Operasional': pickBEPRowValue_(row, map, ['Durasi Operasional']),
    'Target Okupansi Cuci': pickBEPRowValue_(row, map, ['Target Okupansi Cuci']),
    'Target Okupansi Kering': pickBEPRowValue_(row, map, ['Target Okupansi Kering']),
    'Target Okupansi Setrika': pickBEPRowValue_(row, map, ['Target Okupansi Setrika']),
    'Estimasi Cuci': pickBEPRowValue_(row, map, ['Estimasi Cuci']),
    'Estimasi Kering': pickBEPRowValue_(row, map, ['Estimasi Kering']),
    'Estimasi Setrika': pickBEPRowValue_(row, map, ['Estimasi Setrika']),
    'Mesin Cuci': pickBEPRowValue_(row, map, ['Mesin Cuci']),
    'Mesin Pengering': pickBEPRowValue_(row, map, ['Mesin Pengering']),
    'Kap Cuci': pickBEPRowValue_(row, map, ['Kap Cuci']),
    'Kap Kering': pickBEPRowValue_(row, map, ['Kap Kering']),
    'Durasi Cuci': pickBEPRowValue_(row, map, ['Durasi Cuci']),
    'Durasi Kering': pickBEPRowValue_(row, map, ['Durasi Kering']),
    'Alat Setrika': pickBEPRowValue_(row, map, ['Alat Setrika']),
    'Kap Setrika': pickBEPRowValue_(row, map, ['Kap Setrika']),
    'Durasi Setrika': pickBEPRowValue_(row, map, ['Durasi Setrika']),
    'Tipe Mesin Cuci': pickBEPRowValue_(row, map, ['Tipe Mesin Cuci']),
    'Tipe Mesin Pengering': pickBEPRowValue_(row, map, ['Tipe Mesin Pengering']),
    'Tipe Setrika': pickBEPRowValue_(row, map, ['Tipe Setrika']),
    'Pakai Pengering': pickBEPRowValue_(row, map, ['Pakai Pengering']),
    'Metode Pengeringan': pickBEPRowValue_(row, map, ['Metode Pengeringan'])
  };
}

function syncMasterKapasitasToBEPFixed_(options) {
  options = options || {};
  const targetOnly = normalizeOutletName_(options.outletName || options.namaOutlet || '');
  const ss = _getSpreadsheet();
  const source = ss.getSheetByName(SHEET_NAME_KAPASITAS);
  if (!source || source.getLastRow() < 2) return { inserted: 0, updated: 0, skipped: 0 };

  const target = ensureBEPFixedHeaders_();
  const sourceMap = getHeaderMap(source);
  const sourceNameCol = ('Nama Outlet' in sourceMap) ? sourceMap['Nama Outlet'] : (('Nama Cabang/Outlet' in sourceMap) ? sourceMap['Nama Cabang/Outlet'] : null);
  if (sourceNameCol === null) return { inserted: 0, updated: 0, skipped: 0 };

  const sourceRows = source.getRange(2, 1, source.getLastRow() - 1, source.getLastColumn()).getDisplayValues();
  const masterByOutlet = {};
  sourceRows.forEach(function(row) {
    const rawName = row[sourceNameCol];
    const normalized = normalizeOutletName_(rawName);
    if (!normalized || normalized.indexOf('nama outlet') !== -1 || normalized.indexOf('nama cabang') !== -1) return;
    if (targetOnly && normalized !== targetOnly) return;
    masterByOutlet[normalized] = buildBEPFixedOperationalValuesFromMaster_(row, sourceMap);
  });

  const targetKeys = Object.keys(masterByOutlet);
  if (!targetKeys.length) return { inserted: 0, updated: 0, skipped: 0 };

  const map = getHeaderMapByName_(target);
  const outletCol = map['Nama Outlet'] || map['nama outlet'];
  if (!outletCol) throw new Error('Header Nama Outlet tidak ditemukan di BEP_Fixed.');

  const lastCol = target.getLastColumn();
  const targetRows = target.getLastRow() > 1
    ? target.getRange(2, 1, target.getLastRow() - 1, lastCol).getValues()
    : [];
  const rowByOutlet = {};
  targetRows.forEach(function(row, index) {
    const normalized = normalizeOutletName_(row[outletCol - 1]);
    if (normalized && rowByOutlet[normalized] === undefined) rowByOutlet[normalized] = index;
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  const newRows = [];
  const changedExistingIndexes = [];

  targetKeys.forEach(function(key) {
    const values = masterByOutlet[key];
    if (!values || !values['Nama Outlet']) {
      skipped++;
      return;
    }

    const existingIndex = rowByOutlet[key];
    const row = existingIndex !== undefined ? targetRows[existingIndex] : new Array(lastCol).fill('');
    let changed = false;

    if (existingIndex === undefined) {
      if (map['Timestamp']) row[map['Timestamp'] - 1] = now;
      row[outletCol - 1] = values['Nama Outlet'];
      changed = true;
    } else if (!isNonEmptyBEPValue_(row[outletCol - 1])) {
      row[outletCol - 1] = values['Nama Outlet'];
      changed = true;
    }

    BEP_FIXED_OPERATIONAL_HEADERS_.forEach(function(header) {
      const col = map[header] || map[String(header).toLowerCase()];
      if (!col) return;
      const value = values[header];
      if (!isNonEmptyBEPValue_(value)) return;
      if (row[col - 1] !== value) {
        row[col - 1] = value;
        changed = true;
      }
    });

    if (existingIndex !== undefined) {
      if (changed) {
        targetRows[existingIndex] = row;
        changedExistingIndexes.push(existingIndex);
        updated++;
      } else {
        skipped++;
      }
    } else {
      newRows.push(row);
      rowByOutlet[key] = targetRows.length + newRows.length - 1;
      inserted++;
    }
  });

  const operationalCols = BEP_FIXED_OPERATIONAL_HEADERS_
    .map(function(header) { return map[header] || map[String(header).toLowerCase()] || 0; })
    .filter(function(col) { return col > 0; })
    .sort(function(a, b) { return a - b; });
  const colGroups = operationalCols.reduce(function(groups, col) {
    const last = groups[groups.length - 1];
    if (last && col === last.end + 1) last.end = col;
    else groups.push({ start: col, end: col });
    return groups;
  }, []);

  changedExistingIndexes.forEach(function(existingIndex) {
    const sheetRow = existingIndex + 2;
    const row = targetRows[existingIndex];
    colGroups.forEach(function(group) {
      const width = group.end - group.start + 1;
      target.getRange(sheetRow, group.start, 1, width).setValues([row.slice(group.start - 1, group.end)]);
    });
  });
  if (newRows.length) target.getRange(target.getLastRow() + 1, 1, newRows.length, lastCol).setValues(newRows);
  if (inserted || updated) {
    SpreadsheetApp.flush();
    try { clearServerCache(); } catch (error) {}
  }
  return { inserted: inserted, updated: updated, skipped: skipped };
}

function parseNumberSafe_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  let raw = String(value).trim().replace(/[^\d,.-]/g, '');
  if (!raw) return 0;
  if (raw.indexOf(',') >= 0 && raw.indexOf('.') >= 0) raw = raw.replace(/\./g, '').replace(',', '.');
  else if (raw.indexOf(',') >= 0) raw = raw.replace(',', '.');
  else raw = raw.replace(/\./g, '');
  const parsed = Number(raw);
  return isFinite(parsed) ? parsed : 0;
}

function toJsonSafe_(value) {
  try {
    if (typeof value === 'string') {
      JSON.parse(value || '[]');
      return value || '[]';
    }
    return JSON.stringify(Array.isArray(value) ? value : []);
  } catch (error) {
    return '[]';
  }
}

function parseJsonSafe_(value, fallback) {
  try {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function normalizeBepMachineText_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildBepMachineKey_(outletName, jenisMesin, tipeMesin) {
  return [
    normalizeBepMachineText_(outletName),
    normalizeBepMachineText_(jenisMesin),
    normalizeBepMachineText_(tipeMesin)
  ].join('|');
}

function isBepExplicitNoValue_(value) {
  const text = normalizeBepMachineText_(value);
  return text === 'tidak' || text === 'false' || text === '0' || text === 'no' || text === 'jemur';
}

function buildBepMachineRowsFromOperational_(data, savedMachines) {
  data = data || {};
  savedMachines = Array.isArray(savedMachines) ? savedMachines : [];
  const outletName = data.namaOutlet || data['Nama Outlet'] || data.outletName || '';
  const category = data.kategoriLaundry || data['Kategori Laundry'] || '';
  const savedByKey = {};
  const savedByLegacyName = {};

  savedMachines.forEach(function(item) {
    item = item || {};
    const jenis = item.jenisMesin || item.name || item.namaMesin || '';
    const tipe = item.tipeMesin || '';
    const key = item.machineKey || buildBepMachineKey_(outletName, jenis, tipe);
    if (key) savedByKey[key] = item;
    if (!item.machineKey && jenis) savedByLegacyName[normalizeBepMachineText_(jenis)] = item;
  });

  function pickFinance(row) {
    row = row || {};
    return {
      hargaPerUnit: Math.max(0, parseNumberSafe_(row.hargaPerUnit || row.purchasePrice || row.hargaBeliPerUnit)),
      residuPerUnit: Math.max(0, parseNumberSafe_(row.residuPerUnit || row.residualValue || row.nilaiResiduPerUnit)),
      umurEkonomisTahun: Math.max(0, parseNumberSafe_(row.umurEkonomisTahun || row.usefulLifeYears || row.umurManfaatTahun)),
      rawatPerTahunPerUnit: Math.max(0, parseNumberSafe_(row.rawatPerTahunPerUnit || row.annualMaintenance || row.estimasiPerawatanTahunan))
    };
  }

  function makeMachine(jenisMesin, tipeMesin, jumlahUnit, status) {
    jumlahUnit = Math.max(0, parseNumberSafe_(jumlahUnit));
    jenisMesin = String(jenisMesin || '').trim();
    tipeMesin = String(tipeMesin || '').trim();
    if (!jenisMesin || jumlahUnit <= 0) return null;

    const machineKey = buildBepMachineKey_(outletName, jenisMesin, tipeMesin);
    const saved = savedByKey[machineKey] || savedByLegacyName[normalizeBepMachineText_(jenisMesin)] || {};
    const finance = pickFinance(saved);
    const umurEkonomisBulan = finance.umurEkonomisTahun * 12;
    const depreciableAmount = Math.max(finance.hargaPerUnit - finance.residuPerUnit, 0);
    const depresiasiPerBulan = umurEkonomisBulan > 0 ? (depreciableAmount / umurEkonomisBulan) * jumlahUnit : 0;
    const maintenancePerBulan = (finance.rawatPerTahunPerUnit * jumlahUnit) / 12;
    const totalBiayaMesinPerBulan = depresiasiPerBulan + maintenancePerBulan;

    return {
      machineKey: machineKey,
      jenisMesin: jenisMesin,
      tipeMesin: tipeMesin,
      jumlahUnit: jumlahUnit,
      status: status || 'Aktif',
      hargaPerUnit: finance.hargaPerUnit,
      residuPerUnit: finance.residuPerUnit,
      umurEkonomisTahun: finance.umurEkonomisTahun,
      umurEkonomisBulan: umurEkonomisBulan,
      rawatPerTahunPerUnit: finance.rawatPerTahunPerUnit,
      depresiasiPerBulan: depresiasiPerBulan,
      maintenancePerBulan: maintenancePerBulan,
      totalBiayaMesinPerBulan: totalBiayaMesinPerBulan,
      source: 'Profil Operasional',
      active: true,
      name: jenisMesin,
      units: jumlahUnit,
      purchasePrice: finance.hargaPerUnit,
      residualValue: finance.residuPerUnit,
      usefulLifeYears: finance.umurEkonomisTahun,
      annualMaintenance: finance.rawatPerTahunPerUnit,
      depreciationMonthly: depresiasiPerBulan,
      maintenanceMonthly: maintenancePerBulan,
      totalMonthly: totalBiayaMesinPerBulan
    };
  }

  const rows = [];
  const cuci = makeMachine('Mesin Cuci', data.tipeMesinCuci || data['Tipe Mesin Cuci'] || '', data.mesinCuci || data['Mesin Cuci'], 'Aktif');
  if (cuci) rows.push(cuci);

  const pakaiPengering = data.pakaiPengering || data['Pakai Pengering'];
  const metodePengeringan = data.metodePengeringan || data['Metode Pengeringan'];
  const dryerEnabled = !isBepExplicitNoValue_(pakaiPengering) && !isBepExplicitNoValue_(metodePengeringan);
  const pengering = dryerEnabled ? makeMachine('Mesin Pengering / Dryer', data.tipeMesinPengering || data['Tipe Mesin Pengering'] || '', data.mesinPengering || data['Mesin Pengering'], 'Aktif') : null;
  if (pengering) rows.push(pengering);

  const setrikaUnits = data.alatSetrika || data['Alat Setrika'];
  const tipeSetrika = data.tipeSetrika || data['Tipe Setrika'] || '';
  const setrikaKind = normalizeBepMachineText_(tipeSetrika).indexOf('listrik') >= 0 ? 'Setrika Listrik' : 'Setrika Uap Boiler';
  const setrika = makeMachine(setrikaKind, tipeSetrika || (setrikaKind === 'Setrika Listrik' ? 'Listrik' : 'Uap Boiler'), setrikaUnits, 'Aktif');
  if (setrika) rows.push(setrika);

  const activeKeys = rows.reduce(function(acc, row) {
    acc[row.machineKey] = true;
    return acc;
  }, {});
  savedMachines.forEach(function(item) {
    item = item || {};
    const jenis = item.jenisMesin || item.name || item.namaMesin || '';
    const tipe = item.tipeMesin || '';
    const key = item.machineKey || buildBepMachineKey_(outletName, jenis, tipe);
    if (!key || activeKeys[key]) return;
    const finance = pickFinance(item);
    rows.push({
      machineKey: key,
      jenisMesin: jenis || 'Mesin nonaktif',
      tipeMesin: tipe,
      jumlahUnit: 0,
      status: 'Nonaktif / tidak ada di Profil Operasional',
      hargaPerUnit: finance.hargaPerUnit,
      residuPerUnit: finance.residuPerUnit,
      umurEkonomisTahun: finance.umurEkonomisTahun,
      umurEkonomisBulan: finance.umurEkonomisTahun * 12,
      rawatPerTahunPerUnit: finance.rawatPerTahunPerUnit,
      depresiasiPerBulan: 0,
      maintenancePerBulan: 0,
      totalBiayaMesinPerBulan: 0,
      source: 'BEP_Fixed arsip',
      active: false,
      name: jenis || 'Mesin nonaktif',
      units: 0,
      purchasePrice: finance.hargaPerUnit,
      residualValue: finance.residuPerUnit,
      usefulLifeYears: finance.umurEkonomisTahun,
      annualMaintenance: finance.rawatPerTahunPerUnit,
      depreciationMonthly: 0,
      maintenanceMonthly: 0,
      totalMonthly: 0
    });
  });

  return {
    outletName: outletName,
    category: category,
    machines: rows,
    totalDepresiasiPerBulan: rows.reduce(function(sum, item) { return sum + parseNumberSafe_(item.depresiasiPerBulan); }, 0),
    totalMaintenancePerBulan: rows.reduce(function(sum, item) { return sum + parseNumberSafe_(item.maintenancePerBulan); }, 0),
    totalBiayaMesinPerBulan: rows.reduce(function(sum, item) { return sum + parseNumberSafe_(item.totalBiayaMesinPerBulan); }, 0)
  };
}

function normalizeBEPFixedPayload_(payload) {
  payload = payload || {};
  const detailGaji = parseJsonSafe_(payload.detailGaji, Array.isArray(payload.detailGaji) ? payload.detailGaji : []);
  const detailMesin = parseJsonSafe_(payload.detailMesin, Array.isArray(payload.detailMesin) ? payload.detailMesin : []);
  const detailLain = parseJsonSafe_(payload.detailLainLain, Array.isArray(payload.detailLainLain) ? payload.detailLainLain : []);

  const cleanSalary = detailGaji.map(item => {
    const count = Math.max(0, parseNumberSafe_(item && (item.count || item.jumlahOrang)));
    const salary = Math.max(0, parseNumberSafe_(item && (item.salaryPerPerson || item.gajiPerOrang)));
    return {
      name: String((item && (item.name || item.role || item.nama)) || '').trim(),
      count: count,
      salaryPerPerson: salary,
      total: count * salary
    };
  });

  const cleanMachine = detailMesin.map(item => {
    item = item || {};
    const name = String(item.jenisMesin || item.name || item.namaMesin || '').trim();
    const type = String(item.tipeMesin || '').trim();
    const units = Math.max(0, parseNumberSafe_(item.jumlahUnit || item.units));
    const purchase = Math.max(0, parseNumberSafe_(item.hargaPerUnit || item.purchasePrice || item.hargaBeliPerUnit));
    const residual = Math.max(0, parseNumberSafe_(item.residuPerUnit || item.residualValue || item.nilaiResiduPerUnit));
    const years = Math.max(0, parseNumberSafe_(item.umurEkonomisTahun || item.usefulLifeYears || item.umurManfaatTahun));
    const annualMaintenance = Math.max(0, parseNumberSafe_(item.rawatPerTahunPerUnit || item.annualMaintenance || item.estimasiPerawatanTahunan));
    const depreciation = years > 0 ? Math.max(0, ((purchase - residual) * units) / (years * 12)) : 0;
    const maintenanceMonthly = (annualMaintenance * units) / 12;
    return {
      machineKey: item.machineKey || buildBepMachineKey_(payload.namaOutlet || payload['Nama Outlet'] || '', name, type),
      jenisMesin: name,
      tipeMesin: type,
      jumlahUnit: units,
      status: item.status || (units > 0 ? 'Aktif' : 'Nonaktif'),
      source: item.source || 'Profil Operasional',
      active: item.active !== false && units > 0,
      hargaPerUnit: purchase,
      residuPerUnit: residual,
      umurEkonomisTahun: years,
      umurEkonomisBulan: years * 12,
      rawatPerTahunPerUnit: annualMaintenance,
      depresiasiPerBulan: depreciation,
      maintenancePerBulan: maintenanceMonthly,
      totalBiayaMesinPerBulan: depreciation + maintenanceMonthly,
      name: name,
      units: units,
      purchasePrice: purchase,
      residualValue: residual,
      usefulLifeYears: years,
      annualMaintenance: annualMaintenance,
      depreciationMonthly: depreciation,
      maintenanceMonthly: maintenanceMonthly,
      totalMonthly: depreciation + maintenanceMonthly
    };
  });

  const cleanOther = detailLain.map(item => ({
    name: String((item && (item.name || item.namaBiaya)) || '').trim(),
    monthlyAmount: Math.max(0, parseNumberSafe_(item && (item.monthlyAmount || item.nominalBulanan))),
    note: String((item && (item.note || item.catatan)) || '').trim()
  }));

  const totalGaji = cleanSalary.reduce((sum, item) => sum + parseNumberSafe_(item.total), 0);
  const totalDepresiasi = cleanMachine.reduce((sum, item) => sum + parseNumberSafe_(item.depreciationMonthly), 0);
  const totalPerawatan = cleanMachine.reduce((sum, item) => sum + parseNumberSafe_(item.maintenanceMonthly), 0);
  const totalMesin = cleanMachine.reduce((sum, item) => sum + parseNumberSafe_(item.totalMonthly), 0);
  const totalLain = cleanOther.reduce((sum, item) => sum + parseNumberSafe_(item.monthlyAmount), 0);
  const sewaTahunan = Math.max(0, parseNumberSafe_(payload.biayaSewaTahunan));
  const sewaBulanan = Math.max(0, parseNumberSafe_(payload.biayaSewaBulanan)) || (sewaTahunan / 12);
  const internet = Math.max(0, parseNumberSafe_(payload.biayaInternetBulanan));
  const totalFixed = sewaBulanan + totalGaji + totalMesin + internet + totalLain;

  return {
    namaOutlet: String(payload.namaOutlet || payload['Nama Outlet'] || '').trim(),
    statusSewa: String(payload.statusSewa || 'Sewa').trim() || 'Sewa',
    biayaSewaTahunan: sewaTahunan,
    biayaSewaBulanan: sewaBulanan,
    detailGaji: cleanSalary,
    totalGajiBulanan: totalGaji,
    detailMesin: cleanMachine,
    totalDepresiasiMesinBulanan: totalDepresiasi,
    totalCadanganPerawatanMesinBulanan: totalPerawatan,
    totalBiayaMesinBulanan: totalMesin,
    providerInternet: String(payload.providerInternet || '').trim(),
    biayaInternetBulanan: internet,
    detailLainLain: cleanOther,
    totalLainLainBulanan: totalLain,
    totalFixedCostBulanan: totalFixed,
    catatan: String(payload.catatan || payload.catatanSewa || '').trim(),
    kategoriLaundry: String(payload.kategoriLaundry || payload['Kategori Laundry'] || '').trim(),
    jamBuka: payload.jamBuka || payload['Jam Buka'] || '',
    jamTutup: payload.jamTutup || payload['Jam Tutup'] || '',
    tutupHariMinggu: payload.tutupHariMinggu || payload.tutupMinggu || payload['Tutup Hari Minggu'] || '',
    durasiOperasional: payload.durasiOperasional || payload['Durasi Operasional'] || '',
    targetOkupansiCuci: payload.targetOkupansiCuci || payload['Target Okupansi Cuci'] || '',
    targetOkupansiKering: payload.targetOkupansiKering || payload['Target Okupansi Kering'] || '',
    targetOkupansiSetrika: payload.targetOkupansiSetrika || payload['Target Okupansi Setrika'] || '',
    estimasiCuci: payload.estimasiCuci || payload['Estimasi Cuci'] || '',
    estimasiKering: payload.estimasiKering || payload['Estimasi Kering'] || '',
    estimasiSetrika: payload.estimasiSetrika || payload['Estimasi Setrika'] || '',
    mesinCuci: payload.mesinCuci || payload['Mesin Cuci'] || '',
    mesinPengering: payload.mesinPengering || payload['Mesin Pengering'] || '',
    kapCuci: payload.kapCuci || payload['Kap Cuci'] || '',
    kapKering: payload.kapKering || payload['Kap Kering'] || '',
    durasiCuci: payload.durasiCuci || payload['Durasi Cuci'] || '',
    durasiKering: payload.durasiKering || payload['Durasi Kering'] || '',
    alatSetrika: payload.alatSetrika || payload['Alat Setrika'] || '',
    kapSetrika: payload.kapSetrika || payload['Kap Setrika'] || '',
    durasiSetrika: payload.durasiSetrika || payload['Durasi Setrika'] || '',
    tipeMesinCuci: payload.tipeMesinCuci || payload['Tipe Mesin Cuci'] || '',
    tipeMesinPengering: payload.tipeMesinPengering || payload['Tipe Mesin Pengering'] || '',
    tipeSetrika: payload.tipeSetrika || payload.tipeSetrikaUtama || payload['Tipe Setrika'] || '',
    pakaiPengering: payload.pakaiPengering || payload['Pakai Pengering'] || '',
    metodePengeringan: payload.metodePengeringan || payload['Metode Pengeringan'] || ''
  };
}

function upsertBEPFixedByOutlet_(payload) {
  const sheet = ensureBEPFixedSheet_();
  const data = normalizeBEPFixedPayload_(payload);
  if (!data.namaOutlet) throw new Error('Nama Outlet wajib diisi.');

  const map = getHeaderMapByName_(sheet);
  const outletCol = map['Nama Outlet'] || map['nama outlet'];
  if (!outletCol) throw new Error('Header Nama Outlet tidak ditemukan di BEP_Fixed.');

  const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  let targetRow = 0;
  if (sheet.getLastRow() > 1) {
    const names = sheet.getRange(2, outletCol, sheet.getLastRow() - 1, 1).getDisplayValues();
    const targetName = normalizeOutletName_(data.namaOutlet);
    for (let i = 0; i < names.length; i++) {
      if (normalizeOutletName_(names[i][0]) === targetName) {
        targetRow = i + 2;
        break;
      }
    }
  }

  const row = targetRow ? sheet.getRange(targetRow, 1, 1, sheet.getLastColumn()).getValues()[0] : new Array(sheet.getLastColumn()).fill('');
  const setVal = (header, value) => {
    const col = map[header] || map[String(header).toLowerCase()];
    if (col) row[col - 1] = value;
  };
  const setValIfNotBlank = (header, value) => {
    if (value === null || value === undefined || String(value).trim() === '') return;
    setVal(header, value);
  };

  setVal('Timestamp', now);
  setVal('Nama Outlet', data.namaOutlet);
  setVal('Status Sewa', data.statusSewa);
  setVal('Biaya Sewa Tahunan', data.biayaSewaTahunan);
  setVal('Biaya Sewa Bulanan', data.biayaSewaBulanan);
  setVal('Detail Gaji JSON', toJsonSafe_(data.detailGaji));
  setVal('Total Gaji Bulanan', data.totalGajiBulanan);
  setVal('Detail Mesin JSON', toJsonSafe_(data.detailMesin));
  setVal('Total Depresiasi Mesin Bulanan', data.totalDepresiasiMesinBulanan);
  setVal('Total Cadangan Perawatan Mesin Bulanan', data.totalCadanganPerawatanMesinBulanan);
  setVal('Total Biaya Mesin Bulanan', data.totalBiayaMesinBulanan);
  setVal('Provider Internet', data.providerInternet);
  setVal('Biaya Internet Bulanan', data.biayaInternetBulanan);
  setVal('Detail Lain Lain JSON', toJsonSafe_(data.detailLainLain));
  setVal('Total Lain Lain Bulanan', data.totalLainLainBulanan);
  setVal('Total Fixed Cost Bulanan', data.totalFixedCostBulanan);
  setVal('Catatan', data.catatan);
  setValIfNotBlank('Kategori Laundry', data.kategoriLaundry);
  setValIfNotBlank('Jam Buka', data.jamBuka);
  setValIfNotBlank('Jam Tutup', data.jamTutup);
  setValIfNotBlank('Tutup Hari Minggu', data.tutupHariMinggu);
  setValIfNotBlank('Durasi Operasional', data.durasiOperasional);
  setValIfNotBlank('Target Okupansi Cuci', data.targetOkupansiCuci);
  setValIfNotBlank('Target Okupansi Kering', data.targetOkupansiKering);
  setValIfNotBlank('Target Okupansi Setrika', data.targetOkupansiSetrika);
  setValIfNotBlank('Estimasi Cuci', data.estimasiCuci);
  setValIfNotBlank('Estimasi Kering', data.estimasiKering);
  setValIfNotBlank('Estimasi Setrika', data.estimasiSetrika);
  setValIfNotBlank('Mesin Cuci', data.mesinCuci);
  setValIfNotBlank('Mesin Pengering', data.mesinPengering);
  setValIfNotBlank('Kap Cuci', data.kapCuci);
  setValIfNotBlank('Kap Kering', data.kapKering);
  setValIfNotBlank('Durasi Cuci', data.durasiCuci);
  setValIfNotBlank('Durasi Kering', data.durasiKering);
  setValIfNotBlank('Alat Setrika', data.alatSetrika);
  setValIfNotBlank('Kap Setrika', data.kapSetrika);
  setValIfNotBlank('Durasi Setrika', data.durasiSetrika);
  setValIfNotBlank('Tipe Mesin Cuci', data.tipeMesinCuci);
  setValIfNotBlank('Tipe Mesin Pengering', data.tipeMesinPengering);
  setValIfNotBlank('Tipe Setrika', data.tipeSetrika);
  setValIfNotBlank('Pakai Pengering', data.pakaiPengering);
  setValIfNotBlank('Metode Pengeringan', data.metodePengeringan);

  if (targetRow) sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  SpreadsheetApp.flush();
  try { clearServerCache(); } catch (error) {}
  return data;
}

function getBEPFixedByOutlet_(outletName) {
  if (outletName) syncMasterKapasitasToBEPFixed_({ outletName: outletName });
  const sheet = ensureBEPFixedSheet_();
  const map = getHeaderMapByName_(sheet);
  const outletCol = map['Nama Outlet'] || map['nama outlet'];
  if (!outletCol || !outletName || sheet.getLastRow() < 2) return null;

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  const targetName = normalizeOutletName_(outletName);
  const get = (row, header) => {
    const col = map[header] || map[String(header).toLowerCase()];
    return col ? row[col - 1] : '';
  };

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (normalizeOutletName_(row[outletCol - 1]) !== targetName) continue;
    const result = {
      namaOutlet: get(row, 'Nama Outlet'),
      statusSewa: get(row, 'Status Sewa') || 'Sewa',
      biayaSewaTahunan: parseNumberSafe_(get(row, 'Biaya Sewa Tahunan')),
      biayaSewaBulanan: parseNumberSafe_(get(row, 'Biaya Sewa Bulanan')),
      detailGaji: parseJsonSafe_(get(row, 'Detail Gaji JSON'), []),
      totalGajiBulanan: parseNumberSafe_(get(row, 'Total Gaji Bulanan')),
      detailMesin: parseJsonSafe_(get(row, 'Detail Mesin JSON'), []),
      totalDepresiasiMesinBulanan: parseNumberSafe_(get(row, 'Total Depresiasi Mesin Bulanan')),
      totalCadanganPerawatanMesinBulanan: parseNumberSafe_(get(row, 'Total Cadangan Perawatan Mesin Bulanan')),
      totalBiayaMesinBulanan: parseNumberSafe_(get(row, 'Total Biaya Mesin Bulanan')),
      providerInternet: get(row, 'Provider Internet'),
      biayaInternetBulanan: parseNumberSafe_(get(row, 'Biaya Internet Bulanan')),
      detailLainLain: parseJsonSafe_(get(row, 'Detail Lain Lain JSON'), []),
      totalLainLainBulanan: parseNumberSafe_(get(row, 'Total Lain Lain Bulanan')),
      totalFixedCostBulanan: parseNumberSafe_(get(row, 'Total Fixed Cost Bulanan')),
      catatan: get(row, 'Catatan'),
      kategoriLaundry: get(row, 'Kategori Laundry'),
      jamBuka: get(row, 'Jam Buka'),
      jamTutup: get(row, 'Jam Tutup'),
      tutupHariMinggu: get(row, 'Tutup Hari Minggu'),
      durasiOperasional: get(row, 'Durasi Operasional'),
      targetOkupansiCuci: get(row, 'Target Okupansi Cuci'),
      targetOkupansiKering: get(row, 'Target Okupansi Kering'),
      targetOkupansiSetrika: get(row, 'Target Okupansi Setrika'),
      estimasiCuci: get(row, 'Estimasi Cuci'),
      estimasiKering: get(row, 'Estimasi Kering'),
      estimasiSetrika: get(row, 'Estimasi Setrika'),
      mesinCuci: get(row, 'Mesin Cuci'),
      mesinPengering: get(row, 'Mesin Pengering'),
      kapCuci: get(row, 'Kap Cuci'),
      kapKering: get(row, 'Kap Kering'),
      durasiCuci: get(row, 'Durasi Cuci'),
      durasiKering: get(row, 'Durasi Kering'),
      alatSetrika: get(row, 'Alat Setrika'),
      kapSetrika: get(row, 'Kap Setrika'),
      durasiSetrika: get(row, 'Durasi Setrika'),
      tipeMesinCuci: get(row, 'Tipe Mesin Cuci')
    };
    BEP_FIXED_OPERATIONAL_HEADERS_.forEach(function(header) {
      result[header] = get(row, header);
    });
    result.tipeMesinPengering = get(row, 'Tipe Mesin Pengering');
    result.tipeSetrika = get(row, 'Tipe Setrika');
    result.pakaiPengering = get(row, 'Pakai Pengering');
    result.metodePengeringan = get(row, 'Metode Pengeringan');
    const machineData = buildBepMachineRowsFromOperational_(result, result.detailMesin);
    result.bepMachineData = machineData;
    result.detailMesin = machineData.machines;
    result.totalDepresiasiMesinBulanan = machineData.totalDepresiasiPerBulan;
    result.totalCadanganPerawatanMesinBulanan = machineData.totalMaintenancePerBulan;
    result.totalBiayaMesinBulanan = machineData.totalBiayaMesinPerBulan;
    result.totalFixedCostBulanan =
      parseNumberSafe_(result.biayaSewaBulanan) +
      parseNumberSafe_(result.totalGajiBulanan) +
      parseNumberSafe_(result.totalBiayaMesinBulanan) +
      parseNumberSafe_(result.biayaInternetBulanan) +
      parseNumberSafe_(result.totalLainLainBulanan);
    return result;
  }
  return null;
}

function saveBEPFixedCost(payload) {
  try {
    const data = upsertBEPFixedByOutlet_(payload);
    return { status: 'success', message: 'Fixed Cost BEP berhasil disimpan.', data: data };
  } catch (error) {
    return { status: 'error', message: error.toString(), data: null };
  }
}

function getBEPFixedCost(outletName) {
  try {
    const data = getBEPFixedByOutlet_(outletName);
    return { status: 'success', data: data || normalizeBEPFixedPayload_({ namaOutlet: outletName }) };
  } catch (error) {
    return { status: 'error', message: error.toString(), data: normalizeBEPFixedPayload_({ namaOutlet: outletName }) };
  }
}

function getBepMachineData(outletName) {
  try {
    const data = getBEPFixedByOutlet_(outletName);
    const machineData = data && data.bepMachineData
      ? data.bepMachineData
      : buildBepMachineRowsFromOperational_({ namaOutlet: outletName }, []);
    return { status: 'success', data: machineData };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString(),
      data: buildBepMachineRowsFromOperational_({ namaOutlet: outletName }, [])
    };
  }
}

function saveBepMachineCost(payload) {
  try {
    payload = payload || {};
    const outletName = payload.outletName || payload.namaOutlet || payload['Nama Outlet'];
    if (!outletName) throw new Error('Nama Outlet wajib diisi.');
    const existing = getBEPFixedByOutlet_(outletName) || normalizeBEPFixedPayload_({ namaOutlet: outletName });
    const machines = Array.isArray(payload.machines)
      ? payload.machines
      : (Array.isArray(payload.detailMesin) ? payload.detailMesin : []);
    const data = upsertBEPFixedByOutlet_(Object.assign({}, existing, {
      namaOutlet: outletName,
      detailMesin: machines
    }));
    return { status: 'success', message: 'Biaya Mesin berhasil disimpan dan masuk ke perhitungan BEP.', data: data };
  } catch (error) {
    return { status: 'error', message: error.toString(), data: null };
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
  if (headers.indexOf('Listrik Pompa Per Load') !== -1 && !('Listrik Pompa Per Load' in colMap)) {
    const insertAfter = ('kW Watt Pompa' in colMap) ? colMap['kW Watt Pompa'] + 1 : sheet.getLastColumn();
    sheet.insertColumnAfter(insertAfter);
    sheet.getRange(headerRow, insertAfter + 1)
      .setValue('Listrik Pompa Per Load')
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(true);
    colMap = zettGetHeaderMap_(sheet);
  }
  if (headers.some(function(h) { return /^Harga Total |^Deterjen Aktif$|^Harga Deterjen$/.test(h); })) {
    const chemicalHeadersChanged = zettEnsureHeaderBlock_(sheet, zettChemicalHeaders_(), 'Total Biaya Packing/Kg (Rp)');
    const notaMigrationChanged = zettMigrateNotaKasirHeadersOnly_(sheet);
    const notaHeadersChanged = zettEnsureHeaderBlock_(sheet, zettNotaKasirHeaders_(), 'Chemical Cuci Per Kg');
    const legacyMigrated = zettMigrateLegacyChemicalNotaHeaders_(sheet);
    zettSetHPPGroupTitles_(sheet);
    if (chemicalHeadersChanged || notaHeadersChanged || legacyMigrated || notaMigrationChanged) zettApplyChemicalNotaFormulas_(sheet);
    colMap = zettGetHeaderMap_(sheet);
  }
  const missing = headers.filter(function(h) {
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

function zettEnsureHeaderBlock_(sheet, blockHeaders, anchorHeader) {
  if (!sheet || !blockHeaders || blockHeaders.length === 0) return false;
  const headerRow = zettHppHeaderRow_(sheet);
  let colMap = zettGetHeaderMap_(sheet);
  const missing = blockHeaders.filter(function(header) {
    return !(header in colMap);
  });
  if (missing.length === 0) return false;

  const anchorCol = (anchorHeader in colMap) ? colMap[anchorHeader] + 1 : sheet.getLastColumn();
  sheet.insertColumnsAfter(anchorCol, missing.length);
  sheet.getRange(headerRow, anchorCol + 1, 1, missing.length)
    .setValues([missing])
    .setFontWeight('bold')
    .setBackground('#0f172a')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  return true;
}

function zettNotaKasirNewHeaders_() {
  return [
    'Sistem Kasir Nota',
    'Metode Biaya Aplikasi',
    'App Biaya Per Transaksi',
    'App Biaya Bulanan',
    'App Estimasi Trx Bulanan',
    'App Biaya Transaksi Tambahan',
    'Thermal Harga Per Roll',
    'Thermal Transaksi Per Roll',
    'Thermal Biaya Per Transaksi',
    'Manual Harga Satuan Awal Nota',
    'Manual Jumlah Lembar Nota',
    'Manual Ply Per Transaksi',
    'Manual Harga Nota Per Lembar',
    'Manual Biaya Nota Per Transaksi',
    'HPP Aplikasi Per Load',
    'HPP Nota Transaksi Per Load'
  ];
}

function zettBackupSheetBeforeNotaKasirMigration_(sheet, reason) {
  if (!sheet) return;
  const props = PropertiesService.getDocumentProperties();
  const key = 'zett_nota_kasir_backup_' + sheet.getSheetId();
  const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
  if (props.getProperty(key) === today) return;
  const ss = sheet.getParent();
  const stamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
  const backup = sheet.copyTo(ss).setName(sheet.getName() + '_backup_nota_' + stamp);
  backup.hideSheet();
  props.setProperty(key, today);
  Logger.log('[Nota Kasir] Backup dibuat sebelum migrasi header: %s (%s)', backup.getName(), reason || 'header update');
}

function zettMigrateNotaKasirHeadersOnly_(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return false;
  let colMap = zettGetHeaderMap_(sheet);
  const required = zettNotaKasirNewHeaders_();
  const missing = required.filter(function(header) { return !(header in colMap); });
  const legacyPresent = [
    'Nota_Type', 'Nota_App_FeeType', 'Nota_App_HargaBulan', 'Nota_App_TrxBulan',
    'Nota_App_HargaTrx', 'Nota_Thermal_Harga', 'Nota_Manual_Harga',
    'Nota_Manual_LembarTotal', 'Nota_Manual_LembarTrx'
  ].some(function(header) { return header in colMap; });
  if (missing.length === 0 && !legacyPresent) return false;

  zettBackupSheetBeforeNotaKasirMigration_(sheet, 'Nota & Kasir headers');
  if (missing.length > 0) {
    const headerRow = zettHppHeaderRow_(sheet);
    const anchorHeader = 'Admin Nota Kasir Per Kg';
    colMap = zettGetHeaderMap_(sheet);
    const anchorCol = (anchorHeader in colMap) ? colMap[anchorHeader] + 1 : sheet.getLastColumn();
    sheet.insertColumnsAfter(anchorCol, missing.length);
    sheet.getRange(headerRow, anchorCol + 1, 1, missing.length)
      .setValues([missing])
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(true);
  }

  colMap = zettGetHeaderMap_(sheet);
  const headerRow = zettHppHeaderRow_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow > headerRow) {
    const range = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, sheet.getLastColumn());
    const values = range.getValues();
    let changed = false;
    values.forEach(function(row) {
      function get(header) { return header in colMap ? row[colMap[header]] : ''; }
      function setIfEmpty(header, value) {
        if (!(header in colMap)) return;
        if ((row[colMap[header]] === '' || row[colMap[header]] === null) && value !== '' && value !== null && value !== undefined) {
          row[colMap[header]] = value;
          changed = true;
        }
      }
      const legacyType = String(get('Nota_Type') || '').toLowerCase();
      const legacyFeeType = get('Nota_App_FeeType');
      const system = legacyType.indexOf('manual') !== -1 ? 'Nota Manual Buku NCR' : 'Aplikasi Kasir (Digital + Kertas Thermal)';
      const method = zettNormalizeNotaAppFeeType_(legacyFeeType);
      setIfEmpty('Sistem Kasir Nota', system);
      setIfEmpty('Metode Biaya Aplikasi', system === 'Nota Manual Buku NCR' ? '' : method);
      setIfEmpty('App Biaya Per Transaksi', get('Nota_App_HargaTrx'));
      setIfEmpty('App Biaya Bulanan', get('Nota_App_HargaBulan') || get('Biaya Kasir Bulanan'));
      setIfEmpty('App Estimasi Trx Bulanan', get('Nota_App_TrxBulan') || get('Target Order Kasir Per Hari'));
      setIfEmpty('Thermal Biaya Per Transaksi', get('Nota_Thermal_Harga'));
      setIfEmpty('Manual Harga Satuan Awal Nota', get('Nota_Manual_Harga') || get('Harga Buku Nota'));
      setIfEmpty('Manual Jumlah Lembar Nota', get('Nota_Manual_LembarTotal') || get('Isi Nota'));
      setIfEmpty('Manual Ply Per Transaksi', get('Nota_Manual_LembarTrx') || get('Lembar Nota Per Order'));
      setIfEmpty('Manual Biaya Nota Per Transaksi', get('Nota Per Order'));
      setIfEmpty('HPP Aplikasi Per Load', get('Kasir Per Order'));
      setIfEmpty('HPP Nota Transaksi Per Load', get('Nota Per Order') || get('Nota_Thermal_Harga'));
    });
    if (changed) range.setValues(values);
  }
  return true;
}

function zettSetHPPGroupTitles_(sheet) {
  if (!sheet) return;
  const headerRow = zettHppHeaderRow_(sheet);
  if (headerRow <= 1) return;
  const colMap = zettGetHeaderMap_(sheet);
  const groups = [
    { title: 'Analisa Biaya Chemical', start: 'Deterjen Aktif', end: 'Chemical Cuci Per Kg' },
    { title: 'Analisa Biaya Nota & Kasir', start: 'Gaji Admin Bulanan', end: 'Admin Nota Kasir Per Kg' }
  ];
  const titleRow = headerRow - 1;
  const row = sheet.getRange(titleRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  groups.forEach(function(group) {
    if (!(group.start in colMap) || !(group.end in colMap)) return;
    const start = colMap[group.start];
    const end = colMap[group.end];
    for (let i = start; i <= end; i++) row[i] = '';
    row[start] = group.title;
    if (group.title === 'Analisa Biaya Chemical') {
      sheet.getRange(titleRow, start + 1, 1, end - start + 1)
        .setBackground('#10B981')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');
    }
  });
  sheet.getRange(titleRow, 1, 1, row.length).setValues([row]);
}

function zettLegacyChemicalNotaMap_() {
  return {
    'Chem_Det_Active': 'Deterjen Aktif',
    'Chem_Det_Type': 'Tipe Deterjen',
    'Chem_Det_Harga': 'Harga Total Deterjen',
    'Harga Deterjen': 'Harga Total Deterjen',
    'Chem_Det_Kapasitas': 'Kap Deterjen Liter',
    'Isi Deterjen': 'Kap Deterjen Liter',
    'Chem_Det_Pemakaian': 'Pemakaian Deterjen Per Kg Ml',
    'Takaran Deterjen Per Load': 'Pemakaian Deterjen Per Kg Ml',
    'Chem_Par_Active': 'Pewangi Aktif',
    'Chem_Par_Harga': 'Harga Total Pewangi',
    'Harga Pewangi': 'Harga Total Pewangi',
    'Chem_Par_Kapasitas': 'Kap Pewangi Liter',
    'Isi Pewangi': 'Kap Pewangi Liter',
    'Chem_Par_Pemakaian': 'Pemakaian Pewangi Per Kg Ml',
    'Takaran Pewangi Per Load': 'Pemakaian Pewangi Per Kg Ml',
    'Chem_Sof_Active': 'Softener Aktif',
    'Chem_Sof_Type': 'Tipe Softener',
    'Chem_Sof_Harga': 'Harga Total Softener',
    'Harga Softener': 'Harga Total Softener',
    'Chem_Sof_Kapasitas': 'Kap Softener Liter',
    'Isi Softener': 'Kap Softener Liter',
    'Chem_Sof_Pemakaian': 'Pemakaian Softener Per Kg Ml',
    'Takaran Softener Per Load': 'Pemakaian Softener Per Kg Ml',
    'Chem_Pel_Active': 'Pelicin Setrika Aktif',
    'Chem_Pel_Type': 'Tipe Pelicin Setrika',
    'Chem_Pel_Harga': 'Harga Total Pelicin Setrika',
    'Harga Pelicin Setrika': 'Harga Total Pelicin Setrika',
    'Chem_Pel_Kapasitas': 'Kap Pelicin Setrika Liter',
    'Isi Pelicin Setrika': 'Kap Pelicin Setrika Liter',
    'Chem_Pel_Pemakaian': 'Pemakaian Pelicin Setrika Per Kg Ml',
    'Takaran Pelicin Setrika Per Load': 'Pemakaian Pelicin Setrika Per Kg Ml',
    'Deterjen Per Load': 'Estimasi Deterjen Per Load',
    'Pewangi Per Load': 'Estimasi Pewangi Per Load',
    'Softener Per Load': 'Estimasi Softener Per Load',
    'Pemutih Per Load': 'Estimasi Pemutih Per Load',
    'Anti Noda Per Load': 'Estimasi Anti Noda Per Load',
    'Chemical Tambahan Per Load': 'Estimasi Pelicin Setrika Per Load',
    'Nota_App_HargaBulan': 'Biaya Kasir Bulanan',
    'Nota_Manual_Harga': 'Harga Buku Nota',
    'Nota_Manual_LembarTotal': 'Isi Nota',
    'Nota_Manual_LembarTrx': 'Lembar Nota Per Order'
  };
}

function zettLegacyChemicalNotaHeaders_() {
  return [
    'Chem_Det_Active', 'Chem_Det_Type', 'Chem_Det_Harga', 'Chem_Det_Kapasitas', 'Chem_Det_Pemakaian',
    'Chem_Sof_Active', 'Chem_Sof_Type', 'Chem_Sof_Harga', 'Chem_Sof_Kapasitas', 'Chem_Sof_Pemakaian',
    'Chem_Par_Active', 'Chem_Par_Harga', 'Chem_Par_Kapasitas', 'Chem_Par_Pemakaian',
    'Chem_Pel_Active', 'Chem_Pel_Type', 'Chem_Pel_Harga', 'Chem_Pel_Kapasitas', 'Chem_Pel_Pemakaian',
    'Harga Deterjen', 'Isi Deterjen', 'Takaran Deterjen Per Load',
    'Harga Softener', 'Isi Softener', 'Takaran Softener Per Load',
    'Harga Pewangi', 'Isi Pewangi', 'Takaran Pewangi Per Load',
    'Harga Pelicin Setrika', 'Isi Pelicin Setrika', 'Takaran Pelicin Setrika Per Load',
    'Deterjen Per Load', 'Pewangi Per Load', 'Softener Per Load', 'Pemutih Per Load',
    'Anti Noda Per Load', 'Chemical Tambahan Per Load',
    'Nota_Type', 'Nota_App_FeeType', 'Nota_App_HargaBulan', 'Nota_App_TrxBulan', 'Nota_App_HargaTrx',
    'Nota_Thermal_Harga', 'Nota_Manual_Harga', 'Nota_Manual_LembarTotal', 'Nota_Manual_LembarTrx', 'Nota_RataKg'
  ];
}

function zettMigrateLegacyChemicalNotaHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return false;
  const headerRow = zettHppHeaderRow_(sheet);
  let colMap = zettGetHeaderMap_(sheet);
  const migration = zettLegacyChemicalNotaMap_();
  const hasLegacy = zettLegacyChemicalNotaHeaders_().some(function(header) { return header in colMap; })
    || ('Harga Chemical Tambahan' in colMap);
  if (!hasLegacy) return false;

  const lastRow = sheet.getLastRow();
  let changed = false;
  if (lastRow > headerRow) {
    const range = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, sheet.getLastColumn());
    const values = range.getValues();
    values.forEach(function(row) {
      Object.keys(migration).forEach(function(oldHeader) {
        const newHeader = migration[oldHeader];
        if (!(oldHeader in colMap) || !(newHeader in colMap)) return;
        const oldValue = row[colMap[oldHeader]];
        const newValue = row[colMap[newHeader]];
        if ((newValue === '' || newValue === null) && oldValue !== '' && oldValue !== null) {
          row[colMap[newHeader]] = oldValue;
          changed = true;
        }
      });
      [
        ['Harga Chemical Tambahan', 'Harga Total Pelicin Setrika'],
        ['Isi Chemical Tambahan', 'Kap Pelicin Setrika Liter'],
        ['Takaran Chemical Tambahan Per Load', 'Pemakaian Pelicin Setrika Per Kg Ml'],
        ['Estimasi Chemical Tambahan Per Load', 'Estimasi Pelicin Setrika Per Load'],
        ['Estimasi Chemical Tambahan Per Kg', 'Estimasi Pelicin Setrika Per Kg']
      ].forEach(function(pair) {
        const oldHeader = pair[0];
        const newHeader = pair[1];
        if (!(oldHeader in colMap) || !(newHeader in colMap)) return;
        const oldValue = row[colMap[oldHeader]];
        const newValue = row[colMap[newHeader]];
        if ((newValue === '' || newValue === null) && oldValue !== '' && oldValue !== null) {
          row[colMap[newHeader]] = oldValue;
          row[colMap[oldHeader]] = '';
          changed = true;
        }
      });
    });
    if (changed) range.setValues(values);
  }

  colMap = zettGetHeaderMap_(sheet);
  const deleteCols = zettLegacyChemicalNotaHeaders_()
    .filter(function(header) { return header in colMap; })
    .map(function(header) { return colMap[header] + 1; })
    .sort(function(a, b) { return b - a; });
  deleteCols.forEach(function(col) {
    sheet.deleteColumn(col);
  });
  return changed || deleteCols.length > 0;
}

function zettApplyChemicalNotaFormulas_(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return;
  const headerRow = zettHppHeaderRow_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) return;

  const colMap = zettGetHeaderMap_(sheet);
  if (!('Nama Outlet' in colMap)) return;

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

  function cell(header, rowNum) {
    return (header in colMap) ? getColLetter(colMap[header]) + rowNum : 'A' + rowNum;
  }

  function formulaFor(header, rowNum) {
    const f = {
      'Harga Deterjen Per Ltr': '=IFERROR(' + cell('Harga Total Deterjen', rowNum) + '/MAX(' + cell('Kap Deterjen Liter', rowNum) + ';1);0)',
      'Harga Deterjen Per Ml': '=IFERROR(' + cell('Harga Deterjen Per Ltr', rowNum) + '/1000;0)',
      'Estimasi Deterjen Per Load': '=IFERROR(IF(' + cell('Deterjen Aktif', rowNum) + '="Tidak";0;' + cell('Kap Cuci', rowNum) + '*' + cell('Pemakaian Deterjen Per Kg Ml', rowNum) + '*' + cell('Harga Deterjen Per Ml', rowNum) + ');0)',
      'Estimasi Deterjen Per Kg': '=IFERROR(' + cell('Estimasi Deterjen Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Harga Pewangi Per Ltr': '=IFERROR(' + cell('Harga Total Pewangi', rowNum) + '/MAX(' + cell('Kap Pewangi Liter', rowNum) + ';1);0)',
      'Harga Pewangi Per Ml': '=IFERROR(' + cell('Harga Pewangi Per Ltr', rowNum) + '/1000;0)',
      'Estimasi Pewangi Per Load': '=IFERROR(IF(' + cell('Pewangi Aktif', rowNum) + '="Tidak";0;' + cell('Kap Cuci', rowNum) + '*' + cell('Pemakaian Pewangi Per Kg Ml', rowNum) + '*' + cell('Harga Pewangi Per Ml', rowNum) + ');0)',
      'Estimasi Pewangi Per Kg': '=IFERROR(' + cell('Estimasi Pewangi Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Harga Softener Per Ltr': '=IFERROR(' + cell('Harga Total Softener', rowNum) + '/MAX(' + cell('Kap Softener Liter', rowNum) + ';1);0)',
      'Harga Softener Per Ml': '=IFERROR(' + cell('Harga Softener Per Ltr', rowNum) + '/1000;0)',
      'Estimasi Softener Per Load': '=IFERROR(IF(' + cell('Softener Aktif', rowNum) + '="Tidak";0;' + cell('Kap Cuci', rowNum) + '*' + cell('Pemakaian Softener Per Kg Ml', rowNum) + '*' + cell('Harga Softener Per Ml', rowNum) + ');0)',
      'Estimasi Softener Per Kg': '=IFERROR(' + cell('Estimasi Softener Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Estimasi Pemutih Per Load': '=IFERROR((' + cell('Harga Pemutih', rowNum) + '/MAX(' + cell('Isi Pemutih', rowNum) + ';1))*' + cell('Takaran Pemutih Per Load', rowNum) + ';0)',
      'Estimasi Pemutih Per Kg': '=IFERROR(' + cell('Estimasi Pemutih Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Estimasi Anti Noda Per Load': '=IFERROR((' + cell('Harga Anti Noda', rowNum) + '/MAX(' + cell('Isi Anti Noda', rowNum) + ';1))*' + cell('Takaran Anti Noda Per Load', rowNum) + ';0)',
      'Estimasi Anti Noda Per Kg': '=IFERROR(' + cell('Estimasi Anti Noda Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Harga Pelicin Setrika Per Ltr': '=IFERROR(' + cell('Harga Total Pelicin Setrika', rowNum) + '/MAX(' + cell('Kap Pelicin Setrika Liter', rowNum) + ';1);0)',
      'Harga Pelicin Setrika Per Ml': '=IFERROR(' + cell('Harga Pelicin Setrika Per Ltr', rowNum) + '/1000;0)',
      'Estimasi Pelicin Setrika Per Load': '=IFERROR(IF(' + cell('Pelicin Setrika Aktif', rowNum) + '="Tidak";0;' + cell('Kap Cuci', rowNum) + '*' + cell('Pemakaian Pelicin Setrika Per Kg Ml', rowNum) + '*' + cell('Harga Pelicin Setrika Per Ml', rowNum) + ');0)',
      'Estimasi Pelicin Setrika Per Kg': '=IFERROR(' + cell('Estimasi Pelicin Setrika Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Estimasi Chemical Tambahan Per Load': '=IFERROR((' + cell('Harga Chemical Tambahan', rowNum) + '/MAX(' + cell('Isi Chemical Tambahan', rowNum) + ';1))*' + cell('Takaran Chemical Tambahan Per Load', rowNum) + ';0)',
      'Estimasi Chemical Tambahan Per Kg': '=IFERROR(' + cell('Estimasi Chemical Tambahan Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Chemical Cuci Per Load': '=IFERROR(' + cell('Estimasi Deterjen Per Load', rowNum) + '+' + cell('Estimasi Softener Per Load', rowNum) + '+' + cell('Estimasi Pewangi Per Load', rowNum) + '+' + cell('Estimasi Pelicin Setrika Per Load', rowNum) + ';0)',
      'Chemical Cuci Per Kg': '=IFERROR(' + cell('Chemical Cuci Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)',
      'Admin Per Order': '=IFERROR(' + cell('Gaji Admin Bulanan', rowNum) + '/MAX(' + cell('Hari Kerja Admin Bulanan', rowNum) + '*' + cell('Target Order Admin Per Hari', rowNum) + ';1);0)',
      'Nota Per Order': '=IFERROR((' + cell('Harga Buku Nota', rowNum) + '/MAX(' + cell('Isi Nota', rowNum) + ';1))*MAX(' + cell('Lembar Nota Per Order', rowNum) + ';1);0)',
      'Kasir Per Order': '=IFERROR(' + cell('Biaya Kasir Bulanan', rowNum) + '/MAX(' + cell('Hari Kerja Kasir Bulanan', rowNum) + '*' + cell('Target Order Kasir Per Hari', rowNum) + ';1);0)',
      'Admin Nota Kasir Per Order': '=IFERROR(' + cell('Admin Per Order', rowNum) + '+' + cell('Nota Per Order', rowNum) + '+' + cell('Kasir Per Order', rowNum) + ';0)',
      'Admin Nota Kasir Per Load': '=IFERROR(' + cell('Admin Nota Kasir Per Order', rowNum) + ';0)',
      'Admin Nota Kasir Per Kg': '=IFERROR(' + cell('Admin Nota Kasir Per Load', rowNum) + '/MAX(' + cell('Kap Cuci', rowNum) + ';1);0)'
    };
    return f[header] || '';
  }

  const names = sheet.getRange(headerRow + 1, colMap['Nama Outlet'] + 1, lastRow - headerRow, 1).getDisplayValues();
  const formulaHeaders = [
    'Harga Deterjen Per Ltr', 'Harga Deterjen Per Ml',
    'Estimasi Deterjen Per Load', 'Estimasi Deterjen Per Kg',
    'Harga Softener Per Ltr', 'Harga Softener Per Ml',
    'Estimasi Softener Per Load', 'Estimasi Softener Per Kg',
    'Harga Pewangi Per Ltr', 'Harga Pewangi Per Ml',
    'Estimasi Pewangi Per Load', 'Estimasi Pewangi Per Kg',
    'Harga Pelicin Setrika Per Ltr', 'Harga Pelicin Setrika Per Ml',
    'Estimasi Pelicin Setrika Per Load', 'Estimasi Pelicin Setrika Per Kg',
    'Estimasi Pemutih Per Load', 'Estimasi Pemutih Per Kg',
    'Estimasi Anti Noda Per Load', 'Estimasi Anti Noda Per Kg',
    'Estimasi Chemical Tambahan Per Load', 'Estimasi Chemical Tambahan Per Kg',
    'Chemical Cuci Per Load', 'Chemical Cuci Per Kg',
    'Admin Per Order', 'Nota Per Order', 'Kasir Per Order', 'Admin Nota Kasir Per Order',
    'Admin Nota Kasir Per Load', 'Admin Nota Kasir Per Kg'
  ];

  formulaHeaders.forEach(function(header) {
    if (!(header in colMap)) return;
    const formulas = names.map(function(row, index) {
      const rowNum = headerRow + 1 + index;
      return [String(row[0] || '').trim() ? formulaFor(header, rowNum) : ''];
    });
    sheet.getRange(headerRow + 1, colMap[header] + 1, formulas.length, 1).setFormulas(formulas);
  });
}

function zettChemicalHeaders_() {
  return [
    'Deterjen Aktif',
    'Tipe Deterjen',
    'Harga Total Deterjen',
    'Kap Deterjen Liter',
    'Harga Deterjen Per Ltr',
    'Harga Deterjen Per Ml',
    'Pemakaian Deterjen Per Kg Ml',
    'Estimasi Deterjen Per Load',
    'Estimasi Deterjen Per Kg',
    'Softener Aktif',
    'Tipe Softener',
    'Harga Total Softener',
    'Kap Softener Liter',
    'Harga Softener Per Ltr',
    'Harga Softener Per Ml',
    'Pemakaian Softener Per Kg Ml',
    'Estimasi Softener Per Load',
    'Estimasi Softener Per Kg',
    'Pewangi Aktif',
    'Harga Total Pewangi',
    'Kap Pewangi Liter',
    'Harga Pewangi Per Ltr',
    'Harga Pewangi Per Ml',
    'Pemakaian Pewangi Per Kg Ml',
    'Estimasi Pewangi Per Load',
    'Estimasi Pewangi Per Kg',
    'Pelicin Setrika Aktif',
    'Tipe Pelicin Setrika',
    'Harga Total Pelicin Setrika',
    'Kap Pelicin Setrika Liter',
    'Harga Pelicin Setrika Per Ltr',
    'Harga Pelicin Setrika Per Ml',
    'Pemakaian Pelicin Setrika Per Kg Ml',
    'Estimasi Pelicin Setrika Per Load',
    'Estimasi Pelicin Setrika Per Kg',
    'Chemical Cuci Per Load',
    'Chemical Cuci Per Kg'
  ];
}

function zettNotaKasirHeaders_() {
  return [
    'Gaji Admin Bulanan',
    'Hari Kerja Admin Bulanan',
    'Target Order Admin Per Hari',
    'Admin Per Order',
    'Harga Buku Nota',
    'Isi Nota',
    'Lembar Nota Per Order',
    'Nota Per Order',
    'Biaya Kasir Bulanan',
    'Hari Kerja Kasir Bulanan',
    'Target Order Kasir Per Hari',
    'Kasir Per Order',
    'Admin Nota Kasir Per Order',
    'Admin Nota Kasir Per Load',
    'Admin Nota Kasir Per Kg',
    ...zettNotaKasirNewHeaders_()
  ];
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
    'Watt Pompa', 'kW Watt Pompa', 'Listrik Pompa Per Load', 'Watt Setrika', 'kW Watt Setrika',
    'Cuci Per Load', 'Cuci Per Kg', 'Kering Per Load', 'Kering Per Kg',
    'Listrik Setrika Jam', 'Listrik Setrika Kg',
    'Sumber Air', 'Harga Air', 'Harga Tangki', 'Liter Tangki', 'Air Cuci',
    'Sumber Setrika', 'Galon Setrika', 'Vol Setrika', 'Liter Setrika',
    'Jam Setrika', 'Kg Setrika', 'Air Per Load', 'Air Per Kg',
    'Air Setrika Jam', 'Air Setrika Kg',

    ...zettPackingHeaders20260518_(),

    ...zettChemicalHeaders_(),
    ...zettNotaKasirHeaders_()
  ];
}

function zettToNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let str = String(value).trim().replace(/Rp/gi, '').replace(/\s/g, '').replace(/[^\d.,-]/g, '');
  if (!str) return 0;
  const hasComma = str.indexOf(',') !== -1;
  const hasDot = str.indexOf('.') !== -1;
  if (hasComma && hasDot) {
    str = str.lastIndexOf(',') > str.lastIndexOf('.')
      ? str.replace(/\./g, '').replace(',', '.')
      : str.replace(/,/g, '');
  } else if (hasDot) {
    const parts = str.split('.');
    str = parts.length > 1 && parts.slice(1).every(function(part) { return part.length === 3; })
      ? parts.join('')
      : str;
  } else if (hasComma) {
    const parts = str.split(',');
    str = parts.length > 1 && parts.slice(1).every(function(part) { return part.length === 3; })
      ? parts.join('')
      : str.replace(',', '.');
  }
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

function zettNormalizeNotaAppFeeType_(value) {
  const text = String(value || '').trim().toLowerCase();
  if (
    text === 'biaya langsung per transaksi' ||
    text === 'langsung' ||
    text === 'direct' ||
    text === 'per transaksi' ||
    text === 'per_transaksi' ||
    text === 'app_per_transaksi' ||
    text === 'trx'
  ) {
    return 'Biaya Langsung Per Transaksi';
  }
  if (
    text === 'berlangganan per bulan' ||
    text === 'bulanan' ||
    text === 'monthly' ||
    text === 'per bulan' ||
    text === 'subscription' ||
    text === 'bulan'
  ) {
    return 'Berlangganan Per Bulan';
  }
  return 'Berlangganan Per Bulan';
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

function zettSplitPackingSize20260518_(value, context) {
  const raw = String(value || '').trim();
  if (!raw) return { width: '', length: '' };
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/);
  if (!match) {
    Logger.log('[HPP Packing] Ukuran tidak valid%s: "%s"', context ? ' ' + context : '', raw);
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
    zettFirst_(obj, ['Packing_PP_Ukuran'], '')
  );
  const hdSize = zettJoinPackingSize20260518_(
    zettFirst_(obj, ['HD Lebar (cm)'], ''),
    zettFirst_(obj, ['HD Panjang (cm)'], ''),
    zettFirst_(obj, ['Packing_HD_Ukuran'], '')
  );
  const jinjingSize = zettJoinPackingSize20260518_(
    zettFirst_(obj, ['Jinjing Lebar (cm)'], ''),
    zettFirst_(obj, ['Jinjing Panjang (cm)'], ''),
    zettFirst_(obj, ['Packing_Jinjing_Ukuran'], '')
  );

  obj['Packing_PP_Active'] = zettFirst_(obj, ['PP Aktif', 'Packing_PP_Active'], '');
  obj['Packing_PP_Ukuran'] = ppSize;
  obj['Packing_PP_Harga'] = zettFirst_(obj, ['PP Harga/Pack (Rp)', 'Packing_PP_Harga'], '');
  obj['Packing_PP_Isi'] = zettFirst_(obj, ['PP Isi/Pack (Lembar)', 'Packing_PP_Isi'], '');
  obj['Packing_PP_Kg'] = zettFirst_(obj, ['PP Kapasitas (Kg/Lembar)', 'Packing_PP_Kg'], '');
  obj['Packing_PP_Lembar'] = zettFirst_(obj, ['PP Biaya/Lembar (Rp)', 'Packing_PP_Lembar'], '');
  obj['Packing_PP_PerKg'] = zettFirst_(obj, ['PP Biaya/Kg (Rp)', 'Packing_PP_PerKg'], '');

  obj['Packing_HD_Active'] = zettFirst_(obj, ['HD Aktif', 'Packing_HD_Active'], '');
  obj['Packing_HD_Ukuran'] = hdSize;
  obj['Packing_HD_Harga'] = zettFirst_(obj, ['HD Harga/Pack (Rp)', 'Packing_HD_Harga'], '');
  obj['Packing_HD_Isi'] = zettFirst_(obj, ['HD Isi/Pack (Lembar)', 'Packing_HD_Isi'], '');
  obj['Packing_HD_Kg'] = zettFirst_(obj, ['HD Kapasitas (Kg/Lembar)', 'Packing_HD_Kg'], '');
  obj['Packing_HD_Lembar'] = zettFirst_(obj, ['HD Biaya/Lembar (Rp)', 'Packing_HD_Lembar'], '');
  obj['Packing_HD_PerKg'] = zettFirst_(obj, ['HD Biaya/Kg (Rp)', 'Packing_HD_PerKg'], '');

  obj['Packing_Jinjing_Active'] = zettFirst_(obj, ['Jinjing Aktif', 'Packing_Jinjing_Active'], '');
  obj['Packing_Jinjing_Ukuran'] = jinjingSize;
  obj['Packing_Jinjing_Harga'] = zettFirst_(obj, ['Jinjing Harga/Pack (Rp)', 'Packing_Jinjing_Harga'], '');
  obj['Packing_Jinjing_Isi'] = zettFirst_(obj, ['Jinjing Isi/Pack (Lembar)', 'Packing_Jinjing_Isi'], '');
  obj['Packing_Jinjing_Kg'] = zettFirst_(obj, ['Jinjing Kapasitas (Kg/Lembar)', 'Packing_Jinjing_Kg'], '');
  obj['Packing_Jinjing_Lembar'] = zettFirst_(obj, ['Jinjing Biaya/Lembar (Rp)', 'Packing_Jinjing_Lembar'], '');
  obj['Packing_Jinjing_PerKg'] = zettFirst_(obj, ['Jinjing Biaya/Kg (Rp)', 'Packing_Jinjing_PerKg'], '');

  obj['Packing_Solasi_Active'] = zettFirst_(obj, ['Solasi Aktif', 'Packing_Solasi_Active'], '');
  obj['Packing_Solasi_Harga'] = zettFirst_(obj, ['Solasi Harga/Roll (Rp)', 'Packing_Solasi_Harga'], '');
  obj['Packing_Solasi_Isi'] = zettFirst_(obj, ['Solasi Panjang/Roll (Meter)', 'Packing_Solasi_Isi', 'Packing_Solasi_Order'], '');
  obj['Packing_Solasi_Kg'] = zettFirst_(obj, ['Solasi Pemakaian/Kg (Meter)', 'Packing_Solasi_Kg', 'Packing_Solasi_Kapasitas'], '');
  obj['Packing_Solasi_Order'] = obj['Packing_Solasi_Isi'];
  obj['Packing_Solasi_PerOrder'] = zettFirst_(obj, ['Solasi Biaya/Meter (Rp)', 'Packing_Solasi_PerOrder'], '');
  obj['Packing_Solasi_PerKg'] = zettFirst_(obj, ['Solasi Biaya/Kg (Rp)', 'Packing_Solasi_PerKg'], '');

  obj['Total Biaya Packing'] = zettFirst_(obj, ['Total Biaya Packing/Kg (Rp)'], '');
  return obj;
}

function zettAddChemicalNotaAliases_(obj) {
  if (!obj) return obj;
  const hasChemicalCostData = function() {
    return [
      'Harga Total Deterjen',
      'Kap Deterjen Liter',
      'Pemakaian Deterjen Per Kg Ml',
      'Harga Total Softener',
      'Kap Softener Liter',
      'Pemakaian Softener Per Kg Ml',
      'Harga Total Pewangi',
      'Kap Pewangi Liter',
      'Pemakaian Pewangi Per Kg Ml',
      'Harga Total Pelicin Setrika',
      'Kap Pelicin Setrika Liter',
      'Pemakaian Pelicin Setrika Per Kg Ml'
    ].some(function(key) {
      return obj[key] !== undefined && obj[key] !== null && obj[key] !== '' && zettToNumber_(obj[key]) > 0;
    });
  };
  const chemActive = function(value) {
    const text = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
    if (text === '') return true;
    return !(text === 'tidak' || text === 'false' || text === '0' || text === 'off' || text === 'no');
  };
  obj['Chem_Det_Active'] = zettFirst_(obj, ['Deterjen Aktif', 'Chem_Det_Active'], true);
  obj['Chem_Det_Type'] = zettFirst_(obj, ['Tipe Deterjen', 'Chem_Det_Type'], 'cair');
  obj['Chem_Det_Harga'] = zettFirst_(obj, ['Harga Total Deterjen', 'Harga Deterjen', 'Chem_Det_Harga'], '');
  obj['Chem_Det_Kapasitas'] = zettFirst_(obj, ['Kap Deterjen Liter', 'Isi Deterjen', 'Chem_Det_Kapasitas'], '');
  obj['Chem_Det_Pemakaian'] = zettFirst_(obj, ['Pemakaian Deterjen Per Kg Ml', 'Takaran Deterjen Per Load', 'Chem_Det_Pemakaian'], '');
  obj['Chem_Par_Active'] = zettFirst_(obj, ['Pewangi Aktif', 'Chem_Par_Active'], true);
  obj['Chem_Par_Harga'] = zettFirst_(obj, ['Harga Total Pewangi', 'Harga Pewangi', 'Chem_Par_Harga'], '');
  obj['Chem_Par_Kapasitas'] = zettFirst_(obj, ['Kap Pewangi Liter', 'Isi Pewangi', 'Chem_Par_Kapasitas'], '');
  obj['Chem_Par_Pemakaian'] = zettFirst_(obj, ['Pemakaian Pewangi Per Kg Ml', 'Takaran Pewangi Per Load', 'Chem_Par_Pemakaian'], '');
  obj['Chem_Sof_Active'] = zettFirst_(obj, ['Softener Aktif', 'Chem_Sof_Active'], true);
  obj['Chem_Sof_Type'] = zettFirst_(obj, ['Tipe Softener', 'Chem_Sof_Type'], 'cair');
  obj['Chem_Sof_Harga'] = zettFirst_(obj, ['Harga Total Softener', 'Harga Softener', 'Chem_Sof_Harga'], '');
  obj['Chem_Sof_Kapasitas'] = zettFirst_(obj, ['Kap Softener Liter', 'Isi Softener', 'Chem_Sof_Kapasitas'], '');
  obj['Chem_Sof_Pemakaian'] = zettFirst_(obj, ['Pemakaian Softener Per Kg Ml', 'Takaran Softener Per Load', 'Chem_Sof_Pemakaian'], '');
  obj['Chem_Pel_Active'] = zettFirst_(obj, ['Pelicin Setrika Aktif', 'Chem_Pel_Active'], true);
  obj['Chem_Pel_Type'] = zettFirst_(obj, ['Tipe Pelicin Setrika', 'Chem_Pel_Type'], 'cair');
  obj['Chem_Pel_Harga'] = zettFirst_(obj, ['Harga Total Pelicin Setrika', 'Harga Pelicin Setrika', 'Harga Chemical Tambahan', 'Chem_Pel_Harga'], '');
  obj['Chem_Pel_Kapasitas'] = zettFirst_(obj, ['Kap Pelicin Setrika Liter', 'Isi Pelicin Setrika', 'Isi Chemical Tambahan', 'Chem_Pel_Kapasitas'], '');
  obj['Chem_Pel_Pemakaian'] = zettFirst_(obj, ['Pemakaian Pelicin Setrika Per Kg Ml', 'Takaran Pelicin Setrika Per Load', 'Takaran Chemical Tambahan Per Load', 'Chem_Pel_Pemakaian'], '');
  obj['Nota_Type'] = zettFirst_(obj, ['Sistem Kasir Nota', 'Nota_Type'], 'Aplikasi Kasir (Digital + Kertas Thermal)');
  obj['Nota_App_FeeType'] = zettNormalizeNotaAppFeeType_(zettFirst_(obj, ['Metode Biaya Aplikasi', 'Nota_App_FeeType'], 'Berlangganan Per Bulan'));
  obj['Nota_App_HargaBulan'] = zettFirst_(obj, ['App Biaya Bulanan', 'Biaya Kasir Bulanan', 'Nota_App_HargaBulan'], '');
  obj['Nota_App_TrxBulan'] = zettFirst_(obj, ['App Estimasi Trx Bulanan', 'Target Order Kasir Per Hari', 'Nota_App_TrxBulan'], '');
  obj['Nota_App_HargaTrx'] = zettFirst_(obj, ['App Biaya Per Transaksi', 'Kasir Per Order', 'Nota_App_HargaTrx'], '');
  obj['Nota_App_BiayaTambahan'] = zettFirst_(obj, ['App Biaya Transaksi Tambahan'], '');
  obj['Nota_Thermal_HargaRoll'] = zettFirst_(obj, ['Thermal Harga Per Roll'], '');
  obj['Nota_Thermal_TrxRoll'] = zettFirst_(obj, ['Thermal Transaksi Per Roll'], '');
  obj['Nota_Thermal_Harga'] = zettFirst_(obj, ['Thermal Biaya Per Transaksi', 'Nota Per Order', 'Nota_Thermal_Harga'], '');
  obj['Nota_Manual_Harga'] = zettFirst_(obj, ['Manual Harga Satuan Awal Nota', 'Harga Buku Nota', 'Nota_Manual_Harga'], '');
  obj['Nota_Manual_LembarTotal'] = zettFirst_(obj, ['Manual Jumlah Lembar Nota', 'Isi Nota', 'Nota_Manual_LembarTotal'], '');
  obj['Nota_Manual_LembarTrx'] = zettFirst_(obj, ['Manual Ply Per Transaksi', 'Lembar Nota Per Order', 'Nota_Manual_LembarTrx'], '');
  obj['Nota_Manual_HargaLembar'] = zettFirst_(obj, ['Manual Harga Nota Per Lembar'], '');
  obj['Nota_Manual_BiayaTrx'] = zettFirst_(obj, ['Manual Biaya Nota Per Transaksi'], '');
  obj['Nota_RataKg'] = zettFirst_(obj, ['Kap Cuci', 'Nota_RataKg'], '');

  if (!hasChemicalCostData()) {
    obj['chemical_cost'] = 0;
    obj['Chemical Cuci Per Load'] = 0;
    obj['Chemical Cuci Per Kg'] = 0;
  }

  const activeChemicalLoads = [
    { active: obj['Chem_Det_Active'], load: zettFirst_(obj, ['Estimasi Deterjen Per Load'], '') },
    { active: obj['Chem_Sof_Active'], load: zettFirst_(obj, ['Estimasi Softener Per Load'], '') },
    { active: obj['Chem_Par_Active'], load: zettFirst_(obj, ['Estimasi Pewangi Per Load'], '') },
    { active: obj['Chem_Pel_Active'], load: zettFirst_(obj, ['Estimasi Pelicin Setrika Per Load'], '') }
  ];
  const anyChemicalActive = activeChemicalLoads.some(function(item) { return chemActive(item.active); });
  if (!anyChemicalActive) {
    obj['Chemical Cuci Per Load'] = 0;
    obj['Chemical Cuci Per Kg'] = 0;
  } else {
    const effectiveChemicalLoad = activeChemicalLoads.reduce(function(sum, item) {
      return chemActive(item.active) ? sum + zettToNumber_(item.load) : sum;
    }, 0);
    if (effectiveChemicalLoad > 0) {
      obj['Chemical Cuci Per Load'] = effectiveChemicalLoad;
      obj['Chemical Cuci Per Kg'] = effectiveChemicalLoad / Math.max(zettToNumber_(obj['Kap Cuci']) || 1, 1);
    }
  }
  obj['chemical_cost'] = zettToNumber_(zettFirst_(obj, ['chemical_cost', 'Chemical Cuci Per Kg'], 0)) || 0;

  obj['Listrik Kering Per Load'] = zettFirst_(obj, ['Listrik Kering Per Load', 'Listrik Kering /Load', 'Kering Per Load'], '');
  obj['listrikKeringPerLoad'] = obj['Listrik Kering Per Load'];
  obj['listrikKeringLoad'] = obj['Listrik Kering Per Load'];
  obj['keringElectricPerLoad'] = obj['Listrik Kering Per Load'];
  obj['Listrik Cuci Per Load'] = zettFirst_(obj, ['Listrik Cuci Per Load', 'Listrik Cuci /Load', 'Cuci Per Load'], '');
  obj['Listrik Pompa /Load'] = zettFirst_(obj, ['Listrik Pompa /Load', 'Listrik Pompa Per Load'], '');

  obj['Transaksi Apps Per Load'] = zettFirst_(obj, ['HPP Aplikasi Per Load', 'Transaksi Apps Per Load', 'Transaksi Apps /Load', 'Kasir Per Order', 'Nota_App_HargaTrx'], '');
  obj['transaksiAppsPerLoad'] = obj['Transaksi Apps Per Load'];
  obj['Nota Transaksi Per Load'] = zettFirst_(obj, ['HPP Nota Transaksi Per Load', 'Nota Transaksi Per Load', 'Nota Transaksi /Load', 'Nota Per Order', 'Nota_Thermal_Harga'], '');
  obj['notaTransaksiPerLoad'] = obj['Nota Transaksi Per Load'];
  obj['Admin/Nota Per Load'] = zettFirst_(obj, ['Admin/Nota Per Load', 'Admin Nota Kasir Per Load', 'Admin Nota Kasir Per Order'], '');
  obj['adminNotaPerLoad'] = obj['Admin/Nota Per Load'];
  return obj;
}

function zettNormalizeOutletName_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
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

      zettAddPackingAliases20260518_(obj);
      zettAddChemicalNotaAliases_(obj);

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

      zettAddPackingAliases20260518_(obj);
      zettAddChemicalNotaAliases_(obj);

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

    const ppSize = zettSplitPackingSize20260518_(payload.packPPUkuran || payload.packPPSize || '', 'simpan PP');
    const hdSize = zettSplitPackingSize20260518_(payload.packHDUkuran || payload.packHDSize || '', 'simpan HD');
    const jinjingSize = zettSplitPackingSize20260518_(payload.packJinjingUkuran || payload.packJinjingSize || '', 'simpan Jinjing');
    const solasiActive = payload.packSolasiActive === true || String(payload.packSolasiActive || '').toLowerCase() === 'true' || String(payload.packSolasiActive || '').toLowerCase() === 'ya';
    const solasiHarga = zettToNumber_(payload.packSolasiHarga);
    const solasiPanjang = zettToNumber_(payload.packSolasiPanjang);
    const solasiPemakaian = zettToNumber_(payload.packSolasiPemakaian);
    const solasiBiayaMeter = solasiPanjang > 0 ? solasiHarga / solasiPanjang : 0;
    const solasiBiayaKg = solasiActive && solasiPemakaian > 0 ? solasiBiayaMeter / solasiPemakaian : 0;
    const frontendTotalPacking = zettToNumber_(payload['Total Biaya Packing/Kg (Rp)']);
    const totalPacking = kategoriLaundry.toLowerCase().includes('self service') ? 0 : (frontendTotalPacking || (ppKg + hdKg + jKg + solasiBiayaKg));
    const sumberAir = String(payload.airSumber || '').trim().toLowerCase() || 'pdam';
    const sumberSetrika = String(payload.airBoilerSumber || '').trim().toLowerCase() || 'sama';
    const hargaAir = sumberAir === 'pdam' ? payload.airHargaM3 : '';
    const hargaTangki = sumberAir === 'tangki' ? payload.airHargaTangki : '';
    const literTangki = sumberAir === 'tangki' ? payload.airLiterTangki : '';
    const galonSetrika = sumberSetrika === 'galon' ? payload.airHargaGalon : '';
    const volSetrika = sumberSetrika === 'galon' ? payload.airLiterGalon : '';
    const notaSystemRaw = String(payload.notaType || payload.sistemKasirNota || '').toLowerCase();
    const notaSystem = notaSystemRaw.indexOf('manual') !== -1 ? 'Nota Manual Buku NCR' : 'Aplikasi Kasir (Digital + Kertas Thermal)';
    const notaMethod = zettNormalizeNotaAppFeeType_(payload.metodeBiayaAplikasi || payload.notaAppFeeType);
    const notaIsManual = notaSystem === 'Nota Manual Buku NCR';
    const notaIsDirect = notaMethod === 'Biaya Langsung Per Transaksi';
    const appDirect = !notaIsManual && notaIsDirect ? zettToNumber_(payload.appBiayaPerTransaksi || payload.notaAppHargaTrx || payload.hppAplikasiPerLoad) : 0;
    const appMonthly = !notaIsManual && !notaIsDirect ? zettToNumber_(payload.notaAppHargaBulan || payload.appBiayaBulanan) : 0;
    const appMonthlyTrx = !notaIsManual && !notaIsDirect ? zettToNumber_(payload.notaAppTrxBulan || payload.appEstimasiTrxBulanan) : 0;
    const appExtra = !notaIsManual && !notaIsDirect ? zettToNumber_(payload.notaAppBiayaTransaksiTambahan || payload.appBiayaTransaksiTambahan) : 0;
    const hppAplikasiPerLoad = !notaIsManual
      ? Math.ceil(notaIsDirect ? appDirect : (appMonthlyTrx > 0 ? (appMonthly / appMonthlyTrx) + appExtra : 0))
      : 0;
    const thermalHargaRoll = !notaIsManual ? zettToNumber_(payload.notaThermalHargaRoll || payload.thermalHargaPerRoll) : 0;
    const thermalTransaksiRoll = !notaIsManual ? zettToNumber_(payload.notaThermalTransaksiRoll || payload.thermalTransaksiPerRoll) : 0;
    const thermalBiayaTransaksi = !notaIsManual
      ? Math.ceil(thermalTransaksiRoll > 0 ? thermalHargaRoll / thermalTransaksiRoll : zettToNumber_(payload.notaThermalHarga))
      : 0;
    const manualHargaAwal = notaIsManual ? zettToNumber_(payload.notaManualHarga || payload.manualHargaSatuanAwalNota) : 0;
    const manualJumlahLembar = notaIsManual ? zettToNumber_(payload.notaManualLbrTotal || payload.manualJumlahLembarNota) : 0;
    const manualPly = notaIsManual ? zettToNumber_(payload.notaManualLbrTrx || payload.manualPlyPerTransaksi) : 0;
    const manualHargaLembar = notaIsManual ? Math.ceil(manualJumlahLembar > 0 ? manualHargaAwal / manualJumlahLembar : 0) : 0;
    const manualBiayaTransaksi = notaIsManual ? Math.ceil(manualHargaLembar * manualPly) : 0;
    const hppNotaTransaksiPerLoad = notaIsManual ? manualBiayaTransaksi : thermalBiayaTransaksi;
    const hppNotaKasirPerLoad = hppAplikasiPerLoad + hppNotaTransaksiPerLoad;

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
      'Listrik Pompa Per Load': '=IFERROR(({COL:Watt Pompa}{ROW}/1000)*({COL:Durasi Cuci}{ROW}/60)*{COL:TDL}{ROW}/MAX({COL:Mesin Cuci}{ROW};1);0)',
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

      'Deterjen Aktif': payload.chemDetActive ? 'Ya' : 'Tidak',
      'Tipe Deterjen': payload.chemDetType,
      'Harga Total Deterjen': payload.chemDetHargaBulk,
      'Kap Deterjen Liter': payload.chemDetKapBulk,
      'Harga Deterjen Per Ltr': '=IFERROR({COL:Harga Total Deterjen}{ROW}/MAX({COL:Kap Deterjen Liter}{ROW};1);0)',
      'Harga Deterjen Per Ml': '=IFERROR({COL:Harga Deterjen Per Ltr}{ROW}/1000;0)',
      'Pemakaian Deterjen Per Kg Ml': payload.chemDetPakai,
      'Estimasi Deterjen Per Load': '=IFERROR(IF({COL:Deterjen Aktif}{ROW}="Tidak";0;{COL:Kap Cuci}{ROW}*{COL:Pemakaian Deterjen Per Kg Ml}{ROW}*{COL:Harga Deterjen Per Ml}{ROW});0)',
      'Estimasi Deterjen Per Kg': '=IFERROR({COL:Estimasi Deterjen Per Load}{ROW}/MAX({COL:Kap Cuci}{ROW};1);0)',
      'Pewangi Aktif': payload.chemParActive ? 'Ya' : 'Tidak',
      'Harga Total Pewangi': payload.chemParHargaBulk,
      'Kap Pewangi Liter': payload.chemParKapBulk,
      'Harga Pewangi Per Ltr': '=IFERROR({COL:Harga Total Pewangi}{ROW}/MAX({COL:Kap Pewangi Liter}{ROW};1);0)',
      'Harga Pewangi Per Ml': '=IFERROR({COL:Harga Pewangi Per Ltr}{ROW}/1000;0)',
      'Pemakaian Pewangi Per Kg Ml': payload.chemParPakai,
      'Estimasi Pewangi Per Load': '=IFERROR(IF({COL:Pewangi Aktif}{ROW}="Tidak";0;{COL:Kap Cuci}{ROW}*{COL:Pemakaian Pewangi Per Kg Ml}{ROW}*{COL:Harga Pewangi Per Ml}{ROW});0)',
      'Estimasi Pewangi Per Kg': '=IFERROR({COL:Estimasi Pewangi Per Load}{ROW}/MAX({COL:Kap Cuci}{ROW};1);0)',
      'Softener Aktif': payload.chemSofActive ? 'Ya' : 'Tidak',
      'Tipe Softener': payload.chemSofType,
      'Harga Total Softener': payload.chemSofHargaBulk,
      'Kap Softener Liter': payload.chemSofKapBulk,
      'Harga Softener Per Ltr': '=IFERROR({COL:Harga Total Softener}{ROW}/MAX({COL:Kap Softener Liter}{ROW};1);0)',
      'Harga Softener Per Ml': '=IFERROR({COL:Harga Softener Per Ltr}{ROW}/1000;0)',
      'Pemakaian Softener Per Kg Ml': payload.chemSofPakai,
      'Estimasi Softener Per Load': '=IFERROR(IF({COL:Softener Aktif}{ROW}="Tidak";0;{COL:Kap Cuci}{ROW}*{COL:Pemakaian Softener Per Kg Ml}{ROW}*{COL:Harga Softener Per Ml}{ROW});0)',
      'Estimasi Softener Per Kg': '=IFERROR({COL:Estimasi Softener Per Load}{ROW}/MAX({COL:Kap Cuci}{ROW};1);0)',
      'Pelicin Setrika Aktif': payload.chemPelActive ? 'Ya' : 'Tidak',
      'Tipe Pelicin Setrika': payload.chemPelType,
      'Harga Total Pelicin Setrika': payload.chemPelHargaBulk,
      'Kap Pelicin Setrika Liter': payload.chemPelKapBulk,
      'Harga Pelicin Setrika Per Ltr': '=IFERROR({COL:Harga Total Pelicin Setrika}{ROW}/MAX({COL:Kap Pelicin Setrika Liter}{ROW};1);0)',
      'Harga Pelicin Setrika Per Ml': '=IFERROR({COL:Harga Pelicin Setrika Per Ltr}{ROW}/1000;0)',
      'Pemakaian Pelicin Setrika Per Kg Ml': payload.chemPelPakai,
      'Estimasi Pelicin Setrika Per Load': '=IFERROR(IF({COL:Pelicin Setrika Aktif}{ROW}="Tidak";0;{COL:Kap Cuci}{ROW}*{COL:Pemakaian Pelicin Setrika Per Kg Ml}{ROW}*{COL:Harga Pelicin Setrika Per Ml}{ROW});0)',
      'Estimasi Pelicin Setrika Per Kg': '=IFERROR({COL:Estimasi Pelicin Setrika Per Load}{ROW}/MAX({COL:Kap Cuci}{ROW};1);0)',
      'Chemical Cuci Per Load': '=IFERROR({COL:Estimasi Deterjen Per Load}{ROW}+{COL:Estimasi Softener Per Load}{ROW}+{COL:Estimasi Pewangi Per Load}{ROW}+{COL:Estimasi Pelicin Setrika Per Load}{ROW};0)',
      'Chemical Cuci Per Kg': '=IFERROR({COL:Chemical Cuci Per Load}{ROW}/MAX({COL:Kap Cuci}{ROW};1);0)',
      'Admin Per Order': 0,
      'Harga Buku Nota': manualHargaAwal,
      'Isi Nota': manualJumlahLembar,
      'Lembar Nota Per Order': manualPly,
      'Nota Per Order': hppNotaTransaksiPerLoad,
      'Biaya Kasir Bulanan': appMonthly,
      'Target Order Kasir Per Hari': appMonthlyTrx,
      'Kasir Per Order': hppAplikasiPerLoad,
      'Admin Nota Kasir Per Order': hppNotaKasirPerLoad,
      'Admin Nota Kasir Per Load': hppNotaKasirPerLoad,
      'Admin Nota Kasir Per Kg': hppNotaKasirPerLoad,
      'Sistem Kasir Nota': notaSystem,
      'Metode Biaya Aplikasi': notaIsManual ? '' : notaMethod,
      'App Biaya Per Transaksi': appDirect,
      'App Biaya Bulanan': appMonthly,
      'App Estimasi Trx Bulanan': appMonthlyTrx,
      'App Biaya Transaksi Tambahan': appExtra,
      'Thermal Harga Per Roll': thermalHargaRoll,
      'Thermal Transaksi Per Roll': thermalTransaksiRoll,
      'Thermal Biaya Per Transaksi': thermalBiayaTransaksi,
      'Manual Harga Satuan Awal Nota': manualHargaAwal,
      'Manual Jumlah Lembar Nota': manualJumlahLembar,
      'Manual Ply Per Transaksi': manualPly,
      'Manual Harga Nota Per Lembar': manualHargaLembar,
      'Manual Biaya Nota Per Transaksi': manualBiayaTransaksi,
      'HPP Aplikasi Per Load': hppAplikasiPerLoad,
      'HPP Nota Transaksi Per Load': hppNotaTransaksiPerLoad,

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
