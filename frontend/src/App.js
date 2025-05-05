import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MachineList from "./pages/MachineList";
import MachineDetails from "./pages/MachineDetails";
import RegisterFingerprint from "./pages/RegisterFingerprint";
import AttendanceList from "./pages/AttendanceList";
import EmployeeList from "./pages/EmployeeList";

import "./App.css";


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MachineList />} />
                <Route path="/machine/:id" element={<MachineDetails />} />
                <Route path="/machine/:id/register-fingerprint" element={<RegisterFingerprint />} />
                <Route path="/machine/:id/attendance" element={<AttendanceList />} />
                <Route path="/machine/:id/employees" element={<EmployeeList />} />

            </Routes>
        </Router>
    );
};

export default App;
