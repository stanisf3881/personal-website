# Build guide: "Pain at the Pump" gas prices & inflation dashboard

This guide walks through building a one-page Tableau Public dashboard of U.S. gasoline prices and inflation in the **five years before COVID-19 (Jan 2015 – Feb 2020)**, from opening the two CSVs to publishing. Plan on **about 6 hours** the first time (see the schedule in Part 10).

**What you'll end up with (1200 × 1060 px):**

```
┌──────────────────────────────────────────────────────────────────┐
│ Gas swung 64% from low to high. Core inflation barely moved.     │
│ U.S. retail gasoline and inflation, Jan 2015 – Feb 2020          │
│ $1.76 low · Feb 2016   $2.90 high · May 2018   0.96   0.22       │  ← 4 big numbers
│                                       gas↔headline  gas↔core     │
├────────────────────────────────────────┬─────────────────────────┤
│ 1  WHEN is gas expensive?              │ 3  WHERE is gas dear?   │
│  2015   2016   2017   2018   2019      │  Tx  ·────●──·          │
│  ╱╲╱╲   ╲_╱╲   ─╱╲_   ╱╲──   ╱──╲      │  Oh   ·───●───·         │
│  ▲May  ▲Jun   ▲Sep   ▲May  ▲May        │  Fl   ·───●───·         │
│  ▼Dec  ▼Feb   ▼Jul   ▼Dec  ▼Jan        │  Mn   ·───●───·         │
├────────────────────────────────────────┤  Co   ·────●───·        │
│ 2  DOES IT DRIVE INFLATION?            │  Ma   ·────●────·       │
│  gasoline CPI   ∿∿∿∿∿∿∿∿∿∿∿∿∿  ±35%    │  US   ·─────●────·      │
│  headline CPI   ∿∿∿∿∿∿∿∿∿∿∿∿∿  −0.2…3% │  Ny   ·──────●────·     │
│  core CPI       ───────────────  1.6…2.4│  Wa   ·─────────●────·  │
│                                        │  Ca   ·────────────●───·│
├────────────────────────────────────────┴─────────────────────────┤
│ Source and notes                                                 │
└──────────────────────────────────────────────────────────────────┘
```

It answers three questions, one for each theme:

- **When is gas expensive?** (National trend) Is there a seasonal pattern? Panel 1, five small multiples, one per year.
- **Does gasoline drive inflation?** (Gas vs. inflation) How much of the swing in headline inflation is gasoline? Panel 2, three stacked lines against one time axis.
- **Which states pay the most?** (State comparison) Panel 3, a dot plot with each state's 5-year range.

---

## Part 0 — Before you start

1. Install **Tableau Public** (the free desktop app) from <https://public.tableau.com/app/discover> → *Create* → *Download the app*. Sign in, or create a free account.
2. Download the two data files from `projects/data/` in this repo. On GitHub: open each file → *Download raw file*. Save them in one folder, such as `Documents/Tableau/gas/`.
   - **`us_gas_prices_precovid.csv`**: monthly price by geography (930 rows)
   - **`us_inflation_precovid.csv`**: monthly CPI and gas price, national (62 rows)
3. Read `projects/data/SOURCES.md` once. It lists where every number comes from, and the caveats you'll cite in the footer.

### What's in the files

**`us_gas_prices_precovid.csv`**: 930 rows = 15 geographies × 62 months.

| Column | Example | Meaning |
|---|---|---|
| `date` | 2018-05-01 | First day of the month |
| `year`, `month` | 2018, 5 | Numeric year and month (use `month` to sort months) |
| `month_name` | May | 3-letter month name |
| `geo_level` | State | `National` (1), `PADD` (5 regions), or `State` (9) |
| `geo_code` | CA | State abbreviation, `US`, or the PADD code |
| `geo_name` | California | Name to use for labels |
| `padd_region` | West Coast | Region the geography belongs to |
| `regular_gas_usd_gal` | 3.621 | Regular, all formulations, retail price in dollars per gallon |

**`us_inflation_precovid.csv`**: 62 rows, one per month.

| Column | Meaning |
|---|---|
| `date`, `year`, `month`, `month_name` | As above |
| `cpi_all_items_nsa`, `cpi_all_items_sa` | Headline CPI index (1982–84 = 100) |
| `cpi_core_sa` | Core CPI (excludes food and energy) |
| `cpi_gasoline_nsa`, `cpi_gasoline_sa` | CPI for gasoline |
| `gas_price_usd_gal` | National gas price (the same EIA series as above) |
| `cpi_all_items_yoy_pct`, `cpi_core_yoy_pct`, `cpi_gasoline_yoy_pct`, `gas_price_yoy_pct` | % change versus the same month a year earlier |
| `*_idx_jan2015` | Series ÷ its Jan 2015 value × 100 (not needed for the three core sheets, but handy) |

> **Nine states, not fifty.** The U.S. Energy Information Administration (EIA) publishes monthly prices for only these states: CA, WA, CO, TX, MN, OH, FL, NY, MA. Say so in the dashboard; the footer text in Part 7 does.

---

## Design principles (Edward Tufte)

This dashboard follows the ideas from Edward Tufte's *The Visual Display of Quantitative Information*. Keep this table next to you when you format; every formatting step below traces back to one of these rules.

| Principle | What it means here |
|---|---|
| **Maximize the data-ink ratio** | Every drop of ink should show data. No borders, no background fills, no grid lines, no 3-D, no gradients. |
| **Erase chartjunk** | No legends if you can label directly, no icons, no decorative color. |
| **Small multiples** | Panel 1 repeats the same chart for each year, same scale, so the eye compares by position. |
| **Direct labeling** | Label the line, the high and low points, and the dots, instead of a legend or a lookup. |
| **Range-frame the axes** | Show only a few ticks. Panel 3 draws each state's 5-year min–max as a thin band: the data itself frames the axis. |
| **Graphical integrity** | Each row of Panel 2 uses its own labeled scale; gasoline's range is ~70 points, core's is under 1, so a shared axis would flatten core. The scale is stated in the axis title. |
| **Integrate words and graphics** | The title makes the finding as a sentence; annotations sit beside the data they explain. |
| **One accent color** | Gasoline, and the U.S. average, are rust `#B5471B`. Everything else is gray or near-black. |

**Palette for the whole dashboard.**

| Use | Hex |
|---|---|
| Page and sheet background | `#FFFFF8` (warm paper white, as on Tufte's own pages) |
| Main ink | `#111111` |
| Secondary ink (axis, notes, core CPI) | `#6E6E6E` |
| Light rules / zero lines | `#DDDDD5` |
| **Accent: gasoline, U.S. average** | `#B5471B` |
| Range bands (state dot plot) | `#E8E8DE` |

Rust and the secondary gray both pass the 4.5:1 contrast ratio for text on the warm white (about 5.4:1 and 5.0:1).

**Using the browser editor?** It has no hex box, only a swatch grid, so use these stand-ins from its default palette:

| Guide color | Browser swatch |
|---|---|
| Rust accent `#B5471B` (gasoline, U.S. dot, Seasonality lines) | The **orange**: row 3, left column, leftmost shade |
| Main ink `#111111` (headline CPI, state dots) | The **black**: top-left corner |
| Secondary gray `#6E6E6E` (core CPI) | The **middle gray** of the top-right gray block |
| Range bands `#E8E8DE` | The lightest gray in the right block, row 2 |
| Background `#FFFFF8` | **White** (row 2, far left), or leave the default |

Use the same swatch for the same meaning on every sheet.

---

## Part 1 — Connect and prepare the data

### Step 1.1 Connect to the first CSV
1. Open Tableau Public. On the start page's left **Connect** pane, under **To a File**, click **Text file**.
2. Select `us_gas_prices_precovid.csv` → **Open**. The **Data Source** page opens with a preview grid.
3. Click the data source name at the top left and rename it **Gas Prices**.

### Step 1.2 Add the second CSV as a separate source
1. Menu **Data → New Data Source → Text file** → select `us_inflation_precovid.csv` → **Open**.
2. Rename it **Inflation**.
3. Keep them as two **separate** sources. Do **not** join them: they have different grains (geography × month versus month only), and a join would repeat each CPI value 15 times.

### Step 1.3 Check data types (both sources)
Look at the icon above each column in the preview grid:
- `date` should show a **calendar** icon (Date). If it says Abc, click the icon → **Date**.
- `year`, `month` and all price/CPI columns should show **#**.
- `month_name`, `geo_level`, `geo_code`, `geo_name`, `padd_region` should show **Abc**.

### Step 1.4 Tidy the fields — Gas Prices source
1. Click **Sheet 1**. Select **Gas Prices** at the top of the Data pane.
2. Rename (right-click → **Rename**):
   - `Regular Gas Usd Gal` → **Price**
   - `Geo Name` → **Geography**
   - `Geo Level` → **Level**
3. Make `Year` and `Month` discrete dimensions:
   - Right-click **Year** → **Convert to Dimension**. It moves up and turns blue (discrete).
   - Do the same to **Month**.
4. Right-click **Price** → **Default Properties → Number Format… → Currency (Custom)** → 2 decimal places, `$`.
5. Hide the fields you won't use: right-click **Padd Region** and **Geo Code** → **Hide**.

### Step 1.5 Tidy the fields — Inflation source
1. Switch to **Inflation** in the Data pane.
2. Rename:
   - `Cpi Gasoline Yoy Pct` → **Gasoline CPI YoY**
   - `Cpi All Items Yoy Pct` → **Headline CPI YoY**
   - `Cpi Core Yoy Pct` → **Core CPI YoY**
3. Number format for those three: **Number (Custom)**, 1 decimal place, with a `%` suffix. (Custom format string: `0.0"%"` — the values are already percentages, so don't use Tableau's Percentage format.)
4. `Date` should stay continuous (green) when you use it.

### Step 1.6 Calculated fields — Gas Prices source
Select the **Gas Prices** source first. Menu **Analysis → Create Calculated Field…**, enter the name, paste the formula, **OK**.

| Name | Formula | Why |
|---|---|---|
| **Price Cents** | `INT(ROUND([Price] * 100))` | Whole cents, avoids rounding artifacts in labels |
| **Price Text** | `"$" + STR(INT([Price Cents] / 100)) + "." + RIGHT("0" + STR([Price Cents] % 100), 2)` | Prints 2.9 as `$2.90`, not `$2.9` |
| **Peak or Low Label** | `IF [Price] = {FIXED [Year], [Geography] : MAX([Price])} THEN "▲ " + [Month Name] + " " + [Price Text] ELSEIF [Price] = {FIXED [Year], [Geography] : MIN([Price])} THEN "▼ " + [Month Name] + " " + [Price Text] ELSE "" END` | Direct labels on each year's high and low |
| **Min Price All Months** | `{FIXED [Geography] : MIN([Price])}` | Left edge of each state's range band |
| **Max Price All Months** | `{FIXED [Geography] : MAX([Price])}` | Right edge of each state's range band |
| **Is US** | `[Geography] = "United States"` | Colors the U.S. dot in the accent color |

> The `FIXED` calculations ignore ordinary filters, so a state's 5-year range stays put when you click a single year.

### Step 1.7 Calculated fields — Inflation source
Select **Inflation**, and create:

| Name | Formula | Why |
|---|---|---|
| **Corr Gas Headline** | `CORR([Gasoline CPI YoY], [Headline CPI YoY])` | Big number tile |
| **Corr Gas Core** | `CORR([Gasoline CPI YoY], [Core CPI YoY])` | Big number tile |

Set both formats to **Number (Custom)**, 2 decimal places.

> `CORR` works on extracts. Tableau creates one automatically for text files. If your version shows the formula as invalid, see Troubleshooting.

> ✅ **Checkpoint:** On the Gas Prices source, drag **Price** to **Text** on the Marks card and **Geography** to **Filters** keeping only **United States**. Choose AVG: the number is **$2.46**. Undo (Ctrl+Z / ⌘Z).

---

## Part 2 — Sheet 1: When is gas expensive? (small multiples)

Question 1: *Is there a seasonal pattern in the national price?*

1. Select the **Gas Prices** source. Double-click the **Sheet 1** tab and rename it **Seasonality**.
2. Drag **Year** to **Columns**, then drag **Month** to **Columns** right after it (the pill order is `Year`, `Month`). Both are blue (discrete).
3. Drag **Price** to **Rows**. It becomes `SUM(Price)`: click the pill → **Measure → Average**.
4. Marks drop-down → **Line**.
5. Drag **Geography** to **Filters** → tick only **United States** → **OK**.
6. Drag **Year** to Filters → keep **2015, 2016, 2017, 2018, 2019**. (2020 has only two months and breaks the "one full cycle per panel" idea.) → **OK**.
7. Drag **Peak or Low Label** to **Label** on the Marks card. Click **Label** → **Show mark labels**, **Marks to Label: All**, **Font:** Tableau Book 8pt, color `#111111`, **Alignment: Automatic**.

### 2a Format as small multiples
1. **Hide the month header** (the row of numbers 1 to 12 under each year). Twelve labels in ~65 px is clutter, and the peak and low labels already name the months. Do this on the pill, not by deleting it:
   1. Look at the **Columns** shelf above the chart. It holds two blue pills: **YEAR** on the left and **Month** on the right.
   2. **Right-click the Month pill** (the one on the shelf, not a number in the chart).
   3. In the menu that opens, find **Show Header** (it has a check mark next to it). Click it to remove the check.
   4. The row of numbers 1 to 12 under each year disappears. The five year labels (2015 to 2019) stay at the top, and the lines are unchanged.
   - **Don't** drag the Month pill off the shelf or choose **Remove**. The pill must stay on Columns because it draws one point per month; you're only hiding its labels.
   - **To get the labels back,** right-click the Month pill again and tick **Show Header**.
2. **Line color and width:**
   1. Look at the **Marks card**, the gray panel on the left, below the Pages and Filters boxes. It has buttons labeled **Color**, **Size**, **Label**, **Detail**, **Tooltip**. (Use the **All** tab if the card shows several tabs.)
   2. Click **Color**. A small popup opens with a grid of color swatches and a slider labeled **Opacity**.
   3. At the bottom of the popup, click **More Colors…**. This opens the color picker, which is where the hex code goes:
      - **Windows:** a dialog with an **HTML** box. Delete what's in it, type `#B5471B`, press **Enter**, then click **OK**.
      - **Mac:** the Colors window. Click the **sliders** tab (second icon from the left), type `B5471B` in the **Hex Color #** box, press **Enter**, then close the window.
      - **Browser editor (Tableau Public "Create → Web Authoring"):** the popup has only a swatch grid, **Opacity**, and **Border**, with no **More Colors…**, so you can't type a hex code. Either build this in the free desktop app, or pick the closest swatch (the orange one, second row, left column) and accept an approximate color. The rest of this guide assumes the desktop app.
      - If you see **Edit Colors…** instead of **More Colors…**, a field is sitting on Color. Drag that pill off the Color button first (you want no field there), then click **Color** again.
   4. Leave **Opacity** at 100%.
   5. Click **Size**. Drag the slider about a quarter of the way from the left. Tableau shows a slider, not pixels; "about 2px" means a thin line. Compare it against the other lines in the guide's picture and adjust by eye.
3. **Y axis:** right-click the Price axis → **Edit Axis…**
   - **Range: Fixed**, Start `1.5`, End `3.2`
   - **Tick Marks** tab → **Major Tick Marks: Fixed**, Tick origin `2`, Tick interval `0.5`
   - Clear the Axis Title field.
   - All five panels share this axis, so they compare honestly.
4. **Remove chartjunk:** **Format → Lines…**
   - **Grid Lines: None** on both **Rows** and **Columns** tabs
   - **Zero Lines: None**; **Axis Rulers: None**
   - **Format → Borders…**: **Row Divider** and **Column Divider: None**, **Cell** border none, **Pane** border none
   - Keep a faint column divider if you like: on **Borders → Column Divider → Pane**, line `#DDDDD5`, 1px.
5. **Year headers:** right-click the **Year** header → **Format…** → **Font** Tableau Bold 9pt `#111111`, **Alignment: Center**. Move the header to the top (Tableau default is top for a discrete field on Columns).
6. **Background:** **Format → Shading → Worksheet** `#FFFFF8`.

### 2b Tooltip and title
- **Tooltip:**
  ```
  <Month Name> <Year>
  Regular gas: <AVG(Price)> per gallon
  ```
  You'll need to drag **Month Name** onto **Tooltip** first to make it available to insert.
- **Title:** **1  WHEN is gas expensive?** (9pt bold, `#111111`). Press Enter and add a second line in 9pt `#6E6E6E`: *U.S. average price, Jan→Dec in each panel. ▲ yearly high, ▼ yearly low.*

> ✅ **Checkpoint:** The yearly highs read **2015 Jun $2.80**, **2016 Jun $2.37**, **2017 Sep $2.65** (the stored value is $2.645), **2018 May $2.90**, **2019 May $2.86**. The lows read **Dec $2.04**, **Feb $1.76**, **Jul $2.30**, **Dec $2.37**, **Jan $2.25**.
>
> **Reading the pattern:** the yearly high falls in May or June in four of the five years. 2017's Sep high is Hurricane Harvey knocking out Gulf Coast refineries, which is a good annotation to add (right-click the Sep 2017 point → **Annotate → Mark** → *Hurricane Harvey*). Averaged across 2015–2019, February sits about **22¢ below** the year's mean and May about **17¢ above**, a swing of roughly **39¢** per gallon.

---

## Part 3 — Sheet 2: Does gasoline drive inflation? (stacked time series)

Question 2: *How much of the swing in headline inflation is gasoline?*

Use the **Inflation** source.

1. New worksheet → rename **Inflation Stack**.
2. Drag **Date** to **Columns**. Click the pill → choose **Month** from the **second** group (the continuous "Month" shown as May 2018, in green).
3. Drag **Gasoline CPI YoY** to **Rows**. Then drag **Headline CPI YoY** to Rows, to the **right** of it, so it forms a separate row (drop it in the empty area beside the first pill, not on the existing axis). Do the same with **Core CPI YoY**. You now have three stacked panes sharing one time axis. Each pill reads `SUM(...)`, which is fine: there's one row per month.
4. Marks card: the first drop-down labeled **All** applies to every row; set it to **Line**.
5. Give each row its own color by clicking its tab on the Marks card:
   - **SUM(Gasoline CPI YoY):** Color `#B5471B`
   - **SUM(Headline CPI YoY):** Color `#111111`
   - **SUM(Core CPI YoY):** Color `#6E6E6E`
6. Line size: about 2px for all three.

### 3a Honest scales (graphical integrity)
Right-click each row's axis → **Edit Axis…**
- **Gasoline CPI YoY:** Range **Fixed**, `-40` to `40`; ticks fixed at origin `-40`, interval `40`. Title: *Gasoline, % vs. year ago (scale ±40)*
- **Headline CPI YoY:** Range **Fixed**, `-1` to `3.5`; ticks origin `0`, interval `3`. Title: *Headline CPI, % (scale −1 to 3.5)*
- **Core CPI YoY:** Range **Fixed**, **the same** `-1` to `3.5`; same ticks. Title: *Core CPI, % (same scale as headline)*

Headline and core share the same scale, so a flat core line sitting beside a bumpy headline line is a fair comparison. Gasoline has its own much larger scale; the axis titles state this, so readers aren't misled into thinking the swings are equal.

### 3b Clean up and annotate
**Desktop app:**
- **Zero lines:** **Format → Lines → Zero lines**: thin `#DDDDD5` on the Rows tab. Grid lines **None**. Axis rulers **None**.
- **Axis title orientation:** right-click each axis title → **Format…** → **Alignment → Direction: Horizontal**, font 8pt `#6E6E6E`, so they read as row labels.
- **Date axis:** show the year only: right-click the Date axis → **Format…** → **Scale → Dates → Custom** `yyyy`, and put ticks at January only (**Edit Axis → Tick Marks → Major: Fixed, Tick interval 1 year**).
- **Annotations:** right-click the mark → **Annotate → Mark**, 8pt `#111111`, then drag the box next to the point.
  - Gasoline row, lowest point (Jan 2015): *−35.4% (Jan 2015)*
  - Gasoline row, highest point (Feb 2017): *+30.7% (Feb 2017)*
  - Headline row, highest point (Jul 2018): *2.95% (Jul 2018)*
  - Core row, anywhere: *1.6%–2.4% all five years*

**Browser editor (Web Authoring).** It has fewer format options and no hex box, so use swatches and skip anything you can't find. None of these steps changes the data.
1. **Open the Format pane:** click **Format** in the top menu, or right-click an empty spot in the chart → **Format…**. A pane opens on the left. At its top, tabs or icons let you choose what to format (**Lines**, **Font**, **Alignment**, **Shading**, **Borders**, depending on your version).
2. **Grid lines, zero lines and axis rulers:** in the Format pane, open **Lines**. Pick the **Rows** tab if it has one.
   - Set **Grid lines** to **None**.
   - Set **Zero lines** to **Solid** (or leave it on) and pick the lightest gray swatch. If there's a width option, choose the thinnest.
   - Set **Axis rulers** to **None**.
3. **Axis titles as row labels.** The worksheet-level Format pane (the one with **Fonts**, **Shading**, **Borders**, **Lines**, **Interactive Controls**) has no **Alignment**. Rotated titles are fine in the browser editor; the real fix is to make them short enough to read:
   1. Right-click the vertical axis title (for example "Gasoline, % vs. year ago…") → **Edit Axis…** (or double-click the title).
   2. In the **Title** box, type a short name: **Gasoline**, **Headline**, or **Core**. Put the full explanation in the sheet title or subtitle instead (*% change versus the same month one year earlier. Headline and core share one scale; gasoline has its own.*).
   3. If you want the smaller gray text, open the worksheet **Fonts** section, find **Axis Title** (or **Pane** / **Header** if there's no such line), and choose size **8** and the gray swatch.
   - Optional: right-click the axis title → **Format…**. If the pane that opens is titled "Axis" or "Axis Title" and has **Alignment** or **Direction**, set it to **Horizontal**. If not, skip it.
4. **Date axis, years only:** click a year label on the bottom axis (a number like 2016) so the axis is selected, then in the Format pane open **Scale** or **Axis** and look for **Dates**.
   - If you see a date format list, choose the option that shows only the year (for example **2015**) instead of **Mar 2015**.
   - If there's no year-only option, leave the axis as it is. The month-year labels are fine, and each annotation already names its month.
   - For tick marks: right-click the date axis → **Edit Axis…**. If a **Tick Marks** tab exists, set **Major tick marks** to **Fixed**, **Tick interval 1**, unit **Year**. If it doesn't, skip it.
5. **Annotations:**
   1. Hover over the point until it highlights, then **right-click** it.
   2. Choose **Annotate → Mark**.
   3. In the box, delete the default text and type the text below. Click **OK** or click outside the box.
   4. Drag the box beside the point so it doesn't cover the line.
   - If the annotation dialog offers a text-color or font option, choose the black swatch and size 8. If not, leave the default.
   - **Gasoline row**, lowest point (Jan 2015, the far left of the top row): *−35.4% (Jan 2015)*
   - **Gasoline row**, highest point (Feb 2017, the top peak): *+30.7% (Feb 2017)*
   - **Headline row**, highest point (Jul 2018): *2.95% (Jul 2018)*
   - **Core row**, any point in the middle: *1.6%–2.4% all five years*
   - To find a specific point, hover over it: the tooltip shows the date and value. Check that it says the right month before you annotate.
   - **Select the point first.** Left-click the exact vertex of the line so only that point stays highlighted, then right-click it. Right-clicking a stretch of line between points can give you the wrong month.
   - **If **Mark** isn't in the Annotate menu**, choose **Point** instead. It pins the note to that spot on the chart, which works the same way for this chart.
   - **Place the boxes in empty space.** Gasoline low (Jan 2015): up and to the right of the point, in the empty area above the line. Gasoline high (Feb 2017): to the left of the peak, above the line. Headline high (Jul 2018): to the left of the peak, above the line. Core: in the empty strip below the line, around 0% to 1%.
   - **Strip the box (optional, Tufte-style):** right-click the annotation → **Format…**; if **Shading** and **Lines** appear, set them to **None** so only the text and its thin leader line remain.
- **Background:** **Format → Shading → Worksheet** `#FFFFF8`.
- **Tooltip** (each row, same pattern; edit the Marks tab per row):
  ```
  <Date>
  Gasoline CPI: <SUM(Gasoline CPI YoY)> vs. year ago
  ```
  Change the label for each row to match.
- **Title:** **2  DOES GASOLINE DRIVE INFLATION?** and below: *% change in prices versus the same month one year earlier.*

> ✅ **Checkpoint:**
> - Gasoline CPI ranges from **−35.4%** (Jan 2015) to **+30.7%** (Feb 2017).
> - Headline CPI ranges from **−0.2%** (Apr 2015) to **+2.95%** (Jul 2018).
> - Core CPI stays between **1.6% and 2.4%**. Its standard deviation is 0.22 points, against 0.88 for headline and 17 for gasoline.
>
> **Reading the pattern:** headline inflation fell below 0% when gas collapsed in 2015, and hit its high in mid-2018 when gas was up 25%, while core inflation, which excludes food and energy, barely moved. The correlation between gasoline and headline is **0.96** and between gasoline and core only **0.22**. Be careful with that first number: gasoline is *part of* headline, so a high correlation is partly built in. The cleaner test is the gap between headline and core, which tracks gasoline at 0.98. That gap is the gasoline effect with the stable core subtracted out.
>
> Gas also doesn't lead headline inflation here: the correlation peaks in the *same* month (0.96) and falls off in both directions (0.91 at ±1 month, 0.84 at ±2).

---

## Part 4 — Sheet 3: Which states pay the most? (dot plot with ranges)

Question 3: *Which states are consistently the most and least expensive, and by how much?*

Use the **Gas Prices** source.

1. New worksheet → rename **State Prices**.
2. Drag **Geography** to **Rows**. Drag **Price** to **Columns** and set it to **Average**.
3. Marks drop-down → **Circle**.
4. Drag **Level** to **Filters** → untick **PADD**, keep **National** and **State** → **OK**. That leaves the nine states plus the U.S. average, ten rows.
5. **Sort the rows:** click the **Geography** pill → **Sort…** → **Sort By: Field**, **Ascending**, **Field Name: Price**, **Aggregation: Average**. The cheapest state is at the top.
6. **Color the U.S. dot:** drag **Is US** to **Color** on the Marks card. Edit Colors: **True** `#B5471B`, **False** `#111111`. Remove the legend: click its **▾** → **Hide Card**.
7. **Size:** click **Size** and move it to a medium dot (about 40% of the slider).
8. **Label the dots:** drag **Price** to **Label**; format `$0.00`; position **right** of the mark, 8pt. If a label overlaps the band, set the alignment to **Top** instead.

### 4a Add the 5-year range band (range-frame)
1. Drag **Min Price All Months** to **Detail** on the Marks card (it becomes `SUM(Min Price All Months)`: change it to **Average**). Do the same for **Max Price All Months**.
2. Right-click the Price axis (bottom) → **Add Reference Line…** → **Band** tab:
   - **Scope: Per Cell**
   - **Band From:** `Average Min Price All Months`, **Minimum**
   - **Band To:** `Average Max Price All Months`, **Maximum**
   - **Fill:** `#E8E8DE`, **Label: None**, **Tooltip: None**
3. Add two lines so the range ends carry numbers: **Add Reference Line… → Line** tab, **Scope: Per Cell**, **Value: Average Min Price All Months**, **Label: Value**, **Line: None**; repeat with **Max**. Set the labels to 8pt `#6E6E6E`.

### 4b Clean up
- **Axis:** **Edit Axis…** → Range **Fixed**, `1.25` to `4.25`; ticks fixed at origin `2`, interval `1`. Clear the axis title. Move the axis to the top if you prefer (**Format → Axis → Position**), or hide it entirely: the labels already carry every number.
- **Remove chartjunk:** **Format → Lines…**: Grid lines **None**, zero lines **None**, row axis rulers **None**.
- **Row headers:** right-click the **Geography** header → **Format…** → font 9pt `#111111`, **Alignment: Right**. Hide the field label: right-click the word **Geography** above the names → **Hide Field Labels for Rows**.
- **Background:** worksheet shading `#FFFFF8`.
- **Tooltip:**
  ```
  <Geography>
  Average: <AVG(Price)> per gallon
  5-year low <AVG(Min Price All Months)> · 5-year high <AVG(Max Price All Months)>
  ```
- **Title:** **3  WHERE is gas dear?** Second line: *Average price (dot) and Jan 2015–Feb 2020 low-to-high range (band). Nine states with EIA data.*

> ✅ **Checkpoint:** The dots, cheapest to dearest, read **Texas $2.20, Ohio $2.34, Florida $2.35, Minnesota $2.35, Colorado $2.38, Massachusetts $2.44, United States $2.46, New York $2.55, Washington $2.87, California $3.21**.
>
> Ranges: **California $2.42–$4.04**, **Texas $1.55–$2.70**.
>
> **Reading the pattern:** California was the most expensive of the nine states in **all 62 months**. Texas was the cheapest in 59 of 62 (Ohio took 2 months, Colorado 1). California's average premium over the U.S. was **74¢** (43¢ at the smallest, $1.41 at the largest, Oct 2019), and over Texas **$1.01**. Even California's *lowest* price in the period ($2.42) is higher than Texas's 5-year average ($2.20).

---

## Part 5 — Big-number tiles (the Tufte "sparkline" strip)

Four tiny sheets across the top, plain text, no boxes.

**Tile 1 and 2: low and high (Gas Prices source):**
1. New worksheet → rename **KPI Low**.
2. Filter **Geography** = United States. Drag **Price** to **Text** on the Marks card, set to **Minimum**.
3. Click **Text** → **…**:
   ```
   <MIN(Price)>
   LOW · FEB 2016
   ```
   Line 1: Tableau Bold 24pt `#111111`. Line 2: 8pt `#6E6E6E`.
4. Duplicate the sheet → rename **KPI High**, change the measure to **Maximum**, line 2 to **HIGH · MAY 2018**.

**Tile 3 and 4: correlations (Inflation source):**
1. New worksheet → **KPI Corr Headline**. Drag **Corr Gas Headline** to **Text**:
   ```
   <AGG(Corr Gas Headline)>
   GAS ↔ HEADLINE CPI
   ```
2. Duplicate → **KPI Corr Core** using **Corr Gas Core**, line 2 **GAS ↔ CORE CPI**.

For all four: **Format → Shading → Worksheet** `#FFFFF8`; right-click the title → **Hide Title**; **Format → Borders** none.

> ✅ **Checkpoint:** The tiles read **$1.76**, **$2.90**, **0.96**, **0.22**.

---

## Part 6 — Dashboard actions (one, deliberate)

Tufte warned against decoration, not against interaction that adds information. One action:

Menu **Dashboard → Actions… → Add Action ▸ Filter** (create this after Part 7's layout so both sheets are present).

- **Name:** `Pick a year`
- **Source sheets:** **Seasonality** only (**Gas Prices** source). **Run action on: Select**.
- **Target sheets:** **State Prices**.
- **Clearing the selection will:** **Show all values**.
- **Filter: Selected Fields → Year**.

Clicking any year panel redraws the state dots for that year, while the gray range bands stay at the 5-year range (that's why those were built with `FIXED`).

> ✅ **Checkpoint (click tests):**
> - Click anywhere in the **2016** panel: the U.S. dot slides to **$2.15** and Texas to **$1.92**.
> - Click **2019**: California **$3.60**, Texas **$2.28**, the U.S. **$2.60**. The gap between California and Texas is **$1.32**, up from **$0.81** in 2016 (CA $2.73, TX $1.92). That matches a widening spread: the average monthly gap between the dearest and the cheapest of the nine states narrowed to **$0.81 (2016)**, then grew every year to **$1.32 (2019)**.
> - Click the selected panel again to clear.

---

## Part 7 — Assemble the dashboard

### 7a Create and size it
1. Click the **New Dashboard** icon at the bottom. Rename the tab **Pain at the Pump**.
2. Left **Dashboard** pane → **Size**: **Fixed size**, **Custom**, **1200 × 1060** px.
3. **Dashboard → Format…** → **Dashboard Shading** `#FFFFF8`.

### 7b Build the layout with containers
Check that **Tiled** (not Floating) is selected at the bottom of the Objects pane.

1. Drag a **Vertical** container onto the empty canvas as the outer frame.
2. **Header:** drag a **Text** object to the top. Type:
   - Line 1: **Gas swung 64% from low to high. Core inflation barely moved.** in Tableau Bold 22pt `#111111`
   - Line 2: *U.S. retail regular gasoline and inflation, Jan 2015 – Feb 2020, the five years before COVID-19* in 11pt `#6E6E6E`
3. **Number strip:** drag a **Horizontal** container below. Drag **KPI Low, KPI High, KPI Corr Headline, KPI Corr Core** into it, side by side. Container ▾ → **Distribute Contents Evenly**. Give the strip a fixed height of about 70 px.
4. **Main row:** drag another **Horizontal** container below the strip. Split it about **62 / 38**.
   - **Left:** a **Vertical** container. Put **Seasonality** on top (about 330 px tall) and **Inflation Stack** below (about 470 px).
   - **Right:** **State Prices**, the full height (about 800 px).
5. **Footer:** drag a **Text** object to the bottom. Type in 8pt `#6E6E6E`:
   > Sources: U.S. Energy Information Administration, Retail Gasoline Prices (monthly, regular all formulations, series EMM_EPMR_PTE_*_DPG, release of 14 Oct 2026); U.S. Bureau of Labor Statistics, CPI-U (via FRED, Federal Reserve Bank of St. Louis; CPIAUCNS, CPIAUCSL, CPILFESL, CUUR0000SETB01). EIA reports monthly state prices for only nine states, so "states" means CA, WA, CO, TX, MN, OH, FL, NY and MA. Prices are nominal. Gasoline is part of headline CPI, so the gas↔headline correlation partly reflects that overlap; core CPI excludes food and energy. Window: Jan 2015 – Feb 2020 (62 months); March 2020 onward is the COVID-19 period. Built by Franklyn A. Stanislaus.
6. Delete any leftover filter cards or legends on the right side.

### 7c Strip the frames (the data-ink rule again)
For each sheet and the number strip:
1. Select it → **Layout** pane (top left, next to *Dashboard*).
2. **Background:** none (or `#FFFFF8`). **Border:** None. **Outer padding:** 6. **Inner padding:** 8.
3. To separate the three panels without boxes, give the left column one thin rule instead: select the container between the columns → **Border** → solid, `#DDDDD5`, 1px, **left only** (use **Layout → Border** with the single-side option).

Approximate row heights: header 85 px, number strip 70 px, main row 800 px, footer 90 px.

### 7d Add the action
Now add the **Pick a year** action from Part 6.

> ✅ **Checkpoint:** All three panels are readable at 1200 px. The dashboard has no legend, no border boxes, no grid lines. The only color besides gray is rust, for gasoline and the U.S. dot.

---

## Part 8 — What you can say from it

Use these when you write the post or presentation. All numbers are from the CSVs.

| Question | Finding |
|---|---|
| **When is gas expensive?** | The yearly peak falls in **May or June in four of five years**. Averaged over 2015–2019, **February** is lowest (about 22¢ under the annual mean) and **May** highest (about 17¢ over): a seasonal swing of **~39¢**. The exception, **Sep 2017**, is Hurricane Harvey. |
| **Does gasoline drive inflation?** | Headline CPI swung from **−0.2% to +2.95%** while core stayed in **1.6%–2.4%**. The gap between headline and core tracks gasoline at **0.98**. Gas has no lead on headline here: the correlation peaks in the same month. |
| **Which states pay most?** | **California was the dearest of the nine states in all 62 months** (average **$3.21**, +74¢ over the U.S.); **Texas was cheapest in 59** (average **$2.20**). The monthly spread between the dearest and cheapest of the nine states **narrowed to $0.81 in 2016, then widened every year to $1.32 in 2019**. |

Questions this dashboard **cannot** answer: anything about all 50 states (only 9 are published monthly), real (inflation-adjusted) prices, or anything after Feb 2020.

---

## Part 9 — Final polish checklist

- [ ] **Fonts:** **Format → Workbook…** → set all fonts to **Tableau Book**; bold only titles and the year headers.
- [ ] Panel titles are numbered and in UPPERCASE 9pt bold, so they match.
- [ ] No leftover grid lines, zero lines, axis rulers, or borders (check **Format → Lines** and **Format → Borders** on each sheet).
- [ ] Prices show `$` and 2 decimals; percent values show 1 decimal and `%`; years show no thousands separator.
- [ ] Every axis that needs one has a scale stated in its title (Panel 2).
- [ ] Tooltips are written as sentences; none shows the default "SUM(Price): 2.9".
- [ ] Hover over every chart and click every year panel once.
- [ ] **Worksheet tabs:** right-click each worksheet tab → **Hide**. Hide only the sheets, not the dashboard.
- [ ] Source footer is visible and mentions the nine-state limit.

---

## Part 10 — Publish, and your schedule

### Publish to Tableau Public
1. **File → Save to Tableau Public As…** Sign in if asked.
2. Name it **Pain at the Pump - US Gas Prices and Inflation 2015-2020** → **Save**. The browser opens your published viz.
3. Click **Edit Details** (the pencil next to the title).
   - **Description:** *Interactive dashboard of U.S. retail gasoline prices and inflation in the five years before COVID-19 (Jan 2015 – Feb 2020): seasonal patterns, the link between gasoline and headline versus core inflation, and price differences across nine states. Data: U.S. EIA and BLS (via FRED).*
   - **Tags:** `Gas Prices`, `Inflation`, `CPI`, `Energy`, `Dashboard`.
4. **Settings (gear)** → **Show Viz on Profile** on. Optionally **Allow access** on, so others can download the workbook.
5. **Share** → copy the link.

Send me the link and I'll add it to the `TABLEAU_VIZZES` list in `index.html`, where your other dashboards are embedded.

### Time estimate

| Step | Time |
|---|---|
| Part 0–1: read `SOURCES.md`, connect both CSVs, fields and calculations | 45 min |
| Part 2: Seasonality small multiples | 45 min |
| Part 3: Inflation stack (axes, annotations) | 60 min |
| Part 4: State dot plot with range bands | 60 min |
| Part 5: Four number tiles | 20 min |
| Part 6–7: Layout, de-framing, action | 60 min |
| Part 8–9: Reading the findings, polish pass | 40 min |
| Part 10: Publish, embed on the site | 30 min |
| **Total** | **≈ 6 hours** (two evening sessions, or one weekend afternoon) |

Add up to an hour if Tableau is new to you, mostly for the dual-structure steps in Parts 3 and 4.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Seasonality shows one long line, not five panels | `Year` isn't discrete, or the pill order is wrong. Both **Year** and **Month** must be blue and in the order Year, then Month. |
| Peak/low labels show on every point | The label field is `Peak or Low Label`; check the `ELSE ""` branch and that **Marks to Label** is **All**. |
| A label shows "Null" instead of nothing | The calculation lacks `ELSE ""`. Edit it so the last branch returns an empty string. |
| Prices show as `$2.9` | Use the **Price Text** field on the label, not **Price**. |
| Panel 2 shows one shared axis | The second and third measures were dropped on the existing axis. Remove them and drop each in the empty area **beside** the existing row so a new pane appears. |
| `CORR` is "invalid" or "not supported" | The source is live. Click the **Extract** radio button on the Data Source page (**Extract → Edit…**) and save the extract, then recreate the tiles. |
| The state ranges move when you click a year | The band fields aren't the `FIXED` calculations; use **Min/Max Price All Months**, not plain MIN/MAX of **Price**. |
| The U.S. dot isn't rust | **Is US** must be on **Color**, with **True** assigned `#B5471B`. |
| Clicking a year does nothing | Action source must be **Seasonality** and the target **State Prices**, filtering on the field **Year**. |
| Percent values show as `0.0%` | The numbers are already percentages, so use the custom format `0.0"%"`, not Tableau's Percentage format. |
| Dashboard looks squashed on the website | Keep Fixed 1200 × 1060 and test the embed at your site's content width. |
