# Anime Atlas

A simple, single-page anime website that highlights fun facts, story beats, and iconic milestones.

## Open locally

Open `index.html` in a browser.

## Customize

- Update content in `index.html`
- Adjust colors and layout in `styles.css`
- Add or edit random facts in `script.js`

## Episode notifications (Brevo)

This project includes a scheduled notifier that emails subscribers when a new
episode releases (based on AniList airing data).

### Set subscribers

Edit `data/subscribers.json` and add the emails to notify.

### Configure secrets

Add these GitHub Actions secrets:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

### Run locally

```powershell
npm run notify
```

Note: Formspree collects emails but does not automatically sync to Brevo. If you
want automation, we can wire a backend to sync Formspree submissions.
