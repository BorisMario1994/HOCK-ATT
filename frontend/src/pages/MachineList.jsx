import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";


const MachineList = () => {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    const fetchMachines = () => {
      fetch("http://localhost:5000/api/machines")
        .then((res) => res.json())
        .then((data) => setMachines(data))
        .catch((err) => console.error("Error fetching machines:", err));
    };

    fetchMachines(); // Initial fetch
    const interval = setInterval(fetchMachines, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const isStale = (lastActive) => {
    if (!lastActive) return false;

    // Convert lastActive to a Date object
    const lastActiveDate = new Date(lastActive); // Force it to be interpreted as UTC

    // Get current date in UTC
    const currentDate = new Date();

    // Convert both times to UTC+7
    const offset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const lastActiveUTC7 = new Date(lastActiveDate.getTime());
    const currentDateUTC7 = new Date(currentDate.getTime() + offset);

    // Calculate difference in minutes
    const diffMinutes = (currentDateUTC7 - lastActiveUTC7) / (1000 * 60);

    console.log("Current Date (UTC+7):", currentDateUTC7.toISOString());
    console.log("Last Active Date (UTC+7):", lastActiveUTC7.toISOString());
    console.log("Difference in minutes:", diffMinutes);

    return diffMinutes > 30; // Mark stale if more than 30 minutes old
};




  return (
    <div>
      <h1>Machine List</h1>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Machine ID</th>
            <th>Last Active</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => {
            const stale = isStale(machine.last_active); // ✅ Now this is defined

            return (
              <tr
                key={machine.machine_id}
                style={{ backgroundColor: stale ? "yellow" : "transparent" }}
              >
                <td>{machine.machine_id}</td>
                <td>
                  {machine.last_active
                    ? new Date(machine.last_active).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                        timeZone: "UTC", // Keep UTC format
                      })
                    : "Never Active"}
                </td>
                <td>
                  <Link to={`/machine/${machine.machine_id}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MachineList;
