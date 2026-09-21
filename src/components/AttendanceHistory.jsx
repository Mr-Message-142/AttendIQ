function AttendanceHistory({ records }) {
  return (
    <div className="history-card">
      <div className="section-title">
        <h2>Attendance History</h2>
        <span>{records.length} lectures</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Faculty</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {[...records].reverse().map((record) => (
              <tr key={record.sr_no}>
                <td>{record.sr_no}</td>

                <td>{record.date}</td>

                <td>{record.faculty}</td>

                <td>
                  {record.attendence ? (
                    <span className="status present">
                      PRESENT
                    </span>
                  ) : (
                    <span className="status absent">
                      ABSENT
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendanceHistory;