# MeteoHealth — Контекст проекта для Claude Code

## О проекте

Учебная практика УП.01 — мобильное приложение для метеозависимых людей.
Приложение предупреждает пользователей о погодных изменениях (давление, температура, магнитные бури) и даёт персональные советы по подготовке к ним.

---

## Стек технологий

### Backend
- **Python 3.13** — язык
- **uv** — управление пакетами и виртуальным окружением (НЕ pip)
- **FastAPI** — REST API фреймворк
- **SQLAlchemy 2.0** (async) — ORM
- **Alembic** — миграции БД
- **PostgreSQL 16** — основная БД
- **Redis 7** — брокер сообщений
- **FastStream** — фоновые задачи и воркеры (НЕ Celery)
- **Pydantic v2 + pydantic-settings** — валидация и конфиги
- **httpx** — async HTTP клиент для внешних API
- **scikit-learn** — ML модель (RandomForestRegressor)
- **pytest + pytest-asyncio** — тесты

### Frontend
- **React Native + Expo 50+** — мобильное приложение (iOS + Android)
- **TypeScript** — язык
- **Expo Router** — навигация (файловая структура)
- **Expo Notifications** — push-уведомления
- **Expo Location** — геолокация
- **Zustand** — стейт менеджмент
- **axios** — HTTP запросы к backend
- **Victory Native** — графики
- **@expo/vector-icons (Ionicons)** — иконки (НЕ эмодзи)
- **React Native Reanimated** — анимации

### Инфраструктура
- **Docker + Docker Compose** — бэк сервисы (FastAPI, PostgreSQL, Redis)
- **Node.js** — локально для Expo/React Native

### Внешние API
- **Open-Meteo API** — погода, давление, влажность, температура (бесплатно, без ключа, по координатам)
- **NOAA SWPC API** — Kp-индекс геомагнитной активности (бесплатно, без ключа)
- **Expo Push API** — отправка push-уведомлений

---

## Архитектура backend

Строгий REST + Repository Pattern. Цепочка слоёв:

```
HTTP Request
     ↓
API Router       ← только HTTP, валидация Pydantic, никакой логики
     ↓
Service          ← бизнес-логика, никакого SQLAlchemy
     ↓
Repository       ← единственное место работы с БД
     ↓
PostgreSQL
```

**Правило:** каждый слой знает только о слое ниже. Router не знает про БД. Repository не знает про HTTP.

---

## Структура проекта

```
MeteoHealth/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── router.py
│   │   │   │   ├── users.py
│   │   │   │   ├── forecast.py
│   │   │   │   ├── diary.py
│   │   │   │   └── recommendations.py
│   │   │   └── dependencies.py
│   │   ├── services/
│   │   │   ├── user_service.py
│   │   │   ├── forecast_service.py
│   │   │   ├── diary_service.py
│   │   │   ├── recommendation_service.py
│   │   │   └── ml_service.py
│   │   ├── repositories/
│   │   │   ├── base.py
│   │   │   ├── user_repository.py
│   │   │   ├── notification_settings_repository.py
│   │   │   ├── diary_repository.py
│   │   │   ├── recommendation_repository.py
│   │   │   └── ml_model_repository.py
│   │   ├── models/
│   │   │   ├── base.py
│   │   │   ├── enums.py
│   │   │   ├── user.py
│   │   │   ├── user_notification_settings.py
│   │   │   ├── diary_entry.py
│   │   │   ├── recommendation.py
│   │   │   └── ml_model.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── notification_settings.py
│   │   │   ├── diary.py
│   │   │   ├── forecast.py
│   │   │   ├── recommendation.py
│   │   │   └── ml_model.py
│   │   ├── core/
│   │   │   ├── config.py        ← pydantic-settings, все env переменные
│   │   │   ├── database.py      ← async подключение к PostgreSQL
│   │   │   ├── redis.py         ← подключение к Redis
│   │   │   └── exceptions.py   ← кастомные исключения
│   │   ├── workers/
│   │   │   ├── app.py           ← точка входа FastStream
│   │   │   ├── weather_worker.py
│   │   │   ├── notification_worker.py
│   │   │   ├── digest_worker.py
│   │   │   └── ml_worker.py
│   │   ├── integrations/
│   │   │   ├── open_meteo.py
│   │   │   └── noaa.py
│   │   ├── ml/
│   │   │   ├── trainer.py
│   │   │   ├── predictor.py
│   │   │   └── saved_models/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   │   ├── test_services/
│   │   ├── test_repositories/
│   │   └── test_api/
│   ├── pyproject.toml           ← uv использует это, не requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx        ← Dashboard (главный экран)
│   │   │   │   ├── forecast.tsx
│   │   │   │   ├── diary.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── onboarding.tsx
│   │   │   └── recommendations.tsx
│   │   ├── components/
│   │   │   ├── WellnessIndex.tsx    ← круговой индикатор (зел/жёлт/красн)
│   │   │   ├── WeatherCard.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   ├── ForecastBar.tsx
│   │   │   └── DiaryChart.tsx
│   │   ├── store/
│   │   │   ├── userStore.ts
│   │   │   └── forecastStore.ts
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── users.ts
│   │   │   ├── forecast.ts
│   │   │   └── diary.ts
│   │   └── constants/
│   │       ├── colors.ts
│   │       └── theme.ts
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .env
├── .env.example
├── CLAUDE.md                    ← этот файл
└── README.md
```

---

## База данных — таблицы (финальная схема)

5 таблиц в PostgreSQL + кэш в Redis.

Принципы:
- Таблица cities убрана — координаты в users (не нарушает 3НФ, location_name — отображаемая метка)
- Настройки уведомлений вынесены в отдельную таблицу (разные причины для изменения)
- ML модели — метаданные в БД, файл на диске
- Single Responsibility на уровне таблиц

### users
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                 VARCHAR(100)
age_group            AgeGroup NOT NULL           -- ENUM
location_name        VARCHAR(100)                -- "Москва", "Деревня", любое место
latitude             FLOAT NOT NULL
longitude            FLOAT NOT NULL
conditions           HealthCondition[] NOT NULL  -- ENUM[]
sensitivity_pressure SMALLINT DEFAULT 2          -- 1(низкая)/2(средняя)/3(высокая)
sensitivity_kp       SMALLINT DEFAULT 2
sensitivity_temp     SMALLINT DEFAULT 2
expo_token           VARCHAR(200)                -- для push-уведомлений
created_at           TIMESTAMP DEFAULT NOW()
```

### user_notification_settings
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id          UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE
notify_pressure  BOOLEAN DEFAULT true
notify_kp        BOOLEAN DEFAULT true
notify_temp      BOOLEAN DEFAULT true
notify_humidity  BOOLEAN DEFAULT false
kp_threshold     SMALLINT DEFAULT 5    -- с какого Kp уведомлять (3/4/5/6/7)
temp_threshold   SMALLINT DEFAULT 7    -- перепад температуры в °C
quiet_from       TIME DEFAULT '23:00'
quiet_to         TIME DEFAULT '07:00'
digest_enabled   BOOLEAN DEFAULT true
digest_time      TIME DEFAULT '08:00'
updated_at       TIMESTAMP DEFAULT NOW()
```

### diary_entries
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
date            DATE NOT NULL
wellbeing_score SMALLINT NOT NULL          -- 1–10
symptoms        Symptom[] NOT NULL DEFAULT '{}'  -- ENUM[]
note            TEXT
pressure        FLOAT                      -- погода того дня (из Redis при создании)
kp_index        FLOAT
temperature     FLOAT
humidity        FLOAT
created_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, date)
INDEX(user_id, date)                       -- покрывается UNIQUE автоматически
```

### recommendations
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
text        TEXT NOT NULL
condition   HealthCondition NOT NULL       -- ENUM
trigger     WeatherTrigger NOT NULL        -- ENUM
priority    SMALLINT NOT NULL              -- 1(высокий) – 3(низкий)
icon        VARCHAR(50) NOT NULL           -- имя иконки Ionicons
INDEX(condition, trigger)                  -- для быстрого подбора советов
```

### ml_models
```sql
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id        UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
model_path     VARCHAR(500) NOT NULL       -- путь к .pkl файлу на диске
accuracy       FLOAT                       -- R² score модели
entries_count  INTEGER NOT NULL            -- кол-во записей при обучении
is_active      BOOLEAN DEFAULT true        -- активная ли модель
trained_at     TIMESTAMP DEFAULT NOW()
INDEX(user_id, is_active)
```

### forecast_cache (Redis, не PostgreSQL)
```
TTL:     3 часа
ключ:    "forecast:{lat}:{lon}:{date}"
значение: JSON { pressure, temperature, humidity, kp_index, wellness_index }
```

### Связи
```
users 1──────N diary_entries        (один пользователь — много записей)
users 1──────1 user_notification_settings  (у каждого свои настройки)
users 1──────N ml_models            (история моделей пользователя)
recommendations ── без FK           (подбор через сервис по condition+trigger)
```

### Enums (src/models/enums.py)
```python
AgeGroup:        under_18 | 18_35 | 36_55 | 55_plus
HealthCondition: hypotension | hypertension | joints | general
WeatherTrigger:  pressure_down | pressure_up | magnetic_storm | temperature | humidity
Symptom:         headache | dizziness | fatigue | joint_pain | pressure_spike | insomnia | nausea
```

---

## REST API эндпоинты

```
POST   /api/v1/users/                          Регистрация
GET    /api/v1/users/{user_id}                 Профиль
PUT    /api/v1/users/{user_id}                 Обновить профиль
PUT    /api/v1/users/{user_id}/token           Обновить push token

GET    /api/v1/forecast/{user_id}/today        Прогноз + индекс на сегодня
GET    /api/v1/forecast/{user_id}/week         Прогноз на 5 дней
GET    /api/v1/forecast/{user_id}/{date}       Детальный прогноз на дату

POST   /api/v1/diary/{user_id}                 Добавить запись
GET    /api/v1/diary/{user_id}                 Все записи
GET    /api/v1/diary/{user_id}/{date}          Запись за дату
PUT    /api/v1/diary/{user_id}/{date}          Редактировать

GET    /api/v1/recommendations/{user_id}/today    Советы на сегодня
GET    /api/v1/recommendations/general            База советов

GET    /api/v1/ml/{user_id}/predictions        Критические дни на 7 дней
GET    /api/v1/ml/{user_id}/triggers           Личные триггеры
```

---

## Алгоритм индекса благополучия

Диапазон 0–100 (100 = отлично). Считается на бэке в `forecast_service.py`.

```
Индекс = 100 - Штраф_давление - Штраф_Kp - Штраф_температура - Штраф_влажность
```

Штрафы:
- Давление изменилось на 5–8 мм рт. ст. за 6ч → -10
- Давление изменилось более 8 мм рт. ст. за 6ч → -25
- Kp = 3–4 → -10
- Kp = 5–6 → -20
- Kp ≥ 7 → -35
- Перепад температуры 7–10°C за сутки → -10
- Перепад температуры >10°C за сутки → -20
- Влажность >75% или <30% → -5

Коэффициент чувствительности профиля:
- Низкая → ×0.7
- Средняя → ×1.0
- Высокая → ×1.3

Интерпретация:
- 70–100 → 🟢 Зелёный
- 40–69 → 🟡 Жёлтый
- 0–39 → 🔴 Красный

---

## Дизайн фронтенда

- **Тёмная тема** по умолчанию
- Мягкие цвета, крупные шрифты (минимум 16pt) — приложение для людей с головной болью
- Иконки только через **Ionicons** из @expo/vector-icons — никаких эмодзи в UI
- Glassmorphism карточки

Цветовая палитра:
```
Фон:           #0F1117
Карточки:      #1A1D27
Зелёный:       #4CAF82
Жёлтый:        #F5A623
Красный:       #E05252
Текст primary: #FFFFFF
Текст secondary: #8B8FA8
```

---

## FastStream воркеры (расписание)

- `weather_worker` — каждые 3 часа, сбор погоды
- `notification_worker` — каждые 3 часа, проверка триггеров + уведомления
- `digest_worker` — ежедневно в 8:00, утренний дайджест
- `diary_reminder_worker` — ежедневно в 21:00, напоминание о дневнике
- `ml_worker` — при каждой 5-й записи в дневнике, переобучение модели

---

## ML модуль

- Алгоритм: `RandomForestRegressor` из scikit-learn
- Минимум записей для обучения: 14
- Переобучение: каждые 5 новых записей в дневнике
- Признаки (features): давление, изменение давления за 24ч, Kp, перепад температуры, влажность, день недели, сезон
- Цель (target): wellbeing_score из дневника (1–10)

---

## Важные решения и правила

1. **uv** — единственный инструмент для пакетов, никакого pip напрямую
2. **Async везде** — SQLAlchemy async, httpx async, FastAPI async handlers
3. **Repository pattern** — работа с БД только в `repositories/`, нигде больше
4. **`src/` layout** — весь код внутри `src/`, не в корне
5. **pydantic-settings** — все конфиги через `core/config.py`, никаких `os.environ` разбросанных по коду
6. **FastStream** вместо Celery для фоновых задач
7. **Expo Router** (файловая навигация) вместо React Navigation
8. **Ionicons** для иконок, никаких эмодзи в UI компонентах

---

## Переменные окружения (.env)

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/meteohealth
REDIS_URL=redis://localhost:6379/0
# Open-Meteo не требует API ключа
SECRET_KEY=your_secret_key_here
DEBUG=True
```

---

## Docker Compose сервисы

- `backend` — FastAPI (порт 8000)
- `worker` — FastStream воркеры
- `postgres` — PostgreSQL 16 (порт 5432)
- `redis` — Redis 7 (порт 6379)

Фронт (Expo) запускается **локально**, не в Docker.