# =========================================================
#  Gateway G1E — AMBIENSE · Tiva C DHT11 → Supabase
#  Lit les donnees temperature + humidite du capteur DHT11
#  connecte sur PA_7 de la carte Tiva C et les envoie en
#  base Supabase. Surveille aussi les commandes ventilateur.
#
#  Format serie attendu (9600 baud) :
#    Humidite: 45 %   Temperature: 23 *C
#    Erreur : ...
# =========================================================
import os
import re
import time
import threading
import serial
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# ── Connexion Supabase ────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
PORT         = os.environ.get("SERIAL_PORT", "COM6")
BAUD         = int(os.environ.get("BAUD_RATE", "9600"))

sb = create_client(SUPABASE_URL, SERVICE_KEY)

# IDs des appareils en base
TEMP_ID = "G1E_temperature"
HUM_ID  = "G1E_humidity"
FAN_ID  = "G1E_ventilateur"

# Regex pour parser la ligne Tiva :
#   "Humidite: 45 %   Temperature: 23 *C"
PATTERN = re.compile(
    r"Humidite\s*:\s*(\d+)\s*%.*Temperature\s*:\s*(\d+)\s*\*C",
    re.IGNORECASE,
)


def insert_measurement(device_id: str, type_: str, value: float, unit: str) -> None:
    """Insere une mesure dans G1E_measurements."""
    try:
        sb.table("G1E_measurements").insert({
            "device_id":  device_id,
            "type":       type_,
            "value":      value,
            "unit":       unit,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        print(f"[{ts}] {device_id:20s}  {type_:12s} = {value} {unit}")
    except Exception as e:
        print(f"[ERREUR Supabase] {e}")


def read_loop(ser: serial.Serial) -> None:
    """Lit en continu le port serie et envoie les mesures."""
    print(f"[GATEWAY] Ecoute sur {PORT} ({BAUD} baud)...")
    while True:
        try:
            raw  = ser.readline()
            line = raw.decode(errors="ignore").strip()
            if not line:
                continue

            print(f"[SERIE] {line}")

            m = PATTERN.search(line)
            if m:
                humidity    = float(m.group(1))
                temperature = float(m.group(2))

                insert_measurement(TEMP_ID, "temperature", temperature, "C")
                insert_measurement(HUM_ID,  "humidity",    humidity,    "%")
            elif "erreur" in line.lower():
                print(f"[CAPTEUR] {line}")

        except serial.SerialException as e:
            print(f"[ERREUR SERIE] {e}")
            time.sleep(2)
        except Exception as e:
            print(f"[ERREUR] {e}")
            time.sleep(1)


def command_loop(ser: serial.Serial) -> None:
    """Surveille G1E_commands et envoie les commandes au ventilateur."""
    print("[GATEWAY] En attente de commandes ventilateur...")
    while True:
        try:
            res = (
                sb.table("G1E_commands")
                .select("*")
                .eq("device_id", FAN_ID)
                .eq("status", "pending")
                .execute()
            )
            for cmd in res.data:
                action = cmd["action"]
                if action == "set_speed":
                    speed = cmd.get("payload", {}).get("speed", 50)
                    ser.write(f"FAN:{speed}\n".encode())
                    print(f"[VENTILATEUR] set_speed = {speed}%")
                elif action == "on":
                    ser.write(b"FAN:100\n")
                    print("[VENTILATEUR] on")
                elif action == "off":
                    ser.write(b"FAN:0\n")
                    print("[VENTILATEUR] off")

                sb.table("G1E_commands") \
                  .update({"status": "done"}) \
                  .eq("id", cmd["id"]) \
                  .execute()

        except Exception as e:
            print(f"[ERREUR commandes] {e}")

        time.sleep(0.5)


if __name__ == "__main__":
    print("=" * 50)
    print("  AMBIENSE Gateway — G1E")
    print(f"  Port   : {PORT}  ({BAUD} baud)")
    print(f"  Serveur: {SUPABASE_URL[:40]}...")
    print("=" * 50)

    try:
        ser = serial.Serial(PORT, BAUD, timeout=2)
        time.sleep(1)  # laisse le temps a la Tiva de s'initialiser
    except serial.SerialException as e:
        print(f"[ERREUR] Impossible d'ouvrir {PORT} : {e}")
        print("Verifiez que la carte est branchee et que le bon port est defini dans .env")
        raise

    # Thread de lecture serie (daemon : s'arrete avec le programme)
    threading.Thread(target=read_loop, args=(ser,), daemon=True).start()

    # Boucle principale : commandes ventilateur
    command_loop(ser)
