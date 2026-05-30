export type Category = 'accountant' | 'tax' | 'lawyer' | 'advocate';

export interface Expert {
  id: string;
  name: string;
  category: Category;
  categoryLabel: string;
  specializations: string[];
  experience_years: number;
  hourly_rate: number;
  rating: number;
  completed_deals: number;
  bio: string;
  avatar: string;
  is_verified: boolean;
  reviews: Review[];
  cases: string[];
  response_time: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  company?: string;
}

export interface Problem {
  id: string;
  category: Category;
  title: string;
  description: string;
  icon: string;
  ai_can_answer: boolean;
  ai_answer?: string;
}

export const CATEGORIES = [
  {
    id: 'accountant' as Category,
    label: 'Бухгалтер',
    icon: '📊',
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Учёт, отчётность, зарплаты',
  },
  {
    id: 'tax' as Category,
    label: 'Налоговый консультант',
    icon: '🧮',
    color: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Налоги, НДС, оптимизация',
  },
  {
    id: 'lawyer' as Category,
    label: 'Юрист',
    icon: '⚖️',
    color: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Договоры, споры, регистрация',
  },
  {
    id: 'advocate' as Category,
    label: 'Адвокат',
    icon: '🏛️',
    color: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Суды, уголовные дела, защита',
  },
];

export const PROBLEMS: Problem[] = [
  // Accountant
  {
    id: 'acc-1',
    category: 'accountant',
    title: 'Сдача налоговой отчётности',
    description: '910 форма для ИП, 700 для ТОО',
    icon: '📋',
    ai_can_answer: true,
    ai_answer: `**Сдача налоговой отчётности в РК**

Для ИП на упрощёнке (СНР): сдаётся **форма 910.00** раз в полугодие — до 15 августа и 15 февраля. Налог = 3% от дохода (1.5% ИПН + 1.5% соц.налог).

Для ТОО на общем режиме: **форма 100.00** ежегодно до 31 марта + **форма 101.02** ежеквартально.

**Вам нужен специалист, если:**
- Есть наёмные работники (нужны формы 200.00, 870.00)
- Оборот более 20 000 МРП — обязателен НДС
- Первый год работы — важно сразу правильно выбрать режим налогообложения`,
  },
  {
    id: 'acc-2',
    category: 'accountant',
    title: 'Регистрация ИП или ТОО',
    description: 'Открытие бизнеса с нуля',
    icon: '🏢',
    ai_can_answer: true,
    ai_answer: `**Регистрация бизнеса в Казахстане**

**ИП** регистрируется через eGov.kz или ЦОН бесплатно. Занимает 1 рабочий день. Нужен только ИИН.

**ТОО** регистрируется через Egov или нотариуса. Стоимость: 1 МРП (3 932 тг в 2024). Нужны: устав, решение о создании, юр.адрес.

**Рекомендую выбрать ТОО, если:** планируете привлекать инвесторов, нанимать много сотрудников или работать с крупными корпоративными клиентами.

Для корректного выбора режима налогообложения и оформления документов — советую обратиться к специалисту.`,
  },
  {
    id: 'acc-3',
    category: 'accountant',
    title: 'Расчёт и оптимизация налогов',
    description: 'Как платить меньше законно',
    icon: '💰',
    ai_can_answer: false,
  },
  {
    id: 'acc-4',
    category: 'accountant',
    title: 'Начисление зарплат и кадры',
    description: 'ИПН, ОПВ, ОСМС, зарплатная ведомость',
    icon: '👥',
    ai_can_answer: false,
  },
  {
    id: 'acc-5',
    category: 'accountant',
    title: 'Экспресс-аудит перед проверкой',
    description: 'Подготовка к налоговой проверке',
    icon: '🔍',
    ai_can_answer: false,
  },
  {
    id: 'acc-6',
    category: 'accountant',
    title: 'Ликвидация ИП или ТОО',
    description: 'Закрытие бизнеса по всем правилам',
    icon: '📁',
    ai_can_answer: false,
  },
  // Tax
  {
    id: 'tax-1',
    category: 'tax',
    title: 'НДС — постановка и возврат',
    description: 'Регистрация плательщика НДС, возврат переплаты',
    icon: '🧾',
    ai_can_answer: true,
    ai_answer: `**НДС в Казахстане**

Обязаны встать на учёт по НДС, если оборот превысил **20 000 МРП** (~78.6 млн тг в 2024) за любые 12 месяцев.

Ставка НДС: **12%** на все облагаемые обороты.

**Возврат НДС:** возможен при экспорте товаров (0% ставка) или если входящий НДС превышает исходящий. Подаётся заявление в налоговый орган, проверка занимает до 30 рабочих дней.

Расчёт и оптимизация НДС — сложная тема. Рекомендуем консультацию с налоговым специалистом.`,
  },
  {
    id: 'tax-2',
    category: 'tax',
    title: 'Налоговая оптимизация',
    description: 'Легальные способы снизить налоги',
    icon: '📉',
    ai_can_answer: false,
  },
  {
    id: 'tax-3',
    category: 'tax',
    title: 'Выбор режима налогообложения',
    description: 'Упрощёнка, общий режим, патент',
    icon: '🗂️',
    ai_can_answer: true,
    ai_answer: `**Режимы налогообложения в РК**

| Режим | Кто подходит | Ставка |
|-------|-------------|--------|
| **СНР (упрощёнка)** | ИП, ТОО с оборотом до 24 000 МРП | 3% от дохода |
| **Патент** | ИП без работников, оборот до 3 528 МРП | 1% от дохода |
| **Общий режим** | Крупный бизнес, НДС-плательщики | КПН 20% + НДС 12% |

**Рекомендация:** для старта большинству подходит упрощёнка. Для точного расчёта — нужен налоговый консультант.`,
  },
  {
    id: 'tax-4',
    category: 'tax',
    title: 'Споры с налоговой',
    description: 'Апелляции, жалобы на проверки',
    icon: '⚠️',
    ai_can_answer: false,
  },
  // Lawyer
  {
    id: 'law-1',
    category: 'lawyer',
    title: 'Составление или проверка договора',
    description: 'Купля-продажа, аренда, услуги, NDA',
    icon: '📝',
    ai_can_answer: true,
    ai_answer: `**Что важно в любом договоре**

Любой договор должен содержать: стороны, предмет, цену, сроки, ответственность и порядок разрешения споров.

**Красные флаги при проверке договора:**
- Нет конкретных сроков исполнения
- Размытая ответственность за нарушение
- Нет порядка расторжения
- Одностороннее право изменять условия

**Для разработки договора "под ключ"** — обратитесь к юристу. Типовые ошибки в договорах стоят бизнесу миллионы тенге.`,
  },
  {
    id: 'law-2',
    category: 'lawyer',
    title: 'Трудовой спор',
    description: 'Незаконное увольнение, задержка зарплаты',
    icon: '👔',
    ai_can_answer: false,
  },
  {
    id: 'law-3',
    category: 'lawyer',
    title: 'Взыскание долга',
    description: 'Работа с должниками, претензии',
    icon: '💸',
    ai_can_answer: false,
  },
  {
    id: 'law-4',
    category: 'lawyer',
    title: 'Регистрация ТОО и изменения в устав',
    description: 'Документы для открытия и изменений',
    icon: '🏛️',
    ai_can_answer: false,
  },
  // Advocate
  {
    id: 'adv-1',
    category: 'advocate',
    title: 'Гражданский иск в суд',
    description: 'Подача иска, представительство',
    icon: '⚖️',
    ai_can_answer: false,
  },
  {
    id: 'adv-2',
    category: 'advocate',
    title: 'Уголовное дело — защита',
    description: 'Подозреваемый, обвиняемый, свидетель',
    icon: '🛡️',
    ai_can_answer: false,
  },
  {
    id: 'adv-3',
    category: 'advocate',
    title: 'Апелляция решения суда',
    description: 'Обжалование судебного решения',
    icon: '📜',
    ai_can_answer: false,
  },
  {
    id: 'adv-4',
    category: 'advocate',
    title: 'Семейные споры',
    description: 'Развод, алименты, раздел имущества',
    icon: '🏠',
    ai_can_answer: false,
  },
];

export const EXPERTS: Expert[] = [
  {
    id: 'exp-1',
    name: 'Айгуль Бекова',
    category: 'accountant',
    categoryLabel: 'Бухгалтер',
    specializations: ['ИП и малый бизнес', 'Налоговая отчётность', 'Зарплатный учёт'],
    experience_years: 8,
    hourly_rate: 15000,
    rating: 4.9,
    completed_deals: 147,
    bio: 'Сертифицированный бухгалтер с 8-летним опытом. Специализируюсь на ведении учёта для ИП и малого бизнеса. Помогаю предпринимателям разобраться в налоговой отчётности и избежать штрафов.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aigul&backgroundColor=b6e3f4',
    is_verified: true,
    response_time: '~30 мин',
    cases: [
      'Оптимизировала налоговую нагрузку для сети кофеен — экономия 2.4 млн тг/год',
      'Настроила зарплатный учёт для IT-компании с 45 сотрудниками',
      'Прошла 12 налоговых проверок без штрафов',
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Марат Сейткалиев',
        company: 'ИП Сейткалиев',
        rating: 5,
        comment: 'Айгуль помогла мне разобраться с 910 формой и оптимизировала налоги. Сэкономила больше, чем стоили её услуги.',
        date: '2024-11-15',
      },
      {
        id: 'r2',
        author: 'Динара Ахметова',
        company: 'ТОО "Вкусно и точка"',
        rating: 5,
        comment: 'Профессионал высшего уровня. Быстро, чётко, без лишних вопросов. Рекомендую всем ИП.',
        date: '2024-10-22',
      },
      {
        id: 'r3',
        author: 'Алибек Нуров',
        rating: 4,
        comment: 'Хорошая работа, но хотелось бы чуть более детальных объяснений по каждому пункту.',
        date: '2024-09-10',
      },
    ],
  },
  {
    id: 'exp-2',
    name: 'Нурлан Сейтов',
    category: 'tax',
    categoryLabel: 'Налоговый консультант',
    specializations: ['НДС и возврат', 'Налоговые проверки', 'Оптимизация налоговой нагрузки'],
    experience_years: 12,
    hourly_rate: 20000,
    rating: 4.8,
    completed_deals: 203,
    bio: 'Бывший сотрудник КГД РК с 12 годами опыта. Знаю налоговую систему изнутри. Помогаю бизнесу законно снизить налоги и успешно проходить проверки.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nurlan&backgroundColor=c0aede',
    is_verified: true,
    response_time: '~1 час',
    cases: [
      'Вернул НДС на 18 млн тг для производственного ТОО',
      'Защитил клиента на выездной налоговой проверке — доначисление снижено с 45 до 3 млн тг',
      'Перевёл 3 компании с общего режима на оптимальный спецрежим',
    ],
    reviews: [
      {
        id: 'r4',
        author: 'Сергей Ковалёв',
        company: 'ТОО "СтройПром"',
        rating: 5,
        comment: 'Нурлан — лучший налоговый консультант которого я встречал. Знает все тонкости системы.',
        date: '2024-12-01',
      },
      {
        id: 'r5',
        author: 'Гульмира Байкенова',
        rating: 5,
        comment: 'Помог вернуть НДС который висел больше года. Чётко, профессионально.',
        date: '2024-11-08',
      },
    ],
  },
  {
    id: 'exp-3',
    name: 'Диана Кожахметова',
    category: 'accountant',
    categoryLabel: 'Бухгалтер',
    specializations: ['ТОО', 'Кадровый учёт', 'Управленческая отчётность'],
    experience_years: 5,
    hourly_rate: 12000,
    rating: 4.7,
    completed_deals: 89,
    bio: 'Специализируюсь на ведении бухгалтерии для ТОО. Работаю с 1С, Mybuh.kz и облачными решениями. Помогаю выстроить прозрачный учёт.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana&backgroundColor=ffd5dc',
    is_verified: true,
    response_time: '~45 мин',
    cases: [
      'Восстановила бухгалтерский учёт за 3 года для ТОО после смены бухгалтера',
      'Настроила управленческую отчётность для торговой компании',
    ],
    reviews: [
      {
        id: 'r6',
        author: 'Азамат Жаксыбеков',
        company: 'ТОО "АзияТрейд"',
        rating: 5,
        comment: 'Диана восстановила весь наш учёт в рекордные сроки. Очень ответственный специалист.',
        date: '2024-10-30',
      },
    ],
  },
  {
    id: 'exp-4',
    name: 'Арман Абенов',
    category: 'tax',
    categoryLabel: 'Налоговый консультант',
    specializations: ['Оптимизация налогов', 'ТТП и трансфертное ценообразование', 'Международные сделки'],
    experience_years: 7,
    hourly_rate: 18000,
    rating: 4.9,
    completed_deals: 134,
    bio: 'Специализируюсь на налоговом планировании для среднего и крупного бизнеса. Помогаю структурировать сделки так, чтобы минимизировать налоговые риски.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arman&backgroundColor=d1f4cc',
    is_verified: true,
    response_time: '~2 часа',
    cases: [
      'Разработал налоговую структуру для группы компаний — экономия 12 млн тг/год',
      'Успешно оспорил доначисление 34 млн тг по трансфертному ценообразованию',
    ],
    reviews: [
      {
        id: 'r7',
        author: 'Бауыржан Момышулы',
        company: 'Holding Group KZ',
        rating: 5,
        comment: 'Арман — стратегический мыслитель в налогах. Сэкономил нам десятки миллионов.',
        date: '2024-11-20',
      },
    ],
  },
  {
    id: 'exp-5',
    name: 'Жанар Мусаева',
    category: 'lawyer',
    categoryLabel: 'Юрист',
    specializations: ['Корпоративное право', 'Договорная работа', 'Интеллектуальная собственность'],
    experience_years: 10,
    hourly_rate: 25000,
    rating: 4.9,
    completed_deals: 178,
    bio: 'Юрист с 10-летним опытом в корпоративном праве. Разработала более 500 договоров для казахстанских и международных компаний. Партнёр юридической фирмы Law Bridge.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhanar&backgroundColor=b6e3f4',
    is_verified: true,
    response_time: '~1 час',
    cases: [
      'Разработала юридическую базу для 20+ стартапов (учредительные документы, NDA, оферты)',
      'Сопроводила M&A сделку на $2.5 млн',
      'Зарегистрировала 3 торговых марки в КЗ и РФ',
    ],
    reviews: [
      {
        id: 'r8',
        author: 'Тимур Асылбеков',
        company: 'Startup Hub Almaty',
        rating: 5,
        comment: 'Жанар — лучший юрист для стартапов. Быстро, качественно, понимает специфику IT-бизнеса.',
        date: '2024-12-10',
      },
      {
        id: 'r9',
        author: 'Лейла Нурмагамбетова',
        rating: 5,
        comment: 'Грамотно проверила договор аренды, нашла 4 критичных пункта которые защитили мои интересы.',
        date: '2024-11-05',
      },
    ],
  },
  {
    id: 'exp-6',
    name: 'Дамир Есенов',
    category: 'advocate',
    categoryLabel: 'Адвокат',
    specializations: ['Гражданские споры', 'Взыскание долгов', 'Арбитраж'],
    experience_years: 15,
    hourly_rate: 35000,
    rating: 4.8,
    completed_deals: 256,
    bio: 'Член Алматинской коллегии адвокатов. 15 лет в судебной практике. Выиграл более 200 гражданских дел. Специализируюсь на взыскании долгов и коммерческих спорах.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Damir&backgroundColor=c0aede',
    is_verified: true,
    response_time: '~3 часа',
    cases: [
      'Взыскал 45 млн тг долга для строительной компании через суд',
      'Защитил ТОО от незаконного захвата бизнеса',
      'Добился отмены решения суда первой инстанции в апелляции',
    ],
    reviews: [
      {
        id: 'r10',
        author: 'Руслан Джаксыбеков',
        company: 'ТОО "МегаСтрой"',
        rating: 5,
        comment: 'Дамир — настоящий профессионал. Вернул нам деньги которые мы считали потерянными.',
        date: '2024-10-15',
      },
    ],
  },
  {
    id: 'exp-7',
    name: 'Асем Нурмаганбетова',
    category: 'lawyer',
    categoryLabel: 'Юрист',
    specializations: ['Трудовое право', 'HR-документы', 'Защита прав работников'],
    experience_years: 6,
    hourly_rate: 20000,
    rating: 4.7,
    completed_deals: 112,
    bio: 'Специалист по трудовому праву Казахстана. Помогаю работодателям правильно оформлять трудовые отношения и защищаю работников при незаконных увольнениях.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Asem&backgroundColor=ffd5dc',
    is_verified: true,
    response_time: '~1 час',
    cases: [
      'Выиграла 15 судебных дел о незаконном увольнении',
      'Разработала полный пакет HR-документов для компании с 120 сотрудниками',
    ],
    reviews: [
      {
        id: 'r11',
        author: 'Алия Сатпаева',
        rating: 5,
        comment: 'Асем помогла мне получить компенсацию после незаконного увольнения. Очень благодарна!',
        date: '2024-09-20',
      },
    ],
  },
  {
    id: 'exp-8',
    name: 'Серик Байжанов',
    category: 'advocate',
    categoryLabel: 'Адвокат',
    specializations: ['Уголовные дела', 'Административные правонарушения', 'Апелляции'],
    experience_years: 20,
    hourly_rate: 45000,
    rating: 4.9,
    completed_deals: 89,
    bio: 'Опытный адвокат по уголовным делам. 20 лет практики, более 300 дел. Специализируюсь на защите по статьям экономических преступлений и мошенничества.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Serik&backgroundColor=d1f4cc',
    is_verified: true,
    response_time: '~4 часа',
    cases: [
      'Добился оправдательного приговора по делу о мошенничестве',
      'Изменил меру пресечения с содержания под стражей на залог',
    ],
    reviews: [
      {
        id: 'r12',
        author: 'Анонимный клиент',
        rating: 5,
        comment: 'Серик — настоящий боец. В самой сложной ситуации нашёл выход. Низкий поклон.',
        date: '2024-08-05',
      },
    ],
  },
  {
    id: 'exp-9',
    name: 'Маргарита Волкова',
    category: 'accountant',
    categoryLabel: 'Бухгалтер',
    specializations: ['Аудит', 'Финансовая отчётность', 'МСФО'],
    experience_years: 9,
    hourly_rate: 16000,
    rating: 4.8,
    completed_deals: 76,
    bio: 'Сертифицированный аудитор (ACCA). Специализируюсь на финансовой отчётности по МСФО и подготовке к аудиту. Работала в Big 4 аудиторских компаниях.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Margarita&backgroundColor=b6e3f4',
    is_verified: true,
    response_time: '~2 часа',
    cases: [
      'Подготовила отчётность по МСФО для привлечения инвестиций $500k',
      'Провела внутренний аудит для ТОО перед внешней проверкой',
    ],
    reviews: [
      {
        id: 'r13',
        author: 'Каирбек Молдагалиев',
        company: 'TechStart KZ',
        rating: 5,
        comment: 'Маргарита подготовила идеальную отчётность для инвесторов. Мы привлекли финансирование!',
        date: '2024-11-30',
      },
    ],
  },
  {
    id: 'exp-10',
    name: 'Талгат Омаров',
    category: 'lawyer',
    categoryLabel: 'Юрист',
    specializations: ['Недвижимость', 'Земельные споры', 'Строительное право'],
    experience_years: 8,
    hourly_rate: 22000,
    rating: 4.8,
    completed_deals: 143,
    bio: 'Специалист по сделкам с недвижимостью и земельным правом РК. Сопровождаю сделки купли-продажи, аренды, помогаю в земельных спорах.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Talgat&backgroundColor=c0aede',
    is_verified: true,
    response_time: '~2 часа',
    cases: [
      'Сопроводил 80+ сделок купли-продажи коммерческой недвижимости',
      'Выиграл земельный спор на участок 5 га',
    ],
    reviews: [
      {
        id: 'r14',
        author: 'Ольга Петренко',
        rating: 5,
        comment: 'Талгат помог безопасно провести сделку по покупке офиса. Проверил все документы, нашёл скрытые обременения.',
        date: '2024-10-08',
      },
    ],
  },
];

export function getExpertsByCategory(category: Category): Expert[] {
  return EXPERTS.filter(e => e.category === category);
}

export function getExpertById(id: string): Expert | undefined {
  return EXPERTS.find(e => e.id === id);
}

export function getProblemsByCategory(category: Category): Problem[] {
  return PROBLEMS.filter(p => p.category === category);
}

export function getProblemById(id: string): Problem | undefined {
  return PROBLEMS.find(p => p.id === id);
}

export const MOCK_DEALS = [
  {
    id: 'deal-1',
    expert_id: 'exp-1',
    client_name: 'Асель Нурова',
    category: 'accountant' as Category,
    description: 'Сдача 910 формы за 2 полугодие 2024',
    status: 'active',
    escrow_amount: 30000,
    created_at: '2024-12-20',
    messages: [
      { id: 'm1', sender: 'client', content: 'Здравствуйте, мне нужна помощь со сдачей 910 формы', time: '10:30' },
      { id: 'm2', sender: 'expert', content: 'Добрый день! Да, конечно помогу. Вышлите, пожалуйста, ваш БИН и данные по доходам за полугодие.', time: '10:45' },
      { id: 'm3', sender: 'client', content: 'БИН: 123456789012, доход за полугодие: 4 800 000 тг', time: '11:00' },
    ],
  },
];
