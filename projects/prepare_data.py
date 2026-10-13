"""Rebuild the cleaned CSVs used by the Tableau projects.

Source: rfordatascience/tidytuesday (raw.githubusercontent.com). Run: python3 projects/prepare_data.py
Needs pandas. Writes to projects/data/.
"""
import pathlib
import pandas as pd

T = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data"
OUT = pathlib.Path(__file__).parent / "data"
OUT.mkdir(exist_ok=True)

# ---- 1. Olympic track & field, 1896-2016 (120 years of Olympic history, Kaggle/sports-reference) ----
o = pd.read_csv(f"{T}/2021/2021-07-27/olympics.csv")
a = o[o.sport == "Athletics"].copy()
a["event"] = a.event.str.replace("Athletics ", "", regex=False)
a["medal"] = a.medal.fillna("None")

def group(e):
    e = e.lower()
    if "relay" in e: return "Relays"
    if "hurdles" in e or "steeplechase" in e: return "Hurdles & steeplechase"
    if any(k in e for k in ("decathlon", "heptathlon", "pentathlon")): return "Combined events"
    if any(k in e for k in ("jump", "pole vault")): return "Jumps"
    if any(k in e for k in ("shot put", "discus", "javelin", "hammer", "weight throw", "throw", "stone")): return "Throws"
    if "walk" in e: return "Race walk"
    if any(k in e for k in ("marathon", "5,000", "10,000", "5000", "10000", "cross", "3,000", "3000")): return "Distance"
    if any(k in e for k in ("800", "1,500", "1500", "1 mile", "1,000")): return "Middle distance"
    if any(k in e for k in ("100 ", "200 ", "400 ", "60 ", "metres")): return "Sprints"
    return "Other"
a["event_group"] = a.event.map(group)
# Early Games list clubs ("Racing Club de France") as the team; label each NOC by its most common team name.
a["country"] = a.noc.map(a.groupby("noc").team.agg(lambda s: s.value_counts().index[0]))
a["medal_rank"] = a.medal.map({"Gold": 1, "Silver": 2, "Bronze": 3, "None": 4})
athletes = a[["id", "name", "sex", "age", "height", "weight", "team", "noc", "country", "year", "city",
              "event", "event_group", "medal", "medal_rank"]].rename(columns={"id": "athlete_id"})
athletes.to_csv(OUT / "olympic_athletics_athletes.csv", index=False)

# One row per medal won by a country in an event (relay squads count once, not once per runner).
medals = (a[a.medal != "None"]
          .drop_duplicates(["noc", "year", "event", "medal"])
          [["noc", "country", "team", "year", "city", "event", "event_group", "sex", "medal", "medal_rank"]])
medals.to_csv(OUT / "olympic_athletics_medals.csv", index=False)

# ---- 2. U.S. household income (Census CPS ASEC), 1967-2019 ----
d = pd.read_csv(f"{T}/2021/2021-02-09/income_distribution.csv")
order = {b: i + 1 for i, b in enumerate(
    ["Under $15,000", "$15,000 to $24,999", "$25,000 to $34,999", "$35,000 to $49,999",
     "$50,000 to $74,999", "$75,000 to $99,999", "$100,000 to $149,999",
     "$150,000 to $199,999", "$200,000 and over"])}
d["bracket_order"] = d.income_bracket.map(order)
d.rename(columns={"number": "households", "income_distribution": "pct_of_households"}).to_csv(
    OUT / "us_income_distribution.csv", index=False)

q = pd.read_csv(f"{T}/2021/2021-02-09/income_mean.csv")
q = q[q.dollar_type == "2019 Dollars"].drop(columns="dollar_type")
# The source labels both Asian series "Asian Alone" in 2019 dollars, so they can't be told apart: drop them.
q = q[q.race != "Asian Alone"]
# Match the race labels used in the distribution file.
q["race"] = q.race.replace({"Hispanic": "Hispanic (Any Race)", "White, Not Hispanic": "White Alone, Not Hispanic"})
q["quintile_order"] = q.income_quintile.map(
    {"Lowest": 1, "Second": 2, "Middle": 3, "Fourth": 4, "Highest": 5, "Top 5%": 6})
q.rename(columns={"income_dollars": "mean_income_2019_dollars"}).to_csv(
    OUT / "us_income_quintiles.csv", index=False)

# ---- 3. BLS median weekly earnings by sex, race and age, 2010-2020 ----
e = pd.read_csv(f"{T}/2021/2021-02-23/earn.csv")
e = e[e.ethnic_origin == "All Origins"].drop(columns="ethnic_origin")
e["period"] = e.year.astype(str) + "-Q" + e.quarter.astype(str)
e.to_csv(OUT / "us_weekly_earnings.csv", index=False)

# Women's earnings as % of men's, full-time workers 16+ by race and quarter
w = e[e.age == "16 years and over"].pivot_table(
    index=["race", "year", "quarter", "period"], columns="sex", values="median_weekly_earn").reset_index()
w["women_pct_of_men"] = (w.Women / w.Men * 100).round(1)
w.rename(columns={"Men": "men_median_weekly", "Women": "women_median_weekly"}).drop(columns="Both Sexes").to_csv(
    OUT / "us_gender_earnings_gap.csv", index=False)
print("done:", *[f"{p.name} ({sum(1 for _ in open(p)) - 1} rows)" for p in sorted(OUT.glob("*.csv"))], sep="\n  ")
