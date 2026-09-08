# Tarot artwork sources

## Card faces

The 78 downloaded JPEG files are the high-resolution, consistent **Pam-A Rider–Waite–Smith** scan set uploaded to Wikimedia Commons by TaionWC. The Commons collection explicitly contains 78 files in the same style. Source descriptions date the historical cards to 1910 and credit Pamela Colman Smith; the source listed on the file pages is muzendo.jp/blog.

- Collection: https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC)
- Representative major card, source and reuse statement: https://commons.wikimedia.org/wiki/File:RWS_Tarot_00_Fool.jpg
- Representative minor card, source and reuse statement: https://commons.wikimedia.org/wiki/File:Cups01.jpg
- Public Domain Mark explanation: https://creativecommons.org/publicdomain/mark/1.0/
- Every card's exact source page, direct source image URL, local filename, dimensions and checksum appear in `card-mapping.json`.

**Reuse evidence:** The selected Commons file pages carry Public Domain Mark 1.0. They identify the work as public domain in the United States because of its early publication, and in its country of origin and countries with applicable life-plus-80-or-fewer terms, based on their stated copyright history. This package uses the historical Pam-A scans identified by Commons, rather than a contemporary commercial recoloring. Attribute the original illustrations to Pamela Colman Smith and the deck to Arthur Edward Waite / Rider–Waite–Smith when displaying artwork credits. Commons does not impose an attribution requirement on files marked public domain, but retaining source provenance is useful.

Downloaded and checked on 2026-09-08. The files retain complete borders and labels. No retouching, cropping or watermarks were added. Original downloads were available for 30 cards, about 1100 × 1920 px each. Wikimedia returned HTTP 429 for other original files and specifically recommended standard thumbnail sizes; those remaining cards use its standard 500 px-wide JPEG renditions from the same scans. The manifest records each actual download URL and pixel dimensions. Every face exceeds the requested 300 px minimum width.

## Original card back

`card-back.png` is an original 1024 × 1536 image generated once with the built-in imagegen tool for this project. There were no variants or retries. Its final generation prompt is recorded verbatim in `card-back-prompt.txt`.

Visual inspection confirmed a flat, portrait, edge-to-edge aubergine card back, antique-gold celestial engraving and corner ornament, a central eight-point star, symmetrical moon motifs and muted teal gemstone accents. There is no text or watermark.

## Integration

- `faces/major-00.jpg` through `faces/major-21.jpg`: 22 major arcana, Rider–Waite–Smith order, Strength VIII and Justice XI.
- `faces/wands-01.jpg` through `faces/wands-14.jpg`: wands.
- `faces/cups-01.jpg` through `faces/cups-14.jpg`: cups.
- `faces/swords-01.jpg` through `faces/swords-14.jpg`: swords.
- `faces/pentacles-01.jpg` through `faces/pentacles-14.jpg`: pentacles.
- In each minor suit, 01=Ace, 02–10=numerical rank, 11=Page, 12=Knight, 13=Queen, 14=King.
- `name-to-file.json` is the simple English-card-name-to-relative-file mapping. `card-mapping.json` includes stable IDs, English and Chinese names, suit, rank, provenance and file metadata.
- The historical faces have an aspect ratio around 0.58; the generated back is 2:3. Preserve complete face artwork with `object-fit: contain` if a common card frame uses a different ratio.
