# Android Kiosk APK — Build Guide

Company-branded Android app for the Visitor Kiosk. The APK contains the kiosk UI; your **VMS server** must run on the office network.

## Architecture

```
Android tablet (APK)  →  Wi-Fi  →  VMS server (http://SERVER_IP:5000)
```

- Package name: `com.vms.visitor.kiosk`
- Admin dashboard is **hidden** in the kiosk APK
- Camera, fullscreen, and boot auto-start are enabled

---

## Before you build

### 1. Set your server IP

Edit `public/kiosk-config.json` **before** building:

```json
{
  "apiBaseUrl": "http://192.168.1.50:5000/api",
  "kioskOnly": true
}
```

Replace `192.168.1.50` with your VMS server PC’s LAN IP (`ipconfig` on Windows).

### 2. Run the VMS server (production)

On the server PC:

- `USE_MEMORY_DB=false`
- MongoDB installed as a service
- Backend running on port `5000`
- In `backend/.env`, add the server IP to `FRONTEND_URL` if needed

### 3. Install tools

- [Node.js 18+](https://nodejs.org/)
- [Android Studio](https://developer.android.com/studio) (includes JDK & Android SDK)

---

## Build steps

Open PowerShell in `vms-main/frontend`:

```powershell
# 1. Install dependencies (first time only)
npm install

# 2. Edit public/kiosk-config.json with your server IP

# 3. Build web app + copy into Android project
npm run cap:sync

# 4. Open in Android Studio
npm run cap:open
```

In **Android Studio**:

1. Wait for Gradle sync to finish
2. Connect the kiosk tablet via USB (enable **Developer options** → **USB debugging**)
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

For release/production signing:

1. **Build → Generate Signed Bundle / APK**
2. Create or use your company keystore
3. Choose **APK** or **Android App Bundle**

---

## Install on kiosk tablet

1. Copy `app-debug.apk` (or signed release APK) to the tablet
2. Install (allow “Install unknown apps” if sideloading)
3. Open **Visitor Kiosk** once and allow **Camera** permission
4. Ensure tablet and server are on the **same Wi‑Fi**

### Auto-start on boot

The app registers a boot receiver. On some Android versions you may also need to:

- Disable battery optimization for **Visitor Kiosk**
- Set **Visitor Kiosk** as the default launcher (Settings → Apps → Default apps → Home app) for a locked kiosk experience

---

## Change company package name (optional)

Edit `capacitor.config.json`:

```json
{
  "appId": "com.yourcompany.visitor.kiosk",
  "appName": "Your Company Visitor Kiosk"
}
```

Then re-sync (may require removing `android/` and running `npx cap add android` again if package path changes).

---

## After UI changes

Whenever you change the React app:

```powershell
npm run cap:sync
```

Then rebuild in Android Studio.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Blank screen / API errors | Check `kiosk-config.json` server IP; ping server from tablet |
| Camera not working | Grant camera permission in Android Settings → Apps |
| Video not loading | Upload video in admin on server; check server is running |
| Boot does not auto-start | Disable battery optimization; set as default home app |
| CORS errors | Ensure server `FRONTEND_URL` includes LAN IP; restart backend |

---

## Admin access

Use a **PC browser** on the network (not the kiosk APK):

`http://SERVER_IP:5000/admin/login`

Or run the web app without `kioskOnly` for staff machines.
