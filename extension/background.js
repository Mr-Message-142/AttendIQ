console.log("AttendIQ background service started.");

chrome.runtime.onMessage.addListener((message) => {

  if (message.type === "ATTENDIQ_PAGE_READY") {

    console.log(
      "AttendIQ: Attendance page is ready:",
      message.url
    );
  }

  if (message.type === "ATTENDIQ_ATTENDANCE_DATA") {

    console.log(
      "========================================"
    );

    console.log(
      "AttendIQ: REAL ATTENDANCE DATA RECEIVED"
    );

    console.log(message.data);

    console.log(
      "========================================"
    );
  }

});