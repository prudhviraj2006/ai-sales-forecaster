import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

np.random.seed(42)
random.seed(42)

PRODUCTS = [
    {"id": f"SKU{str(i).zfill(3)}", "name": f"Product {chr(65 + i // 10)}{i % 10}", 
     "base_price": round(random.uniform(10, 500), 2),
     "category": random.choice(["Electronics", "Clothing", "Home", "Sports", "Food"])}
    for i in range(50)
]

REGIONS = ["North", "South", "East", "West"]

SEASONALITY = {
    1: 0.85,
    2: 0.80,
    3: 0.90,
    4: 0.95,
    5: 1.00,
    6: 1.05,
    7: 1.10,
    8: 1.05,
    9: 0.95,
    10: 1.00,
    11: 1.20,
    12: 1.40,
}

HOLIDAYS = [
    (1, 1),
    (2, 14),
    (5, 28),
    (7, 4),
    (9, 4),
    (11, 24),
    (11, 25),
    (12, 24),
    (12, 25),
    (12, 31),
]


def generate_demo_data(
    start_date: str = "2022-01-01",
    end_date: str = "2023-12-31",
    output_path: str = "backend/data/demo_sales.csv"
):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    date_range = pd.date_range(start=start, end=end, freq='D')
    
    records = []
    
    base_trend = 0
    trend_growth = 0.0005
    
    for current_date in date_range:
        base_trend += trend_growth
        
        seasonal_factor = SEASONALITY.get(current_date.month, 1.0)
        
        is_holiday = (current_date.month, current_date.day) in HOLIDAYS
        holiday_boost = 1.3 if is_holiday else 1.0
        
        is_weekend = current_date.weekday() >= 5
        weekend_factor = 1.15 if is_weekend else 1.0
        
        for product in PRODUCTS:
            for region in REGIONS:
                if random.random() > 0.7:
                    continue
                
                base_units = random.randint(5, 50)
                
                units_sold = int(
                    base_units 
                    * seasonal_factor 
                    * holiday_boost 
                    * weekend_factor 
                    * (1 + base_trend)
                    * random.uniform(0.7, 1.3)
                )
                
                promotion_flag = 0
                price_discount = 1.0
                
                if random.random() < 0.15:
                    promotion_flag = 1
                    price_discount = random.uniform(0.8, 0.95)
                    units_sold = int(units_sold * random.uniform(1.2, 1.5))
                
                if is_holiday and random.random() < 0.3:
                    promotion_flag = 1
                    price_discount = random.uniform(0.75, 0.9)
                
                price = round(product["base_price"] * price_discount, 2)
                
                revenue = round(units_sold * price, 2)
                
                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "region": region,
                    "units_sold": max(1, units_sold),
                    "revenue": max(price, revenue),
                    "price": price,
                    "promotion_flag": promotion_flag,
                })
    
    df = pd.DataFrame(records)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    
    print(f"Generated {len(df):,} records")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Products: {df['product_id'].nunique()}")
    print(f"Regions: {df['region'].nunique()}")
    print(f"Total revenue: ${df['revenue'].sum():,.2f}")
    print(f"Saved to: {output_path}")
    
    return df


def generate_simple_demo(output_path: str = "backend/data/simple_demo.csv"):
    start = datetime.strptime("2022-01-01", "%Y-%m-%d")
    end = datetime.strptime("2023-12-31", "%Y-%m-%d")
    date_range = pd.date_range(start=start, end=end, freq='D')
    
    records = []
    base_revenue = 10000
    
    for current_date in date_range:
        seasonal = SEASONALITY.get(current_date.month, 1.0)
        trend = 1 + (current_date - start).days * 0.0003
        noise = random.uniform(0.85, 1.15)
        
        revenue = base_revenue * seasonal * trend * noise
        units = int(revenue / 25)
        
        records.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "product_id": "ALL",
            "product_name": "All Products",
            "region": "All Regions",
            "units_sold": units,
            "revenue": round(revenue, 2),
            "price": 25.00,
            "promotion_flag": 1 if random.random() < 0.1 else 0,
        })
    
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    
    print(f"Generated simple demo with {len(df)} daily records")
    print(f"Saved to: {output_path}")
    
    return df


if __name__ == "__main__":
    print("Generating full demo dataset...")
    generate_demo_data()
    
    print("\nGenerating simple demo dataset...")
    generate_simple_demo()
