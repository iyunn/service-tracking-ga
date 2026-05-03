"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_CONFIG = {
  DITERIMA_GA: { label: "Diterima GA", color: "#3b82f6", bg: "#3b82f610" },
  DIKIRIM_KE_SERVICE: { label: "Dikirim", color: "#f59e0b", bg: "#f59e0b10" },
  SEDANG_DIPROSES: { label: "Diproses", color: "#f59e0b", bg: "#f59e0b10" },
  MENUNGGU_SPAREPART: { label: "Menunggu Part", color: "#8b5cf6", bg: "#8b5cf610" },
  SELESAI_DISERVICE: { label: "Selesai", color: "#10b981", bg: "#10b98110" },
  TIDAK_BISA_DISERVICE: { label: "Tidak Bisa", color: "#ef4444", bg: "#ef444410" },
  REKOMENDASI_PEMUSNAHAN: { label: "Pemusnahan", color: "#ef4444", bg: "#ef444410" },
  DIKEMBALIKAN: { label: "Dikembalikan", color: "#6b7280", bg: "#6b728010" },
};

function StatusPill({ status }) {
  const s = STATUS_CONFIG[status] ?? {
    label: status ?? "—",
    color: "#64748b",
    bg: "#64748b10",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "0.76rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}40`,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }) {
  return (
    <div
      style={{
        background: "#0d1b2e",
        border: `1px solid ${accent}30`,
        borderRadius: "14px",
        padding: "1.1rem 1.4rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 42, height: 42, borderRadius: "10px",
          background: accent + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, fontSize: "1.15rem", flexShrink: 0,
        }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", lineHeight: 1, fontFamily: "Syne, sans-serif" }}>
          {value}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);


  const [items, setItems]         = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("semua");
  const [sortDir, setSortDir]     = useState("desc"); // tanggal masuk sort

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("service_items")
        .select("*")
        .order("tanggal_masuk", { ascending: false });

      if (err) throw err;
      setItems(data ?? []);
    } catch (e) {
      setError("Gagal memuat data. Pastikan koneksi dan konfigurasi Supabase benar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Filter + search
  useEffect(() => {
    let result = [...items];

    if (statusFilter !== "semua") {
      result = result.filter(i => i.status_terakhir?.toLowerCase() === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.kode_aset?.toLowerCase().includes(q) ||
        i.nama_barang?.toLowerCase().includes(q) ||
        i.pemilik_asal?.toLowerCase().includes(q)
      );
    }
    // sort by tanggal_masuk
    result.sort((a, b) => {
      const da = new Date(a.tanggal_masuk ?? 0);
      const db = new Date(b.tanggal_masuk ?? 0);
      return sortDir === "desc" ? db - da : da - db;
    });

    setFiltered(result);
  }, [items, search, statusFilter, sortDir]);

  // Stats
  const stats = {
    total:    items.length,
    proses:   items.filter(i => i.status_terakhir?.toLowerCase() === "proses").length,
    menunggu: items.filter(i => i.status_terakhir?.toLowerCase() === "menunggu").length,
    selesai:  items.filter(i => i.status_terakhir?.toLowerCase() === "selesai").length,
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        body { background: #060d19 !important; }

        .admin-root {
          min-height: 100vh;
          background: #060d19;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
        }
        .admin-root h1, .admin-root h2, .admin-root h4, .admin-root h5 {
          font-family: 'Syne', sans-serif;
        }

        /* Sidebar nav */
        .admin-nav {
          background: #060d19;
          border-bottom: 1px solid #1e293b;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        /* Controls */
        .ctrl-input {
          background: #0f172a !important;
          border: 1.5px solid #1e293b !important;
          color: #f1f5f9 !important;
          border-radius: 10px !important;
          font-size: 0.88rem;
          transition: border-color 0.2s;
          padding: 0.5rem 1rem;
        }
        .ctrl-input:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12) !important;
        }
        .ctrl-input::placeholder { color: #334155 !important; }

        .ctrl-select {
          background: #0f172a !important;
          border: 1.5px solid #1e293b !important;
          color: #94a3b8 !important;
          border-radius: 10px !important;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.5rem 0.9rem;
          transition: border-color 0.2s;
        }
        .ctrl-select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12) !important;
        }
        .ctrl-select option { background: #0f172a; }

        /* Table */
        .admin-table-wrap {
          border-radius: 14px;
          border: 1px solid #1e293b;
          overflow: hidden;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .admin-table thead tr {
          background: #0d1b2e;
          border-bottom: 1px solid #1e3a5f;
        }
        .admin-table thead th {
          padding: 0.85rem 1rem;
          color: #64748b;
          font-weight: 600;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .admin-table thead th.sortable {
          cursor: pointer;
          user-select: none;
        }
        .admin-table thead th.sortable:hover { color: #38bdf8; }

        .admin-table tbody tr {
          border-bottom: 1px solid #111c2d;
          transition: background 0.15s;
        }
        .admin-table tbody tr:last-child { border-bottom: none; }
        .admin-table tbody tr:hover { background: #0d1b2e; }

        .admin-table td {
          padding: 0.85rem 1rem;
          color: #cbd5e1;
          vertical-align: middle;
        }

        .kode-chip {
          display: inline-block;
          background: #1e3a5f;
          color: #7dd3fc;
          border-radius: 6px;
          padding: 2px 10px;
          font-family: 'Syne', monospace;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .btn-update {
          background: transparent;
          border: 1px solid #334155;
          color: #94a3b8;
          border-radius: 8px;
          padding: 4px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.15s;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .btn-update:hover {
          border-color: #38bdf8;
          color: #38bdf8;
          background: #38bdf810;
        }

        .btn-tambah {
          background: #38bdf8;
          color: #0f172a;
          border: none;
          border-radius: 10px;
          padding: 0.55rem 1.3rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          font-size: 0.88rem;
          letter-spacing: 0.03em;
          transition: background 0.15s, transform 0.12s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .btn-tambah:hover { background: #7dd3fc; transform: translateY(-1px); color: #0f172a; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #334155;
        }

        /* Skeleton rows */
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skeleton {
          border-radius: 6px;
          height: 14px;
          background: linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite;
        }
      `}</style>

      <div className="admin-root">
        {/* ── Top Nav ── */}
        <nav className="admin-nav">
          <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <i className="bi bi-tools" style={{ color: "#38bdf8", fontSize: "1.2rem" }}></i>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem" }}>
              Service Tracking <span style={{ color: "#38bdf8" }}>GA</span>
            </span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link href="/tracking" style={{ color: "#64748b", fontSize: "0.85rem", textDecoration: "none" }}>
              <i className="bi bi-search me-1"></i>Tracking
            </Link>
            <span
              style={{
                background: "#1e3a5f",
                color: "#38bdf8",
                borderRadius: "8px",
                padding: "3px 12px",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              <i className="bi bi-shield-lock me-1"></i>Admin
            </span>
          </div>
        </nav>

        {/* ── Content ── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

          {/* Header */}
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
              <h1 className="mb-1" style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9" }}>
                Dashboard Admin
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                Manajemen data unit servis masuk
              </p>
            </div>
            <Link href="/admin/create" className="btn-tambah">
              <i className="bi bi-plus-lg"></i>
              Tambah Unit Service
            </Link>
          </div>

          {/* Stat cards */}
          {!loading && !error && (
            <div
              className="fade-up mb-4"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}
            >
              <StatCard label="Total Semua"    value={stats.total}    icon="bi-inbox-fill"          accent="#38bdf8" />
              <StatCard label="Sedang Proses"  value={stats.proses}   icon="bi-gear-wide-connected"  accent="#f59e0b" />
              <StatCard label="Menunggu Part"  value={stats.menunggu} icon="bi-hourglass-split"      accent="#8b5cf6" />
              <StatCard label="Selesai"        value={stats.selesai}  icon="bi-check-circle-fill"    accent="#10b981" />
            </div>
          )}

          {/* Controls bar */}
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <i
                className="bi bi-search"
                style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: "0.85rem", pointerEvents: "none" }}
              ></i>
              <input
                type="text"
                className="ctrl-input w-100"
                placeholder="Cari kode, nama barang, pemilik…"
                style={{ paddingLeft: "2.2rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="ctrl-select"
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              style={{ flex: "0 0 auto" }}
            >
              <option value="semua">Semua Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {/* Sort */}
            <button
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="ctrl-select d-flex align-items-center gap-1"
              style={{ border: "1.5px solid #1e293b", background: "#0f172a", cursor: "pointer" }}
            >
              <i className={`bi bi-sort-${sortDir === "desc" ? "down" : "up"}`} style={{ color: "#38bdf8" }}></i>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {sortDir === "desc" ? "Terbaru" : "Terlama"}
              </span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchItems}
              disabled={loading}
              style={{
                background: "#0f172a", border: "1.5px solid #1e293b", borderRadius: "10px",
                color: "#64748b", padding: "0.5rem 0.8rem", cursor: "pointer", transition: "color 0.15s",
              }}
              title="Refresh data"
            >
              <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
            </button>

            {/* Result count */}
            {!loading && (
              <span style={{ color: "#475569", fontSize: "0.8rem", marginLeft: "auto", whiteSpace: "nowrap" }}>
                {filtered.length} dari {items.length} unit
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="fade-up d-flex align-items-start gap-3 p-4 mb-3"
              style={{ background: "#450a0a22", border: "1px solid #7f1d1d66", borderRadius: "12px" }}
            >
              <i className="bi bi-exclamation-triangle-fill mt-1" style={{ color: "#f87171" }}></i>
              <div>
                <p className="mb-0 fw-semibold" style={{ color: "#fca5a5" }}>Gagal Memuat Data</p>
                <p className="mb-0 mt-1" style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{error}</p>
              </div>
              <button
                onClick={fetchItems}
                style={{ marginLeft: "auto", background: "transparent", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: "8px", padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Table */}
          <div className="admin-table-wrap fade-up">
            <table className="admin-table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                    title="Klik untuk urut"
                  >
                    Tgl Masuk{" "}
                    <i className={`bi bi-chevron-${sortDir === "desc" ? "down" : "up"} ms-1`} style={{ fontSize: "0.65rem", color: "#38bdf8" }}></i>
                  </th>
                  <th>Kode Aset</th>
                  <th>Nama Barang</th>
                  <th>Pemilik</th>
                  <th>Status Terakhir</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* Skeleton rows while loading */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton" style={{ width: j === 5 ? 60 : "80%", height: 13 }}></div>
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <i className="bi bi-inbox d-block mb-3" style={{ fontSize: "2.5rem", color: "#1e293b" }}></i>
                        <p className="mb-1" style={{ color: "#334155", fontWeight: 600 }}>
                          {search || statusFilter !== "semua" ? "Tidak ada hasil yang cocok" : "Belum ada data"}
                        </p>
                        <p style={{ color: "#1e293b", fontSize: "0.85rem", margin: 0 }}>
                          {search || statusFilter !== "semua"
                            ? "Coba ubah kata kunci atau filter status"
                            : "Mulai dengan menambahkan unit service baru"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      {fmtDate(item.tanggal_masuk)}
                    </td>
                    <td>
                      <span className="kode-chip">{item.kode_aset ?? "—"}</span>
                    </td>
                    <td>
                      <div style={{ color: "#e2e8f0", fontWeight: 500 }}>{item.nama_barang ?? "—"}</div>
                      {item.merk && (
                        <div style={{ color: "#475569", fontSize: "0.76rem", marginTop: 2 }}>{item.merk}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ color: "#cbd5e1" }}>{item.pemilik_asal ?? "—"}</div>
                      {item.pemilik_asal && (
                        <div style={{ color: "#475569", fontSize: "0.76rem", marginTop: 2 }}>{item.unit}</div>
                      )}
                    </td>
                    <td>
                      <StatusPill status={item.status_terakhir} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Link
                        href={`/admin/edit/${item.id}`}
                        className="btn-update"
                      >
                        <i className="bi bi-pencil-square"></i>
                        Update
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer info */}
          {!loading && items.length > 0 && (
            <p style={{ color: "#334155", fontSize: "0.78rem", marginTop: "0.75rem", textAlign: "right" }}>
              Data diambil langsung dari Supabase · {new Date().toLocaleTimeString("id-ID")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}