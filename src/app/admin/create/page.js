"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Auto-generate kode servis: SRV-YYYYMMDD-XXXX ────────────────────────────
function generateKodeServis() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SRV-${date}-${rand}`;
}

const INITIAL_FORM = {
  nama_barang:     "",
  kategori_barang: "",
  pemilik_asal:    "",
  no_hp_pelanggan: "",
  email_pelanggan: "",
  merk:            "",
  serial_number:   "",
  keluhan:         "",
};

const DEFAULT_STATUS = "DITERIMA";
const DEFAULT_LOKASI = "Counter";
const LOG_CATATAN    = "Barang diterima di counter servis";

const FIELDS = [
  {
    key: "nama_barang",
    label: "Nama Barang",
    placeholder: "Contoh: Laptop Asus, HP Samsung, AC LG",
    icon: "bi-box-seam",
    required: true,
  },
  {
    key: "kategori_barang",
    label: "Kategori Barang",
    placeholder: "Contoh: Laptop, Smartphone, Elektronik Rumah",
    icon: "bi-tag",
    required: false,
    hint: "Opsional",
  },
  {
    key: "pemilik_asal",
    label: "Nama Pelanggan",
    placeholder: "Contoh: Budi Santoso",
    icon: "bi-person",
    required: true,
  },
  {
    key: "no_hp_pelanggan",
    label: "Nomor HP / WhatsApp",
    placeholder: "Contoh: 08123456789",
    icon: "bi-whatsapp",
    required: false,
    hint: "Untuk notifikasi WA",
    type: "tel",
  },
  {
    key: "email_pelanggan",
    label: "Email Pelanggan",
    placeholder: "Contoh: budi@email.com",
    icon: "bi-envelope",
    required: false,
    hint: "Untuk notifikasi email",
    type: "email",
  },
  {
    key: "merk",
    label: "Merk / Tipe",
    placeholder: "Contoh: Asus VivoBook 14",
    icon: "bi-cpu",
    required: false,
    hint: "Opsional",
  },
  {
    key: "serial_number",
    label: "Serial Number",
    placeholder: "Contoh: SN123456",
    icon: "bi-hash",
    required: false,
    hint: "Opsional",
    upper: true,
  },
];

function FormField({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label
        htmlFor={field.key}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: focused ? "#38bdf8" : "#64748b",
          marginBottom: "0.45rem", transition: "color 0.2s",
        }}
      >
        <i className={`bi ${field.icon}`}></i>
        {field.label}
        {field.required && <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>}
        {field.hint && (
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#475569", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
            {field.hint}
          </span>
        )}
      </label>
      <input
        id={field.key}
        name={field.key}
        type={field.type ?? "text"}
        placeholder={field.placeholder}
        value={value}
        required={field.required}
        autoComplete="off"
        onChange={(e) =>
          onChange(field.key, field.upper ? e.target.value.toUpperCase() : e.target.value)
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: "#0a1628",
          border: `1.5px solid ${focused ? "#38bdf8" : "#1e293b"}`,
          borderRadius: "10px", color: "#f1f5f9",
          padding: "0.65rem 1rem", fontSize: "0.9rem", outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(56,189,248,0.1)" : "none",
          fontFamily: "DM Sans, sans-serif",
        }}
      />
    </div>
  );
}

export default function AdminCreatePage() {
  const router = useRouter();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Generate kode servis otomatis
    const kodeServis = generateKodeServis();

    try {
      // 1. Insert ke service_items
      const { data: newItem, error: itemErr } = await supabase
        .from("service_items")
        .insert({
          kode_aset:       kodeServis,
          nama_barang:     form.nama_barang.trim(),
          kategori_barang: form.kategori_barang.trim() || null,
          pemilik_asal:    form.pemilik_asal.trim(),
          no_hp_pelanggan: form.no_hp_pelanggan.trim() || null,
          email_pelanggan: form.email_pelanggan.trim() || null,
          merk:            form.merk.trim() || null,
          serial_number:   form.serial_number.trim() || null,
          keluhan:         form.keluhan.trim() || null,
          status_terakhir: DEFAULT_STATUS,
          lokasi_terakhir: DEFAULT_LOKASI,
        })
        .select()
        .single();

      if (itemErr) throw itemErr;

      // 2. Insert log awal
      const { error: logErr } = await supabase
        .from("service_logs")
        .insert({
          service_item_id: newItem.id,
          status:          DEFAULT_STATUS,
          lokasi:          DEFAULT_LOKASI,
          catatan_update:  LOG_CATATAN,
        });

      if (logErr) throw logErr;

      alert(`✅ Barang berhasil didaftarkan!\nKode Servis: ${newItem.kode_aset}`);
      router.push("/admin");
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert(`❌ Gagal menyimpan data.\n${err?.message ?? "Silakan coba lagi."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { background: #060d19 !important; }
        .create-root {
          min-height: 100vh; background: #060d19;
          font-family: 'DM Sans', sans-serif; color: #e2e8f0;
        }
        textarea.form-textarea {
          width: 100%; background: #0a1628; border: 1.5px solid #1e293b;
          border-radius: 10px; color: #f1f5f9; padding: 0.7rem 1rem;
          font-size: 0.9rem; outline: none; resize: vertical; min-height: 110px;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif; line-height: 1.6;
        }
        textarea.form-textarea:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.1); }
        textarea.form-textarea::placeholder { color: #334155; }
        input::placeholder { color: #334155 !important; }
        .btn-back {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; border: 1px solid #1e293b;
          border-radius: 9px; color: #64748b; padding: 0.45rem 1rem;
          font-size: 0.82rem; font-weight: 500; text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-back:hover { border-color: #334155; color: #94a3b8; }
        .btn-submit {
          width: 100%; background: #38bdf8; color: #0f172a; border: none;
          border-radius: 11px; padding: 0.8rem 1.5rem; font-size: 0.95rem;
          font-weight: 700; cursor: pointer;
          transition: background 0.15s, transform 0.12s, opacity 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-submit:hover:not(:disabled) { background: #7dd3fc; transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .section-divider {
          display: flex; align-items: center; gap: 0.75rem; margin: 1.75rem 0 1.25rem;
        }
        .section-divider span {
          font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #475569; white-space: nowrap;
        }
        .section-divider::before, .section-divider::after {
          content: ''; flex: 1; height: 1px; background: #1e293b;
        }
        .kode-preview {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.85rem 1rem; background: #38bdf808;
          border: 1px solid #38bdf830; border-radius: 10px; margin-bottom: 1.25rem;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="create-root">
        <nav style={{
          background: "#060d19", borderBottom: "1px solid #1e293b",
          padding: "0.75rem 1.5rem", display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
        }}>
          <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <i className="bi bi-tools" style={{ color: "#38bdf8", fontSize: "1.2rem" }}></i>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem" }}>
              Service <span style={{ color: "#38bdf8" }}>Tracking</span>
            </span>
          </Link>
          <Link href="/admin" className="btn-back">
            <i className="bi bi-arrow-left"></i>Kembali ke Dashboard
          </Link>
        </nav>

        <div style={{ maxWidth: "660px", margin: "0 auto", padding: "2.5rem 1.25rem 5rem" }}>
          <div className="fade-up" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
              <div style={{
                width: 38, height: 38, borderRadius: "10px", background: "#38bdf815",
                border: "1px solid #38bdf830", display: "flex", alignItems: "center",
                justifyContent: "center", color: "#38bdf8", fontSize: "1rem",
              }}>
                <i className="bi bi-plus-lg"></i>
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
                Terima Barang Servis
              </h1>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0, paddingLeft: "50px" }}>
              Isi data barang yang masuk. Field bertanda <span style={{ color: "#f87171" }}>*</span> wajib diisi.
            </p>
          </div>

          <div className="fade-up" style={{
            background: "#0d1b2e", border: "1px solid #1e293b",
            borderRadius: "16px", padding: "1.75rem 1.75rem 2rem", animationDelay: "0.06s",
          }}>
            <form onSubmit={handleSubmit} autoComplete="off">

              {/* Kode servis auto-generate preview */}
              <div className="kode-preview">
                <i className="bi bi-upc-scan" style={{ color: "#38bdf8", fontSize: "1rem" }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                    Kode Servis
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#38bdf8", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.06em" }}>
                    Auto-generate saat simpan
                  </p>
                </div>
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#475569", fontStyle: "italic" }}>
                  Format: SRV-YYYYMMDD-XXXX
                </span>
              </div>

              {/* Identifikasi barang */}
              <div className="section-divider">
                <span><i className="bi bi-box-seam me-1"></i>Identifikasi Barang</span>
              </div>
              {FIELDS.slice(0, 2).map((f) => (
                <FormField key={f.key} field={f} value={form[f.key]} onChange={handleChange} />
              ))}

              {/* Data pelanggan */}
              <div className="section-divider">
                <span><i className="bi bi-person me-1"></i>Data Pelanggan</span>
              </div>
              {FIELDS.slice(2, 5).map((f) => (
                <FormField key={f.key} field={f} value={form[f.key]} onChange={handleChange} />
              ))}

              {/* Notif indicator */}
              {(form.no_hp_pelanggan.trim() || form.email_pelanggan.trim()) && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: "0.5rem",
                  marginBottom: "1rem", padding: "0.65rem 1rem",
                  background: "#10b98108", border: "1px solid #10b98130", borderRadius: "8px",
                }}>
                  {form.no_hp_pelanggan.trim() && (
                    <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 600 }}>
                      <i className="bi bi-whatsapp me-1"></i>Notifikasi WA aktif
                    </span>
                  )}
                  {form.no_hp_pelanggan.trim() && form.email_pelanggan.trim() && (
                    <span style={{ color: "#334155" }}>·</span>
                  )}
                  {form.email_pelanggan.trim() && (
                    <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 600 }}>
                      <i className="bi bi-envelope-check me-1"></i>Notifikasi email aktif
                    </span>
                  )}
                </div>
              )}

              {/* Spesifikasi */}
              <div className="section-divider">
                <span><i className="bi bi-cpu me-1"></i>Spesifikasi</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                {FIELDS.slice(5, 7).map((f) => (
                  <FormField key={f.key} field={f} value={form[f.key]} onChange={handleChange} />
                ))}
              </div>

              {/* Keluhan */}
              <div className="section-divider">
                <span><i className="bi bi-chat-left-text me-1"></i>Keluhan</span>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="keluhan" style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#64748b", marginBottom: "0.45rem",
                }}>
                  <i className="bi bi-chat-left-dots"></i>
                  Deskripsi Keluhan
                  <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#475569", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>Opsional</span>
                </label>
                <textarea
                  id="keluhan"
                  className="form-textarea"
                  placeholder="Jelaskan keluhan atau kerusakan yang dialami barang…"
                  value={form.keluhan}
                  onChange={(e) => handleChange("keluhan", e.target.value)}
                />
              </div>

              {/* Status preview */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "0.7rem 1rem", background: "#3b82f608",
                border: "1px solid #3b82f630", borderRadius: "10px", marginBottom: "1.25rem",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 6px #3b82f6", flexShrink: 0 }} />
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                  Status awal otomatis: <span style={{ color: "#3b82f6", fontWeight: 700 }}>Diterima</span>
                </span>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading
                  ? <><i className="bi bi-arrow-repeat spin-icon"></i>Menyimpan...</>
                  : <><i className="bi bi-floppy"></i>Simpan & Terima Barang</>
                }
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/admin" style={{ color: "#334155", fontSize: "0.82rem", textDecoration: "none" }}>
              <i className="bi bi-arrow-left me-1"></i>Batalkan dan kembali ke dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
