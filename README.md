# 甜慕 Tián Mù — Novel Library

The site's code and its content live in separate files. There is no backend and no token: the page simply reads the JSON files.

```
index.html                     ← design + code only (no novel text inside)
manifest.webmanifest, robots.txt, sitemap.xml, README.md, .nojekyll
assets/                        ← icons, the link-preview picture, and photos/ (the couples’ photos at full size, plus small thumbnails)
content/
  site.json                    ← site title, hero text, About page, admin password hash
  catalog.json                 ← every novel and chapter list, no chapter text (for a fast start)
  novels/
    index.json                 ← which novels appear, in what order
    thorns.json, 322.json, …   ← one file per novel: info, front matter, all chapters
play/
  thorns-phone.html, thorns-desktop.html, …   ← interactive pieces, one small page each
  engine.js, engine.css        ← shared by every piece
  img/                         ← the pieces' photos and wallpapers
```

Other files in the repo:

- `google406eb474f9a235a5.html` is Google Search Console's ownership check. **Keep it.**
- `robots.txt` and `sitemap.xml` are for search engines. The admin download includes fresh copies.
- `.nojekyll` tells GitHub Pages to serve every file as-is. Keep it.

## Setup (once)

1. Upload everything to your GitHub repo, keeping the four folders (`assets`, `content`, `play` and the files at the top).
2. Repo → *Settings → Pages →* Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.

The site goes live at `https://<username>.github.io/<repo>/` in about a minute.

## Updating content

**Option A — edit the files directly.** Open a file in `content/novels/` on GitHub, edit, and commit. Chapter text is HTML inside `"content"`. If you change titles, dates or chapters this way, also replace `content/catalog.json` (the admin download makes a fresh one), or the library will show the old list.

**Why it's fast:** the page draws the whole library from `content/catalog.json`, one small file (about 200 KB, 25 KB compressed: no chapter text, character pages, photos, chapter blurbs or epigraphs; those come with the book when it's opened), in well under a second, then loads chapter text when a book is opened. The book you were last reading is fetched quietly in the background, so Resume opens straight away. Each novel file is fetched with a version tag, so the browser keeps it and a refresh doesn't download it again.

**Option B — use the admin panel.** Click the logo **5 times** and log in. Edit anything. Your edits stay in that browser until you publish them:

1. Click **Download content files** (in the Password tab, or the status pill at the top).
2. Unzip it. On GitHub: *Add file → Upload files*, drag in the `content` folder (plus `sitemap.xml` and `robots.txt`), and commit.

The site updates in about a minute. If you close the tab before downloading, the edits are gone (the browser warns you first).

## Interactive pieces

Each finished book has two: a phone story and a computer story. Each is one small page in `play/` (`thorns-phone.html`, `thorns-desktop.html`, …). They share `play/engine.js` and `play/engine.css`, and their photos live in `play/img/`. Upload the whole `play` folder. The book's chapter list shows the right one for the reader's device.

**Tidying the old layout (once):** after uploading, delete the old `extras` folder, and these old files at the top of the repo: `favicon.svg`, `favicon-32.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` and `og-image.png` (they now live in `assets/`, and the favicon is inside index.html). To delete a folder, open it, click the **…** menu at the top right and choose *Delete directory*, then commit. Keep `google406eb474f9a235a5.html`.

## Couple photos in the chapters

The leads’ portraits show in each novel’s **Characters** tab: tap the round photo to see it full size. Inside the chapters, a small camera strip sits under the paragraph where a photo was taken; tapping it opens the photo at its real size (swipe or use the arrows when there are several).

- Portraits: a `Photo: assets/photos/people/name.jpg` line under the character’s name (or the **Photo** field in the admin character builder).
- Chapter photos: the `photoMoments` list in the novel’s file, e.g. `{ "ch": 4, "after": "Nine forty-one.", "photos": ["assets/photos/thorns/registry.jpg"], "caption": "The registry steps, 9:41", "when": "Tue 17 Mar 2020" }`. `ch` counts from 0, and `after` is a sentence from the paragraph the strip goes under. The chapter text itself is never changed.

## Main chapters and side stories

Each chapter has a **type** (chapter editor → Chapter type). Use **Chapter** for the main story and **Side Story** for self-contained chapters that can be read on their own. Readers see side stories as dashed cards with an S number, can filter All / Main Story / Side Stories, and main chapters keep their own numbering.

## Site address, links and search engines

Live site: **https://titastudio.github.io/tianmu-novels/** (repo: `titastudio/tianmu-novels`).

- Every novel and chapter has its own shareable link, e.g. `…/tianmu-novels/?novel=song-of-clouds` and `…/tianmu-novels/?novel=song-of-clouds&ch=41`.
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
- **Last line read:** the paragraph the reader reached is saved too. Opening that chapter again in any way (Resume, the chapter list, a saved link, a refresh), on a phone or a computer, puts them back on that paragraph. A small bar offers *From the top*.

## Read aloud

The 🔊 button next to A+ / A− reads the chapter aloud with the voice built into the reader's phone or computer (nothing is sent anywhere). It starts at the paragraph on screen, highlights each paragraph as it goes, carries on into the next chapter, and has Pause, speed (0.85× to 1.5×) and Stop. Browsers with no voice installed show a message instead.

## Next for you

At the end of the last chapter so far, readers see up to two books that share people with the one they've just read ("Ren Hao's own story"), books they've already finished left out. The links come from each book's Characters list and are worked out when the site is built (`related` in each novel file and the catalog). An ongoing book says *While you wait for the next chapter*. A book with no shared people suggests other stories.

## Idea novels

Novels with status **Idea** have no chapters yet but can be opened (the card says *Tap to preview*) to read their Synopsis, Characters, Author Note and Content Warning. They are left out of the sitemap until they go live.

## Hearts & comments

These are saved **only in each reader's own browser**. Nothing is shared online.

## Good to know

- Everything in `content/` is public, including draft or idea novels. The admin password only hides the editing panel; it doesn't protect the files.
- The page must be served (GitHub Pages, or `python3 -m http.server` locally). Opening `index.html` by double-clicking can't load the `content/` files.
