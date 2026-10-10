import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL = 5000;

function AttendanceMonitor() {
  const [courses, setCourses] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status, setStatus] = useState("Connecting to AttendIQ...");
  const [error, setError] = useState("");

  const loadAttendance = useCallback(async () => {
    if (!window.chrome?.runtime?.sendMessage) {
      setStatus("AttendIQ extension unavailable");
      setError(
        "Open this dashboard in Chrome with the AttendIQ extension installed."
      );
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: "ATTENDIQ_GET_LATEST_ATTENDANCE"
      });

      if (!response?.success) {
        throw new Error("Could not retrieve attendance.");
      }

      if (!response.data) {
        setStatus("Waiting for attendance data");
        setError(
          "Open the EduPlusCampus attendance page and wait for AttendIQ to capture attendance."
        );
        return;
      }

      setCourses(response.data.courses || []);
      setUpdatedAt(response.data.updatedAt);
      setStatus("Connected");
      setError("");
    } catch (err) {
      console.error("AttendIQ dashboard error:", err);
      setStatus("Unable to connect");
      setError(
        "Check that the AttendIQ extension is enabled and reloaded."
      );
    }
  }, []);

  useEffect(() => {
    loadAttendance();

    const timer = setInterval(
      loadAttendance,
      REFRESH_INTERVAL
    );

    return () => clearInterval(timer);
  }, [loadAttendance]);

  return (
    <section className="attendance-monitor">
      <h2>Live Attendance</h2>

      <p>
        <strong>Status:</strong> {status}
      </p>

      {updatedAt && (
        <p>
          <strong>Last updated:</strong>{" "}
          {new Date(updatedAt).toLocaleString()}
        </p>
      )}

      {error && <p role="status">{error}</p>}

      {courses.length > 0 && (
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Code</th>
                <th>Type</th>
                <th>Present</th>
                <th>Conducted</th>
                <th>Attendance</th>
              </tr>
            </thead>

            <tbody>
              {courses.map((course, index) => (
                <tr
                  key={`${course.courseCode}-${course.loadType}-${index}`}
                >
                  <td>{course.courseName}</td>
                  <td>{course.courseCode}</td>
                  <td>{course.loadType}</td>
                  <td>{course.present}</td>
                  <td>{course.conducted}</td>
                  <td>{course.attendance || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AttendanceMonitor;