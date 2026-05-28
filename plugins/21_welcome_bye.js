const welcomeMessages = [
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n╔══════════════════╗\n║   🎉 BIENVENUE   ║\n╚══════════════════╝\n\n👤 *Membre :* @user\n👥 *Groupe :* @group\n🔢 *Membre N°:* @count\n\nBienvenue parmi nous ! 🔥\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n😈 *UN DÉMON EST NÉ* 😈\n\n🔥 @user vient de naître\ndans les flammes de *@group* !\n\n💀 Âme numéro *@count*\n\n⛓️ Tu appartiens désormais aux ténèbres...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n💻 *ACCÈS AUTORISÉ* 💻\n\n> Connexion établie...\n> Utilisateur : @user\n> Groupe : @group\n> ID : #@count\n> Statut : ACTIF ✅\n\n⚡ Bienvenue dans le système !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🐉 *LE DRAGON A RUGIT* 🐉\n\n🔥 @user a traversé\nles flammes de *@group* !\n\n⚔️ Guerrier numéro *@count*\n\n🏰 Le château est à toi !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🔒 *NOUVEAU PRISONNIER* 🔒\n\n👮 @user vient d'entrer\ndans la prison *@group* !\n\n🔑 Matricule : *#@count*\n\n⛓️ Il n'y a pas d'évasion possible...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🎩 *NOUVEAU MAFIOSO* 🎩\n\n🚬 @user vient d'être\naccepté dans la famille *@group*\n\n💰 Membre numéro *@count*\n\n🔫 Omertà respectée !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🏥 *NOUVEAU PATIENT ENREGISTRÉ* 🏥\n\n💊 @user vient d'être admis\nà l'hôpital *@group* !\n\n🩺 Dossier N° *@count*\n\n❤️ Prenez soin de vous !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🕵️ *SUSPECT IDENTIFIÉ* 🕵️\n\n🔍 @user vient d'être\nlocalisé dans *@group* !\n\n📁 Dossier N° *@count*\n\n🚔 Tu es sous surveillance...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🧟 *NOUVEAU ZOMBIE DÉTECTÉ* 🧟\n\n🧠 @user vient d'être infecté\npar le virus *@group* !\n\n☣️ Zombie numéro *@count*\n\n🔴 Il n'y a pas de vaccin...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🥷 *NOUVEAU NINJA RECRUTÉ* 🥷\n\n⚔️ @user vient d'entrer\ndans le clan *@group* !\n\n🌑 Ninja numéro *@count*\n\n🗡️ L'ombre t'appartient !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🪓 *UN VIKING EST ARRIVÉ* 🪓\n\n⛵ @user a accosté\nsur les terres de *@group* !\n\n🛡️ Guerrier numéro *@count*\n\n🔱 Valhalla t'attend !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🏴‍☠️ *MOUSSAILLON À BORD* 🏴‍☠️\n\n⚓ @user a embarqué\nsur le navire *@group* !\n\n🗺️ Matelot numéro *@count*\n\n💎 Cap vers le trésor !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🥊 *NOUVEAU COMBATTANT* 🥊\n\n🏟️ @user entre dans le ring\nde *@group* !\n\n🔔 Combattant numéro *@count*\n\n💪 Que le combat commence !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🔬 *NOUVELLE EXPÉRIENCE* 🔬\n\n⚗️ Cobaye @user vient d'entrer\ndans le laboratoire *@group* !\n\n🧪 Spécimen numéro *@count*\n\n🤖 L'expérience commence !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🤠 *ÉTRANGER EN VILLE* 🤠\n\n🌵 @user vient d'arriver\ndans la ville de *@group* !\n\n🔫 Hors-la-loi numéro *@count*\n\n🎯 La main la plus rapide gagne !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🤖 *UNITÉ ACTIVÉE* 🤖\n\n⚡ Unité @user en ligne\nRéseau : *@group*\nID Système : *#@count*\nStatut : OPÉRATIONNEL ✅\n\n🔋 Batterie à 100% !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n𓂀 *LES DIEUX T'ACCUEILLENT* 𓂀\n\n🏺 @user a pénétré\ndans le temple de *@group* !\n\n𓆣 Serviteur numéro *@count*\n\n☥ Que Ra te guide !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🎤 *NOUVEAU MC DANS LA PLACE* 🎤\n\n🎵 @user vient de poser\nses kicks dans *@group* !\n\n🔊 Rappeur numéro *@count*\n\n💿 Le micro est à toi !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🏆 *UN CHAMPION EST NÉ* 🏆\n\n🥇 @user vient d'entrer\ndans l'arène des champions de *@group* !\n\n🎖️ Champion numéro *@count*\n\n🌟 La victoire t'appartient !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n👼 *UN ANGE EST DESCENDU* 👼\n\n✨ @user a atterri\ndu paradis dans *@group* !\n\n🌟 Ange numéro *@count*\n\n🕊️ Que la paix soit avec toi !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
];

const goodbyeMessages = [
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n╔══════════════════╗\n║    😢 AU REVOIR  ║\n╚══════════════════╝\n\n👤 *Membre :* @user\n👥 *Groupe :* @group\n🔢 *Membres restants :* @count\n\nTu nous manqueras... 💔\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n💻 *CONNEXION PERDUE* 💻\n\n> Déconnexion de @user...\n> Groupe : @group\n> Membres restants : @count\n> Statut : OFFLINE ❌\n\n⚡ Signal perdu !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🎩 *TRAÎTRE ÉLIMINÉ* 🎩\n\n🔫 @user a quitté\nla famille *@group*...\n\n💰 *@count* membres fidèles restants\n\n🩸 Les traîtres paient toujours...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🏴‍☠️ *MATELOT PERDU EN MER* 🏴‍☠️\n\n⚓ @user a sauté\ndu navire *@group* !\n\n🌊 *@count* matelots restants\n\n🦈 Bonne chance avec les requins !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🧟 *ZOMBIE NEUTRALISÉ* 🧟\n\n🔫 @user a été éliminé\nde la zone *@group* !\n\n☣️ *@count* survivants restants\n\n🪓 Repose en paix...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🪓 *GUERRIER TOMBÉ AU COMBAT* 🪓\n\n⛵ @user a quitté\nles terres de *@group* !\n\n🛡️ *@count* guerriers restants\n\n⚔️ Valhalla l'attend !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🤖 *UNITÉ DÉSACTIVÉE* 🤖\n\n⚡ Unité @user hors ligne\nRéseau : *@group*\nUnités restantes : *@count*\nStatut : SHUTDOWN ❌\n\n🔋 Batterie à 0% !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🤠 *LE SHÉRIF A QUITTÉ LA VILLE* 🤠\n\n🌵 @user a chevauché\nhors de *@group* !\n\n🔫 *@count* habitants restants\n\n🌅 Dans le soleil couchant...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🥷 *NINJA DISPARU* 🥷\n\n🌑 @user s'est évaporé\ndans les ombres de *@group* !\n\n⚔️ *@count* ninjas restants\n\n🗡️ Comme il était venu...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🎤 *LE MC A QUITTÉ LA SCÈNE* 🎤\n\n🎵 @user a posé le micro\nde *@group* !\n\n🔊 *@count* rappeurs restants\n\n💿 Le beat continue sans toi !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n𓂀 *LE SERVITEUR A FUIT* 𓂀\n\n🏺 @user a quitté\nle temple de *@group* !\n\n𓆣 *@count* serviteurs restants\n\n☥ Les dieux sont en colère...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🔬 *EXPÉRIENCE TERMINÉE* 🔬\n\n⚗️ Le cobaye @user a fui\nle laboratoire *@group* !\n\n🧪 *@count* spécimens restants\n\n💉 L'expérience continue !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🥊 *KO DÉFINITIF* 🥊\n\n🏟️ @user est sorti du ring\nde *@group* !\n\n🔔 *@count* combattants restants\n\n😤 Reviens quand tu seras prêt !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🚀 *ASTRONAUTE PERDU* 🚀\n\n🌌 @user a dérivé\nhors de la galaxie *@group* !\n\n🛸 *@count* astronautes restants\n\n⭐ Perdu dans l'infini...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🐉 *LE GUERRIER A FUIT* 🐉\n\n🔥 @user a abandonné\nle château de *@group* !\n\n⚔️ *@count* guerriers restants\n\n🏰 Le dragon a gagné !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🔒 *PRISONNIER ÉVADÉ* 🔒\n\n👮 @user s'est évadé\nde la prison *@group* !\n\n🔑 *@count* prisonniers restants\n\n🚨 Alerte maximale !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n⚽ *JOUEUR BLESSÉ* ⚽\n\n🏟️ @user a quitté le terrain\ndu club *@group* !\n\n👕 *@count* joueurs restants\n\n🚑 Bon rétablissement !\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n👼 *L'ANGE EST REMONTÉ AU CIEL* 👼\n\n✨ @user a quitté\nle paradis de *@group*...\n\n🌟 *@count* anges restants\n\n🕊️ Le paradis sera moins beau...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🏆 *CHAMPION RETRAITÉ* 🏆\n\n🥇 @user a raccroché\nles gants de *@group* !\n\n🎖️ *@count* champions restants\n\n🌟 Une légende s'en va...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
  `𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂\n\n🔮 *L'ÉTOILE FILANTE* 🔮\n\n🌙 @user s'est évanoui\ndans la nuit de *@group*...\n\n✨ *@count* étoiles restantes\n\n🌟 Étoile filante, fais un vœu...\n> 𓅂𝐃𝚯𝐌𝚫 𝐋𝐔𝐂𝐈𝐅𝚵𝐑𝚯 𓅂`,
];

function formatMsg(template, user, group, count) {
  return template
    .replace(/@user/g, user)
    .replace(/@group/g, group)
    .replace(/@count/g, count);
}

module.exports = {
  commands: [
    'setwelcome','setbye','welcomeoff','byeoff','welcomeon','byeon',
    'testwelcome','testbye','welcomestyle','welcomelist',
  ],
  description: 'Messages de bienvenue/au revoir',

  // Données pour l'event group participants
  welcomeMessages,
  goodbyeMessages,
  formatMsg,

  execute: async ({ sock, m, args, q, isOwner, config: cfg, db }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'testwelcome': {
        if (!m.isGroup) return await m.reply('❌ Groupe uniquement!');
        const meta = await sock.groupMetadata(m.chat);
        const idx = Math.floor(Math.random() * welcomeMessages.length);
        const text = formatMsg(
          welcomeMessages[idx],
          '@' + m.sender.split('@')[0],
          meta.subject,
          meta.participants.length
        );
        await sock.sendMessage(m.chat, { text, mentions: [m.sender] }, { quoted: m });
        break;
      }
      case 'testbye': {
        if (!m.isGroup) return await m.reply('❌ Groupe uniquement!');
        const meta = await sock.groupMetadata(m.chat);
        const idx = Math.floor(Math.random() * goodbyeMessages.length);
        const text = formatMsg(
          goodbyeMessages[idx],
          '@' + m.sender.split('@')[0],
          meta.subject,
          meta.participants.length
        );
        await sock.sendMessage(m.chat, { text, mentions: [m.sender] }, { quoted: m });
        break;
      }
      case 'welcomestyle': {
        const n = parseInt(args[0]);
        if (!n || n < 1 || n > welcomeMessages.length) {
          return await m.reply(`Usage: ${cfg.PREFIX}welcomestyle [1-${welcomeMessages.length}]\nIl y a *${welcomeMessages.length}* styles disponibles!`);
        }
        db.saveNote(m.chat, '__welcome_style__', String(n - 1));
        await m.reply(`✅ Style de bienvenue *#${n}* activé!\nTestez: ${cfg.PREFIX}testwelcome`);
        break;
      }
      case 'welcomelist': {
        const styles = welcomeMessages.map((_, i) => {
          const titles = ['Classique','Démon','Hacker','Dragon','Prison','Mafia','Médical','Détective','Zombie','Ninja','Viking','Pirate','Boxeur','Scientifique','Western','Robot','Pharaon','Rap','Champion','Ange'];
          return `${i + 1}. ${titles[i]}`;
        }).join('\n');
        await m.reply(`🎨 *Styles de Bienvenue (${welcomeMessages.length})*\n\n${styles}\n\nActivez: ${cfg.PREFIX}welcomestyle [numéro]`);
        break;
      }
      case 'setwelcome':
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        db.saveNote(m.chat, '__welcome_on__', '1');
        await m.reply(`✅ Messages de bienvenue *activés*!\n${welcomeMessages.length} styles disponibles.\nTestez: ${cfg.PREFIX}testwelcome\nChoisir style: ${cfg.PREFIX}welcomestyle [1-${welcomeMessages.length}]`);
        break;
      case 'welcomeoff':
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        db.saveNote(m.chat, '__welcome_on__', '0');
        await m.reply('✅ Messages de bienvenue *désactivés*.');
        break;
      case 'setbye':
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        db.saveNote(m.chat, '__bye_on__', '1');
        await m.reply(`✅ Messages d'au revoir *activés*!\n${goodbyeMessages.length} styles disponibles.\nTestez: ${cfg.PREFIX}testbye`);
        break;
      case 'byeoff':
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        db.saveNote(m.chat, '__bye_on__', '0');
        await m.reply("✅ Messages d'au revoir *désactivés*.");
        break;
      case 'welcomeon':
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        db.saveNote(m.chat, '__welcome_on__', '1');
        await m.reply('✅ Bienvenue réactivé!');
        break;
      case 'byeon':
        if (!isOwner) return await m.reply('🔱 Propriétaire uniquement!');
        db.saveNote(m.chat, '__bye_on__', '1');
        await m.reply("✅ Au revoir réactivé!");
        break;
    }
  },
};
