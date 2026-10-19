# KidneyCare AI · AIIMS Patna (डिजिटल नेफ्रोटिक डायरी)

### All India Institute of Medical Sciences, Patna, Bihar
**Division of Pediatric Nephrology, Department of Pediatrics**  
*In-charge / Contact: Dr. Swarnim (डॉ. स्वर्णिम)*

---

## 🌟 Overview & Core Purpose

**KidneyCare AI** is an intelligent pediatric clinical monitoring application designed specifically for children diagnosed with Nephrotic Syndrome (SSNS / SDNS / FRNS / SRNS) and their families, built for the **Division of Pediatric Nephrology at AIIMS Patna**.

### Key Features
1. **Clinical AIIMS Redesign**:
   - Modern, child-friendly pediatric UI adhering to clinical safety guidelines.
   - Interactive Chintu superhero kidney mascot providing encouraging audio & visual guidance.
   - Non-repetitive navigation, 1-tap fast logging, and high-legibility medical data cards.
2. **Bluetooth BLE Telemetry (Omron & A&D Medical)**:
   - Wireless auto-reading for Blood Pressure cuffs (`0x1810` BLP GATT) and Weight Scales (`0x181D` WSP GATT).
   - Real-time pulse and cuff pressure streaming with simulated demo fallbacks.
3. **Comprehensive Nutrition Hub & 7,084 Food Database**:
   - Ingested 7,083 offline foods from USDA/CORGIS & 643 authentic Indian IFCT dishes.
   - Pediatric renal safety classification (Low/Moderate/High Sodium, Potassium, Phosphorus).
   - Healthify-style 1-tap logging with calibrated Indian katori/portion selector.
4. **Customisable Daily Routine Schedule**:
   - Daily monitoring timeline with interactive checklists and auto-updating clinical status summary.
   - Dynamic fluid quota tracker (WaterJug) active when fluid restriction is prescribed.
5. **Camera Image Capture & Report Archive**:
   - Urine dipstick reagent pad photos captured live via camera or uploaded directly from smartphone gallery.
   - Document and prescription scanner with permanent patient CR number tagging.

---

## 🚀 How to Run the Application

### Method 1: 1-Click Launcher (Windows)
Double-click `run_app.bat`:
- Detects the local Python environment.
- Initializes SQLite database schema and media storage.
- Starts the server at `http://127.0.0.1:5000` and opens Google Chrome/Edge automatically.

### Method 2: Command Line (Backend)
```powershell
& "C:\Users\acer\AppData\Local\Programs\Orange\python.exe" app.py
```
Open **http://127.0.0.1:5000** in your browser.

### Method 3: React Development Frontend
```bash
cd kidneycare-react/kidneycare-main
npm run dev
```

---

## 📱 Android App
The project contains complete Capacitor Android build assets in `android/` which can be opened and built directly via Android Studio.
