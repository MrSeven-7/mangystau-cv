"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  Camera,
  FileText,
  ImagePlus,
  MapPin,
  Pencil,
  UserRound,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  Wallet,
  Eye,
  Search,
  ShieldCheck,
} from "lucide-react";
import { apiRequest, clearSession } from "@/lib/api";
import { usePreferences } from "@/components/app-preferences";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { getApprovedVacancies, type Vacancy } from "@/lib/vacancies-store";
import { VacancyDetailsModal } from "@/components/vacancy-details-modal";

type Profile = {
  id: string;
  fullName: string;
  email: string;
  role: "SEEKER" | "EMPLOYER" | "ADMIN";
  createdAt: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

type Resume = {
  id?: string;
  title: string;
  templateId: string;
  updatedAt: string;
  theme?: { accent?: string };
  data: any;
};

type MediaField = "avatarUrl" | "bannerUrl";

const roleKeys = { SEEKER: "roleSeeker", EMPLOYER: "roleEmployer", ADMIN: "roleAdmin" };
const templateKeys: Record<string, string> = {
  classic: "classicTemplate",
  sidebar: "sidebarTemplate",
  editorial: "editorialTemplate",
  minimal: "minimalTemplate",
};

async function compressImage(file: File, kind: "avatar" | "banner", t: (key: string) => string) {
  if (!file.type.startsWith("image/")) throw new Error(t("imageInvalid"));
  if (file.size > 8 * 1024 * 1024) throw new Error(t("imageTooLarge"));
  const bitmap = await createImageBitmap(file);
  const width = kind === "avatar" ? 420 : 1200;
  const height = kind === "avatar" ? 420 : 340;
  const ratio = width / height;
  const sourceRatio = bitmap.width / bitmap.height;
  const sourceWidth = sourceRatio > ratio ? bitmap.height * ratio : bitmap.width;
  const sourceHeight = sourceRatio > ratio ? bitmap.height : bitmap.width / ratio;
  const sourceX = (bitmap.width - sourceWidth) / 2;
  const sourceY = (bitmap.height - sourceHeight) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(t("imageProcessFail"));
  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  bitmap.close();
  for (const quality of [0.78, 0.66, 0.54, 0.42]) {
    const image = canvas.toDataURL("image/webp", quality);
    if (image.length <= 80_000) return image;
  }
  throw new Error(t("imageCompressedTooLarge"));
}

export default function Dashboard() {
  const { t, locale } = usePreferences();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Vacancy[]>([]);
  const [selectedJob, setSelectedJob] = useState<Vacancy | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mediaBusy, setMediaBusy] = useState<MediaField | "">("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [searchStatus, setSearchStatus] = useState("ACTIVE");

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!localStorage.getItem("mangystau-access-token")) {
        setLoading(false);
        return;
      }
      try {
        const profileResponse = await apiRequest("/api/auth/me");
        if (!profileResponse.ok) {
          clearSession();
          return;
        }
        const currentProfile = await profileResponse.json();
        const resumeResponse = await apiRequest("/api/resumes/latest");
        let latestResume = null;
        if (resumeResponse.ok && resumeResponse.status !== 204) {
          const text = await resumeResponse.text();
          if (text) {
            try {
              latestResume = JSON.parse(text);
            } catch {}
          }
        }

        if (!cancelled) {
          setProfile(currentProfile);
          setResume(latestResume);
          try {
            localStorage.setItem("mangystau-user", JSON.stringify(currentProfile));
            window.dispatchEvent(new Event("mangystau-session-change"));
          } catch {}
          try {
            const savedStatus = localStorage.getItem(`mangystau-search-status-${currentProfile.id}`);
            if (savedStatus) setSearchStatus(savedStatus);
          } catch {}
          // Load top recommended jobs
          const approved = getApprovedVacancies();
          setRecommendedJobs(approved.slice(0, 3));
        }
      } catch {
        if (!cancelled) setError(t("apiError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();

    const handleProfileChange = () => {
      void loadProfile();
    };
    window.addEventListener("mangystau-profile-change", handleProfileChange);

    return () => {
      cancelled = true;
      window.removeEventListener("mangystau-profile-change", handleProfileChange);
    };
  }, []);

  async function uploadMedia(field: MediaField, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMediaBusy(field);
    setError("");
    try {
      const image = await compressImage(file, field === "avatarUrl" ? "avatar" : "banner", t);
      const response = await apiRequest("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: image }),
      });
      if (!response.ok) throw new Error(t("imageSaveFail"));
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("imageUploadFail"));
    } finally {
      setMediaBusy("");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-5xl px-5 py-12">
        <p className="text-sm text-slate-500">{t("dashboardLoading")}</p>
      </main>
    );
  }

  if (!profile && error) {
    return (
      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-5xl px-5 py-12">
        <p className="text-sm font-bold text-brand">{t("privateCabinet")}</p>
        <h1 className="mt-2 text-3xl font-black">{t("profileUnavailable")}</h1>
        <p role="alert" className="mt-2 text-slate-500">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-brand"
        >
          {t("retry")}
        </button>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-5xl px-5 py-12">
        <p className="text-sm font-bold text-brand">{t("privateCabinet")}</p>
        <h1 className="mt-2 text-3xl font-black">{t("signIn")}</h1>
        <p className="mt-2 text-slate-500">{t("signInHint")}</p>
        <Link
          href="/auth?mode=login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-brand"
        >
          {t("loginAction")} <ArrowRight size={17} />
        </Link>
      </main>
    );
  }

  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const headline = resume?.data?.headline || t(roleKeys[profile.role]);
  const skillsList: string[] = Array.isArray(resume?.data?.skills)
    ? resume.data.skills
    : [];

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header Banner Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
        <div
          className="relative h-48 bg-[#174c40] sm:h-64"
          style={{
            backgroundImage: profile.bannerUrl
              ? undefined
              : "linear-gradient(115deg, #123c34 0%, #1b6854 50%, #2a9477 100%)",
          }}
        >
          {profile.bannerUrl && (
            <Image
              src={profile.bannerUrl}
              alt={t("coverAlt")}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 1100px"
              className="object-cover"
            />
          )}
          <label className="absolute bottom-3.5 right-3.5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur-md hover:bg-white transition-all">
            <ImagePlus size={15} />
            {mediaBusy === "bannerUrl" ? t("saving") : t("changeCover")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={Boolean(mediaBusy)}
              onChange={(event) => uploadMedia("bannerUrl", event)}
            />
          </label>
        </div>

        <div className="px-5 pb-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar */}
            <div className="relative -mt-16 h-32 w-32 shrink-0 overflow-visible rounded-full border-4 border-white bg-emerald-50 shadow-md sm:h-36 sm:w-36">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={`${t("avatarAlt")} ${profile.fullName}`}
                    fill
                    unoptimized
                    sizes="144px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-3xl font-black text-brand">
                    {initials || <UserRound size={36} />}
                  </span>
                )}
              </div>
              <label
                className="absolute bottom-0 right-0 grid h-10 w-10 cursor-pointer place-items-center rounded-full border-2 border-white bg-ink text-white shadow-sm hover:bg-brand transition-colors"
                title={t("changeAvatar")}
              >
                <Camera size={17} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={Boolean(mediaBusy)}
                  onChange={(event) => uploadMedia("avatarUrl", event)}
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:pb-1">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0f604d] transition-all hover:scale-105"
              >
                <Pencil size={15} />
                {t("editProfile")}
              </button>
              <Link
                href="/resume"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-slate-50 transition-colors"
              >
                <FileText size={15} />
                {t("editResume")}
              </Link>
            </div>
          </div>

          {/* User Details */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black text-ink">{profile.fullName}</h1>
              <p className="mt-1 text-lg font-semibold text-slate-700">{headline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                <span>{profile.email}</span>
                {resume?.data?.city && (
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <MapPin size={14} className="text-brand" />
                    {resume.data.city}
                  </span>
                )}
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-brand">
                  {t(roleKeys[profile.role])}
                </span>
                {resume?.data?.readyForRotation && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    ✓ Готов к вахте
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {t("joined")} {new Date(profile.createdAt).toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU")}
            </p>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {/* Quick KPI Stats Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => setEditModalOpen(true)}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-brand/50 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-brand transition-colors">
              Статус поиска
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                searchStatus === "ACTIVE"
                  ? "bg-emerald-500 animate-pulse"
                  : searchStatus === "CONSIDERING"
                  ? "bg-amber-500"
                  : "bg-slate-300"
              }`}
            />
          </div>
          <p className="mt-2 text-lg font-black text-ink group-hover:text-brand transition-colors">
            {searchStatus === "ACTIVE"
              ? "Активно ищу работу"
              : searchStatus === "CONSIDERING"
              ? "Рассматриваю предложения"
              : "Не ищу работу"}
          </p>
          <span className="text-[11px] font-medium text-slate-500">
            Нажмите, чтобы изменить ✎
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Резюме</span>
          <p className="mt-2 text-lg font-black text-ink">{resume ? "Опубликовано" : "Не создано"}</p>
          <span className="text-[11px] font-medium text-slate-500">
            {resume ? "Доступно для откликов" : "Создайте в редакторе"}
          </span>
        </div>

        <div
          onClick={() => setEditModalOpen(true)}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-brand/50 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-brand transition-colors">
              Формат работы
            </span>
            <span className="text-[10px] font-bold text-brand group-hover:underline">✎</span>
          </div>
          <p className="mt-2 text-lg font-black text-ink group-hover:text-brand transition-colors">
            {resume?.data?.readyForRotation
              ? "Вахта / Смена"
              : resume?.data?.readyToRelocate
              ? "Переезд по области"
              : "Полный день"}
          </p>
          <span className="text-[11px] font-medium text-slate-500">
            {resume?.data?.city ? `${resume.data.city}` : "Актау, Жанаозен"}
            {resume?.data?.readyForRotation ? " · Ротация" : ""}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Быстрый поиск</span>
          <Link
            href="/jobs"
            className="mt-2 inline-flex items-center gap-1.5 text-base font-black text-brand hover:underline"
          >
            Смотреть каталог
            <ArrowRight size={15} />
          </Link>
          <span className="block text-[11px] font-medium text-slate-500">Прямые контакты HR</span>
        </div>
      </div>

      {/* Main Grid: Resume + Skills & About */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Latest Resume Card */}
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="latest-resume-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand">
                  {t("portfolio")}
                </p>
                <h2 id="latest-resume-heading" className="mt-1 text-2xl font-black text-ink">
                  {t("latestResume")}
                </h2>
              </div>
              <Link
                href="/resume"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                {t("openEditor")} <ArrowRight size={14} />
              </Link>
            </div>

            {resume ? (
              <article className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card hover:border-brand/30 transition-all">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-brand">
                      <FileText size={22} />
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-ink">{resume.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {resume.data?.headline || t("jobNotSet")}
                        {resume.data?.city ? ` · ${resume.data.city}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {t(templateKeys[resume.templateId] || "template")}
                  </span>
                </div>

                {resume.data?.about && (
                  <p className="mt-4 text-xs leading-relaxed text-slate-600 line-clamp-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    «{resume.data.about}»
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    {t("updated")}{" "}
                    {new Date(resume.updatedAt).toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU")}
                  </p>
                  <Link
                    href="/resume"
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand transition-all"
                  >
                    {t("continue")} <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ) : (
              <div className="mt-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-2xs">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-brand">
                  <FileText size={22} />
                </div>
                <h3 className="mt-3 text-lg font-bold text-ink">{t("noResume")}</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {t("createFirstResume")}
                </p>
                <Link
                  href="/resume"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f604d]"
                >
                  {t("createResume")} <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>

          {/* Recommended Jobs Widget */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">
                  Вакансии в регионе
                </span>
                <h2 className="mt-0.5 text-xl font-black text-ink">Рекомендованные вакансии</h2>
              </div>
              <Link
                href="/jobs"
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
              >
                Все вакансии <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setIsDetailsOpen(true);
                  }}
                  className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-brand/40 hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-ink group-hover:text-brand transition-colors">
                        {job.title}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-brand">
                        {job.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 size={13} className="text-brand" />
                        {job.company}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-brand">{job.salary}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-colors self-start sm:self-auto"
                  >
                    <Eye size={13} />
                    Подробнее
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (1 col): Profile Summary Cards */}
        <div className="space-y-6">
          {/* Skills Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-ink flex items-center gap-2">
                <Sparkles size={16} className="text-brand" />
                Навыки и компетенции
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="text-xs font-bold text-brand hover:underline"
              >
                Изменить
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {skillsList.length > 0 ? (
                skillsList.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-900/10 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-brand"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  Навыки пока не указаны. Нажмите «Редактировать профиль», чтобы добавить.
                </p>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card space-y-3">
            <h3 className="text-base font-black text-ink">Быстрые действия</h3>

            <Link
              href="/jobs"
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-bold text-ink hover:bg-emerald-50 hover:text-brand hover:border-emerald-200 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Search size={16} className="text-brand" />
                Поиск работы в регионе
              </span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/resume"
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-bold text-ink hover:bg-emerald-50 hover:text-brand hover:border-emerald-200 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <FileText size={16} className="text-brand" />
                Редактор резюме (онлайн)
              </span>
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-bold text-ink hover:bg-emerald-50 hover:text-brand hover:border-emerald-200 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Pencil size={16} className="text-brand" />
                Настройка профиля и био
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          resume={resume}
          onProfileUpdated={(updatedProfile, updatedResume) => {
            setProfile(updatedProfile);
            setResume(updatedResume);
          }}
        />
      )}

      {/* Vacancy Details Modal */}
      <VacancyDetailsModal
        vacancy={selectedJob}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedJob(null);
        }}
      />
    </main>
  );
}