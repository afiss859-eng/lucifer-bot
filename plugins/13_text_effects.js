module.exports = {
  commands: [
    'fancy','bold','italic','strike','mono','bubble','square',
    'cursive','gothic','doublebold','flip','zalgo','small','big',
    'wide','narrow','serif','sansserif','oldeng','circled',
    'negative','parenthesized','fullwidth','superscript','subscript',
    'aesthetic','vapor','glitch','shadow','underline','rainbow',
    'wave2','tiny','outline',
  ],
  description: 'Effets de texte',
  execute: async ({ m, args, config: cfg }) => {
    const cmd = m.body.slice(cfg.PREFIX.length).trim().split(' ')[0].toLowerCase();
    const text = args.join(' ');
    if (!text) return await m.reply(`Usage: ${cfg.PREFIX}${cmd} [texte]`);

    const maps = {
      bold: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',to:'𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'},
      italic: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',to:'𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻'},
      cursive: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',to:'𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏'},
      gothic: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',to:'𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷'},
      bubble: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',to:'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ⓪①②③④⑤⑥⑦⑧⑨'},
      fullwidth: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',to:'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９'},
      oldeng: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',to:'𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟'},
      doublebold: {from:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',to:'𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡'},
    };

    function applyMap(map, input) {
      return input.split('').map(c => {
        const idx = map.from.indexOf(c);
        return idx !== -1 ? map.to[idx] : c;
      }).join('');
    }

    let result = text;
    switch (cmd) {
      case 'bold': result = applyMap(maps.bold, text); break;
      case 'italic': result = applyMap(maps.italic, text); break;
      case 'cursive': result = applyMap(maps.cursive, text); break;
      case 'gothic': result = applyMap(maps.gothic, text); break;
      case 'bubble': result = applyMap(maps.bubble, text); break;
      case 'fullwidth':
      case 'wide': result = applyMap(maps.fullwidth, text); break;
      case 'oldeng': result = applyMap(maps.oldeng, text); break;
      case 'doublebold': result = applyMap(maps.doublebold, text); break;
      case 'fancy': result = applyMap(maps.cursive, text); break;
      case 'strike': result = text.split('').join('̶')+'̶'; break;
      case 'underline': result = text.split('').join('̲')+'̲'; break;
      case 'flip': result = text.split('').reverse().map(c=>{const map={a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z'};return map[c.toLowerCase()]||c;}).join(''); break;
      case 'small': result = text.split('').map(c=>{const m={a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',q:'q',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ'};return m[c.toLowerCase()]||c;}).join(''); break;
      case 'aesthetic':
      case 'vapor': result = text.split('').join(' '); break;
      case 'zalgo': result = text.split('').map(c=>`${c}͜͢͠͡ͅ`).join(''); break;
      case 'rainbow': {
        const colors = ['🔴','🟠','🟡','🟢','🔵','🟣'];
        result = text.split('').map((c,i)=>`${colors[i%colors.length]}${c}`).join('');
        break;
      }
      case 'mono': result = '```'+text+'```'; break;
      case 'square': result = applyMap(maps.doublebold, text); break;
      default: result = applyMap(maps.bold, text);
    }

    await m.reply(`✨ *${cmd.charAt(0).toUpperCase()+cmd.slice(1)}*\n\n${result}`);
  },
};
