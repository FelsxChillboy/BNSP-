# Implementasi CRUD Dashboard "Anggota Tim"

> **Untuk pekerja agentic:** REQUIRED SUB-SKILL: gunakan superpowers:subagent-driven-development (direkomendasikan) atau superpowers:executing-plans untuk mengimplementasikan rencana ini tugas-per-tugas. Langkah memakai sintaks checkbox (`- [ ]`).

**Goal:** Rewrite fitur "Anggota Tim" menjadi CRUD penuh (tambah / cari / edit / hapus) sesuai spesifikasi pelatihan BNSP, dengan styling Tailwind CSS.

**Architecture:** Semua state di parent `TeamDirectory` (lifting-state-up): `members`, `searchQuery`, `editId`. `AddMemberForm` jadi form dua-mode (tambah/edit) dengan validasi Zod. `TeamCard` kartu anggota + tombol aksi CRUD. Persistensi localStorage via `useEffect`. Tanpa backend (repo frontend-only).

**Tech Stack:** React 19 hooks, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`, **tanpa preflight**), Zod 4.

**Spec:** Desain singkat yang disetujui di percakapan sesi ini — dirangkum di Global Constraints berikut.

## Global Constraints

- Struktur data persis: `{ id, namaLengkap, email, posisi, status, rating, avatar }`
- Nama persis dari spesifikasi: state `searchQuery`, state `editId`, fungsi `handleDelete(id)`, `handleSubmit`, tombol `'+ Tambah Anggota'` ↔ `'Simpan Perubahan'`, placeholder `'Cari nama anggota tim...'`, label `'Nama Lengkap'`, `'Email Perusahaan'`, `'Posisi / Peran Tim'`
- Mock data awal: Budi Santoso (Frontend Dev, Online, 2★), Siti Rahma (UI/UX Designer, Offline, 5★), Ahmad Fauzi (Backend Engineer, Online, 1★) — masing-masing dengan email perusahaan (pola `nama.akhir@perusahaan.com`) dan avatar `https://i.pravatar.cc/150?u=<n>`
- Create: ID acak `crypto.randomUUID()`, status default `'Online'`, rating `0`, avatar `https://i.pravatar.cc/150?u=<id>`, lalu reset form kosong
- Update: klik Edit → prefill form + tombol jadi 'Simpan Perubahan'; submit → `map()` timpa data by `editId`; form kembali ke mode 'Tambah'
- Delete: `window.confirm()` dulu, lalu `filter()`; jika anggota yang dihapus sedang diedit → reset `editId`
- Fitur warisan modul sebelumnya tetap ada: `handleToggleStatus`, `handleAddStar`
- Tanpa REST API/backend — local state + localStorage saja (paragraf opsional API tidak berlaku)
- Semua styling fitur ini pakai Tailwind; **jangan pakai nama class lama dari `App.css`** pada komponen yang di-rewrite (CSS lama unlayered menang dari utility Tailwind ber-layer)
- `App.css`, `NewsFeed.jsx`, `App.jsx` tidak diubah; tab Berita harus tetap tampil sama
- Verifikasi: `npm run lint` + `npm run build` + alur manual di dev server — **tanpa test runner** (belum ada di repo, di luar scope yang disetujui)

## Review Focus

Lima kondisi yang paling mungkin menggigit, dipin ke langkah verifikasi manual di Task 2:

1. Pencarian tanpa hasil → tampil empty state, tidak crash (uji: cari "zzz")
2. Menghapus anggota yang sedang diedit → form otomatis kembali ke mode tambah (uji: klik Edit lalu Hapus anggota itu)
3. localStorage berisi JSON korup → fallback ke mock data awal, app tetap render (uji: isi `team-members-v1` dengan string sampah lalu refresh)
4. Submit dengan field kosong → Zod memblokir + pesan error per field (uji: submit form kosong)
5. Data hasil CRUD bertahan setelah refresh (persist) — dicek ulang di Task 3

---

### Task 1: Setup Tailwind v4 tanpa preflight

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json` (via `npm install`)
- Create: `src/index.css`
- Modify: `src/main.jsx` (import css)

**Interfaces:**
- Produces: utility Tailwind aktif untuk seluruh komponen; `src/index.css` diimpor di `main.jsx` sebelum `App.css`

- [ ] **Step 1: Install dependency**

Run: `npm install tailwindcss @tailwindcss/vite`
Expected: terpasang tanpa error peer-deps fatal

- [ ] **Step 2: Daftarkan plugin di `vite.config.js`**

Tambahkan `import tailwindcss from '@tailwindcss/vite'` dan masukkan `tailwindcss()` ke array `plugins` setelah `react()`.

- [ ] **Step 3: Buat `src/index.css` (entry tanpa preflight)**

Konten persis:

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
```

(preflight sengaja tidak diimpor supaya reset CSS global Tailwind tidak mengubah header app & tab Berita)

- [ ] **Step 4: Import di `main.jsx`**

Tambahkan `import './index.css'` sebelum `import './App.css'`.

- [ ] **Step 5: Verifikasi build**

Run: `npm run build`
Expected: sukses tanpa error. Tab Berita & header tidak berubah (tidak ada CSS global baru).

- [ ] **Step 6: Commit**

```bash
git add vite.config.js package.json package-lock.json src/index.css src/main.jsx
git commit -m "chore: setup tailwind v4 tanpa preflight"
```

### Task 2: Rewrite tiga komponen CRUD

**Files:**
- Modify: `src/component/TeamDirectory.jsx` (rewrite total)
- Modify: `src/component/AddMemberForm.jsx` (rewrite total)
- Modify: `src/component/TeamCard.jsx` (rewrite total)

**Interfaces:**
- `TeamDirectory` → `AddMemberForm`: `onSubmit(formData)`, `editingMember` (object anggota | null), `onCancelEdit()`
- `TeamDirectory` → `TeamCard`: seluruh field member + `onEdit(id)`, `onDelete(id)`, `onToggleStatus(id)`, `onAddStar(id)`
- State parent: `members` (array), `searchQuery` (string), `editId` (string id | null)
- Kunci localStorage: `'team-members-v1'`
- `handleSubmit(formData: { namaLengkap, email, posisi })` di parent: branch create (id random, status 'Online', rating 0, unshift) vs branch update (`map()` timpa by `editId`, reset `editId`)
- Zod schema di form: `namaLengkap` min 3, `email` format email, `posisi` min 1 — pesan: 'Nama lengkap minimal 3 karakter', 'Format email tidak valid', 'Wajib memilih salah satu peran tim'
- Dropdown posisi: Frontend Dev, Backend Engineer, UI/UX Designer

- [ ] **Step 1: Rewrite `TeamDirectory.jsx`**

State + dua `useEffect` (load localStorage saat mount dengan fallback mock data; save setiap `members` berubah), statistik reaktif (Total/Online/Offline), `filteredMembers` filter `namaLengkap` case-insensitive by `searchQuery`, handler CRUD + warisan, render: stats bar → form → search → grid → empty state. Semua class Tailwind.

- [ ] **Step 2: Rewrite `AddMemberForm.jsx`**

`formData { namaLengkap, email, posisi }` controlled inputs, Zod validate saat submit (`e.preventDefault()` dulu), `useEffect` prefill/clear form saat `editingMember` berubah, tombol submit dua-mode ('+ Tambah Anggota' / 'Simpan Perubahan', tetap biru `bg-sky-600`), tombol 'Batal' hanya saat mode edit, error merah per field.

- [ ] **Step 3: Rewrite `TeamCard.jsx`**

Kartu Tailwind: avatar bulat, `namaLengkap`, `posisi`, badge status (emerald=Online, slate=Offline), badge `⭐ {rating} Bintang` (amber), dua baris aksi: baris 1 tombol warisan '⭐ Beri Bintang' + 'Ubah ke Online/Offline', baris 2 tombol kecil '✏️ Edit' (sky) + '🗑️ Hapus' (red).

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: 0 error

- [ ] **Step 5: Verifikasi manual di dev server**

Run: `npm run dev` — checklist: tambah anggota baru (status Online, 0★), submit kosong → error Zod, edit → prefill + 'Simpan Perubahan' + data ter-update, Batal → kembali mode tambah, hapus → confirm muncul + kartu hilang, hapus anggota yang sedang diedit → form reset, cari nama → filter live, cari "zzz" → empty state, statistik ikut berubah, localStorage korup → fallback mock.

- [ ] **Step 6: Commit**

```bash
git add src/component/TeamDirectory.jsx src/component/AddMemberForm.jsx src/component/TeamCard.jsx
git commit -m "feat: crud lengkap dashboard anggota tim (tambah/edit/hapus)"
```

### Task 3: Verifikasi end-to-end

- [ ] **Step 1: Lint + build**

Run: `npm run lint` dan `npm run build`
Expected: keduanya sukses

- [ ] **Step 2: Persistensi & regresi**

Refresh halaman setelah manipulasi CRUD → data tetap ada (localStorage). Tab "Berita Terkini" tampil sama seperti sebelumnya.

- [ ] **Step 3: Commit final (jika ada perbaikan)**

```bash
git add -A && git commit -m "fix: perbaikan hasil verifikasi end-to-end"
```
