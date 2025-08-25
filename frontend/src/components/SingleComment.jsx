import { useEffect, useState } from "react";
import { API_URL } from "../config/config";

const SingleComment = ({ comment }) => {
  const [from, setFrom] = useState("");

  useEffect(() => {
    const fetchFrom = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/profile/${comment.from}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok) setFrom(data?.profile?.name || "");
      } catch (err) {
        console.error("Failed to fetch commenter profile:", err);
        // Optional: set a fallback
        setFrom("");
      }
    };
    if (comment?.from) fetchFrom();
  }, [comment?.from]);

  return (
    <li className="bg-gray-50 p-3 rounded-md mb-2 border border-gray-100">
      <strong className="text-gray-800">{from || "Unknown"}:</strong>{" "}
      <span className="text-gray-700">{comment?.message}</span>
      <span className="text-gray-500 text-xs ml-2">
        • {comment?.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
      </span>
    </li>
  );
};

export default SingleComment;
