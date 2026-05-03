"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DITERIMA_GA:            { label: "Diterima GA", color: "#3b82f6", icon: "bi-box-arrow-in-down" },
  DIKIRIM_KE_SERVICE:     { label: "Dikirim ke Service", color: "#f59e0b", icon: "bi-truck" },
  SEDANG_DIPROSES:        { label: "Sedang Diproses", color: "#8b5cf6", icon: "bi-gear-wide-connected" },
  MENUNGGU_SPAREPART:     { label: "Menunggu Sparepart", color: "#ec4899", icon: "bi-hourglass-split" },
  SELESAI_DISERVICE:      { label: "Selesai Diservice", color: "#10b981", icon: "bi-check-circle" },
  TIDAK_BISA_DISERVICE:   { label: "Tidak Bisa Diservice", color: "#f87171", icon: "bi-x-octagon" },
  REKOMENDASI_PEMUSNAHAN: { label: "Rekomendasi Pemusnahan", color: "#dc2626", icon: "bi-trash3" },
  DIKEMBALIKAN:           { label: "Dikembalikan", color: "#6b7280", icon: "bi-bag-check" },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? {
    label: status ?? "—",
    color: "#64748b",
    icon: "bi-question-circle",
  };
  return (
    <span
      className="badge d-inline-flex align-items-center gap-1 px-3 py-2"
      style={{
        background: s.color + "15",
        color: s.color,
        border: `1.5px solid ${s.color}55`,
        borderRadius: "8px",
        fontSize: "0.82rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}
    >
      <i className={`bi ${s.icon}`}></i>
      {s.label}
    </span>
  );
}

// ── Timeline item ────────────────────────────────────────────────────────────
function TimelineItem({ log, isLast }) {
  const s = STATUS_CONFIG[log.status] ?? {
  color: "#64748b",
  icon: "bi-circle",
};
  const date = log.tanggal
    ? new Date(log.tanggal).toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "—";

  return (
    <div className="d-flex gap-3" style={{ position: "relative" }}>
      {/* Line */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: "19px",
            top: "38px",
            width: "2px",
            bottom: "-8px",
            background: "linear-gradient(to bottom, #334155, transparent)",
          }}
        />
      )}
      {/* Dot */}
      <div
        className="flex-shrink-0 d-flex align-items-center justify-content-center"
        style={{
          width: 40, height: 40, borderRadius: "50%",
          background: s.color + "20",
          border: `2px solid ${s.color}60`,
          color: s.color, fontSize: "1rem", zIndex: 1,
        }}
      >
        <i className={`bi ${s.icon}`}></i>
      </div>
      {/* Content */}
      <div
        className="flex-grow-1 mb-4 p-3"
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "12px",
        }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
          <StatusBadge status={log.status} />
          <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
            <i className="bi bi-calendar3 me-1"></i>{date}
          </span>
        </div>
        {log.keterangan && (
          <p className="mb-1 mt-2" style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.6 }}>
            {log.keterangan}
          </p>
        )}
        {log.teknisi && (
          <p className="mb-0 mt-1" style={{ color: "#64748b", fontSize: "0.8rem" }}>
            <i className="bi bi-person-gear me-1"></i>Teknisi: <span style={{ color: "#94a3b8" }}>{log.teknisi}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [kodeAset, setKodeAset] = useState("");
  const [item, setItem]         = useState(null);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const kode = kodeAset.trim().toUpperCase();
    if (!kode) return;

    setLoading(true);
    setError("");
    setItem(null);
    setLogs([]);
    setSearched(false);

try {
    const q = kodeAset.trim();

    const { data: itemsData, error: itemErr } = await supabase
        .from("service_items")
        .select("*")
        .or(
        `kode_aset.ilike.%${q}%,serial_number.ilike.%${q}%,pemilik_asal.ilike.%${q}%`
        )
        .order("tanggal_masuk", { ascending: false });

    console.log("ITEM ERROR:", itemErr);
    console.log("ITEM DATA:", itemsData);

    if (itemErr || !itemsData || itemsData.length === 0) {
        setError("Data tidak ditemukan. Pastikan kode aset / SN / pemilik sudah benar.");
        setSearched(true);
        return;
    }

    const itemData = itemsData[0]; // ambil data pertama

    const { data: logsData, error: logsErr } = await supabase
        .from("service_logs")
        .select("*")
        .eq("service_item_id", itemData.id)
        .order("created_at", { ascending: false });

    console.log("LOG ERROR:", logsErr);
    console.log("LOG DATA:", logsData);

    setItem(itemData);
    setLogs(logsErr ? [] : logsData ?? []);
    } catch (err) {
    console.log("CATCH ERROR:", err);
    setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
    setLoading(false);
    setSearched(true);
    }
}

  const latestStatus = logs.length > 0
  ? logs[0].status
  : item?.status_terakhir;

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        body { background: #060d19 !important; }

        .tracking-root {
          min-height: 100vh;
          background: #060d19;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
        }
        .tracking-root h1, .tracking-root h2, .tracking-root h3,
        .tracking-root h4, .tracking-root h5 {
          font-family: 'Syne', sans-serif;
        }

        /* Search input */
        .search-input {
          background: #0f172a !important;
          border: 1.5px solid #1e293b !important;
          color: #f1f5f9 !important;
          border-radius: 12px 0 0 12px !important;
          font-size: 1.05rem;
          letter-spacing: 0.08em;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.15) !important;
          outline: none;
        }
        .search-input::placeholder { color: #475569 !important; }

        .search-btn {
          background: #38bdf8;
          border: none;
          border-radius: 0 12px 12px 0 !important;
          color: #0f172a;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.04em;
          transition: background 0.2s, transform 0.15s;
          padding: 0 1.6rem;
        }
        .search-btn:hover { background: #7dd3fc; transform: translateX(2px); }
        .search-btn:active { transform: scale(0.97); }
        .search-btn:disabled { background: #334155; color: #64748b; }

        .card-glass {
          background: #0d1b2e;
          border: 1px solid #1e293b;
          border-radius: 16px;
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid #1e293b;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-label {
          min-width: 130px;
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding-top: 2px;
        }
        .detail-value {
          color: #e2e8f0;
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* Pulse for "Diproses" */
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pulse-dot { position: relative; display: inline-block; }
        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #f59e0b;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div className="tracking-root">
        {/* ── Nav ── */}
        <nav
          className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{ borderBottom: "1px solid #1e293b", background: "#060d19" }}
        >
          <Link
            href="/"
            className="d-flex align-items-center gap-2 text-decoration-none"
          >
            <i className="bi bi-tools" style={{ color: "#38bdf8", fontSize: "1.3rem" }}></i>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#f1f5f9", fontSize: "1rem" }}>
              Service Tracking <span style={{ color: "#38bdf8" }}>GA</span>
            </span>
          </Link>
          <Link
            href="/admin"
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              borderRadius: "8px",
              fontSize: "0.82rem",
            }}
          >
            <i className="bi bi-shield-lock"></i>
            Admin
          </Link>
        </nav>

        {/* ── Hero + Search ── */}
        <div className="text-center py-5 px-3" style={{ paddingTop: "3.5rem !important" }}>
          <p
            className="mb-2"
            style={{ color: "#38bdf8", fontFamily: "Syne, sans-serif", fontWeight: 600, letterSpacing: "0.12em", fontSize: "0.78rem", textTransform: "uppercase" }}
          >
            Cek Status Servis
          </p>
          <h1
                className="mb-2"
                style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(1.8rem, 5vw, 3rem)",
                    fontWeight: 800,
                    color: "#f1f5f9",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                }}
                >
                Tracking Aset
            </h1>
          <p className="mb-5" style={{ color: "#64748b", maxWidth: "420px", margin: "0 auto 2.5rem", fontSize: "0.95rem" }}>
            Masukkan kode aset untuk melihat detail barang dan riwayat perbaikan.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ maxWidth: "520px", margin: "0 auto" }}>
            <div className="input-group" style={{ borderRadius: "12px", boxShadow: "0 4px 32px rgba(0,0,0,0.4)" }}>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Contoh: C06.001002 atau Serial Number"
                value={kodeAset}
                onChange={(e) => setKodeAset(e.target.value.toUpperCase())}
                style={{ paddingLeft: "1.25rem", paddingTop: "0.85rem", paddingBottom: "0.85rem" }}
                autoFocus
              />
              <button type="submit" className="search-btn" disabled={loading || !kodeAset.trim()}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Mencari…</>
                  : <><i className="bi bi-search me-2"></i>Cari</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* ── Divider ── */}
        {searched && <div style={{ borderTop: "1px solid #1e293b", maxWidth: "760px", margin: "0 auto" }} />}

        {/* ── Results ── */}
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 1rem 4rem" }}>

          {/* Error state */}
          {error && (
            <div
              className="fade-up d-flex align-items-start gap-3 p-4 mt-4"
              style={{ background: "#450a0a22", border: "1px solid #7f1d1d66", borderRadius: "14px" }}
            >
              <i className="bi bi-exclamation-triangle-fill mt-1" style={{ color: "#f87171", fontSize: "1.2rem" }}></i>
              <div>
                <p className="mb-0 fw-semibold" style={{ color: "#fca5a5" }}>Data Tidak Ditemukan</p>
                <p className="mb-0 mt-1" style={{ color: "#94a3b8", fontSize: "0.88rem" }}>{error}</p>
              </div>
            </div>
          )}

          {/* Item detail card */}
          {item && (
            <div className="fade-up mt-4">
              {/* Header strip */}
              <div
                className="d-flex align-items-center justify-content-between p-4 mb-1"
                style={{
                  background: "linear-gradient(135deg, #0f172a, #0d2237)",
                  border: "1px solid #1e3a5f",
                  borderRadius: "16px 16px 0 0",
                }}
              >
                <div>
                  <p className="mb-1" style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                    Kode Aset
                  </p>
                  <h2 className="mb-0" style={{ fontFamily: "Syne, sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.06em" }}>
                    {item.kode_aset}
                  </h2>
                </div>
                <StatusBadge status={latestStatus} />
              </div>

              {/* Detail rows */}
              <div className="card-glass">
                {[
                  { icon: "bi-box-seam",        label: "Nama Barang",  value: item.nama_barang  },
                  { icon: "bi-person",            label: "Pemilik",      value: item.nama_pemilik },
                  { icon: "bi-building",          label: "Unit / Divisi",value: item.unit         },
                  { icon: "bi-geo-alt",           label: "Lokasi",       value: item.lokasi       },
                  { icon: "bi-cpu",               label: "Merk / Tipe",  value: [item.merk, item.tipe].filter(Boolean).join(" · ") || null },
                  { icon: "bi-calendar-plus",     label: "Tgl Masuk",    value: item.tanggal_masuk
                      ? new Date(item.tanggal_masuk).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })
                      : null },
                  { icon: "bi-chat-left-text",    label: "Keluhan",      value: item.keluhan      },
                ].filter(r => r.value).map((r, i) => (
                  <div key={i} className="detail-row">
                    <i className={`bi ${r.icon} mt-1`} style={{ color: "#38bdf8", fontSize: "0.95rem", minWidth: "18px" }}></i>
                    <span className="detail-label">{r.label}</span>
                    <span className="detail-value">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service logs timeline */}
          {item && (
            <div className="fade-up mt-4" style={{ animationDelay: "0.1s" }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
                <h5 className="mb-0 px-3" style={{ color: "#94a3b8", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <i className="bi bi-clock-history me-2" style={{ color: "#38bdf8" }}></i>
                  Riwayat Perbaikan
                </h5>
                <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
              </div>

              {logs.length === 0 ? (
                <div
                  className="text-center py-5"
                  style={{ color: "#475569", background: "#0f172a", border: "1px dashed #1e293b", borderRadius: "14px" }}
                >
                  <i className="bi bi-journal-x d-block mb-2" style={{ fontSize: "2rem", color: "#334155" }}></i>
                  <p className="mb-0" style={{ fontSize: "0.9rem" }}>Belum ada riwayat perbaikan tercatat.</p>
                </div>
              ) : (
                <div>
                  {logs.map((log, idx) => (
                    <TimelineItem key={log.id ?? idx} log={log} isLast={idx === logs.length - 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state (before first search) */}
          {!searched && !loading && (
            <div className="text-center pt-2 pb-5" style={{ color: "#1e293b" }}>
              <i className="bi bi-search" style={{ fontSize: "3.5rem" }}></i>
              <p className="mt-3 mb-0" style={{ color: "#334155", fontSize: "0.9rem" }}>Masukkan kode aset di atas untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}