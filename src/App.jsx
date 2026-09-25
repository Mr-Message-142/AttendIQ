import {
  checkForAttendanceChange,
} from "./services/attendanceMonitor";

import { useEffect, useState } from "react";

import { fetchAttendance } from "./services/attendanceApi";

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

function App() {

 useEffect(() => {
  async function testLiveApi() {
    try {
      const data = await fetchAttendance();

      console.log("LIVE ATTENDANCE RESPONSE:");
      console.log(data);
    } catch (error) {
      console.error("LIVE API ERROR:");
      console.error(error);
    }
  }

  testLiveApi();
}, []);

function checkAttendanceNow() {
  const result = checkForAttendanceChange(
    attendanceData.crs_list
  );

  setLastChecked(new Date());

  if (result.changed && result.newRecord?.attendence) {
    sendAttendanceNotification(
      attendanceData.learner.course_name,
      result.newRecord
    );
  }
}

  const [notificationEnabled, setNotificationEnabled] =
    useState(Notification.permission === "granted");

  const [lastChecked, setLastChecked] = useState(
    new Date()
  );

  const latestAttendance = getLatestAttendance(
    attendanceData.crs_list
  );

  useEffect(() => {
  checkAttendanceNow();

  const interval = setInterval(() => {
    checkAttendanceNow();
  }, 120000);

  return () => {
    clearInterval(interval);
  };
}, []);

  async function enableNotifications() {
    const enabled =
      await requestNotificationPermission();

    setNotificationEnabled(enabled);

    if (enabled) {
      sendAttendanceNotification(
        attendanceData.learner.course_name,
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
              {lastChecked.toLocaleTimeString()}
            </strong>
          </div>
        </section>

        <NotificationStatus
          notificationEnabled={notificationEnabled}
          onEnable={enableNotifications}
        />

        <section className="dashboard-grid">

          <div className="stat-card">
            <span>Total Lectures</span>
            <strong>
              {attendanceData.learner.total_conducted}
            </strong>
          </div>

          <div className="stat-card">
            <span>Present</span>
            <strong>
              {attendanceData.learner.total_present}
            </strong>
          </div>

          <div className="stat-card">
            <span>Attendance</span>
            <strong>
              {attendanceData.learner.attendance}
            </strong>
          </div>

          <div className="stat-card">
            <span>Latest Status</span>

            <strong>
              {latestAttendance?.attendence
                ? "PRESENT"
                : "ABSENT"}
            </strong>
          </div>

        </section>

        <SubjectCard
          attendance={attendanceData.learner}
        />

        <section className="latest-card">

          <div>
            <span>Latest Attendance</span>

            <h2>
              {attendanceData.learner.course_name}
            </h2>

            <p>
              {latestAttendance?.date}
            </p>
          </div>

          <div
            className={
              latestAttendance?.attendence
                ? "latest-status present-bg"
                : "latest-status absent-bg"
            }
          >
            {latestAttendance?.attendence
              ? "PRESENT ✅"
              : "ABSENT ❌"}
          </div>

        </section>

        <AttendanceHistory
          records={attendanceData.crs_list}
        />

      </main>
    </div>
  );
}

export default App;