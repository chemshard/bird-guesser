# Singapore Bird Guesser — Orange BioFigure-style static app

This is a zero-AI 20 Questions style bird guessing game.

## Files

- `index.html` — page structure
- `style.css` — orange BioFigure-inspired theme
- `script.js` — game logic
- `data.js` — bird database + question database loaded by the app
- `birds.json` — same data in JSON form, useful for editing/reference

## Run locally

Because the app uses separate JS files, run a tiny local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Host on GitHub Pages

Upload these files to your repo root:

```text
index.html
style.css
script.js
data.js
birds.json
README.md
```

Then enable GitHub Pages from Settings → Pages.

## Embed in Blogger

Use an iframe to your GitHub Pages URL:

```html
<iframe
  src="https://YOURUSERNAME.github.io/YOURREPO/"
  style="width:100%; height:1000px; border:0;"
  title="Singapore Bird Guesser">
</iframe>
```

## Add more birds

Edit `data.js`.

Each bird has:
- `name`
- `scientific`
- `mode`: `"common"` or `"all"`
- `group`
- `size`
- `main_colors`
- `habitats`
- `traits`
- `notes`

The app picks questions that split the remaining candidates most evenly.
