function SubjectCard({ attendance }) {
  const percentage = parseFloat(attendance.attendance);

  return (
    <div className="subject-card">
      <div className="subject-header">
        <div>
          <h2>{attendance.course_name}</h2>
          <p>{attendance.course_code}</p>
        </div>

        <div className="percentage">
          {attendance.attendance}
        </div>
      </div>

      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="subject-details">
        <div>
          <span>Present</span>
          <strong>{attendance.total_present}</strong>
        </div>

        <div>
          <span>Total</span>
          <strong>{attendance.total_conducted}</strong>
        </div>

        <div>
          <span>Faculty</span>
          <strong>{attendance.instructor_name}</strong>
        </div>
      </div>
    </div>
  );
}

export default SubjectCard;