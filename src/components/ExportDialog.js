import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  EXPORT_STATUS_OPTIONS,
  filterContactsForExport,
  buildExportRow,
} from "../utils/exportUtils";

/**
 * Export dialog: status selection (checkboxes), scope (current filters vs entire list), Preview export / Cancel.
 * onPreviewExport(rows) is called with the built export rows when user clicks Preview export.
 */
export default function ExportDialog({
  open,
  onClose,
  effectiveContacts,
  filteredContacts,
  referenceDate,
  onPreviewExport,
}) {
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);

  const toggleStatus = (value) => {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handlePreview = () => {
    const source = useCurrentFilters ? filteredContacts : effectiveContacts;
    const normalized = (source || []).map((c) => ({
      ...c,
      address: c.address ?? "",
      createdOn: c.createdOn ?? c.lastEventAt ?? "",
      lastActivity: c.lastActivity ?? c.lastEventAt ?? c.lastEngagementDate ?? null,
      inactiveReason: c.inactiveReason ?? c.reason ?? null,
    }));
    const filtered = filterContactsForExport(normalized, selectedStatuses, referenceDate);
    const rows = filtered.map((c) => buildExportRow(c, referenceDate));
    onPreviewExport(rows);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export contacts</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">Select statuses/buckets to include and export scope.</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-gray-800 mb-2">Status / bucket selection</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50">
              {EXPORT_STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    className="rounded border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-800 mb-2">Export scope</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="exportScope"
                  checked={useCurrentFilters}
                  onChange={() => setUseCurrentFilters(true)}
                  className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]"
                />
                <span className="text-gray-700">Export contacts matching current filters</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="exportScope"
                  checked={!useCurrentFilters}
                  onChange={() => setUseCurrentFilters(false)}
                  className="rounded-full border-gray-300 text-[#2a7fb8] focus:ring-[#2a7fb8]"
                />
                <span className="text-gray-700">Ignore filters, export entire list</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={selectedStatuses.length === 0}
            className="px-3 py-1.5 text-sm font-medium rounded bg-[#2a7fb8] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview export
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
