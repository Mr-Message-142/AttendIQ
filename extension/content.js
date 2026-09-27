console.log("AttendIQ content script started.");

const script = document.createElement("script");

script.src = chrome.runtime.getURL("pageHook.js");

script.onload = () => {
  script.remove();
};

(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {

  if (event.source !== window) {
    return;
  }

  if (event.data?.source !== "ATTENDIQ_PAGE") {
    return;
  }

  if (event.data?.type === "ATTENDANCE_RESPONSE") {

    console.log(
      "AttendIQ: Attendance response captured:",
      event.data.data
    );

    chrome.runtime.sendMessage({
      type: "ATTENDIQ_ATTENDANCE_DATA",
      data: event.data.data
    });
  }

});

chrome.runtime.sendMessage({
  type: "ATTENDIQ_PAGE_READY",
  url: window.location.href
});