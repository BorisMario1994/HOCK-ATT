import pyodbc



# Load DB credentials from .env
server = '192.168.52.34'
database = 'HOCK'
username = 'sa'
password = 'Hclsap2023'

conn_str = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no'
try:
  conn = pyodbc.connect(conn_str,timeout=10)
  print("oke")
  conn.close()
except Exception as e:
  print("gagal")
  print(e)