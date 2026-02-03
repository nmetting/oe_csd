/**
 * Export utilities: effective status, inactive reason mapping, and export row filtering.
 */

const SUPPRESSED_STATUSES = [
  "SPAM_REPORT", "DEDUPED", "BLOCKED", "BLOCKED_DOMAIN", "GLOBAL_BLOCKED_DOMAIN",
  "ROLE", "CUSTOMER", "PERM_DELETE", "CANCELED", "CANCELED_DURING_TESTING", "CANCELED_DISABLED",
  "DISABLED_DURING_TESTING", "CANCELED_DISABLED_DURING_TESTING", "SUNSET",
];
const IN_VETTING_STATUSES = ["TESTING", "VETTING", "PENDING_VETTING"];

function getDaysSinceLastActivity(lastActivity, referenceDate) {
  if (lastActivity == null) return 9999;
  const d = typeof lastActivity === "string" ? new Date(lastActivity) : lastActivity;
  if (Number.isNaN(d.getTime())) return 9999;
  const t = referenceDate ? new Date(referenceDate) : new Date();
  t.setHours(0, 0, 0, 0);
  const dateOnly = new Date(d);
  dateOnly.setHours(0, 0, 0, 0);
  const days = Math.floor((t - dateOnly) / (24 * 60 * 60 * 1000));
  return days < 0 ? 0 : days;
}

function normalizeStatus(status) {
  if (status === "ACTIVE") return "GOOD_TO_GO";
  if (status === "PENDING_VETTING") return "VETTING";
  return status;
}

/**
 * Effective status for export: ACTIVE/GOOD_TO_GO with lastActivity > 365 → SUNSET; else status.
 */
export function getEffectiveStatus(contact, referenceDate) {
  const status = normalizeStatus(contact.status);
  const lastActivity = contact.lastActivity ?? contact.lastEventAt ?? contact.lastEngagementDate ?? null;
  const days = getDaysSinceLastActivity(lastActivity, referenceDate);
  if ((status === "ACTIVE" || status === "GOOD_TO_GO") && days > 365) return "SUNSET";
  return contact.status; // return raw status for display; we map SUNSET derived elsewhere
}

/**
 * Get effective status string for display (SUNSET when derived).
 */
export function getEffectiveStatusDisplay(contact, referenceDate) {
  const status = normalizeStatus(contact.status);
  const lastActivity = contact.lastActivity ?? contact.lastEventAt ?? contact.lastEngagementDate ?? null;
  const days = getDaysSinceLastActivity(lastActivity, referenceDate);
  if ((status === "ACTIVE" || status === "GOOD_TO_GO") && days > 365) return "SUNSET";
  return contact.status;
}

/** Customer-facing inactive reason from status (when inactiveReason is null). */
export const INACTIVE_REASON_MAP = {
  DEDUPED: "Owned by another account",
  BLOCKED: "Marked as bad email",
  UNSUBSCRIBED: "Opted out via unsubscribe link",
  BLOCKED_DOMAIN: "Domain blocked during testing",
  GLOBAL_BLOCKED_DOMAIN: "Domain blocked system-wide",
  SPAM_REPORT: "Marked as spam by recipient",
  CANCELED: "Was active before being canceled",
  CANCELED_DURING_TESTING: "Was in testing before being canceled",
  DISABLED: "Disabled by user",
  ROLE: "Role-based email detected",
  CUSTOMER: "Suppressed (current customer email)",
  PERM_DELETE: "Permanently removed",
  CANCELED_DISABLED: "Was disabled before being canceled",
  DISABLED_DURING_TESTING: "Disabled during testing",
  CANCELED_DISABLED_DURING_TESTING: "Disabled during testing before being canceled",
  SUNSET: "Inactive due to no engagement",
  GOOD_TO_GO: "",
  ACTIVE: "",
  PENDING_VETTING: "",
  TESTING: "",
  VETTING: "",
};

export function getInactiveReasonDisplay(contact, effectiveStatus) {
  const raw = contact.inactiveReason ?? contact.reason ?? null;
  if (raw) return raw;
  const mapped = INACTIVE_REASON_MAP[effectiveStatus] ?? INACTIVE_REASON_MAP[contact.status] ?? "";
  if (mapped) return mapped;
  if (effectiveStatus === "ACTIVE" || effectiveStatus === "GOOD_TO_GO") return "Active — receiving emails";
  if (["PENDING_VETTING", "TESTING", "VETTING"].includes(effectiveStatus)) return "Pending — validating";
  return "";
}

/** Exportable status/bucket options for the Export dialog. */
export const EXPORT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active (GOOD_TO_GO / ACTIVE)", type: "bucket" },
  { value: "PENDING_VETTING", label: "In Vetting (TESTING / VETTING / PENDING_VETTING)", type: "bucket" },
  { value: "UNENGAGED", label: "Unengaged (derived)", type: "bucket" },
  { value: "SUNSET", label: "Sunset (raw or derived)", type: "bucket" },
  { value: "SUPPRESSED", label: "Suppressed (bucket)", type: "bucket" },
  { value: "UNSUBSCRIBED", label: "Unsubscribed", type: "raw" },
  { value: "DISABLED", label: "Disabled", type: "raw" },
  { value: "SPAM_REPORT", label: "SPAM_REPORT", type: "raw" },
  { value: "BLOCKED", label: "BLOCKED", type: "raw" },
  { value: "DEDUPED", label: "DEDUPED", type: "raw" },
  { value: "BLOCKED_DOMAIN", label: "BLOCKED_DOMAIN", type: "raw" },
  { value: "GLOBAL_BLOCKED_DOMAIN", label: "GLOBAL_BLOCKED_DOMAIN", type: "raw" },
  { value: "ROLE", label: "ROLE", type: "raw" },
  { value: "CUSTOMER", label: "CUSTOMER", type: "raw" },
  { value: "PERM_DELETE", label: "PERM_DELETE", type: "raw" },
  { value: "CANCELED", label: "CANCELED", type: "raw" },
  { value: "CANCELED_DURING_TESTING", label: "CANCELED_DURING_TESTING", type: "raw" },
  { value: "CANCELED_DISABLED", label: "CANCELED_DISABLED", type: "raw" },
  { value: "DISABLED_DURING_TESTING", label: "DISABLED_DURING_TESTING", type: "raw" },
  { value: "CANCELED_DISABLED_DURING_TESTING", label: "CANCELED_DISABLED_DURING_TESTING", type: "raw" },
];

function contactMatchesBucket(contact, bucket, referenceDate) {
  const status = normalizeStatus(contact.status);
  const lastActivity = contact.lastActivity ?? contact.lastEventAt ?? contact.lastEngagementDate ?? null;
  const days = getDaysSinceLastActivity(lastActivity, referenceDate);

  switch (bucket) {
    case "ACTIVE":
      return (status === "ACTIVE" || status === "GOOD_TO_GO") && days >= 0 && days < 60;
    case "PENDING_VETTING":
      return IN_VETTING_STATUSES.includes(contact.status);
    case "UNENGAGED": {
      const base = (status === "ACTIVE" || status === "GOOD_TO_GO") && days >= 60 && days <= 365;
      const unengagedStatus = ["UNENGAGED", "UNENGAGED_AT_RISK"].includes(contact.status);
      return base || (unengagedStatus && days >= 60 && days <= 365) || (unengagedStatus && days === 9999);
    }
    case "SUNSET":
      return contact.status === "SUNSET" || ((status === "ACTIVE" || status === "GOOD_TO_GO") && days > 365);
    case "SUPPRESSED":
      return SUPPRESSED_STATUSES.includes(contact.status) || ((status === "ACTIVE" || status === "GOOD_TO_GO") && days > 365);
    case "UNSUBSCRIBED":
      return contact.status === "UNSUBSCRIBED";
    case "DISABLED":
      return contact.status === "DISABLED";
    default:
      return contact.status === bucket;
  }
}

/**
 * Filter contacts for export by selected statuses/buckets.
 * selectedValues: string[] (e.g. ['ACTIVE', 'UNENGAGED', 'SPAM_REPORT'])
 * contacts: full list or pre-filtered list
 * referenceDate: for derived status/bucket
 */
export function filterContactsForExport(contacts, selectedValues, referenceDate) {
  if (!selectedValues || selectedValues.length === 0) return [];
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  return contacts.filter((c) => selectedValues.some((v) => contactMatchesBucket(c, v, ref)));
}

/**
 * Build export row for preview/CSV: name, email, address, createdOn, lastActivity, status (effective), inactiveReason.
 */
export function buildExportRow(contact, referenceDate) {
  const effectiveStatus = getEffectiveStatusDisplay(contact, referenceDate);
  const lastActivity = contact.lastActivity ?? contact.lastEventAt ?? contact.lastEngagementDate ?? null;
  return {
    name: contact.name ?? "",
    email: contact.email ?? "",
    address: contact.address ?? "",
    createdOn: contact.createdOn ?? contact.lastEventAt ?? "",
    lastActivity: lastActivity ?? "",
    status: effectiveStatus,
    inactiveReason: getInactiveReasonDisplay(contact, effectiveStatus),
  };
}

const CSV_HEADERS = ["Name", "Email", "Address", "Added", "Last Activity", "Status", "Inactive Reason"];
const ROW_KEYS = ["name", "email", "address", "createdOn", "lastActivity", "status", "inactiveReason"];

/**
 * Generate CSV string from export rows (headers: Name, Email, Address, Added, Last Activity, Status, Inactive Reason).
 * rows: array of { name, email, address, createdOn, lastActivity, status, inactiveReason }
 */
export function buildExportCSV(rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const headerRow = CSV_HEADERS.join(",");
  const dataRows = rows.map((r) => ROW_KEYS.map((key) => escape(r[key])).join(","));
  return [headerRow, ...dataRows].join("\r\n");
}

/** Trigger browser download of CSV. */
export function downloadCSV(csvString, filename = "contact_export") {
  const date = new Date();
  const dateStr = date.getFullYear() + String(date.getMonth() + 1).padStart(2, "0") + String(date.getDate()).padStart(2, "0");
  const name = `${filename}_${dateStr}.csv`;
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
