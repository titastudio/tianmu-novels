# 甜慕 Tián Mù — Novel Library

The site's code and its content live in separate files. There is no backend and no token: the page simply reads the JSON files.

```
index.html                     ← design + code only (no novel text inside)
content/
  site.json                    ← site title, hero text, About page, admin password hash
  novels/
    index.json                 ← which novels appear, in what order
    two-hundred-miles-an-hour.json
    the-softest-kind-of-love.json
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

## Site address, links and search engines

Live site: **https://titastudio.github.io/tianmu-novels/** (repo: `titastudio/tianmu-novels`).

- Every novel and chapter has its own shareable link, e.g. `…/tianmu-novels/?novel=song-of-clouds` and `…/tianmu-novels/?novel=song-of-clouds&ch=41`. Old `#novel-…` links still work.
- `sitemap.xml` lists the home page, every live novel and every published chapter, all on the address above. **Download content files** in the admin panel always rebuilds it with the right address, even from a preview copy. Upload it to the top of the repo next to `index.html`.
- Submit `https://titastudio.github.io/tianmu-novels/sitemap.xml` in Google Search Console (add the site as a URL-prefix property for `https://titastudio.github.io/tianmu-novels/`).
- `robots.txt` is included and correct, but search engines only read robots.txt from the root of the domain (`https://titastudio.github.io/robots.txt`), which belongs to a separate repo named `titastudio.github.io`. If you ever make that repo, copy this robots.txt into it. Until then nothing is blocked, so the site is still crawled normally.

## Volumes (optional)

A chapter can have a **volume** (chapter editor → Volume), written like `Volume One: The Glimpse`. When chapters have volumes, the chapter list shows a heading each time the volume changes, the chapter menu is grouped by volume, and the reader shows "Volume One · Chapter 3" above the title. New chapters added in the admin copy the volume of the last chapter, so you only change it when a new volume starts. Leave it empty for novels without volumes.

## Reading history ("Continue reading")

Saved **only in each reader's own browser** (key `tm_reads_v1`), one entry per story.

- A chapter only counts as read after real reading: the chapter is open, the tab is visible, the reader has been active in the last minute, and has spent at least 20 seconds on it and scrolled at least 15% (or 8 seconds and 60% for fast readers). Quick clicks, previews and peeks are ignored.
- Each story's page shows its own card: *Continue where you left off* (with % read), or *Up next* once a chapter is finished. A story the reader has never read shows nothing.
- Library cards show "Reading Ch. N · 2 days ago" for stories in progress, and the home page offers the story read most recently.

## Idea novels

Novels with status **Idea** have no chapters yet but can be opened (the card says *Tap to preview*) to read their Synopsis, Characters, Author Note and Content Warning. They are left out of the sitemap until they go live.

## Hearts & comments

These are saved **only in each reader's own browser**. Nothing is shared online.

## Good to know

- Everything in `content/` is public, including draft or idea novels. The admin password only hides the editing panel; it doesn't protect the files.
- The page must be served (GitHub Pages, or `python3 -m http.server` locally). Opening `index.html` by double-clicking can't load the `content/` files.
