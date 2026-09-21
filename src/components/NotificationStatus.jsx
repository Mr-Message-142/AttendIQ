function NotificationStatus({
  notificationEnabled,
  onEnable,
}) {
  return (
    <div className="notification-card">
      <div>
        <h3>Attendance Notifications</h3>

        <p>
          {notificationEnabled
            ? "Browser notifications are enabled."
            : "Enable notifications to receive attendance alerts."}
        </p>
      </div>

      {!notificationEnabled && (
        <button onClick={onEnable}>
          Enable Notifications
        </button>
      )}

      {notificationEnabled && (
        <span className="enabled">
          ● Enabled
        </span>
      )}
    </div>
  );
}

export default NotificationStatus;