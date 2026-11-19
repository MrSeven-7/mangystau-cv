"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserRound,
  Languages,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiRequest, clearSession } from "@/lib/api";
import { usePreferences } from "@/components/app-preferences";

type SessionUser = { fullName: string; role: string; email?: string; avatarUrl?: string | null };

export function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, theme, toggleTheme, t } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/resume", label: t("navResume"), icon: FileText },
    { href: "/jobs", label: t("navJobs"), icon: Search },
  ];

  useEffect(() => {
    function readSession() {
      try {
        const storedUser = localStorage.getItem("mangystau-user");
        if (storedUser && localStorage.getItem("mangystau-access-token")) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch {
        clearSession();
      }
      setSessionChecked(true);
    }

    readSession();
    window.addEventListener("mangystau-session-change", readSession);
    return () => window.removeEventListener("mangystau-session-change", readSession);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {}
    clearSession();
    setUser(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    window.location.href = "/";
  }

  const isAdmin = user && (user.role === "ADMIN" || user.email === "root@root.com");
  const userInitials = user?.fullName
    ? user.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="text-xl font-black tracking-tight">
          Mangystau <span className="text-brand">CV</span>
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-2 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                pathname.startsWith(href)
                  ? "bg-emerald-50 text-brand"
                  : "text-slate-600 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right Desktop Section */}
        <div className="hidden items-center gap-3 md:flex">
          {!sessionChecked ? null : !user ? (
            /* Guest controls: Language + Theme + Login/Register */
            <div className="flex items-center gap-2.5">
              <div
                role="group"
                aria-label={t("language")}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1"
              >
                <button
                  type="button"
                  aria-pressed={locale === "ru"}
                  onClick={() => setLocale("ru")}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                    locale === "ru" ? "bg-ink text-white shadow-xs" : "text-slate-500 hover:text-ink"
                  }`}
                >
                  RU
                </button>
                <button
                  type="button"
                  aria-pressed={locale === "kk"}
                  onClick={() => setLocale("kk")}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                    locale === "kk" ? "bg-ink text-white shadow-xs" : "text-slate-500 hover:text-ink"
                  }`}
                >
                  KZ
                </button>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? t("lightTheme") : t("darkTheme")}
                title={theme === "dark" ? t("lightTheme") : t("darkTheme")}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <Link
                href="/auth?mode=login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-ink"
              >
                {t("login")}
              </Link>
              <Link
                href="/auth?mode=register"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand transition-colors"
              >
                {t("register")}
              </Link>
            </div>
          ) : (
            /* Logged-in User Profile Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-3.5 transition-all ${
                  profileDropdownOpen
                    ? "border-brand bg-emerald-50/60 ring-2 ring-brand/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-brand font-black text-xs text-white shadow-xs">
                  {userInitials}
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-ink leading-tight">
                    {user.fullName.split(" ")[0]}
                  </span>
                  {isAdmin && (
                    <span className="block text-[10px] font-extrabold text-amber-700 leading-none">
                      Admin
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    profileDropdownOpen ? "rotate-180 text-brand" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Header */}
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-xs font-bold text-ink truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email || "Пользователь"}</p>
                  </div>

                  {/* Navigation Actions */}
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-brand transition-colors"
                    >
                      <UserRound size={15} className="text-brand" />
                      {t("profile")}
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                      >
                        <ShieldCheck size={16} className="text-amber-700" />
                        {t("adminPanel")}
                      </Link>
                    )}
                  </div>

                  {/* Settings Divider */}
                  <div className="my-1 border-t border-slate-100" />

                  {/* Language Switcher Row */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Languages size={14} />
                      {t("language")}
                    </span>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setLocale("ru")}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                          locale === "ru" ? "bg-ink text-white" : "text-slate-500 hover:text-ink"
                        }`}
                      >
                        RU
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocale("kk")}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                          locale === "kk" ? "bg-ink text-white" : "text-slate-500 hover:text-ink"
                        }`}
                      >
                        KZ
                      </button>
                    </div>
                  </div>

                  {/* Theme Switcher Row */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                      {theme === "dark" ? "Тёмная тема" : "Светлая тема"}
                    </span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {theme === "dark" ? "Выкл" : "Вкл"}
                    </button>
                  </div>

                  {/* Logout Divider */}
                  <div className="my-1 border-t border-slate-100" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 md:hidden"
          aria-label={t("openMenu")}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white p-5 md:hidden space-y-4">
          <div className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-brand"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-sm font-bold text-ink">{user.fullName}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-emerald-50"
                >
                  <UserRound size={18} className="text-brand" />
                  {t("profile")}
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-xl bg-amber-50 px-3 text-sm font-bold text-amber-900"
                  >
                    <ShieldCheck size={18} className="text-amber-700" />
                    {t("adminPanel")}
                  </Link>
                )}

                {/* Preference Controls inside Mobile Menu */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">{t("language")}</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setLocale("ru")}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                        locale === "ru" ? "bg-ink text-white" : "text-slate-500"
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale("kk")}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                        locale === "kk" ? "bg-ink text-white" : "text-slate-500"
                      }`}
                    >
                      KZ
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">
                    {theme === "dark" ? "Тёмная тема" : "Светлая тема"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                </div>

                <button
                  onClick={logout}
                  className="flex w-full min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Link
                    href="/auth?mode=login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-full border border-slate-200 p-3 text-center text-sm font-semibold"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-full bg-ink p-3 text-center text-sm font-semibold text-white"
                  >
                    {t("register")}
                  </Link>
                </div>

                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setLocale("ru")}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                        locale === "ru" ? "bg-ink text-white" : "text-slate-500"
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale("kk")}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                        locale === "kk" ? "bg-ink text-white" : "text-slate-500"
                      }`}
                    >
                      KZ
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700"
                  >
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}