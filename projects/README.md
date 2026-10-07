# Three new Tableau Public projects

Cleaned CSVs are in [`data/`](data/). Each project below says which file to connect, what to build, and what the data shows.
All data comes from the open [TidyTuesday](https://github.com/rfordatascience/tidytuesday) archive. `prepare_data.py` rebuilds every file from the original source.

**Publishing (all projects):** In Tableau Public (free desktop app or the web editor at public.tableau.com), choose Connect → Text file (or upload the CSV in the web editor). Build the sheets, combine them on a Dashboard, then File → Save to Tableau Public. Open the published viz and use Share to copy its link.

| # | Project | File(s) | Source |
|---|---------|---------|--------|
| 1 | 120 Years of Olympic Track & Field | `olympic_athletics_medals.csv`, `olympic_athletics_athletes.csv` | Sports-Reference via Kaggle, 1896–2016 |
| 2 | Who Earns What: U.S. Household Income, 1967–2019 | `us_income_distribution.csv`, `us_income_quintiles.csv` | U.S. Census Bureau (CPS ASEC) |
| 3 | The Gender Pay Gap, 2010–2020 | `us_gender_earnings_gap.csv`, `us_weekly_earnings.csv` | U.S. Bureau of Labor Statistics |

---

## 1. 120 Years of Olympic Track & Field

**Question:** Which nations dominate the track, which events do they win, and how have athletes' bodies and ages changed?

**Files:**
- `olympic_athletics_medals.csv`: one row per medal won by a country in an event (3,003 rows). A relay medal counts once for the country, not once per runner.
- `olympic_athletics_athletes.csv`: one row per athlete per event (38,624 rows), with age, height, weight, event group and medal (`None` if no medal).

Columns in the medals file: `noc`, `team`, `year`, `city`, `event`, `event_group`, `sex`, `medal`.

**Sheets to build**
1. **Medal table.** Drag `noc` to Rows, `Number of Records` to Columns, `medal` to Color, and sort descending. Add a Top 10 filter on `noc`.
2. **Medals over time.** `year` to Columns, `Number of Records` to Rows, `noc` to Color. Filter to the top 5 nations, and use a line chart.
3. **Event-group heatmap.** `event_group` to Rows, `noc` to Columns, `Number of Records` to Color (Marks: Square). Shows each country's specialty.
4. **Body-type scatter.** Use the athletes file. Put `height` on Columns and `weight` on Rows, and color by `event_group`. Filter `sex`, and use year as a Pages or slider filter. Sprinters, throwers and distance runners form clearly separate clusters.
5. **Average age by event group.** Use the athletes file. `year` to Columns, `AVG(age)` to Rows, and `event_group` to Color.

**Dashboard:** Put sheets 1 and 2 on top, 3 in the middle, and 4 and 5 below. Add `sex` and a `year` range as dashboard-wide filters. Use sheet 1 as a filter action for the rest.

**Notes for the caption:** Data ends at Rio 2016. Height and weight are missing for about 15% of rows, so Tableau drops those marks. A few early events (5 mile, All-Around) fall into "Other".

---

## 2. Who Earns What: U.S. Household Income, 1967–2019

**Question:** How has income inequality changed, and does it differ by race?

**Files:**
- `us_income_distribution.csv`: for each `year` and `race`, the percent of households in each `income_bracket` (`pct_of_households`), plus `income_median`, `income_mean`, `households` and `bracket_order` for sorting.
- `us_income_quintiles.csv`: mean household income by quintile (`income_quintile`, `mean_income_2019_dollars`), in constant 2019 dollars.

**Sheets to build**
1. **Median income trend.** Use the distribution file. `year` to Columns, `MIN(income_median)` to Rows, `race` to Color. Every row repeats the median, so use MIN or AVG, not SUM. Start the axis at zero and add a reference line at the latest year.
2. **Bracket mix.** `year` to Columns, `SUM(pct_of_households)` to Rows, `income_bracket` to Color, as a stacked area. Sort the brackets by `bracket_order`, and show the "All Races" filter by default. The squeeze of the middle and growth of the "$200,000 and over" band is the story.
3. **Quintile growth.** Use the quintiles file. `year` to Columns, `SUM(mean_income_2019_dollars)` to Rows, `income_quintile` to Color. Pick one race such as "All Races" with a filter. Add a table calculation: Percent Difference From first year.
4. **Top 5% vs lowest 20%.** Create a calculated field `Ratio` = `SUM(IF [income_quintile]="Top 5%" THEN [mean_income_2019_dollars] END) / SUM(IF [income_quintile]="Lowest" THEN [mean_income_2019_dollars] END)`. Plot by year.

**Dashboard:** Add a `race` filter applied to all sheets, and a `year` range slider. Put a one-line takeaway per chart as a text box.

**Notes:** Race categories overlap ("Black Alone" vs "Black Alone or in Combination"), and Census changed its race definitions in 2002. Use one category at a time, and say so in the caption. Brackets are in nominal dollars.

---

## 3. The Gender Pay Gap, 2010–2020

**Question:** How much less do women earn than men, and how does it vary by age and race?

**Files:**
- `us_gender_earnings_gap.csv`: quarterly median weekly earnings for men and women aged 16+ by `race`, plus `women_pct_of_men` already computed (176 rows).
- `us_weekly_earnings.csv`: median weekly earnings by `sex`, `race`, `age` group, `year` and `quarter` (3,564 rows), with `n_persons` (workers).

**Sheets to build**
1. **Gap over time.** Use the gap file. `period` to Columns, `women_pct_of_men` to Rows, `race` to Color. Add a 100% reference line.
2. **Men vs women dumbbell.** Use the gap file filtered to `race` = "All Races". Show `men_median_weekly` and `women_median_weekly` with a dual-axis line, or Measure Names / Measure Values on one axis.
3. **Gap by age.** Use the earnings file. Filter `sex` to Men and Women, `race` to "All Races", and keep only the non-overlapping bands (16 to 19, 20 to 24, 25 to 34, 35 to 44, 45 to 54, 55 to 64, 65 years and over) and exclude the broad groups ("16 years and over", "16 to 24", "25 years and over", "25 to 54", "55 years and over"). `age` to Columns, `AVERAGE(median_weekly_earn)` to Rows, and `sex` to Color as clustered bars. The gap widens with age.
4. **Largest workforce groups.** Use `n_persons` as bubble size in a packed-bubble chart by `age`. Filter to one `period`, because `n_persons` repeats every quarter.

**Dashboard:** Add a `year` filter and a `race` parameter. Annotate the dip in early 2020 with the pandemic.

**Notes:** These are medians for full-time wage and salary workers. They are not adjusted for occupation or hours, so describe them as "median pay" and not "equal pay for equal work". Asian and Black series have fewer respondents and bounce more quarter to quarter.

---

## After you publish

Send me the three Tableau Public links and I can add them to the `TABLEAU_VIZZES` list in `index.html`, where your existing dashboards are embedded.
