import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link, useLocation } from "react-router-dom";

const MachineList = () => {
  const location = useLocation();
  const [machineName, setMachineName] = React.useState("Loading...");
  const [active, setActive] = React.useState(""); // "in" or "out"
  const [clockStatus, setClockStatus] = React.useState("");
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showMachineList, setShowMachineList] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [machines, setMachines] = React.useState([]);
  const [authError, setAuthError] = React.useState("");

  // Check for existing auth state and return path
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const returnFromDetails = location.state?.returnFromDetails;

    if (isAuthenticated === "true" && returnFromDetails) {
      setShowMachineList(true);
      fetchMachines();
    }
  }, [location]);

  const fetchClockStatus = async (machine_id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/clock-status/${machine_id}`);
      if (response.ok) {
        const data = await response.json();
        setClockStatus(data.status);
        setIsConnected(true);
        setConnectionError(false);
      } else {
        setConnectionError(true);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error fetching clock status:", error);
      setConnectionError(true);
      setIsConnected(false);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/machine-name");
        if (response.ok) {
          const data = await response.json();
          const name = data.machine_name || "Unknown Machine";
          setMachineName(name);
          setIsConnected(true);
          // Fetch initial clock status after getting machine name
          await fetchClockStatus(name);
        } else {
          setConnectionError(true);
          setMachineName("Unknown Machine");
        }
      } catch (error) {
        console.error("Error fetching machine name:", error);
        setConnectionError(true);
        setMachineName("Unknown Machine");
      }
    };

    fetchData();
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      if (machineName !== "Unknown Machine" && machineName !== "Loading...") {
        fetchClockStatus(machineName);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [machineName]);

  const handleClockStatus = async (status) => {
    setActive(status);
    const clockText = status === "in" ? "CLOCK IN" : "CLOCK OUT";
    setClockStatus(clockText);

    try {
      const response = await fetch("http://localhost:5000/api/clock-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: clockText,
          machine_id: machineName
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to update clock status");
        setConnectionError(true);
      } else {
        setConnectionError(false);
      }
    } catch (error) {
      console.error("Error updating clock status:", error);
      setConnectionError(true);
    }
  };

  const handleAuth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthError("");
        setShowAuthModal(false);
        setShowMachineList(true);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", data.username);
        localStorage.setItem("userLevel", data.level);
        fetchMachines();
      } else {
        setAuthError(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Authentication failed. Please try again.");
    }
  };

  const handleCloseMachineList = () => {
    setShowMachineList(false);
    localStorage.removeItem("isAuthenticated");
  };

  const fetchMachines = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/machines");
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };

  return (
    <div>
      {/* Machine Lists Button */}
      <Button
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 8,
        }}
        onClick={() => setShowAuthModal(true)}
      >
        Machine Lists
      </Button>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Card style={{ padding: '32px', width: '300px', backgroundColor: 'white' }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Authentication Required</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Username</label>
              <input
                type="text"
                placeholder="Enter username (MISW/MCNB)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                style={{ 
                  width: '95%', 
                  padding: '8px', 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '95%', 
                  padding: '8px', 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
            </div>
            {authError && (
              <div style={{ 
                color: 'red', 
                marginBottom: '15px', 
                textAlign: 'center',
                padding: '8px',
                backgroundColor: '#ffebee',
                borderRadius: 4,
                fontSize: '14px'
              }}>
                {authError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button 
                onClick={handleAuth} 
                style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white',
                  padding: '10px 20px',
                  fontSize: '14px'
                }}
              >
                Login
              </Button>
              <Button 
                onClick={() => {
                  setShowAuthModal(false);
                  setUsername("");
                  setPassword("");
                  setAuthError("");
                }} 
                style={{ 
                  backgroundColor: '#f44336', 
                  color: 'white',
                  padding: '10px 20px',
                  fontSize: '14px'
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Machine List Modal */}
      {showMachineList && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Card style={{ padding: '32px', width: '80%', maxWidth: '800px', backgroundColor: 'white', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Machine List</h2>
              <Button onClick={handleCloseMachineList} style={{ backgroundColor: '#f44336', color: 'white' }}>
                Close
              </Button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Machine ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Last Active</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.machine_id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>{machine.machine_id}</td>
                    <td style={{ padding: '12px' }}>
                      {machine.last_active
                        ? new Date(machine.last_active).toLocaleString()
                        : "Never Active"}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link 
                        to={`/machine/${machine.machine_id}`}
                        state={{ returnToList: true }}
                      >
                        <Button style={{ backgroundColor: '#2196F3', color: 'white' }}>
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Existing Clock In/Out UI */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Card style={{ width: 350, padding: 32, textAlign: "center", boxShadow: "0 4px 24px #0001" }}>
          <h1 style={{ fontSize: 32, marginBottom: 32, textAlign: 'center' }}>{machineName}</h1>
          
          {/* Connection Status Message */}
          {connectionError ? (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 24, 
              padding: "12px",
              backgroundColor: "#ff000022",
              color: "#ff0000",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 18
            }}>
              You are currently disconnected
            </div>
          ) : (
            clockStatus && (
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 24, 
                padding: "12px",
                backgroundColor: clockStatus === "CLOCK IN" ? "#4CAF5022" : "#f4433622",
                color: clockStatus === "CLOCK IN" ? "#4CAF50" : "#f44336",
                borderRadius: 8,
                fontWeight: "bold",
                fontSize: 18
              }}>
                Current Status: {clockStatus}
              </div>
            )
          )}

          <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            <Button
              style={{
                backgroundColor: active === "in" ? "#4CAF50" : "#e0e0e0",
                color: active === "in" ? "white" : "#333",
                fontWeight: "bold",
                fontSize: 28,
                padding: "32px 48px",
                borderRadius: 12,
                border: "none",
                boxShadow: active === "in" ? "0 2px 8px #4CAF5055" : undefined,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 16
              }}
              onClick={() => handleClockStatus("in")}
              disabled={connectionError}
            >
              <span role="img" aria-label="clock-in" style={{ fontSize: 36 }}>🟢</span>
              CLOCK IN
            </Button>
            <Button
              style={{
                backgroundColor: active === "out" ? "#f44336" : "#e0e0e0",
                color: active === "out" ? "white" : "#333",
                fontWeight: "bold",
                fontSize: 28,
                padding: "32px 48px",
                borderRadius: 12,
                border: "none",
                boxShadow: active === "out" ? "0 2px 8px #f4433655" : undefined,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 16
              }}
              onClick={() => handleClockStatus("out")}
              disabled={connectionError}
            >
              <span role="img" aria-label="clock-out" style={{ fontSize: 36 }}>🔴</span>
              CLOCK OUT
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MachineList;
