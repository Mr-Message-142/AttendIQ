console.log("AttendIQ content script started.");


// =====================================================
// ATTENDIQ SETTINGS
// =====================================================

// Check attendance every 5 minutes
const CHECK_INTERVAL =
  5 * 60 * 1000;


// =====================================================
// INJECT PAGE HOOK
// =====================================================

const script =
  document.createElement("script");

script.src =
  chrome.runtime.getURL("pageHook.js");


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


(
  document.head ||
  document.documentElement
).appendChild(script);


// =====================================================
// RECEIVE DATA FROM PAGE HOOK
// =====================================================

window.addEventListener(
  "message",
  async (event) => {

    // -----------------------------------------------
    // SECURITY CHECK
    // -----------------------------------------------

    if (
      event.source !== window
    ) {

      return;

    }


    if (
      event.data?.source !==
      "ATTENDIQ_PAGE"
    ) {

      return;

    }


    // -----------------------------------------------
    // ATTENDANCE RESPONSE
    // -----------------------------------------------

    if (
      event.data?.type ===
      "ATTENDANCE_RESPONSE"
    ) {

      console.log(
        "AttendIQ: Attendance response captured:",
        event.data.data
      );


      // ---------------------------------------------
      // CHECK EXTENSION CONTEXT
      // ---------------------------------------------

      if (
        !chrome.runtime?.id
      ) {

        console.error(
          "AttendIQ: Extension context is unavailable."
        );

        return;

      }


      console.log(
        "AttendIQ: Sending attendance data to background..."
      );


      // ---------------------------------------------
      // SEND TO BACKGROUND
      // ---------------------------------------------

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

      }

      catch (error) {

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

  }

  catch (error) {

    console.error(
      "AttendIQ: PAGE_READY message failed:",
      error
    );

  }

})();


// =====================================================
// AUTOMATIC ATTENDANCE CHECK
// =====================================================

console.log(
  "AttendIQ: Automatic attendance checking enabled."
);


console.log(
  "AttendIQ: Next attendance check in 5 minutes."
);


// =====================================================
// PERIODIC PAGE REFRESH
// =====================================================

setInterval(() => {

  // -------------------------------------------------
  // Make sure we are still on attendance page
  // -------------------------------------------------

  if (
    !window.location.href.includes(
      "/attendance"
    )
  ) {

    console.log(
      "AttendIQ: Not on attendance page. Skipping automatic check."
    );

    return;

  }


  console.log(
    "========================================"
  );


  console.log(
    "AttendIQ: Starting automatic attendance check..."
  );


  console.log(
    "AttendIQ: Refreshing EduPlusCampus attendance page."
  );


  console.log(
    "========================================"
  );


  // -------------------------------------------------
  // Reload the existing authenticated page
  // -------------------------------------------------

  window.location.reload();

}, CHECK_INTERVAL);