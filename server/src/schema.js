import { z } from 'zod';

// Pesan validasi sengaja sama dengan pesan di form frontend (Zod) agar konsisten.
export const createMemberSchema = z.object({
  namaLengkap: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(120, 'Nama lengkap maksimal 120 karakter'),
  email: z.email('Format email tidak valid').max(160, 'Email maksimal 160 karakter'),
  posisi: z
    .string()
    .trim()
    .min(1, 'Wajib memilih salah satu peran tim')
    .max(80, 'Posisi maksimal 80 karakter'),
});

// PUT menerima sebagian field (form edit mengirim 3 field; tombol status/bintang 1 field).
export const updateMemberSchema = z
  .object({
    namaLengkap: z
      .string()
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter')
      .max(120, 'Nama lengkap maksimal 120 karakter'),
    email: z.email('Format email tidak valid').max(160, 'Email maksimal 160 karakter'),
    posisi: z
      .string()
      .trim()
      .min(1, 'Wajib memilih salah satu peran tim')
      .max(80, 'Posisi maksimal 80 karakter'),
    status: z.enum(['Online', 'Offline'], 'Status harus Online atau Offline'),
    rating: z
      .number('Rating harus berupa angka')
      .int('Rating harus bilangan bulat')
      .min(0, 'Rating minimal 0'),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Tidak ada data yang diubah',
  });
