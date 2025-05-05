import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const MachineDetails = () => {
  const { id } = useParams();
  const [machines, setMachines] = useState(null);
  console.log(id)
  useEffect(() => {
    fetch(`http://localhost:5000/api/machines/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMachines(data[0]); // Set the first object in the array
      })
      .catch((err) => console.error("Error fetching machine details:", err));
  }, [id]);

  if (!machines) {
   
    return <p className="p-6">Loading...</p>;
  }

  return (
   
    <div className="p-6">
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
