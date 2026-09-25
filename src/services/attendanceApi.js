const ATTENDANCE_API =
  "https://learnerapi.vierp.in/appLearnerAcademics/learnerAttendence";

export async function fetchAttendance() {
  const response = await fetch(ATTENDANCE_API, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Attendance API failed: ${response.status}`
    );
  }

  const data = await response.json();

  return data;
}