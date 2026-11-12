import { ensureSchema, pool } from './db.js';

// Data awal sesuai spesifikasi pelatihan. Idempoten: data yang sudah ada
// (termasuk hasil edit user) tidak ditimpa.
const SEED_MEMBERS = [
  {
    id: '1',
    namaLengkap: 'Budi Santoso',
    email: 'budi.santoso@perusahaan.com',
    posisi: 'Frontend Dev',
    status: 'Online',
    rating: 2,
    avatar: 'https://i.pravatar.cc/150?u=1',
  },
  {
    id: '2',
    namaLengkap: 'Siti Rahma',
    email: 'siti.rahma@perusahaan.com',
    posisi: 'UI/UX Designer',
    status: 'Offline',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=2',
  },
  {
    id: '3',
    namaLengkap: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@perusahaan.com',
    posisi: 'Backend Engineer',
    status: 'Online',
    rating: 1,
    avatar: 'https://i.pravatar.cc/150?u=3',
  },
];

await ensureSchema();

for (const member of SEED_MEMBERS) {
  await pool.query(
    `INSERT IGNORE INTO members (id, nama_lengkap, email, posisi, status, rating, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id,
      member.namaLengkap,
      member.email,
      member.posisi,
      member.status,
      member.rating,
      member.avatar,
    ]
  );
}

const [rows] = await pool.query('SELECT COUNT(*) AS total FROM members');
console.log(`Seed selesai. Total anggota di database: ${rows[0].total}`);

await pool.end();
