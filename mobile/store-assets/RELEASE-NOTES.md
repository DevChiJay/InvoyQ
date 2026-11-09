# Invoyq 1.2.0 — Release Notes

Written for: store listing readers (App Store "What's New" / Google Play "What's new") and your own release page.

---

## App Store / Play Store — What's New (short, under 500 characters)

```
• Extract with AI: paste a chat message or pick a screenshot and Invoyq fills in your invoice for you
• Sign in with Google in one tap
• New dashboard usage card shows what's left on your plan this month
• Monthly stats now include a status breakdown and 6-month trend charts
• Redesigned screens with a proper dark mode and better readability
• Many fixes and polish
```

---

## Full release notes

### What's new

**Extract with AI (invoice creation)**
Turn a client's chat message into an invoice in seconds. On the New Invoice screen, tap **Extract with AI**, then paste the text or choose a screenshot. Invoyq reads it and pre-fills the items, due date, currency and notes. It also matches the client to one you already have, or offers to create them. Review everything before you save.

**Sign in with Google**
Google sign-in is back and now uses the native account picker, so it opens inside the app and returns you straight to your dashboard. Available on the login and register screens.

**Plan usage on your dashboard**
A new usage card shows how many invoices and AI extractions you have used this month and when your allowance resets. If you reach a limit, you now get a clear message instead of an error.

**Better monthly statistics**
- Invoice status breakdown (paid, pending, overdue)
- 6-month trend chart and daily chart
- Month-over-month change at a glance
- Pull down to refresh the dashboard and stats

### Improvements

- **Refreshed look:** cleaner login and register screens, and a rebuilt tab bar that no longer covers your content.
- **Real dark mode:** the status bar, forms, cards and auth screens now follow your device's light or dark setting and are easy to read in both.
- **Easier to read and tap:** stronger text contrast, larger tap targets, and layouts that hold up at large text sizes.
- **Smoother forms:** fields move out of the keyboard's way, keyboard "next" and "done" keys work, and password autofill is supported.
- **Lists stay put while you search:** the search box no longer disappears as you type.
- **Currency formatting:** product prices now show in your currency format (for example ₦15,500.00).
- **Expenses filter:** now covers all categories available when adding an expense.

### Fixes

- Form validation errors now appear under the field instead of failing silently.
- Fixed a crash when opening Stats.
- Stats cards no longer stop short of the screen edge.
- Fixed a case where you could be left on a screen with no back button.
- The dashboard title no longer vanishes on load.
- The date picker now stays open until you tap Done.
- Empty states now show their message and action button.

---

## Notes for you (not for publishing)

- Version `1.2.0` contains new native code (Google Sign-In), so it needs a **new store build**; it cannot ship as an over-the-air update to 1.1.x (`runtimeVersion` follows the app version).
- Free plan limits referenced above: 100 invoices and 10 AI extractions per calendar month (UTC). Remove or reword the usage card line if you would rather not advertise the limits.
- Not exercised on Android during the UI audit. Check the Play Store notes against an Android build before publishing.
- "Resend email" on the verification screen is still a TODO and is deliberately not mentioned.
