// PL-300 skills measured, effective April 20, 2026 (Microsoft Learn study guide, last updated 2026-03-20).
// Every question, lesson and capstone task in this site is tagged with one of these skill ids.
export const SYLLABUS_VERSION = "Skills measured as of April 20, 2026";
export const STUDY_GUIDE_URL = "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300";
export const PRACTICE_ASSESSMENT_URL = "https://learn.microsoft.com/en-us/credentials/certifications/exams/pl-300/practice/assessment?assessment-type=practice&assessmentId=48";
export const EXAM_SANDBOX_URL = "https://aka.ms/examdemo";

export const DOMAINS = [
  { id: "P", name: "Prepare the data", weight: "25–30%", mid: 0.275 },
  { id: "M", name: "Model the data", weight: "25–30%", mid: 0.275 },
  { id: "V", name: "Visualize and analyze the data", weight: "25–30%", mid: 0.275 },
  { id: "S", name: "Manage and secure Power BI", weight: "15–20%", mid: 0.175 },
];

export const GROUPS = [
  { id: "P1", domain: "P", name: "Get or connect to data", skills: [
    ["P1.1", "Identify and connect to data sources or a shared semantic model"],
    ["P1.2", "Change data source settings, including credentials and privacy levels"],
    ["P1.3", "Choose between DirectLake, DirectQuery, and Import"],
    ["P1.4", "Create and modify parameters"],
  ]},
  { id: "P2", domain: "P", name: "Profile and clean the data", skills: [
    ["P2.1", "Evaluate data, including data statistics and column properties"],
    ["P2.2", "Resolve inconsistencies, unexpected or null values, and data quality issues"],
    ["P2.3", "Resolve data import errors"],
  ]},
  { id: "P3", domain: "P", name: "Transform and load the data", skills: [
    ["P3.1", "Select appropriate column data types"],
    ["P3.2", "Create and transform columns"],
    ["P3.3", "Group and aggregate rows"],
    ["P3.4", "Pivot, unpivot, and transpose data"],
    ["P3.5", "Convert semi-structured data to a table"],
    ["P3.6", "Create fact tables and dimension tables"],
    ["P3.7", "Identify when to use reference or duplicate queries and the resulting impact"],
    ["P3.8", "Merge and append queries"],
    ["P3.9", "Identify and create appropriate keys for relationships"],
    ["P3.10", "Configure data loading for queries"],
  ]},
  { id: "M1", domain: "M", name: "Design and implement a data model", skills: [
    ["M1.1", "Configure table and column properties"],
    ["M1.2", "Implement role-playing dimensions"],
    ["M1.3", "Define a relationship's cardinality and cross-filter direction"],
    ["M1.4", "Create a common date table"],
    ["M1.5", "Identify use cases for calculated columns and calculated tables"],
  ]},
  { id: "M2", domain: "M", name: "Create model calculations by using DAX", skills: [
    ["M2.1", "Create single aggregation measures"],
    ["M2.2", "Use the CALCULATE function"],
    ["M2.3", "Implement time intelligence measures"],
    ["M2.4", "Use basic statistical functions"],
    ["M2.5", "Create semi-additive measures"],
    ["M2.6", "Create a measure by using quick measures"],
    ["M2.7", "Create calculated tables or columns"],
    ["M2.8", "Create calculation groups"],
  ]},
  { id: "M3", domain: "M", name: "Optimize model performance", skills: [
    ["M3.1", "Improve performance by identifying and removing unnecessary rows and columns"],
    ["M3.2", "Identify poorly performing measures, relationships, and visuals by using Performance Analyzer and DAX query view"],
    ["M3.3", "Improve performance by reducing granularity"],
  ]},
  { id: "V1", domain: "V", name: "Create reports", skills: [
    ["V1.1", "Select an appropriate visual"],
    ["V1.2", "Format and configure visuals"],
    ["V1.3", "Create a narrative visual with Copilot"],
    ["V1.4", "Apply and customize a theme"],
    ["V1.5", "Apply conditional formatting"],
    ["V1.6", "Apply slicing and filtering"],
    ["V1.7", "Use Copilot to create a new report page"],
    ["V1.8", "Use Copilot to suggest content for a new report page"],
    ["V1.9", "Configure the report page"],
    ["V1.10", "Choose when to use a paginated report"],
    ["V1.11", "Create visual calculations by using DAX"],
  ]},
  { id: "V2", domain: "V", name: "Enhance reports for usability and storytelling", skills: [
    ["V2.1", "Configure bookmarks"],
    ["V2.2", "Create custom tooltips"],
    ["V2.3", "Edit and configure interactions between visuals"],
    ["V2.4", "Configure navigation for a report"],
    ["V2.5", "Apply sorting to visuals"],
    ["V2.6", "Configure sync slicers"],
    ["V2.7", "Group and layer visuals by using the Selection pane"],
    ["V2.8", "Configure drillthrough navigation, including pages, filters, and buttons"],
    ["V2.9", "Configure export settings"],
    ["V2.10", "Design reports for mobile devices"],
    ["V2.11", "Enable personalization in a report, including personalized visuals"],
    ["V2.12", "Design and configure Power BI reports for accessibility"],
    ["V2.13", "Configure automatic page refresh"],
  ]},
  { id: "V3", domain: "V", name: "Identify patterns and trends", skills: [
    ["V3.1", "Use the Analyze feature in Power BI"],
    ["V3.2", "Use grouping, binning, and clustering"],
    ["V3.3", "Use AI visuals"],
    ["V3.4", "Use reference lines, error bars, and forecasting"],
    ["V3.5", "Detect outliers and anomalies"],
    ["V3.6", "Use Copilot to summarize the underlying semantic model"],
  ]},
  { id: "S1", domain: "S", name: "Create and manage workspaces and assets", skills: [
    ["S1.1", "Create and configure a workspace"],
    ["S1.2", "Configure and update an app"],
    ["S1.3", "Publish, import, or update items in a workspace"],
    ["S1.4", "Create dashboards"],
    ["S1.5", "Choose a distribution method"],
    ["S1.6", "Configure subscriptions and data alerts"],
    ["S1.7", "Promote or certify Power BI content"],
    ["S1.8", "Identify when a gateway is required"],
    ["S1.9", "Configure a semantic model scheduled refresh"],
  ]},
  { id: "S2", domain: "S", name: "Secure and govern Power BI items", skills: [
    ["S2.1", "Assign workspace roles"],
    ["S2.2", "Configure item-level access"],
    ["S2.3", "Configure access to semantic models"],
    ["S2.4", "Implement row-level security roles"],
    ["S2.5", "Configure row-level security group membership"],
    ["S2.6", "Apply sensitivity labels"],
  ]},
];

export const SKILLS = {};
for (const g of GROUPS) for (const [id, name] of g.skills) SKILLS[id] = { id, name, group: g.id, domain: g.domain };

export const groupOf = (skillId) => GROUPS.find((g) => g.id === SKILLS[skillId]?.group);
export const domainOf = (id) => DOMAINS.find((d) => d.id === id[0]);
export const learnSearch = (text) => "https://learn.microsoft.com/en-us/search/?terms=" + encodeURIComponent("Power BI " + text);
