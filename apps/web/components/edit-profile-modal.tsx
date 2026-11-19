"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { X, Plus, Check, Loader2, Sparkles, MapPin, Briefcase, User, FileText } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { usePreferences } from "@/components/app-preferences";
import type { ResumeData } from "@mangystau/shared";

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
  data: ResumeData;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  resume: Resume | null;
  onProfileUpdated: (updatedProfile: Profile, updatedResume: Resume) => void;
}

const defaultCities = ["Актау", "Жанаозен", "Форт-Шевченко", "Бейнеу", "Курык"];
const popularSkills = [
  "Деловая коммуникация",
  "Работа в команде",
  "Планирование",
  "Документооборот",
  "Внимательность к деталям",
  "Решение задач",
  "Microsoft Excel",
  "1С: Предприятие",
  "Английский язык",
];

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  resume,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { t } = usePreferences();
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [headline, setHeadline] = useState(resume?.data.headline || "");
  const [city, setCity] = useState(resume?.data.city || "Актау");
  const [about, setAbout] = useState(resume?.data.about || "");
  const [skills, setSkills] = useState<string[]>(resume?.data.skills?.filter(Boolean) || []);
  const [skillInput, setSkillInput] = useState("");
  const [readyForRotation, setReadyForRotation] = useState(Boolean(resume?.data.readyForRotation));
  const [readyToRelocate, setReadyToRelocate] = useState(Boolean(resume?.data.readyToRelocate));
  const [searchStatus, setSearchStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync state when modal opens or profile/resume changes
  useEffect(() => {
    if (isOpen) {
      setFullName(profile.fullName || "");
      setHeadline(resume?.data.headline || "");
      setCity(resume?.data.city || "Актау");
      setAbout(resume?.data.about || "");
      setSkills(resume?.data.skills?.filter(Boolean) || []);
      setReadyForRotation(Boolean(resume?.data.readyForRotation));
      setReadyToRelocate(Boolean(resume?.data.readyToRelocate));
      try {
        const savedStatus = localStorage.getItem(`mangystau-search-status-${profile.id}`);
        setSearchStatus(savedStatus || "ACTIVE");
      } catch {}
      setSkillInput("");
      setError("");
    }
  }, [isOpen, profile, resume]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addSkill = (val?: string) => {
    const raw = val !== undefined ? val : skillInput;
    if (!raw) return;
    const candidates = raw
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    setSkills((current) => {
      const next = [...current];
      for (const item of candidates) {
        if (!next.some((s) => s.toLowerCase() === item.toLowerCase())) {
          next.push(item);
        }
      }
      return next;
    });

    if (val === undefined) {
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((current) => current.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError(t("fullName") + " обязателен");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let updatedUser = profile;

      // 1. Update user fullName if changed
      if (fullName.trim() !== profile.fullName) {
        const patchRes = await apiRequest("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: fullName.trim() }),
        });
        if (!patchRes.ok) {
          const errData = await patchRes.json().catch(() => ({}));
          throw new Error(errData.message || t("profileUpdateFail"));
        }
        updatedUser = await patchRes.json();
      }

      // 2. Update / create resume with updated profile details
      const existingData = resume?.data || {
        fullName: fullName.trim(),
        headline: headline.trim(),
        city: city.trim(),
        phone: "",
        email: profile.email,
        about: about.trim(),
        readyForRotation: false,
        readyToRelocate: false,
        driverCategories: [],
        languages: [],
        experience: [],
        education: [],
        skills: [],
      };

      const updatedResumeData: ResumeData = {
        ...existingData,
        fullName: fullName.trim(),
        headline: headline.trim(),
        city: city.trim(),
        about: about.trim(),
        skills,
        readyForRotation,
        readyToRelocate,
      };

      const templateId = resume?.templateId || "classic";
      const accent = (resume as any)?.theme?.accent || "#147d64";

      const resumeRes = await apiRequest("/api/resumes/latest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: updatedResumeData,
          templateId,
          accent,
        }),
      });

      if (!resumeRes.ok) {
        const errData = await resumeRes.json().catch(() => ({}));
        throw new Error(errData.message || t("profileUpdateFail"));
      }

      const updatedResume = await resumeRes.json();

      // Sync local storage draft and search status
      try {
        localStorage.setItem("mangystau-resume", JSON.stringify(updatedResumeData));
        localStorage.setItem(`mangystau-search-status-${profile.id}`, searchStatus);
        window.dispatchEvent(new Event("mangystau-profile-change"));
      } catch {}

      onProfileUpdated(updatedUser, updatedResume);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profileUpdateFail"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label={t("cancel")}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="pr-8">
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-brand">
            <Sparkles size={14} />
            {t("editProfileTitle")}
          </div>
          <h2 id="edit-profile-modal-title" className="mt-2 text-2xl font-black text-ink">
            {t("editProfileTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("editProfileDesc")}</p>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* ФИО */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <User size={14} className="text-brand" />
              {t("fullName")}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Жылқыбек Нұрхан"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-ink transition-colors focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          {/* Желаемая должность и Город */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Briefcase size={14} className="text-brand" />
                {t("desiredPosition")}
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Инженер, Менеджер..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-ink transition-colors focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <MapPin size={14} className="text-brand" />
                {t("city")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Актау"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-ink transition-colors focus:border-brand focus:bg-white focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {defaultCities.map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => setCity(cityName)}
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                      city === cityName
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Статус поиска и Формат работы */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Статус поиска работы
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: "ACTIVE", label: "Активно ищу работу", desc: "Открыт к предложениям" },
                  { value: "CONSIDERING", label: "Рассматриваю", desc: "Если предложат лучше" },
                  { value: "NOT_LOOKING", label: "Не ищу работу", desc: "Уже трудоустроен" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSearchStatus(item.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      searchStatus === item.value
                        ? "border-brand bg-emerald-50 text-brand ring-1 ring-brand font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400 font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Формат работы и готовность
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={readyForRotation}
                    onChange={(e) => setReadyForRotation(e.target.checked)}
                    className="h-4 w-4 rounded text-brand focus:ring-brand"
                  />
                  <span>Готов к вахте / ротации (тендеры, месторождения)</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={readyToRelocate}
                    onChange={(e) => setReadyToRelocate(e.target.checked)}
                    className="h-4 w-4 rounded text-brand focus:ring-brand"
                  />
                  <span>Готов к переезду по Мангистауской области</span>
                </label>
              </div>
            </div>
          </div>

          {/* Обо мне */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <FileText size={14} className="text-brand" />
                {t("bio")}
              </label>
              <span className="text-xs text-slate-400">{about.length} / 2000</span>
            </div>
            <textarea
              rows={4}
              maxLength={2000}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder={t("aboutPlaceholderModal")}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm leading-relaxed text-ink transition-colors focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          {/* Навыки */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Sparkles size={14} className="text-brand" />
              {t("skills")}
            </label>

            {/* Existing Skills Chips */}
            <div className="mt-2 min-h-12 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/15 bg-emerald-50 px-3 py-1 text-sm font-medium text-ink shadow-2xs"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Удалить ${skill}`}
                        className="rounded-full p-0.5 text-slate-400 hover:bg-emerald-100 hover:text-red-600 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t("noSkillsYet")}</p>
              )}
            </div>

            {/* Input to add skills */}
            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder={t("skillPlaceholder")}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm text-ink transition-colors focus:border-brand focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addSkill()}
                disabled={!skillInput.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-ink disabled:opacity-40"
              >
                <Plus size={15} />
                {t("addSkill")}
              </button>
            </div>

            {/* Quick Add Popular Skills */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400">{t("quickAddSkills")}</span>
              {popularSkills.map((popSkill) => {
                const isSelected = skills.some((s) => s.toLowerCase() === popSkill.toLowerCase());
                return (
                  <button
                    key={popSkill}
                    type="button"
                    disabled={isSelected}
                    onClick={() => addSkill(popSkill)}
                    className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                      isSelected
                        ? "bg-emerald-100/60 text-emerald-800 opacity-60 cursor-default"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {popSkill} {isSelected && <Check size={11} className="inline ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0f604d] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("saveChanges")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
