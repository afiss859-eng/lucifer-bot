# Déploiement de DOMA LUCIFERO

## Architecture nécessaire

- **Vercel** sert le tableau de bord web et transmet ses appels `/api/*` au serveur du bot.
- **Un serveur Node.js persistant** exécute `npm start`, maintient la connexion Baileys à WhatsApp et conserve les fichiers de session.
- Le site Vercel ne démarre pas lui-même le processus WhatsApp. Les fonctions Vercel sont utilisées ici comme passerelle HTTP, pas comme moteur permanent du bot.

## 1. Publier le tableau de bord sur Vercel

Le dossier `public/` à la racine contient la page d'accueil. Le dossier `api/` contient la passerelle. Le projet peut être importé avec le répertoire racine `/`, sans framework et sans commande de build particulière.

Après le déploiement, utilisez le domaine de production du projet, et non une URL de prévisualisation protégée.

## 2. Lancer le moteur WhatsApp sur un serveur persistant

Sur un serveur Linux qui reste actif :

```bash
git clone https://github.com/afiss859-eng/lucifer-bot.git
cd lucifer-bot
npm install
cp .env.example .env
```

Configurez au minimum ces variables sur le serveur du bot :

- `OWNER_NUMBER` : numéro du propriétaire au format international, sans `+`.
- `ADMIN_PASSWORD` : mot de passe long et unique du tableau de bord.
- `BOT_DATA_DIR` : dossier persistant pour les données et le jeton administrateur, par exemple `/var/data`.
- `WHATSAPP_SESSION_PATH` : dossier persistant pour l'authentification WhatsApp, par exemple `/var/data/lucifer-session`.

Le serveur doit exposer le tableau de bord/API en HTTPS. Il doit accepter le port fourni par son hébergeur via la variable `PORT`. Démarrez le moteur avec :

```bash
npm start
```

**Important :** les dossiers de session et de données doivent survivre aux redémarrages et aux redéploiements. Un disque éphémère peut déconnecter le compte WhatsApp et faire perdre les données. N'utilisez pas un service serverless pour exécuter `npm start`.

## 3. Relier Vercel au serveur du bot

Dans les variables d'environnement du projet Vercel, ajoutez :

- `BOT_API_URL` = URL HTTPS du serveur qui exécute le bot, sans chemin `/api`, par exemple `https://bot.example.com`.

Redéployez ensuite le projet Vercel. Ne mettez jamais `ADMIN_PASSWORD`, les clés WhatsApp ou le dossier de session dans le projet Vercel : ces éléments restent sur le serveur du bot.

## 4. Connecter le téléphone

1. Ouvrez le domaine de production Vercel.
2. Saisissez le mot de passe défini par `ADMIN_PASSWORD`.
3. Entrez le numéro WhatsApp avec l'indicatif pays, sans `+`.
4. Appuyez sur **Générer**.
5. Sur le téléphone : WhatsApp → Paramètres → Appareils liés → Lier avec un numéro de téléphone.
6. Saisissez le code affiché.

Baileys est une bibliothèque non officielle. WhatsApp peut limiter ou suspendre les comptes utilisés avec des clients non officiels ; utilisez de préférence un numéro secondaire pour les essais.
