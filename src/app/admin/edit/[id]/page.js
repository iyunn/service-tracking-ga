"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Status workflow ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "DITERIMA_GA",              label: "Diterima GA",               color: "#3b82f6", icon: "bi-box-arrow-in-down" },
  { value: "DIKIRIM_KE_SERVICE",       label: "Dikirim ke Service",         color: "#f59e0b", icon: "bi-truck" },
  { value: "SEDANG_DIPROSES",          label: "Sedang Diproses",            color: "#8b5cf6", icon: "bi-gear-wide-connected" },
  { value: "MENUNGGU_SPAREPART",       label: "Menunggu Sparepart",         color: "#ec4899", icon: "bi-hourglass-split" },
  { value: "SELESAI_DISERVICE",        label: "Selesai Diservice",          color: "#10b981", icon: "bi-check-circle" },
  { value: "TIDAK_BISA_DISERVICE",     label: "Tidak Bisa Diservice",       color: "#f87171", icon: "bi-x-octagon" },
  { value: "REKOMENDASI_PEMUSNAHAN",   label: "Rekomendasi Pemusnahan",     color: "#dc2626", icon: "bi-trash3" },
  { value: "DIKEMBALIKAN",             label: "Dikembalikan",               color: "#6b7280", icon: "bi-bag-check" },
];

function getStatusMeta(value) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? {
    label: value ?? "—", color: "#64748b", icon: "bi-circle",
  };
}

function StatusPill({ value }) {
  const s = getStatusMeta(value);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "0.76rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: s.color,
        background: s.color + "18",
        border: `1px solid ${s.color}40`,
        whiteSpace: "nowrap",
      }}
    >
      <i className={`bi ${s.icon}`} style={{ fontSize: "0.72rem" }}></i>
      {s.label}
    </span>
  );
}

// ── Info row (read-only) ──────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.7rem 0",
        borderBottom: "1px solid #111c2d",
      }}
    >
      <i
        className={`bi ${icon}`}
        style={{ color: "#38bdf8", fontSize: "0.9rem", marginTop: 2, minWidth: 16 }}
      ></i>
      <span
        style={{
          minWidth: 130,
          fontSize: "0.76rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#475569",
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider({ icon, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        margin: "1.75rem 0 1.25rem",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#475569",
          whiteSpace: "nowrap",
        }}
      >
        <i className={`bi ${icon} me-1`}></i>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 14, mb = 12 }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: 6, marginBottom: mb,
        background: "linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)",
        backgroundSize: "600px 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminEditPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [item, setItem]       = useState(null);
  const [fetching, setFetch]  = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const [status,   setStatus]   = useState("");
  const [lokasi,   setLokasi]   = useState("");
  const [catatan,  setCatatan]  = useState("");
  const [loading,  setLoading]  = useState(false);

  // Focus states for styled inputs
  const [lokFocus, setLokFocus] = useState(false);
  const [catFocus, setCatFocus] = useState(false);

  // ── Fetch item on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setFetch(true);
      setFetchErr("");
      try {
        const { data, error } = await supabase
          .from("service_items")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setItem(data);
        setStatus(data.status_terakhir ?? STATUS_OPTIONS[0].value);
        setLokasi(data.lokasi_terakhir ?? "");
        setCatatan(data.catatan_admin ?? "");
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setFetchErr("Data tidak ditemukan atau terjadi kesalahan koneksi.");
      } finally {
        setFetch(false);
      }
    })();
  }, [id]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update service_items
      const { error: updateErr } = await supabase
        .from("service_items")
        .update({
          status_terakhir: status,
          lokasi_terakhir: lokasi.trim() || null,
          catatan_admin:   catatan.trim() || null,
          updated_at:      new Date().toISOString(),
        })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // 2. Insert ke service_logs
      const { error: logErr } = await supabase
        .from("service_logs")
        .insert({
          service_item_id: id,
          status:          status,
          lokasi:          lokasi.trim() || null,
          catatan_update:  catatan.trim() || "Update status",
        });

      if (logErr) throw logErr;

      alert(`✅ Status berhasil diperbarui!\nStatus: ${getStatusMeta(status).label}`);
      router.push("/admin");
    } catch (err) {
      console.error("Gagal update unit service:", err);
      alert(`❌ Gagal menyimpan perubahan.\n${err?.message ?? "Silakan coba lagi."}`);
    } finally {
      setLoading(false);
    }
  }

  const selectedMeta = getStatusMeta(status);
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        body { background: #060d19 !important; }

        .edit-root {
          min-height: 100vh;
          background: #060d19;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
        }
        .edit-root h1, .edit-root h2, .edit-root h3,
        .edit-root h4, .edit-root h5 {
          font-family: 'Syne', sans-serif;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid #1e293b;
          border-radius: 9px;
          color: #64748b;
          padding: 0.45rem 1rem;
          font-size: 0.82rem;
          font-weight: 500;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-back:hover { border-color: #334155; color: #94a3b8; }

        /* Status select */
        .status-select {
          width: 100%;
          background: #0a1628;
          border: 1.5px solid #1e293b;
          border-radius: 10px;
          color: #f1f5f9;
          padding: 0.65rem 1rem;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%2364748b' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
        .status-select:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.1);
        }
        .status-select option {
          background: #0d1b2e;
          color: #f1f5f9;
          padding: 0.5rem;
        }

        .text-input {
          width: 100%;
          background: #0a1628;
          border: 1.5px solid #1e293b;
          border-radius: 10px;
          color: #f1f5f9;
          padding: 0.65rem 1rem;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .text-input::placeholder { color: #334155; }

        textarea.text-input {
          resize: vertical;
          min-height: 110px;
          line-height: 1.6;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          margin-bottom: 0.45rem;
          transition: color 0.2s;
        }

        .btn-submit {
          width: 100%;
          background: #38bdf8;
          color: #0f172a;
          border: none;
          border-radius: 11px;
          padding: 0.8rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s, opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-submit:hover:not(:disabled) { background: #7dd3fc; transform: translateY(-1px); }
        .btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Status preview bar */
        .status-preview-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-top: 0.75rem;
          transition: background 0.2s, border-color 0.2s;
        }

        /* Workflow steps */
        .workflow-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 1rem;
        }
        .workflow-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          letter-spacing: 0.03em;
        }

        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-icon { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="edit-root">
        {/* ── Nav ── */}
        <nav
          style={{
            background: "#060d19",
            borderBottom: "1px solid #1e293b",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <i className="bi bi-tools" style={{ color: "#38bdf8", fontSize: "1.2rem" }}></i>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem" }}>
              Service Tracking <span style={{ color: "#38bdf8" }}>GA</span>
            </span>
          </Link>
          <Link href="/admin" className="btn-back">
            <i className="bi bi-arrow-left"></i>
            Kembali ke Dashboard
          </Link>
        </nav>

        {/* ── Content ── */}
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2.5rem 1.25rem 5rem" }}>

          {/* Page header */}
          <div className="fade-up" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: "10px",
                  background: "#f59e0b15",
                  border: "1px solid #f59e0b30",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#f59e0b", fontSize: "1rem",
                }}
              >
                <i className="bi bi-pencil-square"></i>
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
                Update Unit Service
              </h1>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0, paddingLeft: 50 }}>
              Perbarui status, lokasi, dan catatan untuk unit servis ini.
            </p>
          </div>

          {/* ── Fetch Error ── */}
          {fetchErr && (
            <div
              className="fade-up d-flex align-items-start gap-3 p-4 mb-4"
              style={{ background: "#450a0a22", border: "1px solid #7f1d1d66", borderRadius: "12px" }}
            >
              <i className="bi bi-exclamation-triangle-fill mt-1" style={{ color: "#f87171" }}></i>
              <div>
                <p className="mb-0 fw-semibold" style={{ color: "#fca5a5" }}>Gagal Memuat Data</p>
                <p className="mb-0 mt-1" style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{fetchErr}</p>
              </div>
              <Link href="/admin" className="btn-back ms-auto" style={{ flexShrink: 0 }}>
                Kembali
              </Link>
            </div>
          )}

          {/* ── Main Card ── */}
          {!fetchErr && (
            <div
              className="fade-up"
              style={{
                background: "#0d1b2e",
                border: "1px solid #1e293b",
                borderRadius: "16px",
                overflow: "hidden",
                animationDelay: "0.06s",
              }}
            >
              {/* ── Section: Informasi Unit ── */}
              <div style={{ padding: "1.5rem 1.75rem 0" }}>
                <SectionDivider icon="bi-box-seam" label="Informasi Unit" />

                {fetching ? (
                  <div style={{ padding: "0.5rem 0 1rem" }}>
                    <Skeleton w="40%" h={11} mb={10} />
                    <Skeleton w="70%" h={18} mb={14} />
                    <Skeleton w="55%" h={11} mb={10} />
                    <Skeleton w="65%" h={14} mb={10} />
                    <Skeleton w="50%" h={11} mb={10} />
                    <Skeleton w="60%" h={14} mb={4} />
                  </div>
                ) : item ? (
                  <div style={{ paddingBottom: "0.5rem" }}>
                    {/* Kode aset highlight */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                        padding: "0.75rem 1rem",
                        background: "#071224",
                        border: "1px solid #1e3a5f",
                        borderRadius: "10px",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 600 }}>
                          Kode Aset
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: "1.2rem", fontWeight: 800, fontFamily: "Syne, monospace", color: "#38bdf8", letterSpacing: "0.06em" }}>
                          {item.kode_aset}
                        </p>
                      </div>
                      <StatusPill value={item.status_terakhir} />
                    </div>

                    <InfoRow icon="bi-box-seam"     label="Nama Barang" value={item.nama_barang} />
                    <InfoRow icon="bi-person"        label="Pemilik"     value={item.pemilik_asal} />
                    <InfoRow icon="bi-cpu"           label="Merk / Tipe" value={item.merk} />
                    <InfoRow icon="bi-hash"          label="Serial No."  value={item.serial_number} />
                    <InfoRow icon="bi-geo-alt"       label="Lokasi Saat Ini" value={item.lokasi_terakhir} />
                    <InfoRow icon="bi-calendar-plus" label="Tgl Masuk"   value={fmtDate(item.tanggal_masuk ?? item.created_at)} />
                    {item.keluhan && (
                      <div style={{ padding: "0.7rem 0", borderBottom: "1px solid #111c2d" }}>
                        <p style={{ margin: 0, fontSize: "0.76rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 4 }}>
                          <i className="bi bi-chat-left-text me-1" style={{ color: "#38bdf8" }}></i>Keluhan
                        </p>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
                          {item.keluhan}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* ── Section: Form Update ── */}
              <div style={{ padding: "0 1.75rem 1.75rem" }}>
                <SectionDivider icon="bi-arrow-repeat" label="Update Status &amp; Lokasi" />

                <form onSubmit={handleSubmit} autoComplete="off">

                  {/* Status dropdown */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label
                      htmlFor="status"
                      className="field-label"
                      style={{ color: "#64748b" }}
                    >
                      <i className="bi bi-activity"></i>
                      Status Terbaru
                      <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>
                    </label>

                    {/* Quick-pick workflow chips */}
                    <div className="workflow-wrap">
                      {STATUS_OPTIONS.map((s) => {
                        const active = status === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            className="workflow-chip"
                            onClick={() => setStatus(s.value)}
                            style={{
                              color:      active ? s.color : "#475569",
                              background: active ? s.color + "18" : "transparent",
                              borderColor: active ? s.color + "60" : "#1e293b",
                            }}
                          >
                            <i className={`bi ${s.icon}`}></i>
                            {s.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Select (mirrors chip selection) */}
                    <select
                      id="status"
                      className="status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    {/* Status preview */}
                    {status && (
                      <div
                        className="status-preview-bar"
                        style={{
                          background: selectedMeta.color + "0d",
                          border: `1px solid ${selectedMeta.color}30`,
                        }}
                      >
                        <div
                          style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: selectedMeta.color,
                            boxShadow: `0 0 6px ${selectedMeta.color}`,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: "0.82rem", color: selectedMeta.color, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>
                          {selectedMeta.label}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#475569", marginLeft: "auto" }}>
                          Status yang akan disimpan
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lokasi */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="lokasi" className="field-label" style={{ color: lokFocus ? "#38bdf8" : "#64748b" }}>
                      <i className="bi bi-geo-alt"></i>
                      Lokasi Terakhir
                    </label>
                    <input
                      id="lokasi"
                      type="text"
                      className="text-input"
                      placeholder="Contoh: Vendor ABC, Gudang GA, Ruang IT…"
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      onFocus={() => setLokFocus(true)}
                      onBlur={() => setLokFocus(false)}
                      style={{
                        borderColor: lokFocus ? "#38bdf8" : "#1e293b",
                        boxShadow: lokFocus ? "0 0 0 3px rgba(56,189,248,0.1)" : "none",
                      }}
                    />
                  </div>

                  {/* Catatan admin */}
                  <div style={{ marginBottom: "1.75rem" }}>
                    <label htmlFor="catatan" className="field-label" style={{ color: catFocus ? "#38bdf8" : "#64748b" }}>
                      <i className="bi bi-chat-left-dots"></i>
                      Catatan Admin
                      <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#475569", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                        Opsional — akan disimpan ke log
                      </span>
                    </label>
                    <textarea
                      id="catatan"
                      className="text-input"
                      placeholder="Tulis catatan update, hasil diagnosa, atau keterangan tambahan…"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      onFocus={() => setCatFocus(true)}
                      onBlur={() => setCatFocus(false)}
                      style={{
                        borderColor: catFocus ? "#38bdf8" : "#1e293b",
                        boxShadow: catFocus ? "0 0 0 3px rgba(56,189,248,0.1)" : "none",
                        resize: "vertical",
                        minHeight: 110,
                        lineHeight: 1.6,
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button type="submit" className="btn-submit" disabled={loading || fetching}>
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-repeat spin-icon"></i>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-floppy"></i>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Cancel link */}
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link
              href="/admin"
              style={{ color: "#334155", fontSize: "0.82rem", textDecoration: "none" }}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Batalkan dan kembali ke dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}