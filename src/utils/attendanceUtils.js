export function getAttendancePercentage(present, total) {
  if (total === 0) return 0;

  return ((present / total) * 100).toFixed(2);
}

export function getLatestAttendance(records) {
  if (!records || records.length === 0) {
    return null;
  }

  return records.reduce((latest, current) => {
    return current.sr_no > latest.sr_no ? current : latest;
  });
}

export function detectAttendanceChange(oldRecord, newRecord) {
  if (!oldRecord || !newRecord) {
    return false;
  }

  return (
    oldRecord.sr_no !== newRecord.sr_no ||
    oldRecord.attendence !== newRecord.attendence
  );
}