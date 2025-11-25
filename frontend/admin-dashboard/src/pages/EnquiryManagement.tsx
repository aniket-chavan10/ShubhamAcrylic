import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { fetchEnquiries } from "../services/enquiryService";

interface Enquiry {
  _id: string;
  name: string;
  mobileNo: string;
  email: string;
  message: string;
  createdAt: string;
  status: "pending" | "resolved";
}

const EnquiryManagement: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadEnquiries = async () => {
      try {
        setLoading(true);
        const data = await fetchEnquiries();
        setEnquiries(data.enquiries || []);
        setSelectedEnquiry(data.enquiries?.[0] || null); // auto-select first row
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setLoading(false);
      }
    };
    loadEnquiries();
  }, []);

  const handleMarkResolved = (id: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, status: "resolved" } : e))
    );
    if (selectedEnquiry && selectedEnquiry._id === id) {
      setSelectedEnquiry({ ...selectedEnquiry, status: "resolved" });
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-8">
        <span className="inline-block w-1 h-8 rounded-full bg-blue-600"></span>
        <h2 className="text-3xl font-bold text-blue-900 tracking-tight">Enquiry Management</h2>

      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[75vh]">
        {/* Left side: Table */}
        <div className="lg:w-3/5 overflow-auto max-h-[75vh] rounded-l-3xl">
          {loading && <p className="p-8 text-center">Loading enquiries...</p>}
          {error && <p className="p-8 text-center text-red-600">Error: {error}</p>}
          {!loading && enquiries.length === 0 && <p className="p-8 text-center">No enquiries found.</p>}

          {enquiries.length > 0 && (
            <table className="w-full border-collapse text-left text-gray-800">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="p-4 min-w-[180px] font-semibold">Name</th>
                  <th className="p-4 min-w-[140px] font-semibold">Mobile No.</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => {
                  const isSelected = selectedEnquiry?._id === enquiry._id;
                  return (
                    <tr
                      key={enquiry._id}
                      onClick={() => setSelectedEnquiry(enquiry)}
                      className={`cursor-pointer border-b border-gray-200 hover:bg-blue-50 ${isSelected ? "bg-blue-100 font-semibold" : ""
                        }`}
                      title="Click to view full details"
                    >
                      <td className="p-4 truncate">{enquiry.name}</td>
                      <td className="p-4 truncate">{enquiry.mobileNo || "-"}</td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right side: Details panel */}
        <div className="lg:w-2/5 p-10 bg-blue-600 rounded-r-3xl shadow-inner max-h-[75vh] overflow-y-auto ">
          {selectedEnquiry ? (
            <>
              <h2 className="text-2xl font-bold mb-6 border-b border-gray-200 pb-3 text-white">
                Enquiry Details
              </h2>
              <div className="space-y-4 text-white">
                <div>
                  <span className="font-semibold text-white">Name: </span>{selectedEnquiry.name}
                </div>
                <div>
                  <span className="font-semibold text-white">Email: </span>{selectedEnquiry.email}
                </div>
                <div>
                  <span className="font-semibold text-white">Mobile No.: </span>{selectedEnquiry.mobileNo || "-"}
                </div>
                <div>
                  <span className="font-semibold text-white">Message:</span>
                  <p className="mt-2 whitespace-pre-wrap bg-white rounded-lg p-4 shadow-sm border text-gray-700 border-gray-300">
                    {selectedEnquiry.message}
                  </p>
                </div>
                <div className="font-bold text-sm text-white">
                  Sent on: {new Date(selectedEnquiry.createdAt).toLocaleString()}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-4">
                  {/* Mark Resolved button */}
                  {selectedEnquiry.status === "pending" && (
                    <button
                      onClick={() => {
                        // Your code to mark resolved goes here
                      }}
                      className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                    >
                      Mark Resolved
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      // Your code to delete enquiry goes here
                    }}
                    className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Select an enquiry to view its details.</p>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default EnquiryManagement;
