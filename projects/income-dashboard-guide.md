# Build guide: "Who Earns What?" U.S. household income dashboard

This guide walks through building a one-page Tableau Public dashboard of U.S. household income from 1967 to 2019, from opening the CSVs to publishing. Plan on 2–3 hours the first time. It assumes you've done the Olympic dashboard; menu paths that worked the same way there are still spelled out, just more briefly.

**What you'll end up with (1200 × 1000 px):**

```
┌──────────────────────────────────────────────────────────────────┐
│ WHO EARNS WHAT?                                                  │
│ U.S. household income, 1967–2019, in 2019 dollars                │
│ [Group: All Races ▾]                                             │
├───────────────┬───────────────┬───────────────┬──────────────────┤
│ $68,703       │ +43%          │ 18.6%         │ 29.5×            │  ← KPI tiles
│ median, 2019  │ since 1967    │ earn $150k+   │ top 5% vs bottom │
├───────────────┴───────────────┼───────────────┴──────────────────┤
│ MEDIAN INCOME BY GROUP        │ INCOME MIX: All Races            │
│  ── selected group (dark)     │ ▓▓▓▓▓▓▓▓▓▓▓▓▓ $150k+             │
│  ── other groups (gray)       │ ▒▒▒▒▒▒▒▒▒▒▒▒▒ $75k–$150k         │
│     labelled at line ends     │ ░░░░░░░░░░░░░ $35k–$75k / <$35k  │
├───────────────────────────────┴──────────────┬───────────────────┤
│ INCOME GROWTH SINCE 1967, BY QUINTILE        │ WHAT THIS SHOWS   │
│  Top 5% +139% ───────────────/               │ • 3 takeaways     │
│  Lowest +42% ________________                │                   │
├──────────────────────────────────────────────┴───────────────────┤
│ Source and notes                                                 │
└──────────────────────────────────────────────────────────────────┘
```

It answers three questions:

- **Is the typical household better off?** The median line and the +43% tile.
- **Are households moving up the income ladder?** The income-mix chart. The $150k+ tier grew from 2.9% to 18.6% of households.
- **Who gained the most?** The quintile chart. The top 5% gained +139% after inflation, the lowest fifth +42%.

One **Group** drop-down switches the whole dashboard between All Races, White (not Hispanic), Black and Hispanic households.

---

## Part 0 — Before you start

1. Open **Tableau Public** (desktop app).
2. Download these two files from this repo (open the file on GitHub → *Download raw file*) into the same folder:
   - **`projects/data/us_income_distribution.csv`**
   - **`projects/data/us_income_quintiles.csv`**

**All dollar amounts are already adjusted for inflation to 2019 dollars.** That includes the income brackets, so "$150,000 and over" means the same buying power in 1967 as in 2019. You don't need to adjust anything.

**File 1: `us_income_distribution.csv`** (2,916 rows). One row per year × group × income bracket.

| Column | Example | Meaning |
|---|---|---|
| `year` | 2019 | Survey year |
| `race` | All Races | Household group (8 groups, some overlapping, see notes) |
| `households` | 128451000 | Number of households in the group |
| `income_median` | 68703 | Median household income. **Repeats on all 9 bracket rows**, so never SUM it |
| `income_mean` | 98088 | Mean household income (also repeats) |
| `income_med_moe`, `income_mean_moe` | 904 | Margins of error (not used here) |
| `income_bracket` | $50,000 to $74,999 | One of 9 brackets |
| `pct_of_households` | 16.5 | % of the group's households in this bracket. The 9 rows add to ~100 |
| `bracket_order` | 5 | 1 (Under $15,000) to 9 ($200,000 and over), for sorting |

**File 2: `us_income_quintiles.csv`** (1,638 rows). One row per year × group × quintile.

| Column | Example | Meaning |
|---|---|---|
| `year` | 2019 | Survey year |
| `race` | All Races | Same group names as file 1 |
| `income_quintile` | Lowest | Lowest, Second, Middle, Fourth, Highest (fifths of households), plus Top 5% |
| `mean_income_2019_dollars` | 15286 | Average income of households in that quintile |
| `quintile_order` | 1 | 1 (Lowest) to 6 (Top 5%), for sorting |

**Color palette.** The blues mean the same thing everywhere: **darker = higher income**.

| Use | Hex |
|---|---|
| Income level 1 (lowest) | `#86B6EF` |
| Income level 2 | `#5598E7` |
| Income level 3 | `#2A78D6` |
| Income level 4 | `#1C5CAB` |
| Income level 5 | `#104281` |
| Income level 6 (highest) | `#0D366B` |
| Selected group line | `#1F2A24` |
| Other group lines | `#B9BFBB` |
| Main text | `#1F2A24` |
| Secondary text | `#5F6B65` |
| Dashboard background | `#F5F6F4` |
| Card background | `#FFFFFF` |

---

## Part 1 — Connect both files as separate data sources

### Step 1.1 First data source
1. Start page → **Connect → To a File → Text file** → choose `us_income_distribution.csv` → **Open**.
2. Rename the data source (top left of the Data Source page) to **Income Distribution**.
3. Check the types above each column. `year`, `households`, `income_median`, `income_mean`, `pct_of_households` and `bracket_order` should be **#**. `race` and `income_bracket` should be **Abc**.

### Step 1.2 Second data source
1. Menu **Data → New Data Source → Text file** → choose `us_income_quintiles.csv` → **Open**.
   - Don't drag the second file onto the first file's canvas. The files have different levels of detail and must stay separate.
2. Rename it **Income Quintiles**. Check that `year`, `mean_income_2019_dollars` and `quintile_order` are **#**.

### Step 1.3 Tidy the fields (do this in a worksheet)
Click **Sheet 1**. At the top of the Data pane you'll see both data sources. Click one to see its fields.

**In Income Distribution:**
1. **Rename fields:**
   - **Pct Of Households** → **% of Households**
   - **Income Median** → **Median Income**
   - **Race** → **Group**
2. **Year:** right-click → **Convert to Dimension**, then right-click → **Convert to Continuous** (it should be a green dimension).
   - Then right-click → **Default Properties → Number Format → Number (Custom)** → 0 decimals and **untick** thousands separators.
3. **Median Income:** right-click → **Default Properties → Aggregation → Average**.
   - The value repeats on 9 rows, so SUM would be 9× too big.
   - Then **Default Properties → Number Format → Currency (Custom)** → 0 decimals.
4. **% of Households:** **Default Properties → Number Format → Number (Custom)** → 1 decimal, **Suffix** `%`.
   - The values are already 0–100, so don't use the Percentage format, which would multiply them by 100.
5. **Hide** the fields you won't use: Income Med Moe, Income Mean Moe, Income Mean, Households.

**In Income Quintiles:**
1. Rename **Mean Income 2019 Dollars** → **Mean Income** and **Race** → **Group**.
2. **Year:** convert to a continuous dimension and remove the thousands separators, exactly as above.
3. **Mean Income:** **Default Properties → Number Format → Currency (Custom)**, 0 decimals.

---

## Part 2 — The Group parameter (drives the whole dashboard)

Each chart comes from a different data source, so an ordinary filter can't control them all. A **parameter** can.

### Step 2.1 Create the parameter
1. In the Data pane, click **▾** (top right of the Data pane) → **Create Parameter…**
2. Fill in:
   - **Name:** `Group`
   - **Data type:** String
   - **Allowable values:** **List**
   - Type these four values exactly (one per row): `All Races`, `White Alone, Not Hispanic`, `Black Alone`, `Hispanic (Any Race)`
   - In the **Display As** column, type friendlier labels: `All households`, `White (not Hispanic)`, `Black`, `Hispanic (any race)`
   - **Current value:** `All Races`
3. **OK**.

### Step 2.2 A filter field in each data source
1. Select the **Income Distribution** data source → **Analysis → Create Calculated Field…**
   - Name **Is Selected Group**, formula `[Group] = [Parameters].[Group]`
   - You can also just type `[Group] = [Group]` and pick the parameter from the autocomplete; Tableau shows it in purple.
2. Select the **Income Quintiles** data source and create the same calculated field there.

### Step 2.3 Calculated fields for the charts and KPIs

**In Income Distribution:**

| Name | Formula |
|---|---|
| **Income Tier** | `IF [Bracket Order] <= 3 THEN "Under $35k" ELSEIF [Bracket Order] <= 5 THEN "$35k–$75k" ELSEIF [Bracket Order] <= 7 THEN "$75k–$150k" ELSE "$150k+" END` |
| **Line Highlight** | `IF [Group] = [Parameters].[Group] THEN "Selected" ELSE "Other groups" END` |
| **First Year** | `{ FIXED [Group] : MIN([Year]) }` |
| **Median 2019** | `AVG(IF [Year] = 2019 THEN [Median Income] END)` |
| **Median First Year** | `AVG(IF [Year] = [First Year] THEN [Median Income] END)` |
| **Median Growth** | `[Median 2019] / [Median First Year] - 1` |
| **Share 150k Plus 2019** | `SUM(IF [Year] = 2019 AND [Bracket Order] >= 8 THEN [% of Households] END)` |

Number formats (right-click → **Default Properties → Number Format**):
- **Median 2019:** Currency, 0 decimals.
- **Median Growth:** **Custom**, then type `+0%;-0%` in the format box.
- **Share 150k Plus 2019:** Number (Custom), 1 decimal, suffix `%`.
- **First Year:** Number (Custom), 0 decimals, no thousands separators.

**In Income Quintiles:**

| Name | Formula |
|---|---|
| **Q First Year** | `{ FIXED [Group] : MIN([Year]) }` |
| **Top to Bottom 2019** | `SUM(IF [Year] = 2019 AND [Income Quintile] = "Top 5%" THEN [Mean Income] END) / SUM(IF [Year] = 2019 AND [Income Quintile] = "Lowest" THEN [Mean Income] END)` |
| **Top to Bottom First Year** | `SUM(IF [Year] = [Q First Year] AND [Income Quintile] = "Top 5%" THEN [Mean Income] END) / SUM(IF [Year] = [Q First Year] AND [Income Quintile] = "Lowest" THEN [Mean Income] END)` |

- Format both ratio fields as Number (Custom), 1 decimal, suffix `×`. On Windows, type the multiplication sign with Alt+0215, or just use a lowercase `x`.
- Format **Q First Year** with no thousands separators.

> ✅ **Checkpoint:** On a blank sheet using **Income Distribution**, drag **Median 2019** onto Text and **Is Selected Group** to Filters (tick **True**). It shows **$68,703**. Undo.

---

## Part 3 — Sheet 1: Median Income by Group (highlighted line chart)

1. Rename the sheet **Median Income**. Use the **Income Distribution** data source.
2. Drag **Year** to **Columns** and **Median Income** to **Rows**. It shows as `AVG(Median Income)`.
3. **Limit to five comparable groups.** Drag **Group** to **Filters** → untick all → tick **All Races**, **White Alone, Not Hispanic**, **Black Alone**, **Hispanic (Any Race)**, **Asian Alone** → **OK**.
   - Asian households are shown here for context, but they aren't in the Group drop-down because the quintile file doesn't have them.
4. Drag **Group** to **Detail** on the Marks card. This gives one line per group.
5. Drag **Line Highlight** to **Color**.
   - **Color → Edit Colors…** → **Selected** = `#1F2A24`, **Other groups** = `#B9BFBB`.
   - In the color legend, drag **Selected** to the **top** of the list. This draws it in front of the gray lines.
6. **Line widths:** drag **Line Highlight** onto **Size** as well → **Size → Edit Sizes…**, so the selected line is thicker than the others. Or just set one size of about 2px.
7. **Label the line ends** so every group is identified by name, not just by color:
   - Drag **Group** onto **Label**.
   - **Label → Show mark labels**, then **Marks to Label: Line Ends**, and tick **Label end of line** only.
   - **Label → Font** 8pt, color `#5F6B65`.
   - Labels may overlap where lines are close (White NH and All Races). Fix this by dragging the label slightly, or untick **Allow labels to overlap other marks**.
8. **Axes:**
   - Left axis → **Edit Axis** → title `Median household income (2019 $)`, tick **Include zero**.
   - Year axis → **Edit Axis** → Fixed start `1965` end `2022`, clear the title.
   - **Format → Lines** → keep light horizontal gridlines only.
9. **Tooltip:**
   ```
   <Group> · <Year>
   Median household income: <AVG(Median Income)>
   ```
10. **Title:** **MEDIAN INCOME BY GROUP**, with a subtitle line in 9pt `#5F6B65`: *Selected group in dark; 2019 dollars.*

> ✅ **Checkpoint:** 2019 line ends read approximately:
> - Asian Alone **$98,174**
> - White NH **$76,057**
> - All Races **$68,703**
> - Hispanic **$56,113**
> - Black **$45,438**
>
> Hover over any line in 1967: All Races shows **$47,938**.

---

## Part 4 — Sheet 2: Income Mix (100% stacked area)

1. New sheet → **Income Mix**. Use the **Income Distribution** data source.
2. **Year** → **Columns**. **% of Households** → **Rows** (it shows as SUM).
3. Marks drop-down → **Area**.
4. **Income Tier** → **Color**.
5. Drag **Is Selected Group** to **Filters** → tick **True**.
6. **Order the tiers.** Click **Income Tier** (on Color) → **Sort… → Field → Bracket Order, Minimum, Descending**.
   - **$150k+** should be at the top of the stack and **Under $35k** at the bottom.
   - If it's upside-down, switch to Ascending.
7. **Colors:** **Color → Edit Colors…**:
   - Under $35k `#86B6EF`
   - $35k–$75k `#3987E5`
   - $75k–$150k `#1C5CAB`
   - $150k+ `#0D366B`

   Then **Color → Border → white** for a thin divider.
8. **Axis:** left axis → **Edit Axis** → **Fixed** 0 to 100, title `% of households`. Year axis: Fixed 1965–2022, no title.
9. **Labels on the right edge:**
   - Drag **% of Households** onto **Label**.
   - **Label → Show mark labels → Line Ends → Label end of line**.
   - Then drag **Income Tier** onto Label too, so each band ends with e.g. "$150k+ 18.6%".
   - Set label color to **white** for the two darker bands if needed, via **Label → Font**.
10. **Tooltip:**
    ```
    <Year> · <Income Tier>
    <SUM(% of Households)> of households
    ```
11. **Dynamic title:** double-click the title → type `INCOME MIX: ` then **Insert ▸ Parameters.Group**.
    - Second line: *Share of households in each income tier, 2019 dollars.*

> ✅ **Checkpoint (Group = All Races):** 1967 reads Under $35k **35.9%**, $35k–$75k **41.6%**, $75k–$150k **19.6%**, $150k+ **2.9%**. 2019 reads **25.4% / 28.2% / 27.8% / 18.6%**. Each year adds to ~100%; small ±0.1 differences come from Census rounding.

---

## Part 5 — Sheet 3: Income Growth by Quintile

1. New sheet → **Quintile Growth**. Switch the data source to **Income Quintiles**: click it at the top of the Data pane.
2. **Year** → **Columns**. **Mean Income** → **Rows**.
3. **Income Quintile** → **Color**. Drag **Is Selected Group** to **Filters** → **True**.
4. **Turn the values into % growth since the first year:**
   - Click the **SUM(Mean Income)** pill → **Quick Table Calculation → Percent Difference**.
   - Click it again → **Edit Table Calculation…**:
     - **Compute Using: Specific Dimensions → Year** only.
     - **Relative to: First**.
     - Close.
   - The first year is now 0% and every line shows cumulative growth.
5. **Order and colors:**
   - **Income Quintile** → **Sort → Field → Quintile Order, Minimum, Ascending**.
   - **Edit Colors**:
     - Lowest `#86B6EF`
     - Second `#5598E7`
     - Middle `#2A78D6`
     - Fourth `#1C5CAB`
     - Highest `#104281`
     - Top 5% `#0D366B`
6. **Label line ends:**
   - Drag **Income Quintile** to **Label**.
   - **Show mark labels → Line Ends → end of line only**.
   - The label then shows e.g. "Top 5% +139%". Format the % with Custom `+0%;-0%`: right-click the table-calc pill → **Format… → Pane → Numbers → Custom**.
7. **Zero line:** right-click the left axis → **Add Reference Line → Constant 0**, label None, thin gray line.
   - Left axis title: `Growth since first year (after inflation)`.
8. **Tooltip:**
   ```
   <Income Quintile> · <Year>
   Average income: <SUM(Mean Income)>
   <% Difference in Mean Income> since the first year
   ```
   For the dollar value, add a second copy of **Mean Income** to **Tooltip** without the table calc.
9. **Title:** `INCOME GROWTH SINCE ` + **Insert ▸ Q First Year** + `, BY QUINTILE`.
   - If Insert doesn't list it, drag **Q First Year** onto **Detail** first, as ATTR.
   - Subtitle: *Average household income per fifth of households, inflation-adjusted.*

> ✅ **Checkpoint (All Races, 1967 → 2019):**
> - Lowest **+42%**
> - Second **+37%**
> - Middle **+45%**
> - Fourth **+67%**
> - Highest **+113%**
> - Top 5% **+139%**
>
> Switch Group to **Hispanic**. The chart starts at 1972, and Lowest shows only **+8%**.

---

## Part 6 — KPI tiles (4 small sheets)

Build each one the same way:
1. New sheet.
2. Put the field on **Text**.
3. Click **Text → …** and format it:
   - Line 1: 28pt bold, `#1F2A24`.
   - Line 2: 9pt, `#5F6B65`.
   - Both centered.
4. Add **Is Selected Group = True** to Filters.
5. Hide the title, and set **Format → Shading** to white.

| Sheet | Data source | Text (line 1 / line 2) |
|---|---|---|
| **KPI Median** | Income Distribution | `<AGG(Median 2019)>` / `MEDIAN HOUSEHOLD INCOME, 2019` |
| **KPI Growth** | Income Distribution | `<AGG(Median Growth)>` / `MEDIAN GROWTH SINCE <ATTR(First Year)>` |
| **KPI Top Tier** | Income Distribution | `<AGG(Share 150k Plus 2019)>` / `OF HOUSEHOLDS EARN $150K+ (2019)` |
| **KPI Ratio** | Income Quintiles | `<AGG(Top to Bottom 2019)>` / `TOP 5% AVG vs. LOWEST FIFTH (<AGG(Top to Bottom First Year)> IN <ATTR(Q First Year)>)` |

To insert a field that isn't on Text yet: drag it onto **Detail** first, then it appears under **Insert** in the text editor.

> ✅ **Checkpoint:**
>
> | Group | Median | Growth | $150k+ | Ratio |
> |---|---|---|---|---|
> | All Races | $68,703 | +43% since 1967 | 18.6% | 29.5× (17.6× in 1967) |
> | White NH | $76,057 | +35% since 1972 | 21.1% | 27.3× |
> | Black | $45,438 | +57% since 1967 | 8.8% | 36.3× |
> | Hispanic | $56,113 | +33% since 1972 | 11.2% | 22.0× |

---

## Part 7 — Assemble the dashboard

### 7a Create and size
1. **New Dashboard** → rename **Who Earns What**.
2. **Size: Fixed**, 1200 × 1000.
3. **Dashboard → Format** → shading `#F5F6F4`.
4. Set **Tiled** mode in the Objects pane.

### 7b Layout (containers)
1. Drag a **Vertical** container onto the canvas (the outer frame).
2. **Header:** a **Text** object:
   - **WHO EARNS WHAT?** in 22pt bold.
   - Below it: *U.S. household income, 1967–2019, adjusted for inflation to 2019 dollars* in 11pt `#5F6B65`.
3. **Controls row:** a **Horizontal** container. Add the **Group** parameter control:
   - On any sheet, right-click **Group** under Parameters → **Show Parameter**.
   - On the dashboard it appears on the right side; drag it into this row.
   - Its **▾** menu → **Single Value (dropdown)**. Edit its title to **Show households:**.
4. **KPI row:** a **Horizontal** container with **KPI Median, KPI Growth, KPI Top Tier, KPI Ratio** → container **▾ → Distribute Contents Evenly**.
5. **Middle row:** a **Horizontal** container with **Median Income** (left) and **Income Mix** (right), split 50/50.
6. **Bottom row:** a **Horizontal** container with **Quintile Growth** (about 65%) and a **Text** object (about 35%) titled **WHAT THIS SHOWS**, with three bullets:
   - *The typical household earns 43% more than in 1967, after inflation.*
   - *Households have moved up: 18.6% now earn $150k+ (in 2019 dollars), up from 2.9%.*
   - *But gains were uneven: the top 5% grew +139%, the lowest fifth +42%, so the gap between them widened from 17.6× to 29.5×.*
7. **Footer:** **Text** in 8pt `#5F6B65`:
   > Source: U.S. Census Bureau, Current Population Survey (CPS ASEC), Historical Income Tables, via TidyTuesday. All figures in 2019 dollars (CPI-U-RS). Group definitions changed in 2002 when respondents could select more than one race; earlier "Black Alone" figures cover all Black households. Hispanic and White-not-Hispanic data start in 1972. Built by Franklyn A. Stanislaus.
8. Delete the **Income Tier** and **Line Highlight** color legends from the right side. The direct labels replace them.
   - Keep the **Income Quintile** legend only if the line-end labels collide.

### 7c Cards
For every sheet and text object:
- **Layout** pane → Background **white**, Outer padding **8**, Inner padding **12**, no border.

Rough row heights:
- header 80
- controls 50
- KPIs 100
- middle 380
- bottom 320
- footer 50

### 7d Interactivity
The **Group** drop-down already updates every chart except Median Income, where it changes which line is highlighted.

Optional extra: let viewers **click a line** to change the group.
1. **Dashboard → Actions → Add Action → Change Parameter**.
2. **Source sheet:** Median Income. **Run on:** Select.
3. **Target parameter:** Group. **Source field:** Group.
4. **Clearing the selection will:** Keep current value.
5. Clicking the Asian line does nothing, because "Asian Alone" isn't in the parameter's list. That's expected.

> ✅ **Checkpoint (click tests):**
> - Pick **Black** in the drop-down. The Black line turns dark, Income Mix shows 59.7% under $35k in 1967 falling to 40.1% in 2019, and KPI Ratio shows **36.3×**.
> - Pick **Hispanic**. All four charts start in 1972.

### 7e Phone layout
**Device Preview → Add Phone Layout**. Stack the tiles in this order: KPIs → Median Income → Income Mix → Quintile Growth. Remove the "What this shows" box, or move it under the KPIs.

---

## Part 8 — Polish checklist

- [ ] **Format → Workbook** → all fonts Tableau Book. Titles are UPPERCASE 11pt bold.
- [ ] Years never show a comma ("1,967"). Fix any that do with the First Year / Year number formats.
- [ ] Median Income uses **AVG**, never SUM. A median line near $600,000 means it's summing.
- [ ] Gridlines are light and horizontal only, with no vertical gridlines.
- [ ] Every line or band is labeled by name, not only by color.
- [ ] Tooltips are written as plain sentences.
- [ ] Hide all worksheet tabs (right-click each worksheet tab → **Hide**).

---

## Part 9 — Publish

1. **File → Save to Tableau Public As…** → **Who Earns What - US Household Income 1967-2019**.
2. On the viz page → **Edit Details**:
   - **Description:** *Interactive dashboard of U.S. household income from 1967 to 2019 in inflation-adjusted dollars. Compare median income across groups, see how households shifted between income tiers, and how much faster top incomes grew than bottom incomes. Data: U.S. Census Bureau CPS ASEC.*
   - **Tags:** `Income`, `Inequality`, `Census`, `Economics`, `Dashboard`.
3. **Settings (gear)** → **Show Viz on Profile** on.
4. **Share** → copy the link and send it to me to embed on the site.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Median line is 9× too high | **Median Income** is summing. Right-click the pill → **Measure → Average**, and set the default aggregation (1.3, item 3) |
| Group drop-down changes nothing | That sheet is missing **Is Selected Group = True** on Filters, or the calc compares to the wrong field. It must reference the purple parameter |
| Income Mix bands don't reach 100 | **Is Selected Group** filter missing, so several groups are stacked. Or the axis isn't fixed at 0–100 |
| Quintile chart starts at a value other than 0% | The table calc is relative to **Previous**, not **First**, or it computes along the wrong field. Edit Table Calculation → Specific Dimensions → **Year** only, **Relative to: First** |
| KPI Ratio is blank | You're on the Income Distribution source. The ratio fields live in **Income Quintiles** |
| A KPI shows "1,967" | Set **First Year** / **Q First Year** default number format with no thousands separators |
| The gray lines cover the dark one | Drag **Selected** to the top of the color legend |
