# KidneyCare — Master Product Requirements Document
## PRD + UX Specification + Technical Architecture + Clinical Workflow + AI Implementation Guide
**Version:** 2.0  
**Date:** 2026-06-27  
**Based on:** PRGAD-KidneyCare-v1.0  
**Repository:** intellicu/kidney-care-app-ns  
**Branch:** claude/kidneycare-readiness-review-0fh1wo  
**Status:** Draft — Requires clinical sign-off before pilot

---

## Table of Contents

1. [Product Vision & Context](#1-product-vision--context)
2. [User Personas](#2-user-personas)
3. [Functional Requirements](#3-functional-requirements)
4. [UX Specifications](#4-ux-specifications)
5. [Design System](#5-design-system)
6. [Clinical Workflows](#6-clinical-workflows)
7. [Technical Architecture](#7-technical-architecture)
8. [AI Implementation Guide](#8-ai-implementation-guide)
9. [Accessibility & Multilingual Requirements](#9-accessibility--multilingual-requirements)
10. [Testing & Validation](#10-testing--validation)
11. [Release Roadmap](#11-release-roadmap)
12. [Appendices](#12-appendices)

---

## 1. Product Vision & Context

### 1.1 Problem Statement

Nephrotic Syndrome (NS) is the most common glomerular disease in Indian children, with an incidence of 16 per 100,000. In Bihar — India's most densely populated and economically disadvantaged state — paediatric NS patients face compounding challenges:

- **Delayed relapse detection:** Families cannot monitor urine protein at home; they present to hospital after 5–7 days of relapse, by which time oedema and complications are established.
- **Medication non-compliance:** Prednisolone alternate-day dosing is complex; illiterate caregivers (often grandmothers) struggle to follow multi-week taper schedules.
- **Communication barriers:** Primary language is Bhojpuri, not Hindi. Standard Hindi health instructions are poorly understood.
- **Connectivity gaps:** 2G/no-signal conditions for 8–12 hours daily in rural Bihar.
- **Low device capability:** Families own ₹5,000–₹8,000 Android phones (Snapdragon 460 class, 2GB RAM).

### 1.2 Vision

KidneyCare gives every NS family in Bihar — regardless of literacy, connectivity, or smartphone capability — the same monitoring capability that a paediatric nephrologist at AIIMS Delhi provides to upper-class urban patients.

### 1.3 Success Metrics (Pilot — 10 families, 26 weeks)

| Metric | Target |
|---|---|
| Time-to-relapse-detection | < 48 hours from first 3+ reading |
| Medication compliance rate | ≥ 80% of prescribed doses recorded |
| Relapse-related hospital admissions | ≥ 30% reduction vs. baseline |
| App retention at 26 weeks | ≥ 75% of families active weekly |
| Daily test completion | ≥ 70% of days with a recorded test |
| Caregiver satisfaction (UMUX-Lite) | ≥ 70/100 |

---

## 2. User Personas

### Persona A: Sunita Devi — Primary Caregiver
- **Age:** 34, **Location:** Hajipur block, Vaishali district
- **Education:** Class 5 (semi-literate, reads simple Hindi)
- **Language:** Bhojpuri (primary), basic Hindi
- **Device:** Redmi 9A, 2GB RAM, Android 10, 32GB storage
- **Connectivity:** JioFi, 2–4G, drops to no signal 10–14 hours/day
- **Motivation:** Wants her 7-year-old son Raju to avoid hospital admissions; terrified of relapse
- **Pain points:** Cannot read medicine labels, forgets alternate-day dosing, no way to know if test strip result is correct
- **Behaviour:** Uses the app in the morning, often with low battery. Never uses email. Receives calls on WhatsApp.

### Persona B: Dr. Arvind Singh — Paediatric Nephrologist
- **Age:** 41, **Location:** Patna Medical College Hospital (PMCH)
- **Specialty:** Paediatric nephrology, 80+ NS patients under active follow-up
- **Device:** iPhone 14 (personal), desktop at clinic
- **Need:** Weekly summary of each patient's protein trend, weight, compliance, and any alerts — without calling the family
- **Pain points:** Families present after long relapses; no visibility between OPD visits (typically 4-week intervals)
- **Behaviour:** Reviews patient data between procedures on mobile, wants PDF to attach to medical record

### Persona C: Rajkumar Yadav — Community Health Worker (ASHA/CHW)
- **Age:** 28, **Location:** Serves 12–15 families in Danapur block
- **Education:** Class 12
- **Language:** Bhojpuri, Hindi
- **Device:** Redmi Note 10 (issued by NGO)
- **Role:** Home visits twice a month, helps families use the app, escalates issues to doctor
- **Need:** List of families with alerts today; easy navigation to most urgent case

---

## 3. Functional Requirements

### FR-01: Urine Dipstick Testing

| ID | Requirement | Priority |
|---|---|---|
| FR-01-01 | 6-step illustrated instruction flow with voice narration | MUST |
| FR-01-02 | 60-second countdown timer with audio tick at 30s and 10s | MUST |
| FR-01-03 | Manual result entry (negative / trace / 1+ / 2+ / 3+ / 4+) always available | MUST |
| FR-01-04 | Camera capture: two photos (before + after dipping) | MUST |
| FR-01-05 | Client-side image quality assessment (blur, darkness) before API call | MUST |
| FR-01-06 | AI result with confidence score displayed (not hidden) | MUST |
| FR-01-07 | If AI fails: mandatory manual entry, never random fallback | MUST |
| FR-01-08 | Result stored locally (IndexedDB) immediately on submission | MUST |
| FR-01-09 | Result synced to Supabase when online | MUST |
| FR-01-10 | Timestamp stored in UTC, displayed in IST | MUST |
| FR-01-11 | Comparison view: patient result vs. AI result (for clinician dashboard) | SHOULD |
| FR-01-12 | Photo stored for clinician review (Supabase Storage) | SHOULD |
| FR-01-13 | Color calibration card workflow for ambient light correction | COULD |

### FR-02: AI Image Analysis

| ID | Requirement | Priority |
|---|---|---|
| FR-02-01 | GPT-4o-mini vision model with corrected system prompt (protein pad focus) | MUST |
| FR-02-02 | Images resized to ≤1024px JPEG before API call | MUST |
| FR-02-03 | Structured output: result, confidence (0–1), reasoning, proteinPadColor, recommendation | MUST |
| FR-02-04 | If confidence < 0.6: show "Low confidence — please verify manually" | MUST |
| FR-02-05 | If API call fails: show manual entry screen, never random fallback | MUST |
| FR-02-06 | Rate limit: max 3 API calls per test (3 retry attempts) | SHOULD |
| FR-02-07 | Cost guard: alert admin if daily API spend exceeds ₹500 | SHOULD |

### FR-03: Medication Compliance

| ID | Requirement | Priority |
|---|---|---|
| FR-03-01 | Medication list from onboarding, editable post-onboarding | MUST |
| FR-03-02 | Time-slot grouping: morning / afternoon / night | MUST |
| FR-03-03 | Date-stamped compliance record (not takenYesterday boolean) | MUST |
| FR-03-04 | Alternate-day flag for prednisolone | MUST |
| FR-03-05 | Missed dose reason: forgot / pharmacy empty / side effect / other | MUST |
| FR-03-06 | Compliance rate shown in clinician dashboard | MUST |
| FR-03-07 | 7-day compliance summary in dashboard | SHOULD |
| FR-03-08 | Refill reminder when medications are estimated to run low | COULD |

### FR-04: Symptom Diary

| ID | Requirement | Priority |
|---|---|---|
| FR-04-01 | Symptom selection: swelling, fatigue, reduced urine, headache, nausea, other | MUST |
| FR-04-02 | Swelling body location: face, legs, abdomen, generalised | MUST |
| FR-04-03 | Severity: mild / moderate / severe | MUST |
| FR-04-04 | Photo capture for oedema documentation | MUST |
| FR-04-05 | Symptom trend shown: "swelling reported 5 days in a row" | MUST |
| FR-04-06 | Escalation alert when ≥2 high-severity symptoms for ≥2 days | MUST |
| FR-04-07 | Free-text notes with voice input | SHOULD |
| FR-04-08 | Pain scale 1–10 alongside categorical severity | COULD |

### FR-05: Relapse Detection

| ID | Requirement | Priority |
|---|---|---|
| FR-05-01 | AIIMS/ISPN protocol: relapse = protein ≥ 3+ for 3 consecutive days | MUST |
| FR-05-02 | Remission = negative/trace for 3 consecutive days | MUST |
| FR-05-03 | 1+ or 2+ alone does NOT trigger relapse | MUST |
| FR-05-04 | Missed test day pauses streak — does not reset it | MUST |
| FR-05-05 | Frequently relapsing flag: ≥2 relapses in 6 months | MUST |
| FR-05-06 | Steroid-resistant NS classification field | MUST |
| FR-05-07 | Relapse history persisted across app restarts | MUST |
| FR-05-08 | Relapse trend chart (30-day) in clinician dashboard | SHOULD |

### FR-06: Alerts & Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-06-01 | In-app alert banner: critical / warning / info / success tiers | MUST |
| FR-06-02 | TTS reading of critical alerts on app open | MUST |
| FR-06-03 | Web Push (VAPID) daily reminder at caregiver-chosen time | MUST |
| FR-06-04 | Web Push for relapse alert (when relapse detected) | MUST |
| FR-06-05 | WhatsApp notification via Twilio for relapse + 3-missed-tests | MUST |
| FR-06-06 | CHW notification when family misses 3+ consecutive tests | SHOULD |
| FR-06-07 | SMS fallback when WhatsApp fails | SHOULD |
| FR-06-08 | Notification time configurable by caregiver | MUST |

### FR-07: Blood Pressure Monitoring

| ID | Requirement | Priority |
|---|---|---|
| FR-07-01 | Manual BP entry (systolic / diastolic mmHg) | MUST |
| FR-07-02 | 4th Task Force paediatric percentile lookup (age, sex, height) | MUST |
| FR-07-03 | Display: percentile + category (Normal / Elevated / Stage 1 / Stage 2 HTN) | MUST |
| FR-07-04 | Instruction screen: rest 5 min, seated, correct cuff size | MUST |
| FR-07-05 | BP trend chart (14-day) | SHOULD |
| FR-07-06 | Alert when BP > 99th percentile + 12 mmHg | MUST |
| FR-07-07 | Bluetooth cuff integration (Omron) | COULD |

### FR-08: Weight & Growth Tracking

| ID | Requirement | Priority |
|---|---|---|
| FR-08-01 | Weight entry (kg, 0.1kg precision) | MUST |
| FR-08-02 | Height entry (cm, 0.5cm precision) | MUST |
| FR-08-03 | BMI and BSA calculated automatically | MUST |
| FR-08-04 | WHO Growth Standard percentile (weight-for-age, height-for-age) | MUST |
| FR-08-05 | Dry weight baseline field (set after confirmed remission) | MUST |
| FR-08-06 | Alert when weight exceeds dry weight by ≥5% in ≤3 days | MUST |
| FR-08-07 | 14-day weight trend chart | MUST |
| FR-08-08 | WHO z-score curve graphic | SHOULD |
| FR-08-09 | Growth velocity calculation (cm/year) | COULD |

### FR-09: Patient Onboarding

| ID | Requirement | Priority |
|---|---|---|
| FR-09-01 | Patient name (voice input + text) | MUST |
| FR-09-02 | Date of birth | MUST |
| FR-09-03 | Weight and height | MUST |
| FR-09-04 | Sex | MUST |
| FR-09-05 | Diagnosis (SSNS / SRNS / SDNS) | MUST |
| FR-09-06 | Date of first diagnosis | MUST |
| FR-09-07 | Pre-app relapse count | MUST |
| FR-09-08 | Current medications (prescription photo + manual list) | MUST |
| FR-09-09 | Doctor/nephrologist phone number (for "Call Doctor") | MUST |
| FR-09-10 | Preferred reminder time | MUST |
| FR-09-11 | Language selection (Hindi / Bhojpuri / English) | MUST |
| FR-09-12 | Allergy list | SHOULD |
| FR-09-13 | DPDP Act 2023 consent screen | MUST |
| FR-09-14 | Edit profile screen post-onboarding | MUST |

### FR-10: Clinician Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-10-01 | 4-digit PIN gate — required on entry and after 30s inactivity | MUST |
| FR-10-02 | 4-tab view: Overview, Lab Data, Medications, Timeline | MUST |
| FR-10-03 | Protein bar chart (14-day) | MUST |
| FR-10-04 | Compliance donut chart | MUST |
| FR-10-05 | Test log with patient vs. AI result comparison | MUST |
| FR-10-06 | Date range filter | MUST |
| FR-10-07 | PDF export (jsPDF) — AIIMS-compatible format | MUST |
| FR-10-08 | Doctor annotation on individual test result | SHOULD |
| FR-10-09 | Multi-patient fleet view (for CHW managing 10–15 families) | SHOULD |
| FR-10-10 | Print-optimised layout | SHOULD |

### FR-11: Emergency Escalation

| ID | Requirement | Priority |
|---|---|---|
| FR-11-01 | "Call Doctor" places real `tel:` call to onboarding phone number | MUST |
| FR-11-02 | Emergency protocol screen: 3-step action card on relapse detection | MUST |
| FR-11-03 | Emergency screen accessible offline (cached in service worker) | MUST |
| FR-11-04 | Emergency contacts list: doctor + hospital + CHW | MUST |
| FR-11-05 | One-tap call to each emergency contact | MUST |

### FR-12: Offline Functionality

| ID | Requirement | Priority |
|---|---|---|
| FR-12-01 | App shell (all screens) loads fully offline | MUST |
| FR-12-02 | All test results stored in IndexedDB (Dexie.js) immediately | MUST |
| FR-12-03 | All medications, symptoms, BP, weight stored locally | MUST |
| FR-12-04 | Sync queue: records pushed to Supabase when online | MUST |
| FR-12-05 | Conflict resolution: last-write-wins with audit log | MUST |
| FR-12-06 | Offline indicator visible in UI | MUST |
| FR-12-07 | Pre-recorded audio clips for TTS (offline fallback) | MUST |
| FR-12-08 | Emergency screen always available offline | MUST |

### FR-13: Authentication & Privacy

| ID | Requirement | Priority |
|---|---|---|
| FR-13-01 | Phone OTP authentication (Supabase native) | MUST |
| FR-13-02 | DPDP Act 2023 consent with explicit acceptance | MUST |
| FR-13-03 | Data deletion request flow in settings | MUST |
| FR-13-04 | Privacy policy accessible in-app | MUST |
| FR-13-05 | OpenAI DPA confirmed — dipstick images sent only with consent | MUST |
| FR-13-06 | IndexedDB data encrypted (AES-256) | SHOULD |
| FR-13-07 | Audit log of clinician dashboard access | SHOULD |

### FR-14: Clinical Report Export

| ID | Requirement | Priority |
|---|---|---|
| FR-14-01 | PDF report via jsPDF | MUST |
| FR-14-02 | Report contents: patient header, 14-day protein chart, weight trend, medications, relapse history, doctor signature line | MUST |
| FR-14-03 | Available from patient app and clinician dashboard | MUST |
| FR-14-04 | Shareable via WhatsApp (file share) | SHOULD |

### Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | App shell load on 3G | ≤ 3 seconds |
| NFR-02 | Test result entry flow (manual, offline) | ≤ 30 seconds end-to-end |
| NFR-03 | Device support | Android 9+, Chrome 88+, low-end (2GB RAM) |
| NFR-04 | Crash rate (Sentry) | < 0.5% of sessions |
| NFR-05 | AI API latency (p95) | < 8 seconds |
| NFR-06 | Offline storage capacity | ≥ 180 days of monitoring data |
| NFR-07 | PWA install size | ≤ 5MB (app shell) |
| NFR-08 | Accessibility | WCAG 2.1 AA, ARIA labels on all interactive elements |
| NFR-09 | Data retention | Minimum 3 years |
| NFR-10 | Uptime (Supabase + Vercel) | ≥ 99.5% monthly |

---

## 4. UX Specifications

### 4.1 Navigation Architecture

```
App
├── Language Selection (first launch)
├── Onboarding Wizard (first launch)
│   ├── Step 1: Welcome + DPDP Consent
│   ├── Step 2: Patient Name
│   ├── Step 3: Date of Birth
│   ├── Step 4: Weight
│   ├── Step 5: Height
│   ├── Step 6: Sex
│   ├── Step 7: Diagnosis Type + First Diagnosis Date
│   ├── Step 8: Pre-app Relapse Count
│   ├── Step 9: Medications (photo + manual)
│   ├── Step 10: Doctor Phone Number
│   └── Step 11: Reminder Time + Language Confirm
├── Main App (tab-based)
│   ├── Tab 1: Dashboard (home)
│   │   ├── Relapse Status Card
│   │   ├── Vitals Grid
│   │   ├── Daily Check CTA
│   │   ├── Quick Actions Grid
│   │   └── Clinical Alerts
│   ├── Tab 2: Test (dipstick)
│   │   ├── Instructions (6 steps)
│   │   ├── Timer
│   │   ├── Camera / Manual Entry
│   │   └── Result + Recommendation
│   ├── Tab 3: Log
│   │   ├── Today's Check
│   │   ├── Medication Compliance
│   │   ├── Symptoms
│   │   ├── Weight Entry
│   │   └── BP Entry
│   └── Tab 4: More
│       ├── Clinician Dashboard (PIN-gated)
│       ├── Trend Charts
│       ├── Export Report
│       ├── Settings
│       └── About / Help
└── Floating Assistant (overlay)
    ├── Health Insights
    ├── Ask Question
    ├── View Analytics
    ├── Repeat Instruction
    ├── Help Me
    └── Call Doctor (tel: link)
```

### 4.2 Screen Specifications

#### 4.2.1 Dashboard Screen

**Layout:** Single-column scroll  
**Load behaviour:** TTS greeting on load

**Relapse Status Card:**
- Full-width card with large colour-coded indicator
- 🟢 In Remission / 🟡 Watch Closely / 🔴 RELAPSE DETECTED
- Large icon + 2-word label (icon-first for low-literacy users)
- Subtext: "Day 12 of remission" or "3+ protein for 2 days — test tomorrow"

**Vitals Grid:**
- 2×2 grid: Weight | Height | BP | Protein
- Each cell: large number, unit, trend arrow (↑↓→), colour by percentile/severity
- Tap any cell → full trend chart

**Daily Check CTA:**
- "Test today" (if no test recorded today)
- Replaced by "Today's test: TRACE ✓" (after test recorded)

**Quick Actions Grid:**
- 2×4 grid of large icon+label buttons
- Actions: Urine Test, Log Symptoms, Medications, Weight, Blood Pressure, View Reports, Call Doctor, Help
- Icons ≥60×60dp, labels ≤2 words

**Empty State (new patient):**
- "Welcome! Let's start by testing Raju's urine. Tap the test tube below."
- CTA to Test tab

#### 4.2.2 Urine Test Screen

**Step 1–6 (Instructions):**
- Full-screen illustration (icon-based, no reading required)
- Large sequential number (1 of 6)
- Caption below illustration (≤10 words)
- TTS auto-plays on each step load
- "Replay" button (speaker icon)
- "Next" / "Back" navigation + swipe left/right

**Timer Screen:**
- 60-second countdown in huge font (96px)
- Animated progress ring
- Audio tick at 30s and 10s

**Result Entry — Manual:**
- 6 large colour squares arranged vertically (calibrated to HiMedia strip colours)
- Each: colour swatch + label (NEGATIVE / TRACE / 1+ / 2+ / 3+ / 4+)
- Selected option highlighted with thick border + checkmark

**Result Entry — AI:**
- Camera viewfinder with overlay guide rectangle
- Quality check before send: if dark → "Move to better light"; if blurry → "Hold steady"
- Processing: animated kidney icon with "Analyzing..."
- Result: large result pill + confidence bar + AI reasoning (collapsed, expandable)

**Error State (AI failure):**
```
┌─────────────────────────────────────┐
│  ⚠️  AI could not read the strip    │
│                                     │
│  Please enter the result yourself   │
│  by comparing to the colour chart   │
│                                     │
│  [  ENTER MANUALLY  ]               │
└─────────────────────────────────────┘
```
Never show random result. Never show error code.

#### 4.2.3 Medication Check Screen

**Layout:** Time-slot sections (Morning / Afternoon / Night)

Each medication item:
- Medication name (large, ≥18px) + dose
- Toggle: large ≥60dp tap target
- If alternate-day: "Every other day" badge; grey out on off-days

After toggling "Not taken":
```
Why did you miss this?
○ I forgot
○ Pharmacy was out of stock
○ Side effect / feeling unwell
○ Other
```

#### 4.2.4 Clinician Dashboard Screen

**Entry:** 4-digit PIN gate with numeric keypad (digits ≥72×72dp)

**Tab 1: Overview** — patient summary, compliance summary, active alerts

**Tab 2: Lab Data** — date range picker, protein trend bar chart (patient vs AI overlay), table: Date | Patient Result | AI Result | Confidence | Notes

**Tab 3: Medications** — per-medication compliance calendar heat map, overall compliance %, missed reason breakdown

**Tab 4: Timeline** — chronological event log, filterable by event type

**Export Button (persistent):** "Export PDF Report" + "Share via WhatsApp"

---

## 5. Design System

### 5.1 Colour Palette

| Name | Hex | Usage |
|---|---|---|
| Kidney Red | `#E53935` | Critical alerts, 3+/4+ results, relapse state |
| Warning Amber | `#F59E0B` | Warning alerts, 2+ results, elevated BP |
| Health Green | `#10B981` | Remission, negative/trace, compliance ≥80% |
| Primary Blue | `#1E40AF` | Primary CTAs, links, brand |
| Sky Blue | `#93C5FD` | Info alerts, secondary actions |
| Neutral 900 | `#111827` | Primary text |
| Neutral 500 | `#6B7280` | Secondary text |
| Neutral 100 | `#F3F4F6` | Background, cards |
| White | `#FFFFFF` | Card backgrounds |

### 5.2 Typography

**Font family:** Noto Sans (covers Devanagari for Hindi/Bhojpuri)

| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | 48px | 700 | Timer countdown, result pill |
| H1 | 32px | 700 | Screen titles |
| H2 | 24px | 600 | Section headers |
| Body Large | 18px | 400 | Primary content |
| Body | 16px | 400 | Secondary content |
| Caption | 14px | 400 | Labels, timestamps |
| Micro | 12px | 400 | Legal text only |

**Minimum body text:** 18px (low-literacy users need larger text than standard)

### 5.3 Touch Targets

- All interactive elements: **minimum 48×48dp**
- Primary CTAs: **minimum 60×60dp**
- Bottom navigation tabs: **minimum 56dp height**
- PIN keypad digits: **72×72dp**

### 5.4 Voice UI Indicators

- Speaking: pulsing blue ring around speaker icon
- Listening: animated red microphone with waveform
- "Tap to speak" prompt after 3 seconds of silence
- Every voice instruction has a "Replay" button (speaker icon, 48dp)

### 5.5 Iconography

- Outline icons for secondary; filled for active/selected
- All icons paired with ≤2-word label (no icon-only buttons)
- Icon size: 32×32dp in grids, 24×24dp in lists

---

## 6. Clinical Workflows

### 6.1 Daily Morning Routine Protocol

```
07:00 AM — Reminder notification fires
  │
  ▼
User opens app → TTS: "Good morning. Time to test Raju's urine."
  │
  ▼
Urine Test Flow (4–6 minutes)
  │
  ├── Step 1: Dip strip in morning urine (first void preferred)
  ├── Step 2: Start 60-second timer
  ├── Step 3: Remove strip, shake off excess
  ├── Step 4: Hold against reference colours
  ├── Step 5: Take photo (or enter manually)
  └── Step 6: View result + recommendation
  │
  ▼
Medication Check (2 minutes)
  │
  ▼
Weight Entry (if prompted — weekly or after oedema symptom)
  │
  ▼
Dashboard updates with today's data
```

### 6.2 Relapse Detection Flow

```
Day 1: Protein = 3+
  → Alert: "Protein was 3+ today. Watch closely — test again tomorrow."
  → Notification to CHW

Day 2: Protein = 3+
  → Alert: "Protein 3+ for 2 days. This is concerning — test tomorrow."
  → WhatsApp to caregiver

Day 3: Protein = 3+
  → 🔴 RELAPSE DETECTED
  → Critical alert fires (in-app + push notification + WhatsApp)
  → TTS: "Relapse detected. Please contact Dr. Arvind Singh immediately."
  → Emergency Protocol Screen activates:
      Step 1: Start prednisolone (2mg/kg/day) if prescribed
      Step 2: Call Dr. Arvind Singh → [TAP TO CALL: +91-XXXXXXXXXX]
      Step 3: If no answer, go to PMCH Paediatric OPD
  → Doctor receives alert via app + WhatsApp

Remission Protocol:
  Day 1–3: Negative/Trace → Alert: "Good news! Protein is improving."
  Day 3: 3 consecutive Negative/Trace → 🟢 REMISSION DETECTED
  → TTS: "Raju is in remission! Keep taking medications as prescribed."
  → Record dry weight (prompts user)
```

### 6.3 Steroid Taper Workflow (v1: display only)

```
Week 1–4:    2mg/kg/day daily (induction)
Week 5–8:    1.5mg/kg on alternate days (consolidation)
Week 9–12:   1mg/kg on alternate days (maintenance)
Week 13–16:  0.5mg/kg on alternate days (tapering)
Week 17+:    Off (if no relapse)
```

Medication check screen: show today's dose prominently; grey out on off-days for alternate-day regimens; alert if daily dose missed for 2+ consecutive days.

### 6.4 Alert Threshold Table

| Condition | Threshold | Alert Level | Clinical Action |
|---|---|---|---|
| Protein result | 3+ for 3 consecutive days | 🔴 CRITICAL | Call doctor — relapse confirmed |
| Protein result | 3+ for 2 consecutive days | 🟡 WARNING | Test tomorrow — watch closely |
| Protein result | 2+ for 5+ consecutive days | 🟡 WARNING | Consult doctor |
| Weight gain | >5% above dry weight in ≤3 days | 🟡 WARNING | Check for oedema |
| Weight gain | >10% above dry weight | 🔴 CRITICAL | Seek medical attention |
| BP | >99th percentile + 12 mmHg | 🔴 CRITICAL | Seek medical attention |
| BP | 95th–99th percentile | 🟡 WARNING | Monitor closely, consult doctor |
| Compliance | < 70% in last 7 days | 🟡 WARNING | Counselling needed |
| Missed tests | ≥ 3 consecutive days | 🟡 WARNING | CHW follow-up |
| Remission | Negative/trace for 3 days | 🟢 SUCCESS | Record dry weight |

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (Next.js 16 PWA)                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐│
│  │ React UI  │  │Dexie.js  │  │ Service  │  │ Pre-recorded    ││
│  │(shadcn/ui)│  │IndexedDB │  │ Worker   │  │ Audio (Bhojpuri)││
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────────────┘│
│        │              │              │                            │
│  ┌─────▼──────────────▼──────────────▼─────────────────────────┐│
│  │                   App Context (5 focused contexts)           ││
│  │  AuthCtx | PatientCtx | MonitoringCtx | UICtx | SyncCtx     ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS (when online)
             ┌──────────────┼────────────────────┐
             │              │                    │
    ┌────────▼──────┐  ┌────▼────────┐  ┌───────▼───────────┐
    │  Supabase     │  │  Next.js    │  │   Twilio          │
    │  PostgreSQL   │  │  API Routes │  │   WhatsApp API    │
    │  Auth (OTP)   │  │  (Vercel)   │  │                   │
    │  Storage      │  │             │  │                   │
    │  RLS          │  │  /analyze   │  └───────────────────┘
    └───────────────┘  │  -dipstick  │
                       └─────┬───────┘
                             │
                    ┌────────▼────────┐
                    │  OpenAI         │
                    │  GPT-4o-mini    │
                    │  Vision API     │
                    └─────────────────┘
```

### 7.2 Offline-First Data Flow

```
Caregiver enters test result
          │
          ▼
Dexie.js (IndexedDB) — immediate write
          │
          ├─── App renders from local data (always fast)
          │
          ▼
SyncContext checks connectivity
          │
    ┌─────┴──────┐
    │ Online?    │
    │            │
   YES           NO
    │            │
    ▼            ▼
Push to      Enqueue in
Supabase     sync queue
    │         (IndexedDB)
    │              │
    ▼              ▼
Mark sync     Wait for
complete      network event
                │
                ▼
           Push queued
           records to
           Supabase
```

### 7.3 IndexedDB Schema (Dexie.js)

```typescript
// lib/db.ts
import Dexie, { type Table } from 'dexie'

interface TestResult {
  id: string            // UUID
  patientId: string
  testDate: string      // ISO 8601 UTC
  result: 'negative' | 'trace' | '1+' | '2+' | '3+' | '4+'
  entryMethod: 'manual' | 'ai'
  aiConfidence?: number
  aiReasoning?: string
  imageBefore?: string  // Supabase Storage URL (after sync)
  imageAfter?: string
  synced: boolean
  syncedAt?: string
  createdAt: string
}

interface MedicationRecord {
  id: string
  patientId: string
  medicationId: string
  recordDate: string    // ISO 8601 UTC — explicit date, not "yesterday"
  taken: boolean
  missedReason?: 'forgot' | 'pharmacy-empty' | 'side-effect' | 'other'
  timeSlot: 'morning' | 'afternoon' | 'night'
  synced: boolean
}

interface WeightRecord {
  id: string
  patientId: string
  weightKg: number
  recordDate: string
  isDryWeight: boolean
  synced: boolean
}

interface BPRecord {
  id: string
  patientId: string
  systolic: number
  diastolic: number
  percentile?: number
  category?: string     // derived from 4th Task Force table
  recordDate: string
  synced: boolean
}

interface SymptomRecord {
  id: string
  patientId: string
  symptoms: string[]
  swellingLocation?: string[]
  severity: 'mild' | 'moderate' | 'severe'
  notes?: string
  photoUrl?: string
  recordDate: string
  synced: boolean
}

interface SyncQueue {
  id: string
  table: string
  recordId: string
  operation: 'insert' | 'update' | 'delete'
  payload: object
  createdAt: string
  attempts: number
}

class KidneyCareDB extends Dexie {
  testResults!: Table<TestResult>
  medicationRecords!: Table<MedicationRecord>
  weightRecords!: Table<WeightRecord>
  bpRecords!: Table<BPRecord>
  symptomRecords!: Table<SymptomRecord>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('KidneyCareDB')
    this.version(1).stores({
      testResults:        '++id, patientId, testDate, synced',
      medicationRecords:  '++id, patientId, medicationId, recordDate, synced',
      weightRecords:      '++id, patientId, recordDate, synced',
      bpRecords:          '++id, patientId, recordDate, synced',
      symptomRecords:     '++id, patientId, recordDate, synced',
      syncQueue:          '++id, table, recordId, createdAt',
    })
  }
}

export const db = new KidneyCareDB()
```

### 7.4 Sync Engine

```typescript
// lib/sync-engine.ts
export async function syncPendingRecords() {
  const queued = await db.syncQueue.toArray()
  if (queued.length === 0) return

  for (const item of queued) {
    try {
      const { error } = await supabase
        .from(item.table)
        .upsert(item.payload, { onConflict: 'id' })

      if (!error) {
        await db.syncQueue.delete(item.id)
        await db[item.table as keyof KidneyCareDB].update(item.recordId, {
          synced: true,
          syncedAt: new Date().toISOString()
        })
      } else {
        await db.syncQueue.update(item.id, { attempts: item.attempts + 1 })
      }
    } catch {
      await db.syncQueue.update(item.id, { attempts: item.attempts + 1 })
    }
  }
}

window.addEventListener('online', syncPendingRecords)
```

### 7.5 Context Refactoring Plan

The current 77KB `app-context.tsx` must be split into 5 focused contexts:

| Context | Responsibility | Key State |
|---|---|---|
| `AuthContext` | Auth state, session, OTP flow | `user`, `session`, `isGuest` |
| `PatientContext` | Patient profile, onboarding | `patient`, `medications`, `onboardingStep` |
| `MonitoringContext` | Test results, relapse status, alerts | `testResults`, `relapseStatus`, `alerts`, `weights`, `bpReadings` |
| `UIContext` | Navigation, theme, language, TTS state | `currentScreen`, `theme`, `language`, `isSpeaking` |
| `SyncContext` | Offline state, sync queue, connectivity | `isOnline`, `pendingSync`, `lastSynced` |

### 7.6 Supabase SQL Schema

```sql
-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex TEXT CHECK (sex IN ('male', 'female')),
  diagnosis_type TEXT CHECK (diagnosis_type IN ('SSNS', 'SRNS', 'SDNS')),
  first_diagnosis_date DATE,
  pre_app_relapse_count INTEGER DEFAULT 0,
  doctor_phone TEXT,
  doctor_name TEXT,
  hospital_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Results
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  test_date TIMESTAMPTZ NOT NULL,
  result TEXT CHECK (result IN ('negative', 'trace', '1+', '2+', '3+', '4+')),
  entry_method TEXT CHECK (entry_method IN ('manual', 'ai')),
  ai_confidence NUMERIC,
  ai_reasoning TEXT,
  image_before_url TEXT,
  image_after_url TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication Records
CREATE TABLE medication_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES patient_medications(id),
  record_date DATE NOT NULL,
  time_slot TEXT,
  taken BOOLEAN NOT NULL,
  missed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight Records
CREATE TABLE weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  height_cm NUMERIC,
  is_dry_weight BOOLEAN DEFAULT FALSE,
  record_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BP Records
CREATE TABLE bp_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  percentile NUMERIC,
  category TEXT,
  record_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symptom Records
CREATE TABLE symptom_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  swelling_location TEXT[],
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  pain_scale INTEGER CHECK (pain_scale BETWEEN 1 AND 10),
  notes TEXT,
  photo_url TEXT,
  record_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relapse Events
CREATE TABLE relapse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  relapse_start_date DATE NOT NULL,
  remission_date DATE,
  relapse_number INTEGER,
  triggered_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinician Access Audit Log
CREATE TABLE clinician_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  accessed_by UUID REFERENCES auth.users(id),
  access_type TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bp_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_patient" ON patients
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_test_results" ON test_results
  FOR ALL USING (patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  ));
```

### 7.7 Service Worker Strategy

```javascript
const cacheStrategies = {
  appShell: 'CacheFirst',          // fastest load; routes: /, /test, /log, /dashboard
  apiData: 'NetworkFirst',         // 5s timeout, fall back to cache
  staticAssets: 'CacheFirst',      // 30-day TTL
  emergency: 'CacheOnly',          // must always work; route: /emergency
  audio: 'CacheFirst',             // pre-recorded Bhojpuri clips
}
```

### 7.8 Image Processing Pipeline

```typescript
// lib/image-processor.ts
export async function prepareImageForAPI(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const maxDim = 1024
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1)
  canvas.width = Math.floor(bitmap.width * scale)
  canvas.height = Math.floor(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const brightness = computeAverageBrightness(imageData)
  if (brightness < 50) throw new Error('IMAGE_TOO_DARK')

  const laplacian = computeLaplacianVariance(imageData)
  if (laplacian < 100) throw new Error('IMAGE_TOO_BLURRY')

  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
}
```

### 7.9 Notification Stack

```
Level 1: In-app alert (always — when app is open)
Level 2: Web Push / VAPID — for: daily reminder, relapse detection, 3-missed-tests
Level 3: WhatsApp (Twilio) — relapse detection, 3-missed-tests
Level 4: SMS (Twilio) — final fallback if WhatsApp delivery fails
```

---

## 8. AI Implementation Guide

### 8.1 Corrected System Prompt

```typescript
const DIPSTICK_SYSTEM_PROMPT = `You are a medical image analysis assistant specialising in urinary dipstick interpretation for paediatric Nephrotic Syndrome monitoring.

You will receive TWO images:
- Image 1: The unused dipstick strip (reference colours, before dipping)
- Image 2: The strip after being dipped in urine for exactly 60 seconds

YOUR TASK:
Focus exclusively on the PROTEIN pad — this is the THIRD coloured square from the patient's end of the strip. Compare the colour of the protein pad in Image 2 to the reference colours in Image 1.

RESULT OPTIONS (choose exactly one):
- "negative" — pad colour matches negative reference (yellow)
- "trace" — pad colour is slightly green-yellow
- "1+" — pad colour is light green
- "2+" — pad colour is medium green
- "3+" — pad colour is dark green
- "4+" — pad colour is very dark green or blue-green

CONFIDENCE RULES:
- confidence: 1.0 — colour is unambiguous and well-lit
- confidence: 0.7–0.9 — minor lighting variation but readable
- confidence: 0.5–0.7 — uncertain; state both options in reasoning
- confidence < 0.5 — cannot read; state reason (too dark, blurry, strip not visible)

IMPORTANT:
- Do NOT read any other pad (glucose, blood, leukocytes, etc.)
- Do NOT guess if the strip is not visible — set confidence < 0.5
- Recommendation must be in simple language a rural Indian caregiver can understand
- negative/trace: "Good news — protein is low."
- 1+/2+: "Protein is a little high — test again tomorrow."
- 3+/4+: "Protein is very high — test again tomorrow and contact your doctor if this continues."`
```

### 8.2 Error Handling (Critical Fix)

```typescript
// REMOVE THIS — current dangerous code:
const mockResults: Result[] = ["negative", "trace", "1+", "2+", "3+", "4+"]
setFinalResult(mockResults[Math.floor(Math.random() * mockResults.length)])

// REPLACE WITH:
try {
  const aiResult = await analyzeWithAI(beforeImage, afterImage)
  if (aiResult.confidence < 0.6) {
    setAnalysisState('low-confidence')
    setAIResult(aiResult)
    // Show result with "verify manually" warning
  } else {
    setAnalysisState('ai-success')
    setAIResult(aiResult)
  }
} catch (error) {
  setAnalysisState('manual-required')
  // UI shows: "AI could not read the strip. Please enter the result yourself."
  // Do NOT set any result automatically
}
```

### 8.3 Bhojpuri TTS — 25 Critical Phrases (v1)

All must be recorded by native Bhojpuri speaker before pilot:

1. Khana ke baad dawai lena mat bhuulein (Don't forget medication after meals)
2. Aaj protein check karna hai (Need to check protein today)
3. Protein bahut zyada hai — doctor ko fauran call karein (Protein very high — call doctor immediately)
4. Bahut badhiya! Protein thik hai (Great! Protein is normal)
5. Kal phir check karna (Check again tomorrow)
6. Paani mein patla karke test karo (Dip strip in urine)
7. Sittar second intezaar karo (Wait sixty seconds)
8. Rang dekhkar number chuno (Look at colour and choose number)
9. Aaj dawai liya? (Did you take medicine today?)
10. Kyun nahi liya? (Why not taken?)
11. Wajan kitna hai? (What is the weight?)
12. Kapde utaaro, seedha khade ho (Remove clothes, stand straight)
13. Neend mein sujan dikhti hai? (Is there swelling when sleeping?)
14. Doctor ka number (Doctor's phone number)
15. Abhi call karo (Call now)
16. Davai khatam hone wali hai (Medicine is running out)
17. Darr mat — hum madad karenge (Don't be afraid — we will help)
18. App band mat karo (Don't close the app)
19. Test result save ho gaya (Test result saved)
20. Sync ho raha hai (Syncing)
21. Network nahi hai — baad mein save ho jaega (No network — will save later)
22. Subah uthke pesha check karo (Check urine first thing in morning)
23. Teen din se 3+ protein — yeh relapse hai (3+ protein for 3 days — this is relapse)
24. Aaj wajan lena hai (Need to take weight today)
25. Shukriya — aap bahut badhiya kaam kar rahe hain (Thank you — you are doing a great job)

### 8.4 AI Cost Budget (100 patients)

| Usage | Volume | Cost/Unit | Monthly |
|---|---|---|---|
| Dipstick analysis (GPT-4o-mini vision) | 200 calls/day × 30 | ~$0.05 | ~$300 |
| Text completions (diagnostic agent) | 500 calls/month | ~$0.002 | ~$1 |
| Bhojpuri TTS (ElevenLabs v2) | 50,000 chars/month | $0.0001/char | ~$5 |
| **Total** | | | **~$306/month** |

Subsidy strategy: AIIMS/ICMR research grant, NGO partnership (CRY, Kidney Help Trust).

### 8.5 ML Relapse Prediction Engine (v2 — post-pilot)

Feature vector for LightGBM/XGBoost:

```
Time-series (7-day rolling):
  protein_mean_7d, protein_max_7d, protein_trend_7d (linear slope)
  weight_change_7d (kg delta from dry weight)
  compliance_rate_7d, test_completion_rate_7d

Point features:
  days_since_last_relapse, total_relapse_count
  diagnosis_type: 0=SSNS / 1=SDNS / 2=SRNS
  steroid_phase: 0=off / 1=daily / 2=alternate-day
  month_of_year (1–12), age_months

Symptom features (7-day rolling):
  oedema_reported_days_7d, max_symptom_severity_7d

Target:
  relapse_in_48h: binary (1 if protein ≥ 3+ within 48 hours)
```

Training: ≥500 patient-episodes from AIIMS/PMCH. IRB approval required.

---

## 9. Accessibility & Multilingual Requirements

### 9.1 Low-Literacy UX Rules

1. Every screen must be operable with ZERO reading — icons, colours, and audio convey all critical information
2. Text serves as confirmation for semi-literate users — not primary communication
3. Every screen auto-plays voice instruction on load (with mute option in settings)
4. No technical error messages — only human-readable, actionable messages
5. Forms auto-advance on voice input (no keyboard required except for name)
6. Numbers use large Noto Sans Devanagari digits in Hindi mode
7. Colour is never the ONLY indicator of state (must also have icon + text)

### 9.2 Language Support Matrix

| Language | Status | Text | TTS | Pre-recorded Audio |
|---|---|---|---|---|
| English | ✅ Present | Complete | System TTS | No |
| Hindi | ✅ Present | Partial | System TTS (Hindi voice) | No |
| Bhojpuri | ❌ Required | Must add | No system support | Required (25 phrases minimum) |
| Maithili | ⭕ Future | Not started | No system support | Future |

### 9.3 Screen Reader (TalkBack) Support

- All `<img>` elements: descriptive `alt` attributes
- All icon-only buttons: `aria-label`
- Logical, sequential focus order
- Modal dialogs trap focus and restore on close
- TalkBack tested on Redmi 9A

---

## 10. Testing & Validation

### 10.1 Clinical Validation Protocol

1. **Protocol review:** All clinical thresholds reviewed and signed off by ≥1 paediatric nephrologist (PMCH/AIIMS)
2. **Retrospective validation:** Test relapse detection algorithm on 20 historical PMCH patient records
3. **Dipstick validation:** App AI result compared to lab protein quantification on 50 known samples
4. **BP threshold validation:** 4th Task Force table verified for 5 test cases (varying age/height/sex)

### 10.2 Usability Testing

**Round 1 (before pilot, 5 caregivers):** Task completion rate ≥80% required  
**Round 2 (week 4 of pilot, 5 caregivers):** Retention check, barrier identification  
**Round 3 (week 12 of pilot, 3 clinicians):** Dashboard, PDF, alert fatigue  

### 10.3 Automated Test Requirements

| Test Type | Coverage Target | Tool |
|---|---|---|
| Unit — relapse detection | 100% branch coverage | Jest |
| Unit — medical calculations | 100% branch coverage | Jest |
| Unit — BP percentile lookup | All 4th Task Force table entries | Jest |
| Integration — Supabase sync | All CRUD operations | Playwright |
| E2E — urine test (AI success) | Full happy path | Playwright |
| E2E — urine test (AI failure → manual) | Critical error path | Playwright |
| E2E — relapse detection trigger | 3-day 3+ scenario | Playwright |
| Performance — app shell load on 3G | Lighthouse CI | Lighthouse CI |
| Offline — full test flow without network | Complete flow | Playwright |

### 10.4 Device Testing Matrix

| Device | OS | RAM | Priority |
|---|---|---|---|
| Redmi 9A | Android 10 | 2GB | P0 — must pass |
| Samsung Galaxy A03 | Android 11 | 2GB | P0 — must pass |
| Redmi Note 10 | Android 11 | 4GB | P1 |
| Mi 11 Lite | Android 12 | 6GB | P2 |
| Samsung Galaxy S21 | Android 13 | 8GB | P2 |
| iPhone 12 (Safari) | iOS 15 | 4GB | P3 |

---

## 11. Release Roadmap

### Sprint 0 — Emergency Safety (Week 1)

| Task | File | Owner |
|---|---|---|
| Remove random AI fallback → mandatory manual entry | `urine-test-screen.tsx` | Dev |
| Fix `takenYesterday` → date-stamped record | `app-context.tsx`, `medication-check-screen.tsx` | Dev |
| Audit and fix paediatric BP percentile table | `lib/medical-calculations.ts` | Dev + Clinician |
| Add 4-digit PIN gate to clinician dashboard | `clinician-dashboard-screen.tsx` | Dev |
| "Call Doctor" → `tel:` link with onboarding number | `floating-assistant.tsx` | Dev |
| Deploy corrected AI system prompt | `app/api/analyze-dipstick/route.ts` | Dev |
| Add DPDP Act consent screen to onboarding | `patient-onboarding-screen.tsx` | Dev |

**Exit criteria:** All 4 critical bugs resolved. Clinical sign-off received.

### Sprint 1 — Core Infrastructure (Weeks 2–4)
- Dexie.js offline storage layer
- Service worker + PWA manifest (next-pwa)
- Auto-sync to Supabase with queue
- Phone OTP authentication
- Offline indicator in UI
- Client-side image quality check

### Sprint 2 — Clinical Completeness (Weeks 5–7)
- 14-day weight trend chart + dry weight baseline
- Medication time-slot grouping + alternate-day flag
- Missed test day handling in relapse streak
- Frequently-relapsing NS classification
- Symptom photo capture
- Edit profile screen post-onboarding

### Sprint 3 — Communication (Weeks 8–10)
- Web Push VAPID daily reminder
- WhatsApp notification via Twilio
- Bhojpuri pre-recorded audio (25 phrases)
- Offline TTS fallback to pre-recorded audio
- Relapse emergency protocol screen (offline-accessible)

### Sprint 4 — Quality & Export (Weeks 11–13)
- PDF clinical report (jsPDF)
- Clinician multi-patient fleet view
- Confidence score visible in dipstick result
- Sentry crash reporting
- Lighthouse CI gate (≤3s on 3G)
- Usability testing Round 1

### Sprint 5 — Pilot (Weeks 14–26)
- 10-family closed pilot in Patna (PMCH catchment)
- CHW onboarding and training (2-day workshop)
- Clinician portal access for Dr. Arvind Singh
- Weekly outcome reviews with clinical team
- WHO Ethics review documentation
- Telemetry + outcome tracking

**Pilot success criteria:** ≥70% daily test completion rate at week 12. Zero adverse events attributable to app data error.

---

## 12. Appendices

### Appendix A: Open Questions for Clinical Sign-Off

| # | Question | Stakeholder |
|---|---|---|
| 1 | Does PMCH use HiMedia or Urispec dipstick strips? | Dr. Arvind Singh |
| 2 | Standard steroid taper protocol at PMCH for first-relapse SSNS? | Dr. Arvind Singh |
| 3 | Does the app require separate ethics review under ICMR? | PMCH Ethics Committee |
| 4 | Is OpenAI DPA acceptable under DPDP Act 2023 for medical image data? | Legal / DPO |
| 5 | Missed consecutive days in streak: treat as "unknown" or "break"? | Clinical team |
| 6 | Frequently-relapsing threshold at PMCH — 2 in 6 months, or different? | Dr. Arvind Singh |
| 7 | Who holds Supabase encryption keys? What happens when family changes phone? | Technical + Legal |
| 8 | Can ASHA workers log data on behalf of a family? | NGO partner |

### Appendix B: Clinical References

1. AIIMS/ISPN Consensus Statement on Management of Idiopathic Nephrotic Syndrome in Children (2022)
2. 4th Report on the Diagnosis, Evaluation, and Treatment of High Blood Pressure in Children and Adolescents, NHLBI (2004)
3. WHO Child Growth Standards: Weight-for-Age and Height-for-Age Reference Data (2006; 5–19 years, 2007)
4. ISPN Clinical Practice Recommendations for Nephrotic Syndrome (Kidney International Supplements, 2020)
5. DPDP Act 2023 (Digital Personal Data Protection Act, Government of India)
6. HiMedia Urispec Dipstick Colour Reference Chart (HiMedia Laboratories Pvt. Ltd., Mumbai)

### Appendix C: Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-27 | Use Dexie.js for offline storage (not localStorage) | IndexedDB supports large datasets; Dexie provides Promises and TypeScript support |
| 2026-06-27 | Keep GPT-4o-mini (not GPT-4o) for cost | 4o-mini sufficient for colour matching; 4o costs 3× more |
| 2026-06-27 | Pre-recorded Bhojpuri audio over TTS synthesis for v1 | No Bhojpuri TTS model available; pre-recorded is more reliable offline |
| 2026-06-27 | Phone OTP as primary auth (not email) | Bihar caregivers do not have email; all have mobile numbers |
| 2026-06-27 | WhatsApp as primary notification fallback (not SMS) | WhatsApp penetration in Bihar exceeds SMS open rates |
| 2026-06-27 | 4-digit PIN for clinician dashboard (not Supabase role-based auth) | Role-based auth requires admin provisioning; PIN is simpler for field scenario |

---

*This document is a living specification. All clinical protocol interpretations must be verified by a qualified paediatric nephrologist before implementation. This document does not constitute medical advice.*

*Prepared by Claude Code AI Product Analyst — intellicu/kidney-care-app-ns — 2026-06-27*
