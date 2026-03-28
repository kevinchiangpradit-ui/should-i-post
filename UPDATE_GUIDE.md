# Updating the Site (Deploy Guide)

This project is deployed with Vercel. To update the live site, redeploy the current folder.

---

## Deploy (quick)

Paste this into PowerShell to update the live site:

```powershell
cd "C:\Users\Acer\Documents\AI Random\should-i-post"
vercel --prod
```

---

## Deploy (with Git — recommended)

```powershell
cd "C:\Users\Acer\Documents\AI Random\should-i-post"
git add .
git commit -m "update"
git push
vercel --prod
```

- **Git** = backup + version history
- **Vercel** = actually updates the live site

---

## What to expect

- Deployment takes a few seconds
- Site updates immediately after
- May need a hard refresh: `Ctrl + Shift + R`

---

## Common issues

| Problem | Fix |
|---|---|
| Changes not showing | Hard refresh (`Ctrl + Shift + R`) |
| Wrong version live | Make sure you're in the correct folder |
| `vercel` not found | Install CLI: `npm i -g vercel` |
