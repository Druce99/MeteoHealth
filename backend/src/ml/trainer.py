import pickle
import os
from uuid import UUID
from sklearn.ensemble import RandomForestRegressor
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")

def train(user_id: UUID, entries: list[dict]) -> tuple[str, float]:
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    X = []
    y = []
    
    for entry in entries:
        X.append([
            entry["pressure"] or 0,
            entry["kp_index"] or 0,
            entry["temperature"] or 0,
            entry["humidity"] or 0,
            entry["date"].weekday(),   # день недели
            entry["date"].month,        # месяц
        ])
        y.append(entry["wellbeing_score"])
    
    X = np.array(X)
    y = np.array(y)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    score = round(model.score(X, y), 3)
    model_path = os.path.join(MODELS_DIR, f"{user_id}.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    
    return model_path, score