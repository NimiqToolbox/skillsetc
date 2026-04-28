// Adds copy-to-clipboard buttons to every code block in MDX articles.
// Idempotent — safe to call on every page navigation.

function ensureCopyButton(pre: HTMLPreElement) {
  if (pre.parentElement?.classList.contains('code-figure')) {
    // Already wrapped (e.g., by CodeBlock.astro) — just ensure a button exists.
    return;
  }
  const figure = document.createElement('figure');
  figure.className = 'code-figure';
  pre.replaceWith(figure);
  figure.appendChild(pre);

  // Language pill
  const lang = Array.from(pre.classList).find((c) => c.startsWith('language-')) ??
               pre.querySelector('code')?.className.match(/language-(\S+)/)?.[0] ??
               '';
  if (lang) {
    const langName = lang.replace('language-', '');
    if (langName && langName !== 'plaintext' && langName !== 'text') {
      const pill = document.createElement('span');
      pill.className = 'code-lang';
      pill.textContent = langName;
      figure.appendChild(pill);
    }
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-btn';
  btn.setAttribute('aria-label', 'Copy code');
  btn.dataset.copyCode = '';
  btn.innerHTML = `
    <svg class="copy-icon-default" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
    <svg class="copy-icon-success" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style="display:none">
      <path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  `;
  figure.appendChild(btn);
}

export function setupCodeBlocks() {
  const pres = document.querySelectorAll<HTMLPreElement>('pre.astro-code');
  pres.forEach(ensureCopyButton);

  document.querySelectorAll<HTMLButtonElement>('[data-copy-code]').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      const figure = btn.closest('.code-figure');
      const pre = figure?.querySelector('pre');
      const text = pre?.innerText.replace(/\s+$/, '') ?? '';
      try {
        await navigator.clipboard.writeText(text);
        btn.dataset.copied = 'true';
        const def = btn.querySelector<HTMLElement>('.copy-icon-default');
        const ok  = btn.querySelector<HTMLElement>('.copy-icon-success');
        if (def && ok) { def.style.display = 'none'; ok.style.display = 'inline'; }
        setTimeout(() => {
          btn.dataset.copied = 'false';
          if (def && ok) { def.style.display = 'inline'; ok.style.display = 'none'; }
        }, 1400);
      } catch {
        /* clipboard blocked — silently ignore */
      }
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setupCodeBlocks);
  document.addEventListener('astro:after-swap', setupCodeBlocks);
}
