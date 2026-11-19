import { PrismaClient, Role, ModerationStatus, WorkSchedule } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin & Employer Users
  const passwordHash = await hash("admin123");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@mangystau-cv.kz" },
    update: {
      role: Role.ADMIN,
      fullName: "Азамат Серікбаев",
      passwordHash,
    },
    create: {
      email: "admin@mangystau-cv.kz",
      passwordHash,
      role: Role.ADMIN,
      fullName: "Азамат Серікбаев",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const employerUser = await prisma.user.upsert({
    where: { email: "hr@caspianenergy.kz" },
    update: {
      passwordHash,
    },
    create: {
      email: "hr@caspianenergy.kz",
      passwordHash,
      role: Role.EMPLOYER,
      fullName: "Алия Идрисова",
    },
  });

  // 2. Create Industries
  const industriesData = [
    { slug: "oil", nameRu: "Нефть и газ / HSE", nameKk: "Мұнай және газ / HSE" },
    { slug: "logistics", nameRu: "Логистика и транспорт", nameKk: "Логистика және көлік" },
    { slug: "construction", nameRu: "Строительство и монтаж", nameKk: "Құрылыс және монтаж" },
    { slug: "tourism", nameRu: "Туризм и HoReCa", nameKk: "Туризм және қонақ үй" },
    { slug: "retail", nameRu: "Продажи и торговля", nameKk: "Сауда және сату" },
    { slug: "utilities", nameRu: "ЖКХ и энергетика", nameKk: "ТКШ және энергетика" },
  ];

  const industryMap: Record<string, number> = {};
  for (const ind of industriesData) {
    const record = await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: { nameRu: ind.nameRu, nameKk: ind.nameKk },
      create: ind,
    });
    industryMap[ind.slug] = record.id;
  }

  // 3. Create Companies
  const companiesData = [
    {
      name: "Caspian Energy Services",
      city: "aktau",
      description: "Ведущая сервисная компания нефтегазового сектора Мангистауской области.",
      logoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=100&auto=format&fit=crop&q=80",
      ownerId: employerUser.id,
    },
    {
      name: "Морской порт Актау",
      city: "aktau",
      description: "Международный морской торговый порт Актау — главные морские ворота Казахстана.",
      logoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
    {
      name: "Маңғыстау Құрылыс Холдинг",
      city: "zhanaozen",
      description: "Строительство инфраструктурных и промышленных объектов в Жанаозене и Мангистау.",
      logoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
    {
      name: "Caspian Riviera Grand Palace",
      city: "aktau",
      description: "Премиальный гостиничный комплекс на набережной Каспийского моря.",
      logoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
    {
      name: "WestTrans Logistics",
      city: "fort",
      description: "Крупный региональный перевозчик негабаритных и наливных грузов.",
      logoUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
    {
      name: "KazMunay Service Group",
      city: "aktau",
      description: "Нефтепромысловое обслуживание скважин на месторождениях Каражанбас и Каламкас.",
      logoUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
    {
      name: "Каспий Строй Монтаж",
      city: "aktau",
      description: "Генеральный подрядчик жилищного и коммерческого строительства в Актау.",
      logoUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
    {
      name: "PromElectro Mangystau",
      city: "aktau",
      description: "Поставка кабельной продукции и щитового оборудования для предприятий региона.",
      logoUrl: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=100&auto=format&fit=crop&q=80",
      ownerId: adminUser.id,
    },
  ];

  const companyMap: Record<string, string> = {};
  for (const c of companiesData) {
    let company = await prisma.company.findFirst({
      where: { name: c.name },
    });
    if (!company) {
      // Find an available user or create one
      const compUser = await prisma.user.create({
        data: {
          email: `comp-${Date.now()}-${Math.random().toString(36).substring(7)}@mangystau.kz`,
          passwordHash,
          role: Role.EMPLOYER,
          fullName: `Представитель ${c.name}`,
        },
      });
      company = await prisma.company.create({
        data: {
          name: c.name,
          city: c.city,
          description: c.description,
          logoUrl: c.logoUrl,
          ownerId: compUser.id,
        },
      });
    }
    companyMap[c.name] = company.id;
  }

  // 4. Seed Vacancies
  const vacanciesToSeed = [
    {
      id: "vac-1",
      companyName: "Caspian Energy Services",
      industrySlug: "oil",
      title: "Инженер по охране труда и технике безопасности (HSE)",
      city: "aktau",
      salary: "450 000 – 600 000 ₸",
      salaryFrom: 450000,
      salaryTo: 600000,
      schedule: WorkSchedule.ROTATIONAL,
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
      contactName: "Алия Идрисова (HR-отдел)",
      contactPhone: "+7 (7292) 55-40-10",
      contactEmail: "hr@caspianenergy.kz",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true,
    },
    {
      id: "vac-2",
      companyName: "Морской порт Актау",
      industrySlug: "logistics",
      title: "Специалист по портовой логистике и экспедированию",
      city: "aktau",
      salary: "350 000 – 500 000 ₸",
      salaryFrom: 350000,
      salaryTo: 500000,
      schedule: WorkSchedule.FULL_TIME,
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
      contactName: "Отдел кадров",
      contactPhone: "+7 (7292) 44-12-80",
      contactEmail: "recruitment@aktauport.kz",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true,
    },
    {
      id: "vac-3",
      companyName: "Маңғыстау Құрылыс Холдинг",
      industrySlug: "construction",
      title: "Мастер строительно-монтажного участка",
      city: "zhanaozen",
      salary: "420 000 – 550 000 ₸",
      salaryFrom: 420000,
      salaryTo: 550000,
      schedule: WorkSchedule.ROTATIONAL,
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
      contactName: "Нурбол Сейткалиев",
      contactPhone: "+7 (72934) 63-22-11",
      contactEmail: "jobs@m-qurylys.kz",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true,
    },
    {
      id: "vac-4",
      companyName: "Caspian Riviera Grand Palace",
      industrySlug: "tourism",
      title: "Администратор службы приема и размещения (Front Desk)",
      city: "aktau",
      salary: "280 000 – 350 000 ₸",
      salaryFrom: 280000,
      salaryTo: 350000,
      schedule: WorkSchedule.SHIFT,
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
      contactName: "Служба персонала отеля",
      contactPhone: "+7 (7292) 99-88-77",
      contactEmail: "career@caspianriviera.kz",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true,
    },
    {
      id: "vac-5",
      companyName: "WestTrans Logistics",
      industrySlug: "logistics",
      title: "Водитель тяжелой техники категории CE",
      city: "fort",
      salary: "450 000 – 650 000 ₸",
      salaryFrom: 450000,
      salaryTo: 650000,
      schedule: WorkSchedule.ROTATIONAL,
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
      contactName: "Марат Куанышев",
      contactPhone: "+7 (72938) 2-19-45",
      contactEmail: "marat@westtrans.kz",
      moderationStatus: ModerationStatus.APPROVED,
      isActive: true,
    },
    {
      id: "vac-6",
      companyName: "KazMunay Service Group",
      industrySlug: "oil",
      title: "Оператор добычи нефти и газа 4-го разряда",
      city: "aktau",
      salary: "480 000 – 580 000 ₸",
      salaryFrom: 480000,
      salaryTo: 580000,
      schedule: WorkSchedule.ROTATIONAL,
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
      contactName: "Аслан Батыров",
      contactPhone: "+7 (7292) 70-11-22",
      contactEmail: "aslan@kms-group.kz",
      moderationStatus: ModerationStatus.PENDING,
      isActive: false,
    },
    {
      id: "vac-7",
      companyName: "Каспий Строй Монтаж",
      industrySlug: "construction",
      title: "Главный бухгалтер строительного предприятия",
      city: "aktau",
      salary: "500 000 – 700 000 ₸",
      salaryFrom: 500000,
      salaryTo: 700000,
      schedule: WorkSchedule.FULL_TIME,
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
      contactName: "Динара Касымова",
      contactPhone: "+7 (7292) 30-45-67",
      contactEmail: "accountant@caspian-sm.kz",
      moderationStatus: ModerationStatus.PENDING,
      isActive: false,
    },
    {
      id: "vac-8",
      companyName: "PromElectro Mangystau",
      industrySlug: "retail",
      title: "Менеджер по продажам электротехнического оборудования",
      city: "aktau",
      salary: "250 000 ₸ + % от продаж",
      salaryFrom: 250000,
      salaryTo: 500000,
      schedule: WorkSchedule.FULL_TIME,
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
      contactName: "Руслан Омаров",
      contactPhone: "+7 (7292) 52-00-11",
      contactEmail: "sales@promelectro.kz",
      moderationStatus: ModerationStatus.REJECTED,
      moderationComment: "Не указан точный диапазон совокупного дохода и контакты не подтверждены через юрлицо.",
      isActive: false,
    },
  ];

  for (const v of vacanciesToSeed) {
    const companyId = companyMap[v.companyName];
    const industryId = industryMap[v.industrySlug];
    if (!companyId || !industryId) continue;

    await prisma.vacancy.upsert({
      where: { id: v.id },
      update: {
        title: v.title,
        description: v.description,
        responsibilities: v.responsibilities,
        requirements: v.requirements,
        conditions: v.conditions,
        city: v.city,
        salary: v.salary,
        salaryFrom: v.salaryFrom,
        salaryTo: v.salaryTo,
        schedule: v.schedule,
        experience: v.experience,
        contactName: v.contactName,
        contactPhone: v.contactPhone,
        contactEmail: v.contactEmail,
        moderationStatus: v.moderationStatus,
        moderationComment: v.moderationComment,
        isActive: v.isActive,
      },
      create: {
        id: v.id,
        companyId,
        industryId,
        title: v.title,
        description: v.description,
        responsibilities: v.responsibilities,
        requirements: v.requirements,
        conditions: v.conditions,
        city: v.city,
        salary: v.salary,
        salaryFrom: v.salaryFrom,
        salaryTo: v.salaryTo,
        schedule: v.schedule,
        experience: v.experience,
        contactName: v.contactName,
        contactPhone: v.contactPhone,
        contactEmail: v.contactEmail,
        moderationStatus: v.moderationStatus,
        moderationComment: v.moderationComment,
        isActive: v.isActive,
      },
    });
  }

  console.log("Database seeded successfully with users, companies, industries, and full vacancies!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
