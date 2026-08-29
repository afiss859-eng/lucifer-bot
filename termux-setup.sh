#!/data/data/com.termux/files/usr/bin/bash
set -e

command -v node >/dev/null 2>&1 || { echo 'Installe Node.js: pkg install nodejs'; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'Installe npm avec Node.js'; exit 1; }

[ -f .env ] || cp .env.example .env

set_env() {
  key="$1"
  value="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s#^${key}=.*#${key}=${value}#" .env
  else
    printf '\n%s=%s\n' "$key" "$value" >> .env
  fi
}

read -r -p 'Numéro WhatsApp du bot (ex: 226XXXXXXXX): ' PHONE
PHONE=$(printf '%s' "$PHONE" | tr -cd '0-9')
[ -n "$PHONE" ] || { echo 'Numéro invalide.'; exit 1; }

read -r -p 'Clé AI Model API (laisser vide pour configurer plus tard): ' AIMODEL_KEY
read -r -p 'Clé Groq (laisser vide pour configurer plus tard): ' GROQ_KEY

set_env OWNER_NUMBER "$PHONE"
set_env PHONE_NUMBER "$PHONE"
set_env ADMIN_PASSWORD "7217"
set_env PANEL_PASSWORD "7217"
set_env HNSEC_ENABLED "false"

if command -v openssl >/dev/null 2>&1; then
  TOKEN=$(openssl rand -hex 32)
else
  TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
fi
set_env INTERNAL_TOKEN "$TOKEN"

[ -n "$AIMODEL_KEY" ] && set_env AIMODEL_API_KEY "$AIMODEL_KEY"
[ -n "$GROQ_KEY" ] && set_env GROQ_API_KEY "$GROQ_KEY"

npm install

echo
echo 'Configuration Termux terminée.'
echo 'Lance le bot avec: npm start'
echo 'Ne partage jamais le fichier .env.'
