"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Check, UserRound } from "lucide-react";
import { saveSession, clearSession } from "@/lib/api";
import { usePreferences } from "@/components/app-preferences";

type Role = "SEEKER" | "EMPLOYER" | "ADMIN";

export default function AuthPage() {
  const { t } = usePreferences();
  const [role, setRole] = useState<Role>("SEEKER");
  const [mode, setMode] = useState("register");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qMode = new URLSearchParams(window.location.search).get("mode");
      if (qMode === "login") setMode("login");
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("fullName") || "").trim();

    try {
      // Сбрасываем сессию прошлого пользователя (включая refresh-cookie на сервере)
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
      clearSession();

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          fullName: mode === "register" ? fullName : undefined,
          role: mode === "register" ? role : undefined,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        let msg = "Ошибка авторизации";
        if (typeof result?.message === "string") {
          msg = result.message;
        } else if (Array.isArray(result?.message)) {
          msg = result.message.join(", ");
        } else if (result?.fieldErrors) {
          msg = Object.values(result.fieldErrors).flat().join(", ");
        } else if (result?.formErrors && result.formErrors.length > 0) {
          msg = result.formErrors.join(", ");
        }
        throw new Error(msg || "Проверьте данные: имя от 2 символов, корректный email, пароль от 6 символов.");
      }

      saveSession(result.accessToken, result.user, true);
      window.location.href = result.user?.role === "EMPLOYER" ? "/employer" : "/dashboard";
    } catch (err: any) {
      setError(err?.message && err.message !== "Failed to fetch" ? err.message : t("serviceUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-72px)] place-items-center px-5 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft md:p-10">
        <p className="text-sm font-bold text-brand">MANGYSTAU CV</p>
        <h1 className="mt-2 text-3xl font-black text-ink">
          {mode === "login" ? t("authBack") : t("authCreate")}
        </h1>
        <p className="mt-2 text-slate-500">
          {mode === "login" ? t("authLoginText") : t("authRegisterText")}
        </p>

        {mode !== "login" && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              ["SEEKER", t("seeker"), t("seekerInfo"), UserRound],
              ["EMPLOYER", t("employer"), t("employerInfo"), Building2],
            ].map(([value, title, desc, Icon]: any) => (
              <button
                type="button"
                key={value}
                aria-pressed={role === value}
                onClick={() => setRole(value as Role)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  role === value
                    ? "border-brand bg-emerald-50/70 ring-2 ring-brand/30 shadow-xs"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon className="mb-3 text-brand" size={24} />
                <strong className="block text-ink">{title}</strong>
                <span className="mt-1 block text-xs text-slate-500">{desc}</span>
                {role === value && (
                  <Check className="absolute right-3 top-3 text-brand" size={17} />
                )}
              </button>
            ))}
          </div>
        )}

        <form className="mt-6 space-y-3.5" onSubmit={submit}>
          {mode !== "login" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {role === "EMPLOYER" ? t("contactPerson") : t("fullName")}
              </label>
              <input
                name="fullName"
                required
                minLength={2}
                placeholder={role === "EMPLOYER" ? "Имя Фамилия или Название компании" : "Азамат Серікбаев"}
                className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-ink outline-none focus:border-brand focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t("email")}
            </label>
            <input
              name="email"
              required
              type="email"
              placeholder="example@mangystau.kz"
              className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-ink outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t("password")}
            </label>
            <input
              name="password"
              required
              type="password"
              minLength={6}
              placeholder="Минимум 6 символов"
              className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-ink outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink font-bold text-white shadow-sm hover:bg-brand transition-colors disabled:opacity-50"
          >
            {busy ? t("wait") : mode === "login" ? t("loginAction") : t("createAction")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? t("newHere") : t("alreadyAccount")}{" "}
          <button
            type="button"
            className="font-bold text-brand hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? t("register") : t("login")}
          </button>
        </p>

        <Link className="mt-4 block text-center text-xs font-semibold text-slate-400 hover:text-ink" href="/">
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
