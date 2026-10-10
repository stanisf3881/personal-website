# Build guide: "Who Rules the Track?" Olympic medals dashboard

This guide walks through building a one-page Tableau Public dashboard of 120 years of Olympic track & field medals, from opening the CSV to publishing. Plan on 2–3 hours the first time.

**What you'll end up with (1200 × 1000 px):**

```
┌──────────────────────────────────────────────────────────────────┐
│ WHO RULES THE TRACK?                                             │
│ 120 years of Olympic track & field medals, 1896–2016             │
│ [Sex ▾]  [Year ●────────●]  [Event group ▾]  [Top N ▾]  ■G ■S ■B │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│ 3,003 medals │  99 nations  │  83 events   │  29 Games           │  ← KPI tiles
├──────────────┴──────────────┬──────────────┴─────────────────────┤
│ MEDAL TABLE                 │ MEDALS PER GAMES                   │
│ United States ███████ 816   │  ▂▃▅▃▄▅▄▄  ▄▄▅  ▅▅▅▆▆▆▆▇▇▇▇▇▇▇▇    │
│ Great Britain ██ 212        │  (click a nation to filter)        │
│ Soviet Union  ██ 193  …     │                                    │
├─────────────────────────────┴────────────────────────────────────┤
│ EVENT SPECIALTIES: share of each nation's medals by event group  │
│              Sprints  Middle  Distance  Hurdles  Relays  Jumps … │
│ Kenya           2%     27%      41%      27%      2%      0%     │
│ Jamaica        63%      3%       0%       9%     24%      1%     │
├──────────────────────────────────────────────────────────────────┤
│ Source and notes                                                 │
└──────────────────────────────────────────────────────────────────┘
```

It answers three questions:

- **Who has won the most?** The medal table.
- **When did they win?** The medals-per-Games chart, which shows the world-war gaps and the 1980/1984 boycotts.
- **What is each nation good at?** The specialty heatmap: Kenya in distance running, Jamaica in sprints, the U.S. in jumps.

---

## Part 0 — Before you start

1. Install **Tableau Public** (the free desktop app) from <https://public.tableau.com/app/discover> → *Create* → *Download the app*. Sign in, or create a free account.
   - The browser editor (*Create* → *Web Authoring*) can do almost everything here. The desktop app has more formatting control, so this guide uses it.
2. Download the data file **`projects/data/olympic_athletics_medals.csv`** from this repo. On GitHub: open the file → *Download raw file*. Save it somewhere permanent, such as `Documents/Tableau/`.

**What's in the file:** 3,003 rows, one per medal a country won in an event. A relay counts as **one** medal for the country, not four.

| Column | Example | Meaning |
|---|---|---|
| `noc` | USA | 3-letter Olympic country code |
| `country` | United States | Clean country name (use this one for labels) |
| `team` | New York Athletic Club | Raw team name; early Games list clubs. **Don't use it.** |
| `year` | 1984 | Year of the Games |
| `city` | Los Angeles | Host city |
| `event` | Men's 100 metres | Specific event |
| `event_group` | Sprints | One of 10 groups: Sprints, Middle distance, Distance, Hurdles & steeplechase, Relays, Jumps, Throws, Combined events, Race walk, Other |
| `sex` | M / F | Men's or women's event |
| `medal` | Gold / Silver / Bronze | Medal won |
| `medal_rank` | 1 / 2 / 3 | Used only to sort medals in Gold → Silver → Bronze order |

**Color palette for the whole dashboard.** Keep this handy; you'll type these hex codes several times.

| Use | Hex |
|---|---|
| Gold | `#B08A1E` |
| Silver | `#7F90AD` |
| Bronze | `#985528` |
| Main text | `#1F2A24` |
| Secondary text (labels, notes) | `#5F6B65` |
| Dashboard background | `#F5F6F4` |
| Card / sheet background | `#FFFFFF` |

The three medal colors are checked to stay distinguishable for people with color-vision deficiency.

---

## Part 1 — Connect and prepare the data

### Step 1.1 Connect to the CSV
1. Open Tableau Public. On the start page's left **Connect** pane, under **To a File**, click **Text file**.
2. Select `olympic_athletics_medals.csv` → **Open**. The **Data Source** page opens with a preview grid.
3. At the top left, click the data source name (`olympic_athletics_medals`) and rename it **Olympic Medals**.

### Step 1.2 Check data types
Look at the small icon above each column in the preview grid:
- `year`, `medal_rank` should show **#** (number). All other columns should show **Abc** (string).
- If any is wrong, click the icon and choose the correct type.

### Step 1.3 Go to a worksheet and tidy the fields
1. Click **Sheet 1** at the bottom left.
2. The **Data** pane on the left lists the fields. Tableau usually converts names like `event_group` to **Event Group** automatically. If not, right-click each field → **Rename**: `Noc`→**NOC**, `country`→**Country**, `event_group`→**Event Group**, and so on.
3. Right-click **Team** → **Hide**. It's the messy club-name field.
4. **Make Year a continuous dimension.** Tableau puts `Year` under measures because it's a number.
   - Right-click **Year** → **Convert to Dimension**. It moves up and turns blue.
   - Right-click **Year** again → **Convert to Continuous**. It turns green.
   - This gives a proper time axis with real gaps for the cancelled 1916, 1940 and 1944 Games.
5. **Give Sex readable names.** Right-click **Sex** → **Aliases…** → set `F` = **Women**, `M` = **Men** → **OK**.

### Step 1.4 Create calculated fields
For each one: menu **Analysis → Create Calculated Field…**, type the name, paste the formula, click **OK**.

| Name | Formula | Why |
|---|---|---|
| **Medals** | `1` | One per row; `SUM(Medals)` = medal count. It works the same in every Tableau version. |
| **Gold Medals** | `IF [Medal] = "Gold" THEN 1 ELSE 0 END` | For tooltips |
| **Silver Medals** | `IF [Medal] = "Silver" THEN 1 ELSE 0 END` | For tooltips |
| **Bronze Medals** | `IF [Medal] = "Bronze" THEN 1 ELSE 0 END` | For tooltips |
| **Nations** | `COUNTD([Country])` | KPI tile |
| **Events** | `COUNTD([Event])` | KPI tile |
| **Games** | `COUNTD([Year])` | KPI tile |

Then set number formats. Right-click **Medals** → **Default Properties → Number Format… → Number (Custom)**, set **Decimal places 0**, and leave **Include thousands separators** on. Do the same for the other six fields.

### Step 1.5 Create the "Top N" parameter
This lets viewers choose how many nations to show.
1. In the Data pane, click the **▾** arrow at the top (next to the search box) → **Create Parameter…**
2. Fill in:
   - **Name:** `Top N Nations`
   - **Data type:** Integer
   - **Current value:** `20`
   - **Allowable values:** **Range**, with Minimum `5`, Maximum `30`, Step size `5`
3. **OK**. It appears under **Parameters** at the bottom of the Data pane.

> ✅ **Checkpoint:** Drag **Medals** onto the **Text** box of the Marks card. The view shows **3,003**. Press **Ctrl+Z** (Mac: **⌘Z**) to undo.

---

## Part 2 — Sheet 1: Medal Table (stacked bar)

1. Double-click the **Sheet 1** tab and rename it **Medal Table**.
2. Drag **Country** to **Rows**.
3. Drag **Medals** to **Columns**. It becomes `SUM(Medals)`.
4. Drag **Medal** onto **Color** on the Marks card. Each bar splits into three colored segments.

### 2a Sort the bars (most medals at the top)
- Click the **Country** pill on Rows → **Sort…** → **Sort By: Field**, **Sort Order: Descending**, **Field Name: Medals**, **Aggregation: Sum** → close.

### 2b Order the medal segments Gold → Silver → Bronze
- On the Marks card, click the **Medal** pill (on Color) → **Sort…** → **Sort By: Field**, **Ascending**, **Field Name: Medal Rank**, **Aggregation: Minimum**.
- Gold should now be the segment next to the country name. If Bronze ends up there instead, switch to **Descending**.

### 2c Apply the medal colors
1. Click **Color** on the Marks card → **Edit Colors…**
2. Double-click **Gold** in the left list. A color picker opens. Enter `#B08A1E` (Windows: in the *HTML* box; Mac: the hex field in the color-slider tab).
3. Repeat for **Silver** `#7F90AD` and **Bronze** `#985528`. Click **OK**.
4. Click **Color** again → **Border** → choose **white**. This puts a thin gap between segments.

### 2d Limit to the Top N nations
1. Drag **Country** to the **Filters** shelf. A dialog opens.
2. Click the **Top** tab → choose **By field:**
   - **Top**, then in the number box choose **Top N Nations** (the parameter) from the drop-down.
   - **by** `Medals`, **Sum**.
3. **OK**. You should see 20 bars.

### 2e Add the total at the end of each bar
1. Right-click the bottom axis → **Add Reference Line**.
2. Set:
   - **Scope:** **Per Cell**
   - **Value:** `SUM(Medals)`, aggregation **Total**
   - **Label:** **Value**
   - **Line:** **None**
   - **Tooltip:** **None**
3. **OK**. Each bar now ends with its total (816, 212, …).
4. If the labels sit on top of the bars: right-click a label → **Format…** → align **Right**.

### 2f Clean up
- **Hide the axis:** right-click the bottom axis → uncheck **Show Header**. The totals replace it.
- **Hide the "Country" header label:** right-click the word **Country** above the names → **Hide Field Labels for Rows**.
- **Remove grid lines:** **Format → Lines…** → on the **Rows** and **Columns** tabs, set **Grid Lines** to **None**.
- **Bar thickness:** click **Size** on the Marks card and drag the slider to about 70%.
- **Tooltip:** click **Tooltip** on the Marks card. Delete everything and type the text below, using **Insert ▸** to add each field:

  ```
  <Country>
  <SUM(Medals)> medals in this view
  Gold <SUM(Gold Medals)>  ·  Silver <SUM(Silver Medals)>  ·  Bronze <SUM(Bronze Medals)>
  ```
  Make the first line bold.
  - The Gold/Silver/Bronze fields must be on the view to appear in **Insert**. Drag **Gold Medals**, **Silver Medals** and **Bronze Medals** onto **Tooltip** on the Marks card first.
  - Because each bar segment is one medal color, the tooltip shows only that segment's medal.
  - To show all three counts on every segment, edit each tooltip pill: right-click → **Edit in Shelf**, then wrap it in `{FIXED [Country] : SUM([Gold Medals])}`, and the same for Silver and Bronze.
- **Title:** double-click the sheet title → replace it with **MEDAL TABLE**. Set Tableau Book **11pt bold**, color `#1F2A24`.

> ✅ **Checkpoint:** The top bar is **United States, 816** (Gold 344, Silver 262, Bronze 210). The next ones are Great Britain 212, Soviet Union 193, Finland 116 and Germany 112.

---

## Part 3 — Sheet 2: Medals per Games (stacked column over time)

1. Click the **New Worksheet** icon at the bottom (the small + tab) and rename the sheet **Medals per Games**.
2. Drag **Year** (green, continuous) to **Columns**.
3. Drag **Medals** to **Rows**.
4. On the Marks card, change the drop-down from *Automatic* to **Bar**.
5. Drag **Medal** to **Color**. The colors you set in Part 2 carry over automatically.
6. Sort Medal by **Medal Rank** as in step 2b, so Gold sits at the bottom of each column.
7. **Color → Border → white.** Then set **Size** to about 60% so the columns are slim, with gaps between them.

### 3a Format the year axis
1. Right-click the Year axis → **Edit Axis…**
   - **Range: Fixed**, Start `1892`, End `2020`
   - **Tick Marks** tab → **Major Tick Marks: Fixed**, Tick origin `1900`, Tick interval `20`
   - Clear the **Axis Title** field
2. Right-click the Year axis → **Format…** → **Scale → Numbers → Number (Custom)** → Decimal places `0`, **uncheck** *Include thousands separators*. Without this you'd see "1,900".

### 3b Format the medal axis
- Right-click the left axis → **Edit Axis…** → title: `Medals`.
- **Format → Lines…** → Rows tab: grid lines a thin light gray. Columns tab: grid lines **None**.

### 3c Tooltip and title
- **Tooltip:**
  ```
  <Year>
  <Medal>: <SUM(Medals)>
  ```
- **Title:** **MEDALS PER GAMES**. Then press Enter and add a second line in 9pt `#5F6B65`: *All nations. Click a nation in the medal table to see its history.*

> ✅ **Checkpoint:** 1896 shows 35 medals and 2012 shows 143. There are clear **gaps at 1916, 1940 and 1944** (Games cancelled by the world wars). A 1906 bar appears: those were the "Intercalated Games", which are in the dataset.

---

## Part 4 — Sheet 3: Event Specialties (heatmap)

This sheet shows each nation's **mix** of medals, not just raw counts. With raw counts the U.S. would make every other row look pale.

1. New worksheet → rename **Event Specialties**.
2. Drag **Event Group** to **Columns** and **Country** to **Rows**.
3. Marks drop-down → **Square**.
4. Drag **Medals** to **Color**. Then click the pill → **Quick Table Calculation → Percent of Total**.
5. Click the same pill → **Compute Using → Event Group**. Each row now adds to 100% across the event groups.
6. Drag **Medals** to **Label**. This shows the raw medal count in each square.

### 4a Same Top N nations, same order as the medal table
1. Sort Country: **Country** pill → **Sort… → Field → Descending → Medals → Sum**.
2. On the **Medal Table** sheet, right-click the **Country** filter on the Filters shelf → **Apply to Worksheets → Selected Worksheets…** → tick **Medal Table** and **Event Specialties** → **OK**.

### 4b Order the event-group columns logically
- Click **Event Group** on Columns → **Sort… → Sort By: Manual**.
- Arrange them in this order: **Sprints, Middle distance, Distance, Hurdles & steeplechase, Relays, Jumps, Throws, Combined events, Race walk, Other**. This runs from short races to long ones, then field events.

### 4c Colors and borders
1. **Color → Edit Colors…** → **Palette: Blue** (a single-hue sequential palette).
   - Tick **Use Full Color Range** off.
   - **Advanced ▸ Start:** `0`, **End:** `1`, so 0% and 100% mean the same thing in every row.
2. **Color → Border → white** to get a grid of separate tiles.
3. Labels: on the **Label** card, choose **Font** `#1F2A24` 8pt. Tableau automatically flips text to white on dark tiles. If it doesn't, set the label color manually to a mid gray.

### 4d Tooltip and title
- **Tooltip:**
  ```
  <Country> · <Event Group>
  <SUM(Medals)> medals = <% of Total Medals> of its total
  ```
- **Title:** **EVENT SPECIALTIES**, with the second line *Share of each nation's medals by event group. Darker means more specialised.*
- Hide field labels for rows and columns, as in 2f. Rotate the column headers if they're cramped: right-click a header → **Rotate Label**.

> ✅ **Checkpoint:** **Kenya** is dark in **Distance** (38 medals), **Middle distance** (25) and **Hurdles & steeplechase** (25, the steeplechase). **Jamaica** is darkest in **Sprints** (47) and **Relays** (18). With Top N = 20, **Ethiopia** (rank 16) appears almost entirely in **Distance** (50 of 53).

---

## Part 5 — Sheets 4–7: KPI tiles

Make four tiny sheets. Here's the first, **KPI Medals**:
1. New worksheet → rename **KPI Medals**.
2. Drag **Medals** onto **Text** on the Marks card.
3. Click **Text** → the **…** button to edit the text. Replace it with:
   ```
   <SUM(Medals)>
   MEDALS
   ```
   - Line 1: Tableau Bold, **28pt**, `#1F2A24`.
   - Line 2: **9pt**, `#5F6B65`.
   - Both centered.
4. **Format → Shading** → Worksheet background **white**. Hide the title: right-click the title → **Hide Title**.

Repeat for the other three:

| Sheet | Field on Text | Line 2 |
|---|---|---|
| KPI Nations | `AGG(Nations)` | NATIONS WITH A MEDAL |
| KPI Events | `AGG(Events)` | EVENTS |
| KPI Games | `AGG(Games)` | OLYMPIC GAMES |

Shortcut: right-click the **KPI Medals** tab → **Duplicate**, then swap the field and the text.

> ✅ **Checkpoint:** The tiles show 3,003 / 99 / 83 / 29.

---

## Part 6 — Global filters

Do this on the **Medal Table** sheet.

### 6a Sex filter
1. Drag **Sex** to Filters → **All** values ticked → **OK**.
2. Right-click the **Sex** filter pill → **Apply to Worksheets → All Using This Data Source**.
3. Right-click it again → **Add to Context**. It turns gray.
   - Tableau normally picks the Top N *before* applying ordinary filters. Making these filters "context" filters means the Top 20 is recalculated for, say, women only.

### 6b Year filter
1. Drag **Year** to Filters → **Range of values** → **OK**.
2. Apply to **All Using This Data Source**, then **Add to Context**.

### 6c Event Group filter
1. Drag **Event Group** to Filters → **All** → **OK**.
2. Apply to **All Using This Data Source**, then **Add to Context**.

### 6d Show the controls
Right-click each of the three filter pills → **Show Filter**. Then right-click **Top N Nations** under Parameters → **Show Parameter**. You'll arrange the controls on the dashboard in Part 7.

> ✅ **Checkpoint:** Set Sex = **Women**. The Medals tile becomes **921**, and the medal table reads United States 130, Soviet Union 84, East Germany 67, Russia 57, Great Britain 53. Reset Sex to **All**.

---

## Part 7 — Assemble the dashboard

### 7a Create and size it
1. Click the **New Dashboard** icon at the bottom (the grid icon with a +). Rename the tab **Who Rules the Track**.
2. In the left **Dashboard** pane → **Size**: **Fixed size**, **Custom**, **1200 × 1000** px.
3. **Dashboard → Format…** → **Dashboard Shading: Default** → `#F5F6F4`. Set **Dashboard Title** font to Tableau Bold 22pt `#1F2A24`.

### 7b Build the layout with containers
Containers keep everything aligned. Check that **Tiled** (not Floating) is selected at the bottom of the Objects pane.

1. From **Objects**, drag a **Vertical** container onto the empty canvas. It's the page's outer frame.
2. **Header:** drag a **Text** object into the top of the container. Type:
   - Line 1: **WHO RULES THE TRACK?** in 22pt bold, `#1F2A24`.
   - Line 2: *120 years of Olympic track & field medals, 1896–2016* in 11pt, `#5F6B65`.
3. **Controls row:** drag a **Horizontal** container under the header.
   - From the right-hand side of the canvas, where Tableau auto-placed the filters and legends, drag into it: **Sex**, **Year**, **Event Group**, **Top N Nations**, and the **Medal** color legend.
   - For each one: click its **▾** menu → change Sex to **Single Value (dropdown)**, Event Group to **Multiple Values (dropdown)**, and keep Year as a slider.
   - On the Medal legend: **▾ → Arrange Items → Single Row**, and hide its title (**▾ → Hide Title**).
4. **KPI row:** drag another **Horizontal** container below the controls. Drag **KPI Medals, KPI Nations, KPI Events, KPI Games** into it, side by side. Then select the container (the gray handle at the top) → **▾ → Distribute Contents Evenly**.
5. **Main row:** drag another **Horizontal** container below. Drag **Medal Table** into the left half and **Medals per Games** into the right. Drag the divider so they split about **45 / 55**.
6. **Heatmap:** drag **Event Specialties** below the main row, at full width. Keep its color legend: drag it to the heatmap's right edge, or into the controls row.
7. **Footer:** drag a **Text** object to the bottom. Type in 8pt `#5F6B65`:
   > Source: 120 Years of Olympic History (sports-reference.com via Kaggle / TidyTuesday). Athletics only, Summer Games 1896–2016, including the 1906 Intercalated Games. Relay and team events count as one medal per nation. Gaps: no Games in 1916/1940/1944; the U.S. boycotted Moscow 1980; the Soviet Union and East Germany boycotted Los Angeles 1984. Built by Franklyn A. Stanislaus.
8. Delete anything left over on the right side. Most filters and legends were moved; delete the unused heatmap legend if you placed it elsewhere.

### 7c Make it look like cards
For each sheet and the KPI row:
1. Select it → **Layout** pane (top left, next to *Dashboard*).
2. **Background:** white. **Outer padding:** 8 on all sides. **Inner padding:** 12.
3. Leave **Border** at None. The white card on the light-gray page provides the separation.

Set the height of each row by dragging the edges. Roughly:
- header 80 px
- controls 60 px
- KPI 90 px
- main row 400 px
- heatmap 290 px
- footer 50 px

### 7d Interactivity — dashboard actions
Menu **Dashboard → Actions… → Add Action ▸**

**Action 1: Filter**
- **Name:** `Select nation`
- **Source sheets:** **Medal Table** only. **Run action on:** **Select**.
- **Target sheets:** **Medals per Games**, **KPI Medals**, **KPI Events**, **KPI Games**.
  - Leave KPI Nations unticked, so it always shows the number of nations.
- **Clearing the selection will:** **Show all values**.
- **Filter:** **Selected Fields** → **Country**.
- **OK**.

**Action 2: Highlight**
- **Name:** `Highlight nation`
- **Source:** **Medal Table**. **Run on:** **Select**.
- **Target:** **Event Specialties**.
- **Targeted highlighting:** **Selected Fields → Country**.
- **OK**.

> ✅ **Checkpoint (click tests):**
> - Click **United States**. Medals per Games shows a **gap at 1980** (the boycott) and its tallest bar at **1904** (65 medals, home Games in St. Louis). The KPIs change to that nation. The heatmap highlights the U.S. row.
> - Click **Kenya**. Its bars start in **1964**.
> - Click **Soviet Union**. There's **no 1984** bar.
> - Click the selected bar again to clear the selection.
> - Drag Year to **1992–2016**. The top five become U.S. 177, Russia 77, Kenya 69, Jamaica 56, Ethiopia 43.

### 7e Phone layout (recommended)
1. In the Dashboard pane → **Device Preview** → **Add Phone Layout**.
2. Tableau stacks the items vertically. In the Phone layout:
   - remove the heatmap (too wide), or set it to *Fit Width* and let it scroll
   - check that the controls wrap

---

## Part 8 — Final polish checklist

Go through each item before publishing:

- [ ] **Fonts:** **Format → Workbook…** → set all fonts to **Tableau Book**, then bold only the titles.
- [ ] Every sheet title is in UPPERCASE 11pt bold, so they all match.
- [ ] No leftover grid lines, zero lines or axis rulers you didn't mean to keep. Check **Format → Lines** and **Format → Borders** on each sheet.
- [ ] Numbers use thousands separators (3,003) and years don't (1984).
- [ ] Tooltips are written as plain sentences. None shows the default "SUM(Medals): 816".
- [ ] Hover over every chart once, and click every control once.
- [ ] The legend for the medal colors is visible.
- [ ] **Worksheet tabs:** hide them from viewers by right-clicking each worksheet tab → **Hide**. Hide only the sheets, not the dashboard.

---

## Part 9 — Publish to Tableau Public

1. **File → Save to Tableau Public As…** Sign in if asked.
2. Name it **Who Rules the Track - Olympic Athletics Medals** → **Save**. The browser opens your published viz.
3. On the viz page, click **Edit Details**, the pencil next to the title.
   - **Description:** *Interactive dashboard of every Olympic track & field medal from 1896 to 2016 (3,003 medals, 99 nations). Explore which countries dominate, how medal hauls changed across the Games, and each nation's event specialties. Data: sports-reference.com via Kaggle/TidyTuesday.*
   - Add a few **tags**: `Olympics`, `Athletics`, `Track and Field`, `Sports`, `Dashboard`.
4. Click the **gear (Settings)** icon:
   - Turn **Show Viz on Profile** on.
   - Optionally turn **Allow access** on, so others can download the workbook.
5. Click **Share** → copy the link.

Send me that link and I'll add it to the `TABLEAU_VIZZES` list in `index.html`, where your other three dashboards are embedded.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Years show as "1,984" | Step 3a, part 2: number format with thousands separators off |
| Year shows as `SUM(Year)` and the bars stack into one | Year is still a measure. Redo step 1.3, item 4 |
| Top 20 doesn't change when filtering to Women | The Sex/Year/Event Group filters aren't in context (they should be gray). Right-click → **Add to Context** |
| Heatmap rows don't add to 100% | The table calculation is computing on the wrong field. Pill → **Compute Using → Event Group** |
| Medal colors reset to default | Colors belong to the data source. Edit them once (2c) on any sheet and every sheet updates |
| Clicking a bar empties every chart | Action 1 is targeting too many sheets. Re-open **Dashboard → Actions** and untick Event Specialties and KPI Nations |
| Dashboard looks squashed on the website | Keep Fixed 1200 × 1000 and add the phone layout (7e) |
