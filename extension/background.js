console.log("AttendIQ background service started.");

chrome.runtime.onMessage.addListener((message, sender) => {

  if (message.type === "ATTENDIQ_PAGE_READY") {

    console.log(
      "AttendIQ: Attendance page is ready:",
      message.url
    );

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "AttendIQ",
      message: "Attendance monitoring is active."
    });
  }

});