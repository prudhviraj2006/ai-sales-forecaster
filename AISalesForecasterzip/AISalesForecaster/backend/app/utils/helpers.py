import uuid
import hashlib
from datetime import datetime
from typing import List, Any


def generate_job_id() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_part = uuid.uuid4().hex[:8]
    return f"job_{timestamp}_{unique_part}"


def calculate_change_percentage(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0 if current == 0 else 100.0
    return ((current - previous) / abs(previous)) * 100


def format_number(value: float, decimals: int = 2) -> str:
    if abs(value) >= 1_000_000_000:
        return f"{value / 1_000_000_000:.{decimals}f}B"
    elif abs(value) >= 1_000_000:
        return f"{value / 1_000_000:.{decimals}f}M"
    elif abs(value) >= 1_000:
        return f"{value / 1_000:.{decimals}f}K"
    else:
        return f"{value:.{decimals}f}"


def format_percentage(value: float, decimals: int = 1) -> str:
    return f"{value:+.{decimals}f}%"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    if denominator == 0:
        return default
    return numerator / denominator


def get_season(month: int) -> str:
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Spring"
    elif month in [6, 7, 8]:
        return "Summer"
    else:
        return "Fall"


def get_quarter(month: int) -> int:
    return (month - 1) // 3 + 1


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]
