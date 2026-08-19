# App Store submission checklist

Everything here has to happen on a Mac or in App Store Connect — none of it can
be done from CI or a Linux box.

## 1. Build

```bash
npm install          # picks up @capacitor/local-notifications
npx cap sync ios     # MUST be re-run on macOS — pod install is skipped on Linux
npx cap open ios     # then Product → Archive in Xcode
```

`cap sync` was already run once on Linux, so the config, web assets and plugin
registration are committed. The step that did **not** run is `pod install`,
because CocoaPods only exists on macOS. Without it the notifications plugin
will not link and the build fails.

## 2. Capabilities in Xcode

- **Push Notifications** is *not* required — reminders are local notifications,
  which need no capability and no APNs certificate.
- Confirm the bundle identifier reads `com.keeplearnin.keel`.
- Confirm the display name reads **Keel**.

## 3. Info.plist

The daily reminder asks for notification permission at the moment the user
enables it in Settings, so no usage-description string is required. If a future
feature adds camera or photo access, those *do* need `NSCameraUsageDescription`
and `NSPhotoLibraryUsageDescription`.

## 4. App Privacy labels — answer honestly

The app now stores health data. Under **App Privacy → Data Types**, declare:

| Data type | Linked to identity | Used for tracking | Purpose |
|---|---|---|---|
| Health & Fitness | Yes | **No** | App Functionality |
| Contact Info (email) | Yes | No | App Functionality |
| User Content (journal, notes) | Yes | No | App Functionality |
| Identifiers (user ID) | Yes | No | App Functionality |

Answer **No** to tracking across apps everywhere — the app has no analytics SDK
and no ad networks. Guideline 5.1.3 forbids using health data for advertising,
so never flip these to "tracking" without removing the health features first.

## 5. Reviewer access

The hidden review sign-in is reached with `?review=1` on the sign-in screen.
Put the email and password in **App Review Information → Sign-In Required**.

**Seed the demo account before submitting.** A reviewer who lands on an empty
tracker, an empty task list and an empty Markers tab will read the app as
non-functional. It needs, at minimum:

- ~2 weeks of habit logs so the heatmap, streaks and rolling adherence render
- a biomarker import so the Markers tab is populated
- a handful of tasks and one completed weekly review

## 6. Guideline 4.2 — minimum functionality

The binary loads a remote URL, which is the classic "thin wrapper" rejection
risk. Mitigations already in place:

- Native Haptics, Share and Status Bar integration
- Local notifications (a genuinely native capability)
- `server.errorPath` → `offline.html`, so no white screen without a connection

If review pushes back regardless, the fix is to bundle the front end into the
binary and keep only the API routes remote.

## 7. Pre-submit smoke test on a real device

- [ ] Launch in airplane mode → the branded offline screen appears, not a blank one
- [ ] Enable the daily reminder in Settings, set it a few minutes out, lock the
      phone → the notification fires
- [ ] Sign in with Apple works (required, since Google sign-in is offered)
- [ ] Delete-account flow completes (Settings → Delete account)
- [ ] App icon and name read as Keel on the home screen
