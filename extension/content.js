console.log("AttendIQ content script started.");


// =====================================================
// LOAD PAGE HOOK
// =====================================================

const script = document.createElement("script");

script.src = chrome.runtime.getURL("pageHook.js");

script.onload = () => {

  console.log(
    "AttendIQ: pageHook.js loaded."
  );

  script.remove();

};


script.onerror = (error) => {

  console.error(
    "AttendIQ: Failed to load pageHook.js.",
    error
  );

};


(document.head || document.documentElement).appendChild(script);


// =====================================================
// RECEIVE DATA FROM PAGE HOOK
// =====================================================

window.addEventListener(
  "message",
  async (event) => {

    // -------------------------------------------------
    // Ignore messages from other windows
    // -------------------------------------------------

    if (event.source !== window) {
      return;
    }


    // -------------------------------------------------
    // Ignore unrelated messages
    // -------------------------------------------------

    if (
      event.data?.source !==
      "ATTENDIQ_PAGE"
    ) {

      return;

    }


    // =================================================
    // ATTENDANCE RESPONSE
    // =================================================

    if (
      event.data?.type ===
      "ATTENDANCE_RESPONSE"
    ) {

      console.log(
        "AttendIQ: Attendance response captured:",
        event.data.data
      );


      // ------------------------------------------------
      // Check extension context
      // ------------------------------------------------

      if (!chrome.runtime?.id) {

        console.error(
          "AttendIQ: Extension context is unavailable."
        );

        return;

      }


      console.log(
        "AttendIQ: Sending attendance data to background..."
      );


      // ------------------------------------------------
      // Send attendance data to background
      // ------------------------------------------------

      try {

        const response =
          await chrome.runtime.sendMessage({

            type:
              "ATTENDIQ_ATTENDANCE_DATA",

            data:
              event.data.data

          });


        console.log(
          "AttendIQ: Background response received:",
          response
        );


      } catch (error) {

        console.error(
          "AttendIQ: Background message failed:",
          error
        );

      }

    }

  }
);


// =====================================================
// PAGE READY
// =====================================================

(async () => {

  try {

    const response =
      await chrome.runtime.sendMessage({

        type:
          "ATTENDIQ_PAGE_READY",

        url:
          window.location.href

      });


    console.log(
      "AttendIQ: PAGE_READY response:",
      response
    );


  } catch (error) {

    console.error(
      "AttendIQ: PAGE_READY message failed:",
      error
    );

  }

})();