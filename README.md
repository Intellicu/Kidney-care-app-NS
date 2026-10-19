# KidneyCare AI · AIIMS Patna (डिजिटल नेफ्रोटिक डायरी)

### All India Institute of Medical Sciences, Patna, Bihar
**Division of Pediatric Nephrology, Department of Pediatrics**  
*In-charge / Contact: Dr. Swarnim (डॉ. स्वर्णिम)*

---

## 🌟 Overview & Core Purpose

**KidneyCare AI** is an intelligent pediatric clinical monitoring application designed specifically for children diagnosed with Nephrotic Syndrome (SSNS / SDNS / FRNS / SRNS) and their families, built for the **Division of Pediatric Nephrology at AIIMS Patna**.

The primary purpose is **high-fidelity longitudinal clinical data collection**:
1. **Camera Image Capture & Storage**:
   - Urine dipstick reagent pad photos captured live via camera or uploaded directly from the smartphone gallery.
   - Automatically tagged with the patient's **CR Number**, exact **ISO timestamp**, and clinical interpretation grade (`Neg`, `Trace`, `1+`, `2+`, `3+`, `4+`).
2. **Doctor Report Upload Portal**:
   - Allows doctors (e.g. Dr. Swarnim) and clinical staff to attach lab reports (Spot UPCR, Tacrolimus trough levels, Serum albumin, Renal USG, Biopsies) in PDF, PNG, or JPEG formats.
   - Each report is permanently attached to the patient's electronic file with clinical assessment notes, test result tags, and audit timestamps.
3. **16-Screen Clinical Prototype**:
   - Complete mobile-first user experience designed according to the official KidneyCare AI mockups, with one-click bilingual English (`EN`) and Hindi (`हिं`) toggling.

---

## 🚀 How to Run the Application

### Method 1: 1-Click Launcher (Windows)
Double-click [`run_app.bat`](file:///c:/AIIMS%20PATNA/App/run_app.bat):
- Detects the local Python environment.
- Initializes SQLite database schema and media storage.
- Starts the server at `http://127.0.0.1:5000` and opens Google Chrome/Edge automatically.

### Method 2: Command Line
```powershell
& "C:\Users\acer\AppData\Local\Programs\Orange\python.exe" app.py
```
Open **http://127.0.0.1:5000** in your browser.

---

## 📸 Data Collection & Media Management Architecture

| Feature | Endpoint / Component | Storage & Tagging Details |
|---|---|---|
| **Live Dipstick Camera Snap** | `POST /api/upload` | HTML5 `<video>` & `<canvas>` snapshot or camera file input (`image/*`), saved to `static/uploads/`, tagged to CR number, date, time, and reading grade. |
| **Doctor Report Upload** | `POST /api/upload` (multipart) | PDF, PNG, JPG file upload with Title, Category (`lab_report`, `prescription`, `clinical_photo`), Test Result tag, Doctor notes, and uploader name. |
| **Patient Media Archive** | `GET /api/documents?cr_number=...` | Categorized document cards with thumbnail previews, full-screen viewer modal, download links, and deletion management. |
| **Daily Log Photo Association** | `daily_logs.image_url` | Associates each morning dipstick log directly with the physical photo evidence. |

---

## 📱 The 16 Prototype Screens Implemented

1. **Home Screen (EN)**: Live CR number badge, quick tab carousel, Watch alert banner for 3-day 2+ protein, Today summary cards (dipstick, BP, weight, medicines), and sticky "Read a dipstick" action button.
2. **Home Screen (हिं)**: Full Hindi localization with authentic Devanagari medical terminology.
3. **Scan Patient (CR Barcode)**: Viewfinder targeting OPD sticker barcodes, simulated/camera barcode recognition, "Read printed number", and "Type it" manual fallback.
4. **Dipstick Camera Reader & Timer**: 60-second animated SVG circular countdown timer, strip alignment frame, condition indicators (`Light OK`, `Glare OK`, `Aligned`), and synthesized audio chime on completion.
5. **Dipstick Verification**: Vertical multi-pad reagent reference, AI reader confidence, grade selector chips (`Neg` to `4+`), snapshot preview, and research disclaimer.
6. **Docs / Patient Media Archive**: Dual-mode screen featuring the **Patient Media Gallery** (attached lab reports and test photos with doctor remarks) and the **Camera Document Scanner**.
7. **Check the Medicines**: Extracted prescription lines (Prednisolone, Tacrolimus, Amlodipine), unclear dose warning highlights, line-by-line verification checkboxes, and "+ Add a medicine".
8. **Blood Pressure**: Bluetooth cuff pairing status, Systolic/Diastolic/Pulse inputs, pediatric percentile staging (🟢 Normal for age and height), Arm toggles (`Left`/`Right`), Posture toggles (`Sitting`/`Standing`/`Lying`).
9. **Weight & Height / Growth**: Bluetooth scale pairing, Weight/Height inputs, Pediatric Standard Deviation (Height SD, Weight SD, BMI SD), and Edema severity selector (`None`, `Mild`, `Moderate`, `Severe`).
10. **Diary Timeline**: Day-grouped chronological activity stream of tests, readings, and medicines taken vs. due.
11. **Export the Record**: Date range filter, content selection checkboxes, Excel (`.xlsx`) & CSV formats, WhatsApp share URL generation, and Email export.
12. **How to Test**: 4-step illustrated tutorial with timing badges (Wash hands 30s, Midstream urine, Dip 2s, Wait 60s).
13. **Manual Colour Picker**: Visual reagent pad swatches for manual entry matching the bottle label chart.
14. **Protein Trends (14 Days)**: 14-day color-coded bar chart (Grey = Negative, Yellow = 1+ Watch, Red = 2+ Act), relapse counter (Days of 2+ in a row), and clinical guidance.
15. **Offline Reminders**: Daily alarms for morning dipstick, steroid doses, and weekly BP checks.
16. **From Your Doctor**: Asynchronous advice cards from Dr. Swarnim, interactive lab test orders checklist, and AI teleconsult assistant.
