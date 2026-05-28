# 📖 Guide d'installation — 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯𓅂

## 🤖 Installation Rapide

### Option 1 — Android (Termux)

```bash
# 1. Installez Termux depuis F-Droid
# 2. Ouvrez Termux et exécutez:
pkg update && pkg upgrade -y
pkg install nodejs git -y
git clone https://github.com/afiss859-eng/lucifer-bot.git
cd lucifer-bot
npm install
cp .env.example .env
nano .env        # Éditez le fichier (mot de passe admin, clés IA...)
npm start
```

### Option 2 — VPS Linux (Ubuntu/Debian)

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git screen
git clone https://github.com/afiss859-eng/lucifer-bot.git
cd lucifer-bot
npm install
cp .env.example .env
nano .env
# Lancer en arrière-plan:
screen -S lucifer
npm start
# Ctrl+A puis D pour détacher le screen
```

---

## 🌐 Connexion au Bot (via Dashboard)

1. Démarrez le bot: `npm start`
2. Ouvrez votre navigateur: **http://localhost:3000** (ou l'IP de votre serveur)
3. Connectez-vous avec votre mot de passe admin (défaut: `lucifer2024`)
4. Choisissez votre méthode de connexion:

### 📷 Méthode 1 — QR Code
- Le QR s'affiche automatiquement dans le dashboard
- Scannez avec WhatsApp: **Paramètres → Appareils liés → Lier un appareil**

### 🔢 Méthode 2 — Code de liaison (recommandé pour VPS)
- Entrez votre numéro (avec indicatif, ex: 584265781353)
- Cliquez sur **"Générer le Code"**
- Un code 8 chiffres apparaît
- WhatsApp: **Paramètres → Appareils liés → Lier avec numéro de téléphone**
- Entrez le code

---

## 🤖 Configurer l'IA (GRATUIT)

### Option A — Groq (Llama3 — Recommandé)
1. Allez sur: https://console.groq.com/keys
2. Créez un compte gratuit
3. Générez une clé API
4. Ajoutez dans `.env`: `GROQ_API_KEY=votre_clé`
5. Redémarrez le bot

### Option B — Google Gemini
1. Allez sur: https://aistudio.google.com/apikey
2. Créez une clé gratuite
3. Ajoutez dans `.env`: `GEMINI_API_KEY=votre_clé`

Testez avec: `.ai Bonjour, comment ça va?`

---

## 👑 Gestion VIP (via dashboard ou WhatsApp)

### Via Dashboard Web
- Accédez à **http://localhost:3000**
- Section "VIP" → Ajoutez le numéro + @s.whatsapp.net
- Ex: `584265781353@s.whatsapp.net`

### Via WhatsApp (Owner uniquement)
```
.addvip @membre
.delvip @membre
.listvip
```

---

## 🎉 Activation Bienvenue/Au revoir (dans un groupe)

```
.setwelcome      → Active les messages de bienvenue
.setbye          → Active les messages d'au revoir
.welcomestyle 5  → Choisir le style n°5 (1-20)
.welcomelist     → Voir tous les styles disponibles
.testwelcome     → Tester maintenant
```

---

## 🛡️ Protection de groupe

```
.antilink        → Supprimer les liens automatiquement
.antispam        → Bloquer le spam
.antibadword     → Filtrer les mots vulgaires
.antivulgaire    → Bloquer les insultes
```

---

## 📺 Canal officiel

Suivez les mises à jour: https://whatsapp.com/channel/0029VbCK9wyCXC3JTDw6H51c

---

## ❓ Aide

- Toutes les commandes: `.menu`
- Commandes IA: `.aihelp`
- Commandes VIP: `.vprofile`
- Support: wa.me/584265781353
