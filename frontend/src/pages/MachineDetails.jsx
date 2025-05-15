import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const MachineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [machines, setMachines] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/machines/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMachines(data[0]); // Set the first object in the array
      })
      .catch((err) => console.error("Error fetching machine details:", err));
  }, [id]);

  const handleBack = () => {
    // Navigate back to MachineList with state indicating we're returning from details
    navigate('/', { 
      state: { 
        returnFromDetails: true 
      }
    });
  };

  if (!machines) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6">
      <Button 
        onClick={handleBack}
        className="mb-4"
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 4,
          marginBottom: '16px'
        }}
      >
        ← Back to Machine List
      </Button>
      
      <h1 className="text-2xl font-bold mb-4">{machines.machine_id}</h1>
      <Card className="p-4">
        <div className="mt-4 flex flex-col gap-2">
          <Link to={`/machine/${id}/employees`}>
            <Button className="w-full">View Employees</Button>
          </Link>
          <>  </>
          <Link to={`/machine/${id}/attendance`}>
            <Button className="w-full">Check Attendance</Button>
          </Link>
          <>  </>
          <Link to={`/machine/${id}/register-fingerprint`} state={{ machineId: id }}>
            <Button className="w-full">Register Fingerprint</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default MachineDetails;
