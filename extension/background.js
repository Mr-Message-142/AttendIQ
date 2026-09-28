console.log("AttendIQ background service started.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  console.log("AttendIQ background received message:", message.type);

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

    console.log(
      "Course attendance list:"
    );

    console.table(message.data.crs_list);

    console.log(
      "========================================"
    );
  }

  sendResponse({ success: true });

  return true;
});