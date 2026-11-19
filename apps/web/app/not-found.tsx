import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-brand shadow-sm">
        <Search size={30} />
      </div>
      <span className="mt-4 text-xs font-bold uppercase tracking-wider text-brand">404 Ошибка</span>
      <h1 className="mt-1 text-3xl font-black text-ink">Страница не найдена</h1>
      <p className="mt-2 text-sm text-slate-500">
        Возможно, адрес введен с ошибкой или страница была перемещена.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-brand transition-colors"
        >
          <Home size={16} />
          На главную
        </Link>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
          К списку вакансий
        </Link>
      </div>
    </main>
  );
}
