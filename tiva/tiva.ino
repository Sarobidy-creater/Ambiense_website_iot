// =========================================================
//  Tiva TM4C123 — AMBIENSE G1E
//  Écoute les commandes FAN:N envoyées par la gateway Python
//    FAN:100  → moteur ON  (PA_2 = HIGH)
//    FAN:0    → moteur OFF (PA_2 = LOW)
//  Pas de bibliothèque externe requise.
// =========================================================

#define MOTOR PA_2

String inputBuffer = "";

void setup() {
  Serial.begin(9600);
  pinMode(MOTOR, OUTPUT);
  digitalWrite(MOTOR, LOW); // moteur éteint au démarrage
}

void loop() {
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
}
