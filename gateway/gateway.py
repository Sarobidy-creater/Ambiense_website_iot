# =========================================================
#  Gateway G1E — AMBIENSE · Tiva C → Supabase
#  Lit les donnees temperature + humidite du capteur DHT
#  connecte sur la Tiva C et les envoie en base Supabase.
#  Surveille aussi les commandes ventilateur.
#  Declenchement automatique si temperature >= TEMP_THRESHOLD.
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

# ── Seuil de déclenchement automatique du ventilateur ────
TEMP_THRESHOLD  = float(os.environ.get("TEMP_THRESHOLD",  "28"))
AUTO_FAN_SPEED  = int(os.environ.get("AUTO_FAN_SPEED",   "100"))  # % vitesse (0-100)

# ── Verrou partagé pour les écritures Serial ─────────────
# Évite les collisions entre command_loop et auto_fan_loop
_serial_lock = threading.Lock()
_fan_auto_on = False   # état interne auto (évite les envois répétés)

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


def serial_write(ser: serial.Serial, data: bytes) -> None:
    """Écriture thread-safe sur le port série."""
    with _serial_lock:
        try:
            ser.write(data)
        except (serial.SerialException, PermissionError, OSError) as e:
            print(f"[ERREUR SERIE] Écriture impossible : {e}")
            raise serial.SerialException(str(e)) from e


def auto_fan(ser: serial.Serial, temperature: float, threshold: float) -> None:
    """Allume/éteint le ventilateur automatiquement selon le seuil."""
    global _fan_auto_on
    if temperature >= threshold and not _fan_auto_on:
        serial_write(ser, f"FAN:{AUTO_FAN_SPEED}\n".encode())
        _fan_auto_on = True
        print(f"[AUTO] {temperature}°C >= {threshold}°C → ventilateur {AUTO_FAN_SPEED}%")
    elif temperature < threshold and _fan_auto_on:
        serial_write(ser, b"FAN:0\n")
        _fan_auto_on = False
        print(f"[AUTO] {temperature}°C < {threshold}°C → ventilateur arrêté")


def fetch_threshold() -> float:
    """Lit le seuil thermique depuis G1E_settings ; fallback .env si indisponible."""
    try:
        res = (
            sb.table("G1E_settings")
            .select("value_num")
            .eq("key", "temp_threshold")
            .maybe_single()
            .execute()
        )
        if res.data and res.data.get("value_num") is not None:
            return float(res.data["value_num"])
    except Exception as e:
        print(f"[GATEWAY] Erreur lecture seuil : {e}")
    return TEMP_THRESHOLD  # fallback valeur .env


def auto_fan_loop(ser: serial.Serial) -> None:
    """Surveille la température en base et déclenche le ventilateur automatiquement.
    Fonctionne indépendamment du Serial — lit la dernière mesure Supabase toutes les 5s."""
    print(f"[GATEWAY] Auto-trigger ventilateur actif (seuil {TEMP_THRESHOLD}°C)...")
    while True:
        try:
            res = (
                sb.table("G1E_measurements")
                .select("value")
                .eq("device_id", TEMP_ID)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if res.data:
                temp      = float(res.data[0]["value"])
                threshold = fetch_threshold()
                auto_fan(ser, temp, threshold)
        except Exception as e:
            print(f"[ERREUR auto_fan] {e}")
        time.sleep(5)


def _reconnect(ser: serial.Serial) -> None:
    """Tente de rouvrir le port série jusqu'à succès."""
    print(f"[GATEWAY] Tentative de reconnexion sur {PORT}...")
    while True:
        try:
            if ser.is_open:
                ser.close()
            time.sleep(3)
            ser.open()
            print(f"[GATEWAY] Reconnecté sur {PORT}.")
            return
        except (serial.SerialException, OSError) as e:
            print(f"[GATEWAY] Reconnexion échouée : {e} — nouvel essai dans 3s...")
            time.sleep(3)


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
                # auto_fan géré par auto_fan_loop (thread séparé)
            elif "erreur" in line.lower():
                print(f"[CAPTEUR] {line}")

        except serial.SerialException as e:
            print(f"[ERREUR SERIE] {e}")
            _reconnect(ser)
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
                    serial_write(ser, f"FAN:{speed}\n".encode())
                    print(f"[VENTILATEUR] set_speed = {speed}%")
                elif action == "on":
                    serial_write(ser, b"FAN:100\n")
                    print("[VENTILATEUR] on")
                elif action == "off":
                    serial_write(ser, b"FAN:0\n")
                    print("[VENTILATEUR] off")

                sb.table("G1E_commands") \
                  .update({"status": "done"}) \
                  .eq("id", cmd["id"]) \
                  .execute()

        except serial.SerialException as e:
            print(f"[ERREUR commandes] Port série perdu : {e}")
            _reconnect(ser)
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
    threading.Thread(target=read_loop,     args=(ser,), daemon=True).start()

    # Thread auto-trigger ventilateur (lit la temp en base toutes les 5s)
    threading.Thread(target=auto_fan_loop, args=(ser,), daemon=True).start()

    # Boucle principale : commandes ventilateur
    command_loop(ser)
