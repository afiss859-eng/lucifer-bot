/**
 * Plugin 34 — Wikipedia, Définitions & Calcul
 * Commandes: .wiki, .define, .calc, .convert, .couleur
 */
const axios = require('axios');

module.exports = {
  commands: ['wiki','wikipedia','define','definition','calc','calcul','convert','convertir','couleur','color'],
  description: 'Wikipedia, définitions, calcul & conversion',
  execute: async ({ m, args, q, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();

    switch(cmd) {
      case 'wiki':
      case 'wikipedia': {
        if (!q) return await m.reply(`📖 *Wikipedia*\n\nUsage: ${cfg.PREFIX}wiki [sujet]\nEx: ${cfg.PREFIX}wiki Tour Eiffel`);
        await m.react('📖');
        try {
          // Essaie d'abord en français, puis en anglais
          let result = await searchWiki(q, 'fr');
          if (!result) result = await searchWiki(q, 'en');
          if (!result) return await m.reply(`❌ Aucun résultat Wikipedia pour: *${q}*`);
          await m.reply(`📖 *Wikipedia — ${result.title}*\n\n${result.extract}\n\n🔗 ${result.url}`);
        } catch(e) {
          await m.reply(`❌ Erreur Wikipedia: ${e.message}`);
        }
        break;
      }

      case 'define':
      case 'definition': {
        if (!q) return await m.reply(`📚 *Définition*\n\nUsage: ${cfg.PREFIX}define [mot]\nEx: ${cfg.PREFIX}define algorithme`);
        await m.react('📚');
        try {
          const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`, { timeout: 10000 });
          const data = res.data[0];
          const meanings = data.meanings.slice(0, 2).map(m => {
            const defs = m.definitions.slice(0, 2).map((d, i) => `${i+1}. ${d.definition}${d.example?' — _"'+d.example+'"_':''}`).join('\n');
            return `*${m.partOfSpeech}:*\n${defs}`;
          }).join('\n\n');
          const phonetic = data.phonetics?.find(p => p.text)?.text || '';
          await m.reply(`📚 *${data.word}* ${phonetic}\n\n${meanings}`);
        } catch {
          // Fallback: Wikipedia snippet
          try {
            const result = await searchWiki(q, 'fr');
            if (result) await m.reply(`📚 *${result.title}*\n\n${result.extract.slice(0,400)}...`);
            else await m.reply(`❌ Définition introuvable pour: *${q}*`);
          } catch { await m.reply(`❌ Service temporairement indisponible.`); }
        }
        break;
      }

      case 'calc':
      case 'calcul': {
        if (!q) return await m.reply(`🔢 *Calculatrice*\n\nUsage: ${cfg.PREFIX}calc [expression]\nEx: ${cfg.PREFIX}calc 2+2*3\n\nOpérations: +, -, *, /, **, sqrt(), sin(), cos()`);
        try {
          // Sécuriser l'évaluation — uniquement maths
          const expr = q.replace(/[^0-9+\-*/().,%\s^sqrt|sin|cos|tan|log|abs|floor|ceil|round|PI|E]/g, '');
          if (!expr.trim()) return await m.reply('❌ Expression invalide.');
          const safeExpr = expr
            .replace(/\^/g, '**')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/abs\(/g, 'Math.abs(')
            .replace(/floor\(/g, 'Math.floor(')
            .replace(/ceil\(/g, 'Math.ceil(')
            .replace(/round\(/g, 'Math.round(')
            .replace(/PI/g, 'Math.PI')
            .replace(/E/g, 'Math.E');
          // eslint-disable-next-line no-new-func
          const result = new Function(`return (${safeExpr})`)();
          if (typeof result !== 'number' || !isFinite(result)) throw new Error('Résultat invalide');
          await m.reply(`🔢 *Calcul*\n\n📥 ${q}\n📤 = *${Number(result.toFixed(10))}*`);
        } catch(e) {
          await m.reply(`❌ Erreur de calcul: ${e.message}\n\nEx: ${cfg.PREFIX}calc 2+2*3`);
        }
        break;
      }

      case 'convert':
      case 'convertir': {
        // Usage: .convert 100 km mi  OU  .convert 25 celsius fahrenheit
        if (args.length < 3) return await m.reply(
          `🔄 *Convertisseur*\n\nUsage: ${cfg.PREFIX}convert [valeur] [unité_source] [unité_cible]\n\n` +
          `Exemples:\n• ${cfg.PREFIX}convert 100 km mi\n• ${cfg.PREFIX}convert 25 celsius fahrenheit\n• ${cfg.PREFIX}convert 1 kg lb\n• ${cfg.PREFIX}convert 1 usd eur\n• ${cfg.PREFIX}convert 1 btc usd`
        );
        const [valStr, from, to] = args;
        const val = parseFloat(valStr);
        if (isNaN(val)) return await m.reply('❌ Valeur invalide.');
        try {
          const result = await convertUnit(val, from.toLowerCase(), to.toLowerCase());
          await m.reply(`🔄 *Conversion*\n\n${val} ${from.toUpperCase()} = *${result.value} ${to.toUpperCase()}*${result.note ? '\n\n_'+result.note+'_' : ''}`);
        } catch(e) {
          await m.reply(`❌ ${e.message}`);
        }
        break;
      }

      case 'couleur':
      case 'color': {
        if (!q) return await m.reply(`🎨 *Couleur*\n\nUsage: ${cfg.PREFIX}couleur [nom ou hex]\nEx: ${cfg.PREFIX}couleur rouge\nEx: ${cfg.PREFIX}couleur #FF5733`);
        const hexMatch = q.match(/^#?([0-9a-fA-F]{6})$/);
        if (hexMatch) {
          const hex = hexMatch[1].toUpperCase();
          const r = parseInt(hex.slice(0,2), 16);
          const g = parseInt(hex.slice(2,4), 16);
          const b = parseInt(hex.slice(4,6), 16);
          const hsl = rgbToHsl(r, g, b);
          await m.reply(`🎨 *Couleur #${hex}*\n\n🔴 Rouge: ${r}\n🟢 Vert: ${g}\n🔵 Bleu: ${b}\n\n📐 HSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%\n🎨 HEX: #${hex}`);
        } else {
          const colors = { rouge:'#FF0000', vert:'#00FF00', bleu:'#0000FF', jaune:'#FFFF00', orange:'#FFA500', violet:'#8B00FF', rose:'#FF69B4', noir:'#000000', blanc:'#FFFFFF', gris:'#808080', marron:'#A52A2A', cyan:'#00FFFF' };
          const hex = colors[q.toLowerCase()];
          if (hex) {
            await m.reply(`🎨 *${q}* = ${hex}`);
          } else {
            await m.reply(`❌ Couleur inconnue: ${q}\nCouleurs disponibles: ${Object.keys(colors).join(', ')}`);
          }
        }
        break;
      }
    }
  },
};

async function searchWiki(query, lang = 'fr') {
  const searchRes = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
    params: { action:'query', list:'search', srsearch:query, format:'json', srlimit:1 },
    timeout: 10000,
  });
  const results = searchRes.data?.query?.search;
  if (!results?.length) return null;
  const title = results[0].title;
  const extractRes = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
    params: { action:'query', prop:'extracts', exintro:true, explaintext:true, titles:title, format:'json' },
    timeout: 10000,
  });
  const pages = extractRes.data?.query?.pages;
  const page = Object.values(pages)[0];
  if (!page?.extract) return null;
  const extract = page.extract.slice(0, 500).trim() + '...';
  const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  return { title, extract, url };
}

async function convertUnit(val, from, to) {
  // Températures
  const tempConv = { 'celsius-fahrenheit': v => v*9/5+32, 'fahrenheit-celsius': v => (v-32)*5/9,
    'celsius-kelvin': v => v+273.15, 'kelvin-celsius': v => v-273.15,
    'fahrenheit-kelvin': v => (v-32)*5/9+273.15, 'kelvin-fahrenheit': v => (v-273.15)*9/5+32 };
  const key = `${from}-${to}`;
  if (tempConv[key]) return { value: Number(tempConv[key](val).toFixed(4)) };

  // Distances
  const toMeters = { km:1000, m:1, cm:0.01, mm:0.001, mi:1609.344, yd:0.9144, ft:0.3048, in:0.0254, nm:1852 };
  if (toMeters[from] && toMeters[to]) {
    const result = val * toMeters[from] / toMeters[to];
    return { value: Number(result.toFixed(6)) };
  }

  // Poids
  const toKg = { kg:1, g:0.001, mg:0.000001, t:1000, lb:0.453592, oz:0.0283495 };
  if (toKg[from] && toKg[to]) {
    return { value: Number((val * toKg[from] / toKg[to]).toFixed(6)) };
  }

  // Vitesse
  const toMps = { 'km/h':1/3.6, 'mph':0.44704, 'm/s':1, 'knot':0.514444 };
  if (toMps[from] && toMps[to]) {
    return { value: Number((val * toMps[from] / toMps[to]).toFixed(4)) };
  }

  // Devises via API publique
  if (['usd','eur','xof','mad','dzd','btc','eth'].includes(from) || ['usd','eur','xof','mad','dzd','btc','eth'].includes(to)) {
    try {
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`, { timeout: 8000 });
      const rate = res.data?.rates?.[to.toUpperCase()];
      if (!rate) throw new Error(`Devise ${to} inconnue`);
      return { value: Number((val * rate).toFixed(4)), note: `Taux: 1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}` };
    } catch {
      throw new Error(`Conversion de devises indisponible. Réessayez.`);
    }
  }

  throw new Error(`Conversion ${from} → ${to} non supportée.\nUnités supportées: km/m/mi/ft, kg/g/lb/oz, celsius/fahrenheit/kelvin, usd/eur/xof...`);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2-max-min) : d / (max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      default: h = ((r-g)/d + 4)/6; break;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
