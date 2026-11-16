# 甜慕 Tián Mù — Novel Library

The site's code and its content live in separate files. GitHub is the only backend.

```
index.html                     ← design + code only (no novel text inside)
content/
  site.json                    ← site title, hero text, About page, admin password hash
  novels/
    index.json                 ← which novels appear, in what order
    the-softest-kind-of-love.json
    midnight-garden.json
    …                          ← one file per novel: info, translations, all chapters
```

Readers load `content/*.json` from your GitHub Pages site. When you edit in the admin panel, it commits the changed files straight to this repo, much like Supabase did, but GitHub keeps the full history.

Other files in the repo:

- `google406eb474f9a235a5.html` is Google Search Console's ownership check. **Keep it**; deleting it un-verifies the site.
- `robots.txt` and `sitemap.xml` are for search engines. To refresh them: Admin → Password → **Publish both to GitHub**.

## One-time setup

1. **Create a repo** on GitHub (public, so the free GitHub Pages plan works), e.g. `tianmu`.
2. **Upload everything in this folder**, keeping the `content/` folder structure.
3. **Turn on Pages:** repo → *Settings → Pages →* Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
   Your site goes live at `https://<username>.github.io/tianmu/` in about a minute.
4. **Make a token for the admin panel:** GitHub → your avatar → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
   - Repository access: **Only select repositories →** your site repo
   - Permissions → Repository permissions → **Contents: Read and write**
   - Set an expiry you're comfortable with. You'll need a new token when it runs out.
5. **Connect:** open your live site, click the logo **5 times**, log in, then go to **Password → GitHub**. Fill in your username, repo and branch, paste the token, and click **Save & Test Connection**.

The token is saved only in that browser, never in the repo. Do step 5 once on each device you edit from.

## Day to day

- Edit anything in the admin panel. Each save is committed to GitHub automatically, with quick edits grouped into one commit. The pill in the admin top bar shows the status:
  - 🟢 **Published to GitHub**: done. Readers see the change in about a minute.
  - 🟡 **Unpublished changes / Publishing…**: in progress (click it to publish right away).
  - 🟠 **Saved on this device only**: GitHub isn't connected in this browser yet.
  - 🔴 **Publish failed**: hover over it for the reason. Your edits are kept in the browser, and clicking the pill retries.
- You can also edit the JSON files directly on GitHub. Chapter text is HTML inside `"content"`.
- **Export Data (JSON)** still makes a full backup, and **Import** restores one (and publishes it).

## Main chapters and side stories

Each chapter has a **type** (Admin → chapter editor → Chapter type). Use **Chapter** for the main story and **Side Story** for self-contained chapters that can be read on their own. Readers see side stories as dashed cards with an S number, can filter All / Main Story / Side Stories, and main chapters keep their own numbering.

## Hearts & comments

These are saved **only in each reader's own browser**. Readers keep their hearts and see their own comments, but nothing is shared online or with other readers. The admin Comments tab shows only the comments written in that browser.

## Good to know

- Everything in `content/` is public, the same as before: draft or "idea" novels and scheduled chapters can be read by anyone who opens the JSON files. Real write protection comes from the GitHub token. The admin password only hides the panel.
- The page must be served (GitHub Pages, or `python3 -m http.server` locally). Opening `index.html` by double-clicking it can't load the `content/` files.
- Each publish triggers a GitHub Pages rebuild, which usually takes 30–60 seconds.
