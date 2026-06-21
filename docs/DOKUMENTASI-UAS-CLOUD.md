# Dokumentasi UAS Cloud Computing
## Service Tracking GA — Migrasi ke Layanan Cloud Berbayar

---

## 1. Deskripsi Aplikasi

**Service Tracking GA** adalah aplikasi web berbasis Next.js yang dibangun untuk melacak status barang yang sedang dalam proses servis di divisi General Affairs.

### Fitur Utama
- **Halaman Tracking** — pengguna dapat mencari barang berdasarkan kode aset, serial number, atau nama pemilik
- **Halaman Admin** — pengelolaan data barang masuk, edit, dan hapus data
- **Tambah Barang** — form input barang baru yang masuk untuk diservis
- **Riwayat Perbaikan** — timeline log status perubahan barang (diterima → diproses → selesai, dst.)
- **Status Badge** — 8 status berbeda dengan warna dan ikon yang jelas

### Status yang Tersedia
| Status | Keterangan |
|---|---|
| DITERIMA_GA | Barang baru diterima di GA |
| DIKIRIM_KE_SERVICE | Barang dikirim ke teknisi/vendor |
| SEDANG_DIPROSES | Barang sedang diperbaiki |
| MENUNGGU_SPAREPART | Menunggu ketersediaan suku cadang |
| SELESAI_DISERVICE | Perbaikan selesai |
| TIDAK_BISA_DISERVICE | Barang tidak dapat diperbaiki |
| REKOMENDASI_PEMUSNAHAN | Direkomendasikan untuk dimusnahkan |
| DIKEMBALIKAN | Barang sudah dikembalikan ke pemilik |

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

> **Catatan:** Layanan berbayar yang digunakan adalah **VPS RumahWeb** yang masuk kategori **IaaS (Infrastructure as a Service)** — pengguna mendapat kontrol penuh atas server (OS, runtime, konfigurasi), berbeda dengan PaaS seperti Vercel yang abstraksi infrastrukturnya lebih tinggi.

---

## 3. Teknologi yang Digunakan

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.2.4 | Framework React fullstack |
| React | 19.2.4 | UI Library |
| Node.js | 20.20.2 | JavaScript runtime |
| PM2 | Latest | Process manager — menjaga app tetap hidup |
| Supabase JS | 2.x | Client library untuk koneksi ke database |
| PostgreSQL | (via Supabase) | Database relasional |
| AlmaLinux | 8.9 | OS server VPS |
| Bootstrap Icons | CDN | Icon library |

---

## 4. Struktur Database

### Tabel: `service_items`
Menyimpan data barang yang masuk untuk diservis.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| kode_aset | VARCHAR | Kode unik aset (ex: C06.001002) |
| nama_barang | VARCHAR | Nama barang |
| nama_pemilik | VARCHAR | Nama pemilik barang |
| pemilik_asal | VARCHAR | Unit/divisi asal |
| unit | VARCHAR | Unit organisasi |
| lokasi | VARCHAR | Lokasi barang |
| merk | VARCHAR | Merk barang |
| tipe | VARCHAR | Tipe/model barang |
| serial_number | VARCHAR | Serial number barang |
| keluhan | TEXT | Keluhan/kerusakan yang dilaporkan |
| tanggal_masuk | DATE | Tanggal barang diterima |
| status_terakhir | VARCHAR | Status terkini barang |

### Tabel: `service_logs`
Menyimpan riwayat perubahan status barang.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| service_item_id | UUID | Foreign key ke service_items |
| status | VARCHAR | Status pada log ini |
| tanggal | DATE | Tanggal perubahan status |
| keterangan | TEXT | Catatan/keterangan tambahan |
| teknisi | VARCHAR | Nama teknisi yang menangani |
| created_at | TIMESTAMP | Waktu record dibuat |

---

## 5. Struktur Direktori Project

```
service-tracking-ga/
├── src/
│   ├── app/
│   │   ├── page.js              # Root → redirect ke /tracking
│   │   ├── layout.js            # Layout global (Bootstrap, fonts)
│   │   ├── globals.css          # Global styles
│   │   ├── tracking/
│   │   │   └── page.js          # Halaman publik tracking barang
│   │   └── admin/
│   │       ├── page.js          # Halaman admin (daftar semua barang)
│   │       ├── create/
│   │       │   └── page.js      # Form tambah barang baru
│   │       └── edit/[id]/
│   │           └── page.js      # Form edit barang
│   └── lib/
│       └── supabaseClient.js    # Inisialisasi Supabase client
├── public/                      # Asset statis
├── package.json                 # Dependencies
├── next.config.mjs              # Konfigurasi Next.js
└── .env.local                   # Environment variables (tidak di-commit)
```

---

## 6. Proses Deployment

### 6.1 Setup Awal VPS (Dilakukan Sekali)

```bash
# 1. Login ke VPS via SSH
ssh root@103.247.8.227

# 2. Update sistem
dnf update -y

# 3. Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# 4. Install PM2 (process manager)
npm install -g pm2

# 5. Install Git
dnf install -y git

# 6. Clone repository
git clone https://github.com/iyunn/service-tracking-ga.git
cd service-tracking-ga

# 7. Install dependencies project
npm install

# 8. Buat file environment variables
vi .env.local
# Isi dengan:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 9. Build aplikasi
npm run build

# 10. Jalankan dengan PM2
pm2 start npm --name "service-tracking-ga" -- start

# 11. Set auto-start saat VPS reboot
pm2 startup && pm2 save
```

### 6.2 Mekanisme Update Code (Setiap Ada Perubahan)

```
Alur Update:

[Codespace]          [GitHub]           [VPS RumahWeb]
    │                   │                     │
    │── git push ──────►│                     │
    │                   │                     │
    │                   │◄── git pull ────────│
    │                   │                     │── npm run build
    │                   │                     │── pm2 restart
    │                   │                     │
    │                   │              App versi baru live ✅
```

**Langkah konkret setiap update:**

1. Edit code di GitHub Codespace seperti biasa
2. Push ke GitHub:
   ```bash
   git add . && git commit -m "pesan commit" && git push
   ```
3. SSH ke VPS dari laptop:
   ```bash
   ssh root@103.247.8.227
   ```
4. Jalankan perintah update (1 baris):
   ```bash
   cd service-tracking-ga && git pull && npm run build && pm2 restart service-tracking-ga
   ```
5. App versi terbaru langsung live di `http://103.247.8.227:3000`

---

## 7. Perbandingan Arsitektur UTS vs UAS

| Aspek | UTS (Vercel — Gratis) | UAS (VPS RumahWeb — Berbayar) |
|---|---|---|
| **Tipe Layanan** | PaaS | IaaS |
| **Biaya** | Rp 0 | Rp 60.000/bulan |
| **Deploy** | Auto (push = deploy) | Manual via SSH |
| **Kontrol Server** | Terbatas | Penuh (root access) |
| **Skalabilitas** | Otomatis | Manual (upgrade paket) |
| **OS** | Abstrak (tidak terlihat) | AlmaLinux 8.9 |
| **Runtime Management** | Otomatis oleh Vercel | Manual via PM2 |
| **Custom Config** | Terbatas | Bebas |
| **Cocok untuk** | Prototyping cepat | Production & pembelajaran DevOps |

---

## 8. Akses Aplikasi

| Halaman | URL |
|---|---|
| Tracking (Publik) | `http://103.247.8.227:3000/tracking` |
| Admin | `http://103.247.8.227:3000/admin` |
| Tambah Barang | `http://103.247.8.227:3000/admin/create` |

---

## 9. Perintah PM2 yang Berguna

```bash
pm2 list                          # Cek status semua app
pm2 logs service-tracking-ga     # Lihat log real-time
pm2 restart service-tracking-ga  # Restart app
pm2 stop service-tracking-ga     # Stop app
pm2 monit                        # Monitor CPU & RAM
```

---

## 10. Catatan Penting

- File `.env.local` **tidak boleh di-commit** ke GitHub karena berisi credentials Supabase
- VPS aktif 24/7 selama subscription aktif (jatuh tempo: 21 Juli 2026)
- Supabase free tier akan **pause otomatis** jika tidak ada aktivitas selama 7 hari — pastikan app aktif diakses sebelum demo
- Port yang digunakan adalah **3000** — akses via `http://` bukan `https://` (belum setup SSL)
