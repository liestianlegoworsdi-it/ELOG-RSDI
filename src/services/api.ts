import { User, Barang, Transaksi } from '../types';

// GANTI URL DI BAWAH INI dengan Web App URL dari Google Apps Script Anda
const API_URL = 'https://script.google.com/macros/s/AKfycbygFPzOS5FcOye8-kzLXGLDGTDJAkRUQjSFawH5nE7Azda6bMtK4Oa5XyFmoKHvg-VMkA/exec';

export async function apiRequest(action: string, method: 'GET' | 'POST' = 'GET', body: any = null) {
  const url = method === 'GET' ? `${API_URL}?action=${action}&_t=${Date.now()}` : API_URL;
  const options: RequestInit = { 
    method, 
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  };
  
  if (method === 'POST') {
    options.body = JSON.stringify({ action, ...body });
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    try {
      const result = JSON.parse(text);
      if (result.status === 'error') {
        throw new Error(`Server Error: ${result.message || 'Unknown error'}`);
      }
      return result.data;
    } catch (e: any) {
      if (e.message.startsWith('Server Error:')) {
        throw e;
      }
      console.error('Failed to parse JSON:', text);
      throw new Error('Respon dari server tidak valid. Pastikan Apps Script sudah di-deploy dengan benar.');
    }
  } catch (err: any) {
    console.error('API Request failed:', err);
    if (err.message === 'Failed to fetch') {
      throw new Error('Gagal terhubung ke server. Pastikan URL Apps Script benar dan sudah di-deploy sebagai "Anyone" (Siapa saja).');
    }
    throw new Error(err.message || 'Koneksi ke server gagal.');
  }
}

export async function getInitialData() {
  return await apiRequest('getInitialData');
}

export async function submitOrder(data: any[], isUpdate: boolean, deletedIds: string[], targetOrder: string) {
  return await apiRequest('submitOrder', 'POST', { data, isUpdate, deletedIds, targetOrder });
}

export async function updateApproval(iddetil: string, status: string, jmlAcc: number, totalAcc: number) {
  return await apiRequest('updateApproval', 'POST', { iddetil, status, jmlAcc, totalAcc });
}

export async function updateMasterBarang(payload: any) {
  return await apiRequest('updateMasterBarang', 'POST', payload);
}

export async function updateTerimaBarang(payload: any) {
  return await apiRequest('updateTerimaBarang', 'POST', payload);
}

export async function updateSettings(payload: any) {
  return await apiRequest('updateSettings', 'POST', payload);
}
