"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  Clock3,
  Wallet,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Send,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { usePreferences } from "@/components/app-preferences";
import type { Vacancy } from "@/lib/vacancies-store";

interface VacancyDetailsModalProps {
  vacancy: Vacancy | null;
  isOpen: boolean;
  onClose: () => void;
  isAdminPreview?: boolean;
}

export function VacancyDetailsModal({
  vacancy,
  isOpen,
  onClose,
  isAdminPreview = false,
}: VacancyDetailsModalProps) {
  const { t, locale } = usePreferences();
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mangystau-user");
        if (stored) setUser(JSON.parse(stored));
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasApplied(false);
      setCoverLetter("");
      setIsSubmitting(false);
    }
  }, [isOpen, vacancy?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !vacancy) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHasApplied(true);
    }, 600);
  };

  const getCityName = (cityKey: string) => {
    const map: Record<string, string> = {
      aktau: "Актау",
      zhanaozen: "Жанаозен",
      fort: "Форт-Шевченко",
      kuryk: "Курык",
      beyneu: "Бейнеу",
    };
    return map[cityKey.toLowerCase()] || cityKey;
  };

  const getScheduleName = (schedKey: string) => {
    const map: Record<string, string> = {
      rotational: "Вахта / ротация",
      fulltime: "Полный рабочий день (5/2)",
      shift: "Сменный график",
    };
    return map[schedKey.toLowerCase()] || schedKey;
  };

  const getIndustryName = (indKey: string) => {
    const map: Record<string, string> = {
      oil: "Нефтегаз и добыча",
      logistics: "Транспорт и логистика",
      construction: "Строительство",
      tourism: "Туризм и гостеприимство",
      utilities: "ЖКХ и энергетика",
      retail: "Торговля и дистрибуция",
    };
    return map[indKey.toLowerCase()] || indKey;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vacancy-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-ink transition-colors"
        >
          <X size={19} />
        </button>

        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-2 pr-10">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-brand">
            {getIndustryName(vacancy.industry)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {getCityName(vacancy.city)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {getScheduleName(vacancy.schedule)}
          </span>
          {isAdminPreview && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                vacancy.moderationStatus === "APPROVED"
                  ? "bg-emerald-100 text-emerald-800"
                  : vacancy.moderationStatus === "REJECTED"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {vacancy.moderationStatus === "APPROVED"
                ? `✓ ${t("approved")}`
                : vacancy.moderationStatus === "REJECTED"
                ? `✕ ${t("rejected")}`
                : `⏳ ${t("pendingModeration")}`}
            </span>
          )}
        </div>

        {/* Header: Title and Company */}
        <div className="mt-4">
          <h2 id="vacancy-details-title" className="text-2xl font-black text-ink sm:text-3xl leading-snug">
            {vacancy.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-base font-bold text-slate-700">
              <Building2 size={18} className="text-brand" />
              {vacancy.company}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <Calendar size={15} />
              {t("publishedDate")}:{" "}
              {new Date(vacancy.publishedAt).toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU")}
            </span>
          </div>
        </div>

        {/* Key Details Card: Salary & Quick Specs */}
        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 sm:grid-cols-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("salary")}
            </span>
            <p className="mt-1 text-lg font-black text-brand flex items-center gap-1.5">
              <Wallet size={18} />
              {vacancy.salary}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("experience")}
            </span>
            <p className="mt-1 text-sm font-bold text-ink flex items-center gap-1.5">
              <BriefcaseBusiness size={16} className="text-slate-400" />
              {vacancy.experience}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("location")}
            </span>
            <p className="mt-1 text-sm font-bold text-ink flex items-center gap-1.5">
              <MapPin size={16} className="text-slate-400" />
              {getCityName(vacancy.city)}, Мангистау
            </p>
          </div>
        </div>

        {/* Rejection comment alert if rejected */}
        {vacancy.moderationStatus === "REJECTED" && vacancy.moderationComment && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle size={16} />
              {t("rejectionReason")}:
            </p>
            <p className="mt-1 text-red-700">{vacancy.moderationComment}</p>
          </div>
        )}

        {/* Description */}
        <div className="mt-7">
          <h3 className="text-base font-black uppercase tracking-wide text-ink">
            Описание вакансии
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
            {vacancy.description}
          </p>
        </div>

        {/* Company About */}
        {vacancy.companyDescription && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("companyAbout")} «{vacancy.company}»
            </h4>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              {vacancy.companyDescription}
            </p>
          </div>
        )}

        {/* Responsibilities */}
        {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-black uppercase tracking-wide text-ink">
              {t("responsibilities")}
            </h3>
            <ul className="mt-2.5 space-y-2">
              {vacancy.responsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-brand">
                    ✓
                  </span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {vacancy.requirements && vacancy.requirements.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-black uppercase tracking-wide text-ink">
              {t("requirements")}
            </h3>
            <ul className="mt-2.5 space-y-2">
              {vacancy.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conditions */}
        {vacancy.conditions && vacancy.conditions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-black uppercase tracking-wide text-ink">
              {t("conditions")}
            </h3>
            <ul className="mt-2.5 space-y-2">
              {vacancy.conditions.map((cond, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Employer Contacts */}
        {vacancy.contacts && (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("contacts")} работодателя
            </h3>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              {vacancy.contacts.name && (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <User size={15} className="text-brand" />
                  {vacancy.contacts.name}
                </span>
              )}
              {vacancy.contacts.phone && (
                <a
                  href={`tel:${vacancy.contacts.phone}`}
                  className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline"
                >
                  <Phone size={15} />
                  {vacancy.contacts.phone}
                </a>
              )}
              {vacancy.contacts.email && (
                <a
                  href={`mailto:${vacancy.contacts.email}`}
                  className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-brand hover:underline"
                >
                  <Mail size={15} />
                  {vacancy.contacts.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Application Section */}
        {!isAdminPreview && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            {hasApplied ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center animate-in zoom-in-95">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <h4 className="mt-2 text-lg font-black text-ink">
                  {t("applySuccess")}
                </h4>
                <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
                  Работодатель «{vacancy.company}» получил ваше резюме и рассмотрит его в ближайшее время.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-ink px-6 py-2.5 text-sm font-bold text-white hover:bg-brand transition-colors"
                >
                  {t("close")}
                </button>
              </div>
            ) : user ? (
              <form onSubmit={handleApply} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <FileText size={17} className="text-brand" />
                    Отклик от имени: <span className="text-brand">{user.fullName}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-slate-500 hover:text-brand underline"
                  >
                    Проверить резюме в профиле
                  </Link>
                </div>

                <textarea
                  rows={3}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder={t("coverLetterPlaceholder")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none"
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0f604d] transition-colors disabled:opacity-50"
                  >
                    <Send size={15} />
                    {isSubmitting ? t("saving") : t("sendApplication")}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row">
                <div>
                  <h4 className="font-bold text-ink">{t("applyWithResume")}</h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Войдите или зарегистрируйтесь, чтобы отправить резюме в один клик.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/auth?mode=login"
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-brand transition-colors"
                  >
                    {t("loginAction")}
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-slate-50 transition-colors"
                  >
                    {t("register")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
