#!/bin/sh
# Builds index.html, the whole game in one self-contained page: the head (markup and styles), then every script.
set -e
cd "$(dirname "$0")"
{ cat src/head.html; echo "<script>"
  cat src/lib.js src/audio-data.js src/rng.js src/fov.js src/turn.js src/gen.js src/data.js src/bestiary.js src/items.js src/shops.js src/chars.js src/spells.js src/save.js \
      src/sprites.js src/game.js src/render.js src/ui.js
  echo "</script>"; echo "</body></html>"; } > index.html
echo "Built index.html"
