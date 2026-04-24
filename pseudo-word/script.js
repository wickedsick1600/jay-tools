  const STYLES = {
    latin: {
      onsets: ['','b','c','d','f','g','l','m','n','p','r','s','t','v','br','cl','cr','fl','gr','pl','pr','tr','st','sp'],
      vowels: ['a','e','i','o','u','ae','au','ia','io','ae'],
      codas:  ['','m','n','r','s','t','x','ns','nt','rt','st','lt'],
      endings:['um','us','is','it','em','or','ax','ix','ent','osa','ium'],
    },
    fantasy: {
      onsets: ['','Ae','Br','Dr','El','Fae','Gr','Il','Ky','Ly','Mor','Nar','Oth','Py','Qu','Ry','Sha','Th','Ul','Vel','Wy','Xa','Yl','Zar'],
      vowels: ['a','e','i','o','y','ae','ei','io','ya','wy'],
      codas:  ['','l','n','r','s','th','nd','ll','rn','lm','st','dr'],
      endings:['an','yn','ir','or','el','wyn','dir','thas','wen','mir','ros'],
    },
    tech: {
      onsets: ['','B','C','D','F','G','J','K','L','M','N','P','R','S','T','V','Z','Fl','Gr','Pl','Sn','Sp','Tr','Zy'],
      vowels: ['a','e','i','o','u','y','ee','oo','ou'],
      codas:  ['','b','c','d','f','g','k','l','m','n','p','r','s','t','v','x','z'],
      endings:['ly','fy','ify','ic','ix','io','ex','oo','zy','bo','do','go','to','py'],
    },
  };

  const words = document.getElementById('words');
  const msg = document.getElementById('msg');

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function makeWord(style, minLen, maxLen) {
    const s = STYLES[style];
    const target = randInt(minLen, maxLen);
    let w = rand(s.onsets);
    let guard = 0;
    while (w.length < target - 2 && guard < 6) {
      w += rand(s.vowels);
      if (w.length < target - 1) w += rand(s.codas);
      guard++;
    }
    w += rand(s.endings);
    if (w.length > maxLen + 3) w = w.slice(0, maxLen + 2);
    return w;
  }

  function render(list) {
    words.innerHTML = '';
    list.forEach(w => {
      const div = document.createElement('div');
      div.className = 'word';
      div.textContent = w;
      div.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(w);
          div.classList.add('copied');
          setTimeout(() => div.classList.remove('copied'), 1000);
        } catch {}
      });
      words.appendChild(div);
    });
  }

  function flash(text, isError) {
    msg.textContent = text;
    msg.className = isError ? 'error' : 'muted';
    setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 2000);
  }

  let lastList = [];
  document.getElementById('gen-btn').addEventListener('click', () => {
    const style = document.getElementById('style').value;
    const count = Math.max(1, Math.min(200, parseInt(document.getElementById('count').value, 10) || 20));
    let minLen = parseInt(document.getElementById('min-len').value, 10) || 5;
    let maxLen = parseInt(document.getElementById('max-len').value, 10) || 9;
    if (maxLen < minLen) [minLen, maxLen] = [maxLen, minLen];
    lastList = Array.from({ length: count }, () => makeWord(style, minLen, maxLen));
    render(lastList);
  });

  document.getElementById('copy-btn').addEventListener('click', async () => {
    if (lastList.length === 0) { flash('Generate some words first.'); return; }
    try {
      await navigator.clipboard.writeText(lastList.join('\n'));
      flash('Copied.');
    } catch {
      flash('Copy failed — select and copy manually.', true);
    }
  });

  document.getElementById('gen-btn').click();
