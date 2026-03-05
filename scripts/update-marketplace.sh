#!/bin/bash
# update-marketplace.sh - Gestione versioning del Plugin Marketplace
# Usage:
#   ./scripts/update-marketplace.sh bump <plugin-name> [message]  - Bumpa versione plugin + marketplace
#   ./scripts/update-marketplace.sh bump-all [message]            - Bumpa tutti i plugin + marketplace
#   ./scripts/update-marketplace.sh marketplace [message]         - Bumpa solo versione marketplace
#   ./scripts/update-marketplace.sh status                        - Mostra versioni correnti
#   ./scripts/update-marketplace.sh add <plugin-name>             - Aggiunge nuovo plugin al marketplace.json

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MARKETPLACE_JSON="$REPO_ROOT/.claude-plugin/marketplace.json"
PLUGINS_DIR="$REPO_ROOT/plugins"
CHANGELOG="$REPO_ROOT/CHANGELOG.md"
AUTHOR="Maximilian Giurastante <info@maxymizebusiness.com>"

# Incrementa ultima cifra della versione (1.0.xx -> 1.0.xx+1)
bump_version() {
  local version="$1"
  local prefix="${version%.*}"
  local patch="${version##*.}"
  # Rimuovi zeri iniziali per l'aritmetica, poi riformatta
  local new_patch=$((10#$patch + 1))
  # Mantieni il formato a 2 cifre se era a 2 cifre
  if [[ ${#patch} -ge 2 && $new_patch -lt 100 ]]; then
    printf "%s.%02d" "$prefix" "$new_patch"
  else
    printf "%s.%s" "$prefix" "$new_patch"
  fi
}

# Legge versione corrente dal marketplace.json metadata
get_marketplace_version() {
  python3 -c "import json; print(json.load(open('$MARKETPLACE_JSON'))['metadata']['version'])"
}

# Legge versione di un plugin dal suo plugin.json
get_plugin_version() {
  local plugin="$1"
  local pjson="$PLUGINS_DIR/$plugin/.claude-plugin/plugin.json"
  if [[ ! -f "$pjson" ]]; then
    echo "ERRORE: plugin '$plugin' non trovato in $PLUGINS_DIR/" >&2
    return 1
  fi
  python3 -c "import json; print(json.load(open('$pjson'))['version'])"
}

# Aggiorna versione in plugin.json e marketplace.json per un plugin
bump_plugin() {
  local plugin="$1"
  local pjson="$PLUGINS_DIR/$plugin/.claude-plugin/plugin.json"

  if [[ ! -f "$pjson" ]]; then
    echo "ERRORE: plugin '$plugin' non trovato" >&2
    return 1
  fi

  local old_ver
  old_ver=$(get_plugin_version "$plugin")
  local new_ver
  new_ver=$(bump_version "$old_ver")

  # Aggiorna plugin.json
  python3 -c "
import json
with open('$pjson', 'r') as f:
    data = json.load(f)
data['version'] = '$new_ver'
with open('$pjson', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  # Aggiorna versione nel marketplace.json
  python3 -c "
import json
with open('$MARKETPLACE_JSON', 'r') as f:
    data = json.load(f)
for p in data['plugins']:
    if p['name'] == '$plugin':
        p['version'] = '$new_ver'
        break
with open('$MARKETPLACE_JSON', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  echo "  $plugin: $old_ver -> $new_ver"
}

# Bumpa la versione del marketplace (metadata)
bump_marketplace_version() {
  local old_ver
  old_ver=$(get_marketplace_version)
  local new_ver
  new_ver=$(bump_version "$old_ver")

  python3 -c "
import json
with open('$MARKETPLACE_JSON', 'r') as f:
    data = json.load(f)
data['metadata']['version'] = '$new_ver'
with open('$MARKETPLACE_JSON', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  echo "Marketplace: $old_ver -> $new_ver"
  echo "$new_ver"
}

# Aggiunge entry al CHANGELOG.md
add_changelog_entry() {
  local version="$1"
  local message="$2"
  local date
  date=$(date +%Y-%m-%d)

  local entry="## v${version} - ${date}\n\n${message}\n"

  if [[ -f "$CHANGELOG" ]]; then
    # Inserisci dopo la prima riga "# Changelog"
    python3 -c "
content = open('$CHANGELOG').read()
header = '# Changelog\n'
entry = '\n## v${version} - ${date}\n\n${message}\n'
if content.startswith(header):
    content = header + entry + content[len(header):]
else:
    content = header + entry + '\n' + content
open('$CHANGELOG', 'w').write(content)
"
  else
    printf "# Changelog\n\n%b\n" "$entry" > "$CHANGELOG"
  fi
}

# Mostra stato versioni
show_status() {
  echo "=== Marketplace v$(get_marketplace_version) ==="
  echo ""
  for dir in "$PLUGINS_DIR"/*/; do
    local name
    name=$(basename "$dir")
    local ver
    ver=$(get_plugin_version "$name" 2>/dev/null || echo "N/A")
    printf "  %-35s v%s\n" "$name" "$ver"
  done
}

# Aggiunge un nuovo plugin al marketplace.json
add_plugin_to_marketplace() {
  local plugin="$1"
  local pjson="$PLUGINS_DIR/$plugin/.claude-plugin/plugin.json"

  if [[ ! -f "$pjson" ]]; then
    echo "ERRORE: $pjson non trovato. Crea prima la struttura del plugin." >&2
    return 1
  fi

  python3 -c "
import json

with open('$pjson') as f:
    plugin_data = json.load(f)

with open('$MARKETPLACE_JSON') as f:
    marketplace = json.load(f)

# Controlla se esiste già
for p in marketplace['plugins']:
    if p['name'] == '$plugin':
        print('Plugin $plugin già presente nel marketplace.json')
        exit(0)

entry = {
    'name': plugin_data['name'],
    'source': './plugins/$plugin',
    'description': plugin_data.get('description', ''),
    'version': plugin_data.get('version', '1.0.0'),
    'author': {'name': plugin_data.get('author', {}).get('name', 'MAXYM')},
    'keywords': plugin_data.get('keywords', [])
}

marketplace['plugins'].append(entry)
marketplace['plugins'].sort(key=lambda x: x['name'])

with open('$MARKETPLACE_JSON', 'w') as f:
    json.dump(marketplace, f, indent=2)
    f.write('\n')

print('Plugin $plugin aggiunto al marketplace.json')
"
}

# --- MAIN ---
case "${1:-}" in
  bump)
    plugin="${2:?Specifica il nome del plugin. Es: ./scripts/update-marketplace.sh bump coolify-code-exec}"
    message="${3:-Aggiornato plugin $plugin}"

    echo "Bumping plugin..."
    bump_plugin "$plugin"

    echo ""
    echo "Bumping marketplace..."
    new_ver=$(bump_marketplace_version)

    add_changelog_entry "$new_ver" "### Update\n- $message"

    echo ""
    echo "Commit e push? (y/n)"
    read -r answer
    if [[ "$answer" == "y" ]]; then
      cd "$REPO_ROOT"
      git add -A
      git commit --author="$AUTHOR" -m "$(cat <<EOF
v${new_ver} update: $message

Author: Maximilian Giurastante info@maxymizebusiness.com
EOF
)"
      git push origin main
      echo "Pushato v${new_ver}"
    else
      echo "File aggiornati. Commit manuale necessario."
    fi
    ;;

  bump-all)
    message="${2:-Aggiornamento globale di tutti i plugin}"

    echo "Bumping tutti i plugin..."
    for dir in "$PLUGINS_DIR"/*/; do
      name=$(basename "$dir")
      bump_plugin "$name"
    done

    echo ""
    echo "Bumping marketplace..."
    new_ver=$(bump_marketplace_version)

    add_changelog_entry "$new_ver" "### Update\n- $message"

    echo ""
    echo "Commit e push? (y/n)"
    read -r answer
    if [[ "$answer" == "y" ]]; then
      cd "$REPO_ROOT"
      git add -A
      git commit --author="$AUTHOR" -m "$(cat <<EOF
v${new_ver} update: $message

Author: Maximilian Giurastante info@maxymizebusiness.com
EOF
)"
      git push origin main
      echo "Pushato v${new_ver}"
    else
      echo "File aggiornati. Commit manuale necessario."
    fi
    ;;

  marketplace)
    message="${2:-Aggiornamento marketplace}"

    echo "Bumping marketplace..."
    new_ver=$(bump_marketplace_version)

    add_changelog_entry "$new_ver" "### Update\n- $message"

    echo ""
    echo "Commit e push? (y/n)"
    read -r answer
    if [[ "$answer" == "y" ]]; then
      cd "$REPO_ROOT"
      git add -A
      git commit --author="$AUTHOR" -m "$(cat <<EOF
v${new_ver} update: $message

Author: Maximilian Giurastante info@maxymizebusiness.com
EOF
)"
      git push origin main
      echo "Pushato v${new_ver}"
    else
      echo "File aggiornati. Commit manuale necessario."
    fi
    ;;

  add)
    plugin="${2:?Specifica il nome del plugin. Es: ./scripts/update-marketplace.sh add nuovo-plugin}"
    add_plugin_to_marketplace "$plugin"

    echo ""
    echo "Bumping marketplace..."
    new_ver=$(bump_marketplace_version)

    add_changelog_entry "$new_ver" "### New Plugin\n- Aggiunto plugin $plugin al marketplace"

    echo ""
    echo "Commit e push? (y/n)"
    read -r answer
    if [[ "$answer" == "y" ]]; then
      cd "$REPO_ROOT"
      git add -A
      git commit --author="$AUTHOR" -m "$(cat <<EOF
v${new_ver} feat: aggiunto plugin $plugin

Author: Maximilian Giurastante info@maxymizebusiness.com
EOF
)"
      git push origin main
      echo "Pushato v${new_ver}"
    else
      echo "File aggiornati. Commit manuale necessario."
    fi
    ;;

  status)
    show_status
    ;;

  *)
    echo "Usage:"
    echo "  $0 bump <plugin-name> [message]  - Bumpa versione plugin + marketplace"
    echo "  $0 bump-all [message]             - Bumpa tutti i plugin + marketplace"
    echo "  $0 marketplace [message]          - Bumpa solo versione marketplace"
    echo "  $0 status                         - Mostra versioni correnti"
    echo "  $0 add <plugin-name>              - Aggiunge plugin al marketplace.json"
    ;;
esac
