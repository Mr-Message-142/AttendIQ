console.log("AttendIQ background service started.");

// =====================================================
// ATTENDIQ SETTINGS
// =====================================================

const STORAGE_KEY = "attendIQCourseStates";
const LATEST_ATTENDANCE_KEY = "attendIQLatestAttendance";

// =====================================================
// PROCESS ATTENDANCE DATA
// =====================================================

async function processAttendance(data) {
  if (!data || !Array.isArray(data.crs_list)) {
    console.warn("AttendIQ: Invalid attendance data.");
    return;
  }

  console.log(
    "AttendIQ: Processing",
    data.crs_list.length,
    "courses."
  );

  // =====================================================
  // SAVE LATEST ATTENDANCE FOR DASHBOARD
  // =====================================================

  const latestAttendance = {
    courses: data.crs_list.map((course) => ({
      courseCode: course.course_code || "",
      courseName: course.course_name || "Unknown Course",

      loadType:
        course.load_type ||
        course.loadtypeid ||
        "default",

      instructor: course.instructor_name || "",

      present: parsePresent(course.present),

      conducted:
        Number(course.total_conducted) || 0,

      attendance: course.attendance || "",
    })),

    updatedAt: Date.now(),
  };

  await chrome.storage.local.set({
    [LATEST_ATTENDANCE_KEY]: latestAttendance,
  });

  console.log(
    "AttendIQ: Latest attendance saved for dashboard."
  );

  // =====================================================
  // GET STORED COURSE STATES
  // =====================================================

  const stored = await chrome.storage.local.get([
    STORAGE_KEY,
  ]);

  const previousStates = stored[STORAGE_KEY] || {};
  const currentStates = {};

  let attendanceMarked = false;

  // =====================================================
  // PROCESS EVERY COURSE
  // =====================================================

  for (const course of data.crs_list) {
    // -------------------------------------------------
    // COURSE INFORMATION
    // -------------------------------------------------

    const courseCode = course.course_code;

    const courseName =
      course.course_name || "Unknown Course";

    const loadType =
      course.load_type ||
      course.loadtypeid ||
      "default";

    // -------------------------------------------------
    // VALIDATE COURSE
    // -------------------------------------------------

    if (!courseCode) {
      console.warn(
        "AttendIQ: Course has no course_code:",
        course
      );

      continue;
    }

    // -------------------------------------------------
    // CREATE UNIQUE COURSE KEY
    // -------------------------------------------------

    const courseKey = `${courseCode}_${loadType}`;

    // -------------------------------------------------
    // CURRENT ATTENDANCE
    // -------------------------------------------------

    const currentPresent = parsePresent(course.present);

    const currentConducted =
      Number(course.total_conducted) || 0;

    console.log("----------------------------------------");

    console.log(
      "AttendIQ: Checking course:",
      courseName
    );

    console.log(
      "AttendIQ: Course code:",
      courseCode
    );

    console.log(
      "AttendIQ: Load type:",
      loadType
    );

    console.log(
      "AttendIQ: Current present:",
      currentPresent
    );

    console.log(
      "AttendIQ: Current conducted:",
      currentConducted
    );

    // =================================================
    // CREATE CURRENT STATE
    // =================================================

    currentStates[courseKey] = {
      courseCode,
      courseName,
      loadType,

      instructor:
        course.instructor_name || "",

      present: currentPresent,

      conducted: currentConducted,

      attendance:
        course.attendance || "",

      updatedAt: Date.now(),
    };

    // =================================================
    // GET PREVIOUS COURSE STATE
    // =================================================

    const previous = previousStates[courseKey];

    // =================================================
    // FIRST TIME COURSE
    // =================================================

    if (!previous) {
      console.log(
        "AttendIQ: First time seeing course:",
        courseKey
      );

      console.log(
        "AttendIQ: Creating baseline."
      );

      continue;
    }

    // =================================================
    // PREVIOUS STATE
    // =================================================

    console.log(
      "AttendIQ: Previous present:",
      previous.present
    );

    console.log(
      "AttendIQ: Previous conducted:",
      previous.conducted
    );

    // =================================================
    // ATTENDANCE INCREASED
    // =================================================

    if (currentPresent > previous.present) {
      const difference =
        currentPresent - previous.present;

      console.log(
        "========================================"
      );

      console.log(
        "🎉 AttendIQ: ATTENDANCE MARKED!"
      );

      console.log("Course:", courseName);

      console.log("Course Code:", courseCode);

      console.log("Load Type:", loadType);

      console.log(
        "Previous present:",
        previous.present
      );

      console.log(
        "Current present:",
        currentPresent
      );

      console.log(
        "Attendance increase:",
        difference
      );

      console.log(
        "========================================"
      );

      attendanceMarked = true;

      // =================================================
      // SEND NOTIFICATION
      // =================================================

      await sendAttendanceNotification({
        courseName,
        courseCode,
        loadType,

        previousPresent:
          previous.present,

        currentPresent,

        difference,

        attendance:
          course.attendance || "",
      });
    } else {
      // =================================================
      // NO INCREASE
      // =================================================

      console.log(
        "AttendIQ: No attendance increase for:",
        courseName
      );
    }
  }

  // =====================================================
  // SAVE CURRENT STATE
  // =====================================================

  await chrome.storage.local.set({
    [STORAGE_KEY]: currentStates,
  });

  console.log(
    "AttendIQ: Course attendance state saved."
  );

  // =====================================================
  // FINAL RESULT
  // =====================================================

  if (attendanceMarked) {
    console.log(
      "AttendIQ: Attendance notification process completed."
    );
  } else {
    console.log(
      "AttendIQ: No new attendance notification."
    );
  }
}

// =====================================================
// PARSE PRESENT VALUE
// =====================================================

function parsePresent(value) {
  // NUMBER
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  // STRING
  if (typeof value !== "string") {
    return 0;
  }

  // Example: "21 / 26"
  const parts = value.split("/");

  const number = Number(parts[0].trim());

  if (Number.isFinite(number)) {
    return number;
  }

  return 0;
}

// =====================================================
// SEND BROWSER NOTIFICATION
// =====================================================

async function sendAttendanceNotification(info) {
  const notificationId =
    `attendiq-${info.courseCode}-${info.loadType}-${Date.now()}`;

  try {
    // -------------------------------------------------
    // GET EXTENSION ICON
    // -------------------------------------------------

    const iconUrl = chrome.runtime.getURL(
      "icons/icon128.png"
    );

    console.log(
      "AttendIQ: Notification icon:",
      iconUrl
    );

    // -------------------------------------------------
    // CREATE NOTIFICATION
    // -------------------------------------------------

    await chrome.notifications.create(
      notificationId,
      {
        type: "basic",

        iconUrl,

        title:
          "AttendIQ — Attendance Marked",

        message:
          `${info.courseName}\n` +
          `Present: ${info.currentPresent}\n` +
          `Attendance: ${info.attendance}`,

        priority: 2,
      }
    );

    console.log(
      "AttendIQ: Browser notification sent."
    );
  } catch (error) {
    console.error(
      "AttendIQ: Notification failed:",
      error
    );
  }
}

// =====================================================
// MESSAGE LISTENER
// =====================================================

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    console.log(
      "AttendIQ background received:",
      message?.type
    );

    // =================================================
    // DASHBOARD REQUEST: RETURN LATEST ATTENDANCE
    // =================================================

    if (
      message?.type ===
      "ATTENDIQ_GET_LATEST_ATTENDANCE"
    ) {
      chrome.storage.local
        .get([LATEST_ATTENDANCE_KEY])
        .then((result) => {
          sendResponse({
            success: true,

            data:
              result[LATEST_ATTENDANCE_KEY] || null,
          });
        })
        .catch((error) => {
          console.error(
            "AttendIQ: Failed to load attendance for dashboard:",
            error
          );

          sendResponse({
            success: false,
            data: null,

            error:
              error.message ||
              "Unable to read stored attendance.",
          });
        });

      // Keep the message channel open for the async response.
      return true;
    }

    // =================================================
    // PAGE READY
    // =================================================

    if (
      message?.type === "ATTENDIQ_PAGE_READY"
    ) {
      console.log(
        "AttendIQ: Attendance page is ready:",
        message.url
      );

      sendResponse({
        success: true,
      });

      return false;
    }

    // =================================================
    // ATTENDANCE DATA
    // =================================================

    if (
      message?.type ===
      "ATTENDIQ_ATTENDANCE_DATA"
    ) {
      console.log(
        "AttendIQ: REAL ATTENDANCE DATA RECEIVED"
      );

      if (
        message.data &&
        Array.isArray(message.data.crs_list)
      ) {
        console.table(message.data.crs_list);
      }

      processAttendance(message.data)
        .then(() => {
          console.log(
            "AttendIQ: Attendance processing completed."
          );
        })
        .catch((error) => {
          console.error(
            "AttendIQ: Attendance processing failed:",
            error
          );
        });

      sendResponse({
        success: true,
      });

      return false;
    }

    // =================================================
    // UNKNOWN MESSAGE
    // =================================================

    console.warn(
      "AttendIQ: Unknown message type:",
      message?.type
    );

    sendResponse({
      success: false,
      error: "Unknown message type.",
    });

    return false;
  }
);