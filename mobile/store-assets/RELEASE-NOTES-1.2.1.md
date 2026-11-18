# Invoyq 1.2.1 — Release Notes

Written for: store listing readers (App Store "What's New" / Google Play "What's new") and your own release page.

---

## App Store / Play Store — What's New (short, under 500 characters)

```
• New welcome screen walks you through sending your first invoice
• Product codes are filled in for you (PROD-0001, PROD-0002, ...). Keep them or type your own, and change them any time
• Add a product while creating an invoice and its code is filled in too
• App updates now install as soon as you open the app
• Small fixes and polish
```

---

## Full release notes

### What's new

**A welcome to get you started**
New accounts now see a short welcome screen. It shows three steps: create an invoice, let AI fill it in from a chat or screenshot, and send it to get paid. Tap **Create your first invoice** to go straight to the New Invoice screen, or **Maybe later** to look around first. It appears once, and only until you've created your first invoice.

**Automatic product codes**
You no longer have to come up with a code (SKU) for every product. New products get the next code in sequence, such as PROD-0001 and then PROD-0002, and codes are never reused. You can type your own code instead, or change it later when you edit the product. This also works when you add a product from the New Invoice screen.

**"How did you hear about Invoyq?"**
An optional question on the sign-up screen, and on the welcome screen if you signed up with Google. It helps us understand where new users find us, and you can skip it.

### Improvements

- **Faster updates:** when we publish an improvement, the app picks it up the next time you open it, instead of a launch later. It also checks when you come back after a while away, and never restarts while you're in the middle of something.
- **Clearer product errors:** if a product code is already taken, the app tells you so instead of showing a generic error.

---

## Notes for you (not for publishing)

- 1.2.1 has no native changes. It runs on the 1.2.0 runtime (`runtimeVersion: "1.2.0"`), so existing 1.2.0 users get all of this through `eas update` without updating from the store.
- Deploy the backend before the OTA and the store build. Automatic product codes and the platform-specific sign-up source depend on it.
- The faster updates only start working after a 1.2.0 user has received this release once. The first OTA still applies on their second launch.
- Sign-up tracking by iOS/Android is internal and deliberately not mentioned.
