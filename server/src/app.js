import express from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from './db.js';
import { createMemberSchema, updateMemberSchema } from './schema.js';

const COLUMNS = 'id, nama_lengkap, email, posisi, status, rating, avatar';

// Pemetaan kolom snake_case (MySQL) → field camelCase (kontrak API/frontend)
function mapRow(row) {
  return {
    id: row.id,
    namaLengkap: row.nama_lengkap,
    email: row.email,
    posisi: row.posisi,
    status: row.status,
    rating: row.rating,
    avatar: row.avatar,
  };
}

// Express 5 meneruskan error async otomatis; helper ini menjaga kompatibilitas Express 4.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function validate(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return { data: result.data };

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field !== undefined && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }

  return { errors, message: result.error.issues[0].message };
}

export function createApp() {
  const app = express();
  app.use(express.json());

  // Daftar anggota (urut dari yang paling lama agar seed tampil sesuai spesifikasi)
  app.get(
    '/api/members',
    asyncHandler(async (req, res) => {
      const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM members ORDER BY created_at ASC, id ASC`
      );
      res.json(rows.map(mapRow));
    })
  );

  // Tambah anggota: id, status, rating, dan avatar ditentukan server
  app.post(
    '/api/members',
    asyncHandler(async (req, res) => {
      const parsed = validate(createMemberSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      const id = randomUUID();
      const member = {
        id,
        ...parsed.data,
        status: 'Online',
        rating: 0,
        avatar: `https://i.pravatar.cc/150?u=${id}`,
      };

      await pool.query(
        `INSERT INTO members (id, nama_lengkap, email, posisi, status, rating, avatar)
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

      res.status(201).json(member);
    })
  );

  // Ubah anggota (body boleh sebagian)
  app.put(
    '/api/members/:id',
    asyncHandler(async (req, res) => {
      const parsed = validate(updateMemberSchema, req.body);
      if (parsed.errors) {
        return res.status(400).json({
          message: parsed.message,
          errors: parsed.errors,
        });
      }

      const columnByField = {
        namaLengkap: 'nama_lengkap',
        email: 'email',
        posisi: 'posisi',
        status: 'status',
        rating: 'rating',
      };

      const assignments = [];
      const values = [];
      for (const [field, column] of Object.entries(columnByField)) {
        if (parsed.data[field] !== undefined) {
          assignments.push(`${column} = ?`);
          values.push(parsed.data[field]);
        }
      }

      await pool.query(`UPDATE members SET ${assignments.join(', ')} WHERE id = ?`, [
        ...values,
        req.params.id,
      ]);

      const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM members WHERE id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Anggota tim tidak ditemukan' });
      }

      res.json(mapRow(rows[0]));
    })
  );

  // Hapus anggota
  app.delete(
    '/api/members/:id',
    asyncHandler(async (req, res) => {
      const [result] = await pool.query('DELETE FROM members WHERE id = ?', [
        req.params.id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Anggota tim tidak ditemukan' });
      }

      res.status(204).end();
    })
  );

  app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Body JSON tidak valid' });
    }
    console.error('[server] Kesalahan tak terduga:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  });

  return app;
}
