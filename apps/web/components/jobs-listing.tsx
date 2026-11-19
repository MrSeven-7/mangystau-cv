"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  CheckCircle2,
  Building2,
  Sparkles,
  Flame,
  X,
  LayoutGrid,
  Fuel,
  Ship,
  HardHat,
  Hotel,
  Zap,
  ShoppingCart,
} from "lucide-react";
import { usePreferences } from "@/components/app-preferences";
import {
  getApprovedVacancies,
  getStoredVacancies,
  fetchPublicVacanciesFromDB,
  type Vacancy,
} from "@/lib/vacancies-store";
import { VacancyDetailsModal } from "@/components/vacancy-details-modal";

const quickCategories = [
  { key: "", labelRu: "Все сферы", labelKk: "Барлық салалар", icon: LayoutGrid },
  { key: "oil", labelRu: "Нефтегаз и добыча", labelKk: "Мұнай-газ", icon: Fuel },
  { key: "logistics", labelRu: "Транспорт и логистика", labelKk: "Логистика", icon: Ship },
  { key: "construction", labelRu: "Строительство", labelKk: "Құрылыс", icon: HardHat },
  { key: "tourism", labelRu: "Туризм и отели", labelKk: "Туризм", icon: Hotel },
  { key: "utilities", labelRu: "ЖКХ и энергетика", labelKk: "ТКШ", icon: Zap },
  { key: "retail", labelRu: "Торговля", labelKk: "Сауда", icon: ShoppingCart },
];

const cities = [
  { key: "aktau", labelRu: "Актау", labelKk: "Ақтау" },
  { key: "zhanaozen", labelRu: "Жанаозен", labelKk: "Жаңаөзен" },
  { key: "fort", labelRu: "Форт-Шевченко", labelKk: "Форт-Шевченко" },
  { key: "kuryk", labelRu: "Курык", labelKk: "Құрық" },
  { key: "beyneu", labelRu: "Бейнеу", labelKk: "Бейнеу" },
];

const schedules = [
  { key: "rotational", labelRu: "Вахтовый метод", labelKk: "Вахталық әдіс" },
  { key: "fullTime", labelRu: "Полный рабочий день", labelKk: "Толық күн" },
  { key: "shift", labelRu: "Сменный график", labelKk: "Ауысымдық" },
];

export default function JobsListing() {
  const params = useSearchParams();
  const { t, locale } = usePreferences();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters state
  const [query, setQuery] = useState(params.get("q") || "");
  const [industry, setIndustry] = useState(params.get("industry") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [schedule, setSchedule] = useState(params.get("schedule") || "");

  const refreshVacancies = async () => {
    // 1. Instant load from local cache
    const approved = getApprovedVacancies();
    setVacancies(approved);

    const all = getStoredVacancies();
    const pending = all.filter((v) => v.moderationStatus === "PENDING").length;
    setPendingCount(pending);

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mangystau-user");
        if (stored) {
          const u = JSON.parse(stored);
          setIsAdmin(u.role === "ADMIN");
        }
      } catch {}
    }

    // 2. Fetch fresh data directly from PostgreSQL backend
    try {
      const dbApproved = await fetchPublicVacanciesFromDB();
      if (Array.isArray(dbApproved) && dbApproved.length > 0) {
        setVacancies(dbApproved);
      }
    } catch {}
  };

  useEffect(() => {
    refreshVacancies();
    const handleUpdate = () => refreshVacancies();
    window.addEventListener("mangystau-vacancies-updated", handleUpdate);
    window.addEventListener("mangystau-session-change", handleUpdate);
    return () => {
      window.removeEventListener("mangystau-vacancies-updated", handleUpdate);
      window.removeEventListener("mangystau-session-change", handleUpdate);
    };
  }, []);

  const openDetails = (vac: Vacancy) => {
    setSelectedVacancy(vac);
    setIsDetailsOpen(true);
  };

  const getIndustryLabel = (key: string) => {
    const item = quickCategories.find((i) => i.key.toLowerCase() === key.toLowerCase());
    if (item) return locale === "kk" ? item.labelKk : item.labelRu;
    return key;
  };

  const getCityLabel = (key: string) => {
    const item = cities.find((c) => c.key.toLowerCase() === key.toLowerCase());
    if (item) return locale === "kk" ? item.labelKk : item.labelRu;
    return key;
  };

  const getScheduleLabel = (key: string) => {
    const item = schedules.find((s) => s.key.toLowerCase() === key.toLowerCase());
    if (item) return locale === "kk" ? item.labelKk : item.labelRu;
    return key;
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  const filtered = vacancies.filter((job) => {
    const qLower = query.toLowerCase().trim();
    const matchQuery =
      !qLower ||
      job.title.toLowerCase().includes(qLower) ||
      job.company.toLowerCase().includes(qLower) ||
      job.description.toLowerCase().includes(qLower) ||
      getIndustryLabel(job.industry).toLowerCase().includes(qLower) ||
      getCityLabel(job.city).toLowerCase().includes(qLower);

    const matchIndustry = !industry || job.industry.toLowerCase() === industry.toLowerCase();
    const matchCity = !city || job.city.toLowerCase() === city.toLowerCase();
    const matchSchedule = !schedule || job.schedule.toLowerCase() === schedule.toLowerCase();

    return matchQuery && matchIndustry && matchCity && matchSchedule;
  });

  const hasActiveFilters = Boolean(query || industry || city || schedule);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Admin Floating Banner */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-emerald-50/50 p-4 sm:p-5 shadow-soft">
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Режим администратора
                </span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black text-white animate-pulse">
                    {pendingCount} на модерации
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-700">
                {pendingCount > 0
                  ? `В очереди модерации ${pendingCount} новых вакансий, ожидающих вашего решения.`
                  : "Все вакансии в системе проверены и опубликованы в каталоге."}
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand transition-all hover:scale-105"
          >
            {t("adminPanel")}
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="rounded-[2.5rem] border border-black/5 bg-gradient-to-b from-white via-white to-[#f0f6f3] p-6 shadow-soft sm:p-10 lg:p-12">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/80 px-3.5 py-1 text-xs font-bold text-brand backdrop-blur-sm">
              <Sparkles size={14} />
              <span>{t("jobsTag")}</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl leading-tight">
              {t("jobsTitle")}
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              {t("jobsText")} — прямые контакты работодателей, проверенные зарплаты и подтвержденные условия вахты.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-card text-center min-w-[130px]">
              <span className="block text-3xl font-black text-brand">{filtered.length}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("vacancies")}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="mt-8 flex flex-wrap gap-2 pt-2">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = (!cat.key && !industry) || industry === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setIndustry(cat.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-brand text-white shadow-sm scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} className={isSelected ? "text-white" : "text-brand"} />
                <span>{locale === "kk" ? cat.labelKk : cat.labelRu}</span>
              </button>
            );
          })}
        </div>

        {/* Main Search & Filters Bar */}
        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          {/* Search Input */}
          <label className="flex min-h-12 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 focus-within:border-brand focus-within:bg-white transition-colors">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Должность, компания или навык..."
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-slate-400 hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </label>

          {/* Industry Filter */}
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="min-h-12 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 text-sm font-medium text-ink outline-none focus:border-brand focus:bg-white transition-colors cursor-pointer"
          >
            <option value="">{t("allIndustries")}</option>
            {quickCategories
              .filter((c) => c.key)
              .map((c) => (
                <option key={c.key} value={c.key}>
                  {locale === "kk" ? c.labelKk : c.labelRu}
                </option>
              ))}
          </select>

          {/* City Filter */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="min-h-12 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 text-sm font-medium text-ink outline-none focus:border-brand focus:bg-white transition-colors cursor-pointer"
          >
            <option value="">{t("allCities")}</option>
            {cities.map((c) => (
              <option key={c.key} value={c.key}>
                {locale === "kk" ? c.labelKk : c.labelRu}
              </option>
            ))}
          </select>

          {/* Schedule Filter */}
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="min-h-12 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 text-sm font-medium text-ink outline-none focus:border-brand focus:bg-white transition-colors cursor-pointer"
          >
            <option value="">{t("anySchedule")}</option>
            {schedules.map((s) => (
              <option key={s.key} value={s.key}>
                {locale === "kk" ? s.labelKk : s.labelRu}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={() => {
              setQuery("");
              setIndustry("");
              setCity("");
              setSchedule("");
            }}
            title={t("resetFilters")}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden xl:inline">{t("resetFilters")}</span>
          </button>
        </div>
      </div>

      {/* Vacancies List */}
      <div className="mt-8 space-y-4">
        {filtered.length ? (
          filtered.map((job) => (
            <article
              key={job.id}
              onClick={() => openDetails(job)}
              className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-hover sm:p-7"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                {/* Left Side: Avatar + Details */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 font-black text-brand text-lg border border-emerald-900/10 group-hover:bg-brand group-hover:text-white transition-colors shadow-2xs">
                    {getCompanyInitials(job.company)}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-brand">
                        {getIndustryLabel(job.industry)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {getCityLabel(job.city)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {getScheduleLabel(job.schedule)}
                      </span>
                      {job.experience && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {job.experience}
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <h2 className="text-xl font-black text-ink group-hover:text-brand transition-colors sm:text-2xl">
                      {job.title}
                    </h2>

                    {/* Company and Verified status */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Building2 size={16} className="text-brand" />
                      <span>{job.company}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={12} />
                        Проверено
                      </span>
                    </div>

                    {/* Description Snippet */}
                    <p className="pt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 max-w-3xl">
                      {job.description}
                    </p>

                    {/* Perks Highlights if available */}
                    {job.conditions && job.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-slate-600 font-medium">
                        {job.conditions.slice(0, 2).map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-emerald-800">
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Salary + Action Buttons */}
                <div
                  className="flex flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 lg:flex-col lg:items-end lg:justify-center lg:border-t-0 lg:pt-0 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lg:text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      {t("salary")}
                    </span>
                    <span className="text-lg font-black text-brand sm:text-xl block">
                      {job.salary}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDetails(job)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Eye size={14} />
                      {t("details")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(job)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f604d] transition-all hover:scale-105"
                    >
                      {t("apply")}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Search size={24} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink">{t("noJobs")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("changeFilters")}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIndustry("");
                setCity("");
                setSchedule("");
              }}
              className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f604d] transition-colors"
            >
              {t("resetFilters")}
            </button>
          </div>
        )}
      </div>

      {/* Full Vacancy Details Modal */}
      <VacancyDetailsModal
        vacancy={selectedVacancy}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedVacancy(null);
        }}
      />
    </main>
  );
}