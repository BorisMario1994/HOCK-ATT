import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import "./AttendanceList.css"; // Import CSS file

const AttendanceList = () => {
  const { id } = useParams();
  const [attendance, setAttendance] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refresh, setRefresh] = useState(false); // Trigger refresh

  const fetchAttendance = () => {
    if (!startDate || !endDate) return;
    fetch(`http://localhost:5000/api/machines/${id}/attendance?start=${startDate}&end=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        const sortedData = data.sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at)); // Ensure sorting in frontend
        setAttendance(sortedData);
      })
      .catch((err) => console.error("Error fetching attendance:", err));
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAttendance(); // Initial fetch when dates are set
      const interval = setInterval(() => {
        setRefresh((prev) => !prev); // Trigger refresh every 5s
      }, 5000);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAttendance(); // Fetch when refresh state changes
    }
  }, [refresh]);

  return (
    <div className="container">
      <h1 className="title">Attendance Records</h1>
      <div className="input-container">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="date-input"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="date-input"
        />
        <Button onClick={fetchAttendance} className="fetch-button">Fetch</Button>
      </div>

      {attendance.length === 0 ? (
        <p className="no-data">No attendance records found.</p>
      ) : (
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record.registered_at}>
                  <td>{record.employee_id}</td>
                  <td>{record.registered_at.replace("T", " ").replace("Z", "")}</td>
                  <td className={record.status.toLowerCase()}>{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;
