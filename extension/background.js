console.log("AttendIQ background service started.");


// =====================================================
// ATTENDANCE MONITOR
// =====================================================

async function processAttendance(data) {

  if (!data || !Array.isArray(data.crs_list)) {

    console.warn(
      "AttendIQ: Invalid attendance data."
    );

    return;
  }


  const attendanceList = data.crs_list;


  console.log(
    "AttendIQ: Processing",
    attendanceList.length,
    "attendance records."
  );


  // ===================================================
  // FIND LATEST LECTURE
  // ===================================================

  const latestLecture = attendanceList.reduce(
    (latest, current) => {

      if (!latest) {
        return current;
      }

      return Number(current.sr_no) > Number(latest.sr_no)
        ? current
        : latest;

    },
    null
  );


  if (!latestLecture) {

    console.warn(
      "AttendIQ: No lecture found."
    );

    return;
  }


  console.log(
    "AttendIQ: Latest lecture:",
    latestLecture
  );


  // ===================================================
  // CREATE UNIQUE LECTURE ID
  // ===================================================

  const lectureId =
    `${latestLecture.date}_${latestLecture.sr_no}_${latestLecture.faculty}`;


  console.log(
    "AttendIQ: Lecture ID:",
    lectureId
  );


  // ===================================================
  // GET STORED ATTENDANCE STATE
  // ===================================================

  const stored =
    await chrome.storage.local.get([
      "attendIQInitialized",
      "lectureStates"
    ]);


  const lectureStates =
    stored.lectureStates || {};


  // ===================================================
  // FIRST RUN
  // ===================================================

  if (!stored.attendIQInitialized) {

    console.log(
      "AttendIQ: First attendance data received."
    );


    console.log(
      "AttendIQ: Creating initial attendance baseline."
    );


    attendanceList.forEach((lecture) => {

      const id =
        `${lecture.date}_${lecture.sr_no}_${lecture.faculty}`;


      lectureStates[id] =
        Boolean(lecture.attendence);

    });


    await chrome.storage.local.set({

      attendIQInitialized: true,

      lectureStates: lectureStates

    });


    console.log(
      "AttendIQ: Initial attendance baseline saved."
    );


    return;
  }


  // ===================================================
  // CHECK ATTENDANCE CHANGES
  // ===================================================

  let attendanceChanged = false;

  let changedLecture = null;


  for (const lecture of attendanceList) {

    const id =
      `${lecture.date}_${lecture.sr_no}_${lecture.faculty}`;


    const currentStatus =
      Boolean(lecture.attendence);


    const previousStatus =
      lectureStates[id];


    // =================================================
    // NEW LECTURE
    // =================================================

    if (previousStatus === undefined) {

      console.log(
        "AttendIQ: New lecture detected:",
        lecture
      );


      lectureStates[id] =
        currentStatus;


      if (currentStatus === true) {

        console.log(
          "AttendIQ: New lecture is PRESENT."
        );


        attendanceChanged = true;

        changedLecture = lecture;

      }


      continue;
    }


    // =================================================
    // FALSE → TRUE
    // =================================================

    if (
      previousStatus === false &&
      currentStatus === true
    ) {

      console.log(
        "========================================"
      );


      console.log(
        "🎉 AttendIQ: ATTENDANCE MARKED!"
      );


      console.log(
        "Lecture:",
        lecture
      );


      console.log(
        "========================================"
      );


      attendanceChanged = true;

      changedLecture = lecture;

    }


    // =================================================
    // UPDATE STORED STATE
    // =================================================

    lectureStates[id] =
      currentStatus;

  }


  // ===================================================
  // SAVE UPDATED ATTENDANCE STATE
  // ===================================================

  await chrome.storage.local.set({

    lectureStates: lectureStates

  });


  // ===================================================
  // SEND NOTIFICATION
  // ===================================================

  if (attendanceChanged && changedLecture) {

    console.log(
      "AttendIQ: Attendance change detected."
    );


    console.log(
      "AttendIQ: Sending browser notification."
    );


    const courseName =
      data.learner?.course_name ||
      "Lecture";


    const faculty =
      changedLecture.faculty ||
      data.learner?.instructor_name ||
      "Faculty";


    const date =
      changedLecture.date ||
      "Today";


    chrome.notifications.create(
      `attendance-${lectureId}`,
      {
        type: "basic",

        iconUrl: "icon128.png",

        title:
          "🔔 AttendIQ - Attendance Marked",

        message:
          `${courseName}\nYou are marked PRESENT.\nFaculty: ${faculty}\nDate: ${date}`,

        priority: 2,

        requireInteraction: true
      }
    );


    console.log(
      "AttendIQ: Browser notification sent."
    );

  } else {

    console.log(
      "AttendIQ: No attendance change."
    );

  }

}


// =====================================================
// MESSAGE LISTENER
// =====================================================

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    console.log(
      "AttendIQ background received message:",
      message.type
    );


    // =================================================
    // PAGE READY
    // =================================================

    if (
      message.type ===
      "ATTENDIQ_PAGE_READY"
    ) {

      console.log(
        "AttendIQ: Attendance page is ready:",
        message.url
      );

    }


    // =================================================
    // ATTENDANCE DATA
    // =================================================

    if (
      message.type ===
      "ATTENDIQ_ATTENDANCE_DATA"
    ) {

      console.log(
        "AttendIQ: REAL ATTENDANCE DATA RECEIVED"
      );


      if (
        message.data &&
        Array.isArray(message.data.crs_list)
      ) {

        console.table(
          message.data.crs_list
        );

      }


      processAttendance(
        message.data
      )
      .catch((error) => {

        console.error(
          "AttendIQ: Attendance processing failed:",
          error
        );

      });

    }


    // =================================================
    // RESPONSE
    // =================================================

    sendResponse({

      success: true

    });


    return true;

  }
);

