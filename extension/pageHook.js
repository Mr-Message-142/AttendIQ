(function () {
  // Prevent installing the hook more than once.
  if (window.__ATTENDIQ_HOOK_INSTALLED__) {
    console.log("AttendIQ: Page hook already installed.");
    return;
  }

  window.__ATTENDIQ_HOOK_INSTALLED__ = true;

  console.log("AttendIQ: Page hook started.");

  const ATTENDANCE_ENDPOINT = "learnerAttendence";

  // -----------------------------------------------------
  // SEND CAPTURED ATTENDANCE TO CONTENT SCRIPT
  // -----------------------------------------------------

  function sendAttendanceData(data, method) {
    if (!data || typeof data !== "object") {
      console.warn("AttendIQ: Invalid response data.");
      return;
    }

    if (!Array.isArray(data.crs_list)) {
      console.warn(
        "AttendIQ: Response does not contain crs_list.",
        data
      );
      return;
    }

    console.log(
      `AttendIQ: Attendance response captured through ${method}.`
    );

    console.log(
      "AttendIQ: Courses captured:",
      data.crs_list.length
    );

    window.postMessage(
      {
        source: "ATTENDIQ_PAGE",
        type: "ATTENDANCE_RESPONSE",
        data
      },
      window.location.origin
    );
  }

  // -----------------------------------------------------
  // INTERCEPT FETCH REQUESTS
  // -----------------------------------------------------

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const request = args[0];

      const url =
        typeof request === "string"
          ? request
          : request?.url || "";

      if (url.includes(ATTENDANCE_ENDPOINT)) {
        console.log(
          "AttendIQ: learnerAttendence detected through FETCH."
        );

        if (!response.ok) {
          console.warn(
            "AttendIQ: Attendance FETCH returned HTTP",
            response.status
          );

          return response;
        }

        const clonedResponse = response.clone();
        const data = await clonedResponse.json();

        sendAttendanceData(data, "FETCH");
      }
    } catch (error) {
      console.error(
        "AttendIQ: FETCH capture error:",
        error
      );
    }

    return response;
  };

  // -----------------------------------------------------
  // INTERCEPT XMLHttpRequest REQUESTS
  // -----------------------------------------------------

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method,
    url,
    ...rest
  ) {
    this.__attendIQUrl =
      typeof url === "string"
        ? url
        : String(url || "");

    this.__attendIQMethod = method;

    return originalOpen.call(
      this,
      method,
      url,
      ...rest
    );
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const xhr = this;

    xhr.addEventListener(
      "load",
      function () {
        try {
          const url = xhr.__attendIQUrl || "";

          if (!url.includes(ATTENDANCE_ENDPOINT)) {
            return;
          }

          console.log(
            "AttendIQ: learnerAttendence detected through XHR."
          );

          if (xhr.status < 200 || xhr.status >= 300) {
            console.warn(
              "AttendIQ: Attendance XHR returned HTTP",
              xhr.status
            );

            return;
          }

          let data;

          if (xhr.responseType === "json") {
            data = xhr.response;
          } else {
            data = JSON.parse(xhr.responseText);
          }

          sendAttendanceData(data, "XHR");
        } catch (error) {
          console.error(
            "AttendIQ: XHR capture error:",
            error
          );
        }
      },
      { once: true }
    );

    return originalSend.apply(this, args);
  };

  console.log(
    "AttendIQ: Fetch and XHR interception installed."
  );
})();