import { useCallback, useEffect, useMemo, useState } from "react";

import Header from "./components/Header";
import SubjectCard from "./components/SubjectCard";
import AttendanceHistory from "./components/AttendanceHistory";
import NotificationStatus from "./components/NotificationStatus";

import attendanceData from "./data/attendanceData";

import {
  getLatestAttendance,
} from "./utils/attendanceUtils";

import {
  requestNotificationPermission,
  sendAttendanceNotification,
} from "./utils/notification";

const REFRESH_INTERVAL = 5000;

function App() {
  const [attendance, setAttendance] = useState(attendanceData);

  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== "undefined" &&
      Notification.permission === "granted"
  );

  const [lastChecked, setLastChecked] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  // Request the latest attendance snapshot from the Chrome extension.
  const checkAttendanceNow = useCallback(() => {
    setLastChecked(new Date());

    // The extension content script exchanges messages with this page.
    window.postMessage(
      {
        source: "ATTENDIQ_DASHBOARD_PAGE",
        type: "GET_LATEST_ATTENDANCE",
        requestId: `${Date.now()}-${Math.random()}`,
      },
      window.location.origin
    );
  }, []);

  // Listen for attendance responses from the extension bridge.
  useEffect(() => {
    function handleExtensionMessage(event) {
      if (event.source !== window) {
        return;
      }

      if (event.origin !== window.location.origin) {
        return;
      }

      const message = event.data;

      if (
        !message ||
        message.source !== "ATTENDIQ_EXTENSION" ||
        message.type !== "LATEST_ATTENDANCE"
      ) {
        return;
      }

      if (!message.success || !message.data) {
        setConnectionStatus("waiting");
        setErrorMessage(
          message.error ||
            "No attendance data is available from the extension yet."
        );
        return;
      }

      const snapshot = message.data;

      if (!Array.isArray(snapshot.courses)) {
        setConnectionStatus("waiting");
        setErrorMessage("The attendance data format is invalid.");
        return;
      }

      // Convert the extension's course records into the dashboard format.
      const courses = snapshot.courses.map((course, index) => ({
        course_code: course.courseCode || `COURSE-${index + 1}`,
        course_name: course.courseName || "Unknown Course",
        load_type: course.loadType || "default",
        instructor_name: course.instructor || "Not available",
        present: Number(course.present) || 0,
        total_conducted: Number(course.conducted) || 0,
        attendance:
          course.attendance ||
          calculatePercentage(course.present, course.conducted),
      }));

      const totalPresent = courses.reduce(
        (total, course) => total + course.present,
        0
      );

      const totalConducted = courses.reduce(
        (total, course) => total + course.total_conducted,
        0
      );

      const overallAttendance =
        totalConducted > 0
          ? `${((totalPresent / totalConducted) * 100).toFixed(2)}%`
          : "0.00%";

      const updatedAttendance = {
        learner: {
          ...attendanceData.learner,
          course_name: "Overall Attendance",
          total_present: totalPresent,
          total_conducted: totalConducted,
          attendance: overallAttendance,
        },
        crs_list: courses,
        updatedAt: snapshot.updatedAt || Date.now(),
      };

      setAttendance(updatedAttendance);
      setConnectionStatus("connected");
      setErrorMessage("");
      setLastChecked(new Date());
    }

    window.addEventListener("message", handleExtensionMessage);

    return () => {
      window.removeEventListener("message", handleExtensionMessage);
    };
  }, []);

  // Request fresh snapshots periodically.
  useEffect(() => {
    checkAttendanceNow();

    const interval = setInterval(() => {
      checkAttendanceNow();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [checkAttendanceNow]);

  const latestAttendance = useMemo(() => {
    return getLatestAttendance(attendance.crs_list);
  }, [attendance.crs_list]);

  async function enableNotifications() {
    const enabled = await requestNotificationPermission();

    setNotificationEnabled(enabled);

    if (enabled) {
      sendAttendanceNotification(
        "AttendIQ",
        latestAttendance
      );
    }
  }

  return (
    <div className="app">
      <Header />

      <main className="container">
        <section className="welcome-section">
          <div>
            <h2>Welcome Back 👋</h2>

            <p>
              Monitor your college attendance automatically.
            </p>

            <div className={`connection-status ${connectionStatus}`}>
              <span className="connection-dot" />

              {connectionStatus === "connected"
                ? "Connected to AttendIQ extension"
                : connectionStatus === "connecting"
                  ? "Connecting to AttendIQ extension..."
                  : "Waiting for attendance data"}
            </div>

            {errorMessage && (
              <p className="error-message">{errorMessage}</p>
            )}
          </div>

          <button
            className="check-button"
            onClick={checkAttendanceNow}
          >
            Check Attendance Now
          </button>

          <div className="last-checked">
            <span>Last checked</span>

            <strong>
              {lastChecked
                ? lastChecked.toLocaleTimeString()
                : "Not checked yet"}
            </strong>
          </div>
        </section>

        <NotificationStatus
          notificationEnabled={notificationEnabled}
          onEnable={enableNotifications}
        />

        <section className="dashboard-grid">
          <div className="stat-card">
            <span>Total Conducted Lectures</span>

            <strong>
              {attendance.learner.total_conducted}
            </strong>
          </div>

          <div className="stat-card">
            <span>Present Lectures</span>

            <strong>
              {attendance.learner.total_present}
            </strong>
          </div>

          <div className="stat-card">
            <span>Overall Attendance</span>

            <strong>
              {attendance.learner.attendance}
            </strong>
          </div>

          <div className="stat-card">
            <span>Latest Status</span>

            <strong>
              {latestAttendance
                ? latestAttendance.attendence
                  ? "PRESENT"
                  : "ABSENT"
                : "NO DATA"}
            </strong>
          </div>
        </section>

        <SubjectCard attendance={attendance.learner} />

        <section className="latest-card">
          <div>
            <span>Latest Attendance</span>

            <h2>
              {latestAttendance?.course_name ||
                latestAttendance?.courseName ||
                "No attendance record"}
            </h2>

            <p>
              {latestAttendance?.date ||
                (attendance.updatedAt
                  ? `Updated ${new Date(
                      attendance.updatedAt
                    ).toLocaleString()}`
                  : "Waiting for live attendance data")}
            </p>
          </div>

          <div
            className={`latest-status ${
              latestAttendance?.attendence
                ? "present-bg"
                : "absent-bg"
            }`}
          >
            {latestAttendance
              ? latestAttendance.attendence
                ? "PRESENT ✅"
                : "ABSENT ❌"
              : "NO DATA"}
          </div>
        </section>

        <AttendanceHistory records={attendance.crs_list} />
      </main>
    </div>
  );
}

function calculatePercentage(present, conducted) {
  const presentCount = Number(present) || 0;
  const conductedCount = Number(conducted) || 0;

  if (conductedCount === 0) {
    return "0.00%";
  }

  return `${(
    (presentCount / conductedCount) *
    100
  ).toFixed(2)}%`;
}

export default App;