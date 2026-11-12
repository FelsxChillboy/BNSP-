# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Menjalankan aplikasi (frontend + backend + database)

Aplikasi ini memakai **MySQL dari Laragon** dan **REST API Express** di folder `server/`.

**Prasyarat:** Node.js 20+ dan Laragon dengan MySQL aktif di port `3306`.

```bash
# 1. Pastikan MySQL Laragon berjalan (tombol Start di Laragon)

# 2. Install dependency backend
npm --prefix server install

# 3. Buat konfigurasi lokal (default sudah cocok untuk Laragon: root tanpa password)
copy server\.env.example server\.env

# 4. Isi data awal (Budi, Siti, Ahmad) — aman dijalankan berulang
npm run seed

# 5. Jalankan API di terminal pertama (http://localhost:3000)
npm run server

# 6. Jalankan frontend di terminal kedua
npm run dev
```

Buka `http://localhost:5173`. Data anggota tersimpan di database `pelatihan_bnsp`, tabel `members`.

**Endpoint API:**

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/members` | Daftar anggota |
| POST | `/api/members` | Tambah anggota (status Online, rating 0, avatar & id dari server) |
| PUT | `/api/members/:id` | Ubah anggota (body boleh sebagian: data form, status, atau rating) |
| DELETE | `/api/members/:id` | Hapus anggota |

**Test backend:** `npm run test:server` (memakai database terpisah `pelatihan_bnsp_test`).

Saat development, frontend memanggil `/api` dan Vite mem-proxy ke `localhost:3000` (lihat `vite.config.js`).
Untuk build produksi di domain berbeda, tambahkan penanganan CORS/origin di server.

## Template notes

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
