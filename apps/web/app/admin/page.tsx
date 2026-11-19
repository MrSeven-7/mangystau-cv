"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  RotateCcw,
  Eye,
  Trash2,
  Building2,
  MapPin,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Filter,
  Sparkles,
} from "lucide-react";
import { usePreferences } from "@/components/app-preferences";
import {
  getStoredVacancies,
  fetchAdminVacanciesFromDB,
  updateVacancyModerationInDB,
  deleteVacancyInDB,
  resetVacanciesToDefault,
  type Vacancy,
  type ModerationStatus,
} from "@/lib/vacancies-store";
import { VacancyDetailsModal } from "@/components/vacancy-details-modal";
import { AddVacancyModal } from "@/components/add-vacancy-modal";

export default function AdminPage() {
  const { t, locale } = usePreferences();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ModerationStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ fullName: string; role: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Reject reason dialog
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  // Notification feedback
  const [actionNotice, setActionNotice] = useState("");

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(""), 3500);
  };

  const loadData = async () => {
    // Instant local render
    const list = getStoredVacancies();
    setVacancies([...list]);

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mangystau-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {}
    }

    // Verify latest profile from DB (/api/auth/me)
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("mangystau-access-token") || ""}`,
        },
      });
      if (res.ok) {
        const freshUser = await res.json();
        setUser(freshUser);
        localStorage.setItem("mangystau-user", JSON.stringify(freshUser));
      }
    } catch {}

    setLoading(false);

    // Fetch fresh database state
    try {
      const dbList = await fetchAdminVacanciesFromDB();
      if (Array.isArray(dbList) && dbList.length > 0) {
        setVacancies([...dbList]);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("mangystau-vacancies-updated", handleUpdate);
    window.addEventListener("mangystau-session-change", handleUpdate);
    return () => {
      window.removeEventListener("mangystau-vacancies-updated", handleUpdate);
      window.removeEventListener("mangystau-session-change", handleUpdate);
    };
  }, []);

  const handleApprove = async (id: string, title: string) => {
    await updateVacancyModerationInDB(id, "APPROVED");
    loadData();
    showNotice(`Вакансия «${title}» одобрена и сохранена в БД!`);
  };

  const handleOpenReject = (id: string) => {
    setRejectingId(id);
    setRejectComment("");
  };

  const handleConfirmReject = async (id: string, title: string) => {
    await updateVacancyModerationInDB(id, "REJECTED", rejectComment.trim() || undefined);
    setRejectingId(null);
    setRejectComment("");
    loadData();
    showNotice(`Вакансия «${title}» отклонена в БД.`);
  };

  const handleReturnPending = async (id: string, title: string) => {
    await updateVacancyModerationInDB(id, "PENDING");
    loadData();
    showNotice(`Вакансия «${title}» возвращена в очередь модерации.`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Вы действительно хотите удалить вакансию «${title}»?`)) {
      await deleteVacancyInDB(id);
      loadData();
      showNotice(`Вакансия «${title}» удалена из базы.`);
    }
  };

  const handleResetData = () => {
    if (confirm("Сбросить вакансии к первоначальному демо-списку?")) {
      resetVacanciesToDefault();
      loadData();
      showNotice("Список вакансий сброшен к начальному состоянию.");
    }
  };

  const enableAdminRole = () => {
    const updated = {
      fullName: user?.fullName || "Администратор Мангистау",
      role: "ADMIN",
      email: user?.email || "admin@mangystau-cv.kz",
    };
    localStorage.setItem("mangystau-user", JSON.stringify(updated));
    window.dispatchEvent(new Event("mangystau-session-change"));
    setUser(updated);
    showNotice("Вы вошли с правами Администратора!");
  };

  const stats = {
    total: vacancies.length,
    pending: vacancies.filter((v) => v.moderationStatus === "PENDING").length,
    approved: vacancies.filter((v) => v.moderationStatus === "APPROVED").length,
    rejected: vacancies.filter((v) => v.moderationStatus === "REJECTED").length,
  };

  const filtered = vacancies.filter((v) => {
    const matchStatus = statusFilter === "ALL" || v.moderationStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.company.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-5 py-12">
        <p className="text-sm text-slate-500">Загрузка панели администратора...</p>
      </main>
    );
  }

  // Admin check: strictly for root@root.com or users with ADMIN role
  const isSuperAdmin = user && (user.email === "root@root.com" || user.role === "ADMIN");

  if (!isSuperAdmin) {
    return (
      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-4xl px-5 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle size={32} />
          </div>
          <h1 className="mt-4 text-3xl font-black text-ink">{t("adminAccessOnly")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Для просмотра и управления модерацией вакансий требуется вход с учетной записи администратора (<b>root@root.com</b>).
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth?mode=login"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-bold text-white shadow-sm hover:bg-[#0f604d] transition-colors"
            >
              <ShieldCheck size={18} />
              Войти как root@root.com
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              Перейти к вакансиям
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-10 lg:px-8">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-5">
          {actionNotice}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            <ShieldCheck size={14} />
            {t("adminPanel")}
          </div>
          <h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">
            {t("vacanciesModeration")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Проверяйте новые предложения работы от компаний региона перед их публикацией в общем каталоге.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0f604d] transition-colors"
          >
            <Plus size={16} />
            {t("newVacancy")}
          </button>
          <button
            type="button"
            onClick={handleResetData}
            title="Восстановить исходные тестовые данные"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-ink transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            statusFilter === "ALL"
              ? "border-brand bg-emerald-50/40 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t("statsTotal")}
          </span>
          <p className="mt-2 text-3xl font-black text-ink">{stats.total}</p>
        </div>

        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            statusFilter === "PENDING"
              ? "border-amber-400 bg-amber-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {t("statsPending")}
            </span>
            {stats.pending > 0 && (
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <p className="mt-2 text-3xl font-black text-amber-600">{stats.pending}</p>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            statusFilter === "APPROVED"
              ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {t("statsApproved")}
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-600">{stats.approved}</p>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${
            statusFilter === "REJECTED"
              ? "border-red-400 bg-red-50/40 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            {t("statsRejected")}
          </span>
          <p className="mt-2 text-3xl font-black text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "ALL" ? "bg-ink text-white" : "text-slate-600 hover:text-ink"
            }`}
          >
            {t("allVacancies")} ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-white"
                : "text-slate-600 hover:text-amber-700"
            }`}
          >
            {t("pendingModeration")} ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "APPROVED"
                ? "bg-brand text-white"
                : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            {t("approved")} ({stats.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "REJECTED"
                ? "bg-red-600 text-white"
                : "text-slate-600 hover:text-red-700"
            }`}
          >
            {t("rejected")} ({stats.rejected})
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или фирме..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-ink focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Moderation List */}
      <div className="mt-6 space-y-4">
        {filtered.length ? (
          filtered.map((item) => {
            const isPending = item.moderationStatus === "PENDING";
            const isApproved = item.moderationStatus === "APPROVED";
            const isRejected = item.moderationStatus === "REJECTED";

            return (
              <article
                key={item.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm transition-all sm:p-6 ${
                  isPending
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : isRejected
                    ? "border-red-200 opacity-90"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Info */}
                  <div className="max-w-3xl space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-800"
                            : isRejected
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-900 animate-pulse"
                        }`}
                      >
                        {isApproved && <CheckCircle2 size={13} />}
                        {isRejected && <XCircle size={13} />}
                        {isPending && <Clock size={13} />}
                        {isApproved
                          ? t("approved")
                          : isRejected
                          ? t("rejected")
                          : t("pendingModeration")}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {item.city}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {item.schedule}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-ink">{item.title}</h2>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Building2 size={15} className="text-brand" />
                        {item.company}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-brand flex items-center gap-1">
                        <Wallet size={15} />
                        {item.salary}
                      </span>
                      <span>•</span>
                      <span className="text-xs text-slate-400">
                        Добавлено: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {item.description}
                    </p>

                    {isRejected && item.moderationComment && (
                      <p className="rounded-xl bg-red-50 p-2 text-xs text-red-700">
                        <strong>Причина:</strong> {item.moderationComment}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 lg:border-t-0 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVacancy(item);
                        setIsDetailsOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Eye size={14} />
                      {t("details")}
                    </button>

                    {/* Approve button */}
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id, item.title)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                        {t("approve")}
                      </button>
                    )}

                    {/* Reject button */}
                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleOpenReject(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={14} />
                        {t("reject")}
                      </button>
                    )}

                    {/* Return to pending */}
                    {(isApproved || isRejected) && (
                      <button
                        type="button"
                        onClick={() => handleReturnPending(item.id, item.title)}
                        title={t("returnToPending")}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Clock size={13} />
                        {t("returnToPending")}
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      title={t("delete")}
                      className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Inline Rejection Reason Form */}
                {rejectingId === item.id && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/60 p-4 animate-in fade-in">
                    <label className="text-xs font-bold text-red-900">
                      Укажите причину отклонения вакансии:
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      placeholder={t("moderationCommentPlaceholder")}
                      className="mt-1.5 w-full rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs text-ink focus:border-red-500 focus:outline-none"
                    />
                    <div className="mt-2.5 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmReject(item.id, item.title)}
                        className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                      >
                        Подтвердить отклонение
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h3 className="text-base font-bold text-ink">В этой категории вакансий нет</h3>
            <p className="mt-1 text-xs text-slate-400">
              Попробуйте сменить фильтр статуса или очистить строку поиска.
            </p>
          </div>
        )}
      </div>

      {/* Full Vacancy Details Preview Modal */}
      <VacancyDetailsModal
        vacancy={selectedVacancy}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedVacancy(null);
        }}
        isAdminPreview={true}
      />

      {/* Add New Vacancy Modal */}
      <AddVacancyModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => {
          loadData();
          showNotice("Новая вакансия добавлена!");
        }}
        defaultApproved={true}
      />
    </main>
  );
}
