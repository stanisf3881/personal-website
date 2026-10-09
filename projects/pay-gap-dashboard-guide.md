# Build guide: "Mind the Gap" U.S. gender pay gap dashboard

This guide walks through building a one-page Tableau Public dashboard of men's and women's median weekly earnings from 2010 to 2020, from opening the CSV to publishing. Plan on about 2 hours. It uses **one** data file, so it's the simplest of the three projects to wire up.

**What you'll end up with (1200 × 1000 px):**

```
┌──────────────────────────────────────────────────────────────────┐
│ MIND THE GAP                                                     │
│ What U.S. women earn for every dollar men earn, 2010–2020        │
│ [Year: 2020 ▾]                                         ● Men ● Women │
├───────────────┬───────────────┬───────────────┬──────────────────┤
│ 82¢           │ $1,082        │ $892          │ $9,919           │  ← KPI tiles
│ per $1 men    │ men / week    │ women / week  │ gap per year     │
├───────────────┴───────────────┴───────────────┴──────────────────┤
│ CENTS ON THE DOLLAR, BY RACE (2010–2020)                         │
│ All races 81→82¢ │ White 80→82¢ │ Black 93→92¢ │ Asian 83→78¢    │  ← small multiples
├───────────────────────────────────────┬──────────────────────────┤
│ WEEKLY PAY BY AGE                     │ CENTS ON THE DOLLAR      │
│ 16–19   ●─●                           │ BY AGE                   │
│ 25–34        ●───●                    │ ████████████ 91¢         │
│ 45–54           ●──────●              │ ██████████ 77¢           │
├───────────────────────────────────────┴──────────────────────────┤
│ FULL-TIME WORKERS COUNTED (MILLIONS)  ─ men ─ women  ↓ Q2 2020   │
├──────────────────────────────────────────────────────────────────┤
│ Source and notes                                                 │
└──────────────────────────────────────────────────────────────────┘
```

It answers three questions:

- **How big is the gap, and is it closing?** Women earned 81¢ per $1 men earned in 2010 and 82¢ in 2020. It has hardly moved in a decade.
- **Who is it largest for?** It widens sharply with age, from about 91¢ for teens to 77¢ at ages 45–54. It is smallest for Black workers and largest for Asian workers.
- **Why did pay jump in 2020?** About 14 million full-time workers dropped out of the count in Q2 2020, mostly in lower-paid jobs. That pushed the median *up*: a change in who was still working, not raises.

---

## Part 0 — Before you start

1. Open **Tableau Public** (desktop app).
2. Download **`projects/data/us_weekly_earnings.csv`** from this repo (GitHub → *Download raw file*).
   - The folder also has `us_gender_earnings_gap.csv`, a pre-calculated shortcut. You won't need it; this guide calculates the gap in Tableau.

**What's in the file:** 3,564 rows. These are Bureau of Labor Statistics quarterly figures for **full-time wage and salary workers**, one row per sex × race × age group × quarter.

| Column | Example | Meaning |
|---|---|---|
| `sex` | Men / Women / Both Sexes | You'll use Men and Women. Both Sexes is the combined figure |
| `race` | All Races | All Races, White, Black or African American, Asian |
| `age` | 25 to 34 years | 12 age groups, **some overlapping** (see below) |
| `year` | 2020 | 2010–2020 |
| `quarter` | 2 | 1–4 |
| `period` | 2020-Q2 | Year and quarter as text (not used) |
| `n_persons` | 57994000 | Number of full-time workers in that group |
| `median_weekly_earn` | 1087 | Median usual weekly earnings, in **current dollars** (not adjusted for inflation) |

**About the age groups.** The file mixes narrow bands with broad totals that contain them.
- **Non-overlapping bands** (use these for age charts): 16 to 19 years, 20 to 24 years, 25 to 34 years, 35 to 44 years, 45 to 54 years, 55 to 64 years, 65 years and over.
- **Broad groups** (use **16 years and over** for headline numbers): 16 years and over, 16 to 24 years, 25 years and over, 25 to 54 years, 55 years and over.
- Race breakdowns exist only for the broad groups. So the age charts use All Races.

**Color palette.** Men and women keep the same two colors in every chart.

| Use | Hex |
|---|---|
| Men | `#2A78D6` (blue) |
| Women | `#EB6834` (orange) |
| Gap / single-series lines and bars | `#3D4A44` |
| Connector lines, reference lines | `#B9BFBB` |
| Main text | `#1F2A24` |
| Secondary text | `#5F6B65` |
| Dashboard background | `#F5F6F4` |
| Card background | `#FFFFFF` |

These colors are checked to stay distinguishable for people with color-vision deficiency.

---

## Part 1 — Connect and prepare the data

### Step 1.1 Connect
1. Start page → **Connect → To a File → Text file** → `us_weekly_earnings.csv` → **Open**.
2. Rename the data source **Weekly Earnings**.
3. Check types: `year`, `quarter`, `n_persons`, `median_weekly_earn` should be **#**. The rest should be **Abc**.

### Step 1.2 Tidy fields (in Sheet 1)
1. **Rename fields:**
   - **Median Weekly Earn** → **Weekly Earnings**
   - **N Persons** → **Workers**
   - **Race** → **Race**, **Age** → **Age Group**, **Sex** → **Sex** (fix the capitals if Tableau didn't)
2. **Year:** right-click → **Convert to Dimension**. Leave it **discrete** (blue), so it works as a single-pick drop-down filter.
   - Then **Default Properties → Number Format → Number (Custom)**, 0 decimals, **untick** thousands separators.
3. **Quarter:** right-click → **Convert to Dimension**.
4. **Race aliases:** right-click **Race → Aliases…** → *Black or African American* = **Black**. Leave the others.
5. **Age Group aliases** (shorter labels): right-click **Age Group → Aliases…**:
   - 16 to 19 years = **16–19**
   - 20 to 24 years = **20–24**
   - 25 to 34 years = **25–34**
   - 35 to 44 years = **35–44**
   - 45 to 54 years = **45–54**
   - 55 to 64 years = **55–64**
   - 65 years and over = **65+**
6. **Weekly Earnings:** **Default Properties → Number Format → Currency (Custom)**, 0 decimals.
7. **Workers:** **Default Properties → Number Format → Number (Custom)** → **Display Units: Millions (M)**, 1 decimal.
8. **Hide** **Period**.

### Step 1.3 Calculated fields
**Analysis → Create Calculated Field…** for each:

| Name | Formula | Number format |
|---|---|---|
| **Men Weekly** | `AVG(IF [Sex] = "Men" THEN [Weekly Earnings] END)` | Currency, 0 decimals |
| **Women Weekly** | `AVG(IF [Sex] = "Women" THEN [Weekly Earnings] END)` | Currency, 0 decimals |
| **Cents on the Dollar** | `100 * [Women Weekly] / [Men Weekly]` | Number (Custom), 0 decimals, suffix `¢` |
| **Weekly Gap** | `[Men Weekly] - [Women Weekly]` | Currency, 0 decimals |
| **Annual Gap** | `[Weekly Gap] * 52` | Currency, 0 decimals |
| **Quarter Date** | `MAKEDATE([Year], ([Quarter] - 1) * 3 + 1, 1)` | (date, leave as is) |
| **Is Age Band** | `[Age Group] IN ("16 to 19 years", "20 to 24 years", "25 to 34 years", "35 to 44 years", "45 to 54 years", "55 to 64 years", "65 years and over")` | — |

How the gap calculation works:
- For a year, each sex has 4 quarterly medians. **Men Weekly** and **Women Weekly** average them.
- **Cents on the Dollar** compares the two averages. That's the standard "women earn X¢ per $1" figure.
- `IN` needs Tableau 2020.4 or later. On older versions, use `[Age Group] = "16 to 19 years" OR [Age Group] = "20 to 24 years" OR …`.
- Use the original age names (not the aliases) in formulas.

### Step 1.4 Headline filters you'll reuse
Several sheets need "all workers aged 16+, all races". Set those filters once on Sheet 1 and share them:
1. Drag **Age Group** to **Filters** → tick only **16 years and over** → **OK**.
2. Drag **Race** to **Filters** → tick only **All Races** → **OK**.
3. You'll apply these to other sheets later (Part 6).

> ✅ **Checkpoint:** On Sheet 1 (with those two filters), drag **Year** to Filters and pick **2020**. Then drag **Cents on the Dollar** onto Text. It shows **82¢**. Change the year to 2010: **81¢**. Undo the Year filter and the Text field.

---

## Part 2 — KPI tiles (4 small sheets)

Rename **Sheet 1** to **KPI Cents**. It already has the Age Group (16+) and Race (All Races) filters.

1. Drag **Year** to **Filters** → **Select from list** → tick **2020** → **OK**.
2. Drag **Cents on the Dollar** onto **Text** → **Text → …**:
   ```
   <AGG(Cents on the Dollar)>
   WOMEN EARN PER $1 MEN EARN
   ```
   - Line 1: 32pt bold, `#1F2A24`.
   - Line 2: 9pt, `#5F6B65`.
   - Centered.
3. Hide the title. **Format → Shading** → white.

Now **duplicate** the sheet three times (right-click the tab → **Duplicate**) and swap the field on Text:

| Sheet | Field | Line 2 | Line 1 color |
|---|---|---|---|
| **KPI Men** | `Men Weekly` | MEN · MEDIAN WEEKLY PAY | `#2A78D6` |
| **KPI Women** | `Women Weekly` | WOMEN · MEDIAN WEEKLY PAY | `#EB6834` |
| **KPI Annual Gap** | `Annual Gap` | DIFFERENCE OVER A YEAR (×52 WEEKS) | `#1F2A24` |

The blue and orange numbers double as the color legend for men and women across the dashboard.

> ✅ **Checkpoint (Year = 2020):** **82¢**, **$1,082**, **$892**, **$9,919**. For 2010: 81¢, $824, $670, $8,047.

---

## Part 3 — Sheet: Cents on the Dollar by Race (small multiples)

Each race gets its own small panel instead of a different color, so the chart doesn't need a legend and doesn't clash with the men/women colors.

1. New sheet → **Gap by Race**.
2. Drag **Year** to **Columns**. Then click the pill's **▾** → **Continuous**. It turns green; this makes a time axis on this sheet only.
3. Drag **Cents on the Dollar** to **Rows**.
4. Drag **Race** to **Columns**, **in front of** Year. You get 4 side-by-side panels.
5. **Order the panels:** click **Race** → **Sort → Manual** → **All Races, White, Black, Asian**.
6. **Age filter:** drag **Age Group** to Filters → **16 years and over** only.
   - This sheet must **not** use the Race filter from Part 1.
7. **Line style:**
   - Marks: **Line**.
   - **Color** → `#3D4A44`.
   - **Size** → about the 2nd notch.
   - **Color → Markers** → choose the "all points" marker, for small dots on each year.
8. **Equal-pay reference line:**
   - Right-click the left axis → **Add Reference Line**.
   - **Scope: Entire Table**, **Value: Constant 100**.
   - **Label: Custom** → `Equal pay`.
   - **Line:** dashed, `#B9BFBB`.
9. **Axes:**
   - Left axis → **Edit Axis → Fixed** 70 to 102, title `Women's pay per $1 men earn (¢)`.
   - Year axis → **Fixed** 2009.5 to 2020.5, tick interval 5, no title.
10. **Labels at start and end:**
    - **Label → Show mark labels → Line Ends** (both ends).
    - Font 9pt `#1F2A24`. Each panel reads e.g. "81¢ … 82¢".
11. **Headers:** right-click the Race header row → **Format** → 10pt bold. Hide the "Race" field label: right-click → **Hide Field Labels for Columns**.
12. **Tooltip:**
    ```
    <Race> · <Year>
    Women earned <AGG(Cents on the Dollar)> for every $1 men earned
    Men <AGG(Men Weekly)>/week · Women <AGG(Women Weekly)>/week
    ```
13. **Title:** **CENTS ON THE DOLLAR, BY RACE**. Subtitle: *Women's median weekly pay as a share of men's, same race, full-time workers 16+.*

> ✅ **Checkpoint (2010 → 2020):**
> - All Races **81¢ → 82¢**
> - White **80¢ → 82¢**
> - Black **93¢ → 92¢**
> - Asian **83¢ → 78¢**
>
> Asian figures come from a smaller survey sample and bounce more year to year; mention that in the footer.

---

## Part 4 — Sheets: Pay by Age (dumbbell) + Cents by Age (bars)

### 4a Weekly Pay by Age (dumbbell chart)
A dumbbell shows two dots (men and women) per row, joined by a line whose length is the gap.

1. New sheet → **Pay by Age**.
2. **Filters:**
   - **Is Age Band** → **True**.
   - **Race** → **All Races**.
   - **Sex** → **Men** and **Women** only.
   - **Year** → **2020**. You'll connect it to the dashboard filter later.
3. Drag **Age Group** to **Rows**. The bands sort correctly (16–19 at the top, 65+ at the bottom). If not: **Sort → Alphabetic, Ascending**.
4. Drag **Weekly Earnings** to **Columns** → click the pill → **Measure → Average**.
5. **Dots:**
   - Marks: **Circle**.
   - **Sex** → **Color** → **Edit Colors**: Men `#2A78D6`, Women `#EB6834`.
   - **Size:** about 60%.
   - **Color → Border**: white.
6. **Connector line:**
   1. Hold **Ctrl** (Mac: **⌘**) and drag the **AVG(Weekly Earnings)** pill to the right on Columns. This makes a copy, and a second Marks card appears.
   2. On the **second** Marks card (named `AVG(Weekly Earnings) (2)`):
      - Marks → **Line**.
      - Drag **Sex** off **Color** onto **Path**.
      - **Color** → `#B9BFBB`.
      - **Size** → thin.
   3. Right-click the second pill on Columns → **Dual Axis**.
   4. Right-click the top axis → **Synchronize Axis**. Both layers now share one scale.
   5. Right-click the top axis → uncheck **Show Header**.
   6. If the line covers the dots, right-click the bottom axis → **Move marks to back**. Or reorder the pills so the line card comes first.
7. **Axis:** bottom axis → **Edit Axis** → title `Median weekly pay`, **Include zero** unticked (dumbbells are compared by distance between dots, so they don't need zero). No vertical gridlines.
8. **Tooltip** (on the circle card):
   ```
   <Sex>, ages <Age Group> (<Year>)
   Median weekly pay: <AVG(Weekly Earnings)>
   ```
9. **Title:** **WEEKLY PAY BY AGE**. Subtitle: *Each row: men (blue) vs. women (orange); longer bar = bigger gap.*

### 4b Cents on the Dollar by Age (bars)
1. New sheet → **Cents by Age**.
2. **Filters:** **Is Age Band = True**, **Race = All Races**, **Year = 2020**.
   - No Sex filter is needed; the calc already picks Men and Women.
3. **Age Group** → **Rows**. **Cents on the Dollar** → **Columns**.
4. Marks **Bar**, color `#3D4A44`, size about 60%.
5. **Axis:** **Fixed** 0 to 100; then hide the axis (uncheck **Show Header**).
6. **Labels:** **Label → Show mark labels** (values like 91¢ at the bar ends).
7. **Equal pay at 100:** add a **Reference Line**, Constant 100, dashed `#B9BFBB`, no label.
8. **Line it up with 4a:**
   - Hide the row headers: right-click **Age Group** on Rows → uncheck **Show Header**. The dumbbell next to it already shows the age labels.
   - Make sure both sheets sort ages the same way.
9. **Title:** **CENTS ON THE DOLLAR BY AGE**.

> ✅ **Checkpoint (Year = 2020):**
>
> | Age | Cents | Men | Women |
> |---|---|---|---|
> | 16–19 | **91¢** | $514 | $466 |
> | 20–24 | 94¢ | | |
> | 25–34 | 89¢ | | |
> | 35–44 | 81¢ | | |
> | 45–54 | **77¢** | $1,264 | $979 |
> | 55–64 | 78¢ | | |
> | 65+ | 82¢ | | |
>
> In 2010 the 45–54 band was 77¢ and 55–64 was **75¢**.

---

## Part 5 — Sheet: Full-time Workers Counted (the 2020 effect)

1. New sheet → **Workers**.
2. **Filters:** **Age Group = 16 years and over**, **Race = All Races**, **Sex = Men, Women**.
3. Drag **Quarter Date** to **Columns**. Click the pill's **▾** → choose the **second** *Quarter* option (the green, continuous one: e.g. "Q2 2015").
4. **Workers** → **Rows** (SUM).
5. **Sex** → **Color** (blue and orange carry over).
6. Marks **Line**, size 2nd notch.
7. **Axis:**
   - Left → **Edit Axis** → untick **Include zero** (shows the drop clearly), title `Full-time workers (millions)`.
   - Bottom → no title.
8. **Label line ends** with **Sex** (drag Sex to Label → **Line Ends**, end only). Then you don't need a legend.
9. **Annotation:**
   - Right-click the **Q2 2020** point on the Women line → **Annotate → Point…**
   - Type: *Q2 2020: about 14 million fewer full-time workers, mostly in lower-paid jobs. With them gone, the median rose: men $1,022 → $1,087, women $843 → $913.*
   - Format it 8pt, `#5F6B65`, and drag the box to empty space.
10. **Tooltip:**
    ```
    <Sex> · <QUARTER(Quarter Date)>
    <SUM(Workers)> full-time workers
    ```
11. **Title:** **FULL-TIME WORKERS COUNTED**. Subtitle: *Why median pay jumped in 2020: lower-paid workers dropped out of the count.*

> ✅ **Checkpoint:**
> - Men: **64.9M** in Q4 2019 → **58.0M** in Q2 2020.
> - Women: **53.3M** → **46.5M**.
> - Both lines start in Q1 2010 (men 53.0M, women 43.8M) and climb steadily until 2020.

---

## Part 6 — Share the filters

### 6a Headline filters (Age 16+, All Races)
1. Go to **KPI Cents**.
2. Right-click the **Age Group** filter pill → **Apply to Worksheets → Selected Worksheets…** → tick **KPI Cents, KPI Men, KPI Women, KPI Annual Gap, Workers**.
3. Do the same for the **Race** filter.
4. The sheets you duplicated may already have their own copies. That's fine; just make sure each shows 16+ / All Races.

### 6b Year filter (the dashboard's main control)
1. On **KPI Cents**, right-click the **Year** filter pill → **Apply to Worksheets → Selected Worksheets…** → tick:
   - **KPI Cents, KPI Men, KPI Women, KPI Annual Gap** (the 4 KPIs)
   - **Pay by Age**
   - **Cents by Age**

   **Don't** tick Gap by Race or Workers; they show all years.
2. Delete any other Year filters you added on those sheets in Part 4, so only the shared one remains.
3. Right-click the shared Year filter → **Show Filter**. You'll format it in Part 7.

> ✅ **Checkpoint:** Switch Year to **2015**. KPI Cents shows **81¢**, and the dumbbell and age bars change. The race panels and the workers chart don't change.

---

## Part 7 — Assemble the dashboard

### 7a Create and size
1. **New Dashboard** → rename **Mind the Gap**.
2. **Size: Fixed**, 1200 × 1050.
3. **Dashboard → Format** → shading `#F5F6F4`.
4. Use **Tiled** mode.

### 7b Layout (containers)
1. **Vertical** container as the outer frame.
2. **Header** (Text):
   - **MIND THE GAP** in 22pt bold.
   - Below it: *What U.S. women earn for every dollar men earn: full-time workers, 2010–2020* in 11pt `#5F6B65`.
3. **Controls row** (Horizontal container):
   - Drag in the **Year** filter → **▾ → Single Value (dropdown)**. Edit its title to **Year:**.
   - Then **▾ → Customize** → untick **Show "All" Value**, because averaging all years at once isn't meaningful here.
4. **KPI row** (Horizontal): **KPI Cents, KPI Men, KPI Women, KPI Annual Gap** → **Distribute Contents Evenly**.
5. **Gap by Race**: full width.
6. **Age row** (Horizontal): **Pay by Age** (about 60%) and **Cents by Age** (about 40%).
   - Give both the same height and the same top padding, so the age rows line up across the two sheets.
   - If they don't line up, hide the title of **Cents by Age** and put the title in a Text object above it. Or put both titles in one text box over the row.
7. **Workers**: full width.
8. **Footer** (Text, 8pt `#5F6B65`):
   > Source: U.S. Bureau of Labor Statistics, Current Population Survey, median usual weekly earnings of full-time wage and salary workers, via TidyTuesday. Current (not inflation-adjusted) dollars; annual values average the four quarterly medians. Raw medians, not adjusted for occupation, hours or experience: they measure the overall pay gap, not "equal pay for equal work". Asian estimates rely on a smaller sample and vary more. Built by Franklyn A. Stanislaus.
9. **Delete** the auto-added legends on the right (Sex color, etc.). The blue/orange KPI numbers, line-end labels and dot-plot subtitle already explain the colors.
   - If you'd rather keep one legend, keep the **Sex** legend, set **Arrange Items → Single Row**, and put it in the controls row.

### 7c Cards
For every sheet:
- **Layout** pane → Background **white**, Outer padding **8**, Inner padding **12**, no border.

Rough heights:
- header 80
- controls 50
- KPIs 100
- race panels 230
- age row 300
- workers 220
- footer 60

### 7d Interactivity
1. **Highlight men or women everywhere:**
   - **Dashboard → Actions → Add Action → Highlight**.
   - **Source:** Pay by Age and Workers. **Run on:** Hover.
   - **Target:** Pay by Age, Workers. **Selected fields:** Sex.
   - Hovering a blue dot now highlights the men's line too.
2. **Optional — click an age band to see its trend:** this needs an extra sheet. Skip it for version 1.

> ✅ **Final click test:**
> - Set Year to **2010**: KPIs read 81¢ / $824 / $670 / $8,047, and the dumbbell's longest bar is 55–64 ($244 a week apart; 75¢ in the bar chart).
> - Set Year to **2020**: 82¢ / $1,082 / $892 / $9,919.
> - Hover a Women dot: the women's line in Workers highlights.

### 7e Phone layout
**Device Preview → Add Phone Layout**. Stack the sheets in this order:
1. KPIs (2 × 2)
2. Gap by Race
3. Pay by Age
4. Workers

Drop **Cents by Age**; the dumbbell tooltip covers it.

---

## Part 8 — Polish checklist

- [ ] **Format → Workbook** → all fonts Tableau Book. Titles are UPPERCASE 11pt bold.
- [ ] Every "cents" number shows the ¢ suffix. Every dollar number shows $ with no decimals.
- [ ] Years show no thousands separator.
- [ ] Men are always blue and women always orange.
- [ ] Equal-pay reference lines are dashed and light, not competing with the data.
- [ ] The footer says these are **raw medians** (not adjusted for occupation or hours) and **current dollars**.
- [ ] Hide all worksheet tabs.

---

## Part 9 — Publish

1. **File → Save to Tableau Public As…** → **Mind the Gap - US Gender Pay Gap 2010-2020**.
2. **Edit Details**:
   - **Description:** *Interactive dashboard of the U.S. gender pay gap for full-time workers, 2010–2020. Women earned about 82 cents for every dollar men earned in 2020, about $9,900 less over a year. See how the gap varies by race and widens with age, and why median pay jumped in 2020. Data: U.S. Bureau of Labor Statistics.*
   - **Tags:** `Gender Pay Gap`, `Labor`, `BLS`, `Economics`, `Dashboard`.
3. **Settings** → **Show Viz on Profile** on.
4. **Share** → copy the link and send it to me to embed on the site.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Cents shows something like 8,240¢ or 0.82¢ | The formula must be `100 * [Women Weekly] / [Men Weekly]`, formatted as a **Number**, not Percentage |
| KPIs show values much lower than expected (e.g. $500s) | The Age Group / Race filters aren't on that sheet, so small groups (teens) are averaged in. Re-apply 6a |
| Cents on the Dollar is blank | The sheet filters out Men or Women. The calc needs both sexes in the view |
| Dumbbell lines go up and down instead of across | **Sex** is on Color instead of **Path** on the line card, or Age Group isn't on Rows |
| The two dumbbell layers have different scales | Right-click the top axis → **Synchronize Axis** |
| Year filter shows "All" and the KPIs blend years | Filter **▾ → Customize** → untick **Show "All" Value**, and pick a single year |
| Race panels don't show Black/Asian | The Race filter from 6a was applied to Gap by Race. Remove it there |
| Workers line shows one point per year | Quarter Date is set to Year. Choose the continuous **Quarter** option |
