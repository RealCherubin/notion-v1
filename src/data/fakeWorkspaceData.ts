// Filler workspace data for context aggregation and testing

export const TEAM = [
  { name: "Alice Smith", role: "Designer" },
  { name: "Bob Lee", role: "Account Manager" },
  { name: "Carol Jones", role: "Developer" },
  { name: "David Kim", role: "Project Manager" },
  { name: "Eva Brown", role: "Marketing Lead" },
  { name: "Frank Green", role: "Copywriter" },
  { name: "Grace Liu", role: "QA Engineer" },
  { name: "Henry Patel", role: "Finance" },
  { name: "Ivy Chen", role: "Research Analyst" },
  { name: "Jack Wilson", role: "Operations" }
];

// Helper to generate random tasks
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().slice(0, 10);
}
const TASK_NAMES = [
  "Design homepage banner", "Send invoice to client", "Update brand guidelines", "Fix login bug", "Write blog post", "QA new feature", "Prepare financial report", "Research competitor pricing", "Organize team meeting", "Draft marketing email", "Create social media graphics", "Review client feedback", "Optimize landing page", "Test mobile app", "Plan product launch", "Update project roadmap", "Conduct user interviews", "Analyze survey results", "Schedule photoshoot", "Order office supplies", "Set up analytics dashboard", "Refactor codebase", "Prepare pitch deck", "Review contracts", "Coordinate with vendor", "Update CRM records", "Draft press release", "Design business cards", "Implement SEO improvements", "Create onboarding checklist", "Review ad performance", "Plan holiday campaign", "Update employee handbook", "Test payment gateway", "Organize files", "Write case study", "Update FAQ page", "Prepare training materials", "Review expense reports", "Schedule 1:1 meetings", "Draft project summary"
];
const STATUS = ["To Do", "In Progress", "Done", "Blocked"];
const PRIORITY = ["Low", "Medium", "High"];

const TASK_ROWS = Array.from({ length: 200 }, (_, i) => [
  randomChoice(TASK_NAMES) + (Math.random() < 0.1 ? ` #${i+1}` : ""),
  randomChoice(TEAM).name,
  randomChoice(STATUS),
  randomDate(new Date(2024, 5, 1), new Date(2024, 7, 31)),
  randomChoice(PRIORITY)
]);

export const FAKE_WORKSPACE_DATA = [
  {
    id: "note-brainstorm",
    title: "Brainstorm: New Product Ideas",
    type: "note",
    content: [
      "Ideas for new products in 2024:",
      "- Eco-friendly packaging solutions",
      "- AI-powered design assistant",
      "- Subscription model for design services",
      "Next steps: Evaluate feasibility and market demand."
    ]
  },
  {
    id: "financials-2024",
    title: "2024 Financial Overview",
    type: "table",
    columns: ["Month", "Revenue", "Expenses", "Profit"],
    rows: [
      ["January", "$12,000", "$8,000", "$4,000"],
      ["February", "$15,000", "$9,500", "$5,500"],
      ["March", "$13,500", "$8,800", "$4,700"],
      ["April", "$16,200", "$10,100", "$6,100"],
      ["May", "$14,800", "$9,200", "$5,600"]
    ]
  },
  {
    id: "tasks-db",
    title: "Task Database",
    type: "table",
    columns: ["Task", "Owner", "Status", "Due Date", "Priority"],
    rows: TASK_ROWS
  },
  {
    id: "team-directory",
    title: "Team Directory",
    type: "table",
    columns: ["Name", "Role", "Email", "Phone"],
    rows: TEAM.map((member, i) => [
      member.name,
      member.role,
      member.name.toLowerCase().replace(/ /g, ".") + "@company.com",
      `555-01${(i+1).toString().padStart(2, '0')}`
    ])
  },
  {
    id: "note-client-feedback",
    title: "Client Feedback: May 2024",
    type: "note",
    content: [
      "Feedback from Client X:",
      "- Loved the new homepage design",
      "- Suggested more color options for product Y",
      "- Noted slow response time on mobile app",
      "Action: Address mobile performance in next sprint."
    ]
  },
  {
    id: "note-meeting-2024-06-01",
    title: "Meeting Notes: 2024-06-01",
    type: "note",
    content: [
      "Attendees: Alice, Bob, Carol, Eva",
      "Agenda:",
      "- Q3 project kickoff",
      "- Budget review",
      "- Marketing plan discussion",
      "Decisions:",
      "- Move forward with new ad campaign",
      "- Assign Carol to lead mobile app improvements"
    ]
  },
  {
    id: "note-marketing-plan",
    title: "Marketing Plan: Summer 2024",
    type: "note",
    content: [
      "Objectives:",
      "- Increase brand awareness by 20%",
      "- Launch influencer campaign in July",
      "- Improve website conversion rate",
      "Channels: Social, Email, Paid Ads"
    ]
  },
  {
    id: "note-research-competitors",
    title: "Research: Competitor Analysis",
    type: "note",
    content: [
      "Competitors analyzed: DesignCo, PixelWorks, Brandify",
      "Key findings:",
      "- DesignCo: Strong in B2B, high pricing",
      "- PixelWorks: Fast delivery, limited service range",
      "- Brandify: Best for startups, flexible packages"
    ]
  },
  {
    id: "note-design-assets",
    title: "Design Assets Inventory",
    type: "note",
    content: [
      "Assets as of June 2024:",
      "- 50+ logo files",
      "- 30+ social media templates",
      "- 10 website mockups",
      "- Asset library on Google Drive"
    ]
  },
  {
    id: "note-projects-overview",
    title: "Projects Overview",
    type: "note",
    content: [
      "Active projects:",
      "- Website redesign for Client X",
      "- Mobile app for Client Y",
      "- Internal dashboard upgrade",
      "Upcoming: Q4 campaign planning"
    ]
  }
]; 