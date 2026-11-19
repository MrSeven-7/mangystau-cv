export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  companyDescription?: string;
  city: "aktau" | "zhanaozen" | "fort" | "kuryk" | "beyneu" | string;
  industry: "oil" | "tourism" | "logistics" | "construction" | "utilities" | "retail" | string;
  salary: string;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  schedule: "rotational" | "fullTime" | "shift" | "remote" | "partTime" | string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  conditions: string[];
  contacts: {
    name?: string;
    phone?: string;
    email?: string;
  };
  moderationStatus: ModerationStatus;
  moderationComment?: string;
  isActive?: boolean;
  publishedAt: string;
  createdAt: string;
}

export const initialVacancies: Vacancy[] = [
  {
    id: "vac-1",
    title: "Инженер по охране труда и технике безопасности (HSE)",
    company: "Caspian Energy Services",
    companyDescription: "Ведущая сервисная компания нефтегазового сектора Мангистауской области.",
    city: "aktau",
    industry: "oil",
    salary: "450 000 – 600 000 ₸",
    schedule: "rotational",
    experience: "Опыт от 3 лет",
    description: "В связи с расширением проектов на месторождениях Мангистау ищем опытного инженера по охране труда и промышленной безопасности. Специалист будет отвечать за мониторинг соблюдения стандартов HSE на буровых объектах.",
    responsibilities: [
      "Контроль соблюдения норм промышленной безопасности и охраны труда на объектах",
      "Проведение инструктажей и тренингов для персонала",
      "Расследование инцидентов и разработка превентивных мер",
      "Взаимодействие с государственными контролирующими органами",
      "Ведение отчетности по стандартам компании и заказчиков",
    ],
    requirements: [
      "Высшее техническое образование (в сфере техносферной безопасности или нефтегаза)",
      "Опыт работы в нефтегазовом секторе на вахте от 3 лет",
      "Наличие сертификатов NEBOSH или IOSH приветствуется",
      "Знание законодательства РК в области ПБ и ООС",
      "Уверенное владение казахским и русским языками",
    ],
    conditions: [
      "Вахтовый метод 14/14 или 28/28 на месторождении",
      "Оплата проезда, проживание в комфортабельном вахтовом городке и 3-разовое горячее питание за счет компании",
      "Медицинская страховка для сотрудника и членов семьи",
      "Полный соцпакет, оформление согласно ТК РК",
    ],
    contacts: {
      name: "Алия Идрисова (HR-отдел)",
      phone: "+7 (7292) 55-40-10",
      email: "hr@caspianenergy.kz",
    },
    moderationStatus: "APPROVED",
    publishedAt: "2026-10-01T10:00:00.000Z",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "vac-2",
    title: "Специалист по портовой логистике и экспедированию",
    company: "Морской порт Актау",
    companyDescription: "Международный морской торговый порт Актау — главные морские ворота Казахстана.",
    city: "aktau",
    industry: "logistics",
    salary: "350 000 – 500 000 ₸",
    schedule: "fullTime",
    experience: "Опыт от 1 года",
    description: "Требуется логист для координации перевалки генеральных и контейнерных грузов по Транскаспийскому международному транспортному маршруту (ТМТМ).",
    responsibilities: [
      "Организация и контроль перевалки грузов через морской порт",
      "Взаимодействие с судовладельцами, стивидорами и таможенными брокерами",
      "Оформление коносаментов, таможенных и сопроводительных документов",
      "Контроль движения грузов на складских терминалах",
    ],
    requirements: [
      "Высшее образование (Логистика, Международная торговля, ВЭД)",
      "Опыт работы в транспортной или складской логистике от 1 года",
      "Знание правил морских перевозок и Инкотермс-2020",
      "Владение программами 1С и пакетом MS Office (Excel)",
    ],
    conditions: [
      "График работы: 5/2, с 09:00 до 18:00",
      "Рабочее место в офисе порта (г. Актау)",
      "Развозка по городу, льготное питание в столовой порта",
      "Ежеквартальные премии по результатам работы",
    ],
    contacts: {
      name: "Отдел кадров",
      phone: "+7 (7292) 44-12-80",
      email: "recruitment@aktauport.kz",
    },
    moderationStatus: "APPROVED",
    publishedAt: "2026-10-02T12:00:00.000Z",
    createdAt: "2026-10-02T11:00:00.000Z",
  },
  {
    id: "vac-3",
    title: "Мастер строительно-монтажного участка",
    company: "Маңғыстау Құрылыс Холдинг",
    companyDescription: "Строительство инфраструктурных и промышленных объектов в Жанаозене и Мангистау.",
    city: "zhanaozen",
    industry: "construction",
    salary: "420 000 – 550 000 ₸",
    schedule: "rotational",
    experience: "Опыт от 3 лет",
    description: "Приглашаем мастера СМР для руководства строительными работами на объекте в районе Жанаозена. Обеспечение соблюдения графика и качества возведения объектов.",
    responsibilities: [
      "Руководство строительной бригадой и спецтехникой на объекте",
      "Контроль соответствия выполняемых работ проектной документации и СНиП",
      "Учет расхода строительных материалов и оформление нарядов-допусков",
      "Сдача выполненных этапов техническому надзору",
    ],
    requirements: [
      "Высшее или средне-специальное образование (ПГС)",
      "Опыт работы мастером или прорабом от 3 лет",
      "Умение читать строительные чертежи и сметы",
      "Организаторские навыки, ответственность",
    ],
    conditions: [
      "Вахта 15/15 или 30/30 (г. Жанаозен)",
      "Предоставляется жилье, питание и спецодежда",
      "Официальное трудоустройство, своевременная выплата зарплаты",
    ],
    contacts: {
      name: "Нурбол Сейткалиев",
      phone: "+7 (72934) 63-22-11",
      email: "jobs@m-qurylys.kz",
    },
    moderationStatus: "APPROVED",
    publishedAt: "2026-10-03T08:30:00.000Z",
    createdAt: "2026-10-03T08:00:00.000Z",
  },
  {
    id: "vac-4",
    title: "Администратор службы приема и размещения (Front Desk)",
    company: "Caspian Riviera Grand Palace",
    companyDescription: "Премиальный гостиничный комплекс на набережной Каспийского моря.",
    city: "aktau",
    industry: "tourism",
    salary: "280 000 – 350 000 ₸",
    schedule: "shift",
    experience: "Можно без опыта",
    description: "Ищем коммуникабельного и гостеприимного администратора для встречи и заселения гостей отеля, оказания сервиса мирового уровня.",
    responsibilities: [
      "Встреча, регистрация и заселение гостей отеля",
      "Бронирование номеров и консультирование по услугам комплекса",
      "Прием телефонных звонков и обработка запросов гостей",
      "Проведение расчетов и работа с кассовым терминалом",
    ],
    requirements: [
      "Грамотная устная и письменная речь (казахский и русский обязательны, английский базовый)",
      "Доброжелательность, клиентоориентированность, стрессоустойчивость",
      "Опыт работы в сфере гостеприимства будет плюсом, но готовы обучить",
    ],
    conditions: [
      "Сменный график: 2/2 (день/ночь/48 часов отдыха)",
      "Бесплатное питание на смене, стильная униформа",
      "Возможность карьерного роста в международной сети отелей",
    ],
    contacts: {
      name: "Служба персонала отеля",
      phone: "+7 (7292) 99-88-77",
      email: "career@caspianriviera.kz",
    },
    moderationStatus: "APPROVED",
    publishedAt: "2026-10-03T15:00:00.000Z",
    createdAt: "2026-10-03T14:00:00.000Z",
  },
  {
    id: "vac-5",
    title: "Водитель тяжелой техники категории CE",
    company: "WestTrans Logistics",
    companyDescription: "Крупный региональный перевозчик негабаритных и наливных грузов.",
    city: "fort",
    industry: "logistics",
    salary: "450 000 – 650 000 ₸",
    schedule: "rotational",
    experience: "Опыт от 2 лет",
    description: "Требуются водители седельных тягачей MAN/Scania для перевозки оборудования и грузов по маршрутам Актау – Баутино – месторождения региона.",
    responsibilities: [
      "Управление грузовыми автопоездами и седельными тягачами",
      "Контроль за погрузкой, креплением и сохранностью груза",
      "Проведение предрейсового осмотра автомобиля",
      "Соблюдение правил безопасного вождения и скоростного режима",
    ],
    requirements: [
      "Водительское удостоверение категории C, CE",
      "Опыт работы на полуприцепах от 2 лет",
      "Карта тахографа и знание путевой документации",
      "Бережное отношение к закрепленной технике",
    ],
    conditions: [
      "Вахта 20/10 или 30/15 (база в Баутино / Форт-Шевченко)",
      "Техника не старше 3 лет, собственная ремонтная база",
      "Проживание в благоустроенном общежитии, суточные",
    ],
    contacts: {
      name: "Марат Куанышев",
      phone: "+7 (72938) 2-19-45",
      email: "marat@westtrans.kz",
    },
    moderationStatus: "APPROVED",
    publishedAt: "2026-10-04T09:00:00.000Z",
    createdAt: "2026-10-04T08:00:00.000Z",
  },
  {
    id: "vac-6",
    title: "Оператор добычи нефти и газа 4-го разряда",
    company: "KazMunay Service Group",
    companyDescription: "Нефтепромысловое обслуживание скважин на месторождениях Каражанбас и Каламкас.",
    city: "aktau",
    industry: "oil",
    salary: "480 000 – 580 000 ₸",
    schedule: "rotational",
    experience: "Опыт от 2 лет",
    description: "Требуется оператор ДНГ для обслуживания фонда скважин, замера дебита и контроля параметров работы нефтегазового оборудования.",
    responsibilities: [
      "Ведение технологического процесса добычи нефти и попутного газа",
      "Снятие показаний контрольно-измерительных приборов",
      "Обслуживание станков-качалок и запорной арматуры",
      "Устранение мелких неисправностей оборудования",
    ],
    requirements: [
      "Квалификационное удостоверение оператора ДНГ 4-5 разряда",
      "Опыт работы на месторождениях Мангистау от 2 лет",
      "Допуск к работе на сосудах под давлением",
    ],
    conditions: [
      "Вахтовый метод 14/14",
      "Оплата проезда, спецпитание, медстраховка",
      "Премирование за безаварийную работу",
    ],
    contacts: {
      name: "Аслан Батыров",
      phone: "+7 (7292) 70-11-22",
      email: "aslan@kms-group.kz",
    },
    moderationStatus: "PENDING",
    publishedAt: "2026-10-04T12:00:00.000Z",
    createdAt: "2026-10-04T12:00:00.000Z",
  },
  {
    id: "vac-7",
    title: "Главный бухгалтер строительного предприятия",
    company: "Каспий Строй Монтаж",
    companyDescription: "Генеральный подрядчик жилищного и коммерческого строительства в Актау.",
    city: "aktau",
    industry: "construction",
    salary: "500 000 – 700 000 ₸",
    schedule: "fullTime",
    experience: "Опыт от 5 лет",
    description: "В связи с запуском нового жилого комплекса открыта позиция Главного бухгалтера для полного ведения налогового и управленческого учета строительной компании.",
    responsibilities: [
      "Полное ведение бухгалтерского, налогового и статистического учета",
      "Учет строительных материалов, форм КС-2, КС-3, субподрядных договоров",
      "Оптимизация налогообложения и прохождение аудиторских проверок",
      "Руководство бухгалтерией из 4 сотрудников",
    ],
    requirements: [
      "Высшее экономическое образование, сертификат Профессионального бухгалтера РК или CAP/CIPA",
      "Опыт работы главным бухгалтером в строительной сфере от 3 лет",
      "Глубокое знание 1С:Предприятие 8.3 Строительство, СОНО, Кабинет налогоплательщика",
    ],
    conditions: [
      "График 5/2, современный офис в 14 мкр Актау",
      "Достойный уровень оплаты труда + годовой бонус",
      "Корпоративная мобильная связь и питание",
    ],
    contacts: {
      name: "Динара Касымова",
      phone: "+7 (7292) 30-45-67",
      email: "accountant@caspian-sm.kz",
    },
    moderationStatus: "PENDING",
    publishedAt: "2026-10-04T13:30:00.000Z",
    createdAt: "2026-10-04T13:30:00.000Z",
  },
  {
    id: "vac-8",
    title: "Менеджер по продажам электротехнического оборудования",
    company: "PromElectro Mangystau",
    companyDescription: "Поставка кабельной продукции и щитового оборудования для предприятий региона.",
    city: "aktau",
    industry: "retail",
    salary: "250 000 ₸ + % от продаж",
    schedule: "fullTime",
    experience: "Опыт от 1 года",
    description: "Работа с промышленными заказчиками и строительными фирмами региона. Активные продажи, участие в тендерах.",
    responsibilities: [
      "Обработка входящих заявок и привлечение новых корпоративных клиентов",
      "Подготовка коммерческих предложений и договоров",
      "Контроль дебиторской задолженности и поставок",
    ],
    requirements: [
      "Опыт продаж B2B от 1 года",
      "Навыки ведения переговоров",
      "Знание номенклатуры электрооборудования приветствуется",
    ],
    conditions: [
      "Оклад 250 000 ₸ + прозрачный процент от маржи (совокупный доход от 500 000 ₸)",
      "Официальное трудоустройство",
    ],
    contacts: {
      name: "Руслан Омаров",
      phone: "+7 (7292) 52-00-11",
      email: "sales@promelectro.kz",
    },
    moderationStatus: "REJECTED",
    moderationComment: "Не указан точный диапазон совокупного дохода и контакты не подтверждены через юрлицо.",
    publishedAt: "2026-10-03T11:00:00.000Z",
    createdAt: "2026-10-03T10:00:00.000Z",
  },
];

const STORAGE_KEY = "mangystau-vacancies";

export function getStoredVacancies(): Vacancy[] {
  if (typeof window === "undefined") return initialVacancies;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialVacancies));
      return initialVacancies;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return initialVacancies;
}

export function saveStoredVacancies(vacancies: Vacancy[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vacancies));
    window.dispatchEvent(new CustomEvent("mangystau-vacancies-updated"));
  } catch {}
}

export function getApprovedVacancies(): Vacancy[] {
  return getStoredVacancies().filter((v) => v.moderationStatus === "APPROVED");
}

export function getVacancyById(id: string): Vacancy | undefined {
  return getStoredVacancies().find((v) => v.id === id);
}

// ---------------- DATABASE ASYNC METHODS ----------------

/**
 * Fetch approved public vacancies from PostgreSQL DB (with local fallback)
 */
export async function fetchPublicVacanciesFromDB(params?: {
  q?: string;
  city?: string;
  industry?: string;
}): Promise<Vacancy[]> {
  try {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.city && params.city !== "all") query.set("city", params.city);
    if (params?.industry && params.industry !== "all") query.set("industry", params.industry);

    const res = await fetch(`/api/vacancies?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Merge into local cache
        const current = getStoredVacancies();
        const nonApproved = current.filter((v) => v.moderationStatus !== "APPROVED");
        saveStoredVacancies([...data, ...nonApproved]);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not reach DB API, using cached vacancies", err);
  }
  return getApprovedVacancies();
}

/**
 * Fetch all vacancies (for admin moderation) from PostgreSQL DB
 */
export async function fetchAdminVacanciesFromDB(): Promise<Vacancy[]> {
  try {
    const res = await fetch("/api/admin/vacancies");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredVacancies(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not reach DB Admin API, using cached vacancies", err);
  }
  return getStoredVacancies();
}

/**
 * Update vacancy moderation status in PostgreSQL DB
 */
export async function updateVacancyModerationInDB(
  id: string,
  status: ModerationStatus,
  comment?: string
): Promise<Vacancy | null> {
  // Update local immediately for responsive UI
  const updatedLocal = updateVacancyModeration(id, status, comment);

  try {
    const res = await fetch(`/api/admin/vacancies/${id}/moderate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment }),
    });
    if (res.ok) {
      const serverUpdated = await res.json();
      const list = getStoredVacancies();
      const idx = list.findIndex((v) => v.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...serverUpdated };
        saveStoredVacancies(list);
      }
      return serverUpdated;
    }
  } catch (err) {
    console.warn("Failed to persist moderation in DB", err);
  }
  return updatedLocal;
}

/**
 * Add a new vacancy to PostgreSQL DB
 */
export async function addVacancyToDB(
  data: Omit<Vacancy, "id" | "createdAt" | "publishedAt" | "moderationStatus"> & {
    moderationStatus?: ModerationStatus;
  }
): Promise<Vacancy> {
  // 1. Create local vacancy first for instant UI response
  const localNew = addVacancy(data);

  // 2. Persist to PostgreSQL database
  try {
    const res = await fetch("/api/vacancies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const dbVacancy = await res.json();
      // Replace temporary local ID with DB ID
      const list = getStoredVacancies();
      const idx = list.findIndex((v) => v.id === localNew.id);
      if (idx !== -1) {
        list[idx] = dbVacancy;
      } else {
        list.unshift(dbVacancy);
      }
      saveStoredVacancies(list);
      return dbVacancy;
    }
  } catch (err) {
    console.warn("Failed to save vacancy directly to DB", err);
  }
  return localNew;
}

/**
 * Delete a vacancy from PostgreSQL DB
 */
export async function deleteVacancyInDB(id: string): Promise<boolean> {
  deleteVacancy(id);
  try {
    await fetch(`/api/admin/vacancies/${id}`, { method: "DELETE" });
    return true;
  } catch (err) {
    console.warn("Failed to delete vacancy in DB", err);
  }
  return true;
}

// ---------------- SYNCHRONOUS STORE HELPERS ----------------

export function updateVacancyModeration(
  id: string,
  status: ModerationStatus,
  comment?: string
): Vacancy | null {
  const list = getStoredVacancies();
  const index = list.findIndex((v) => v.id === id);
  if (index === -1) return null;

  const updated: Vacancy = {
    ...list[index],
    moderationStatus: status,
    moderationComment: comment !== undefined ? comment : list[index].moderationComment,
    publishedAt: status === "APPROVED" ? new Date().toISOString() : list[index].publishedAt,
    isActive: status === "APPROVED",
  };

  list[index] = updated;
  saveStoredVacancies(list);
  return updated;
}

export function addVacancy(
  data: Omit<Vacancy, "id" | "createdAt" | "publishedAt" | "moderationStatus"> & {
    moderationStatus?: ModerationStatus;
  }
): Vacancy {
  const list = getStoredVacancies();
  const newVacancy: Vacancy = {
    ...data,
    id: `vac-${Date.now()}`,
    moderationStatus: data.moderationStatus || "PENDING",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    isActive: data.moderationStatus === "APPROVED",
  };

  list.unshift(newVacancy);
  saveStoredVacancies(list);
  return newVacancy;
}

export function deleteVacancy(id: string): boolean {
  const list = getStoredVacancies();
  const next = list.filter((v) => v.id !== id);
  if (next.length === list.length) return false;
  saveStoredVacancies(next);
  return true;
}

export function resetVacanciesToDefault(): void {
  saveStoredVacancies(initialVacancies);
}
