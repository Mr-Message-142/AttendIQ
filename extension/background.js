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
      "AttendIQ: Attendance data received:"
    );

    console.log(message.data);
  }

});