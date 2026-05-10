from enum import Enum

class AgeGroup(str, Enum):
    UNDER_18 = "under_18"
    AGE_18_35 = "18_35"
    AGE_36_55 = "36_55"
    ABOVE_55 = "55_plus"

class HealthCondition(str, Enum):
    HYPOTENSION = "hypotension"
    HYPERTENSION = "hypertension"
    JOINTS = "joints"
    GENERAL = "general"

class WeatherTrigger(str, Enum):
    PRESSURE_DOWN = "pressure_down"
    PRESSURE_UP = "pressure_up"
    MAGNETIC_STORM = "magnetic_storm"
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"

class Symptom(str, Enum):
    HEADACHE = "headache"
    DIZZINESS = "dizziness"
    FATIGUE = "fatigue"
    JOINT_PAIN = "joint_pain"
    PRESSURE_SPIKE = "pressure_spike"
    INSOMNIA = "insomnia"
    NAUSEA = "nausea"
