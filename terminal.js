
(function () {
  var css = `
.hero.has-term{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:36px;align-items:center}
.hero-text h1{max-width:none;font-size:clamp(2rem,4.2vw,2.9rem)}
.term{background:#0e1512;color:#d7e3da;border:1px solid var(--rule);border-radius:12px;overflow:hidden;
  font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:0 14px 40px rgba(0,0,0,.18)}
.term-top{display:flex;align-items:center;gap:6px;padding:9px 12px;background:#17201b;border-bottom:1px solid #27342c}
.term-top i{width:10px;height:10px;border-radius:50%;background:#3a4a40}
.term-top i:first-child{background:#e3a165}.term-top i:nth-child(2){background:#74d3a0}
.term-top span{margin-left:8px;color:#7f9286;font-size:12px}
.term-body{height:290px;overflow:auto;padding:12px 14px;cursor:text}
.term .ln{white-space:pre-wrap;word-break:break-word}
.term .dim{color:#7f9286}.term .ok{color:#74d3a0}.term .hot{color:#e3a165}
.term .lnk{all:unset;color:#74d3a0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.term .lnk:hover,.term .lnk:focus-visible{color:#e3a165}
.term-in{display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid #27342c;background:#111a15}
.term-in span{color:#74d3a0}
.term-in input{flex:1;min-width:0;background:none;border:0;outline:0;color:#d7e3da;font:inherit;caret-color:#e3a165}
.ov{position:fixed;inset:0;z-index:100;background:rgba(8,12,10,.74);display:none;align-items:center;justify-content:center;padding:16px}
.ov.on{display:flex}
.ov-box{width:min(720px,100%);max-height:90vh;overflow:auto;background:var(--bg);border:1px solid var(--rule);border-radius:12px}
.ov-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:10px 12px 10px 18px;background:var(--bg);border-bottom:1px solid var(--rule);
  font:12px ui-monospace,Menlo,Consolas,monospace;color:var(--muted)}
.ov-x{width:36px;height:36px;border-radius:8px;border:1.5px solid var(--forest);background:none;color:var(--forest);
  font-size:22px;line-height:1;cursor:pointer}
.ov-x:hover{background:var(--forest);color:var(--forest-ink)}
.ov-x:focus-visible{outline:3px solid var(--clay);outline-offset:2px}
.ov-in{padding:16px}
.ov-hint{margin:12px 2px 0;font-size:.8rem;color:var(--muted);text-align:center}
@media (max-width:900px){
  .hero.has-term{grid-template-columns:1fr;padding-left:22px;padding-right:22px}
  .term-body{height:240px}
}`;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var hero = document.querySelector('.hero'); if (!hero) return;
  var left = document.createElement('div'); left.className = 'hero-text';
  while (hero.firstChild) left.appendChild(hero.firstChild);
  hero.appendChild(left); hero.classList.add('has-term');

  var term = document.createElement('aside'); term.className = 'term';
  term.setAttribute('aria-label', 'Interactive terminal');
  term.innerHTML = '<div class="term-top"><i></i><i></i><i></i><span>rashid@portfolio ~ %</span></div>' +
    '<div class="term-body" role="log" aria-live="polite"></div>' +
    '<label class="term-in"><span>$</span><input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type a command, for example: work" placeholder="type: work"></label>';
  hero.appendChild(term);
  var body = term.querySelector('.term-body'), input = term.querySelector('input');

  var projects = [].slice.call(document.querySelectorAll('#work .card')).map(function (c, i) {
    return { n: i + 1, el: c, title: c.querySelector('h3').textContent.trim() };
  });

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function print(h, c) {
    var d = document.createElement('div'); d.className = 'ln ' + (c || ''); d.innerHTML = h;
    body.appendChild(d); body.scrollTop = body.scrollHeight;
  }
  function cmdLink(label, cmd) { return '<button class="lnk" data-cmd="' + esc(cmd) + '">' + esc(label) + '</button>'; }
  function go(id) { var s = document.getElementById(id); if (s) s.scrollIntoView({ behavior: 'smooth' }); }
  function list() {
    projects.forEach(function (p) { print('  [' + p.n + '] ' + cmdLink(p.title, 'open ' + p.n)); });
    print('Click one, or type: open 1', 'dim');
  }
  function find(a) {
    if (/^\d+$/.test(a)) return projects[+a - 1];
    for (var i = 0; i < projects.length; i++) if (projects[i].title.toLowerCase().indexOf(a) > -1) return projects[i];
  }

  /* Project viewer */
  var ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = '<div class="ov-box" role="dialog" aria-modal="true" aria-label="Project details">' +
    '<div class="ov-bar"><span class="ov-path"></span><button class="ov-x" aria-label="Close project">&times;</button></div>' +
    '<div class="ov-in"></div></div>';
  document.body.appendChild(ov);
  var box = ov.querySelector('.ov-box'), inner = ov.querySelector('.ov-in'),
      path = ov.querySelector('.ov-path'), xbtn = ov.querySelector('.ov-x'), opener = null;

  function openP(p) {
    opener = document.activeElement;
    inner.innerHTML = ''; inner.appendChild(p.el.cloneNode(true));
    var h = document.createElement('p'); h.className = 'ov-hint';
    h.textContent = 'Press Esc or click the x to go back to the site.'; inner.appendChild(h);
    path.textContent = '~/work/' + p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    ov.classList.add('on'); document.body.style.overflow = 'hidden'; box.scrollTop = 0; xbtn.focus();
  }
  function closeP() {
    if (!ov.classList.contains('on')) return;
    ov.classList.remove('on'); document.body.style.overflow = '';
    print('closed. Type another command, or keep scrolling.', 'dim');
    if (opener && opener.focus) opener.focus();
  }
  xbtn.addEventListener('click', closeP);
  ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeP(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeP();
    if (e.key === 'Tab' && ov.classList.contains('on')) {
      var f = [].slice.call(box.querySelectorAll('a[href],button')); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Commands */
  var names = ['help', 'work', 'projects', 'open', 'about', 'skills', 'experience', 'contact', 'github', 'linkedin', 'theme', 'clear'];
  function run(raw) {
    var parts = raw.trim().split(/\s+/), cmd = parts[0].toLowerCase(), arg = parts.slice(1).join(' ').toLowerCase();
    if (!cmd) return;
    print('<span class="ok">$</span> ' + esc(raw));
    switch (cmd) {
      case 'help':
        print('Commands:', 'hot');
        ['work       jump to my projects', 'projects   list them, then open one', 'open &lt;n|name&gt;   e.g. open zion pos',
         'about      who I am', 'skills     what I use', 'experience  where I have worked',
         'contact    get in touch', 'github  /  linkedin', 'theme      switch light / dark', 'clear      wipe this screen']
          .forEach(function (l) { print('  ' + l); });
        break;
      case 'work': go('work'); print('scrolling to my work...', 'ok'); print('Type projects to list them, or open 1.', 'dim'); break;
      case 'projects': case 'ls': list(); break;
      case 'open': case 'cat': case 'view':
        if (!arg) { print('open what? Try one of these:', 'hot'); list(); break; }
        var p = find(arg);
        if (!p) { print('no project matches "' + esc(arg) + '". Type projects.', 'hot'); break; }
        print('opening ' + esc(p.title) + '...', 'ok'); openP(p); break;
      case 'about': case 'skills': case 'experience': case 'contact':
        go(cmd); print('scrolling to ' + cmd + '...', 'ok'); break;
      case 'github': window.open('https://github.com/YoungDevelopa', '_blank', 'noopener'); print('opening GitHub...', 'ok'); break;
      case 'linkedin': window.open('https://www.linkedin.com/in/rashid-ongoma/', '_blank', 'noopener'); print('opening LinkedIn...', 'ok'); break;
      case 'theme':
        var r = document.documentElement,
            cur = r.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
        r.dataset.theme = cur === 'dark' ? 'light' : 'dark'; print('theme: ' + r.dataset.theme, 'ok'); break;
      case 'clear': body.innerHTML = ''; break;
      default: print('command not found: ' + esc(cmd) + '. Type help.', 'hot');
    }
  }

  var hist = [], hi = 0;
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var v = input.value; input.value = ''; if (v.trim()) { hist.push(v); hi = hist.length; } run(v); }
    else if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi]; }
    else if (e.key === 'ArrowDown' && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault(); var v2 = input.value.toLowerCase();
      var m = names.filter(function (n) { return v2 && n.indexOf(v2) === 0; }); if (m.length === 1) input.value = m[0];
    }
  });
  term.addEventListener('click', function (e) {
    var b = e.target.closest('.lnk');
    if (b) { run(b.getAttribute('data-cmd')); return; }
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  print('Welcome. This site has a command line.', 'ok');
  print('Type <b class="hot">work</b> and press Enter to see my projects,', '');
  print('or type help to see everything you can ask.', 'dim');
})();
