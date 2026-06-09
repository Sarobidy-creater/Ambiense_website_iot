import os, time, threading
import serial
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
sb  = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
ser = serial.Serial(os.environ["SERIAL_PORT"], 115200, timeout=1)

# Nomenclature G1E : les tables et IDs d'appareils sont préfixés G1E_
TEMP_ID = "G1E_temperature"
FAN_ID  = "G1E_ventilateur"

def read_loop():       # TIVA -> Supabase
    while True:
        line = ser.readline().decode(errors="ignore").strip()
        if line.startswith("TEMP:"):
            sb.table("G1E_measurements").insert({
                "device_id": TEMP_ID,
                "type":      "temperature",
                "value":     float(line[5:]),
                "unit":      "C",
            }).execute()

def command_loop():    # Supabase -> TIVA
    while True:
        res = sb.table("G1E_commands").select("*") \
            .eq("device_id", FAN_ID).eq("status", "pending").execute()
        for cmd in res.data:
            if cmd["action"] == "set_speed":
                ser.write(f"FAN:{cmd['payload']['speed']}\n".encode())
            elif cmd["action"] == "on":
                ser.write(b"FAN:100\n")
            elif cmd["action"] == "off":
                ser.write(b"FAN:0\n")
            sb.table("G1E_commands").update({"status": "done"}).eq("id", cmd["id"]).execute()
        time.sleep(0.5)

if __name__ == "__main__":
    threading.Thread(target=read_loop, daemon=True).start()
    command_loop()