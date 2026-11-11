import { useEffect, useState } from 'react';
import AddMemberForm from './AddMemberForm';
import TeamCard from './TeamCard';

// Kunci penyimpanan localStorage untuk persistensi data anggota tim
const STORAGE_KEY = 'team-members-v1';

// Data awal (mock) sesuai spesifikasi
const INITIAL_MEMBERS = [
  { id: 1, namaLengkap: 'Budi Santoso', email: 'budi.santoso@perusahaan.com', posisi: 'Frontend Dev', status: 'Online', rating: 2, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, namaLengkap: 'Siti Rahma', email: 'siti.rahma@perusahaan.com', posisi: 'UI/UX Designer', status: 'Offline', rating: 5, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, namaLengkap: 'Ahmad Fauzi', email: 'ahmad.fauzi@perusahaan.com', posisi: 'Backend Engineer', status: 'Online', rating: 1, avatar: 'https://i.pravatar.cc/150?u=3' },
];

// Ambil data dari localStorage; fallback ke mock data jika kosong atau korup
function loadMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_MEMBERS;
    const parsed = JSON.parse(raw);
    // Validasi bentuk data: harus array of object dengan field esensial
    // yang benar tipenya — jika korup, fallback ke mock data agar app tetap render
    const isValid = Array.isArray(parsed) && parsed.every(m =>
      m && typeof m === 'object' &&
      typeof m.namaLengkap === 'string' &&
      typeof m.posisi === 'string' &&
      (m.status === 'Online' || m.status === 'Offline') &&
      typeof m.rating === 'number'
    );
    return isValid ? parsed : INITIAL_MEMBERS;
  } catch {
    return INITIAL_MEMBERS;
  }
}

function TeamDirectory() {
  // State diinisialisasi (lazy) dari localStorage saat render pertama —
  // fallback ke mock data jika kosong atau korup
  const [members, setMembers] = useState(loadMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [editId, setEditId] = useState(null);

  // 1. Persistensi: simpan setiap kali members berubah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  // 2. Statistik Reaktif (Total / Online / Offline)
  const totalMembers = members.length;
  const onlineMembers = members.filter(m => m.status === 'Online').length;
  const offlineMembers = members.filter(m => m.status === 'Offline').length;

  // 3. Filter Live Search berdasarkan nama lengkap
  const filteredMembers = members.filter(m =>
    m.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. Handler Warisan (Modul 1.3 & 1.4): toggle status & beri bintang
  const handleToggleStatus = (id) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'Online' ? 'Offline' : 'Online' } : m));
  };
  const handleAddStar = (id) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, rating: m.rating + 1 } : m));
  };

  // 5. CRUD — Create & Update (dipanggil oleh form submit)
  const handleSubmit = (formData) => {
    if (editId !== null) {
      // Mode Update: timpa data lama berdasarkan editId via map(), lalu kembali ke mode Tambah
      setMembers(prev => prev.map(m => (m.id === editId ? { ...m, ...formData } : m)));
      setEditId(null);
    } else {
      // Mode Create: generate ID acak, default status Online dengan 0 Bintang
      const id = crypto.randomUUID();
      const newMember = {
        id,
        ...formData,
        status: 'Online',
        rating: 0,
        avatar: `https://i.pravatar.cc/150?u=${id}`,
      };
      setMembers(prev => [newMember, ...prev]);
    }
  };

  // 6. CRUD — Delete (dengan konfirmasi window.confirm)
  const handleDelete = (id) => {
    if (!window.confirm('Yakin ingin menghapus anggota tim ini?')) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    // Batalkan mode edit jika anggota yang dihapus sedang diedit
    if (editId === id) setEditId(null);
  };

  // 7. CRUD — masuk mode Edit (form di atas akan terisi data anggota ini)
  const handleEdit = (id) => setEditId(id);

  const editingMember = editId !== null
    ? (members.find(m => m.id === editId) || null)
    : null;

  return (
    <div className="w-full">
      {/* Kartu Statistik Dinamis */}
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        <div className="min-w-[120px] rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-center shadow-sm">
          <div className="text-2xl font-bold leading-tight text-sky-600">{totalMembers}</div>
          <div className="mt-1 text-[13px] font-medium text-slate-500">Total Members</div>
        </div>
        <div className="min-w-[120px] rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-center shadow-sm">
          <div className="text-2xl font-bold leading-tight text-green-600">{onlineMembers}</div>
          <div className="mt-1 text-[13px] font-medium text-slate-500">Online</div>
        </div>
        <div className="min-w-[120px] rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-center shadow-sm">
          <div className="text-2xl font-bold leading-tight text-slate-500">{offlineMembers}</div>
          <div className="mt-1 text-[13px] font-medium text-slate-500">Offline</div>
        </div>
      </div>

      {/* Form Tambah / Edit Anggota — key berubah saat editId berubah,
          sehingga form ter-remount dan terisi data anggota yang diedit */}
      <AddMemberForm
        key={editId ?? 'new'}
        onSubmit={handleSubmit}
        editingMember={editingMember}
        onCancelEdit={() => setEditId(null)}
      />

      {/* Live Search */}
      <input
        type="text"
        placeholder="Cari nama anggota tim..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mx-auto mb-8 block w-full max-w-md rounded-xl border-[1.5px] border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-[3px] focus:ring-sky-600/15"
      />

      {/* Grid Kartu Anggota */}
      <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-[15px] text-slate-500">
            ⚠️ Tidak ada anggota tim yang cocok dengan kata kunci "{searchQuery}".
          </div>
        ) : (
          filteredMembers.map(member => (
            <TeamCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onAddStar={handleAddStar}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TeamDirectory;
