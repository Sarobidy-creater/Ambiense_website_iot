// =========================================================
//  Tiva TM4C123 — AMBIENSE G1E
//  - Lecture DHT11 manuel sur PA_7 → envoie temp + humidite sur Serial
//  - Ecoute les commandes FAN:N de la gateway sur Serial
//      FAN:100 → moteur ON  (PA_2 = HIGH)
//      FAN:0   → moteur OFF (PA_2 = LOW)
// =========================================================

#define DHTPIN PA_7
#define MOTOR  PA_2

String inputBuffer = "";

void setup() {
  Serial.begin(9600);
  pinMode(MOTOR, OUTPUT);
  digitalWrite(MOTOR, LOW); // moteur eteint au demarrage
  delay(1000);
  Serial.println("--- Demarrage du programme ---");
}

void loop() {
  // ── 1. Lire les commandes FAN entrantes ──────────────
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      inputBuffer.trim();
      if (inputBuffer.startsWith("FAN:")) {
        int value = inputBuffer.substring(4).toInt();
        if (value > 0) {
          digitalWrite(MOTOR, HIGH);
          Serial.println("MOTOR:ON");
        } else {
          digitalWrite(MOTOR, LOW);
          Serial.println("MOTOR:OFF");
        }
      }
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }

  // ── 2. Lire le DHT11 toutes les 2 secondes ───────────
  static unsigned long lastRead = 0;
  if (millis() - lastRead < 2000) return;
  lastRead = millis();

  byte donnees[5] = {0, 0, 0, 0, 0};

  // Signal de réveil
  pinMode(DHTPIN, OUTPUT);
  digitalWrite(DHTPIN, LOW);
  delay(20);
  digitalWrite(DHTPIN, HIGH);
  delayMicroseconds(40);

  // Attente réponse capteur
  pinMode(DHTPIN, INPUT);
  if (pulseIn(DHTPIN, HIGH, 50000) == 0) {
    Serial.println("Erreur : Le capteur ne repond pas. Verifiez le cablage (PA_7).");
    return;
  }

  // Lecture des 40 bits
  for (int i = 0; i < 40; i++) {
    long duree = pulseIn(DHTPIN, HIGH, 50000);
    if (duree == 0) {
      Serial.println("Erreur de synchronisation durant la lecture.");
      return;
    }
    int indiceOctet = i / 8;
    donnees[indiceOctet] <<= 1;
    if (duree > 40) {
      donnees[indiceOctet] |= 1;
    }
  }

  // Vérification checksum + envoi
  if (donnees[4] == ((donnees[0] + donnees[1] + donnees[2] + donnees[3]) & 0xFF)) {
    Serial.print("Humidite: "); Serial.print(donnees[0]); Serial.print(" % \t");
    Serial.print("Temperature: "); Serial.print(donnees[2]); Serial.println(" *C");
  } else {
    Serial.println("Erreur : Donnees corrompues (Checksum invalide).");
  }
}
