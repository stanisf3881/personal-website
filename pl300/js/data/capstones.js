// Three guided capstones, beginner to advanced, all finance and accounting.
// Checkpoint answers were computed from the exact CSV files in /data (fixed random seed).
// num: numeric answer, tol: allowed difference; text: accepted answers (lowercase).

const money = (v) => ({ num: v, tol: Math.max(1, Math.abs(v) * 0.00005) });
const pct = (v) => ({ num: v, tol: 0.15 });
const count = (v) => ({ num: v, tol: 0 });

export const CAPSTONES = [
{
  id: "c1", level: "Beginner", title: "Harbor Street Bakery: your first P&L",
  unlockDay: 7,
  story: "Harbor Street Bakery's owner kept a year of bookkeeping in a messy export from their point-of-sale and bank feeds. You'll clean it, build a small star schema, write your first DAX measures, and give the owner a one-page profit and loss report.",
  skills: ["P1.1","P2.1","P2.2","P3.1","M1.1","M1.3","M1.4","M2.1","M2.2","V1.1","V1.4","V1.5","V1.6","V2.5","V2.12","S1.3"],
  zip: "data/capstone1.zip",
  files: [["data/capstone1/bakery_transactions_2025.csv", "One row per transaction for 2025, with duplicates, voided rows and inconsistent text"], ["data/capstone1/chart_of_accounts.csv", "12 accounts with their type: Revenue, Cost of Goods Sold, Operating Expense"]],
  steps: [
    { title: "Connect to both files", skills: ["P1.1"], html: `<p>In Power BI Desktop: <strong>Home &gt; Get data &gt; Text/CSV</strong>, pick <code>bakery_transactions_2025.csv</code>, then click <strong>Transform Data</strong> (not Load). Do the same for <code>chart_of_accounts.csv</code>.</p><p>In Power Query, rename the queries (right-click &gt; Rename) to <strong>Transactions</strong> and <strong>Accounts</strong>. Short names make DAX easier to read later.</p>`, hint: "If you clicked Load by mistake, open Home > Transform data to get back to Power Query." },
    { title: "Profile the raw data", skills: ["P2.1"], html: `<p>Select Transactions. On the <strong>View</strong> tab, tick Column quality, Column distribution and Column profile.</p><p>Look at the bottom-left status bar: it says profiling is based on the top 1,000 rows. Click it and choose <strong>Column profiling based on entire data set</strong>. Click the TxnID column; the profile shows Count.</p><p>Notice: Amount has some empty values, PaymentMethod has many spellings, Payee has trailing spaces.</p>`, checkpoint: "c1-raw" },
    { title: "Set data types", skills: ["P3.1"], html: `<p>Set types deliberately (click the icon left of each column header):</p><ul><li>TxnDate: <strong>Date</strong></li><li>AccountCode: <strong>Text</strong> in both queries (it's a code, not a quantity)</li><li>Amount: <strong>Fixed decimal number</strong> (the currency type)</li></ul><p>If Power Query asks to replace the current Changed Type step, choose Replace.</p>`, hint: "Types must match on both sides of a relationship. Text-to-text is the safest for codes." },
    { title: "Clean the text columns", skills: ["P2.2"], html: `<ol><li>Select Payee and PaymentMethod, then <strong>Transform &gt; Format &gt; Trim</strong>.</li><li>Select PaymentMethod, then <strong>Format &gt; Capitalize Each Word</strong>. "CASH", "cash" and "Cash" become one value.</li><li>Right-click PaymentMethod &gt; <strong>Replace Values</strong>: replace <code>N/A</code> with <code>Unknown</code>.</li></ol><p>Check the column distribution: how many distinct payment methods are there now?</p>`, checkpoint: "c1-methods" },
    { title: "Remove voided and duplicate rows", skills: ["P2.2"], html: `<ol><li>Open the Amount filter arrow and choose <strong>Remove Empty</strong>. These are voided transactions.</li><li>Select every column (Ctrl+A on the headers), then <strong>Home &gt; Remove Rows &gt; Remove Duplicates</strong>.</li></ol><p>Read the row count in the column profile again.</p>`, checkpoint: "c1-rows" },
    { title: "Load and relate the tables", skills: ["M1.3"], html: `<p><strong>Home &gt; Close &amp; Apply</strong>. In <strong>Model view</strong>, drag Accounts[AccountCode] onto Transactions[AccountCode]. Confirm the dialog shows <strong>One to many (1:*)</strong> from Accounts to Transactions and cross-filter direction <strong>Single</strong>.</p>`, hint: "If Power BI suggests many-to-many, a duplicate exists in Accounts or the types don't match." },
    { title: "Build and mark a date table", skills: ["M1.4", "M1.1"], html: `<p>First turn off <strong>File &gt; Options &gt; Current file &gt; Data load &gt; Auto date/time</strong>.</p><p>Then <strong>Modeling &gt; New table</strong>:</p><pre>Date = CALENDAR( DATE(2025, 1, 1), DATE(2025, 12, 31) )</pre><p>Add columns with <strong>New column</strong>:</p><pre>Month = FORMAT( 'Date'[Date], "MMM" )
MonthNumber = MONTH( 'Date'[Date] )
Quarter = "Q" &amp; QUARTER( 'Date'[Date] )</pre><p>Select Month, then <strong>Column tools &gt; Sort by column &gt; MonthNumber</strong>. Select the table, then <strong>Table tools &gt; Mark as date table</strong> using Date[Date]. Finally relate Date[Date] to Transactions[TxnDate] (one-to-many).</p>` },
    { title: "Write your first measures", skills: ["M2.1", "M2.2"], html: `<p>Select the Transactions table, then <strong>New measure</strong> for each line:</p><pre>Total Amount = SUM( Transactions[Amount] )
Revenue = CALCULATE( [Total Amount], Accounts[AccountType] = "Revenue" )
COGS = CALCULATE( [Total Amount], Accounts[AccountType] = "Cost of Goods Sold" )
Operating Expenses = CALCULATE( [Total Amount], Accounts[AccountType] = "Operating Expense" )
Gross Profit = [Revenue] - [COGS]
Gross Margin % = DIVIDE( [Gross Profit], [Revenue] )
Net Income = [Gross Profit] - [Operating Expenses]</pre><p>Format Gross Margin % as a percentage (Measure tools). Put each measure on a <strong>card</strong> and set the card's display units to <strong>None</strong> so you can read the exact value.</p><p>CALCULATE takes the total and changes the filter to one account type. That's the single most important DAX idea on the exam.</p>`, checkpoint: ["c1-revenue", "c1-gm", "c1-ni"] },
    { title: "Build the overview page", skills: ["V1.1", "V1.6"], html: `<ul><li>Three cards: Revenue, Net Income, Gross Margin %.</li><li>Line chart: Revenue by Date[Month].</li><li>Clustered bar chart: Operating Expenses by Accounts[AccountName].</li><li>A slicer on Date[Quarter], tile style.</li></ul><p>Use the slicer to select Q3 and read Net Income.</p>`, checkpoint: "c1-niq3" },
    { title: "Find the most expensive month", skills: ["V2.5", "V1.5"], html: `<p>Add a column chart of Operating Expenses by Date[Month]. Use <strong>More options (…) &gt; Sort axis &gt; Operating Expenses</strong>, descending. Then add a matrix with Accounts[AccountType] and Accounts[AccountName] on rows and Total Amount as values, and add <strong>data bars</strong> through conditional formatting.</p>`, checkpoint: "c1-month" },
    { title: "Theme, titles and accessibility", skills: ["V1.4", "V2.12"], html: `<p><strong>View &gt; Themes</strong>: pick a theme, then <strong>Customize current theme</strong> to set one brand color. Give every visual a plain-language title ("Revenue by month" instead of "Sum of Amount by Month"). Add <strong>alt text</strong> in each visual's General &gt; Alt text. Open the Selection pane &gt; Tab order and order visuals top-left to bottom-right.</p>` },
    { title: "Save and publish", skills: ["S1.3"], html: `<p>Save as <code>HarborStreetBakery.pbix</code>. If you have a Power BI account, <strong>Home &gt; Publish</strong> to My workspace and open it in the browser. If not, the .pbix is your deliverable.</p><p>Then ask the AI tutor: <em>"Review my bakery measures"</em> and paste your DAX.</p>` },
  ],
  checkpoints: [
    { id: "c1-raw", q: "How many rows does the raw transactions file have (before cleaning)?", ...count(638) },
    { id: "c1-methods", q: "After trimming, fixing case and replacing N/A, how many distinct payment methods are there?", ...count(4) },
    { id: "c1-rows", q: "After removing empty amounts and duplicates, how many rows remain?", ...count(615) },
    { id: "c1-revenue", q: "Total Revenue for 2025?", ...money(389431.68) },
    { id: "c1-gm", q: "Gross Margin % for 2025 (one decimal, e.g. 41.2)?", ...pct(73.5) },
    { id: "c1-ni", q: "Net Income for 2025?", ...money(18752.68) },
    { id: "c1-niq3", q: "Net Income for Q3 2025?", ...money(2083.63) },
    { id: "c1-month", q: "Which month had the highest operating expenses? (three-letter month)", text: ["sep", "september", "9"] },
  ],
},
{
  id: "c2", level: "Intermediate", title: "Northwind Office Supply: receivables, budget and collections",
  unlockDay: 14,
  story: "Northwind's CFO wants one report for the credit team and the leadership meeting: revenue against budget by region, what's still owed and how late it is, and which customers drive late payment. The budget arrives as a wide spreadsheet and invoices carry three different dates.",
  skills: ["P2.1","P3.2","P3.4","P3.6","P3.7","P3.8","P3.9","P3.10","M1.2","M1.3","M1.4","M1.5","M2.1","M2.3","M2.4","M2.6","M2.7","M3.2","V1.5","V2.1","V2.2","V2.3","V2.6","V2.8","V3.3","V3.4","S1.4","S1.6"],
  zip: "data/capstone2.zip",
  files: [["data/capstone2/invoices.csv", "3,805 invoices for 2024–2025 with invoice, due and paid dates (extract taken 28 Feb 2026)"], ["data/capstone2/customers.csv", "180 customers with region, segment and payment terms"], ["data/capstone2/budget_2025_wide.csv", "2025 revenue budget: one row per region, one column per month"]],
  steps: [
    { title: "Connect and type the data", skills: ["P3.1"], html: `<p>Get data &gt; Text/CSV for all three files, then Transform Data. Rename queries to <strong>Invoices</strong>, <strong>Customers</strong> and <strong>BudgetWide</strong>.</p><p>In Invoices set InvoiceDate, DueDate and PaidDate to <strong>Date</strong> and Amount to <strong>Fixed decimal number</strong>. PaidDate is empty for unpaid invoices; those cells should become <code>null</code>. If any show Error instead, use <strong>Transform &gt; Replace Errors</strong> with <code>null</code>.</p>` },
    { title: "Check the customer key", skills: ["P2.1", "P3.9"], html: `<p>Turn on column distribution and profiling on the entire data set. In Customers, CustomerID must have <strong>180 distinct and 180 unique</strong> values for it to be the 'one' side of a relationship.</p>` },
    { title: "Find orphan invoices", skills: ["P3.7", "P3.8", "P3.10"], html: `<p>Right-click Invoices &gt; <strong>Reference</strong>. Rename the new query <strong>Orphan Invoices</strong>. <strong>Home &gt; Merge Queries</strong>: match CustomerID to Customers[CustomerID] with join kind <strong>Left Anti</strong>. The rows left are invoices for customers who aren't in the customer list.</p><p>These still count as revenue (they were billed), so keep them in Invoices. Right-click Orphan Invoices and clear <strong>Enable load</strong>: it's a review list for accounts receivable, not part of the model.</p>`, checkpoint: "c2-orphans" },
    { title: "Unpivot the budget", skills: ["P3.4", "P3.2"], html: `<p>In BudgetWide, select Region, then <strong>Transform &gt; Unpivot Columns &gt; Unpivot Other Columns</strong>. Rename Attribute to <strong>MonthName</strong> and Value to <strong>BudgetAmount</strong> (Fixed decimal).</p><p>Add a <strong>Custom column</strong> named MonthStart with this M formula:</p><pre>#date(2025, List.PositionOf({"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"}, [MonthName]) + 1, 1)</pre><p>Set its type to Date. Rename the query <strong>Budget</strong>.</p>`, checkpoint: "c2-budgetrows" },
    { title: "Create a Region dimension", skills: ["P3.6", "P3.7"], html: `<p>Budget is by region, invoices are by customer. To filter both with one slicer, build a shared dimension: right-click Customers &gt; <strong>Reference</strong>, keep only Region (Remove Other Columns), then <strong>Remove Duplicates</strong>. Rename it <strong>Regions</strong>. Close &amp; Apply.</p>` },
    { title: "Date table and relationships", skills: ["M1.4", "M1.2", "M1.3"], html: `<p>Turn off Auto date/time. New table:</p><pre>Date =
ADDCOLUMNS(
    CALENDAR( DATE(2024, 1, 1), DATE(2026, 12, 31) ),
    "Year", YEAR( [Date] ),
    "MonthNumber", MONTH( [Date] ),
    "Month", FORMAT( [Date], "MMM" ),
    "YearMonth", FORMAT( [Date], "YYYY-MM" )
)</pre><p>Sort Month by MonthNumber, then Mark as date table. In Model view create:</p><ul><li>Customers[CustomerID] 1:* Invoices[CustomerID]</li><li>Regions[Region] 1:* Customers[Region] and Regions[Region] 1:* Budget[Region]</li><li>Date[Date] 1:* Invoices[InvoiceDate] (<strong>active</strong>)</li><li>Date[Date] 1:* Invoices[DueDate] and Date[Date] 1:* Invoices[PaidDate] (these become <strong>inactive</strong>, shown dashed)</li><li>Date[Date] 1:* Budget[MonthStart]</li></ul><p>Date is a <strong>role-playing dimension</strong>: one table, three roles.</p>` },
    { title: "Revenue, budget and time intelligence", skills: ["M2.1", "M2.3"], html: `<pre>Revenue = SUM( Invoices[Amount] )
Revenue YTD = TOTALYTD( [Revenue], 'Date'[Date] )
Revenue PY = CALCULATE( [Revenue], SAMEPERIODLASTYEAR( 'Date'[Date] ) )
Revenue YoY % = DIVIDE( [Revenue] - [Revenue PY], [Revenue PY] )
Budget = SUM( Budget[BudgetAmount] )
Variance = [Revenue] - [Budget]
Variance % = DIVIDE( [Variance], [Budget] )</pre><p>Build a matrix with Date[Year] and Date[Month] on rows and these measures as values. Add a Regions[Region] slicer to read the West numbers.</p>`, checkpoint: ["c2-rev25", "c2-ytdjun", "c2-yoy", "c2-westvar"] },
    { title: "Use the inactive due-date relationship", skills: ["M1.2"], html: `<pre>Amount Due = CALCULATE( [Revenue], USERELATIONSHIP( Invoices[DueDate], 'Date'[Date] ) )</pre><p>Put Amount Due next to Revenue by month. Revenue is grouped by invoice month; Amount Due is grouped by the month payment was due.</p>`, checkpoint: "c2-duemar" },
    { title: "Receivables as of any date", skills: ["M2.2", "M2.7", "M1.5"], html: `<p>A measure that answers "how much was owed at the end of the selected period":</p><pre>AR Outstanding =
VAR AsOf = MAX( 'Date'[Date] )
RETURN
    CALCULATE(
        SUM( Invoices[Amount] ),
        REMOVEFILTERS( 'Date' ),
        Invoices[InvoiceDate] &lt;= AsOf,
        ISBLANK( Invoices[PaidDate] ) || Invoices[PaidDate] &gt; AsOf
    )</pre><p>Then two <strong>calculated columns</strong> on Invoices for an aging snapshot at year end (columns, because you'll slice by bucket):</p><pre>Days Past Due 2025 =
VAR AsOf = DATE(2025, 12, 31)
RETURN
    IF(
        Invoices[InvoiceDate] &lt;= AsOf
            &amp;&amp; ( ISBLANK( Invoices[PaidDate] ) || Invoices[PaidDate] &gt; AsOf ),
        INT( AsOf - Invoices[DueDate] )
    )

Aging Bucket 2025 =
VAR d = Invoices[Days Past Due 2025]
RETURN
    SWITCH( TRUE(),
        ISBLANK( d ), "Not outstanding",
        d &lt;= 0, "Current",
        d &lt;= 30, "1-30",
        d &lt;= 60, "31-60",
        d &lt;= 90, "61-90",
        "90+" )</pre><p>Read AR Outstanding with the Date filtered to December 2025. Count invoices in the 61-90 and 90+ buckets together.</p>`, checkpoint: ["c2-ar", "c2-over60"] },
    { title: "Statistics and a quick measure", skills: ["M2.4", "M2.6"], html: `<pre>Median Invoice = MEDIAN( Invoices[Amount] )
Paid Late % =
DIVIDE(
    COUNTROWS( FILTER( Invoices, NOT ISBLANK( Invoices[PaidDate] ) &amp;&amp; Invoices[PaidDate] &gt; Invoices[DueDate] ) ),
    COUNTROWS( FILTER( Invoices, NOT ISBLANK( Invoices[PaidDate] ) ) )
)</pre><p>Then right-click Invoices &gt; <strong>New quick measure &gt; Running total</strong> of Revenue by Date[Date]. Read the DAX it wrote and compare it with TOTALYTD.</p>`, checkpoint: ["c2-median", "c2-late"] },
    { title: "Overview page with synced slicers", skills: ["V1.5", "V2.6", "V3.4"], html: `<ul><li>KPI visual: Revenue with Budget as target.</li><li>Line chart: Revenue and Revenue PY by Date[Month]. On a separate line chart using Date[Date] (continuous axis), add a <strong>forecast</strong> from the Analytics pane.</li><li>Matrix: Regions[Region] by Month with Variance %. Conditional formatting icons: red below 0, green above.</li><li>Slicer on Date[Year]. Open <strong>View &gt; Sync slicers</strong> and sync it to every page, visible only on this one.</li></ul>` },
    { title: "Drillthrough and tooltip pages", skills: ["V2.8", "V2.2"], html: `<p>New page <strong>Customer Detail</strong>: drag Customers[CustomerName] into the <strong>Drill through</strong> well. Add a table of InvoiceID, InvoiceDate, DueDate, PaidDate, Amount, Aging Bucket 2025. Power BI adds a back button.</p><p>New page <strong>Customer Tip</strong>: Page information &gt; <strong>Allow use as tooltip</strong>; canvas size Tooltip. Add cards for Segment, PaymentTerms and Paid Late %. On the overview's region matrix set Tooltips &gt; Type = Report page &gt; Customer Tip.</p>` },
    { title: "Bookmarks, interactions and AI visuals", skills: ["V2.1", "V2.3", "V3.3"], html: `<ul><li>Add a calculated column <code>Paid Late = IF( NOT ISBLANK( Invoices[PaidDate] ) &amp;&amp; Invoices[PaidDate] &gt; Invoices[DueDate], "Yes", "No" )</code>.</li><li>New page <strong>Why late?</strong>: a <strong>Key influencers</strong> visual analyzing Paid Late, explained by Customers[Segment], Customers[PaymentTerms], Customers[Region].</li><li>A <strong>Decomposition tree</strong> of AR Outstanding by Region &gt; Segment &gt; CustomerName.</li><li>Two bookmarks (Chart view / Table view) with the Data option <em>off</em>, and two buttons to switch.</li><li>Format &gt; Edit interactions: stop the Region matrix from filtering the KPI.</li></ul>` },
    { title: "Performance check, publish and alert", skills: ["M3.2", "S1.3", "S1.4", "S1.6"], html: `<p><strong>Optimize &gt; Performance analyzer</strong>: Start recording, Refresh visuals. Copy the slowest visual's query into <strong>DAX query view</strong> and run it.</p><p>Publish. In the service, pin the AR Outstanding card to a new dashboard named <em>Credit Desk</em>, then on the tile choose <strong>Manage alerts</strong> and alert above 1,000,000. Subscribe yourself to the overview page weekly.</p><p>Finally, ask the AI tutor to review your AR Outstanding measure.</p>` },
  ],
  checkpoints: [
    { id: "c2-orphans", q: "How many orphan invoices does the Left Anti merge return?", ...count(7) },
    { id: "c2-budgetrows", q: "How many rows does Budget have after unpivoting?", ...count(48) },
    { id: "c2-rev25", q: "Revenue for 2025 (all invoices, including orphans)?", ...money(10293059.71) },
    { id: "c2-ytdjun", q: "Revenue YTD at the end of June 2025?", ...money(4815981.57) },
    { id: "c2-yoy", q: "Revenue YoY % for 2025 (one decimal)?", ...pct(16.4) },
    { id: "c2-westvar", q: "Variance (Revenue − Budget) for the West region in 2025?", ...money(81368.70) },
    { id: "c2-duemar", q: "Amount Due in March 2025 (by due date)?", ...money(841698.42) },
    { id: "c2-ar", q: "AR Outstanding as of 31 December 2025?", ...money(1157800.46) },
    { id: "c2-over60", q: "How many invoices were more than 60 days past due on 31 December 2025?", ...count(25) },
    { id: "c2-median", q: "Median invoice amount for 2025?", ...money(2551.68) },
    { id: "c2-late", q: "Paid Late % for invoices issued in 2025 (one decimal)?", ...pct(25.7) },
  ],
},
{
  id: "c3", level: "Advanced", title: "Tailwind Group: multi-currency consolidation",
  unlockDay: 21,
  story: "Tailwind Group has four subsidiaries in four currencies. The group CFO needs a consolidated P&L and cash position in USD, entity controllers must only see their own company, and the solution must be published, secured, refreshed and distributed like a real enterprise deployment.",
  skills: ["P1.2","P1.4","P3.2","P3.5","P3.8","P3.9","P3.10","M1.1","M1.3","M1.4","M2.2","M2.3","M2.5","M2.8","M3.1","M3.2","V1.3","V1.4","V1.9","V1.10","V1.11","V2.4","V2.10","V2.12","S1.1","S1.2","S1.7","S1.8","S1.9","S2.1","S2.4","S2.5","S2.6"],
  zip: "data/capstone3.zip",
  files: [["data/capstone3/gl/gl_entries_2024.csv", "General ledger lines for 2024, local currency, debit/credit"], ["data/capstone3/gl/gl_entries_2025.csv", "General ledger lines for 2025"], ["data/capstone3/entities.json", "Four entities with currency, controller email and a nested address"], ["data/capstone3/accounts.csv", "Chart of accounts with group and normal balance"], ["data/capstone3/departments.csv", "Departments"], ["data/capstone3/fx_rates_monthly.csv", "Monthly average rate to USD per currency"], ["data/capstone3/cash_balances_daily.csv", "Closing bank balance per account per business day"]],
  steps: [
    { title: "Parameterize the GL folder", skills: ["P1.4", "P3.8"], html: `<p>Keep the two GL files together in a folder named <code>gl</code>. In Power Query: <strong>Home &gt; Manage Parameters &gt; New</strong>: name <code>GLFolderPath</code>, type Text, current value = the full path to that folder.</p><p><strong>Get data &gt; Folder</strong>, then <strong>Combine &amp; Transform</strong>. Open the resulting query's Source step and replace the hard-coded path with <code>GLFolderPath</code>, so it reads <code>Folder.Files(GLFolderPath)</code>. Remove the Source.Name column. Rename the query <strong>GL</strong>.</p><p>Moving to SharePoint later? Change one parameter. Folder combining is an append of every file in the folder.</p>`, checkpoint: "c3-rows" },
    { title: "Types and a YearMonth key", skills: ["P3.1", "P3.2"], html: `<p>PostingDate: Date. Debit, Credit: Fixed decimal. IDs: Text. Add a custom column <strong>YearMonth</strong>:</p><pre>Date.ToText([PostingDate], "yyyy-MM")</pre><p>This matches the format of fx_rates_monthly.csv's YearMonth column, so they can be merged.</p>` },
    { title: "Flatten the entities JSON", skills: ["P3.5"], html: `<p><strong>Get data &gt; JSON</strong> &gt; entities.json. It opens as a List: <strong>To Table</strong>, then expand Column1 (untick 'Use original column name as prefix'). Expand the <strong>address</strong> record into City and Region. Rename the query <strong>Entities</strong>.</p>` },
    { title: "Bring in currency and FX with a two-column merge", skills: ["P3.8", "P3.9"], html: `<p>Load accounts.csv, departments.csv and fx_rates_monthly.csv (rename to <strong>Accounts</strong>, <strong>Departments</strong>, <strong>FX</strong>; make YearMonth Text in FX).</p><ol><li>In GL: Merge with Entities on EntityID (Left outer), expand only <strong>Currency</strong>.</li><li>Merge GL with FX on <strong>two columns</strong>: Ctrl-click YearMonth then Currency in GL, and YearMonth then Currency in FX, in the same order. Expand <strong>RateToUSD</strong>.</li><li>Merge GL with Accounts on AccountID, expand <strong>NormalBalance</strong>.</li></ol>` },
    { title: "Signed local and USD amounts", skills: ["P3.2", "M3.1", "P3.10"], html: `<p>Add custom columns (Fixed decimal):</p><pre>AmountLocal = if [NormalBalance] = "Credit" then [Credit] - [Debit] else [Debit] - [Credit]
AmountUSD = [AmountLocal] * [RateToUSD]</pre><p>Revenue accounts have credit normal balances, so revenue comes out positive; costs come out positive as costs. Now remove columns the model doesn't need: Debit, Credit, RateToUSD, NormalBalance, Currency, YearMonth. Right-click FX and clear <strong>Enable load</strong>; it was a helper.</p>` },
    { title: "Star schema and date table", skills: ["M1.3", "M1.4", "M1.1"], html: `<p>Close &amp; Apply. Date table:</p><pre>Date =
ADDCOLUMNS(
    CALENDAR( DATE(2024, 1, 1), DATE(2025, 12, 31) ),
    "Year", YEAR( [Date] ),
    "Quarter", "Q" &amp; QUARTER( [Date] ),
    "MonthNumber", MONTH( [Date] ),
    "Month", FORMAT( [Date], "MMM" )
)</pre><p>Mark it as a date table and sort Month by MonthNumber. Relate Date, Accounts, Entities and Departments to GL, all one-to-many, single direction. Hide every key column in GL. Put measures in a display folder named P&amp;L.</p>` },
    { title: "Consolidated P&L measures", skills: ["M2.1", "M2.2"], html: `<pre>Revenue USD = CALCULATE( SUM( GL[AmountUSD] ), Accounts[AccountGroup] = "Revenue" )
Revenue Local = CALCULATE( SUM( GL[AmountLocal] ), Accounts[AccountGroup] = "Revenue" )
Net Income USD =
SUMX( GL, GL[AmountUSD] * IF( RELATED( Accounts[NormalBalance] ) = "Credit", 1, -1 ) )</pre><p>Revenue Local only makes sense when one entity is selected; adding pounds to pesos is meaningless. Consider wrapping it in <code>IF( HASONEVALUE( Entities[EntityID] ), … )</code>.</p>`, checkpoint: ["c3-rev", "c3-uk", "c3-ni"] },
    { title: "Semi-additive cash position", skills: ["M2.5"], html: `<p>Load cash_balances_daily.csv as <strong>Cash</strong>. In Power Query, merge with Entities for Currency, add <code>YearMonth = Date.ToText([BalanceDate], "yyyy-MM")</code>, merge with FX on YearMonth + Currency, and add <code>BalanceUSD = [ClosingBalanceLocal] * [RateToUSD]</code>. Relate Date[Date] 1:* Cash[BalanceDate] and Entities 1:* Cash.</p><pre>Cash Balance USD =
CALCULATE(
    SUM( Cash[BalanceUSD] ),
    LASTNONBLANK( 'Date'[Date], CALCULATE( SUM( Cash[BalanceUSD] ) ) )
)
Cash Balance Local =
CALCULATE(
    SUM( Cash[ClosingBalanceLocal] ),
    LASTNONBLANK( 'Date'[Date], CALCULATE( SUM( Cash[ClosingBalanceLocal] ) ) )
)</pre><p>Compare with a plain <code>SUM( Cash[BalanceUSD] )</code> for December 2025: it adds up every business day and gives a number around 22 times too big. That's why balances are semi-additive.</p>`, checkpoint: ["c3-cash", "c3-ca"] },
    { title: "Time calculation group", skills: ["M2.8", "M2.3"], html: `<p>In <strong>Model view &gt; Calculation group</strong>, create <strong>Time Calc</strong> with a column named Period and these items:</p><pre>Current = SELECTEDMEASURE()
MTD = CALCULATE( SELECTEDMEASURE(), DATESMTD( 'Date'[Date] ) )
QTD = CALCULATE( SELECTEDMEASURE(), DATESQTD( 'Date'[Date] ) )
YTD = CALCULATE( SELECTEDMEASURE(), DATESYTD( 'Date'[Date] ) )
PY  = CALCULATE( SELECTEDMEASURE(), SAMEPERIODLASTYEAR( 'Date'[Date] ) )</pre><p>Put Time Calc[Period] on matrix columns and Revenue USD in values. Every measure now has five versions without writing new measures. Notice implicit measures are now discouraged.</p>`, checkpoint: ["c3-ytdsep", "c3-py"] },
    { title: "Visual calculations", skills: ["V1.11"], html: `<p>On a matrix of Revenue USD by Date[Year] and Date[Month], choose <strong>New visual calculation</strong>:</p><pre>Running Revenue = RUNNINGSUM( [Revenue USD] )
MoM % = DIVIDE( [Revenue USD] - PREVIOUS( [Revenue USD] ), PREVIOUS( [Revenue USD] ) )</pre><p>These live only on this visual: no model measure needed.</p>` },
    { title: "Board-quality report pages", skills: ["V1.4", "V1.9", "V2.4", "V1.3"], html: `<ul><li><strong>Group P&amp;L</strong>: matrix of AccountGroup &gt; AccountName by Entity with Net Income USD; a <strong>waterfall</strong> of Net Income USD by AccountGroup.</li><li><strong>Cash</strong>: line chart of Cash Balance USD by month per entity; card of the latest group balance.</li><li><strong>Entity view</strong>: Revenue Local and Cash Balance Local with an entity slicer.</li><li>Import a custom JSON theme (or customize one) with Tailwind colors.</li><li>Add a <strong>page navigator</strong> on every page.</li><li>If your tenant has Copilot, add a <strong>narrative visual</strong> to Group P&amp;L. If not, describe in one sentence what you'd ask it to summarize.</li></ul>` },
    { title: "Mobile layout and accessibility", skills: ["V2.10", "V2.12"], html: `<p><strong>View &gt; Mobile layout</strong> for Group P&amp;L: cards first, then the waterfall. Add alt text everywhere, set tab order, check that the waterfall's increase/decrease colors also differ in lightness, and add data labels so color isn't the only cue.</p>` },
    { title: "Find and fix slow spots", skills: ["M3.2", "M3.1"], html: `<p>Run Performance Analyzer on Group P&amp;L. In <strong>DAX query view</strong> run:</p><pre>EVALUATE
SUMMARIZECOLUMNS(
    Entities[EntityID],
    'Date'[Year],
    "Revenue USD", [Revenue USD],
    "Net Income USD", [Net Income USD]
)</pre><p>Confirm JournalID isn't used anywhere. If not, remove it in Power Query: it's unique per row, so it's the most expensive column in the model.</p>` },
    { title: "Row-level security for controllers", skills: ["S2.4"], html: `<p><strong>Modeling &gt; Manage roles</strong>: role <strong>Entity Controller</strong> with this filter on Entities:</p><pre>[ControllerEmail] = USERPRINCIPALNAME()</pre><p>Add role <strong>Group Finance</strong> with no filter. Test with <strong>View as</strong> &gt; tick Other user, enter <code>controller.mx@tailwind-demo.com</code>, and tick Entity Controller. Read Revenue USD for 2025.</p>`, checkpoint: "c3-rls" },
    { title: "Workspace, publish and governance", skills: ["S1.1", "S1.3", "S2.1", "S1.7", "S2.6"], html: `<p>Create a workspace <strong>Tailwind Group Finance</strong> and publish. Plan roles: you as Admin, a second analyst as Contributor, nobody in the controller group as Member or Contributor (RLS wouldn't apply to them).</p><p>Mark the semantic model as <strong>Promoted</strong>. Apply a sensitivity label such as Confidential if your tenant has labels.</p>` },
    { title: "Refresh, gateway and parameter in the service", skills: ["S1.8", "S1.9", "P1.2"], html: `<p>Your files are on a local drive, so scheduled refresh would need an <strong>on-premises data gateway</strong>. Two options: install a gateway, or move the files to OneDrive for Business or SharePoint Online (cloud, no gateway), change GLFolderPath and the other sources, and set credentials in the semantic model settings.</p><p>Set a daily scheduled refresh. Note in your own words: why can't you choose 48 refreshes a day on Pro?</p>` },
    { title: "App with two audiences", skills: ["S1.2", "S2.5"], html: `<p>Create the app: audience <strong>Group Leadership</strong> sees every page; audience <strong>Entity Controllers</strong> sees Entity view and Cash. In the semantic model's <strong>Security</strong> page, add a security group (or test users) to Entity Controller. Publish the app; remember to <strong>Update app</strong> after every change.</p>` },
    { title: "Board pack decision and final review", skills: ["V1.10"], html: `<p>The board wants a 30-page PDF of every GL line by account each quarter. Write three sentences on why that's a <strong>paginated report</strong> (Power BI Report Builder) rather than this interactive report. Optional: build it in Report Builder against your published model.</p><p>Finally, open the AI tutor and choose <em>Review a capstone</em>. Paste your measures and RLS filter for a senior-analyst review.</p>` },
  ],
  checkpoints: [
    { id: "c3-rows", q: "How many rows does the combined GL query have (both years)?", ...count(3072) },
    { id: "c3-rev", q: "Consolidated Revenue USD for 2025?", ...money(3851643.91) },
    { id: "c3-uk", q: "UK01 Revenue Local (GBP) for 2025?", ...money(615023.99) },
    { id: "c3-ni", q: "Consolidated Net Income USD for 2025?", ...money(507914.11) },
    { id: "c3-cash", q: "Group Cash Balance USD on 31 December 2025?", ...money(4870197.61) },
    { id: "c3-ca", q: "CA01 Cash Balance Local (CAD) at the end of June 2025?", ...money(771016.47) },
    { id: "c3-ytdsep", q: "Revenue USD YTD through September 2025 (Time Calc = YTD)?", ...money(2828238.97) },
    { id: "c3-py", q: "Revenue USD for 2025 with Time Calc = PY (that is, 2024's revenue)?", ...money(3519328.83) },
    { id: "c3-rls", q: "Viewing as controller.mx@tailwind-demo.com, what is Revenue USD for 2025?", ...money(778941.56) },
  ],
},
];
