import React, { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { InfoIcon, SearchIcon, FilterIcon, MailIcon, PhoneIcon, HelpIcon, ChevronUpIcon, ChevronLeftIcon, FlameIcon, ReferralsIcon, FormIcon, CheckCircleIcon, SortMenuIcon, SortAscIcon, SortDescIcon, DownloadIcon } from "../components/icons";
import ContactHealthTiles, { getBucket } from "../components/ContactHealthTiles";
import ExportDialog from "../components/ExportDialog";
import ExportPreview from "./ExportPreview";

// -------------------------------------------------
// Mock metrics + contacts
// -------------------------------------------------

const METRICS = [
  {
    key: "delivery",
    label: "Delivery Rate",
    value: 96.4,
    unit: "%",
    tooltip: "Delivered messages ÷ total sent across the last 30 days.",
  },
  {
    key: "bounce",
    label: "Undelivered / Bounce Rate",
    value: 1.7,
    unit: "%",
    tooltip: "Hard + soft bounces ÷ total sent. Keep under ~2% for healthy sending.",
  },
  {
    key: "open",
    label: "Open Rate",
    value: 24.1,
    unit: "%",
    tooltip: "Unique opens ÷ successfully delivered messages.",
  },
  {
    key: "click",
    label: "Click Rate",
    value: 4.3,
    unit: "%",
    tooltip: "Unique clickers ÷ successfully delivered messages.",
  },
];

const CONTACTS = [
  {
    id: "u_101",
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    address: "123 Main St, City, ST 12345",
    createdOn: "2023-01-15",
    lastEventAt: "2025-04-21",
    lastActivity: "2025-04-21",
    lastReengagementAt: null,
    reason: "No opens or clicks in 210 days",
    inactiveReason: null,
    status: "UNENGAGED",
    bucket: "UNENGAGED",
    daysUnengaged: 210,
    tags: ["Sphere"],
    segment: "Newsletter",
    activityType: "form_submitter",
  },
  {
    id: "u_102",
    name: "Marcus Lee",
    email: "marcus.lee@contoso.com",
    status: "UNENGAGED",
    bucket: "UNENGAGED",
    daysUnengaged: 330,
    lastEventAt: "2025-02-10",
    lastReengagementAt: "2025-11-05",
    reason: "Viewed once, no activity since",
    tags: ["Past client"],
    segment: "Quarterly Touch",
    activityType: "referral",
  },
  {
    id: "u_103",
    name: "Priya Natarajan",
    email: "priya.n@example.net",
    status: "UNENGAGED_AT_RISK",
    bucket: "UNENGAGED",
    daysUnengaged: 365,
    lastEventAt: "2024-11-25",
    lastReengagementAt: "2025-08-01",
    reason: "Will be sunset within 0 days unless reengaged",
    tags: ["Buyer lead"],
    segment: "Drip: Buyers",
    activityType: "hot_lead",
  },
  {
    id: "a_201",
    name: "Active Buyer",
    email: "buyer@client.com",
    address: "456 Oak Ave, Town, ST 67890",
    createdOn: "2024-06-01",
    lastEventAt: "2025-11-20",
    lastActivity: "2025-11-20",
    reason: "Opened last weekly campaign",
    inactiveReason: null,
    status: "ACTIVE",
    bucket: "ACTIVE",
    daysUnengaged: 5,
    tags: ["Buyer lead"],
    segment: "Drip: Buyers",
    activityType: "hot_lead",
  },
  {
    id: "a_202",
    name: "Warm Vetting",
    email: "warm@vetting.io",
    status: "PENDING_VETTING",
    bucket: "ACTIVE",
    daysUnengaged: 12,
    lastEventAt: "2025-11-15",
    reason: "Newly imported, currently being validated",
    tags: ["Imported list"],
    segment: "New Imports",
    activityType: "form_submitter",
  },
  { id: "a_203", name: "Jordan Kim", email: "jordan.kim@example.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 2, lastEventAt: "2025-11-25", reason: "Clicked CTA in last email", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "a_204", name: "Sam Rivera", email: "sam.rivera@contoso.com", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 8, lastEventAt: "2025-11-18", reason: "Recently subscribed, in validation window", tags: ["Sphere"], segment: "Newsletter", activityType: "form_submitter" },
  { id: "a_205", name: "Morgan Chen", email: "morgan.chen@client.io", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 1, lastEventAt: "2025-11-26", reason: "Opened and clicked today", tags: ["Past client"], segment: "Quarterly Touch", activityType: "referral" },
  { id: "a_206", name: "Alex Foster", email: "alex.foster@example.net", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 10, lastEventAt: "2025-11-16", reason: "New signup from landing page", tags: ["Buyer lead"], segment: "New Imports", activityType: "form_submitter" },
  { id: "a_207", name: "Riley Brooks", email: "riley.brooks@mail.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 4, lastEventAt: "2025-11-22", reason: "Consistent opener", tags: ["Imported list"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "a_208", name: "Casey Dunn", email: "casey.dunn@vetting.io", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 6, lastEventAt: "2025-11-20", reason: "Referral lead, under review", tags: ["Past client"], segment: "Quarterly Touch", activityType: "referral" },
  { id: "a_209", name: "Jamie Walsh", email: "jamie.walsh@example.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 0, lastEventAt: "2025-11-27", reason: "Just opened campaign", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "a_210", name: "Quinn Hayes", email: "quinn.hayes@contoso.com", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 14, lastEventAt: "2025-11-12", reason: "Double opt-in pending", tags: ["Sphere"], segment: "Newsletter", activityType: "form_submitter" },
  { id: "a_211", name: "Taylor Reed", email: "taylor.reed@client.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 3, lastEventAt: "2025-11-24", reason: "Engaged with product update", tags: ["Imported list"], segment: "New Imports", activityType: "referral" },
  { id: "a_212", name: "Skyler Bell", email: "skyler.bell@example.org", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 9, lastEventAt: "2025-11-17", reason: "Import from CRM in progress", tags: ["Old lead"], segment: "Legacy", activityType: "form_submitter" },
  { id: "a_213", name: "Drew Cooper", email: "drew.cooper@mail.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 5, lastEventAt: "2025-11-21", reason: "Replied to last touch", tags: ["Past client"], segment: "Quarterly Touch", activityType: "hot_lead" },
  { id: "a_214", name: "Blake Sullivan", email: "blake.sullivan@vetting.io", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 11, lastEventAt: "2025-11-14", reason: "New list upload, validating", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "form_submitter" },
  { id: "a_215", name: "Cameron Price", email: "cameron.price@example.net", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 2, lastEventAt: "2025-11-25", reason: "Opened three in a row", tags: ["Sphere"], segment: "Newsletter", activityType: "referral" },
  { id: "a_216", name: "Reese Morgan", email: "reese.morgan@client.io", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 7, lastEventAt: "2025-11-19", reason: "Webinar signup, vetting", tags: ["Imported list"], segment: "New Imports", activityType: "form_submitter" },
  { id: "a_217", name: "Parker Stewart", email: "parker.stewart@example.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 1, lastEventAt: "2025-11-26", reason: "Clicked link in digest", tags: ["Past client"], segment: "Quarterly Touch", activityType: "hot_lead" },
  { id: "a_218", name: "Avery Phillips", email: "avery.phillips@contoso.com", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 13, lastEventAt: "2025-11-11", reason: "Cold import, checking deliverability", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "form_submitter" },
  { id: "a_219", name: "Hayden Turner", email: "hayden.turner@mail.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 4, lastEventAt: "2025-11-23", reason: "Opened last two campaigns", tags: ["Old lead"], segment: "Legacy", activityType: "referral" },
  { id: "a_220", name: "Emery Clark", email: "emery.clark@example.org", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 15, lastEventAt: "2025-11-10", reason: "New integration sync", tags: ["Sphere"], segment: "Newsletter", activityType: "form_submitter" },
  { id: "a_221", name: "Finley Lewis", email: "finley.lewis@client.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 0, lastEventAt: "2025-11-27", reason: "Just subscribed", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "a_222", name: "Rowan Hill", email: "rowan.hill@vetting.io", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 5, lastEventAt: "2025-11-21", reason: "Partner list, under review", tags: ["Imported list"], segment: "New Imports", activityType: "referral" },
  { id: "d_401", name: "Nina Torres", email: "nina.torres@example.com", status: "DISABLED", bucket: "INACTIVE", daysUnengaged: 3, lastEventAt: "2025-11-24", reason: "Temporarily disabled by user", tags: ["Past client"], segment: "Newsletter", activityType: "form_submitter" },
  { id: "d_402", name: "Owen Grant", email: "owen.grant@contoso.com", status: "DISABLED", bucket: "INACTIVE", daysUnengaged: 6, lastEventAt: "2025-11-20", reason: "Disabled during list cleanup", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "d_403", name: "Sage Coleman", email: "sage.coleman@client.io", status: "DISABLED", bucket: "INACTIVE", daysUnengaged: 2, lastEventAt: "2025-11-25", reason: "Paused for compliance review", tags: ["Imported list"], segment: "New Imports", activityType: "referral" },
  { id: "a_223", name: "Robin Nash", email: "robin.nash@example.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 1, lastEventAt: "2025-01-28", reason: "Opened campaign yesterday", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "a_224", name: "Jordan Blake", email: "jordan.blake@contoso.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 3, lastEventAt: "2025-01-26", reason: "Clicked CTA earlier this week", tags: ["Past client"], segment: "Quarterly Touch", activityType: "referral" },
  { id: "a_225", name: "Skylar Reid", email: "skylar.reid@client.io", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 5, lastEventAt: "2025-01-24", reason: "Engaged with weekly digest", tags: ["Sphere"], segment: "Newsletter", activityType: "form_submitter" },
  {
    id: "i_301",
    name: "Dormant Lead",
    email: "dl@example.org",
    address: "",
    createdOn: "2022-03-10",
    lastEventAt: "2024-12-01",
    lastActivity: "2024-12-01",
    status: "SUNSET",
    bucket: "INACTIVE",
    daysUnengaged: 365,
    reason: "No engagement in 365 days; permanently sunset",
    inactiveReason: "Inactive due to no engagement",
    tags: ["Old lead"],
    segment: "Legacy",
    activityType: "referral",
  },
  {
    id: "i_302",
    name: "Julia Park",
    email: "julia.park@example.com",
    status: "UNSUBSCRIBED",
    bucket: "INACTIVE",
    daysUnengaged: 120,
    lastEventAt: "2025-06-11",
    reason: "Opted out via unsubscribe link",
    tags: ["Past client"],
    segment: "Newsletter",
  },
  {
    id: "i_303",
    name: "Tom Alvarez",
    email: "tom@northbeach.dev",
    status: "SPAM_REPORT",
    bucket: "INACTIVE",
    daysUnengaged: 180,
    lastEventAt: "2025-05-02",
    reason: "Marked as spam; cannot be recontacted",
    tags: ["Imported list"],
    segment: "New Imports",
    activityType: "referral",
  },
  // ~30 new inactive records with status + Inactive Reason
  { id: "i_304", name: "Dana Webb", email: "dana.webb@example.com", status: "DEDUPED", bucket: "INACTIVE", lastEventAt: "2025-08-12", reason: "Owned by another account", tags: ["Past client"], segment: "Newsletter" },
  { id: "i_305", name: "Kyle Ortiz", email: "kyle.ortiz@contoso.com", status: "BLOCKED", bucket: "INACTIVE", lastEventAt: "2025-07-22", reason: "Marked as bad email", tags: ["Buyer lead"], segment: "Drip: Buyers" },
  { id: "i_306", name: "Jordan Fry", email: "jordan.fry@testblock.dev", status: "BLOCKED_DOMAIN", bucket: "INACTIVE", lastEventAt: "2025-09-01", reason: "Email domain blocked during testing", tags: ["Imported list"], segment: "New Imports" },
  { id: "i_307", name: "Morgan Shaw", email: "morgan.shaw@spamdomain.net", status: "GLOBAL_BLOCKED_DOMAIN", bucket: "INACTIVE", lastEventAt: "2025-06-15", reason: "Email domain blocked system-wide", tags: ["Sphere"], segment: "Newsletter" },
  { id: "i_308", name: "Riley Banks", email: "riley.banks@example.org", status: "UNSUBSCRIBED", bucket: "INACTIVE", lastEventAt: "2025-10-01", reason: "Opted out via unsubscribe link", tags: ["Past client"], segment: "Quarterly Touch" },
  { id: "i_309", name: "Casey Fox", email: "casey.fox@mail.com", status: "SPAM_REPORT", bucket: "INACTIVE", lastEventAt: "2025-05-20", reason: "Marked as spam by recipient", tags: ["Old lead"], segment: "Legacy" },
  { id: "i_310", name: "Avery Stone", email: "avery.stone@client.io", status: "CANCELED", bucket: "INACTIVE", lastEventAt: "2025-09-10", reason: "Was active before being canceled", tags: ["Buyer lead"], segment: "Drip: Buyers" },
  { id: "i_311", name: "Quinn West", email: "quinn.west@example.com", status: "CANCELED_DURING_TESTING", bucket: "INACTIVE", lastEventAt: "2025-08-05", reason: "Was in testing before being canceled", tags: ["Imported list"], segment: "New Imports" },
  { id: "i_312", name: "Skyler Cole", email: "skyler.cole@contoso.com", status: "DISABLED", bucket: "INACTIVE", lastEventAt: "2025-11-01", reason: "Disabled by user", tags: ["Past client"], segment: "Newsletter" },
  { id: "i_313", name: "Drew Hayes", email: "info@acme.com", status: "ROLE", bucket: "INACTIVE", lastEventAt: "2025-07-18", reason: "Role-based email detected", tags: ["Sphere"], segment: "Newsletter" },
  { id: "i_314", name: "Blake Ward", email: "blake.ward@customer.io", status: "CUSTOMER", bucket: "INACTIVE", lastEventAt: "2025-10-15", reason: "Suppressed (current customer email)", tags: ["Past client"], segment: "Quarterly Touch" },
  { id: "i_315", name: "Cameron Lane", email: "cameron.lane@example.net", status: "PERM_DELETE", bucket: "INACTIVE", lastEventAt: "2025-04-30", reason: "Permanently removed", tags: ["Old lead"], segment: "Legacy" },
  { id: "i_316", name: "Reese Fisher", email: "reese.fisher@vetting.io", status: "CANCELED_DISABLED", bucket: "INACTIVE", lastEventAt: "2025-09-22", reason: "Was disabled before being canceled", tags: ["Buyer lead"], segment: "Drip: Buyers" },
  { id: "i_317", name: "Parker Mills", email: "parker.mills@example.com", status: "DISABLED_DURING_TESTING", bucket: "INACTIVE", lastEventAt: "2025-08-28", reason: "Disabled during testing", tags: ["Imported list"], segment: "New Imports" },
  { id: "i_318", name: "Hayden Woods", email: "hayden.woods@contoso.com", status: "CANCELED_DISABLED_DURING_TESTING", bucket: "INACTIVE", lastEventAt: "2025-07-12", reason: "Disabled during testing before being canceled", tags: ["Sphere"], segment: "Newsletter" },
  { id: "i_319", name: "Emery Ross", email: "emery.ross@client.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 2, lastEventAt: "2025-11-20", reason: "Active — finished testing and receiving emails", tags: ["Buyer lead"], segment: "Drip: Buyers", activityType: "hot_lead" },
  { id: "i_320", name: "Finley Hughes", email: "finley.hughes@example.org", status: "PENDING_VETTING", bucket: "ACTIVE", daysUnengaged: 4, lastEventAt: "2025-11-18", reason: "Pending — in validation/testing phase", tags: ["Imported list"], segment: "New Imports", activityType: "form_submitter" },
  { id: "i_321", name: "Rowan Palmer", email: "rowan.palmer@mail.com", status: "SUNSET", bucket: "INACTIVE", lastEventAt: "2024-11-01", reason: "Inactive — sunset due to no engagement", tags: ["Old lead"], segment: "Legacy" },
  { id: "i_322", name: "Sam Vega", email: "sam.vega@example.com", status: "DEDUPED", bucket: "INACTIVE", lastEventAt: "2025-06-08", reason: "Owned by another account", tags: ["Past client"], segment: "Quarterly Touch" },
  { id: "i_323", name: "Alex Norton", email: "alex.norton@contoso.com", status: "BLOCKED", bucket: "INACTIVE", lastEventAt: "2025-05-14", reason: "Marked as bad email", tags: ["Buyer lead"], segment: "Drip: Buyers" },
  { id: "i_324", name: "Taylor Boone", email: "taylor.boone@blocked.test", status: "BLOCKED_DOMAIN", bucket: "INACTIVE", lastEventAt: "2025-09-15", reason: "Email domain blocked during testing", tags: ["Imported list"], segment: "New Imports" },
  { id: "i_325", name: "Jamie Cross", email: "jamie.cross@baddomain.net", status: "GLOBAL_BLOCKED_DOMAIN", bucket: "INACTIVE", lastEventAt: "2025-04-22", reason: "Email domain blocked system-wide", tags: ["Sphere"], segment: "Newsletter" },
  { id: "i_326", name: "Casey Logan", email: "casey.logan@client.io", status: "CANCELED", bucket: "INACTIVE", lastEventAt: "2025-10-08", reason: "Was active before being canceled", tags: ["Past client"], segment: "Quarterly Touch" },
  { id: "i_327", name: "Riley Chandler", email: "admin@company.org", status: "ROLE", bucket: "INACTIVE", lastEventAt: "2025-08-20", reason: "Role-based email detected", tags: ["Buyer lead"], segment: "Drip: Buyers" },
  { id: "i_328", name: "Quinn Barber", email: "quinn.barber@currentcustomer.com", status: "CUSTOMER", bucket: "INACTIVE", lastEventAt: "2025-11-05", reason: "Suppressed (current customer email)", tags: ["Past client"], segment: "Newsletter" },
  { id: "i_329", name: "Avery Daniels", email: "avery.daniels@example.net", status: "PERM_DELETE", bucket: "INACTIVE", lastEventAt: "2025-03-10", reason: "Permanently removed", tags: ["Old lead"], segment: "Legacy" },
  { id: "i_330", name: "Skyler Brewer", email: "skyler.brewer@vetting.io", status: "SUNSET", bucket: "INACTIVE", lastEventAt: "2024-10-15", reason: "Inactive — sunset due to no engagement", tags: ["Sphere"], segment: "Newsletter" },
  { id: "i_331", name: "Drew Horton", email: "drew.horton@example.com", status: "DISABLED_DURING_TESTING", bucket: "INACTIVE", lastEventAt: "2025-09-02", reason: "Disabled during testing", tags: ["Imported list"], segment: "New Imports" },
  { id: "i_332", name: "Blake Olson", email: "blake.olson@contoso.com", status: "CANCELED_DURING_TESTING", bucket: "INACTIVE", lastEventAt: "2025-07-28", reason: "Was in testing before being canceled", tags: ["Buyer lead"], segment: "Drip: Buyers" },
  { id: "i_333", name: "Cameron Dean", email: "cameron.dean@client.com", status: "ACTIVE", bucket: "ACTIVE", daysUnengaged: 0, lastEventAt: "2025-11-22", reason: "Active — finished testing and receiving emails", tags: ["Past client"], segment: "Quarterly Touch", activityType: "referral" },
];

const STATUS_COLORS = {
  UNENGAGED: "orange",
  UNENGAGED_AT_RISK: "red",
  ACTIVE: "green",
  PENDING_VETTING: "blue",
  SUNSET: "gray",
  UNSUBSCRIBED: "gray",
  SPAM_REPORT: "gray",
  DISABLED: "gray",
  DEDUPED: "gray",
  BLOCKED: "gray",
  BLOCKED_DOMAIN: "gray",
  GLOBAL_BLOCKED_DOMAIN: "gray",
  CANCELED: "gray",
  CANCELED_DURING_TESTING: "gray",
  ROLE: "gray",
  CUSTOMER: "gray",
  PERM_DELETE: "gray",
  CANCELED_DISABLED: "gray",
  DISABLED_DURING_TESTING: "gray",
  CANCELED_DISABLED_DURING_TESTING: "gray",
  GOOD_TO_GO: "green",
  VETTING: "blue",
};

const ALL_STATUSES = [
  "UNENGAGED",
  "UNENGAGED_AT_RISK",
  "ACTIVE",
  "PENDING_VETTING",
  "SUNSET",
  "UNSUBSCRIBED",
  "SPAM_REPORT",
  "DISABLED",
  "DEDUPED",
  "BLOCKED",
  "BLOCKED_DOMAIN",
  "GLOBAL_BLOCKED_DOMAIN",
  "CANCELED",
  "CANCELED_DURING_TESTING",
  "ROLE",
  "CUSTOMER",
  "PERM_DELETE",
  "CANCELED_DISABLED",
  "DISABLED_DURING_TESTING",
  "CANCELED_DISABLED_DURING_TESTING",
  "GOOD_TO_GO",
  "VETTING",
];

// Status filter options for the "Show contacts that are:" picklist (value, display label)
const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Any status" },
  ...ALL_STATUSES.map((s) => ({ value: s, label: s })),
];

const TAG_OPTIONS = ["All tags", "Sphere", "Past client", "Buyer lead", "Imported list", "Old lead"];
const SEGMENT_OPTIONS = ["All segments", "Newsletter", "Quarterly Touch", "Drip: Buyers", "New Imports", "Legacy"];

// Last Activity filter options (date range)
const LAST_ACTIVITY_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "Last Day" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Date Range" },
];
// Backward-compat alias for any cached/legacy references
const ACTIVITY_OPTIONS = LAST_ACTIVITY_OPTIONS;

// All unique tags from contacts (for View across > By tag picklist)
const ALL_CONTACT_TAGS = [...new Set(CONTACTS.flatMap((c) => c.tags))].sort();

const CONTACTS_PAGE_SIZE = 20;

// Reference date for Contact Health bucket math (so mock lastEventAt dates count correctly as Active/Unengaged)
const CONTACT_HEALTH_REFERENCE_DATE = new Date("2025-11-28");

// Campaign type options for View across > Campaign Type
const CAMPAIGN_TYPE_OPTIONS = [
  "All campaigns",
  "Email campaigns",
  "Referral campaigns",
  "Image campaigns",
  "Text campaigns",
  "Review requests",
  "Custom campaigns",
];

// Second screenshot palette: sidebar #30434A, header #68BCE1, filter #D2D8DA, green #69A68D/#82CB97, orange #F9AD52
const PILL_STYLES = {
  gray: "bg-[#E0E0E0] text-gray-700",
  green: "bg-green-accent/30 text-[#2d5a3d]",
  blue: "bg-header-bar/30 text-[#2a6b7c]",
  orange: "bg-orange-inactive/40 text-[#b87820]",
  red: "bg-red-100 text-red-700",
};

function Pill({ children, tone = "gray" }) {
  const style = PILL_STYLES[tone] || PILL_STYLES.gray;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, unit, tooltip }) {
  const progressValue = typeof value === "number" ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="flex flex-col items-start p-4">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          <Tooltip>
            <TooltipTrigger aria-label={`Info about ${label}`} className="cursor-help">
              <InfoIcon size={16} className="text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-2xl font-semibold text-gray-800">
            {typeof value === "number" ? value.toFixed(1) : value}
          </div>
          {unit && <div className="text-sm text-gray-500">{unit}</div>}
        </div>
        <Progress value={progressValue} className="mt-2 h-1.5 w-full" />
      </CardContent>
    </Card>
  );
}

function SectionTable({ title, description, rows, columns, badgeTone, headerRight, actionBar, pageSize, currentPage, onPageChange, sortConfig, onSort }) {
  const [openSortKey, setOpenSortKey] = useState(null);
  const totalCount = rows.length;
  const totalPages = pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const page = currentPage != null ? Math.min(Math.max(1, currentPage), totalPages) : 1;
  const start = (page - 1) * (pageSize || totalCount);
  const end = pageSize ? Math.min(start + pageSize, totalCount) : totalCount;
  const paginatedRows = rows.slice(start, end);
  const showPagination = pageSize != null && totalCount > 0;
  const sortable = Boolean(onSort);

  const handleSort = (key, dir) => {
    if (typeof onSort === "function") onSort(key, dir);
    setOpenSortKey(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Pill tone={badgeTone}>{title}</Pill>
          </CardTitle>
          {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
        </div>
        {headerRight && <div className="mt-2 sm:mt-0 flex items-center gap-2">{headerRight}</div>}
      </CardHeader>
      {actionBar && <div className="px-4 pb-2">{actionBar}</div>}
      <CardContent>
        {openSortKey && (
          <div
            className="fixed inset-0 z-30"
            aria-hidden="true"
            onClick={() => setOpenSortKey(null)}
          />
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b bg-filter-bar/50">
                {columns.map((c) => {
                  const isSorted = sortConfig?.key === c.key;
                  const isSortable = sortable && c.key !== "select";
                  const isOpen = openSortKey === c.key;
                  const isSelectCol = c.key === "select";
                  return (
                    <th key={c.key} className={`py-2.5 pr-4 font-semibold ${isSelectCol ? "w-12 min-w-[3rem]" : ""}`}>
                      {isSelectCol ? (
                        c.label
                      ) : (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="flex items-center gap-1 min-w-0">
                          {c.label}
                          {isSorted && isSortable && (
                            <span className="text-gray-500 text-xs shrink-0" aria-hidden>
                              {sortConfig.dir === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </span>
                        {isSortable && (
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOpenSortKey((k) => (k === c.key ? null : c.key)); }}
                              className="p-0.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
                              aria-label={`Sort by ${typeof c.label === "string" ? c.label : c.key}`}
                              aria-expanded={isOpen}
                            >
                              <SortMenuIcon size={14} />
                            </button>
                            {isOpen && (
                              <div className="absolute right-0 top-full mt-0.5 z-40 min-w-[160px] bg-white border border-gray-200 rounded shadow-lg py-1">
                                <button
                                  type="button"
                                  onClick={() => handleSort(c.key, "asc")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
                                >
                                  <SortAscIcon size={16} className="text-gray-600 flex-shrink-0" />
                                  Sort Ascending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSort(c.key, "desc")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
                                >
                                  <SortDescIcon size={16} className="text-gray-600 flex-shrink-0" />
                                  Sort Descending
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-4 text-center text-xs text-gray-500">
                    No contacts match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-[#F3F3F3]">
                    {columns.map((c) => (
                      <td key={c.key} className={`py-2.5 pr-4 text-gray-700 ${c.key === "select" ? "w-12 min-w-[3rem]" : ""}`}>
                        {typeof c.render === "function" ? c.render(r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {showPagination && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-600">
              Showing {start + 1}&ndash;{end} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                Previous
              </button>
              <span className="text-xs text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function daysSince(dateString) {
  if (!dateString) return Infinity;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return Infinity;
  const diffMs = Date.now() - d.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function formatDateDisplay(isoDateStr) {
  if (!isoDateStr) return "";
  const d = new Date(isoDateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDateStr;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

function sortRowsByKey(rows, key, dir) {
  if (!key || !dir) return rows;
  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return dir === "asc" ? 1 : -1;
    if (vb == null) return dir === "asc" ? -1 : 1;
    if (typeof va === "number" && typeof vb === "number") return dir === "asc" ? va - vb : vb - va;
    const sa = String(va);
    const sb = String(vb);
    return dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
  });
}

function canSendReengagement(contact) {
  if (!contact.lastReengagementAt) return true;
  return daysSince(contact.lastReengagementAt) >= 30;
}

const NAV_ITEMS = [
  { label: "Launchpad", active: false },
  { label: "Home", active: false },
  { label: "Campaigns", active: false },
  { label: "Performance", active: false },
  { label: "Manage Contacts", active: true },
  { label: "Reviews", active: false },
  { label: "Referral Program", active: false },
  { label: "Website", active: false },
];

export default function ContactStatusDashboard() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastActivityRange, setLastActivityRange] = useState("any");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [activityPicklistOpen, setActivityPicklistOpen] = useState(false);
  const [draftLastActivityRange, setDraftLastActivityRange] = useState("any");
  const [draftActivityStartDate, setDraftActivityStartDate] = useState("");
  const [draftActivityEndDate, setDraftActivityEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUnengagedIds, setSelectedUnengagedIds] = useState([]);
  const [pageUnengaged, setPageUnengaged] = useState(1);
  const [pageActive, setPageActive] = useState(1);
  const [pageInactive, setPageInactive] = useState(1);
  const [viewAcross, setViewAcross] = useState("all");
  const [tagFilterMode, setTagFilterMode] = useState("any");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagPicklistOpen, setTagPicklistOpen] = useState(false);
  const [draftTagFilterMode, setDraftTagFilterMode] = useState("any");
  const [draftSelectedTags, setDraftSelectedTags] = useState([]);
  const [listTagFilterMode, setListTagFilterMode] = useState("any");
  const [listSelectedTags, setListSelectedTags] = useState([]);
  const [listTagPicklistOpen, setListTagPicklistOpen] = useState(false);
  const [draftListTagFilterMode, setDraftListTagFilterMode] = useState("any");
  const [draftListSelectedTags, setDraftListSelectedTags] = useState([]);
  const [campaignType, setCampaignType] = useState("All campaigns");
  const [campaignTypePicklistOpen, setCampaignTypePicklistOpen] = useState(false);
  const [draftCampaignType, setDraftCampaignType] = useState("All campaigns");
  const [statusFilterPicklistOpen, setStatusFilterPicklistOpen] = useState(false);
  const [draftStatusFilter, setDraftStatusFilter] = useState("ALL");
  const [disabledContactIds, setDisabledContactIds] = useState([]);
  // When a disabled contact is enabled, their status becomes PENDING_VETTING (overrides CONTACTS status for display/filter)
  const [contactStatusOverrides, setContactStatusOverrides] = useState({});
  const [selectedActiveIds, setSelectedActiveIds] = useState([]);
  const [selectedInactiveDisabledIds, setSelectedInactiveDisabledIds] = useState([]);
  const [selectAllDialogOpen, setSelectAllDialogOpen] = useState(false);
  const [selectAllDialogSection, setSelectAllDialogSection] = useState(null); // 'unengaged' | 'active' | 'inactive'
  // Disable/Enable confirmation dialog: action = 'disableUnengaged' | 'disableActive' | 'enableInactive'
  const [confirmDisableEnableOpen, setConfirmDisableEnableOpen] = useState(false);
  const [confirmDisableEnableAction, setConfirmDisableEnableAction] = useState(null);
  const [confirmDisableEnableCount, setConfirmDisableEnableCount] = useState(0);
  // Dev-only phase toggles (for explanation; not part of product design)
  const [phase1, setPhase1] = useState(true);
  const [phase1_5, setPhase1_5] = useState(true);
  const [phase2, setPhase2] = useState(true);
  const [phase3, setPhase3] = useState(true);
  const [phase4, setPhase4] = useState(true);
  const [phaseTbd, setPhaseTbd] = useState(true);
  const [devFeatureAH, setDevFeatureAH] = useState(false);
  // Sort state per section (key = column key, dir = 'asc' | 'desc'); user stays on same page when sorting
  const [sortUnengaged, setSortUnengaged] = useState(null);
  const [sortActive, setSortActive] = useState(null);
  const [sortInactive, setSortInactive] = useState(null);
  // Feature AH: Contact Health tile selection (multi-select bucket keys)
  const [contactHealthSelectedBuckets, setContactHealthSelectedBuckets] = useState([]);
  const sectionUnengagedRef = useRef(null);
  const sectionActiveRef = useRef(null);
  const sectionInactiveRef = useRef(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [phase1PopoverOpen, setPhase1PopoverOpen] = useState(false);

  const listTagMode = listTagFilterMode ?? "any";
  const listTags = listSelectedTags ?? [];

  // Contacts with effective status (enabled contacts get PENDING_VETTING) and bucket (enabled-from-DISABLED move to ACTIVE)
  const effectiveContacts = useMemo(
    () =>
      CONTACTS.map((c) => {
        const status = contactStatusOverrides[c.id] ?? c.status;
        const bucket = contactStatusOverrides[c.id] === "PENDING_VETTING" ? "ACTIVE" : c.bucket;
        return { ...c, status, bucket };
      }),
    [contactStatusOverrides]
  );

  const isInLastActivityRange = (lastEventAtStr, range, startStr, endStr) => {
    if (!lastEventAtStr || range === "any") return true;
    const d = new Date(lastEventAtStr);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (range === "1" || range === "7" || range === "30") {
      const n = parseInt(range, 10);
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - n);
      cutoff.setHours(0, 0, 0, 0);
      return d >= cutoff && d <= today;
    }
    if (range === "custom" && startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return true;
  };

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = effectiveContacts.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (listTagMode === "any") {
        // no tag filter
      } else if (listTagMode === "specific") {
        if (!c.tags.some((t) => listTags.includes(t))) return false;
      } else {
        if (c.tags.length > 0) return false;
      }
      if (!isInLastActivityRange(c.lastEventAt, lastActivityRange, activityStartDate, activityEndDate)) return false;
      if (q && !(c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))) return false;
      return true;
    });
    if (viewAcross === "tags") {
      if (tagFilterMode === "any") {
        // no extra filter
      } else if (tagFilterMode === "specific") {
        list = list.filter((c) => c.tags.some((t) => selectedTags.includes(t)));
      } else {
        list = list.filter((c) => c.tags.length === 0);
      }
    }
    // Contact Health tile filter (Feature AH): union of selected buckets (use same reference date as tiles)
    if (devFeatureAH && contactHealthSelectedBuckets.length > 0) {
      list = list.filter((c) =>
        contactHealthSelectedBuckets.includes(
          getBucket(
            { status: c.status, lastEventAt: c.lastEventAt, lastEngagementDate: c.lastEventAt },
            CONTACT_HEALTH_REFERENCE_DATE
          )
        )
      );
    }
    return list;
  }, [effectiveContacts, statusFilter, listTagMode, listTags, lastActivityRange, activityStartDate, activityEndDate, search, viewAcross, tagFilterMode, selectedTags, devFeatureAH, contactHealthSelectedBuckets]);

  useEffect(() => {
    setPageUnengaged(1);
    setPageActive(1);
    setPageInactive(1);
  }, [statusFilter, listTagMode, listTags, lastActivityRange, activityStartDate, activityEndDate, search, disabledContactIds, contactHealthSelectedBuckets]);

  const openTagPicklist = () => {
    setDraftTagFilterMode(tagFilterMode);
    setDraftSelectedTags([...selectedTags]);
    setTagPicklistOpen(true);
  };

  const applyTagPicklist = () => {
    setTagFilterMode(draftTagFilterMode);
    setSelectedTags([...draftSelectedTags]);
    setTagPicklistOpen(false);
  };

  const cancelTagPicklist = () => {
    setTagPicklistOpen(false);
  };

  const toggleDraftTag = (tag) => {
    setDraftSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openListTagPicklist = () => {
    setDraftListTagFilterMode(listTagFilterMode);
    setDraftListSelectedTags([...listSelectedTags]);
    setListTagPicklistOpen(true);
  };

  const applyListTagPicklist = () => {
    setListTagFilterMode(draftListTagFilterMode);
    setListSelectedTags([...draftListSelectedTags]);
    setListTagPicklistOpen(false);
  };

  const cancelListTagPicklist = () => {
    setListTagPicklistOpen(false);
  };

  const toggleDraftListTag = (tag) => {
    setDraftListSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const listTagLabel =
    listTagMode === "any"
      ? "Any tags"
      : listTagMode === "specific"
        ? listTags.length
          ? `${listTags.length} tag${listTags.length !== 1 ? "s" : ""} selected`
          : "Select tags"
        : "No tags";

  const openCampaignTypePicklist = () => {
    setDraftCampaignType(campaignType);
    setCampaignTypePicklistOpen(true);
  };

  const applyCampaignTypePicklist = () => {
    setCampaignType(draftCampaignType);
    setCampaignTypePicklistOpen(false);
  };

  const cancelCampaignTypePicklist = () => {
    setCampaignTypePicklistOpen(false);
  };

  const openStatusFilterPicklist = () => {
    setDraftStatusFilter(statusFilter);
    setStatusFilterPicklistOpen(true);
  };

  const applyStatusFilterPicklist = () => {
    setStatusFilter(draftStatusFilter);
    setStatusFilterPicklistOpen(false);
  };

  const cancelStatusFilterPicklist = () => {
    setStatusFilterPicklistOpen(false);
  };

  const statusFilterLabel = statusFilter === "ALL" ? "Any status" : statusFilter;

  const clearFilters = () => {
    setStatusFilter("ALL");
    setDraftStatusFilter("ALL");
    setListTagFilterMode("any");
    setDraftListTagFilterMode("any");
    setListSelectedTags([]);
    setDraftListSelectedTags([]);
    setLastActivityRange("any");
    setDraftLastActivityRange("any");
    setActivityStartDate("");
    setActivityEndDate("");
    setDraftActivityStartDate("");
    setDraftActivityEndDate("");
    setSearch("");
  };

  const openActivityPicklist = () => {
    setDraftLastActivityRange(lastActivityRange);
    setDraftActivityStartDate(activityStartDate);
    setDraftActivityEndDate(activityEndDate);
    setActivityPicklistOpen(true);
  };

  const applyActivityPicklist = () => {
    setLastActivityRange(draftLastActivityRange);
    setActivityStartDate(draftActivityStartDate);
    setActivityEndDate(draftActivityEndDate);
    setActivityPicklistOpen(false);
  };

  const cancelActivityPicklist = () => {
    setActivityPicklistOpen(false);
  };

  const lastActivityLabel =
    lastActivityRange === "any"
      ? "Any"
      : lastActivityRange === "custom"
        ? activityStartDate && activityEndDate
          ? `Custom: ${formatDateDisplay(activityStartDate)} – ${formatDateDisplay(activityEndDate)}`
          : "Custom Date Range"
        : LAST_ACTIVITY_OPTIONS.find((o) => o.value === lastActivityRange)?.label ?? "Any";
  // Backward-compat aliases for any cached/legacy references
  const activityFilter = lastActivityRange;
  const activityLabel = lastActivityLabel;

  const unengaged = filteredContacts.filter((c) => c.bucket === "UNENGAGED" && !disabledContactIds.includes(c.id));
  const active = filteredContacts.filter((c) => c.bucket === "ACTIVE" && !disabledContactIds.includes(c.id));
  const inactive = filteredContacts.filter((c) => c.bucket === "INACTIVE" || disabledContactIds.includes(c.id));

  const sortedUnengaged = useMemo(
    () => sortRowsByKey(unengaged, sortUnengaged?.key, sortUnengaged?.dir),
    [unengaged, sortUnengaged]
  );
  const sortedActive = useMemo(
    () => sortRowsByKey(active, sortActive?.key, sortActive?.dir),
    [active, sortActive]
  );
  const sortedInactive = useMemo(
    () => sortRowsByKey(inactive, sortInactive?.key, sortInactive?.dir),
    [inactive, sortInactive]
  );

  const totalCount = filteredContacts.length;
  const unengagedCount = unengaged.length;
  const activeCount = active.length;
  const inactiveCount = inactive.length;

  const allUnengagedSelected = unengaged.length > 0 && selectedUnengagedIds.length === unengaged.length;

  const openSelectAllDialog = (section) => {
    setSelectAllDialogSection(section);
    setSelectAllDialogOpen(true);
  };
  const closeSelectAllDialog = () => {
    setSelectAllDialogOpen(false);
    setSelectAllDialogSection(null);
  };
  const confirmSelectAllAllPages = () => {
    if (selectAllDialogSection === "unengaged") setSelectedUnengagedIds(unengaged.map((c) => c.id));
    else if (selectAllDialogSection === "active") setSelectedActiveIds(active.map((c) => c.id));
    else if (selectAllDialogSection === "inactive") setSelectedInactiveDisabledIds(inactiveDisabled.map((c) => c.id));
    closeSelectAllDialog();
  };
  const confirmSelectAllCurrentPage = () => {
    if (selectAllDialogSection === "unengaged") {
      const start = (pageUnengaged - 1) * CONTACTS_PAGE_SIZE;
      setSelectedUnengagedIds(sortedUnengaged.slice(start, start + CONTACTS_PAGE_SIZE).map((c) => c.id));
    } else if (selectAllDialogSection === "active") {
      const start = (pageActive - 1) * CONTACTS_PAGE_SIZE;
      setSelectedActiveIds(sortedActive.slice(start, start + CONTACTS_PAGE_SIZE).map((c) => c.id));
    } else if (selectAllDialogSection === "inactive") {
      const start = (pageInactive - 1) * CONTACTS_PAGE_SIZE;
      const pageRows = sortedInactive.slice(start, start + CONTACTS_PAGE_SIZE);
      const disabledOnPage = pageRows.filter((c) => disabledContactIds.includes(c.id) || c.status === "DISABLED").map((c) => c.id);
      setSelectedInactiveDisabledIds(disabledOnPage);
    }
    closeSelectAllDialog();
  };

  const toggleSelectAllUnengaged = (checked) => {
    if (checked) {
      if (unengaged.length > CONTACTS_PAGE_SIZE) openSelectAllDialog("unengaged");
      else setSelectedUnengagedIds(unengaged.map((c) => c.id));
    } else setSelectedUnengagedIds([]);
  };

  const toggleSelectUnengaged = (id, checked) => {
    setSelectedUnengagedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const selectedUnengaged = unengaged.filter((c) => selectedUnengagedIds.includes(c.id));
  const selectedCount = selectedUnengaged.length;
  const allSelectedEligible = selectedCount > 0 && selectedUnengaged.every(canSendReengagement);

  const handleDisableUnengaged = () => {
    setDisabledContactIds((prev) => [...new Set([...prev, ...selectedUnengagedIds])]);
    setSelectedUnengagedIds([]);
  };

  const allActiveSelected = active.length > 0 && selectedActiveIds.length === active.length;
  const toggleSelectAllActive = (checked) => {
    if (checked) {
      if (active.length > CONTACTS_PAGE_SIZE) openSelectAllDialog("active");
      else setSelectedActiveIds(active.map((c) => c.id));
    } else setSelectedActiveIds([]);
  };
  const toggleSelectActive = (id, checked) => {
    setSelectedActiveIds((prev) => (checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
  };
  const selectedActiveCount = selectedActiveIds.length;
  const handleDisableActive = () => {
    setDisabledContactIds((prev) => [...new Set([...prev, ...selectedActiveIds])]);
    setSelectedActiveIds([]);
  };

  const inactiveDisabled = inactive.filter((c) => disabledContactIds.includes(c.id) || c.status === "DISABLED");
  const allInactiveDisabledSelected = inactiveDisabled.length > 0 && selectedInactiveDisabledIds.length === inactiveDisabled.length;
  const toggleSelectAllInactiveDisabled = (checked) => {
    if (checked) {
      if (inactiveDisabled.length > CONTACTS_PAGE_SIZE) openSelectAllDialog("inactive");
      else setSelectedInactiveDisabledIds(inactiveDisabled.map((c) => c.id));
    } else setSelectedInactiveDisabledIds([]);
  };
  const toggleSelectInactiveDisabled = (id, checked) => {
    setSelectedInactiveDisabledIds((prev) => (checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
  };
  const selectedInactiveDisabledCount = selectedInactiveDisabledIds.length;
  const handleEnableInactive = () => {
    setDisabledContactIds((prev) => prev.filter((id) => !selectedInactiveDisabledIds.includes(id)));
    setContactStatusOverrides((prev) => {
      const next = { ...prev };
      selectedInactiveDisabledIds.forEach((id) => {
        next[id] = "PENDING_VETTING";
      });
      return next;
    });
    setSelectedInactiveDisabledIds([]);
  };

  const openConfirmDisableUnengaged = () => {
    setConfirmDisableEnableAction("disableUnengaged");
    setConfirmDisableEnableCount(selectedUnengagedIds.length);
    setConfirmDisableEnableOpen(true);
  };
  const openConfirmDisableActive = () => {
    setConfirmDisableEnableAction("disableActive");
    setConfirmDisableEnableCount(selectedActiveIds.length);
    setConfirmDisableEnableOpen(true);
  };
  const openConfirmEnableInactive = () => {
    setConfirmDisableEnableAction("enableInactive");
    setConfirmDisableEnableCount(selectedInactiveDisabledIds.length);
    setConfirmDisableEnableOpen(true);
  };
  const confirmDisableEnableYes = () => {
    if (confirmDisableEnableAction === "disableUnengaged") handleDisableUnengaged();
    else if (confirmDisableEnableAction === "disableActive") handleDisableActive();
    else if (confirmDisableEnableAction === "enableInactive") handleEnableInactive();
    setConfirmDisableEnableOpen(false);
    setConfirmDisableEnableAction(null);
    setConfirmDisableEnableCount(0);
  };
  const closeConfirmDisableEnable = () => {
    setConfirmDisableEnableOpen(false);
    setConfirmDisableEnableAction(null);
    setConfirmDisableEnableCount(0);
  };

  const unengagedColumns = [
    {
      key: "select",
      label: (
        <div className="flex w-full items-center justify-center">
          <input
            type="checkbox"
            aria-label="Select all unengaged contacts"
            checked={allUnengagedSelected}
            onChange={(e) => toggleSelectAllUnengaged(e.target.checked)}
          />
        </div>
      ),
      render: (r) => (
        <div className="flex w-full items-center justify-center">
          <input
            type="checkbox"
            aria-label={`Select ${r.name}`}
            checked={selectedUnengagedIds.includes(r.id)}
            onChange={(e) => toggleSelectUnengaged(r.id, e.target.checked)}
          />
        </div>
      ),
    },
    { key: "name", label: "Contact" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (r) => <Pill tone={STATUS_COLORS[r.status] || "orange"}>{r.status}</Pill>,
    },
    {
      key: "daysUnengaged",
      label: (
        <span>
          <span className="block">Days unengaged</span>
          <span className="block text-[11px] text-gray-500 font-normal">out of 365</span>
        </span>
      ),
      render: (r) => (
        <span>
          {r.daysUnengaged} days
          <span className="block text-[11px] text-gray-500">
            ~{365 - Math.min(r.daysUnengaged, 365)} days until sunset
          </span>
        </span>
      ),
    },
    { key: "lastEventAt", label: "Last activity" },
    {
      key: "lastReengagementAt",
      label: "Re-engagement sent",
      render: (r) => (
        <span className="text-xs text-gray-600">
          {r.lastReengagementAt ? r.lastReengagementAt : "—"}
        </span>
      ),
    },
  ];

  const activeColumns = [
    {
      key: "select",
      label: (
        <div className="flex w-full items-center justify-center">
          <input
            type="checkbox"
            aria-label="Select all active contacts"
            checked={allActiveSelected}
            onChange={(e) => toggleSelectAllActive(e.target.checked)}
          />
        </div>
      ),
      render: (r) => (
        <div className="flex w-full items-center justify-center">
          <input
            type="checkbox"
            aria-label={`Select ${r.name}`}
            checked={selectedActiveIds.includes(r.id)}
            onChange={(e) => toggleSelectActive(r.id, e.target.checked)}
          />
        </div>
      ),
    },
    { key: "name", label: "Contact" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (r) => <Pill tone={STATUS_COLORS[r.status] || "green"}>{r.status}</Pill>,
    },
    { key: "lastEventAt", label: "Last activity" },
    {
      key: "reason",
      label: "Notes",
      render: (r) => <span className="text-gray-600 text-xs">{r.reason}</span>,
    },
  ];

  const inactiveColumns = [
    {
      key: "select",
      label: (
        <div className="flex w-full items-center justify-center">
          {inactiveDisabled.length > 0 ? (
            <input
              type="checkbox"
              aria-label="Select all disabled contacts"
              checked={allInactiveDisabledSelected}
              onChange={(e) => toggleSelectAllInactiveDisabled(e.target.checked)}
            />
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
      render: (r) =>
        disabledContactIds.includes(r.id) || r.status === "DISABLED" ? (
          <div className="flex w-full items-center justify-center">
            <input
              type="checkbox"
              aria-label={`Select ${r.name}`}
              checked={selectedInactiveDisabledIds.includes(r.id)}
              onChange={(e) => toggleSelectInactiveDisabled(r.id, e.target.checked)}
            />
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    { key: "name", label: "Contact" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (r) =>
        disabledContactIds.includes(r.id) || r.status === "DISABLED" ? (
          <Pill tone="gray">Disabled</Pill>
        ) : (
          <Pill tone={STATUS_COLORS[r.status] || "gray"}>{r.status}</Pill>
        ),
    },
    { key: "lastEventAt", label: "Last activity" },
    {
      key: "reason",
      label: "Inactive Reason",
      render: (r) => <span className="text-gray-600 text-xs">{r.reason}</span>,
    },
  ];

  if (exportPreviewRows !== null) {
    return (
      <ExportPreview
        exportRows={exportPreviewRows}
        onBack={() => setExportPreviewRows(null)}
      />
    );
  }

  return (
    <TooltipProvider>
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        effectiveContacts={effectiveContacts}
        filteredContacts={filteredContacts}
        referenceDate={CONTACT_HEALTH_REFERENCE_DATE}
        onPreviewExport={(rows) => setExportPreviewRows(rows)}
      />
      <div className="flex min-h-screen bg-[#F3F3F3] text-gray-800">
        {/* Sidebar - dark gray with green active state */}
        <aside className="w-56 flex-shrink-0 bg-sidebar flex flex-col text-white">
          {/* Logo + notification badge */}
          <div className="p-4 flex justify-center">
            <div className="relative inline-flex">
              <span className="w-9 h-9 rounded flex items-center justify-center text-white border border-white/30">
                <MailIcon size={20} className="text-white" strokeWidth={1.5} />
              </span>
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-gray-500 flex items-center justify-center text-[10px] font-medium text-white">
                1
              </span>
            </div>
          </div>
          <nav className="flex-1 px-3 py-3 space-y-0.5" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`w-full text-left block px-3 py-2.5 rounded text-sm font-medium ${
                  item.active ? "bg-sidebar-active text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {/* Separator */}
          <div className="border-t border-white/20 mx-3" />
          {/* Contact us */}
          <div className="p-4 space-y-3 text-sm">
            <div className="text-gray-300 font-medium">Contact us</div>
            <div className="flex items-center gap-2 text-gray-300">
              <MailIcon size={14} className="text-white flex-shrink-0" />
              <span>Email</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <PhoneIcon size={14} className="text-white flex-shrink-0" />
              <span>888.988.5526</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <HelpIcon size={14} className="text-white flex-shrink-0" />
              <span>Help</span>
            </div>
          </div>
          {/* Dev-only phase toggles - for explanation only, not part of design */}
          <div className="mx-3 mt-2 p-3 rounded-lg border-2 border-amber-400 bg-amber-50/95 space-y-3">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">Dev phases</div>
            {[
              { label: "Phase 1", checked: phase1, onChange: setPhase1 },
              { label: "Phase 1.5", checked: phase1_5, onChange: setPhase1_5 },
              { label: "Phase 2", checked: phase2, onChange: setPhase2 },
              { label: "Phase 3", checked: phase3, onChange: setPhase3 },
              { label: "Phase 4", checked: phase4, onChange: setPhase4 },
              { label: "Phase TBD", checked: phaseTbd, onChange: setPhaseTbd },
              { label: "Feature AH", checked: devFeatureAH, onChange: setDevFeatureAH },
            ].map(({ label, checked, onChange }) => (
              <label key={label} className="flex items-center justify-between gap-2 cursor-pointer text-gray-800 text-sm">
                <span className="font-medium">{label}</span>
                <span
                  role="switch"
                  aria-checked={checked}
                  tabIndex={0}
                  onClick={(e) => { e.preventDefault(); onChange(!checked); }}
                  onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${checked ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
                    style={{ marginTop: 2 }}
                  />
                </span>
              </label>
            ))}
          </div>
          {/* User profile */}
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-sidebar-active flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                JD
              </div>
              <button type="button" className="self-start mt-0.5 text-white/90 hover:text-white" aria-label="Profile menu">
                <ChevronUpIcon size={14} className="text-white" />
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-300 leading-tight">
              <div className="font-medium">Jane</div>
              <div className="font-medium">Doe</div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header bar - sky blue */}
          <header className="bg-header-bar text-white px-6 py-4 flex-shrink-0">
            <h1 className="text-xl font-bold">Contact Status Dashboard</h1>
          </header>

          {/* Phase 1: Back to contacts link */}
          {phase1 && (
            <div className="px-6 py-2 bg-[#F3F3F3] border-b border-gray-200">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 no-underline hover:text-gray-900"
                onClick={(e) => e.preventDefault()}
              >
                <ChevronLeftIcon size={18} className="text-gray-800" />
                Back to contacts
              </a>
            </div>
          )}

          {/* Phase 1: Subheader description */}
          {phase1 && (
            <div className="px-6 py-3 border-b border-gray-200 bg-[#F3F3F3]">
              <p className="text-sm text-gray-600">
                Read-only view of your list health: who is unengaged, who is safe to send to, and who is inactive.
              </p>
            </div>
          )}

          <div className="p-6 space-y-6 flex-1">
            {/* Phase 4: Core Deliverability Metrics */}
            {phase4 && (
            <section aria-labelledby="core-deliverability-metrics" className="border border-gray-300 rounded-lg bg-white shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 pb-2">
                <h2 id="core-deliverability-metrics" className="text-lg font-semibold text-gray-800">
                  Core deliverability metrics (last 30 days)
                </h2>
                <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                  <span className="text-sm text-gray-600">View across:</span>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
                    aria-label="View metrics across"
                    value={viewAcross}
                    onChange={(e) => setViewAcross(e.target.value)}
                  >
                    <option value="all">All campaigns</option>
                    <option value="tags">By tag</option>
                    <option value="campaignType">Campaign Type</option>
                  </select>
                  {viewAcross === "tags" && (
                    <div className="relative">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        onClick={openTagPicklist}
                      >
                        {tagFilterMode === "any"
                          ? "Any tags"
                          : tagFilterMode === "specific"
                            ? selectedTags.length
                              ? `${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""} selected`
                              : "Select tags"
                            : "No tags"}
                      </button>
                      {tagPicklistOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[100]"
                            aria-hidden="true"
                            onClick={cancelTagPicklist}
                          />
                          <div className="absolute left-full top-0 ml-1 z-[110] w-80 max-h-[420px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col border-l-2 border-l-[#68BCE1]">
                            <p className="text-sm font-medium text-gray-800 mb-3">Show metrics for contacts that are:</p>
                            <div className="space-y-3 flex-shrink-0">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="tagFilterMode"
                                  checked={draftTagFilterMode === "any"}
                                  onChange={() => setDraftTagFilterMode("any")}
                                  className="rounded-full border-gray-300 text-[#2db3a8] focus:ring-[#2db3a8]"
                                />
                                <span className="text-sm text-gray-800">Any tags</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="tagFilterMode"
                                  checked={draftTagFilterMode === "specific"}
                                  onChange={() => setDraftTagFilterMode("specific")}
                                  className="rounded-full border-gray-300 text-[#2db3a8] focus:ring-[#2db3a8]"
                                />
                                <span className="text-sm text-gray-800">Specific tags</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="tagFilterMode"
                                  checked={draftTagFilterMode === "none"}
                                  onChange={() => setDraftTagFilterMode("none")}
                                  className="rounded-full border-gray-300 text-[#2db3a8] focus:ring-[#2db3a8]"
                                />
                                <span className="text-sm text-gray-800">No tags</span>
                              </label>
                            </div>
                            {draftTagFilterMode === "specific" && (
                              <div className="mt-3 flex-1 min-h-0 overflow-auto">
                                <div className="flex flex-wrap gap-2">
                                  {ALL_CONTACT_TAGS.map((tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => toggleDraftTag(tag)}
                                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                                        draftSelectedTags.includes(tag)
                                          ? "bg-[#60B570] text-white"
                                          : "bg-[#68BCE1]/80 text-white"
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 uppercase"
                                onClick={cancelTagPicklist}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2db3a8] rounded hover:opacity-90 uppercase"
                                onClick={applyTagPicklist}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {viewAcross === "campaignType" && (
                    <div className="relative">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        onClick={openCampaignTypePicklist}
                      >
                        {campaignType}
                      </button>
                      {campaignTypePicklistOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-[100]"
                            aria-hidden="true"
                            onClick={cancelCampaignTypePicklist}
                          />
                          <div className="absolute left-full top-0 ml-1 z-[110] w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col border-l-2 border-l-[#68BCE1]">
                            <div className="space-y-2 flex-shrink-0">
                              {CAMPAIGN_TYPE_OPTIONS.map((option) => (
                                <label
                                  key={option}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="campaignType"
                                    checked={draftCampaignType === option}
                                    onChange={() => setDraftCampaignType(option)}
                                    className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]"
                                  />
                                  <span className="text-sm text-gray-800">{option}</span>
                                </label>
                              ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 uppercase"
                                onClick={cancelCampaignTypePicklist}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2a7fb8] rounded hover:opacity-90 uppercase"
                                onClick={applyCampaignTypePicklist}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 pb-4">
                {METRICS.map((m) => (
                  <MetricCard
                    key={m.key}
                    label={m.label}
                    value={m.value}
                    unit={m.unit}
                    tooltip={m.tooltip}
                  />
                ))}
              </div>
            </section>
            )}

            {/* Unified Contact Health control panel card */}
            <Card className="shadow-sm" aria-labelledby="contact-health-panel-title">
              <CardContent className="p-4 space-y-4">
                {/* Header row: title + (Phase 1) info popover; subtitle under title */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 id="contact-health-panel-title" className="text-lg font-semibold text-gray-800">
                        Contact Health
                      </h2>
                      {phase1 && (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setPhase1PopoverOpen((prev) => !prev)}
                            onBlur={() => setPhase1PopoverOpen(false)}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            aria-label="How statuses work"
                            aria-expanded={phase1PopoverOpen}
                          >
                            <InfoIcon size={16} className="text-gray-500" />
                          </button>
                          {phase1PopoverOpen && (
                            <>
                              <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setPhase1PopoverOpen(false)} />
                              <div className="absolute left-0 top-full mt-1 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 border-l-2 border-l-[#68BCE1]">
                                <p className="text-sm font-semibold text-gray-800 mb-2">How statuses work</p>
                                <p className="text-sm text-gray-700 mb-3">
                                  Each contact has a status that controls whether they can receive campaigns. Unengaged contacts are still sendable but at risk of sunset; inactive statuses (e.g. SUNSET, UNSUBSCRIBED) are read-only.
                                </p>
                                <button
                                  type="button"
                                  className="text-sm font-medium text-[#2a7fb8] hover:underline"
                                  onClick={() => {}}
                                >
                                  Open Contact Status Guide
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {devFeatureAH && <p className="text-sm text-gray-500 mt-0.5">Click a tile to filter contacts.</p>}
                  </div>
                </div>

                {/* Tile row: Feature AH gated */}
                {devFeatureAH && (
                  <ContactHealthTiles
                    hideHeader
                    referenceDate={CONTACT_HEALTH_REFERENCE_DATE}
                    contacts={effectiveContacts.map((c) => ({
                      status: c.status,
                      lastEngagementDate: c.lastEventAt ?? c.lastEngagementDate ?? null,
                    }))}
                    selectedBuckets={contactHealthSelectedBuckets}
                    onToggleBucket={(bucketKey) => {
                      const isAdding = !contactHealthSelectedBuckets.includes(bucketKey);
                      setContactHealthSelectedBuckets((prev) =>
                        prev.includes(bucketKey) ? prev.filter((k) => k !== bucketKey) : [...prev, bucketKey]
                      );
                      if (isAdding) {
                        setTimeout(() => {
                          if (bucketKey === "ACTIVE" || bucketKey === "IN_VETTING") sectionActiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          else if (bucketKey === "UNENGAGED") sectionUnengagedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          else if (bucketKey === "SUPPRESSED" || bucketKey === "UNSUBSCRIBED" || bucketKey === "DISABLED") sectionInactiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 0);
                      }
                    }}
                    onRemoveBucket={(bucketKey) => {
                      setContactHealthSelectedBuckets((prev) => prev.filter((k) => k !== bucketKey));
                    }}
                    onClearFilter={() => setContactHealthSelectedBuckets([])}
                  />
                )}

                {/* Toolbar row: Phase 2 (Search + Advanced Search toggle) + Phase TBD (Export) */}
                {phase2 && (
                  <>
                    <div className="flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-gray-600 mb-1">Search</label>
                        <div className="relative">
                          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Search name or email"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 pl-9 text-sm bg-white text-gray-800"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAdvancedOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded border ${
                          isAdvancedOpen ? "border-[#2a7fb8] bg-[#2a7fb8]/10 text-[#2a7fb8]" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                        aria-expanded={isAdvancedOpen}
                        aria-label={isAdvancedOpen ? "Close Advanced Search Options" : "Open Advanced Search Options"}
                      >
                        <FilterIcon size={18} className={isAdvancedOpen ? "text-[#2a7fb8]" : "text-gray-500"} />
                        Advanced Search Options
                      </button>
                      {phaseTbd && (
                        <button
                          type="button"
                          onClick={() => setExportDialogOpen(true)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          aria-label="Export contacts"
                        >
                          <DownloadIcon size={18} className="text-gray-600" />
                          Export
                        </button>
                      )}
                    </div>

                    {/* Filter counts summary line: Phase 2 */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 border-t border-gray-200 pt-3">
                      <div className="inline-flex items-center gap-1">
                        <FilterIcon size={14} className="text-gray-500" />
                        <span>
                          Showing <span className="font-semibold text-gray-800">{totalCount}</span> contact
                          {totalCount !== 1 && "s"} matching the current filters
                        </span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>
                        <span className="font-semibold text-gray-800">{unengagedCount}</span> unengaged at risk •
                        <span className="font-semibold text-gray-800 ml-1">{activeCount}</span> active/pending •
                        <span className="font-semibold text-gray-800 ml-1">{inactiveCount}</span> inactive
                      </span>
                    </div>
                  </>
                )}

                {/* Advanced Search Options panel: Phase 2 + collapsible */}
                {phase2 && isAdvancedOpen && (
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6 flex-wrap">
                      <div className="w-full md:w-52 relative">
                        <label className="block text-xs text-gray-600 mb-1">Status filter</label>
                        <button
                          type="button"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-800 text-left hover:bg-gray-50 flex items-center justify-between"
                          onClick={openStatusFilterPicklist}
                        >
                          <span>{statusFilterLabel}</span>
                          <span className="text-gray-400">▼</span>
                        </button>
                        {statusFilterPicklistOpen && (
                          <>
                            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={cancelStatusFilterPicklist} />
                            <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col border-l-2 border-l-[#68BCE1]">
                              <p className="text-sm font-medium text-gray-700 mb-3">Show contacts that are:</p>
                              <div className="space-y-2 flex-shrink-0">
                                {STATUS_FILTER_OPTIONS.map((opt) => (
                                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="statusFilter"
                                      checked={draftStatusFilter === opt.value}
                                      onChange={() => setDraftStatusFilter(opt.value)}
                                      className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]"
                                    />
                                    <span className={`text-sm ${draftStatusFilter === opt.value ? "text-gray-800 font-medium" : "text-gray-600"}`}>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
                                <button type="button" className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 uppercase" onClick={cancelStatusFilterPicklist}>Cancel</button>
                                <button type="button" className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2a7fb8] rounded hover:opacity-90 uppercase" onClick={applyStatusFilterPicklist}>Apply</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-full md:w-52 relative">
                        <label className="block text-xs text-gray-600 mb-1">Tag</label>
                        <button
                          type="button"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-800 text-left hover:bg-gray-50 flex items-center justify-between"
                          onClick={openListTagPicklist}
                        >
                          <span>{listTagLabel}</span>
                          <span className="text-gray-400">▼</span>
                        </button>
                        {listTagPicklistOpen && (
                          <>
                            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={cancelListTagPicklist} />
                            <div className="absolute left-0 top-full mt-1 z-50 w-80 max-h-[420px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col border-l-2 border-l-[#68BCE1]">
                              <p className="text-sm font-medium text-gray-800 mb-3">Show metrics for contacts that are:</p>
                              <div className="space-y-3 flex-shrink-0">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="listTagFilterMode" checked={draftListTagFilterMode === "any"} onChange={() => setDraftListTagFilterMode("any")} className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]" />
                                  <span className="text-sm text-gray-800">Any tags</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="listTagFilterMode" checked={draftListTagFilterMode === "specific"} onChange={() => setDraftListTagFilterMode("specific")} className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]" />
                                  <span className="text-sm text-gray-800">Specific tags</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="listTagFilterMode" checked={draftListTagFilterMode === "none"} onChange={() => setDraftListTagFilterMode("none")} className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]" />
                                  <span className="text-sm text-gray-800">No tags</span>
                                </label>
                              </div>
                              {draftListTagFilterMode === "specific" && (
                                <div className="mt-3 flex-1 min-h-0 overflow-auto">
                                  <div className="flex flex-wrap gap-2">
                                    {ALL_CONTACT_TAGS.map((tag) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleDraftListTag(tag)}
                                        className={`px-2.5 py-1 rounded text-xs font-medium ${draftListSelectedTags.includes(tag) ? "bg-[#60B570] text-white" : "bg-[#68BCE1]/80 text-white"}`}
                                      >
                                        {tag}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
                                <button type="button" className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 uppercase" onClick={cancelListTagPicklist}>Cancel</button>
                                <button type="button" className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2db3a8] rounded hover:opacity-90 uppercase" onClick={applyListTagPicklist}>Apply</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-full md:w-52 relative">
                        <label className="block text-xs text-gray-600 mb-1">Last Activity</label>
                        <button
                          type="button"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-800 text-left hover:bg-gray-50 flex items-center justify-between"
                          onClick={openActivityPicklist}
                        >
                          <span>{lastActivityLabel}</span>
                          <span className="text-gray-400">▼</span>
                        </button>
                        {activityPicklistOpen && (
                          <>
                            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={cancelActivityPicklist} />
                            <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col border-l-2 border-l-[#68BCE1]">
                              <p className="text-sm font-bold text-gray-800 mb-3">Show contacts with activity in:</p>
                              <div className="space-y-2 flex-shrink-0">
                                {LAST_ACTIVITY_OPTIONS.map((opt) => (
                                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                                    <input type="radio" name="lastActivityRange" checked={draftLastActivityRange === opt.value} onChange={() => setDraftLastActivityRange(opt.value)} className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]" />
                                    <span className={`text-sm ${draftLastActivityRange === opt.value ? "text-gray-800 font-medium" : "text-gray-600"}`}>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                              {draftLastActivityRange === "custom" && (
                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Start date</label>
                                    <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-800" value={draftActivityStartDate} onChange={(e) => setDraftActivityStartDate(e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">End date</label>
                                    <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-800" value={draftActivityEndDate} onChange={(e) => setDraftActivityEndDate(e.target.value)} />
                                  </div>
                                </div>
                              )}
                              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
                                <button type="button" className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 uppercase" onClick={cancelActivityPicklist}>Cancel</button>
                                <button type="button" className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2a7fb8] rounded hover:opacity-90 uppercase" onClick={applyActivityPicklist}>Apply</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <button type="button" onClick={clearFilters} className="px-3 py-2 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                        Clear filters
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase TBD: Unengaged contacts at risk of sunset */}
            {phaseTbd && (
            <section ref={sectionUnengagedRef} className="space-y-3">
              <SectionTable
                title="Unengaged contacts at risk of sunset"
                badgeTone="orange"
                description="Contacts who have not engaged recently and will be sunset after 365 days of inactivity. Use a reengagement campaign or disable them if you no longer want them on campaigns."
                rows={sortedUnengaged}
                columns={phase3 ? unengagedColumns : unengagedColumns.filter((c) => c.key !== "select")}
                sortConfig={phaseTbd ? sortUnengaged : null}
                onSort={phaseTbd ? (key, dir) => setSortUnengaged({ key, dir: dir ?? "asc" }) : undefined}
                actionBar={
                  phase3 && selectedUnengagedIds.length > 0 ? (
                    <button
                      type="button"
                      className="mt-2.5 px-3 py-1.5 text-sm font-medium rounded bg-[#6B8394] text-white hover:bg-[#00AFEF] hover:text-white transition-colors"
                      onClick={openConfirmDisableUnengaged}
                    >
                      Disable
                    </button>
                  ) : null
                }
                pageSize={CONTACTS_PAGE_SIZE}
                currentPage={pageUnengaged}
                onPageChange={setPageUnengaged}
              />
            </section>
            )}

            {/* Phase 1: Section 3 - Inactive contacts */}
            {phase1 && (
            <section ref={sectionInactiveRef}>
              <SectionTable
                title="Inactive contacts"
                badgeTone="gray"
                description="Contacts that can no longer receive campaigns from you (for example SUNSET, UNSUBSCRIBED, or SPAM_REPORT). Disabled contacts can be re-enabled."
                rows={sortedInactive}
                columns={phase3 ? inactiveColumns : inactiveColumns.filter((c) => c.key !== "select")}
                sortConfig={phaseTbd ? sortInactive : null}
                onSort={phaseTbd ? (key, dir) => setSortInactive({ key, dir: dir ?? "asc" }) : undefined}
                actionBar={
                  phase3 && selectedInactiveDisabledIds.length > 0 ? (
                    <button
                      type="button"
                      className="mt-2.5 px-3 py-1.5 text-sm font-medium rounded bg-[#6B8394] text-white hover:bg-[#00AFEF] hover:text-white transition-colors"
                      onClick={openConfirmEnableInactive}
                    >
                      Enable
                    </button>
                  ) : null
                }
                pageSize={CONTACTS_PAGE_SIZE}
                currentPage={pageInactive}
                onPageChange={setPageInactive}
              />
            </section>
            )}

            {/* Phase 1.5: Active / Pending vetting */}
            {phase1 && phase1_5 && (
            <section ref={sectionActiveRef}>
              <SectionTable
                title="Active & pending (vetting) contacts"
                badgeTone="green"
                description="Contacts who are safe to send to. Green = fully active, Blue = still in a light vetting period."
                rows={sortedActive}
                columns={phase3 ? activeColumns : activeColumns.filter((c) => c.key !== "select")}
                sortConfig={phaseTbd ? sortActive : null}
                onSort={phaseTbd ? (key, dir) => setSortActive({ key, dir: dir ?? "asc" }) : undefined}
                actionBar={
                  phase3 && selectedActiveIds.length > 0 ? (
                    <button
                      type="button"
                      className="mt-2.5 px-3 py-1.5 text-sm font-medium rounded bg-[#6B8394] text-white hover:bg-[#00AFEF] hover:text-white transition-colors"
                      onClick={openConfirmDisableActive}
                    >
                      Disable
                    </button>
                  ) : null
                }
                pageSize={CONTACTS_PAGE_SIZE}
                currentPage={pageActive}
                onPageChange={setPageActive}
              />
            </section>
            )}
          </div>
        </main>
      </div>

      {/* Disable/Enable confirmation dialog */}
      <Dialog open={confirmDisableEnableOpen} onOpenChange={(open) => { if (!open) closeConfirmDisableEnable(); }}>
        <DialogContent className="max-w-md">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader className="flex-1">
              <DialogTitle>
                {confirmDisableEnableAction === "enableInactive" ? "Enable contacts" : "Disable contacts"}
              </DialogTitle>
            </DialogHeader>
            <button
              type="button"
              aria-label="Close"
              className="shrink-0 rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              onClick={closeConfirmDisableEnable}
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {confirmDisableEnableAction === "enableInactive"
              ? `Are you sure you want to Enable ${confirmDisableEnableCount} contact${confirmDisableEnableCount !== 1 ? "s" : ""}?`
              : `Are you sure you want to Disable ${confirmDisableEnableCount} contact${confirmDisableEnableCount !== 1 ? "s" : ""}?`}
          </p>
          <DialogFooter className="mt-4 flex justify-start gap-2 border-t pt-4">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300"
              onClick={closeConfirmDisableEnable}
            >
              No
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300"
              onClick={confirmDisableEnableYes}
            >
              Yes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select All Records confirmation dialog */}
      <Dialog open={selectAllDialogOpen} onOpenChange={(open) => { setSelectAllDialogOpen(open); if (!open) setSelectAllDialogSection(null); }}>
        <DialogContent className="max-w-md">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader className="flex-1">
              <DialogTitle>Select All Records</DialogTitle>
            </DialogHeader>
            <button
              type="button"
              aria-label="Close"
              className="shrink-0 rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              onClick={closeSelectAllDialog}
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <HelpIcon size={20} className="text-blue-600" />
            </span>
            <p className="text-sm text-gray-700">
              Expand your selection to include all{" "}
              <span className="font-semibold">
                {selectAllDialogSection === "unengaged"
                  ? unengaged.length
                  : selectAllDialogSection === "active"
                    ? active.length
                    : selectAllDialogSection === "inactive"
                      ? inactiveDisabled.length
                      : 0}
              </span>{" "}
              records?
            </p>
          </div>
          <DialogFooter className="mt-4 flex justify-start gap-2 border-t pt-4">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300"
              onClick={confirmSelectAllAllPages}
            >
              Yes
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded hover:bg-gray-300"
              onClick={confirmSelectAllCurrentPage}
            >
              No
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
