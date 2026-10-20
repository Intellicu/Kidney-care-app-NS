import os
import sys
import zipfile
import subprocess

BASE_DIR = r"c:\AIIMS PATNA\App"
STATIC_DIR = os.path.join(BASE_DIR, "static")
DIST_DIR = os.path.join(BASE_DIR, "kidneycare-react", "kidneycare-main", "dist")
SOURCE_APK = os.path.join(STATIC_DIR, "KidneyCare-AI-v2.apk")
KEYSTORE = os.path.join(BASE_DIR, "android-release.keystore")
BUILD_TOOLS = os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk\build-tools\35.0.0")
ZIPALIGN = os.path.join(BUILD_TOOLS, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS, "apksigner.bat")

def build_flavor_apk(flavor_name, output_apk_name, html_template):
    print(f"\n==========================================")
    print(f"Building {flavor_name} -> {output_apk_name}")
    print(f"==========================================")
    
    unaligned_apk = os.path.join(STATIC_DIR, f"temp_{flavor_name}_unaligned.apk")
    aligned_apk = os.path.join(STATIC_DIR, f"temp_{flavor_name}_aligned.apk")
    final_apk = os.path.join(STATIC_DIR, output_apk_name)
    
    # 1. Package APK with updated assets and flavor index.html
    with zipfile.ZipFile(SOURCE_APK, 'r') as zin, zipfile.ZipFile(unaligned_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        # Copy non-public and non-meta-inf files from base APK
        for item in zin.infolist():
            if not item.filename.startswith('assets/public/') and not item.filename.startswith('META-INF/'):
                zout.writestr(item, zin.read(item.filename))
        
        # Write flavor-specific index.html
        zout.writestr('assets/public/index.html', html_template)
        
        # Copy all other dist files into assets/public/
        for root, dirs, files in os.walk(DIST_DIR):
            for file in files:
                if file.lower() == 'index.html':
                    continue # already custom written
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, DIST_DIR).replace('\\', '/')
                archive_path = f"assets/public/{rel_path}"
                zout.write(full_path, archive_path)
                
    print(f"[1/3] Unaligned APK created ({round(os.path.getsize(unaligned_apk)/1024/1024, 2)} MB)")
    
    # 2. Zipalign
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    cmd_zipalign = f'"{ZIPALIGN}" -f -v -p 4 "{unaligned_apk}" "{aligned_apk}"'
    res = subprocess.run(cmd_zipalign, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        print("Zipalign error:", res.stderr.decode('utf-8', errors='ignore'))
        return False
    print(f"[2/3] Zipalign completed")
    
    # 3. Apksigner (v1, v2, v3)
    if os.path.exists(final_apk):
        os.remove(final_apk)
    cmd_sign = f'"{APKSIGNER}" sign --ks "{KEYSTORE}" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out "{final_apk}" "{aligned_apk}"'
    res = subprocess.run(cmd_sign, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        print("Signing error:", res.stderr.decode('utf-8', errors='ignore'))
        return False
        
    # Verify
    cmd_verify = f'"{APKSIGNER}" verify -v "{final_apk}"'
    res = subprocess.run(cmd_verify, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out_verify = res.stdout.decode('utf-8', errors='ignore')
    v2_ok = "Verified using v2 scheme (APK Signature Scheme v2): true" in out_verify
    v3_ok = "Verified using v3 scheme (APK Signature Scheme v3): true" in out_verify
    print(f"[3/3] Apksigner verification: v2={v2_ok}, v3={v3_ok}. Final size: {round(os.path.getsize(final_apk)/1024/1024, 2)} MB")
    
    # Cleanup temp
    if os.path.exists(unaligned_apk): os.remove(unaligned_apk)
    if os.path.exists(aligned_apk): os.remove(aligned_apk)
    return True

# Read fresh dist/index.html to know script and css filenames
with open(os.path.join(DIST_DIR, 'index.html'), 'r', encoding='utf-8') as f:
    base_html = f.read()

# Extract script src and link href
import re
script_match = re.search(r'<script type="module" crossorigin src="([^"]+)"></script>', base_html)
css_match = re.search(r'<link rel="stylesheet" crossorigin href="([^"]+)">', base_html)

script_src = script_match.group(1) if script_match else "./assets/index-DV5QJRAm.js"
css_href = css_match.group(1) if css_match else "./assets/index-Dly0N-qW.css"

print("Asset references:", script_src, css_href)

caregiver_html = f"""<!doctype html>
<html lang="en">
  <head>
    <script>
      window.KIDNEYCARE_APP_FLAVOR = "caregiver";
      localStorage.setItem("kc_user_role", "caregiver");
      localStorage.setItem("kidneycare_selected_app", "caregiver");
    </script>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://base44.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0d9488" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="KidneyCare Caregiver" />
    <meta name="description" content="KidneyCare for Parents & Caregivers - Daily urine protein testing, autocalc meal logging, and relapse monitoring." />
    <link rel="manifest" href="./manifest.json" />
    <title>KidneyCare — Caregiver App (अभिभावक ऐप)</title>
    <script type="module" crossorigin src="{script_src}"></script>
    <link rel="stylesheet" crossorigin href="{css_href}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>"""

clinician_html = f"""<!doctype html>
<html lang="en">
  <head>
    <script>
      window.KIDNEYCARE_APP_FLAVOR = "clinician";
      localStorage.setItem("kc_user_role", "clinician");
      localStorage.setItem("kidneycare_selected_app", "clinician");
    </script>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://base44.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#4f46e5" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="KidneyCare Clinician" />
    <meta name="description" content="KidneyCare OPD Workstation & PRINT 2026 Dietary Prescription Engine for Pediatric Nephrologists." />
    <link rel="manifest" href="./manifest.json" />
    <title>KidneyCare — Clinician OPD Workstation (चिकित्सक वर्कस्टेशन)</title>
    <script type="module" crossorigin src="{script_src}"></script>
    <link rel="stylesheet" crossorigin href="{css_href}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>"""

nutrition_html = f"""<!doctype html>
<html lang="en">
  <head>
    <script>
      window.KIDNEYCARE_APP_FLAVOR = "nutrition";
      localStorage.setItem("kc_user_role", "nutrition");
      localStorage.setItem("kidneycare_selected_app", "nutrition");
    </script>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://base44.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0d9488" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="KidneyCare Nutrition Hub" />
    <meta name="description" content="KidneyCare Pediatric Renal Diet & Nutrition Hub - 643 Indian renal foods, PRINT 2026 SDI calculator." />
    <link rel="manifest" href="./manifest.json" />
    <title>KidneyCare — Renal Nutrition Hub (आहार एवं पोषण हब)</title>
    <script type="module" crossorigin src="{script_src}"></script>
    <link rel="stylesheet" crossorigin href="{css_href}">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>"""

# Build all flavors
build_flavor_apk("caregiver", "KidneyCare-Caregiver.apk", caregiver_html)
build_flavor_apk("clinician", "KidneyCare-Clinician.apk", clinician_html)
build_flavor_apk("nutrition", "KidneyCare-Nutrition.apk", nutrition_html)
build_flavor_apk("unified", "KidneyCare-AI-v3-Latest.apk", base_html)

# Also update root copy
import shutil
shutil.copyfile(os.path.join(STATIC_DIR, "KidneyCare-AI-v3-Latest.apk"), os.path.join(BASE_DIR, "KidneyCare-AI-v3-Latest.apk"))
shutil.copyfile(os.path.join(STATIC_DIR, "KidneyCare-Caregiver.apk"), os.path.join(BASE_DIR, "KidneyCare-Caregiver.apk"))
shutil.copyfile(os.path.join(STATIC_DIR, "KidneyCare-Clinician.apk"), os.path.join(BASE_DIR, "KidneyCare-Clinician.apk"))
shutil.copyfile(os.path.join(STATIC_DIR, "KidneyCare-Nutrition.apk"), os.path.join(BASE_DIR, "KidneyCare-Nutrition.apk"))
print("\nAll APKs built, signed, and mirrored to root successfully!")
