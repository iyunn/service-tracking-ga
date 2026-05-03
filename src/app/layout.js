import "./globals.css";

export const metadata = {
  title: "Service Tracking GA",
  description: "Aplikasi pelacakan layanan GA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Bootstrap 5 CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
        {/* Bootstrap Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;700&display=swap"
        />

      </head>
      <body>
        {children}

        {/* Bootstrap 5 JS Bundle (Popper included) */}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-YvpcrYf0tY3lHB60NNkmXc4s9bIOgUxi8T/jzmGmO8bsSUX8j3eFZ/1PBZ/MvILB"
          crossOrigin="anonymous"
          async
        />
      </body>
    </html>
  );
}