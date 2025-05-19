from flask import Flask, request, jsonify
import pyodbc
import os
from dotenv import load_dotenv
import base64
import time
from flask_cors import CORS
import hashlib

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

load_dotenv()


# Load DB credentials from .env
server = os.getenv('DB_SERVER')
database = os.getenv('DB_DATABASE')
username = os.getenv('DB_USERNAME')
password = os.getenv('DB_PASSWORD')
driver = os.getenv('DB_DRIVER')

def get_conn():
    return pyodbc.connect(
        f'DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}'
    )

def hash_password(password, salt):
    # Convert the password to bytes and combine with salt
    salted = (password + salt).encode('utf-8')
    # Create SHA256 hash
    hasher = hashlib.sha256()
    hasher.update(salted)
    # Get the hexadecimal representation and convert to uppercase
    hashed = '0x' + hasher.hexdigest().upper()
    return hashed

# --- /api/machines endpoints ---

@app.route('/api/machines', methods=['GET'])
def get_machines():
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Machines")
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/machines/<id>', methods=['GET'])
def get_machine_details(id):
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Machines WHERE machine_id = ?", id)
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/machines/<id>/search', methods=['GET'])
def search_machine_employees(id):
    employee_id = request.args.get('employee_id')
    if not employee_id:
        return jsonify({"error": "Employee Id is required"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT employee_id,slot,registered_at FROM employees_fingerprint WHERE machine_id = ? and employee_id like ? order by slot",
            id, f"{employee_id}%"
        )
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/machine-name', methods=['GET'])
def get_machine_name():
    try:
        # Adjust the path as needed
        file_path = 'D:/Mname.txt'
        with open(file_path, 'r') as f:
            name = f.read().strip()
        return jsonify({"machine_name": name})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/machines/<id>/employees', methods=['GET'])
def get_machine_employees(id):
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT employee_id,slot,registered_at FROM employees_fingerprint WHERE machine_id = ? order by slot",
            id
        )
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/machines/<id>/attendance', methods=['GET'])
def get_machine_attendance(id):
    start = request.args.get('start')
    end = request.args.get('end')
    if not start or not end:
        return jsonify({"error": "Start and End dates are required"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT employee_id,status,cast(registered_at as datetime) as registered_at FROM employees_attendance WHERE machine_id = ? and cast(registered_at as date) between ? and ? ORDER BY registered_at DESC",
            id, start, end
        )
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/machines/<id>', methods=['PUT'])
def update_machine(id):
    print(id)
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Machines SET last_active = getdate() WHERE machine_id = ?",
            id
        )
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Machine not found"}), 404
        conn.close()
        return jsonify({"message": "Machine updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/machines/checkstat/<id>', methods=['GET'])
def get_machine_stat(id):
    try:
        print(id)
        conn = get_conn()
        cursor = conn.cursor()
        query = """
            SELECT stat,employee_id,purpose,
            case when purpose = 'DEL' then (select slot from employees_fingerprint B where B.employee_id = A.employee_id) else NULL end as slot 
            FROM machinestat A WHERE machine_id = ?
            AND (CASE WHEN purpose = 'DEL' then (select slot from employees_fingerprint B where B.employee_id = A.employee_id) else employee_id end ) not in (select employee_id from employees_fingerprint where machine_id =  ?)
        """
        cursor.execute(query, id, id)
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        print(results)
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- /api/fingerprint endpoints ---

@app.route('/api/fingerprint/maxslot', methods=['GET'])
def get_maxslot():
    machine_id = request.args.get('machine_id')
    if not machine_id:
        return jsonify({"error": "Missing required parameters"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        query = """
            WITH Tally AS (
                SELECT TOP (1000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS missing_slot
                FROM master.dbo.spt_values
            )
            SELECT MIN(missing_slot) AS maxslot
            FROM Tally
            WHERE missing_slot NOT IN (
                SELECT slot FROM employees_fingerprint WHERE machine_id = ?
            );
        """
        cursor.execute(query, machine_id)
        row = cursor.fetchone()
        conn.close()
        return jsonify({"maxslot": row[0] if row else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/getEmployeeId', methods=['GET'])
def get_employee_id():
    machine_id = request.args.get('machine_id')
    slot = request.args.get('slot')
    print(machine_id)
    print(slot)
    if not machine_id or not slot:
        return jsonify({"error": "Missing required parameters"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT employee_id FROM employees_fingerprint WHERE machine_id = ? and slot = ?",
            machine_id, slot
        )
        row = cursor.fetchone()
        conn.close()
        print(row)
        return jsonify({"employee_id": row[0] if row else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/check/<employeeId>', methods=['GET'])
def check_fingerprint(employeeId):
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT distinct employee_id FROM employees_fingerprint WHERE employee_id = ?",
            employeeId
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return jsonify({"registered": True, "message": "Fingerprint already registered"})
        else:
            return jsonify({"registered": False, "message": "Fingerprint not registered"})
    except Exception as e:
        return jsonify({"error": "Database error"}), 500

@app.route('/api/fingerprint/register', methods=['POST'])
def register_fingerprint():
    print("tes")
    data = request.get_json()
    employee_id = data.get('employee_id')
    machine_id = data.get('machine_id')
    slot = data.get('slot')
    print(data)

    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO employees_fingerprint (employee_id, machine_id, slot) VALUES (?, ?, ?)",
             (employee_id, machine_id, slot)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Fingerprint registered successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/clockinout', methods=['POST'])
def clockinout():
    data = request.get_json()
    employee_id = data.get('employee_id')
    machine_id = data.get('machine_id')
    status = data.get('status')
    if not employee_id or not machine_id or not status:
        return jsonify({"error": "Missing required fields"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO employees_attendance (employee_id, machine_id, status) VALUES (?, ?, ?)",
            (employee_id, machine_id, status)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Clock In / Out Successfull"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/delete', methods=['DELETE'])
def delete_fingerprint():
    data = request.get_json()
    employee_id = data.get('employee_id')
    machine_id = data.get('machine_id')
    if not employee_id or not machine_id:
        return jsonify({"error": "Missing required fields"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        # Update machinestat after deletion
        cursor.execute(
            "UPDATE machinestat SET stat = '1', employee_id = ?, purpose = 'DEL' WHERE machine_id = ?",
            (employee_id, machine_id)
        )
        conn.commit()
        time.sleep(6)  # Delay for 6 seconds
        # Delete fingerprint
        cursor.execute(
            "DELETE FROM employees_fingerprint WHERE employee_id = ?",
            employee_id
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Fingerprint deleted and status updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/<machine_id>', methods=['PUT'])
def update_machine_stat(machine_id):
    data = request.get_json()
    stat = data.get('stat')
    employeeId = data.get('employeeId')
    purpose = data.get('purpose')
    print("tes")
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE machinestat SET stat = ?, employee_id = ?, purpose = ? WHERE machine_id = ?",
            stat, employeeId, purpose, machine_id
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Machine status updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/<id>', methods=['GET'])
def get_machine_by_id(id):
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Machines WHERE machine_id = ?", id)
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clock-status', methods=['POST'])
def update_clock_status():
    try:
        data = request.get_json()
        status = data.get('status')  # 'CLOCK IN' or 'CLOCK OUT'
        machine_id = data.get('machine_id')
        
        if not status or not machine_id:
            return jsonify({"error": "Missing status or machine_id"}), 400
            
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE machinestat SET CLOCKSTAT = ? WHERE machine_id = ?",
            (status, machine_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": f"Clock status updated to {status}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clock-status/<machine_id>', methods=['GET'])
def get_clock_status(machine_id):
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT CLOCKSTAT FROM machinestat WHERE machine_id = ?",
            (machine_id,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify({"status": row[0] or "NO STATUS"})
        return jsonify({"status": "NO STATUS"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def authenticate_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        # Check if username starts with MISW or MCNB
        if not (username.startswith('MISW') or username.startswith('MCNB')):
            return jsonify({"error": "Unauthorized access"}), 401

        conn = get_conn()
        cursor = conn.cursor()
        
        # Query the HELPDESK_USER table with password check in SQL
        cursor.execute(
            """
            SELECT USERNAME, SUPERIOR
            FROM APPVB5225.HOCK_APP_VB.[dbo].[HELPDESK_USER]
            WHERE USERNAME = ?
              AND PASSWORD = HASHBYTES(
                    'SHA2_256',
                    CAST(
                        CONCAT(
                            CAST(SUBSTRING(SALT, 1, 5) AS VARCHAR(50)), 
                            CAST(? AS VARCHAR(50)), 
                            CAST(SUBSTRING(SALT, 6, 10) AS VARCHAR(50))
                        ) AS VARCHAR(MAX)
                    )
                )
            """,
            (username, password)
        )

        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        # user[0] = USERNAME, user[1] = SUPERIOR
        return jsonify({
            "success": True,
            "username": user[0],
            "superior": user[1]
        })

    except Exception as e:
        print(f"Authentication error: {str(e)}")  # For debugging
        return jsonify({"error": "Authentication failed"}), 500

@app.route('/api/fingerprint/newattendance', methods=['GET'])
def get_new_attendance():
    machine_id = request.args.get('machine_id')
    if not machine_id:
        return jsonify({"error": "Missing machine_id parameter"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TOP 1 rownum,employee_id, machine_id,status, registered_at
            FROM employees_attendance
            WHERE machine_id = ? AND seen_at IS NULL
            ORDER BY registered_at DESC
            """,
            machine_id
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return jsonify({
                "rownum" : row[0],
                "employee_id": row[1],
                "machine_id":row[2],
                "status": row[3],
                "registered_at": row[4]
            })
        else:
            return jsonify({})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/attendance/seen', methods=['POST'])
def mark_attendance_seen():
    data = request.get_json()
    rownum = data.get('rownum')
    print(rownum)
    if not rownum:
        return jsonify({"error": "Missing rownum"}), 400
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE employees_attendance SET seen_at = GETDATE() WHERE rownum = ?",
            rownum
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
       app.run(host="0.0.0.0", port=5000, debug=True)
