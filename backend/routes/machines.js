const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const sql = require("mssql");


router.get("/:id/search", async (req, res) => {
  const { id } = req.params;
  const { employee_id } = req.query;

  if (!employee_id) {
    return res.status(400).json({ error: "Employee Id is required" });
  }

  try {

    const { id } = req.params;
    //console.log(id)
    const result = await pool.request()
      .input("machineId", sql.VarChar, id)
      .input("employee_id", sql.VarChar, employee_id)
      .query("SELECT employee_id,slot,registered_at FROM employees_fingerprint WHERE machine_id = @machineId and employee_id like '' + @employee_id + '%' order by slot");

    res.json(result.recordset);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    sql.close();
  }
});


router.get("/:id/employees", async (req, res) => {
  const { id } = req.params;

  try {

    const { id } = req.params;
    //console.log(id)
    const result = await pool.request()
      .input("machineId", sql.VarChar, id)
      .query("SELECT employee_id,slot,registered_at FROM employees_fingerprint WHERE machine_id = @machineId order by slot");

    res.json(result.recordset);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    sql.close();
  }
});

router.get("/:id/attendance", async (req, res) => {
  const { id } = req.params;
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and End dates are required" });
  }
  try {

    const { id } = req.params;
   // console.log(id);
   // console.log(start);
  //  console.log(end);
    const result = await pool.request()
      .input("machineId", sql.VarChar, id)
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query("SELECT employee_id,status,cast(registered_at as datetime) as registered_at FROM employees_attendance WHERE machine_id = @machineId and cast(registered_at as date) between @start and @end ORDER BY registered_at DESC");

    res.json(result.recordset);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    sql.close();
  }
});


// Get all machines
router.get("/", async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Machines");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get machine details
router.get("/:id", async (req, res) => {
  try {
  
    const { id } = req.params;
    //console.log(id)
    const result = await pool.request()
      .input("machineId", sql.VarChar, id)
      .query("SELECT * FROM Machines WHERE machine_id = @machineId");
    
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// Update machine details
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)
    const result = await pool.request()
      .input("machineId", sql.VarChar, id)
      .query(
        "UPDATE Machines SET last_active = getdate() WHERE machine_id = @machineId"
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Machine not found" });
    }

    res.json({ message: "Machine updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get machine stat to ready for registration
router.get("/checkstat/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input("machineId", sql.VarChar, id)
      .query(`
        SELECT stat,employee_id,purpose,
        case when purpose = 'DEL' then (select slot from employees_fingerprint B where B.employee_id = A.employee_id) else NULL end as slot 
        FROM machinestat A WHERE machine_id = @machineId
        AND (CASE WHEN purpose = 'DEL' then (select slot from employees_fingerprint B where B.employee_id = A.employee_id) else employee_id end ) not in (select employee_id from employees_fingerprint where machine_id =  @machineId)
        `);
  
      res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
