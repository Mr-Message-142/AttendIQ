import { getLatestAttendance } from "../utils/attendanceUtils";

const STORAGE_KEY = "smart_attendance_last_record";

export function getSavedRecord() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function saveRecord(record) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(record)
  );
}

export function checkForAttendanceChange(records) {
  if (!records || records.length === 0) {
    return {
      changed: false,
      newRecord: null,
    };
  }

  const latestRecord = getLatestAttendance(records);
  const previousRecord = getSavedRecord();

  // First time running the monitor
  if (!previousRecord) {
    saveRecord(latestRecord);

    return {
      changed: false,
      newRecord: latestRecord,
    };
  }

  const isNewRecord =
    latestRecord.sr_no > previousRecord.sr_no;

  const statusChanged =
    latestRecord.sr_no === previousRecord.sr_no &&
    latestRecord.attendence !== previousRecord.attendence;

  const changed = isNewRecord || statusChanged;

  if (changed) {
    saveRecord(latestRecord);
  }

  return {
    changed,
    newRecord: latestRecord,
  };
}