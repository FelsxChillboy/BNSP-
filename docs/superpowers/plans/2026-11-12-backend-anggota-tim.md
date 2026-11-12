# Backend + Database untuk Dashboard "Anggota Tim"

**Goal:** Menambahkan backend Node.js/Express + MySQL (Laragon) dengan REST API `GET/POST/PUT/DELETE /api/members`, lalu mengganti localStorage frontend dengan panggilan API tersebut.

**Architecture:** Folder `server/` (Express + mysql2 + Zod) di repo yang sama. MySQL 8.4 dari Laragon (`localhost:3306`, user `root`, tanpa password). Frontend dev memakai Vite proxy `/api` → `http://localhost:3000` sehingga bebas CORS. Database = sumber kebenaran (localStorage dihapus).

**Tech Stack:** Node 24, Express, mysql2/promise, Zod, React 19 + Vite 8.

## Global Constraints

- Kontrak data API tetap camelCase: `{ id, namaLengkap, email, posisi, status, rating, avatar }`
- Tabel `members`: kolom snake_case, `id CHAR(36)`, status `ENUM('Online','Offline')`, rating `INT`, avatar URL
- Seed 3 anggota: Budi Santoso (Frontend Dev, Online, 2★), Siti Rahma (UI/UX Designer, Offline, 5★), Ahmad Fauzi (Backend Engineer, Online, 1★)
- Nama state/fungsi/UI frontend tidak berubah (`searchQuery`, `editId`, `handleDelete`, `handleSubmit`, label & placeholder persis)
- `App.css`, `App.jsx`, `NewsFeed.jsx` tidak diubah
- Kredensial DB lewat `server/.env` (tidak di-commit); `.env.example` di-commit
- Error API → pesan Bahasa Indonesia + status code tepat (400/404/500)
- Verifikasi: `node --test` untuk API, `npm run lint` + `npm run build` untuk frontend, smoke test curl, uji manual browser

## Rulings awal

1. MySQL Laragon tadinya mati; dinyalakan lewat `mysqld --defaults-file=...` karena paket Laragon tidak punya service terdaftar. User tetap bisa memakai tombol Start di Laragon.
2. TDD backend memakai `node:test` bawaan Node (tanpa framework baru). Database test terpisah: `pelatihan_bnsp_test`.
3. Tanpa paket `cors`: dev memakai Vite proxy. Untuk produksi perlu origin eksplisit (didokumentasikan).
4. `PUT /api/members/:id` menerima body parsial agar tombol warisan "Beri Bintang" dan "Ubah Status" ikut tersimpan ke DB.

---

### Task 1: Scaffold `server/`

**Files:** `server/package.json`, `server/.env.example`, `server/src/db.js`, `.gitignore`

- [ ] `npm init -y` di `server/` (type module), install `express mysql2 zod`
- [ ] `db.js`: buat database jika belum ada, buat tabel `members` jika belum ada, export `pool`
- [ ] `.env.example` + `.env` lokal; `.gitignore` menambahkan `server/.env`

### Task 2: TDD API members

**Files:** `server/src/schema.js`, `server/src/app.js`, `server/src/index.js`, `server/src/seed.js`, `server/test/members.test.js`

- [ ] Tulis test lebih dulu (CRUD, validasi 400, 404) memakai test DB
- [ ] Jalankan → merah
- [ ] Implementasi route + validasi Zod + mapping row→camelCase
- [ ] Jalankan → hijau
- [ ] `npm run seed` mengisi 3 anggota (idempoten)

### Task 3: Integrasi frontend

**Files:** `src/api/members.js` (baru), `src/component/TeamDirectory.jsx`, `src/component/AddMemberForm.jsx`, `vite.config.js`, `package.json` (script bantu)

- [ ] `vite.config.js`: proxy `/api` → `http://localhost:3000`
- [ ] `src/api/members.js`: `listMembers`, `createMember`, `updateMember`, `deleteMember`
- [ ] `TeamDirectory`: GET saat mount, POST saat tambah, PUT saat edit/status/bintang, DELETE saat hapus; state loading/error; localStorage dihapus
- [ ] `AddMemberForm`: submit async, pertahankan isian jika gagal, disable tombol saat menyimpan
- [ ] Script root: `npm run server`, `npm run seed`

### Task 4: Verifikasi end-to-end

- [ ] `node --test` (server) hijau
- [ ] Smoke test HTTP semua endpoint
- [ ] `npm run lint` (hanya error pre-existing NewsFeed) + `npm run build`
- [ ] Uji manual browser: tambah/edit/hapus/bintang/status, refresh (data dari DB)
- [ ] Update README dengan cara menjalankan
