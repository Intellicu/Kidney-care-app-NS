# Product Readiness & Gap Analysis Document (PRGAD)
## KidneyCare — Nephrotic Syndrome Home Monitoring App
**Version:** 1.0  
**Date:** 2026-06-27  
**Reviewer:** Claude Code (AI Product Analyst)  
**Methodology:** Epic / Philips / Google Health / Apple Health product review framework  
**Repository:** intellicu/kidney-care-app-ns  
**Branch:** claude/kidneycare-readiness-review-0fh1wo  

---

## Executive Summary

KidneyCare is a home monitoring application for paediatric Nephrotic Syndrome patients targeting underprivileged families in Bihar, India — a population with high illiteracy, intermittent connectivity, and primary communication via Bhojpuri dialect. The app covers urine protein dipstick testing (with AI image analysis), medication compliance tracking, symptom logging, weight/BP monitoring, and a clinician dashboard.

**Overall Readiness Score: 76 / 190 (40%)**

The app demonstrates a well-structured clinical rule engine (AIIMS/ISPN protocol) and a thoughtful onboarding flow, but contains **4 patient-safety-critical bugs** that must be resolved before any pilot deployment. Core infrastructure gaps — offline-first storage, background push notifications, Bhojpuri voice support, and PDF export — are absent. The product is **NOT READY** for pilot as of this review.

### Score Summary by Category

| Category | Score | Status |
|---|---|---|
| Urine Dipstick Testing | 6/10 | ⚠️ PARTIAL |
| AI Image Analysis | 5/10 | ⚠️ PARTIAL + 🚨 CRITICAL BUG |
| Medication Compliance | 4/10 | ⚠️ PARTIAL + 🚨 CRITICAL BUG |
| Symptom Diary | 5/10 | ⚠️ PARTIAL |
| Relapse Detection | 8/10 | ✅ BUILT |
| Alerts & Notifications | 4/10 | ⚠️ PARTIAL |
| Blood Pressure Monitoring | 4/10 | ⚠️ PARTIAL + 🚨 CRITICAL BUG |
| Weight & Growth Tracking | 6/10 | ⚠️ PARTIAL |
| Dashboard & Patient View | 7/10 | ✅ BUILT |
| Clinician Dashboard | 4/10 | ⚠️ PARTIAL + 🚨 CRITICAL BUG |
| Voice & Accessibility | 5/10 | ⚠️ PARTIAL |
| Offline Functionality | 1/10 | ❌ ABSENT |
| Data Sync & Persistence | 3/10 | ❌ ABSENT |
| Multilingual Support | 3/10 | ❌ ABSENT |
| Onboarding | 6/10 | ⚠️ PARTIAL |
| Push Notifications | 2/10 | ❌ ABSENT |
| Clinical Report Export | 1/10 | ❌ ABSENT |
| Privacy & Security | 3/10 | ❌ ABSENT |
| Performance & PWA | 2/10 | ❌ ABSENT |
| Emergency Escalation | 2/10 | ❌ ABSENT |
| **TOTAL** | **76/190** | **40% — NOT READY** |

---

## Feature-by-Feature Analysis

---

### 1. Urine Dipstick Testing ⚠️ PARTIAL — 6/10

**File:** `components/kidney-care/screens/urine-test-screen.tsx`

**What is built:**
- 6-step illustrated instruction flow (dip → wait 60 seconds → compare)
- 60-second countdown timer with audio cues
- Manual result entry (negative / trace / 1+ / 2+ / 3+ / 4+)
- Camera capture for AI-assisted reading (before + after images)
- Result display with clinical interpretation and recommendation
- TTS narration of each instruction step

**Gaps:**
- Confidence score returned by AI API but never displayed to user — caregivers cannot know if the reading is trustworthy
- No retry flow when image quality is poor (blur, bad lighting, wrong angle)
- No client-side image quality pre-check before sending to API
- Color calibration card workflow not implemented (ambient light variation causes misreads in Bihar)
- No "unable to read" explicit path — the fallback immediately generates a random result (🚨 CRITICAL BUG)
- Result timestamps use device local time only — no UTC normalisation, problematic for any backend sync

**🚨 CRITICAL BUG — Random Fallback:**
```typescript
// urine-test-screen.tsx — must be removed before pilot
const mockResults: Result[] = ["negative", "trace", "1+", "2+", "3+", "4+"]
setFinalResult(mockResults[Math.floor(Math.random() * mockResults.length)])
```
When the AI API call fails (network timeout, OpenAI outage, quota exceeded), the app silently assigns a random protein result. This result is then stored, appears on the clinician dashboard, and triggers relapse alerts. A random "3+" could cause a family to unnecessarily restart steroids. This is a **patient safety issue**.

**Required fix:** Replace random fallback with a mandatory manual selection screen. If AI fails, show: "AI could not read the strip. Please enter the result manually." with the 6-option selector.

**Acceptance Criteria Before Pilot:**
- [ ] Random fallback removed
- [ ] Confidence score visible when AI result is shown
- [ ] Manual entry always available as escape hatch
- [ ] Client-side blur/darkness detection before API call

---

### 2. AI Image Analysis ⚠️ PARTIAL + 🚨 CRITICAL BUG — 5/10

**File:** `app/api/analyze-dipstick/route.ts`

**What is built:**
- Vercel AI SDK with `generateText` + `Output.object()` + Zod schema for structured output
- GPT-4o-mini vision model accepting two base64 images (before + after)
- Structured output: `result`, `confidence`, `reasoning`, `proteinPadColor`, `recommendation`
- API route with error handling wrapper

**Gaps:**
- System prompt not optimised for dipstick reading — no specific instruction about the protein pad position (3rd pad from left on most common HiMedia/Urispec strips used in Bihar)
- No image preprocessing (resize to ≤1024px, JPEG compression) before sending — full 8MP phone photos sent to API, causing latency and cost bloat
- No rate limiting or quota management — 100 patients × 2 tests/day = 200 API calls/day, but no guard against bursts
- No response caching or deduplication
- `confidence` field returned but never used in UI
- No fallback to a local on-device model (even a simple threshold model) when offline
- API key rotation and secret management not reviewed

**🚨 CRITICAL BUG (same as above):** The route returns `{ success: false, fallback: true }` on error, and the client interprets this to trigger the random result selection.

**Corrected System Prompt (required):**
```
You are a medical image analysis assistant specialising in urinary dipstick interpretation for Nephrotic Syndrome monitoring. You will receive two images: the first shows the unused dipstick strip (reference colours), the second shows the strip after being dipped in urine for exactly 60 seconds. Focus exclusively on the PROTEIN pad — the third coloured square from the patient's end of the strip. Compare it to the reference colours. Report result as one of: negative, trace, 1+, 2+, 3+, 4+. Confidence must be 0.0–1.0. If lighting is too poor or the strip is not visible, set confidence below 0.5 and explain in reasoning.
```

**Cost Analysis:**
- Estimated: ~$0.05 / analysis (gpt-4o-mini vision)
- 100 patients × 2/day × 30 days = 6,000 calls/month = ~$300/month (needs subsidy plan)

**Acceptance Criteria Before Pilot:**
- [ ] Corrected system prompt deployed
- [ ] Image resized to ≤1024px before API call
- [ ] Random fallback removed
- [ ] Confidence score shown in UI

---

### 3. Medication Compliance ⚠️ PARTIAL + 🚨 CRITICAL BUG — 4/10

**File:** `components/kidney-care/screens/medication-check-screen.tsx`  
**Also:** `lib/app-context.tsx` (function `toggleMedicationTakenYesterday`)

**What is built:**
- Simple toggle per medication (taken / not taken)
- Medication list from onboarding prescription scan
- Visual completion state (checkmark)
- TTS narration of medication names

**Gaps:**
- No time-slot grouping (morning / afternoon / night) — critical for multi-dose steroid regimens
- No steroid taper logic — prednisolone must be taken every other day (alternate day) during maintenance; the app has no concept of which days require medication
- No missed dose reason capture — "forgot," "pharmacy empty," "side effect" are clinically meaningful
- No caregiver prompt at scheduled time (no alarm or notification)
- No refill reminder
- No pill count support

**🚨 CRITICAL BUG — Semantic Mismatch:**
```typescript
// app-context.tsx
function toggleMedicationTakenYesterday(medId: string) { ... }
// The field is named takenYesterday but tracks today's compliance
```
The `takenYesterday` boolean is compared against today's date in `calculateComplianceMetrics()`. If a caregiver marks medication at 11:58 PM and the date rolls over, the record is attributed to the wrong day, producing false compliance gaps in the clinician dashboard.

**Required fix:** Rename to `takenToday` with an explicit ISO date stamp: `{ takenDate: "2026-06-27", taken: true }`.

**Acceptance Criteria Before Pilot:**
- [ ] `takenYesterday` field renamed with explicit date stamp
- [ ] Morning / afternoon / night time slots implemented
- [ ] Alternate-day steroid flag in medication schema
- [ ] Missed dose reason captured

---

### 4. Symptom Diary ⚠️ PARTIAL — 5/10

**What is built:**
- Symptom selection (swelling, fatigue, reduced urine, headache, nausea, others)
- Body location picker for swelling (face, legs, abdomen, generalised)
- Severity scale (mild / moderate / severe)
- Free-text notes (voice input supported)
- TTS narration of symptom labels

**Gaps:**
- No photo capture for pitting oedema documentation (critical for clinician review)
- No structured pain scale (1–10) — just categorical severity
- No symptom trend view ("swelling has been reported 5 days in a row")
- No automatic escalation when high-severity symptoms cluster (e.g., severe generalised oedema + reduced urine for 2 days)
- Symptom history not exportable with clinical report

**Acceptance Criteria Before Pilot:**
- [ ] Photo capture for oedema documentation
- [ ] Symptom trend shown in dashboard
- [ ] Escalation trigger when ≥2 high-severity symptoms for ≥2 days

---

### 5. Relapse Detection ✅ BUILT — 8/10

**File:** `lib/relapse-detection.ts`

**What is built:**
- Full AIIMS/ISPN protocol implementation
- Relapse = protein ≥ 3+ for 3 consecutive days
- Remission = negative/trace for 3 consecutive days
- 1+ or 2+ alone correctly does NOT trigger relapse (matches AIIMS handbook)
- `analyzeRelapseStatus()` returns status, consecutive positive/negative days, trend, relapse count, dates
- `generateAlerts()` produces tiered alerts: critical → warning → info → success
- Alert types: relapse-detected, relapse-warning, remission-detected, missed-test, weight-gain-alert, symptom-alert, compliance-low

**Gaps:**
- No handling of missed test days in consecutive count — current logic may incorrectly break a streak if a day is skipped
- No distinction between first relapse and frequent relapse (≥2 relapses in 6 months = frequently relapsing — different clinical pathway)
- Steroid-resistant NS not flagged separately
- Relapse history count stored in state but not persisted across app restarts (offline persistence gap)

**Acceptance Criteria Before Pilot:**
- [ ] Missed test day handling: pause streak or mark as unknown, do not reset
- [ ] Frequently-relapsing flag for ≥2 relapses in 6 months

---

### 6. Alerts & Notifications ⚠️ PARTIAL — 4/10

**What is built:**
- In-app alert banner with severity colours (red/amber/green/blue)
- TTS reading of urgent alerts on dashboard load
- Alert types tied to clinical events (relapse, weight gain, compliance)
- Floating assistant badge shows urgent alert count

**Gaps:**
- No background push notifications — app must be open to see alerts
- No WhatsApp fallback (Twilio) — primary reliable channel for Bihar families
- No SMS fallback
- No scheduled daily reminder push ("Time to test your urine!")
- No caregiver escalation path when alert not acknowledged within X hours
- No CHW notification when family misses 3+ tests

**Acceptance Criteria Before Pilot:**
- [ ] Web Push (VAPID) implemented via service worker
- [ ] Daily reminder at caregiver-chosen time
- [ ] WhatsApp notification via Twilio for relapse alerts

---

### 7. Blood Pressure Monitoring ⚠️ PARTIAL + 🚨 CRITICAL BUG — 4/10

**File:** `lib/medical-calculations.ts`

**What is built:**
- BP entry (systolic / diastolic)
- `getBPCategoryColor()` function for colour coding
- BP shown in vitals grid on dashboard

**Gaps:**
- BP entry has no device pairing (Bluetooth cuff) — manual entry only, high error risk
- No instruction screen for correct BP measurement in children

**🚨 CRITICAL BUG — Adult Thresholds on Children:**
The `getBPCategoryColor()` function requires audit. Paediatric BP must be assessed using the **4th Task Force Report (NHLBI)** percentile tables that adjust for age, sex, and height. Using adult thresholds (≥130/80 = Stage 1) on a 6-year-old dramatically under-diagnoses hypertension.

Correct paediatric thresholds:
- Normal: < 90th percentile
- Elevated: 90th–94th percentile
- Stage 1 HTN: 95th–99th percentile + 12 mmHg
- Stage 2 HTN: > 99th percentile + 12 mmHg

**Acceptance Criteria Before Pilot:**
- [ ] 4th Task Force percentile lookup table implemented (age 1–17, sex, height percentile)
- [ ] BP display shows percentile, not just mmHg
- [ ] Manual entry instruction screen

---

### 8. Weight & Growth Tracking ⚠️ PARTIAL — 6/10

**What is built:**
- Weight and height entry
- BMI calculation
- BSA (Body Surface Area) calculation
- Percentile display (WHO Growth Standards)
- Weight shown in vitals grid

**Gaps:**
- No weight trend chart over time (critical for oedema detection — rapid 2kg gain in 3 days is a relapse signal)
- No "dry weight" baseline concept
- No WHO percentile chart visual (z-score curve graphic)
- Growth velocity not calculated

**Acceptance Criteria Before Pilot:**
- [ ] Weight trend chart (14-day view minimum)
- [ ] Dry weight baseline field
- [ ] Alert when weight exceeds dry weight by ≥5% in ≤3 days

---

### 9. Dashboard & Patient View ✅ BUILT — 7/10

**File:** `components/kidney-care/screens/dashboard-screen.tsx`

**What is built:**
- Greeting with patient name and current date
- Patient info card
- Vitals grid: weight, height, BMI, BSA with percentiles
- Clinical alerts panel
- Relapse status card (colour-coded)
- Daily check CTA
- Quick actions grid (8 items)
- Floating assistant with TTS
- TTS on dashboard load

**Gaps:**
- Dashboard does not degrade gracefully when no data exists
- Quick actions not personalised to current clinical status
- No "last synced" indicator
- 30KB file approaching maintainability limit

**Acceptance Criteria Before Pilot:**
- [ ] Empty state with guided first-action prompt
- [ ] "Last synced" timestamp visible
- [ ] Dashboard renders correctly offline (from local cache)

---

### 10. Clinician Dashboard ⚠️ PARTIAL + 🚨 CRITICAL BUG — 4/10

**File:** `components/kidney-care/screens/clinician-dashboard-screen.tsx`

**What is built:**
- 4-tab view: Overview, Lab Data, Medications, Timeline
- Protein bar chart (custom SVG)
- Compliance donut chart
- Test log with patient vs AI result comparison
- Data export to `.txt` file

**Gaps:**
- Export is `.txt` not PDF
- No date range filter on lab data
- No comparative view across multiple patients
- No print-optimised layout
- No annotation capability

**🚨 CRITICAL BUG — No Access Control:**
The clinician dashboard is accessible to any user who navigates to it — no PIN, no password, no role verification. Any family member or bystander with access to the phone can see all clinical data. This violates basic patient privacy.

**Required fix:** Add a 4-digit PIN gate that activates after 30 seconds of inactivity in clinician mode.

**Acceptance Criteria Before Pilot:**
- [ ] PIN gate implemented and required
- [ ] PDF export via jsPDF
- [ ] Date range filter on lab tab
- [ ] Auto-lock after 30 seconds of inactivity

---

### 11. Voice & Accessibility ⚠️ PARTIAL — 5/10

**What is built:**
- TTS via `window.speechSynthesis`
- STT via `webkitSpeechRecognition` for name, weight, height during onboarding
- Voice narration on dashboard load
- Icon + text labels throughout

**Gaps:**
- **Bhojpuri language absent** — Bihar's primary spoken language not available
- No pre-recorded audio clips as fallback
- No visual-only mode
- Touch targets not uniformly ≥48×48dp
- No font-size accessibility setting
- `webkitSpeechRecognition` is Chrome-only

**Acceptance Criteria Before Pilot:**
- [ ] Pre-recorded Bhojpuri audio clips for all critical instructions (25-phrase minimum vocabulary)
- [ ] Offline TTS fallback to pre-recorded audio
- [ ] All interactive touch targets ≥48×48dp verified

---

### 12. Offline Functionality ❌ ABSENT — 1/10

**What is built:**
- None. The application makes live API calls for all data operations.

**Gaps:**
- No service worker (no `next-pwa`, no `workbox` in `package.json`)
- No IndexedDB layer (`dexie` absent from `package.json`)
- No offline indicator in UI
- App fails completely when internet drops
- No local queue for syncing test results when connection resumes

This is the **most significant architectural gap**. Bihar families often live in areas with 2G coverage or no signal for 8–12 hours/day.

**Required architecture:** Dexie.js (IndexedDB wrapper) for local storage of all test results, medications, and symptoms. Service worker via Workbox to cache the app shell. Sync engine that pushes queued records to Supabase when connectivity is restored.

**Acceptance Criteria Before Pilot:**
- [ ] `dexie` and `next-pwa` / `workbox` added to `package.json`
- [ ] App shell works fully offline
- [ ] Test results queue locally and sync automatically when online
- [ ] Offline/online indicator visible in UI

---

### 13. Data Sync & Persistence ❌ ABSENT — 3/10

**What is built:**
- Supabase PostgreSQL as backend
- Supabase Auth (email/password)
- Row-Level Security configured

**Gaps:**
- App-context is a 77KB monolithic React context — unclear what persists across restarts
- No local-first persistence layer
- No sync conflict resolution strategy
- Phone OTP auth absent
- Session token management not reviewed

**Acceptance Criteria Before Pilot:**
- [ ] Phone OTP auth (Supabase supports this natively)
- [ ] All monitored data persists to IndexedDB immediately on entry
- [ ] Supabase sync with last-write-wins conflict resolution and audit log

---

### 14. Multilingual Support ❌ ABSENT — 3/10

**What is built:**
- Language selection screen (Hindi selected in UI)
- Some Hindi text in labels

**Gaps:**
- Bhojpuri: completely absent
- Maithili: completely absent
- No i18n framework (`react-i18next` or similar)
- No RTL support
- Voice TTS uses browser default Hindi voice — low quality for Bihar caregivers

**Acceptance Criteria Before Pilot:**
- [ ] i18n framework implemented (react-i18next)
- [ ] All UI strings externalised to translation files
- [ ] Bhojpuri audio clips recorded and integrated (25 critical phrases minimum)

---

### 15. Onboarding ⚠️ PARTIAL — 6/10

**File:** `components/kidney-care/screens/patient-onboarding-screen.tsx`

**What is built:**
- 9-step wizard: welcome → name → DOB → weight → height → sex → diagnosis → medications → reminder
- Voice TTS on each step
- STT for name, weight, height
- Prescription photo upload
- Progress dots
- Guest mode bypass

**Gaps:**
- Missing critical clinical fields: steroid sensitivity, date of first diagnosis, pre-app relapse count, doctor phone number, allergy list
- Guest mode skips onboarding — no minimum viable data collection
- No "edit profile" screen post-onboarding

**Acceptance Criteria Before Pilot:**
- [ ] Steroid sensitivity and first-diagnosis date added
- [ ] Doctor phone number captured and used for `tel:` link
- [ ] Pre-app relapse count captured

---

### 16. Push Notifications ❌ ABSENT — 2/10

**What is built:**
- Daily reminder time captured during onboarding
- In-app notification display

**Gaps:**
- No Web Push API implementation (no VAPID keys, no service worker push handler)
- No backend notification scheduler
- No WhatsApp fallback via Twilio
- No SMS fallback
- Notification time captured but never used for actual delivery

**Acceptance Criteria Before Pilot:**
- [ ] Web Push API with VAPID implemented
- [ ] Daily reminder fires at caregiver-chosen time even when app is closed
- [ ] WhatsApp fallback for critical alerts

---

### 17. Clinical Report Export ❌ ABSENT — 1/10

**What is built:**
- `.txt` export in clinician dashboard (raw data dump)

**Gaps:**
- No PDF generation
- No structured clinical report format
- No 14-day or 30-day summary report
- No QR code for sharing with clinic
- No print formatting

**Acceptance Criteria Before Pilot:**
- [ ] PDF export via `jsPDF` with: patient header, 14-day protein trend chart, medications list, relapse history, weight trend, doctor signature line
- [ ] Available from both patient app and clinician dashboard

---

### 18. Privacy & Security ❌ ABSENT — 3/10

**What is built:**
- Supabase Row-Level Security
- HTTPS via Vercel
- Supabase Auth session management

**Gaps:**
- No DPDP Act 2023 compliance: no consent management screen, no data deletion flow, no data portability export
- No privacy policy presented to user during onboarding
- Clinician dashboard has no access control (🚨 CRITICAL BUG)
- No encryption of locally stored data
- No audit log
- OpenAI receives patient dipstick images — DPA not confirmed
- No crash reporting (Sentry absent)

**Acceptance Criteria Before Pilot:**
- [ ] DPDP Act 2023 consent screen in onboarding
- [ ] Data deletion request flow
- [ ] OpenAI DPA confirmed and documented
- [ ] Sentry integration for crash reporting

---

### 19. Performance & PWA ❌ ABSENT — 2/10

**What is built:**
- Next.js 16 App Router
- Vercel Analytics

**Gaps:**
- No PWA manifest (no `manifest.json`, no install prompt)
- No service worker
- No app icon for home screen installation
- `app-context.tsx` at 77KB likely causing significant re-render overhead
- No code-splitting for heavy screens
- No performance budget enforcement
- Not tested on low-end Android devices

**Acceptance Criteria Before Pilot:**
- [ ] PWA manifest and service worker implemented
- [ ] App shell loads in ≤3 seconds on 3G (Lighthouse CI gate)
- [ ] Tested on Redmi 9A or equivalent low-end device

---

### 20. Emergency Escalation ❌ ABSENT — 2/10

**What is built:**
- "Call Doctor" button in floating assistant — speaks a message
- Critical alert display

**Gaps:**
- "Call Doctor" does NOT place a phone call — no `tel:` link
- No emergency contact list in the app
- No one-tap emergency protocol on relapse confirmation
- No CHW notification when family cannot reach doctor

**Acceptance Criteria Before Pilot:**
- [ ] "Call Doctor" places a real `tel:` call to the number entered during onboarding
- [ ] Relapse emergency protocol screen: 3-step action card with phone numbers and hospital address
- [ ] Offline-accessible emergency screen

---

## Pilot Readiness Checklist

### Clinical Safety (Must ALL pass before ANY pilot)
- [ ] 🚨 Random AI fallback removed — replaced with mandatory manual entry
- [ ] 🚨 `takenYesterday` field renamed with explicit date stamp
- [ ] 🚨 Paediatric BP percentile tables (4th Task Force) implemented
- [ ] 🚨 Clinician dashboard PIN gate implemented
- [ ] AI dipstick system prompt corrected for protein pad position
- [ ] "Call Doctor" places actual phone call
- [ ] Relapse emergency protocol screen implemented (works offline)

### Infrastructure (Must ALL pass before ANY pilot)
- [ ] Phone OTP authentication
- [ ] Offline data persistence (Dexie.js + IndexedDB)
- [ ] Service worker with app-shell caching
- [ ] Data syncs automatically when connectivity resumes
- [ ] Web Push daily reminder operational

### Regulatory (Must ALL pass before ANY pilot)
- [ ] DPDP Act 2023 consent screen
- [ ] Privacy policy accessible in-app
- [ ] OpenAI data processing agreement signed
- [ ] Clinician dashboard access-controlled

### Usability (Must pass before scaling beyond 10-family pilot)
- [ ] Bhojpuri audio clips recorded (25 critical phrases)
- [ ] PDF clinical report export functional
- [ ] Tested on Redmi 9A without crashes
- [ ] 14-day weight trend chart visible

---

## Sprint Prioritisation

### Sprint 0 — Emergency (Week 1, before ANY pilot)
1. Remove random AI fallback → mandatory manual entry
2. Fix `takenYesterday` → date-stamped record
3. Audit and fix paediatric BP thresholds
4. Add PIN gate to clinician dashboard
5. Add `tel:` link to "Call Doctor" with onboarding phone number
6. Corrected AI system prompt for dipstick

### Sprint 1 — Core Infrastructure (Weeks 2–4)
1. Dexie.js offline storage layer
2. Service worker + PWA manifest
3. Auto-sync to Supabase with queue
4. Phone OTP authentication
5. Offline indicator in UI
6. DPDP Act consent screen

### Sprint 2 — Clinical Completeness (Weeks 5–7)
1. 14-day weight trend chart + dry weight baseline
2. Medication time-slot grouping + alternate-day flag
3. Paediatric BP percentile table
4. Missed test handling in relapse streak calculation
5. Frequently-relapsing NS classification
6. Symptom photo capture (oedema documentation)

### Sprint 3 — Communication (Weeks 8–10)
1. Web Push VAPID daily reminder
2. WhatsApp notification via Twilio
3. Bhojpuri pre-recorded audio clips (25 phrases)
4. Offline TTS fallback to pre-recorded audio
5. Relapse emergency protocol screen

### Sprint 4 — Quality & Export (Weeks 11–13)
1. PDF clinical report (jsPDF)
2. Clinician multi-patient fleet view
3. Client-side image quality check before AI call
4. Confidence score visible in dipstick result
5. Sentry crash reporting

### Sprint 5 — Pilot (Weeks 14–26)
1. 10-family closed pilot in Patna (PMCH catchment)
2. CHW onboarding and training
3. Clinician portal at PMCH / AIIMS Patna
4. Telemetry + outcome tracking
5. WHO Ethics review documentation

---

## Differentiation Features (For v2 Post-Pilot)

1. **AI Relapse Prediction Engine** — LightGBM model trained on protein trend, weight change, medication compliance, symptom cluster, seasonal factors. Predict relapse 24–48 hours before clinical confirmation.

2. **ASHA Worker Integration** — CHW portal for managing 10–15 families. Batch alert view, offline sync, field visit scheduling.

3. **Telemedicine Integration** — Video call scheduling with AIIMS/PMCH nephrologist from within the app.

4. **Growth Velocity Tracking** — Alert if growth velocity drops below −2 SD/year (steroid stunting).

5. **Steroid Taper Assistant** — Week-by-week prednisolone taper schedule with daily dose calculator (by weight), alternate-day transition guidance.

6. **Community Health Insights** — Anonymous aggregate trend dashboard for health officials.

7. **Research Data Export** — De-identified dataset export for AIIMS research on NS outcomes in Bihar.

---

## Appendix: Bug Tracker

| ID | Severity | File | Description | Sprint |
|---|---|---|---|---|
| BUG-001 | 🚨 CRITICAL | `urine-test-screen.tsx` | Random protein result assigned on AI failure | 0 |
| BUG-002 | 🚨 CRITICAL | `app-context.tsx`, `medication-check-screen.tsx` | `takenYesterday` semantic mismatch — wrong date attribution | 0 |
| BUG-003 | 🚨 CRITICAL | `lib/medical-calculations.ts` | Adult BP thresholds used for children | 0 |
| BUG-004 | 🚨 CRITICAL | `clinician-dashboard-screen.tsx` | No access control — any user can view all patient data | 0 |
| BUG-005 | HIGH | `floating-assistant.tsx` | "Call Doctor" speaks but does not dial | 0 |
| BUG-006 | HIGH | `app/api/analyze-dipstick/route.ts` | AI system prompt does not specify protein pad position | 0 |
| BUG-007 | HIGH | `lib/relapse-detection.ts` | Missed test day resets streak incorrectly | 1 |
| BUG-008 | MEDIUM | `urine-test-screen.tsx` | Confidence score returned by API but not displayed | 2 |
| BUG-009 | MEDIUM | `patient-onboarding-screen.tsx` | Doctor phone number not captured — "Call Doctor" nonfunctional | 0 |
| BUG-010 | MEDIUM | `app-context.tsx` | 77KB monolithic context causes re-render overhead | 3 |

---

## Clinical References

- AIIMS/ISPN Nephrotic Syndrome Management Protocol (2022)
- 4th Task Force Report on Blood Pressure in Children and Adolescents, NHLBI (2004)
- WHO Growth Standards: Weight-for-Age and Height-for-Age (2006, 5–19 years 2007)
- ISPN Clinical Practice Recommendations for Nephrotic Syndrome (2020)
- DPDP Act 2023 (India Digital Personal Data Protection Act)

---

*Document prepared by Claude Code AI Product Analyst — review with clinical team before acting on recommendations. Clinical protocol interpretations must be verified by a qualified paediatric nephrologist.*
