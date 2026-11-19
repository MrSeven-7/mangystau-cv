"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#f8f9f6", color: "#12231c" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "900" }}>Что-то пошло не так</h1>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#64748b" }}>
            Произошла критическая ошибка приложения.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#147d64",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Перезагрузить приложение
          </button>
        </div>
      </body>
    </html>
  );
}
