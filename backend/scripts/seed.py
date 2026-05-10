"""
Скрипт заполнения БД тестовыми данными.

Запуск внутри Docker:
  # Только рекомендации:
  docker exec meteohealth-backend-1 uv run python scripts/seed.py recommendations

  # Рекомендации + 20 записей дневника (нужен user_id из приложения):
  docker exec meteohealth-backend-1 uv run python scripts/seed.py all <user_id>
"""

import asyncio
import sys
import uuid
import random
from datetime import date, timedelta

from src.core.database import async_session_maker
from src.models.recommendation import Recommendation
from src.models.diary_entry import DiaryEntry
from src.models.enums import HealthCondition, WeatherTrigger, Symptom


RECOMMENDATIONS = [
    # ── hypotension ──────────────────────────────────────────────────────────
    dict(text="При падении давления выпейте крепкий чай или кофе — это поможет быстро поднять тонус.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.PRESSURE_DOWN, priority=1, icon="cafe-outline"),
    dict(text="Примите горизонтальное положение и поднимите ноги выше уровня тела — улучшит кровоток.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.PRESSURE_DOWN, priority=1, icon="bed-outline"),
    dict(text="При росте атмосферного давления ваше самочувствие может улучшиться. Подходящее время для прогулки.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.PRESSURE_UP, priority=3, icon="walk-outline"),
    dict(text="Магнитная буря может вызвать слабость и головную боль у гипотоников. Избегайте резких нагрузок.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.MAGNETIC_STORM, priority=1, icon="warning-outline"),
    dict(text="Пейте больше воды с добавлением соли или специальные изотонические напитки.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.MAGNETIC_STORM, priority=2, icon="water-outline"),
    dict(text="При резком похолодании выпейте горячий напиток и избегайте быстрого выхода на холод.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.TEMPERATURE, priority=2, icon="thermometer-outline"),
    dict(text="Высокая влажность может усилить слабость. Выбирайте кондиционированные помещения.", condition=HealthCondition.HYPOTENSION, trigger=WeatherTrigger.HUMIDITY, priority=2, icon="water-outline"),

    # ── hypertension ─────────────────────────────────────────────────────────
    dict(text="При падении атмосферного давления не отменяйте самостоятельно гипотензивные препараты.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.PRESSURE_DOWN, priority=2, icon="medical-outline"),
    dict(text="Повышение атмосферного давления — высокий риск гипертонического криза. Измерьте давление.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.PRESSURE_UP, priority=1, icon="pulse-outline"),
    dict(text="Ограничьте потребление соли и жидкости в дни повышенного атмосферного давления.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.PRESSURE_UP, priority=1, icon="alert-circle-outline"),
    dict(text="Магнитная буря резко повышает риск сосудистых нарушений. Избегайте стресса и нагрузок.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.MAGNETIC_STORM, priority=1, icon="warning-outline"),
    dict(text="Держите под рукой препараты для снижения давления и не пропускайте плановые дозы.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.MAGNETIC_STORM, priority=1, icon="medkit-outline"),
    dict(text="Резкий перепад температуры влияет на сосудистый тонус. Одевайтесь по погоде.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.TEMPERATURE, priority=1, icon="thermometer-outline"),
    dict(text="Высокая влажность усиливает нагрузку на сердечно-сосудистую систему. Избегайте жары.", condition=HealthCondition.HYPERTENSION, trigger=WeatherTrigger.HUMIDITY, priority=1, icon="heart-outline"),

    # ── joints ───────────────────────────────────────────────────────────────
    dict(text="При падении атмосферного давления суставы могут болеть сильнее. Держите их в тепле.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.PRESSURE_DOWN, priority=1, icon="body-outline"),
    dict(text="Тёплые компрессы на болезненные суставы помогут снять дискомфорт при смене давления.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.PRESSURE_DOWN, priority=2, icon="flame-outline"),
    dict(text="Магнитные бури часто вызывают ломоту в суставах. Примите предписанное обезболивающее.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.MAGNETIC_STORM, priority=1, icon="medkit-outline"),
    dict(text="При резком похолодании утеплите колени и другие болезненные суставы.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.TEMPERATURE, priority=1, icon="body-outline"),
    dict(text="Избегайте переохлаждения суставов — носите термобельё при температуре ниже 10°C.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.TEMPERATURE, priority=2, icon="shirt-outline"),
    dict(text="Высокая влажность усиливает воспаление суставов. Ограничьте физическую активность.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.HUMIDITY, priority=2, icon="water-outline"),
    dict(text="При повышении атмосферного давления болевые ощущения в суставах могут ослабнуть.", condition=HealthCondition.JOINTS, trigger=WeatherTrigger.PRESSURE_UP, priority=3, icon="happy-outline"),

    # ── general ──────────────────────────────────────────────────────────────
    dict(text="При резком падении давления ограничьте физическую активность и больше отдыхайте.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.PRESSURE_DOWN, priority=2, icon="bed-outline"),
    dict(text="Пейте достаточно воды — в дни перепадов давления обезвоживание усиливает симптомы.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.PRESSURE_DOWN, priority=2, icon="water-outline"),
    dict(text="При росте атмосферного давления соблюдайте режим сна и избегайте переутомления.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.PRESSURE_UP, priority=2, icon="moon-outline"),
    dict(text="Во время магнитной бури избегайте стресса, конфликтов и тяжёлой физической работы.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.MAGNETIC_STORM, priority=1, icon="warning-outline"),
    dict(text="Медитация или дыхательные упражнения помогут снизить влияние магнитной бури на организм.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.MAGNETIC_STORM, priority=2, icon="leaf-outline"),
    dict(text="При резком перепаде температуры одевайтесь слоями, чтобы легко адаптироваться.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.TEMPERATURE, priority=2, icon="thermometer-outline"),
    dict(text="Высокая влажность снижает теплоотдачу тела. Избегайте физических нагрузок на улице.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.HUMIDITY, priority=2, icon="fitness-outline"),
    dict(text="При низкой влажности пейте больше воды и используйте увлажнитель воздуха в помещении.", condition=HealthCondition.GENERAL, trigger=WeatherTrigger.HUMIDITY, priority=3, icon="water-outline"),
]


async def seed_recommendations() -> int:
    async with async_session_maker() as db:
        for data in RECOMMENDATIONS:
            rec = Recommendation(**data)
            db.add(rec)
        await db.commit()
    return len(RECOMMENDATIONS)


async def seed_diary(user_id: uuid.UUID) -> int:
    symptom_pool = list(Symptom)
    today = date.today()

    entries = []
    for i in range(20, 0, -1):
        entry_date = today - timedelta(days=i)
        score = random.randint(3, 9)
        n_symptoms = random.randint(0, 3)
        symptoms = random.sample(symptom_pool, n_symptoms) if n_symptoms else []
        entries.append(DiaryEntry(
            user_id=user_id,
            date=entry_date,
            wellbeing_score=score,
            symptoms=symptoms,
            note=random.choice([None, None, None, "Чувствую себя лучше", "Болела голова весь день", "Тяжело вставать"]),
            pressure=round(random.uniform(745.0, 772.0), 1),
            kp_index=round(random.uniform(0.3, 4.5), 1),
            temperature=round(random.uniform(5.0, 22.0), 1),
            humidity=round(random.uniform(38.0, 82.0), 0),
        ))

    async with async_session_maker() as db:
        db.add_all(entries)
        await db.commit()
    return len(entries)


async def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "help"

    if mode == "recommendations":
        n = await seed_recommendations()
        print(f"[OK] Добавлено {n} рекомендаций")

    elif mode == "diary":
        if len(sys.argv) < 3:
            print("Укажи user_id: python scripts/seed.py diary <user_id>")
            sys.exit(1)
        uid = uuid.UUID(sys.argv[2])
        n = await seed_diary(uid)
        print(f"[OK] Добавлено {n} записей в дневник для {uid}")

    elif mode == "all":
        n_rec = await seed_recommendations()
        print(f"[OK] Рекомендации: {n_rec}")
        if len(sys.argv) >= 3:
            uid = uuid.UUID(sys.argv[2])
            n_diary = await seed_diary(uid)
            print(f"[OK] Дневник: {n_diary} записей для {uid}")
        else:
            print("[!] user_id не указан, дневник пропущен")

    else:
        print(__doc__)


if __name__ == "__main__":
    asyncio.run(main())
