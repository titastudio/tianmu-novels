# 甜慕 Tián Mù — Novel Library

The site's code and its content live in separate files. There is no backend and no token: the page simply reads the JSON files.

```
index.html                     ← design + code only (no novel text inside)
content/
  site.json                    ← site title, hero text, About page, admin password hash
  novels/
    index.json                 ← which novels appear, in what order
    the-softest-kind-of-love.json
    midnight-garden.json
    …                          ← one file per novel: info, front matter, all chapters
```

Other files in the repo:

- `google406eb474f9a235a5.html` is Google Search Console's ownership check. **Keep it.**
- `robots.txt` and `sitemap.xml` are for search engines. The admin download includes fresh copies.
- `.nojekyll` tells GitHub Pages to serve every file as-is. Keep it.

## Setup (once)

1. Upload everything in this folder to your GitHub repo, keeping the `content/` folder structure.
2. Repo → *Settings → Pages →* Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.

The site goes live at `https://<username>.github.io/<repo>/` in about a minute.

## Updating content

**Option A — edit the files directly.** Open a file in `content/` on GitHub, edit, and commit. Chapter text is HTML inside `"content"`.

**Option B — use the admin panel.** Click the logo **5 times** and log in. Edit anything. Your edits stay in that browser until you publish them:

1. Click **Download content files** (in the Password tab, or the status pill at the top).
2. Unzip it. On GitHub: *Add file → Upload files*, drag in the `content` folder (plus `sitemap.xml` and `robots.txt`), and commit.

The site updates in about a minute. If you close the tab before downloading, the edits are gone (the browser warns you first).

## Main chapters and side stories

Each chapter has a **type** (chapter editor → Chapter type). Use **Chapter** for the main story and **Side Story** for self-contained chapters that can be read on their own. Readers see side stories as dashed cards with an S number, can filter All / Main Story / Side Stories, and main chapters keep their own numbering.

## Hearts & comments

These are saved **only in each reader's own browser**. Nothing is shared online.

## Good to know

- Everything in `content/` is public, including draft or idea novels. The admin password only hides the editing panel; it doesn't protect the files.
- The page must be served (GitHub Pages, or `python3 -m http.server` locally). Opening `index.html` by double-clicking can't load the `content/` files.
