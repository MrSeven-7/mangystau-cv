"use client";

import { useEffect, useState } from "react";
import { X, Plus, Sparkles, Building2, MapPin, Wallet, Briefcase, FileText, Phone, Mail, User } from "lucide-react";
import { usePreferences } from "@/components/app-preferences";
import { addVacancyToDB, type ModerationStatus } from "@/lib/vacancies-store";

interface AddVacancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultApproved?: boolean;
}

export function AddVacancyModal({
  isOpen,
  onClose,
  onCreated,
  defaultApproved = false,
}: AddVacancyModalProps) {
  const { t } = usePreferences();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [city, setCity] = useState("aktau");
  const [industry, setIndustry] = useState("oil");
  const [salary, setSalary] = useState("");
  const [schedule, setSchedule] = useState("rotational");
  const [experience, setExperience] = useState("Опыт от 1 года");
  const [description, setDescription] = useState("");
  const [responsibilitiesText, setResponsibilitiesText] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [conditionsText, setConditionsText] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [autoApprove, setAutoApprove] = useState(defaultApproved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCompany("");
      setCompanyDescription("");
      setCity("aktau");
      setIndustry("oil");
      setSalary("");
      setSchedule("rotational");
      setExperience("Опыт от 1 года");
      setDescription("");
      setResponsibilitiesText("");
      setRequirementsText("");
      setConditionsText("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setAutoApprove(defaultApproved);
      setError("");
    }
  }, [isOpen, defaultApproved]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !salary.trim() || !description.trim()) {
      setError("Пожалуйста, заполните обязательные поля (название, компания, зарплата, описание).");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const responsibilities = responsibilitiesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const requirements = requirementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const conditions = conditionsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await addVacancyToDB({
        title: title.trim(),
        company: company.trim(),
        companyDescription: companyDescription.trim() || undefined,
        city,
        industry,
        salary: salary.trim(),
        schedule,
        experience,
        description: description.trim(),
        responsibilities,
        requirements,
        conditions,
        contacts: {
          name: contactName.trim() || undefined,
          phone: contactPhone.trim() || undefined,
          email: contactEmail.trim() || undefined,
        },
        moderationStatus: autoApprove ? "APPROVED" : "PENDING",
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при создании вакансии");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-vacancy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="relative my-6 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-ink transition-colors"
        >
          <X size={19} />
        </button>

        <div className="pr-8">
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-brand">
            <Sparkles size={14} />
            {t("newVacancy")}
          </div>
          <h2 id="add-vacancy-modal-title" className="mt-2 text-2xl font-black text-ink">
            {t("newVacancy")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Заполните полные подробности вакансии для размещения на портале.
          </p>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Название должности *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: Инженер-механик по буровому оборудованию"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Компания *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="название компании"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Зарплата *
              </label>
              <input
                type="text"
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="например: 450 000 – 600 000 ₸"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Город
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              >
                <option value="aktau">Актау</option>
                <option value="zhanaozen">Жанаозен</option>
                <option value="fort">Форт-Шевченко</option>
                <option value="kuryk">Курык</option>
                <option value="beyneu">Бейнеу</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Отрасль
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              >
                <option value="oil">Нефтегаз</option>
                <option value="logistics">Логистика</option>
                <option value="construction">Строительство</option>
                <option value="tourism">Туризм</option>
                <option value="utilities">ЖКХ</option>
                <option value="retail">Торговля</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                График
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              >
                <option value="rotational">Вахта (ротация)</option>
                <option value="fullTime">Полный день (5/2)</option>
                <option value="shift">Сменный график</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Требуемый опыт
            </label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="например: Опыт от 3 лет, Без опыта"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Описание вакансии *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Общее описание позиции, ключевых целей и проектов..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Обязанности (каждая с новой строки)
            </label>
            <textarea
              rows={3}
              value={responsibilitiesText}
              onChange={(e) => setResponsibilitiesText(e.target.value)}
              placeholder="Контроль буровых работ&#10;Оформление документации&#10;Инструктаж персонала"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Требования (каждое с новой строки)
            </label>
            <textarea
              rows={3}
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              placeholder="Высшее образование&#10;Сертификат NEBOSH&#10;Владение Excel"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Условия работы (каждое с новой строки)
            </label>
            <textarea
              rows={2}
              value={conditionsText}
              onChange={(e) => setConditionsText(e.target.value)}
              placeholder="Вахта 14/14 на месторождении&#10;Бесплатное проживание и 3-разовое питание&#10;Медицинская страховка"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Контактное лицо
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Имя Фамилия"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Телефон
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+7 (7292) ..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hr@company.kz"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span>Опубликовать сразу без ожидания модерации (для администратора)</span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0f604d] transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? t("saving") : t("createJob")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
