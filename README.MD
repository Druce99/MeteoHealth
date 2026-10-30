MeteoHealth

Мобильное приложение для метеозависимых людей. Предупреждает о погодных изменениях (давление, температура, влажность, магнитные бури) и даёт персональные советы. Учебная практика УП.01.

Как это работает
Пользователь ведёт дневник самочувствия (оценка по шкале, заметки).
Бэкенд забирает погодные данные из Open-Meteo и NOAA (Kp-индекс магнитной активности).
По дневнику обучается персональная ML-модель (RandomForestRegressor), которая прогнозирует самочувствие по погоде.
Приложение показывает прогноз, рекомендации и присылает уведомления и дайджесты.
Стек

Backend: Python 3.13, FastAPI, async SQLAlchemy 2, PostgreSQL 16, Alembic, Redis 7, FastStream (фоновые воркеры), httpx, scikit-learn, pytest, uv.

Frontend: React Native (Expo) с TypeScript.

Инфраструктура: Docker Compose (PostgreSQL, Redis, backend, worker).

Возможности API
пользователи и профиль;
дневник самочувствия (записи по датам, сегодня, неделя);
погодный прогноз;
рекомендации (общие и персональные);
настройки уведомлений;
ML: обучение модели на данных пользователя и прогноз самочувствия.

Документация API: /docs после запуска.

Воркеры

Отдельный процесс на FastStream: загрузка погоды, обучение моделей, рассылка уведомлений и дайджестов.

Структура backend
backend/src/
  api/v1/          роутеры
  services/        бизнес-логика
  repositories/    доступ к БД
  models/          модели SQLAlchemy
  schemas/         схемы Pydantic
  integrations/    Open-Meteo, NOAA
  ml/              обучение и прогноз
  workers/         фоновые воркеры
Запуск
bash
git clone https://github.com/Druce99/MeteoHealth.git
cd MeteoHealth
docker compose up --build

Backend: http://localhost:8000/docs

Мобильное приложение:

bash
cd frontend
cp .env.example .env
npm install
npx expo start
Тесты
bash
cd backend
uv run pytest
Статус

Учебный проект. Тестов пока немного (дневник и пользователи), авторизации нет.
