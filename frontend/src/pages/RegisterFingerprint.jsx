import { useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";

const RegisterFingerprint = () => {
  const location = useLocation();
  const machineId = location.state?.machineId || "Unknown";

  const [employeeId, setEmployeeId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // State for loading spinner

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const checkEmployee = async () => {
    if (!/^\d{8}$/.test(employeeId)) {
      setMessage("Employee ID must be 8 digits.");
      return;
    }
  
    setLoading(true); // Start loading
  
    try {
      let fingerprintRegistered = false;
  
      while (!fingerprintRegistered) {
        const response = await fetch(`http://localhost:5000/api/fingerprint/check/${employeeId}`);
        const data = await response.json();
  
        if (data.registered) {
          setMessage("Fingerprint already registered.");
          fingerprintRegistered = true; // Stop the loop
        } else {
          setMessage(`Waiting for fingerprint registration on Machine ${machineId}...`);
          await updateMachineStatus(machineId, 1, employeeId);
        }
  
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 3 sec before next check
      }
    } catch (error) {
      console.error("Error checking employee:", error);
      setMessage("Error checking employee. Please try again.");
    } finally {
      setLoading(false); // Always stop loading when fingerprint is registered
    }
  };

  const updateMachineStatus = async (machineId, status, employeeId) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated delay
      const response = await fetch(`http://localhost:5000/api/fingerprint/${machineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stat: status, employeeId: employeeId, purpose: "REG" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update machine status");

      //setMessage("Machine status updated successfully.");
    } catch (error) {
      console.error("Error updating machine status:", error);
      setMessage("Failed to update machine status.");
    } 
  };

  return (
    <div>
      <h2>Register Fingerprint for Machine {machineId}</h2>
      <input
        type="text"
        placeholder="Enter Employee ID"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        style={{
          width: "200px",
          height: "12px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.1)",
          outline: "none",
          fontSize: "16px",
          transition: "border-color 0.3s ease-in-out",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#007bff")}
        onBlur={(e) => (e.target.style.borderColor = "#ccc")}
      />
      <Button className="w-full" onClick={checkEmployee} disabled={loading}>
        {loading ? "Processing..." : "Check Employee"}
      </Button>
      <p>{message}</p>

      {/* Spinner Styles */}
      <style>
        {`
          .spinner {
            margin-top: 10px;
            width: 24px;
            height: 24px;
            border: 3px solid rgba(0, 0, 0, 0.3);
            border-top-color: #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default RegisterFingerprint;
