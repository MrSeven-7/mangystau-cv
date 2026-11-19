"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Plus, Users, Clock, CheckCircle2 } from "lucide-react";
import { usePreferences } from "@/components/app-preferences";
import { AddVacancyModal } from "@/components/add-vacancy-modal";

export default function Employer() {
  const { t } = usePreferences();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [createdNotice, setCreatedNotice] = useState(false);

  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl px-5 py-10 lg:px-8">
      {createdNotice && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{t("vacancyCreated")}</span>
        </div>
      )}

      <p className="text-sm font-bold text-brand">{t("employerCabinet")}</p>
      <h1 className="mt-2 text-4xl font-black">{t("findSpecialists")}</h1>
      <p className="mt-2 text-slate-500">{t("employerIntro")}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-brand">
            <BriefcaseBusiness size={22} />
          </div>
          <h2 className="mt-5 text-xl font-black">{t("yourJobs")}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Создавайте вакансии вашей компании. Каждая вакансия проверяется администратором портала перед публикацией.
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-brand transition-colors"
          >
            <Plus size={16} />
            {t("createJob")}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-brand">
            <Users size={22} />
          </div>
          <h2 className="mt-5 text-xl font-black">{t("candidates")}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Просматривайте актуальные вакансии региона и рынок специалистов.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex items-center gap-2 font-bold text-brand hover:underline"
          >
            {t("viewMarket")} <ArrowRight size={17} />
          </Link>
        </section>
      </div>

      <AddVacancyModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => {
          setCreatedNotice(true);
          setTimeout(() => setCreatedNotice(false), 5000);
        }}
        defaultApproved={false}
      />
    </main>
  );
}
