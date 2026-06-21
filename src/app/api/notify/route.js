import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const STATUS_LABEL = {
  DITERIMA:             "Diterima",
  MENUNGGU_ANTRIAN:     "Menunggu Antrian",
  PEMESANAN_SPAREPART:  "Pemesanan Sparepart",
  PROSES_PENGERJAAN:    "Proses Pengerjaan & Testing",
  SELESAI:              "Selesai Service",
};

const STATUS_COLOR = {
  DITERIMA:             "#3b82f6",
  MENUNGGU_ANTRIAN:     "#f59e0b",
  PEMESANAN_SPAREPART:  "#ec4899",
  PROSES_PENGERJAAN:    "#8b5cf6",
  SELESAI:              "#10b981",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email_pelanggan, nama_barang, kode_aset, status, catatan, lokasi } = body;

    if (!email_pelanggan || !status) {
      return NextResponse.json(
        { error: "email_pelanggan dan status wajib diisi" },
        { status: 400 }
      );
    }

    const statusLabel = STATUS_LABEL[status] ?? status;
    const statusColor = STATUS_COLOR[status] ?? "#64748b";

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Update Status Servis</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:28px 36px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#38bdf8;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
                🔧 Service Tracking
              </p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;">
                Update Status Servis
              </h1>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding:28px 36px 0;text-align:center;">
              <span style="display:inline-block;padding:8px 24px;border-radius:999px;background:${statusColor}18;border:1.5px solid ${statusColor}60;color:${statusColor};font-size:14px;font-weight:700;letter-spacing:0.04em;">
                ${statusLabel}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 36px 8px;">
              <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.7;">
                Halo, berikut adalah update terbaru untuk barang servis Anda:
              </p>

              <!-- Info Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;width:40%;">Nama Barang</td>
                  <td style="padding:10px 16px;font-size:14px;color:#1e293b;font-weight:600;">${nama_barang ?? "—"}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Kode / ID</td>
                  <td style="padding:10px 16px;font-size:14px;color:#1e293b;font-weight:600;font-family:monospace;">${kode_aset ?? "—"}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;background:#f8fafc;">
                  <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Status</td>
                  <td style="padding:10px 16px;font-size:14px;font-weight:700;color:${statusColor};">${statusLabel}</td>
                </tr>
                ${lokasi ? `
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Lokasi</td>
                  <td style="padding:10px 16px;font-size:14px;color:#1e293b;">${lokasi}</td>
                </tr>` : ""}
                ${catatan ? `
                <tr style="border-top:1px solid #e2e8f0;background:#f8fafc;">
                  <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Catatan</td>
                  <td style="padding:10px 16px;font-size:14px;color:#475569;line-height:1.6;">${catatan}</td>
                </tr>` : ""}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px 32px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">
                Email ini dikirim otomatis oleh sistem Service Tracking.<br/>
                Jika ada pertanyaan, silakan hubungi teknisi yang menangani.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email_pelanggan,
      subject: `[Service Tracking] Update Status: ${statusLabel} — ${nama_barang ?? kode_aset}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Notify API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
