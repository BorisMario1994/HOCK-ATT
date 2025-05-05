import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./EmployeeList.css"; // Import the CSS file for styling

const EmployeeList = () => {
  const { id } = useParams();
  const [employees, setEmployees] = useState([]);
  const [searchId, setSearchId] = useState("");

  const fetchEmployees = () => {
    fetch(`http://localhost:5000/api/machines/${id}/employees`)
      .then((res) => res.json())
      .then((data) => {
        const sortedData = data.sort((a, b) => a.slot - b.slot); // Sort by slot number
        setEmployees(sortedData);
      })
      .catch((err) => console.error("Error fetching employees:", err));
  };

  const fetchEmployeeById = () => {
    if (searchId.trim() === "") {
      fetchEmployees();
      return;
    }
    fetch(`http://localhost:5000/api/machines/${id}/search?employee_id=${searchId}`)
      .then((res) => res.json())
      .then((data) => setEmployees(data || [])) // No need to wrap in an array
      .catch((err) => console.error("Error fetching employee:", err));
  };
  
  const removeEmployee = (employeeId) => {

    const confirmDelete = window.confirm(`Are you sure you want to delete employee ID: ${employeeId}?`);
    
    if (!confirmDelete) return;
  
    fetch(`http://localhost:5000/api/fingerprint/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employee_id: employeeId,machine_id : id }), // Sending employee_id in body
    })
      .then((res) => {
        if (res.ok) {
          alert("Employee deleted successfully!");
          setEmployees(employees.filter((emp) => emp.employee_id !== employeeId));
        } else {
          alert("Failed to delete employee");
          console.error("Failed to delete employee");
        }
      })
      .catch((err) => console.error("Error deleting employee:", err));
  };
  
  

  useEffect(() => {
    fetchEmployeeById(); // Initial fetch

    const interval = setInterval(() => {
      fetchEmployeeById(); // Refresh data every 30 seconds
    }, 30000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [id, searchId]);

  return (
    <div className="container">
      <h1 className="title">Employee List</h1>
      <input
        type="text"
        placeholder="Search Employee ID..."
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
        className="search-box"
      />
      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Slot</th>
              <th>Registered At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No employees found.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.employee_id}>
                  <td>{emp.employee_id}</td>
                  <td>{emp.slot}</td>
                  <td>{emp.registered_at.replace("T", " ").replace("Z", "")}</td>
                  <td>
                    <button className="remove-button" onClick={() => removeEmployee(emp.employee_id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeList;
