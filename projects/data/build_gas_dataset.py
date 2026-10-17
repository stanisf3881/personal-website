"""Build the pre-COVID US gasoline price + inflation CSVs.

Run:  python3 -I build_gas_dataset.py            (needs: pandas, xlrd)
Out:  us_gas_prices_precovid.csv   monthly retail gasoline price by geography
      us_inflation_precovid.csv    monthly CPI series + gas price (national)
Sources are listed in SOURCES.md.
"""
import io
import urllib.request
from pathlib import Path

import pandas as pd

OUT = Path(__file__).resolve().parent
START, END = "2015-01-01", "2020-02-01"   # last full month before COVID-19 hit US prices

EIA = "https://www.eia.gov/dnav/pet/hist_xls/EMM_EPMR_PTE_{}_DPGm.xls"
FRED = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={}&cosd=2013-12-01&coed=2020-03-01"

# EIA publishes monthly regular-gasoline prices for the U.S., five PADD regions, and nine states.
GEOS = [
    ("NUS", "National", "United States", "US", "United States"),
    ("R10", "PADD", "East Coast (PADD 1)", "", "East Coast"),
    ("R20", "PADD", "Midwest (PADD 2)", "", "Midwest"),
    ("R30", "PADD", "Gulf Coast (PADD 3)", "", "Gulf Coast"),
    ("R40", "PADD", "Rocky Mountain (PADD 4)", "", "Rocky Mountain"),
    ("R50", "PADD", "West Coast (PADD 5)", "", "West Coast"),
    ("SCA", "State", "California", "CA", "West Coast"),
    ("SWA", "State", "Washington", "WA", "West Coast"),
    ("SCO", "State", "Colorado", "CO", "Rocky Mountain"),
    ("STX", "State", "Texas", "TX", "Gulf Coast"),
    ("SMN", "State", "Minnesota", "MN", "Midwest"),
    ("SOH", "State", "Ohio", "OH", "Midwest"),
    ("SFL", "State", "Florida", "FL", "East Coast"),
    ("SNY", "State", "New York", "NY", "East Coast"),
    ("SMA", "State", "Massachusetts", "MA", "East Coast"),
]


def get(url):
    return urllib.request.urlopen(url, timeout=60).read()


def eia_series(code):
    df = pd.read_excel(io.BytesIO(get(EIA.format(code))), sheet_name="Data 1", skiprows=2, engine="xlrd")
    df.columns = ["date", "price"]
    df["date"] = pd.to_datetime(df["date"]).dt.to_period("M").dt.to_timestamp()  # EIA dates are mid-month
    return df.dropna().set_index("date")["price"]


def fred_series(sid):
    df = pd.read_csv(io.BytesIO(get(FRED.format(sid))), parse_dates=["observation_date"])
    return df.set_index("observation_date")[sid]


def main():
    rows = []
    for code, level, name, abbr, region in GEOS:
        s = eia_series(code).loc[START:END]
        for d, p in s.items():
            rows.append({"date": d.date(), "year": d.year, "month": d.month, "month_name": d.strftime("%b"),
                         "geo_level": level, "geo_code": abbr or code, "geo_name": name,
                         "padd_region": region, "regular_gas_usd_gal": round(float(p), 3)})
    gas = pd.DataFrame(rows)
    gas.to_csv(OUT / "us_gas_prices_precovid.csv", index=False)

    us = eia_series("NUS")
    f = pd.DataFrame({
        "cpi_all_items_nsa": fred_series("CPIAUCNS"),
        "cpi_all_items_sa": fred_series("CPIAUCSL"),
        "cpi_core_sa": fred_series("CPILFESL"),
        "cpi_gasoline_nsa": fred_series("CUUR0000SETB01"),
        "cpi_gasoline_sa": fred_series("CUSR0000SETB01"),
        "gas_price_usd_gal": us,
    }).dropna(how="all")
    f.index.name = "date"
    for c in ("cpi_all_items_nsa", "cpi_core_sa", "cpi_gasoline_nsa", "gas_price_usd_gal"):
        f[c.replace("cpi_", "").replace("_usd_gal", "") + "_yoy_pct"] = (f[c].pct_change(12) * 100).round(2)
    f = f.rename(columns={"all_items_nsa_yoy_pct": "cpi_all_items_yoy_pct",
                          "core_sa_yoy_pct": "cpi_core_yoy_pct",
                          "gasoline_nsa_yoy_pct": "cpi_gasoline_yoy_pct",
                          "gas_price_yoy_pct": "gas_price_yoy_pct"})
    f = f.loc[START:END].copy()
    base = f.iloc[0]
    f["gas_price_idx_jan2015"] = (f["gas_price_usd_gal"] / base["gas_price_usd_gal"] * 100).round(1)
    f["cpi_all_items_idx_jan2015"] = (f["cpi_all_items_nsa"] / base["cpi_all_items_nsa"] * 100).round(1)
    f["cpi_core_idx_jan2015"] = (f["cpi_core_sa"] / base["cpi_core_sa"] * 100).round(1)
    f["cpi_gasoline_idx_jan2015"] = (f["cpi_gasoline_nsa"] / base["cpi_gasoline_nsa"] * 100).round(1)
    f.insert(0, "month_name", [d.strftime("%b") for d in f.index])
    f.insert(0, "month", f.index.month)
    f.insert(0, "year", f.index.year)
    f.index = f.index.date
    f.index.name = "date"
    f.round(3).to_csv(OUT / "us_inflation_precovid.csv")
    print(len(gas), "gas rows;", len(f), "inflation rows")


if __name__ == "__main__":
    main()
