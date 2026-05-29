#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 — Script d'installation automatique  ║
# ║  Usage: bash install.sh                                  ║
# ╚══════════════════════════════════════════════════════════╝
set -e

RED='\033[0;31m'; GOLD='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

banner() {
  echo -e "${RED}"
  echo "  ╔════════════════════════════════════════╗"
  echo "  ║   𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 — Installation      ║"
  echo "  ╚════════════════════════════════════════╝"
  echo -e "${NC}"
}

step() { echo -e "${GOLD}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

banner
step "Détection du système..."
IS_TERMUX=false
if [ -d "/data/data/com.termux" ]; then IS_TERMUX=true; echo "  → Termux (Android)"; else echo "  → Linux/VPS"; fi

# ── Mise à jour ──────────────────────────────────────────────────────────────
step "Mise à jour des paquets..."
if $IS_TERMUX; then pkg update -y && pkg upgrade -y 2>/dev/null || true
else sudo apt update -qq 2>/dev/null || true; fi
ok "Paquets à jour"

# ── Node.js ──────────────────────────────────────────────────────────────────
step "Vérification Node.js..."
if ! command -v node &>/dev/null; then
  step "Installation Node.js..."
  if $IS_TERMUX; then pkg install nodejs -y
  else curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs; fi
fi
NODE_VER=$(node -v)
ok "Node.js $NODE_VER"

# ── Git ───────────────────────────────────────────────────────────────────────
step "Vérification Git..."
if ! command -v git &>/dev/null; then
  if $IS_TERMUX; then pkg install git -y; else sudo apt install -y git; fi
fi
ok "Git disponible"

# ── PM2 (keep-alive) ─────────────────────────────────────────────────────────
step "Installation PM2 (keep-alive)..."
npm install -g pm2 --quiet
ok "PM2 installé"

# ── Clonage du bot ────────────────────────────────────────────────────────────
if [ ! -d "lucifer-bot" ]; then
  step "Clonage du bot..."
  git clone https://github.com/afiss859-eng/lucifer-bot.git
  ok "Bot cloné"
else
  step "Mise à jour du bot..."
  cd lucifer-bot && git pull origin main && cd ..
  ok "Bot mis à jour"
fi

cd lucifer-bot

# ── Dépendances ───────────────────────────────────────────────────────────────
step "Installation des dépendances (peut prendre 2-3 min)..."
npm install --quiet
ok "Dépendances installées"

# ── Dossier logs ─────────────────────────────────────────────────────────────
mkdir -p logs

# ── Configuration .env ───────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  step "Configuration initiale..."
  cp .env.example .env

  echo ""
  echo -e "${GOLD}═══════════════════════════════════════════${NC}"
  echo -e "${GOLD}  Configuration du bot${NC}"
  echo -e "${GOLD}═══════════════════════════════════════════${NC}"

  read -p "  Votre numéro WhatsApp (ex: 584265781353): " OWNER_NUM
  read -p "  Mot de passe admin panel (défaut: lucifer2024): " ADMIN_PASS
  ADMIN_PASS=${ADMIN_PASS:-lucifer2024}

  sed -i "s/OWNER_NUMBER=.*/OWNER_NUMBER=${OWNER_NUM}/" .env
  sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=${ADMIN_PASS}/" .env

  echo ""
  echo -e "${GOLD}  IA Groq (GRATUIT — recommandé)${NC}"
  echo -e "  Clé gratuite sur: https://console.groq.com/keys"
  read -p "  Votre clé GROQ_API_KEY (laissez vide pour passer): " GROQ_KEY
  if [ -n "$GROQ_KEY" ]; then sed -i "s/GROQ_API_KEY=.*/GROQ_API_KEY=${GROQ_KEY}/" .env; fi

  ok "Fichier .env configuré"
fi

# ── Démarrage avec PM2 ────────────────────────────────────────────────────────
step "Démarrage des services..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 restart ecosystem.config.js

step "Configuration démarrage automatique..."
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true
pm2 save

ok "Tous les services démarrés!"

echo ""
echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║${GOLD}   𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂 — Démarré avec succès!      ${RED}║${NC}"
echo -e "${RED}╠════════════════════════════════════════════════╣${NC}"
echo -e "${RED}║${NC}  🌐 Panel SaaS:    http://localhost:4000        ${RED}║${NC}"
echo -e "${RED}║${NC}  🔧 Dashboard bot: http://localhost:3000        ${RED}║${NC}"
echo -e "${RED}║${NC}  📱 Bot WhatsApp:  Scannez le QR sur le panel   ${RED}║${NC}"
echo -e "${RED}╠════════════════════════════════════════════════╣${NC}"
echo -e "${RED}║${NC}  📊 Statut: pm2 status                          ${RED}║${NC}"
echo -e "${RED}║${NC}  📝 Logs:   pm2 logs                            ${RED}║${NC}"
echo -e "${RED}║${NC}  🔄 Restart: pm2 restart all                   ${RED}║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GOLD}  📺 Canal officiel: https://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c${NC}"
echo ""
