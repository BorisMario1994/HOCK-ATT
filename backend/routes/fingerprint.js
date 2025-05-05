const express = require("express");
const sql = require("mssql");  // Using SQL Server
const axios = require("axios"); // For sending requests to ESP8266
const router = express.Router();
const { pool } = require("../config/db");

router.get("/backup/:machine_id/:slot", async (req, res) => {
  try {
    const { machine_id, slot } = req.params;

    if (!machine_id || !slot) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await pool
      .request()
      .input("machine_id", sql.VarChar, machine_id)
      .input("slot", sql.Int, slot)
      .query(
        `SELECT backupfile FROM employees_fingerprint 
         WHERE machine_id = @machine_id AND slot = @slot`
      );

    if (result.recordset.length === 0 || !result.recordset[0].backupfile) {
      return res.status(404).json({ error: "Fingerprint data not found" });
    }

    // Convert buffer to Base64
    const bufferData = result.recordset[0].backupfile;
    const base64Data = bufferData.toString("base64");

    res.status(200).json({ machine_id, slot, template: base64Data });
  } catch (error) {
    console.error("Error fetching fingerprint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.put("/backup", async (req, res) => {
  try {
    const { machine_id ,slot, template } = req.body;
    if (!machine_id || !slot ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
console.log(machine_id)
console.log(slot)
console.log(template)
const templateBuffer = Buffer.from(template, "base64");
    // Store the fingerprint data
    const result = await pool
      .request()
      .input("machine_id", sql.VarChar, machine_id)
      .input("slot", sql.Int, slot)
      .input("template",sql.VarBinary,templateBuffer)
      .query(
        `Update employees_fingerprint set backupfile = @template
         where machine_id = @machine_id and slot = @slot`
      );

    res.status(200).json({ message: "Fingerprint template updated successfully" });
  } catch (error) {
    console.error("Error updating fingerprint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/maxslot", async (req, res) => {
  try {
    const { machine_id } = req.query;

    if (!machine_id) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Fetch the fingerprint template from the database
    const result = await pool
      .request()
      .input("machine_id", sql.VarChar, machine_id)
      .query(
        `
       
WITH Tally AS (
    SELECT TOP (1000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS missing_slot
    FROM master.dbo.spt_values -- System table to generate numbers
)
SELECT MIN(missing_slot) AS maxslot
FROM Tally
WHERE missing_slot NOT IN (
    SELECT slot FROM employees_fingerprint WHERE machine_id = @machine_id
);
         `
      );
     res.status(200).json(result.recordset);
   } catch (error) {
     res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get("/getEmployeeId", async (req, res) => {
  try {
    const { machine_id , slot } = req.query;

    if (!machine_id || !slot) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Fetch the fingerprint template from the database
    const result = await pool
      .request()
      .input("machine_id", sql.VarChar, machine_id)
      .input("slot", sql.Int, slot)
      .query(
        `SELECT employee_id FROM employees_fingerprint 
         WHERE  machine_id = @machine_id and slot = @slot`
      );
     res.status(200).json(result.recordset);
   } catch (error) {
     res.status(500).json({ error: "Internal Server Error" });
  }
});


// Check if employee's fingerprint is already registered
router.get("/check/:employeeId", async (req, res) => {
    const { employeeId } = req.params;
    try {
      const result = await pool.request()
            .input("employeeId", sql.Char(8), employeeId)
            .query("SELECT distinct  employee_id FROM employees_fingerprint WHERE employee_id = @employeeId");
         

            if (result.recordset.length > 0) {
              res.json({ registered: true, message: "Fingerprint already registered" });
          } else {
              res.json({ registered: false, message: "Fingerprint not registered" });
          }
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});


router.post("/register", async (req, res) => {
  try {
    const { employee_id, machine_id ,slot } = req.body;
    if (!employee_id || !machine_id || !slot) {
      return res.status(400).json({ error: "Missing required fields" });
    }


    // Store the fingerprint data
    const result = await pool
      .request()
      .input("employee_id", sql.VarChar, employee_id)
      .input("machine_id", sql.VarChar, machine_id)
      .input("slot", sql.Int, slot)
      .query(
        `INSERT INTO employees_fingerprint (employee_id, machine_id, slot)
         VALUES (@employee_id, @machine_id, @slot)`
      );

    res.status(200).json({ message: "Fingerprint registered successfully" });
  } catch (error) {
    console.error("Error registering fingerprint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.post("/clockinout", async (req, res) => {
  try {
    const { employee_id, machine_id ,status } = req.body;
    if (!employee_id || !machine_id || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store the fingerprint data
    const result = await pool
      .request()
      .input("employee_id", sql.VarChar, employee_id)
      .input("machine_id", sql.VarChar, machine_id)
      .input("status", sql.VarChar, status)
      .query(
        `INSERT INTO employees_attendance (employee_id, machine_id, status)
         VALUES (@employee_id, @machine_id, @status)`
      );

    res.status(200).json({ message: "Clock In / Out Successfull" });
  } catch (error) {
    console.error("Error registering fingerprint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const { employee_id, machine_id } = req.body;
    if (!employee_id || !machine_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const poolRequest = pool.request()
      .input("employee_id", sql.VarChar, employee_id)
      .input("machine_id", sql.VarChar, machine_id);

      // 2️⃣ Update machinestat after deletion
    await poolRequest.query(`
      UPDATE machinestat 
      SET stat = '1', employee_id = @employee_id, purpose = 'DEL' 
      WHERE machine_id = @machine_id 
    `);
        // 2️⃣ Delay for 2 seconds (2000 milliseconds)
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 1️⃣ Delete first
    await poolRequest.query(`
      DELETE FROM employees_fingerprint 
      WHERE employee_id = @employee_id
    `);
      

    res.status(200).json({ message: "Fingerprint deleted and status updated successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




router.put("/:machine_id", async (req, res) => {
  try {
    const { machine_id } = req.params;
    const { stat } = req.body; // Get status from request body);
    const { employeeId } = req.body;
    const { purpose } = req.body;
   // console.log(employeeId);
    const result = await pool.request()
      .input("machine_id", sql.VarChar, machine_id)
      .input("stat", sql.Int, stat)
      .input("employeeid", sql.VarChar, employeeId)
      .input("purpose", sql.VarChar, purpose)
      .query("UPDATE machinestat SET stat = @stat,employee_id = @employeeid,purpose = @purpose WHERE machine_id = @machine_id");

    res.json({ success: true, message: "Machine status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
  
    const { id } = req.params;
    //console.log(id)
    const result = await pool.request()
      .input("machine_id", sql.VarChar, id)
      .query("SELECT * FROM Machines WHERE machine_id = @machine_id");
    
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
