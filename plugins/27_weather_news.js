const { fetchJson } = require('../src/utils');

module.exports = {
  commands: [
    'meteo','weather','forecast','temperature2','humidity','wind3',
    'news','actualite','technews','sportnews','worldnews','localnews',
    'breaking','trending','headline','topnews','flashinfo',
    'earthquake2','volcano','storm','flood','disaster',
    'airquality','pollution','uv','sunrise','sunset',
  ],
  description: 'Météo & Actualités',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch (cmd) {
      case 'meteo':
      case 'weather':
      case 'forecast': {
        const city = q || 'Paris';
        try {
          const geoData = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`);
          if (!geoData.results?.length) return await m.reply(`❌ Ville "${city}" introuvable.`);
          const { latitude, longitude, name, country } = geoData.results[0];
          const weatherData = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`);
          const c = weatherData.current;
          const d = weatherData.daily;
          const codeToEmoji = (code) => {
            if (code === 0) return '☀️ Clair';
            if (code <= 3) return '⛅ Nuageux';
            if (code <= 48) return '🌫️ Brouillard';
            if (code <= 67) return '🌧️ Pluie';
            if (code <= 77) return '❄️ Neige';
            if (code <= 82) return '🌦️ Averses';
            return '⛈️ Orage';
          };
          await m.reply(`🌤️ *Météo — ${name}, ${country}*\n\n🌡️ Température: *${Math.round(c.temperature_2m)}°C* (ressenti ${Math.round(c.apparent_temperature)}°C)\n💧 Humidité: *${c.relative_humidity_2m}%*\n💨 Vent: *${Math.round(c.wind_speed_10m)} km/h*\n🌤️ Ciel: *${codeToEmoji(c.weather_code)}*\n\n📅 *Prévisions 3 jours:*\n${d.time.map((t, i) => `• ${new Date(t).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}: ${Math.round(d.temperature_2m_min[i])}°C → ${Math.round(d.temperature_2m_max[i])}°C 🌧️${d.precipitation_sum[i]}mm`).join('\n')}`);
        } catch (e) {
          await m.reply(`🌤️ *Météo — ${city}*\n\n❌ Impossible de récupérer la météo.\n\n🔗 Consultez: https://www.meteofrance.com`);
        }
        break;
      }
      case 'news':
      case 'actualite':
      case 'breaking':
      case 'headline':
      case 'topnews': {
        try {
          const data = await fetchJson('https://saurav.tech/NewsAPI/top-headlines/category/general/fr.json');
          if (!data.articles?.length) throw new Error('No articles');
          const top5 = data.articles.slice(0, 5);
          const list = top5.map((a, i) => `*${i + 1}.* ${a.title}\n_${a.source.name}_`).join('\n\n');
          await m.reply(`📰 *Actualités du jour*\n\n${list}\n\n🔗 Plus d'infos: https://news.google.com/search?q=france&hl=fr`);
        } catch {
          await m.reply(`📰 *Actualités*\n\n🔗 Suivez les actualités en temps réel:\n• https://www.lemonde.fr\n• https://www.lefigaro.fr\n• https://www.bfmtv.com\n• https://news.google.com/?hl=fr`);
        }
        break;
      }
      case 'technews': {
        await m.reply(`💻 *Tech News*\n\n🔗 Dernières actus tech:\n• https://www.01net.com\n• https://www.journaldunet.com\n• https://techcrunch.com\n• https://www.theverge.com\n\n🔍 Cherchez sur Google: "actualités tech ${new Date().toLocaleDateString('fr-FR')}"`);
        break;
      }
      case 'sportnews': {
        await m.reply(`⚽ *Sport News*\n\n🔗 Dernières actus sport:\n• https://www.lequipe.fr\n• https://www.footmercato.net\n• https://www.eurosport.fr\n• https://bbc.com/sport`);
        break;
      }
      case 'worldnews': {
        await m.reply(`🌍 *World News*\n\n🔗 Actualités mondiales:\n• https://www.bbc.com/news\n• https://www.reuters.com\n• https://www.aljazeera.com\n• https://www.france24.com`);
        break;
      }
      case 'airquality':
      case 'pollution': {
        const city = q || 'Paris';
        await m.reply(`💨 *Qualité de l'air — ${city}*\n\n🔗 Consultez en temps réel:\nhttps://www.iqair.com/fr/france/${encodeURIComponent(city)}\n\n📊 Indice AQI:\n• 0-50: 🟢 Bon\n• 51-100: 🟡 Modéré\n• 101-150: 🟠 Mauvais pour sensibles\n• 151-200: 🔴 Mauvais\n• 201+: 🟣 Très mauvais`);
        break;
      }
      case 'sunrise':
      case 'sunset': {
        const city = q || 'Paris';
        await m.reply(`🌅 *${cmd === 'sunrise' ? 'Lever' : 'Coucher'} du soleil — ${city}*\n\n🔗 Horaires précis: https://www.timeanddate.com/sun/france/${encodeURIComponent(city.toLowerCase())}`);
        break;
      }
      case 'earthquake2':
        await m.reply(`🌍 *Tremblements de terre récents*\n\n🔗 Séismes en temps réel:\nhttps://earthquake.usgs.gov/earthquakes/map/\n\n_Source: USGS (United States Geological Survey)_`);
        break;
      case 'uv':
        await m.reply(`☀️ *Indice UV*\n\n📊 Échelle:\n• 0-2: 🟢 Faible\n• 3-5: 🟡 Modéré (lunettes conseillées)\n• 6-7: 🟠 Fort (crème SPF30+)\n• 8-10: 🔴 Très fort (SPF50+, évitez 12-16h)\n• 11+: 🟣 Extrême (restez à l'ombre!)\n\n🔗 Consultez: https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index`);
        break;
      default:
        await m.reply(`🌤️ *Météo & Actualités*\n\nCommandes:\n• ${cfg.PREFIX}meteo [ville]\n• ${cfg.PREFIX}news\n• ${cfg.PREFIX}technews\n• ${cfg.PREFIX}sportnews\n• ${cfg.PREFIX}airquality [ville]\n• ${cfg.PREFIX}uv`);
    }
  },
};
