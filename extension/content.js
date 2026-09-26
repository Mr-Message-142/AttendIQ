console.log("AttendIQ: EduPlusCampus attendance page detected.");

chrome.runtime.sendMessage({
  type: "ATTENDIQ_PAGE_READY",
  url: window.location.href
});

window.addEventListener("message", (event) => {
  if (event.source !== window) {
    return;
  }

  if (event.data?.type === "ATTENDIQ_ATTENDANCE_DATA") {
    console.log(
      "AttendIQ received attendance data:",
      event.data.data
    );

    chrome.runtime.sendMessage({
      type: "ATTENDIQ_ATTENDANCE_DATA",
      data: event.data.data
    });
  }
});