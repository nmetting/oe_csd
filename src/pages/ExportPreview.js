import React from "react";
import {
  buildExportCSV,
  downloadCSV,
} from "../utils/exportUtils";

/**
 * Export Preview page: shows rows to be exported and Download CSV / Back to dashboard.
 * Receives exportRows (array of { name, email, address, createdOn, lastActivity, status, inactiveReason }) and onBack callback.
 */
export default function ExportPreview({ exportRows = [], onBack }) {
  const handleDownloadCSV = () => {
    const csv = buildExportCSV(exportRows);
    downloadCSV(csv, "contact_export");
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Export Preview</h1>
        <p className="text-sm text-gray-600 mb-6">Exporting {exportRows.length} contact{exportRows.length !== 1 ? "s" : ""}</p>

        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-800">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-800">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-800">Address</th>
                <th className="px-4 py-3 font-semibold text-gray-800">Added</th>
                <th className="px-4 py-3 font-semibold text-gray-800">Last Activity</th>
                <th className="px-4 py-3 font-semibold text-gray-800">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-800">Inactive Reason</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{row.name}</td>
                  <td className="px-4 py-2 text-gray-800">{row.email}</td>
                  <td className="px-4 py-2 text-gray-600">{row.address}</td>
                  <td className="px-4 py-2 text-gray-600">{row.createdOn}</td>
                  <td className="px-4 py-2 text-gray-600">{row.lastActivity}</td>
                  <td className="px-4 py-2 text-gray-800">{row.status}</td>
                  <td className="px-4 py-2 text-gray-600">{row.inactiveReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-4 py-2 text-sm font-medium rounded bg-[#2a7fb8] text-white hover:opacity-90 inline-flex items-center gap-2"
          >
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
