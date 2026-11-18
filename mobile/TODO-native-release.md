# Next native release (1.3.0): to do

None of these can ship as an OTA. Each one changes the native build, so do them together in the next release that needs a new store build, then test a `preview` build on both platforms before submitting.

## 1. Reset the runtime version
- [ ] In `app.config.ts`, change `runtimeVersion: "1.2.0"` back to `{ policy: "appVersion" }` (or a new string). It was pinned only so one OTA reaches 1.2.0 and 1.2.1. Leaving the pin on a native change would send updates to builds that can't run them.

## 2. iOS: build with Xcode 27 / iOS 27 SDK (deadline April 2027)
App Store Connect warning ITMS-90725 on 1.2.1: built with the iOS 26.0 SDK. From April 2027, uploads must use the iOS 27 SDK (Xcode 27+). Builds already in the store keep working.
- [ ] In `eas.json`, add `"image": "latest"` (or a named Xcode 27 image) under `build.production.ios`, and under `preview` too.
- [ ] Confirm `plugins/withPodsDeploymentTarget` handles every pod (Xcode 27 rejects pod targets below iOS 15).

## 3. Android: turn on R8 (Play "DEX code optimization", obfuscation 1%)
- [ ] `npx expo install expo-build-properties` and add it to `plugins` with `android: { enableMinifyInReleaseBuilds: true, enableShrinkResourcesInReleaseBuilds: true }`.
- [ ] Release-build test of anything reached indirectly through reflection: Google sign-in, image picker, PDF print and share, date picker, secure storage. Add ProGuard rules where something breaks.
- [ ] Upload the R8 `mapping.txt` to Play so crash reports stay readable.

## 4. Android: mark hardware features optional (Play device-availability warning)
Play filters out devices without these features. Android adds both requirements on its own:
- `android.hardware.screen.portrait`: comes from `orientation: "portrait"`.
- `android.hardware.wifi`: comes from NetInfo's `ACCESS_WIFI_STATE` permission.
- [ ] Add a config plugin in `plugins/` that writes `<uses-feature android:name="android.hardware.screen.portrait" android:required="false" />` and the same for `android.hardware.wifi` into the manifest. Don't edit `android/` by hand; it is generated.
- [ ] Check the Play Console warning clears on the new bundle.
