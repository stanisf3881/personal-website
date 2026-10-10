// Built-in primers. They assume the learner knows nothing yet and work without an AI key.
// The AI tutor goes deeper on any single skill from the Learn page.

export const LESSON_ZERO = {
  id: "L0",
  title: "Lesson zero: set up your study kit",
  minutes: 60,
  html: `
<p>Before any exam topic, get the tools working. Everything in the capstones happens in two places: <strong>Power BI Desktop</strong> (a free Windows app where you build reports) and the <strong>Power BI service</strong> (the website at app.powerbi.com where reports are published and shared).</p>

<h3>1. Install Power BI Desktop (Windows)</h3>
<ol>
  <li>On your Windows PC, open the <strong>Microsoft Store</strong> and search for <em>Power BI Desktop</em>. Install it. The Store version updates itself every month, which matters because the exam tests current features.</li>
  <li>If you can't use the Store, download it from <a href="https://www.microsoft.com/power-platform/products/power-bi/desktop" target="_blank" rel="noopener">the Power BI Desktop page</a>.</li>
  <li>Open it once. If it asks you to sign in, you can skip for now; Desktop works offline for building reports.</li>
</ol>

<h3>2. If you're on a Mac</h3>
<p>Power BI Desktop does not run on macOS. Your options, best first:</p>
<ul>
  <li>Use any Windows PC you have access to (work, school, library).</li>
  <li>Run Windows 11 in a virtual machine (Parallels Desktop on Apple Silicon is the common route), then install Desktop inside it.</li>
  <li>Use a cloud PC such as Windows 365 or Azure Virtual Desktop if your employer or school provides one.</li>
  <li>As a last resort, build in the Power BI service in a browser. You can create reports and some semantic models on the web, but Power Query and modeling are more limited, so the capstones will feel harder.</li>
</ul>

<h3>3. Get a Power BI service account</h3>
<p>The service needs a <strong>work or school email</strong>; personal addresses such as Gmail or Outlook.com are not accepted for sign-up. If you don't have one:</p>
<ul>
  <li>Ask your employer or school whether you already have Power BI.</li>
  <li>Join the <a href="https://developer.microsoft.com/microsoft-365/dev-program" target="_blank" rel="noopener">Microsoft 365 Developer Program</a> if you qualify for a sandbox tenant, or start a Microsoft Fabric / Power BI Pro trial from inside a work tenant.</li>
  <li>If none of this works, you can still pass: do every Desktop step in the capstones and study the service steps from the lessons and the Microsoft Learn sandbox modules.</li>
</ul>

<h3>4. Download the capstone data</h3>
<p>Each capstone has its own CSV files on the Capstones page. Save them in one folder, for example <code>Documents\\PL300\\</code>. Keep file names unchanged; the steps refer to them.</p>

<h3>5. Turn on the AI tutor</h3>
<p>Open <strong>Settings</strong> in this site, choose a provider, and paste your API key. The key is stored only in this browser and is sent only to the provider you pick. Without a key, everything still works except the chat tutor and AI-generated questions.</p>

<h3>6. Take the diagnostic</h3>
<p>The diagnostic is 24 questions across all four exam areas. Don't study first; the point is to find your starting line so practice and the tutor can aim at your weak spots.</p>

<h3>Words you'll see everywhere</h3>
<dl>
  <dt>Power Query</dt><dd>The tool inside Power BI for getting and cleaning data before it's loaded. Think of it as the "prep kitchen". It writes a language called M for you.</dd>
  <dt>Semantic model</dt><dd>The loaded tables, the relationships between them, and the calculations. Older material calls this a "dataset".</dd>
  <dt>DAX</dt><dd>Data Analysis Expressions, the formula language for calculations in the model. It looks like Excel formulas but works on whole tables and columns.</dd>
  <dt>Report</dt><dd>Pages of visuals (charts, tables, cards) built on a semantic model.</dd>
  <dt>Workspace</dt><dd>A shared folder in the service that holds reports, semantic models and dashboards for a team.</dd>
</dl>`
};

export const PRIMERS = {
P1: `
<p><strong>In plain words.</strong> Before you can analyze anything, Power BI has to reach the data. "Get data" lists hundreds of connectors: files (Excel, CSV, PDF), databases (SQL Server), online services (SharePoint, Salesforce), Microsoft Fabric items, and existing Power BI semantic models that someone else already built.</p>
<p><strong>The three storage modes</strong> decide where the data lives when someone looks at a report:</p>
<ul>
  <li><strong>Import</strong> copies the data into the model. Fastest visuals, full DAX and Power Query features, but data is only as fresh as the last refresh and it's limited by model size.</li>
  <li><strong>DirectQuery</strong> leaves data at the source and sends a query every time a visual loads. Near real-time, works with very large data, but slower and some transformations aren't allowed.</li>
  <li><strong>Direct Lake</strong> reads Delta tables in a Microsoft Fabric lakehouse or warehouse (OneLake) straight into memory. Import-like speed without a scheduled copy. It only applies to Fabric data.</li>
</ul>
<p><strong>Shared semantic model.</strong> Connecting to a published model (Get data, then Power BI semantic models) creates a <em>live connection</em>: you reuse someone's tables and measures instead of rebuilding them. You need <em>Build</em> permission on that model.</p>
<p><strong>Credentials and privacy levels.</strong> In Data source settings you change the sign-in for a source or point it to a new location. Privacy levels (Private, Organizational, Public, or None) control whether Power Query may send data from one source to another while combining them. Wrong levels cause "Formula.Firewall" errors.</p>
<p><strong>Parameters</strong> (Home, Manage parameters) are named values such as a folder path, server name, or start date. Change the parameter once and every query that uses it updates, which is how you switch from a test server to production.</p>
<p><strong>Finance example.</strong> Your month-end trial balance sits in a SQL database the size of millions of rows and finance wants today's postings: DirectQuery. Your budget lives in one Excel file updated quarterly: Import.</p>
<p><strong>Exam traps.</strong> "Must reflect source changes immediately" points to DirectQuery (or Direct Lake for Fabric). "Best performance" or "needs complex Power Query transformations" points to Import. A question that says "reuse the certified model the finance team already published" wants a live connection to a shared semantic model, not a new import.</p>`,

P2: `
<p><strong>In plain words.</strong> Profiling means looking at your data's health before trusting it. In Power Query, the View tab has three checkboxes:</p>
<ul>
  <li><strong>Column quality</strong>: percentage of Valid, Error and Empty values per column.</li>
  <li><strong>Column distribution</strong>: how many <em>distinct</em> values (different values) and <em>unique</em> values (appear exactly once).</li>
  <li><strong>Column profile</strong>: statistics (min, max, average, count, nulls) and a value distribution chart for one column.</li>
</ul>
<p>By default profiling looks at the <strong>first 1,000 rows only</strong>. Click the status bar text at the bottom of Power Query to switch to "Column profiling based on entire data set". This is a classic exam question.</p>
<p><strong>Fixing problems.</strong> Replace values (for example "N/A" with null), Trim and Clean text (removes extra spaces and hidden characters), change Case so "acme" and "ACME" match, Fill down for blanks under a header, Remove duplicates, and Remove blank rows.</p>
<p><strong>Errors.</strong> An error usually means a value couldn't convert, like the text "TBD" in a number column. You can Remove errors, Replace errors with a value, or use Keep errors to see only the bad rows and investigate.</p>
<p><strong>Finance example.</strong> A general ledger export has amounts like "1,250.00 " with a trailing space and some "(300.00)" negatives. Trim first, replace the parentheses format, then change the type to Fixed decimal number.</p>
<p><strong>Exam traps.</strong> Distinct versus unique: a column with values A, A, B has 2 distinct and 1 unique. If a key column must be unique for a relationship, distinct count must equal row count.</p>`,

P3: `
<p><strong>In plain words.</strong> Transforming means reshaping data into tables that are easy to analyze. Each click in Power Query adds an "applied step" you can reorder or undo.</p>
<ul>
  <li><strong>Data types</strong>: set them deliberately. Money is best as <em>Fixed decimal number</em> (avoids rounding errors). IDs that you never add up can stay as text or whole number.</li>
  <li><strong>Columns</strong>: Column from examples, Conditional column, Custom column (M formula), Split column, Merge columns, Extract.</li>
  <li><strong>Group by</strong>: collapses rows, for example total sales per customer per month.</li>
  <li><strong>Unpivot</strong> turns column headers into rows. A budget with Jan, Feb, Mar columns becomes Month and Amount columns. <strong>Pivot</strong> does the opposite. <strong>Transpose</strong> flips rows and columns.</li>
  <li><strong>Semi-structured data</strong> (JSON, XML, nested lists or records): expand the record or list columns until you get a flat table.</li>
  <li><strong>Merge</strong> = join two queries side by side on a matching key (like VLOOKUP). Join kinds: Left outer, Right outer, Full outer, Inner, Left anti (rows only in the first), Right anti. <strong>Append</strong> = stack queries with the same columns on top of each other (January file + February file).</li>
  <li><strong>Reference vs Duplicate</strong>: Reference starts a new query from the <em>result</em> of another, so changes upstream flow through. Duplicate copies all the steps into an independent query.</li>
  <li><strong>Enable load</strong>: right-click a query and turn it off for staging or helper queries so they don't appear in the model.</li>
</ul>
<p><strong>Fact and dimension tables (star schema).</strong> Facts record events with numbers: invoice lines, journal entries. Dimensions describe the who, what, when: Customer, Account, Date. Each dimension has one row per key; the fact holds that key many times. This shape is what Power BI is built for.</p>
<p><strong>Exam traps.</strong> "Unpivot other columns" is the safer choice when new month columns may appear later. Choose Left anti to find invoices with no matching customer. Choose Append, not Merge, to combine monthly files with identical columns.</p>`,

M1: `
<p><strong>In plain words.</strong> The data model is your tables plus the relationships that let filters flow from one table to another. A filter on Customer[Region] = "West" only reaches Sales if a relationship connects them.</p>
<ul>
  <li><strong>Cardinality</strong>: one-to-many (one customer, many invoices) is the normal case. One-to-one is rare. Many-to-many is used when neither side has unique keys, such as a budget at month-and-region level against a Date table at day level.</li>
  <li><strong>Cross-filter direction</strong>: Single means filters flow from the "one" side to the "many" side. Both lets filters flow back too; it's sometimes needed but can cause ambiguity and slowness, so use it only when required.</li>
  <li><strong>Active vs inactive</strong>: only one active path can exist between two tables. Extra relationships are inactive (dashed line) and are switched on inside a measure with <code>USERELATIONSHIP</code>.</li>
  <li><strong>Role-playing dimension</strong>: one dimension used in several roles, like Date as Invoice Date, Due Date and Paid Date. Either one Date table with one active and two inactive relationships, or separate copies of the Date table, one per role.</li>
  <li><strong>Date table</strong>: one row per day, no gaps, covering whole years. Build it with <code>CALENDAR</code> or <code>CALENDARAUTO</code> in DAX or in Power Query, then <em>Mark as date table</em>. Turn off Auto date/time in options to avoid hidden tables.</li>
  <li><strong>Table and column properties</strong>: rename, hide keys, set data category (City, Country, Web URL), format strings, Sort by column (sort month names by month number), default summarization, display folders, synonyms for Q&amp;A.</li>
</ul>
<p><strong>Calculated column vs measure.</strong> A calculated column is computed for every row at refresh and stored, so it costs memory; use it when you need to slice, filter, or build a relationship with the value. A measure is computed when a visual asks, using the filters on screen; use it for totals and ratios.</p>
<p><strong>Exam traps.</strong> Month names sorting alphabetically: fix with Sort by column. Filters not reaching a table: check direction and whether the relationship is active.</p>`,

M2: `
<p><strong>In plain words.</strong> DAX measures answer questions like "what's total revenue?" and recalculate for whatever is filtered: a year, a region, one customer. That set of filters is called the <strong>filter context</strong>.</p>
<ul>
  <li><strong>Single aggregations</strong>: <code>Total Revenue = SUM(Sales[Amount])</code>. Also AVERAGE, MIN, MAX, COUNT, COUNTROWS, DISTINCTCOUNT.</li>
  <li><strong>Iterators</strong> such as SUMX go row by row: <code>SUMX(Sales, Sales[Qty] * Sales[Price])</code>.</li>
  <li><strong>CALCULATE</strong> changes the filter context: <code>West Revenue = CALCULATE([Total Revenue], Customer[Region] = "West")</code>. <code>ALL</code> or <code>REMOVEFILTERS</code> inside CALCULATE remove filters, which is how you get "% of total".</li>
  <li><strong>Time intelligence</strong> needs a marked date table: <code>TOTALYTD</code>, <code>DATESYTD</code>, <code>SAMEPERIODLASTYEAR</code>, <code>DATEADD</code>, <code>PARALLELPERIOD</code>, <code>DATESMTD</code>, <code>DATESQTD</code>.</li>
  <li><strong>Statistics</strong>: AVERAGE, MEDIAN, STDEV.P / STDEV.S, PERCENTILE.INC, COUNTROWS, DISTINCTCOUNT, RANKX.</li>
  <li><strong>Semi-additive</strong> measures add up across some dimensions but not time. A bank balance for March is the balance on 31 March, not the sum of every day. Use <code>CALCULATE(SUM(Balances[Amount]), LASTDATE('Date'[Date]))</code>, <code>LASTNONBLANK</code>, or <code>CLOSINGBALANCEMONTH</code>.</li>
  <li><strong>Quick measures</strong>: a menu that writes common DAX for you (running total, year-over-year change, weighted average). Good for learning the pattern.</li>
  <li><strong>Calculation groups</strong>: one set of items like MTD, QTD, YTD, PY applied to <em>any</em> measure through <code>SELECTEDMEASURE()</code>, instead of writing three versions of every measure. Created in Model view. Creating one turns on "discourage implicit measures".</li>
</ul>
<p><strong>Finance example.</strong> Gross margin % = <code>DIVIDE([Revenue] - [COGS], [Revenue])</code>. Use DIVIDE instead of "/" so a zero revenue returns blank instead of an error.</p>
<p><strong>Exam traps.</strong> SUM of a balance across months is wrong (semi-additive). Time intelligence returning blanks usually means the date table isn't marked or has gaps.</p>`,

M3: `
<p><strong>In plain words.</strong> Smaller models are faster models. Import mode compresses each column, and columns with many distinct values (timestamps, free-text comments, GUIDs) compress badly.</p>
<ul>
  <li><strong>Remove what you don't use</strong>: unused columns and rows outside the reporting period, before they're loaded.</li>
  <li><strong>Reduce granularity</strong>: if reports only show daily or monthly totals, Group by date instead of keeping every transaction; split a datetime into a date column and (if needed) a time column rounded to the hour.</li>
  <li><strong>Performance Analyzer</strong> (Optimize tab in Desktop): Start recording, refresh visuals, and see each visual's time split into DAX query, Visual display, and Other. A slow DAX query means fix the measure or model; slow visual display means too many data points or a heavy custom visual.</li>
  <li><strong>DAX query view</strong>: copy a visual's query from Performance Analyzer, run it with <code>EVALUATE</code>, and test a faster version of the measure.</li>
</ul>
<p><strong>Exam traps.</strong> "Other" time is usually waiting for other visuals, not a problem with the visual itself. Bidirectional relationships and many-to-many relationships are a frequent cause of slowness.</p>`,

V1: `
<p><strong>In plain words.</strong> A report should answer a question at a glance. Pick the visual by the question:</p>
<ul>
  <li>Trend over time: line chart. Compare categories: bar or column chart. Part of a whole: stacked bar or a donut with few slices. Single number: card. Progress to target: KPI or gauge. Relationship between two measures: scatter chart. How a starting value becomes an ending value: waterfall (perfect for a P&amp;L bridge). Details: table or matrix.</li>
  <li><strong>Formatting</strong>: titles, data labels, axes, colors in the Format pane. A <strong>theme</strong> (View, Themes) sets colors and fonts for the whole report; you can customize it or import a JSON theme file.</li>
  <li><strong>Conditional formatting</strong>: background, font color, data bars, icons or web URL, driven by rules, a color scale, or a field value.</li>
  <li><strong>Filtering</strong>: slicers on the page, and the Filters pane at visual, page and report level. Top N and relative date filters are common.</li>
  <li><strong>Page settings</strong>: canvas size (16:9, 4:3, Letter, custom), background, wallpaper, page visibility.</li>
  <li><strong>Copilot</strong>: can create a new report page from a prompt, suggest content for a page, and write a narrative visual that summarizes the page in words. It needs a Fabric capacity (or Premium) and the tenant setting turned on.</li>
  <li><strong>Visual calculations</strong>: DAX written on a single visual (New calculation) using what's on that visual, with functions like <code>RUNNINGSUM</code>, <code>MOVINGAVERAGE</code>, <code>PREVIOUS</code>, <code>FIRST</code>. Simpler than model measures for running totals and comparisons within one chart.</li>
  <li><strong>Paginated reports</strong> (built in Power BI Report Builder, .rdl files) are pixel-perfect, print-ready documents that can run to many pages, like invoices, statements, or a 40-page general ledger detail. Interactive reports are for exploring.</li>
</ul>
<p><strong>Exam traps.</strong> "Must print every row across multiple pages" or "exact layout for PDF" means a paginated report.</p>`,

V2: `
<p><strong>In plain words.</strong> Usability features turn a page of charts into a guided story.</p>
<ul>
  <li><strong>Bookmarks</strong> capture the state of a page (filters, slicer selections, which visuals are visible). Each bookmark can save Data, Display and Current page separately. Pair them with buttons to build toggles like "Chart view / Table view".</li>
  <li><strong>Selection pane</strong>: show, hide, group and reorder layers; also sets the keyboard tab order.</li>
  <li><strong>Custom tooltips</strong>: create a page, turn on "Allow use as tooltip" and set canvas to Tooltip size, then on a visual set Tooltip type to Report page.</li>
  <li><strong>Edit interactions</strong>: choose whether selecting a point in one visual filters, highlights, or does nothing to each other visual.</li>
  <li><strong>Navigation</strong>: buttons with Page navigation or Bookmark actions; the page navigator and bookmark navigator build menus automatically.</li>
  <li><strong>Drillthrough</strong>: a detail page with a drillthrough field (for example Customer). Right-click a customer anywhere and jump to that page filtered to them. "Keep all filters" carries other filters along. A back button is added automatically.</li>
  <li><strong>Sync slicers</strong> (View, Sync slicers) make one slicer apply across pages, and choose on which pages it's visible.</li>
  <li><strong>Sorting</strong>: by any field in the visual, ascending or descending; Sort by column fixes month order.</li>
  <li><strong>Export settings</strong>: control whether users can export summarized data, underlying data, or nothing (File, Options, Report settings).</li>
  <li><strong>Mobile layout</strong> (View, Mobile layout): arrange visuals for phones in portrait.</li>
  <li><strong>Personalize visuals</strong>: lets report readers change a visual's type or fields for themselves without edit rights.</li>
  <li><strong>Accessibility</strong>: alt text on visuals, logical tab order, enough color contrast, never color alone to carry meaning, markers on lines, clear titles.</li>
  <li><strong>Automatic page refresh</strong>: re-queries on a timer or when a change-detection measure changes. It works with DirectQuery (and some streaming) sources, not plain Import.</li>
</ul>
<p><strong>Exam traps.</strong> Bookmark not resetting a slicer? Its Data option is off. Tooltip page not appearing? "Allow use as tooltip" wasn't turned on.</p>`,

V3: `
<p><strong>In plain words.</strong> Power BI has built-in analysis that finds patterns for you.</p>
<ul>
  <li><strong>Analyze</strong>: right-click a data point, then Analyze, to "Explain the increase/decrease" or "Find where this distribution is different".</li>
  <li><strong>Grouping</strong> combines chosen values into one label; <strong>binning</strong> slices a number or date into equal-size ranges (invoice amounts in 1,000 bands); <strong>clustering</strong> (on a scatter chart, "Automatically find clusters") groups similar points.</li>
  <li><strong>AI visuals</strong>: Key influencers (what drives an outcome), Decomposition tree (break a total down level by level, with AI splits), Q&amp;A (ask in plain language), and the narrative visual.</li>
  <li><strong>Analytics pane</strong>: constant, min, max, average, median, percentile and trend lines; error bars; and <strong>forecasting</strong> on a line chart with a continuous date axis.</li>
  <li><strong>Anomaly detection</strong>: on a line chart with a date axis, Analytics pane, Find anomalies; it flags unexpected points and can explain them.</li>
  <li><strong>Copilot</strong> can summarize what's in the semantic model so new users understand the tables and measures.</li>
</ul>
<p><strong>Finance example.</strong> Use Key influencers to see which customer segment drives late payment, and a forecast on monthly revenue for the next quarter.</p>
<p><strong>Exam traps.</strong> Forecasting needs a line chart and a continuous date axis, one measure, no legend. Outlier spotting on two measures: scatter chart.</p>`,

S1: `
<p><strong>In plain words.</strong> Publishing moves your work from Desktop to the Power BI service. File, Publish uploads the report and its semantic model to a workspace.</p>
<ul>
  <li><strong>Workspaces</strong> are team containers. My workspace is private and not for sharing with a team.</li>
  <li><strong>Apps</strong> package a workspace's content for a wide audience. One app per workspace; you can define several audiences that see different content. After changing reports, you must <em>Update app</em> before users see it.</li>
  <li><strong>Dashboards</strong> exist only in the service: one page of tiles pinned from reports. <strong>Data alerts</strong> work on dashboard tiles showing a single number (card, KPI, gauge).</li>
  <li><strong>Subscriptions</strong> email a snapshot of a report page or dashboard on a schedule.</li>
  <li><strong>Distribution</strong>: share a single item, publish an app (best for many people), embed in Teams or SharePoint, or Publish to web (public internet, no security, never for confidential data).</li>
  <li><strong>Endorsement</strong>: Promoted (anyone with write access can mark content as recommended) and Certified (only people authorized by the Power BI admin).</li>
  <li><strong>Gateway</strong>: needed when the service must refresh from data it can't reach on its own: on-premises SQL Server, files on a local or network drive. Not needed for cloud sources such as SharePoint Online or Azure SQL Database.</li>
  <li><strong>Scheduled refresh</strong>: in the semantic model settings, set credentials and times. Up to 8 per day on Pro; up to 48 on Premium, Premium Per User, or Fabric capacity.</li>
</ul>
<p><strong>Exam traps.</strong> An Excel file on someone's laptop needs a gateway (personal or standard). The same file in OneDrive for Business or SharePoint Online doesn't.</p>`,

S2: `
<p><strong>In plain words.</strong> Security answers "who can see and do what".</p>
<ul>
  <li><strong>Workspace roles</strong>, from most to least power: Admin (everything, including deleting the workspace and adding admins), Member (add people at Member or lower, publish and update the app), Contributor (create, edit and delete content; can't share or manage the app unless allowed), Viewer (read only).</li>
  <li><strong>Item-level access</strong>: share a single report or dashboard, optionally allowing reshare and Build.</li>
  <li><strong>Semantic model access</strong>: <em>Build</em> permission lets people create their own reports or use Analyze in Excel on your model.</li>
  <li><strong>Row-level security (RLS)</strong>: in Desktop, Modeling, Manage roles, create a role with a DAX filter such as <code>[Region] = "West"</code>. Dynamic RLS uses <code>USERPRINCIPALNAME()</code> to match the signed-in user's email against a column. Test with View as. After publishing, add users or security groups to each role in the semantic model's Security page.</li>
  <li><strong>RLS only restricts Viewers</strong> (and people who get access through sharing or an app). Workspace Admins, Members and Contributors see all data.</li>
  <li><strong>Sensitivity labels</strong> from Microsoft Purview (Public, General, Confidential, Highly Confidential) classify content and travel with exports to Excel, PowerPoint and PDF.</li>
</ul>
<p><strong>Exam traps.</strong> "Users still see all regions after RLS" usually means they're Members or Contributors of the workspace. Use security groups for RLS membership to avoid maintaining individual names.</p>`,
};
