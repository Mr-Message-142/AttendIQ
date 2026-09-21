export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();

  return permission === "granted";
}

export function sendAttendanceNotification(subject, record) {
  if (!("Notification" in window)) {
    alert("Browser notifications are not supported.");
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const status = record.attendence ? "PRESENT ✅" : "ABSENT ❌";

  new Notification("Smart Attendance Monitor", {
    body: `${subject}\nDate: ${record.date}\nStatus: ${status}`,
    icon: "/vite.svg",
  });
}