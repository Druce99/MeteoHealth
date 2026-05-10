import pickle
import os
import numpy as np
from datetime import date

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

def predict(model_path: str, forecast_days: list[dict]) -> list[dict]:
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    
    results = []
    for day in forecast_days:
        day_date = date.fromisoformat(day["date"])
        X = np.array([[
            day["pressure"],
            day["kp_index"],
            day["temperature"],
            day["humidity"],
            day_date.weekday(),
            day_date.month,
        ]])
        predicted = round(float(model.predict(X)[0]), 1)
        predicted = max(1.0, min(10.0, predicted))
        results.append({"date": day["date"], "predicted_wellbeing": predicted})
    return results