const ALLOWED_DASHBOARD_ORIGINS = new Set([
  "http://localhost:5173",
]);

window.addEventListener("message", (event) => {
  // Only accept messages from this page itself.
  if (event.source !== window) {
    return;
  }

  // Only accept messages from the configured local dashboard.
  if (!ALLOWED_DASHBOARD_ORIGINS.has(event.origin)) {
    return;
  }

  const message = event.data;

  if (
    !message ||
    message.source !== "ATTENDIQ_DASHBOARD_PAGE" ||
    message.type !== "GET_LATEST_ATTENDANCE"
  ) {
    return;
  }

  chrome.runtime.sendMessage(
    {
      type: "ATTENDIQ_GET_LATEST_ATTENDANCE",
    },
    (response) => {
      if (chrome.runtime.lastError) {
        window.postMessage(
          {
            source: "ATTENDIQ_EXTENSION",
            type: "LATEST_ATTENDANCE",
            requestId: message.requestId,
            success: false,
            error: chrome.runtime.lastError.message,
          },
          event.origin
        );

        return;
      }

      window.postMessage(
        {
          source: "ATTENDIQ_EXTENSION",
          type: "LATEST_ATTENDANCE",
          requestId: message.requestId,
          success: Boolean(response?.success),
          data: response?.data || null,
          error: response?.error || null,
        },
        event.origin
      );
    }
  );
});

console.log("AttendIQ: Dashboard bridge loaded.");