import { useState } from "react";
import { FiX, FiClock } from "react-icons/fi";

const ScheduleModal = ({ onSchedule, onClose }) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledSeconds, setScheduledSeconds] = useState("00");
  const [error, setError] = useState("");

  const handleSchedule = () => {
    setError("");

    if (!scheduledDate || !scheduledTime) {
      setError("Please select both date and time");
      return;
    }

    const scheduledAt = new Date(
      `${scheduledDate}T${scheduledTime}:${scheduledSeconds}`
    );
    const now = new Date();

    if (scheduledAt <= now) {
      setError("Scheduled time must be in the future!");
      return;
    }

    onSchedule(scheduledAt);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiClock className="text-indigo-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Schedule Message</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Date picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📅 Date (Day / Month / Year)
          </label>
          <input
            type="date"
            min={today}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Time picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ⏰ Time (Hour : Minute)
          </label>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Seconds picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ⏱️ Seconds
          </label>
          <select
            value={scheduledSeconds}
            onChange={(e) => setScheduledSeconds(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={String(i).padStart(2, "0")}>
                {String(i).padStart(2, "0")} seconds
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {scheduledDate && scheduledTime && (
          <div className="bg-indigo-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-indigo-700">
              📅 Message will be sent on:
              <br />
              <strong>
                {new Date(
                  `${scheduledDate}T${scheduledTime}:${scheduledSeconds}`
                ).toLocaleString([], {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </strong>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            className="flex-1 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600"
          >
            Schedule ⏰
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;