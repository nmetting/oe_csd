import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  ContactHealthActiveIcon,
  ContactHealthVettingIcon,
  ContactHealthUnengagedIcon,
  ContactHealthSuppressedIcon,
  ContactHealthUnsubscribedIcon,
  ContactHealthDisabledIcon,
} from "./icons";

// Bucket keys (stable)
export const BUCKET_ACTIVE = "ACTIVE";
export const BUCKET_IN_VETTING = "IN_VETTING";
export const BUCKET_UNENGAGED = "UNENGAGED";
export const BUCKET_SUPPRESSED = "SUPPRESSED";
export const BUCKET_UNSUBSCRIBED = "UNSUBSCRIBED";
export const BUCKET_DISABLED = "DISABLED";

// Suppressed status set (from spec) — used for getBucket
const SUPPRESSED_STATUSES = [
  "SPAM_REPORT",
  "DEDUPED",
  "BLOCKED",
  "BLOCKED_DOMAIN",
  "GLOBAL_BLOCKED_DOMAIN",
  "ROLE",
  "CUSTOMER",
  "PERM_DELETE",
  "CANCELED",
  "CANCELED_DURING_TESTING",
  "CANCELED_DISABLED",
  "DISABLED_DURING_TESTING",
  "CANCELED_DISABLED_DURING_TESTING",
  "SUNSET",
];

const IN_VETTING_STATUSES = ["TESTING", "VETTING", "PENDING_VETTING"];

/**
 * Normalize dashboard status to Contact Health status (ACTIVE -> GOOD_TO_GO, PENDING_VETTING -> VETTING).
 */
function normalizeStatus(status) {
  if (status === "ACTIVE") return "GOOD_TO_GO";
  if (status === "PENDING_VETTING") return "VETTING";
  return status;
}

/**
 * Get days since last activity. lastActivity can be Date or ISO string or null.
 * If missing/null, returns 9999 per spec (treated as derived SUNSET).
 * If last activity is in the future (e.g. mock data), returns 0 so contact counts as Active.
 */
function getDaysSinceLastActivity(lastActivity, today) {
  if (lastActivity == null) return 9999;
  const d = typeof lastActivity === "string" ? new Date(lastActivity) : lastActivity;
  if (Number.isNaN(d.getTime())) return 9999;
  const t = today ? new Date(today) : new Date();
  t.setHours(0, 0, 0, 0);
  const dateOnly = new Date(d);
  dateOnly.setHours(0, 0, 0, 0);
  const days = Math.floor((t - dateOnly) / (24 * 60 * 60 * 1000));
  return days < 0 ? 0 : days; // future date → 0 days ago (Active)
}

/**
 * Single helper: assigns each contact to exactly one bucket.
 * contact: { status, lastEventAt?, lastEngagementDate? }
 * today: optional Date (defaults to new Date()).
 * Returns one of: ACTIVE, IN_VETTING, UNENGAGED, SUPPRESSED, UNSUBSCRIBED, DISABLED.
 */
export function getBucket(contact, today) {
  const status = normalizeStatus(contact.status);
  const lastActivity = contact.lastEngagementDate ?? contact.lastEventAt ?? null;
  const daysSinceLastActivity = getDaysSinceLastActivity(lastActivity, today);

  if (status === "UNSUBSCRIBED") return BUCKET_UNSUBSCRIBED;

  if (SUPPRESSED_STATUSES.includes(status)) return BUCKET_SUPPRESSED;

  if (status === "DISABLED") return BUCKET_DISABLED;

  if (IN_VETTING_STATUSES.includes(status)) return BUCKET_IN_VETTING;

  // Active-like: ACTIVE (mock) or GOOD_TO_GO (real)
  // Active status + activity in the past 1–59 days (or 0–59) → counted as Active; same bucket logic for counts and filtering
  if (status === "ACTIVE" || status === "GOOD_TO_GO") {
    if (daysSinceLastActivity > 365) return BUCKET_SUPPRESSED; // derived SUNSET
    if (daysSinceLastActivity >= 60 && daysSinceLastActivity <= 365) return BUCKET_UNENGAGED;
    return BUCKET_ACTIVE; // 0–59 days since last activity → Active
  }

  // Dashboard uses UNENGAGED / UNENGAGED_AT_RISK: derive by days
  if (status === "UNENGAGED" || status === "UNENGAGED_AT_RISK") {
    if (daysSinceLastActivity > 365) return BUCKET_SUPPRESSED;
    if (daysSinceLastActivity >= 60 && daysSinceLastActivity <= 365) return BUCKET_UNENGAGED;
    return BUCKET_ACTIVE;
  }

  return BUCKET_SUPPRESSED;
}

/** @deprecated Use getBucket(contact, today) for filtering. Kept for backward compat. */
export function getContactHealthBucket(contact) {
  return getBucket(contact, undefined);
}

const TILE_CONFIG = [
  {
    key: BUCKET_ACTIVE,
    label: "Active",
    subtitle: "Good to send",
    tooltip: "These contacts are active and eligible to receive emails.",
    Icon: ContactHealthActiveIcon,
    accentColor: "text-green-600",
    borderSelected: "border-green-500",
  },
  {
    key: BUCKET_UNENGAGED,
    label: "Unengaged",
    subtitle: "No activity 60–365 days",
    tooltip: "These contacts are active, but have not engaged in 60-365 days and are in danger of being sunset.",
    Icon: ContactHealthUnengagedIcon,
    accentColor: "text-orange-600",
    borderSelected: "border-orange-500",
  },
  {
    key: BUCKET_IN_VETTING,
    label: "In Vetting",
    subtitle: "Still validating",
    tooltip: "These contacts are being validated before becoming active.",
    Icon: ContactHealthVettingIcon,
    accentColor: "text-orange-600",
    borderSelected: "border-orange-500",
  },
  {
    key: BUCKET_SUPPRESSED,
    label: "Suppressed",
    subtitle: "Not eligible to send",
    tooltip: "These contacts are not eligible to receive emails.",
    Icon: ContactHealthSuppressedIcon,
    accentColor: "text-red-600",
    borderSelected: "border-red-500",
  },
  {
    key: BUCKET_UNSUBSCRIBED,
    label: "Unsubscribed",
    subtitle: "Opted out",
    tooltip: "These contacts opted out using an unsubscribe link.",
    Icon: ContactHealthUnsubscribedIcon,
    accentColor: "text-orange-600",
    borderSelected: "border-orange-500",
  },
  {
    key: BUCKET_DISABLED,
    label: "Disabled",
    subtitle: "Manually stopped",
    tooltip: "These contacts were manually disabled and are not being emailed.",
    Icon: ContactHealthDisabledIcon,
    accentColor: "text-gray-600",
    borderSelected: "border-gray-500",
  },
];

const BUCKET_LABELS = {
  [BUCKET_ACTIVE]: "Active",
  [BUCKET_IN_VETTING]: "In Vetting",
  [BUCKET_UNENGAGED]: "Unengaged",
  [BUCKET_SUPPRESSED]: "Suppressed",
  [BUCKET_UNSUBSCRIBED]: "Unsubscribed",
  [BUCKET_DISABLED]: "Disabled",
};

/**
 * ContactHealthTiles – customer-facing Contact Health tile row.
 * Props:
 *   contacts: array of { status, lastEngagementDate? (or lastEventAt?) } (full dataset for counts)
 *   selectedBuckets: array of bucket keys (multi-select)
 *   onToggleBucket(bucketKey): callback when a tile is clicked (toggle)
 *   onRemoveBucket(bucketKey): callback when a filter chip X is clicked
 *   onClearFilter(): callback when "Clear filter" is clicked
 *   referenceDate: optional Date; if set, used as "today" for bucket math (so mock data with fixed dates counts correctly)
 *   hideHeader: if true, do not render the section wrapper or title/subtitle (for embedding inside a unified card)
 */
export default function ContactHealthTiles({
  contacts = [],
  selectedBuckets = [],
  onToggleBucket,
  onRemoveBucket,
  onClearFilter,
  referenceDate,
  hideHeader = false,
}) {
  const today = useMemo(() => (referenceDate ? new Date(referenceDate) : new Date()), [referenceDate]);

  const counts = useMemo(() => {
    const map = {
      [BUCKET_ACTIVE]: 0,
      [BUCKET_IN_VETTING]: 0,
      [BUCKET_UNENGAGED]: 0,
      [BUCKET_SUPPRESSED]: 0,
      [BUCKET_UNSUBSCRIBED]: 0,
      [BUCKET_DISABLED]: 0,
    };
    (contacts || []).forEach((c) => {
      const bucket = getBucket(c, today);
      if (map[bucket] !== undefined) map[bucket]++;
    });
    return map;
  }, [contacts, today]);

  const hasFilter = selectedBuckets.length > 0;

  const tileRow = (
    <>
      <div className={hideHeader ? "flex flex-wrap gap-[9px]" : "px-4 pb-4 flex flex-wrap gap-[9px]"}>
        <TooltipProvider>
          {TILE_CONFIG.map(({ key, label, subtitle, tooltip, Icon, accentColor, borderSelected }) => {
            const selected = selectedBuckets.includes(key);
            const count = counts[key] ?? 0;
            return (
              <Tooltip key={key}>
                <TooltipTrigger aria-label={tooltip}>
                  <button
                    type="button"
                    onClick={() => onToggleBucket?.(key)}
                    aria-pressed={selected}
                    className={`flex flex-col items-start text-left p-4 rounded-lg border-2 bg-white w-[180px] min-w-[180px] flex-shrink-0 transition-colors hover:border-gray-400 ${
                      selected ? borderSelected : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className={selected ? accentColor : "text-gray-500"} size={20} />
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                    </div>
                    <div className={`mt-2 text-2xl font-bold ${selected ? accentColor : "text-gray-800"}`}>
                      {count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Filter chips: selected buckets + Clear filter */}
      {hasFilter && (
        <div className={hideHeader ? "flex flex-wrap items-center gap-2 mt-3" : "px-4 pb-4 flex flex-wrap items-center gap-2"}>
          {selectedBuckets.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-gray-100 border border-gray-200 text-gray-800"
            >
              <span>{BUCKET_LABELS[key] ?? key}</span>
              <button
                type="button"
                onClick={() => onRemoveBucket?.(key)}
                aria-label={`Remove ${BUCKET_LABELS[key] ?? key} filter`}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-300 text-gray-600 hover:text-gray-800"
              >
                <span aria-hidden>×</span>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onClearFilter?.()}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </>
  );

  if (hideHeader) {
    return <div>{tileRow}</div>;
  }

  return (
    <section aria-labelledby="contact-health-heading" className="border border-gray-300 rounded-lg bg-white shadow-sm">
      <div className="px-4 pt-4 pb-2">
        <h2 id="contact-health-heading" className="text-lg font-semibold text-gray-800">
          Contact Health
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Click a tile to filter contacts.</p>
      </div>
      {tileRow}
    </section>
  );
}
