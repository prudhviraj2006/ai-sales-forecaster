import pandas as pd
from datetime import datetime, date
from typing import List, Dict

US_HOLIDAYS = {
    (1, 1): "New Year's Day",
    (7, 4): "Independence Day",
    (12, 25): "Christmas Day",
    (11, 11): "Veterans Day",
    (12, 31): "New Year's Eve",
}

FLOATING_HOLIDAYS = [
    {"name": "Martin Luther King Jr. Day", "month": 1, "week": 3, "weekday": 0},
    {"name": "Presidents Day", "month": 2, "week": 3, "weekday": 0},
    {"name": "Memorial Day", "month": 5, "week": -1, "weekday": 0},
    {"name": "Labor Day", "month": 9, "week": 1, "weekday": 0},
    {"name": "Thanksgiving", "month": 11, "week": 4, "weekday": 3},
    {"name": "Black Friday", "month": 11, "week": 4, "weekday": 4},
]


def get_nth_weekday_of_month(year: int, month: int, weekday: int, n: int) -> date:
    if n > 0:
        first_day = date(year, month, 1)
        first_weekday = first_day.weekday()
        days_until = (weekday - first_weekday) % 7
        first_occurrence = first_day.replace(day=1 + days_until)
        return first_occurrence.replace(day=first_occurrence.day + (n - 1) * 7)
    else:
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)
        last_day = (next_month - pd.Timedelta(days=1)).day
        last_date = date(year, month, last_day)
        last_weekday = last_date.weekday()
        days_back = (last_weekday - weekday) % 7
        return last_date.replace(day=last_date.day - days_back)


def get_holidays_for_year(year: int) -> Dict[date, str]:
    holidays = {}
    
    for (month, day), name in US_HOLIDAYS.items():
        try:
            holidays[date(year, month, day)] = name
        except ValueError:
            pass
    
    for holiday in FLOATING_HOLIDAYS:
        try:
            holiday_date = get_nth_weekday_of_month(
                year, holiday["month"], holiday["weekday"], holiday["week"]
            )
            holidays[holiday_date] = holiday["name"]
        except (ValueError, AttributeError):
            pass
    
    return holidays


def get_holiday_flags(dates: pd.Series) -> pd.DataFrame:
    dates = pd.to_datetime(dates)
    years = dates.dt.year.unique()
    
    all_holidays = {}
    for year in years:
        all_holidays.update(get_holidays_for_year(year))
    
    result = pd.DataFrame({
        'date': dates,
        'is_holiday': dates.dt.date.isin(all_holidays.keys()).astype(int),
        'holiday_name': dates.dt.date.map(lambda x: all_holidays.get(x, ''))
    })
    
    result['days_to_holiday'] = 0
    result['days_from_holiday'] = 0
    
    holiday_dates = sorted(all_holidays.keys())
    
    for idx, row in result.iterrows():
        current_date = row['date'].date()
        
        future_holidays = [h for h in holiday_dates if h > current_date]
        if future_holidays:
            result.at[idx, 'days_to_holiday'] = (future_holidays[0] - current_date).days
        
        past_holidays = [h for h in holiday_dates if h < current_date]
        if past_holidays:
            result.at[idx, 'days_from_holiday'] = (current_date - past_holidays[-1]).days
    
    return result[['is_holiday', 'holiday_name', 'days_to_holiday', 'days_from_holiday']]
