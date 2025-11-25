import React, { useState } from "react";
interface Enquiry {
  _id: string;
  name: string;
  mobileNo: string;
  email: string;
  message: string;
  createdAt: string;
  status: "pending" | "resolved";
}

interface EnquiryRowProps {
  enquiry: Enquiry;
  onMarkResolved: (id: string) => void;
}

const EnquiryRow: React.FC<EnquiryRowProps> = ({ enquiry, onMarkResolved }) => {
  const [expanded, setExpanded] = useState(false);
  const previewLimit = 100;
  const isLong = enquiry.message.length > previewLimit;

  return (
    <tr className="border-b border-gray-200 hover:bg-blue-50">
     <td className="py-3 px-4 min-w-[150px]">{enquiry.name}</td>
           <td className="py-3 px-4">{enquiry.mobileNo}</td>
      <td className="py-3 px-4 text-blue-600 underline">{enquiry.email}</td>
      <td className="py-3 px-4 max-w-xl">
        {expanded || !isLong
          ? enquiry.message
          : `${enquiry.message.slice(0, previewLimit)}... `}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 underline ml-1 focus:outline-none"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </td>
      <td className="py-3 px-4">{new Date(enquiry.createdAt).toLocaleDateString()}</td>
      <td className="py-3 px-4">
        <span
          className={`px-3 py-1 rounded-full font-semibold text-sm ${
            enquiry.status === "pending"
              ? "bg-yellow-200 text-yellow-800"
              : "bg-green-200 text-green-800"
          }`}
        >
          {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
        </span>
      </td>
      <td className="py-3 px-4">
        {enquiry.status === "pending" && (
          <button
            onClick={() => onMarkResolved(enquiry._id)}
            className="px-4 py-1 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Mark Resolved
          </button>
        )}
      </td>
    </tr>
  );
};

export default EnquiryRow;
