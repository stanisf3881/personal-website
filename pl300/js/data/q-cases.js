// Case studies in the PL-300 style: read the scenario, then answer several questions about it.
// All companies and data are fictional.
export default [
{ id: "CS-1", title: "Litware Health Partners: finance reporting",
  scenario: `
<h4>Overview</h4>
<p>Litware Health Partners runs 14 clinics. The finance team of five uses Excel today and is moving to Power BI.</p>
<h4>Existing environment</h4>
<ul>
<li>The general ledger is in a SQL Server database in Litware's own data center. It holds 9 years of journal lines (about 120 million rows).</li>
<li>Budgets are in one Excel workbook in SharePoint Online with a column per month (Jan–Dec) and a row per clinic and account.</li>
<li>A Clinic list is in a CSV on a network share. Some ClinicIDs appear twice because clinics were renamed.</li>
</ul>
<h4>Requirements</h4>
<ul>
<li>Reports must cover the current and previous fiscal year only. The fiscal year ends June 30.</li>
<li>Reports must show budget vs actual by clinic and month.</li>
<li>Clinic managers must see only their own clinic's data. Finance staff see everything.</li>
<li>Semantic model refresh must be automated each night.</li>
<li>Minimize model size.</li>
</ul>`,
  questions: [
  { id: "CS-1-1", skill: "P3.4", d: 2, type: "single",
    q: "How should you transform the budget workbook before loading it?",
    options: ["Select Clinic and Account, then Unpivot other columns", "Pivot the month columns", "Transpose the table", "Append the workbook to the ledger"],
    answer: 0, explain: "Unpivoting turns the 12 month columns into Month and Amount rows, which can then relate to the Date table." },
  { id: "CS-1-2", skill: "P2.2", d: 2, type: "single",
    q: "What must you do before the Clinic CSV can be the 'one' side of a relationship?",
    options: ["Remove duplicate ClinicIDs, keeping the current name for each", "Change ClinicID to Decimal number", "Set cross-filter direction to Both", "Disable load"],
    answer: 0, explain: "The one side of a one-to-many relationship needs unique keys. Resolve duplicates (for example sort by a date and keep the latest name, then Remove duplicates)." },
  { id: "CS-1-3", skill: "M3.1", d: 2, type: "single",
    q: "Which action best meets the 'minimize model size' requirement for the ledger?",
    options: ["Filter journal lines to the current and previous fiscal year in Power Query", "Load all 9 years and use a report-level filter", "Use bidirectional relationships", "Add a calculated column per year"],
    answer: 0, explain: "Filtering rows before load keeps only what's needed; a report filter still loads all 9 years into the model." },
  { id: "CS-1-4", skill: "S1.8", d: 1, type: "multi", pick: 2,
    q: "Which TWO sources need an on-premises data gateway for the nightly refresh?",
    options: ["The SQL Server general ledger", "The Clinic CSV on the network share", "The budget workbook in SharePoint Online", "None; the service reaches all of them"],
    answer: [0, 1], explain: "On-premises databases and network shares need a gateway. SharePoint Online is a cloud source." },
  { id: "CS-1-5", skill: "S2.4", d: 2, type: "single",
    q: "Finance staff are workspace Members. Clinic managers will use the app. How should you meet the security requirement?",
    options: ["Create an RLS role filtering Clinic by the manager's email with USERPRINCIPALNAME(); finance staff need no role because Members aren't restricted", "Create one report per clinic", "Give clinic managers the Contributor role", "Apply a sensitivity label per clinic"],
    answer: 0, explain: "Dynamic RLS restricts managers who consume through the app. Workspace Members bypass RLS, so finance sees everything." },
  ]},
{ id: "CS-2", title: "Fabrikam Distribution: receivables and cash",
  scenario: `
<h4>Overview</h4>
<p>Fabrikam Distribution sells to 2,300 business customers. The credit team wants to reduce days sales outstanding (DSO).</p>
<h4>Existing environment</h4>
<ul>
<li>Invoices table: InvoiceID, CustomerID, InvoiceDate, DueDate, PaidDate, Amount.</li>
<li>BankBalance table: one row per bank account per business day with the closing balance.</li>
<li>A Date table exists and is marked as a date table. It has an active relationship to Invoices[InvoiceDate].</li>
</ul>
<h4>Requirements</h4>
<ul>
<li>Show invoice amounts by invoice month by default, and a measure of amounts by due month.</li>
<li>Show the month-end cash balance per month and per account.</li>
<li>Let the credit manager right-click any customer and see that customer's invoice history.</li>
<li>Find the factors that make invoices more likely to be paid late.</li>
</ul>`,
  questions: [
  { id: "CS-2-1", skill: "M1.2", d: 2, type: "single",
    q: "How should you relate DueDate to the Date table?",
    options: ["Create an inactive relationship and use USERELATIONSHIP in the due-month measure", "Replace the InvoiceDate relationship with DueDate", "Make both active", "Use a calculated column instead of a relationship"],
    answer: 0, explain: "The InvoiceDate relationship stays active for the default view; the inactive DueDate relationship is activated in one measure." },
  { id: "CS-2-2", skill: "M2.5", d: 3, type: "single",
    q: "Which expression returns the month-end cash balance, given that balances only exist on business days?",
    options: ["CALCULATE(SUM(BankBalance[Balance]), LASTNONBLANK('Date'[Date], CALCULATE(SUM(BankBalance[Balance]))))", "SUM(BankBalance[Balance])", "TOTALMTD(SUM(BankBalance[Balance]), 'Date'[Date])", "AVERAGE(BankBalance[Balance])"],
    answer: 0, explain: "Balances are semi-additive. LASTNONBLANK picks the last date in the month that has a balance, which handles weekends." },
  { id: "CS-2-3", skill: "V2.8", d: 2, type: "single",
    q: "What should you build for the credit manager's customer history requirement?",
    options: ["A Customer History page with CustomerID or Customer name in the Drillthrough well", "A tooltip page", "A bookmark per customer", "A dashboard"],
    answer: 0, explain: "A drillthrough page is opened by right-clicking a customer anywhere and is filtered to that customer." },
  { id: "CS-2-4", skill: "V3.3", d: 2, type: "single",
    q: "Which visual meets the requirement to find factors that drive late payment?",
    options: ["Key influencers", "Waterfall", "Gauge", "Ribbon chart"],
    answer: 0, explain: "Key influencers analyzes which factors increase the likelihood of an outcome such as Paid Late = Yes." },
  { id: "CS-2-5", skill: "M1.5", d: 2, type: "single",
    q: "You need a 'Days late' value per invoice that can be binned into aging buckets for slicers. What should you create?",
    options: ["A calculated column on Invoices (or a column in Power Query)", "A measure", "A visual calculation", "A calculation group"],
    answer: 0, explain: "Bucketing and slicing need a column value per row. Measures can't go on slicers or be binned." },
  ]},
{ id: "CS-3", title: "Tailspin Group: multi-company consolidation",
  scenario: `
<h4>Overview</h4>
<p>Tailspin Group has four subsidiaries in the US, UK, Canada and Mexico, each with its own currency. The group CFO wants consolidated reporting in USD.</p>
<h4>Existing environment</h4>
<ul>
<li>All subsidiaries' general ledgers are combined in a Microsoft Fabric lakehouse as Delta tables.</li>
<li>An exchange rate table has one rate per currency per month.</li>
<li>Entity metadata arrives as a JSON file with a nested address record.</li>
</ul>
<h4>Requirements</h4>
<ul>
<li>Large GL tables must be queried with Import-like performance and no scheduled import.</li>
<li>Every financial measure needs MTD, QTD, YTD and prior-year versions.</li>
<li>Subsidiary controllers see only their entity; the group CFO sees all.</li>
<li>Board packs must be printable as exact multi-page PDFs.</li>
<li>Reports must be distributed to 150 managers, read-only.</li>
</ul>`,
  questions: [
  { id: "CS-3-1", skill: "P1.3", d: 2, type: "single",
    q: "Which storage mode should the GL tables use?",
    options: ["Direct Lake", "Import", "DirectQuery against an Excel export", "Dual"],
    answer: 0, explain: "Direct Lake reads Fabric Delta tables with Import-like performance and no scheduled import." },
  { id: "CS-3-2", skill: "M2.8", d: 3, type: "single",
    q: "How should you deliver MTD, QTD, YTD and PY for every measure with the least maintenance?",
    options: ["A calculation group with four calculation items", "Four copies of every measure", "Four bookmarks", "Quick measures for each"],
    answer: 0, explain: "Calculation items apply time logic to any measure through SELECTEDMEASURE()." },
  { id: "CS-3-3", skill: "P3.5", d: 2, type: "single",
    q: "What must you do with the entity JSON so its city appears as a column?",
    options: ["Convert to table, expand the record, then expand the nested address record", "Pivot the JSON", "Merge it with itself", "Load it as a single text column"],
    answer: 0, explain: "Semi-structured JSON needs to be converted to a table and its records expanded until fields become columns." },
  { id: "CS-3-4", skill: "V1.10", d: 1, type: "single",
    q: "What should you use for the board packs?",
    options: ["Paginated reports", "Dashboards", "Mobile layout", "Bookmarks"],
    answer: 0, explain: "Paginated reports give pixel-perfect, multi-page, printable output." },
  { id: "CS-3-5", skill: "S1.5", d: 1, type: "single",
    q: "How should you distribute content to the 150 managers?",
    options: ["Publish an app to a security group", "Add them as workspace Contributors", "Publish to web", "Send the .pbix by email"],
    answer: 0, explain: "Apps are designed for read-only distribution to large audiences, and RLS still applies to app consumers." },
  ]},
];
