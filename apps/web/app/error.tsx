"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 shadow-sm">
        <AlertCircle size={32} />
      </div>
      <h1 className="mt-4 text-2xl font-black text-ink">Произошла ошибка</h1>
      <p className="mt-2 text-sm text-slate-500">
        {error.message || "Не удалось загрузить страницу. Попробуйте обновить."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-brand transition-colors"
        >
          <RotateCcw size={16} />
          Повторить попытку
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Home size={16} />
          На главную
        </Link>
      </div>
    </main>
  );
}
