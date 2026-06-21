/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output: diperlukan untuk Docker/Railway deployment
  // Menghasilkan server.js minimal yang bisa dijalankan tanpa node_modules lengkap
  output: "standalone",

  allowedDevOrigins: ["10.27.102.96"],
  reactCompiler: true,
};

export default nextConfig;
