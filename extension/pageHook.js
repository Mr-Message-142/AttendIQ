(function () {
  console.log("AttendIQ page hook started.");

  /*
   * ---------------------------------------------------------
   * FETCH INTERCEPTOR
   * ---------------------------------------------------------
   */

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0]?.url;

      if (url && url.includes("learnerAttendence")) {
        console.log(
          "AttendIQ: learnerAttendence detected through FETCH."
        );

        const clonedResponse = response.clone();
        const data = await clonedResponse.json();

        sendAttendanceData(data);
      }
    } catch (error) {
      console.error(
        "AttendIQ FETCH capture error:",
        error
      );
    }

    return response;
  };


  /*
   * ---------------------------------------------------------
   * XMLHttpRequest INTERCEPTOR
   * ---------------------------------------------------------
   */

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method,
    url,
    ...rest
  ) {
    this._attendIQUrl = url;

    return originalOpen.call(
      this,
      method,
      url,
      ...rest
    );
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {

      try {
        const url = this._attendIQUrl || "";

        if (url.includes("learnerAttendence")) {

          console.log(
            "AttendIQ: learnerAttendence detected through XHR."
          );

          let data;

          if (this.responseType === "json") {
            data = this.response;
          } else {
            data = JSON.parse(this.responseText);
          }

          sendAttendanceData(data);
        }

      } catch (error) {

        console.error(
          "AttendIQ XHR capture error:",
          error
        );

      }

    });

    return originalSend.apply(this, args);
  };


  /*
   * ---------------------------------------------------------
   * SEND DATA TO CONTENT SCRIPT
   * ---------------------------------------------------------
   */

  function sendAttendanceData(data) {

    console.log(
      "AttendIQ: Attendance response captured."
    );

    console.log(data);

    window.postMessage(
      {
        source: "ATTENDIQ_PAGE",
        type: "ATTENDANCE_RESPONSE",
        data: data
      },
      window.location.origin
    );
  }

})();