console.log("AttendIQ: EduPlusCampus attendance page detected.");

function sendPageStatus() {
  chrome.runtime.sendMessage({
    type: "ATTENDIQ_PAGE_READY",
    url: window.location.href
  });
}

sendPageStatus();