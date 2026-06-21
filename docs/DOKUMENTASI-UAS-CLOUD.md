# Dokumentasi UAS Cloud Computing
## Service Tracking — Migrasi ke Layanan Cloud Berbayar

---

## 1. Deskripsi Aplikasi

**Service Tracking** adalah aplikasi web berbasis Next.js yang digunakan untuk melacak status barang yang sedang dalam proses servis. Aplikasi ini bersifat general dan dapat digunakan oleh service center manapun — mulai dari toko servis laptop/HP/elektronik skala kecil hingga menengah.

### Fitur Utama
- **Halaman Tracking (Publik)** — pelanggan dapat mencari status barang berdasarkan kode servis, serial number, atau nama barang
- **Halaman Admin** — pengelolaan data barang masuk, edit status, dan hapus data
- **Tambah Barang** — form input barang baru dengan kode servis auto-generate
- **Riwayat Servis** — timeline log perubahan status barang
- **Notifikasi WhatsApp** — otomatis membuka WA ke nomor pelanggan dengan pesan update status saat admin menyimpan perubahan

### Alur Status Servis
```
Diterima → Menunggu Antrian → Pemesanan Sparepart (opsional) → Proses Pengerjaan & Testing → Selesai Service
```

| Status | Keterangan |
|---|---|
| DITERIMA | Barang baru diterima di counter |
| MENUNGGU_ANTRIAN | Menunggu giliran dikerjakan |
| PEMESANAN_SPAREPART | Sedang memesan suku cadang |
| PROSES_PENGERJAAN | Barang sedang diperbaiki & diuji |
| SELESAI | Perbaikan selesai, siap diambil |

---

## 2. Arsitektur Sistem

### 2.1 Arsitektur UTS (Sebelum — Gratis)

```
┌─────────────────────────────────────────────┐
│              USER / BROWSER                 │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────┐
│           VERCEL (Free Tier)                │
│         Next.js Hosting & SSR               │
│    (Auto-deploy dari GitHub push)           │
└─────────────────┬───────────────────────────┘
                  │ Supabase JS Client
┌─────────────────▼───────────────────────────┐
│         SUPABASE (Free Tier)                │
│      PostgreSQL Database (DBaaS)            │
│   Tabel: service_items, service_logs        │
└─────────────────────────────────────────────┘
```

| Layer | Teknologi | Biaya |
|---|---|---|
| Hosting | Vercel Free | Rp 0 |
| Database | Supabase Free | Rp 0 |
| Source Control | GitHub | Rp 0 |

---

### 2.2 Arsitektur UAS (Sesudah — Berbayar)

```
┌─────────────────────────────────────────────┐
│              USER / BROWSER                 │
└─────────────────┬───────────────────────────┘
                  │ HTTP
┌─────────────────▼───────────────────────────┐
│      VPS RUMAHWEB S (Berbayar)              │
│         IP: 103.247.8.227:3000              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         PM2 Process Manager         │   │
│  │   (menjaga app tetap berjalan)      │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │       Next.js 16 Application        │   │
│  │    (Node.js 20 Runtime)             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Spesifikasi: 1 vCPU | 1GB RAM | 20GB SSD  │
│  OS: AlmaLinux 8.9 x86_64                  │
│  Lokasi: TechnoVillage (Indonesia)          │
└─────────────────┬───────────────────────────┘
                  │ Supabase JS Client
┌─────────────────▼───────────────────────────┐
│         SUPABASE (Free Tier)                │
│      PostgreSQL Database (DBaaS)            │
│   Tabel: service_items, service_logs        │
└─────────────────────────────────────────────┘
```

| Layer | Teknologi | Tipe Layanan | Biaya |
|---|---|---|---|
| **Compute/Hosting** | **VPS RumahWeb S** | **IaaS (Berbayar)** | **Rp 60.000/bulan** |
| Runtime | Node.js 20 + PM2 | — | Rp 0 |
| Framework | Next.js 16 | — | Rp 0 |
| Database | Supabase PostgreSQL | DBaaS | Rp 0 |
| Source Control | GitHub | — | Rp 0 |

> **Catatan:** VPS RumahWeb masuk kategori **IaaS (Infrastructure as a Service)** — pengguna mendapat kontrol penuh atas server (OS, runtime, konfigurasi), berbeda dengan PaaS seperti Vercel yang abstraksi infrastrukturnya lebih tinggi.

---

## 3. Teknologi yang Digunakan

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.2.4 | Framework React fullstack |
| React | 19.2.4 | UI Library |
| Node.js | 20.20.2 | JavaScript runtime |
| PM2 | Latest | Process manager — menjaga app tetap hidup 24/7 |
| Supabase JS | 2.x | Client library koneksi ke database |
| PostgreSQL | (via Supabase) | Database relasional |
| AlmaLinux | 8.9 | OS server VPS |
| Bootstrap Icons | CDN | Icon library |
| WhatsApp (wa.me) | — | Notifikasi ke pelanggan via link WA |

---

## 4. Struktur Database

### Tabel: `service_items`
Menyimpan data barang yang masuk untuk diservis.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key (auto) |
| kode_aset | VARCHAR | Kode servis auto-generate (format: SRV-YYYYMMDD-XXXX) |
| nama_barang | VARCHAR | Nama barang |
| kategori_barang | VARCHAR | Kategori barang (opsional) |
| pemilik_asal | VARCHAR | Nama pelanggan |
| no_hp_pelanggan | VARCHAR | Nomor HP/WA pelanggan (untuk notifikasi) |
| email_pelanggan | VARCHAR | Email pelanggan (opsional, data saja) |
| merk | VARCHAR | Merk/tipe barang (opsional) |
| serial_number | VARCHAR | Serial number (opsional) |
| keluhan | TEXT | Deskripsi keluhan/kerusakan |
| status_terakhir | VARCHAR | Status terkini barang |
| lokasi_terakhir | VARCHAR | Lokasi terkini barang |
| created_at | TIMESTAMP | Waktu record dibuat |
| updated_at | TIMESTAMP | Waktu terakhir diupdate |

### Tabel: `service_logs`
Menyimpan riwayat perubahan status barang.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key (auto) |
| service_item_id | UUID | Foreign key ke service_items |
| status | VARCHAR | Status pada log ini |
| lokasi | VARCHAR | Lokasi pada log ini |
| catatan_update | TEXT | Catatan/keterangan update |
| created_at | TIMESTAMP | Waktu log dibuat |

### Query Migrasi Kolom Baru
```sql
-- Jalankan di Supabase SQL Editor
ALTER TABLE service_items ADD COLUMN email_pelanggan TEXT;
ALTER TABLE service_items ADD COLUMN no_hp_pelanggan TEXT;
```

---

## 5. Struktur Direktori Project

```
service-tracking-ga/
├── src/
│   ├── app/
│   │   ├── page.js                  # Root → redirect ke /tracking
│   │   ├── layout.js                # Layout global (Bootstrap, fonts)
│   │   ├── globals.css              # Global styles
│   │   ├── tracking/
│   │   │   └── page.js              # Halaman publik tracking barang
│   │   └── admin/
│   │       ├── page.js              # Dashboard admin (daftar semua barang)
│   │       ├── create/
│   │       │   └── page.js          # Form tambah barang baru
│   │       └── edit/[id]/
│   │           └── page.js          # Form update status barang
│   └── lib/
│       └── supabaseClient.js        # Inisialisasi Supabase client
├── docs/
│   └── DOKUMENTASI-UAS-CLOUD.md    # Dokumentasi ini
├── public/                          # Asset statis
├── package.json                     # Dependencies
└── next.config.mjs                  # Konfigurasi Next.js
```

---

## 6. Mekanisme Notifikasi WhatsApp

Notifikasi ke pelanggan menggunakan **wa.me link** — gratis, tanpa API berbayar, dan works di semua device (HP maupun desktop).

**Alur:**
1. Admin membuka halaman edit barang
2. Admin memilih status terbaru dan mengisi catatan
3. Admin klik **"Simpan & Kirim Notifikasi"**
4. Sistem menyimpan perubahan ke database
5. Browser **otomatis membuka tab baru** ke `wa.me/{no_hp}?text={pesan_otomatis}`
6. Admin tinggal klik "Kirim" di WhatsApp

**Format pesan otomatis:**
```
Halo {nama_pelanggan}, kami ingin menginformasikan update terbaru barang servis Anda:

📦 Barang   : {nama_barang}
🔖 Kode     : {kode_servis}
📍 Status   : {status_terbaru}
📝 Catatan  : {catatan_admin}

Terima kasih telah mempercayakan servis kepada kami.
```

---

## 7. Proses Deployment

### 7.1 Setup Awal VPS (Dilakukan Sekali)

```bash
# 1. Login ke VPS via SSH
ssh root@103.247.8.227

# 2. Update sistem
dnf update -y

# 3. Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# 4. Install PM2 & Git
npm install -g pm2
dnf install -y git

# 5. Clone repository
git clone https://github.com/iyunn/service-tracking-ga.git
cd service-tracking-ga

# 6. Install dependencies
npm install

# 7. Buat file environment variables
vi .env.local
# Isi:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 8. Build & jalankan
npm run build
pm2 start npm --name "service-tracking-ga" -- start
pm2 startup && pm2 save
```

### 7.2 Mekanisme Update Code (Setiap Ada Perubahan)

```
[Codespace]          [GitHub]           [VPS RumahWeb]
    │                   │                     │
    │── git push ──────►│                     │
    │                   │                     │
    │              SSH dari laptop            │
    │                   │◄── git pull ────────│
    │                   │     npm run build   │
    │                   │     pm2 restart     │
    │                   │                     │
    │                   │              App versi baru live ✅
```

**Perintah update di VPS (1 baris):**
```bash
cd service-tracking-ga && git pull && npm run build && pm2 restart service-tracking-ga
```

---

## 8. Perbandingan Arsitektur UTS vs UAS

| Aspek | UTS (Vercel — Gratis) | UAS (VPS RumahWeb — Berbayar) |
|---|---|---|
| **Tipe Layanan** | PaaS | IaaS |
| **Biaya** | Rp 0 | Rp 60.000/bulan |
| **Deploy** | Auto (push = deploy) | Manual via SSH |
| **Kontrol Server** | Terbatas | Penuh (root access) |
| **Skalabilitas** | Otomatis | Manual (upgrade paket) |
| **OS** | Abstrak (tidak terlihat) | AlmaLinux 8.9 |
| **Runtime Management** | Otomatis oleh Vercel | Manual via PM2 |
| **Cocok untuk** | Prototyping cepat | Production & pembelajaran DevOps |

---

## 9. Akses Aplikasi

| Halaman | URL |
|---|---|
| Tracking (Publik) | `http://103.247.8.227:3000/tracking` |
| Admin Dashboard | `http://103.247.8.227:3000/admin` |
| Tambah Barang | `http://103.247.8.227:3000/admin/create` |

---

## 10. Perintah PM2 yang Berguna

```bash
pm2 list                           # Cek status semua app
pm2 logs service-tracking-ga      # Lihat log real-time
pm2 restart service-tracking-ga   # Restart app
pm2 stop service-tracking-ga      # Stop app
pm2 monit                         # Monitor CPU & RAM
```

---

## 11. Catatan Penting

- File `.env.local` **tidak boleh di-commit** ke GitHub — berisi credentials Supabase
- VPS aktif 24/7 selama subscription aktif — **jatuh tempo: 21 Juli 2026**
- Supabase free tier akan **pause otomatis** jika tidak ada aktivitas selama 7 hari — akses app secara berkala sebelum demo
- Port yang digunakan adalah **3000** — akses via `http://` bukan `https://` (belum setup SSL)
- Kode servis di-generate otomatis dengan format `SRV-YYYYMMDD-XXXX` — tidak perlu input manual
- Fitur notifikasi WA menggunakan `wa.me` link — **gratis, tanpa API berbayar**, works di HP & desktop
