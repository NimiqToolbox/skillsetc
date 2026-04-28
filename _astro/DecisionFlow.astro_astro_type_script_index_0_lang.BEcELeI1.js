function o(e){return e.replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l])}function d(e){return o(e).replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")}function y(e,l){const i=e.options.map(s=>`
      <li>
        <button type="button" class="flow-option" data-flow-next="${o(s.next)}" data-flow-label="${o(s.label)}">
          <span class="flow-option-label">${o(s.label)}</span>
          ${s.description?`<span class="flow-option-desc">${d(s.description)}</span>`:""}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="flow-option-arrow" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </button>
      </li>
    `).join("");return`
      <article class="flow-card flow-question" data-flow-current data-node-id="${e.id}">
        <div class="flow-card-meta">
          <span class="flow-step">Step <span data-flow-step>${l}</span></span>
          <span class="flow-sep" aria-hidden="true">·</span>
          <span class="flow-kind">Question</span>
        </div>
        <h2 class="flow-question-title serif">${o(e.question)}</h2>
        ${e.subtitle?`<p class="flow-question-sub">${d(e.subtitle)}</p>`:""}
        <ul class="flow-options">${i}</ul>
      </article>
    `}function q(e,l){const i=e.details.map(s=>`<li>${d(s)}</li>`).join("");return`
      <article class="flow-card flow-result" data-flow-current data-node-id="${e.id}" data-accent="${e.accent}">
        <div class="flow-card-meta">
          <span class="flow-step">Step ${l}</span>
          <span class="flow-sep" aria-hidden="true">·</span>
          <span class="flow-result-meta">Recommendation</span>
        </div>
        <h2 class="flow-result-primitive serif">${o(e.primitive)}</h2>
        <p class="flow-result-tagline">${d(e.tagline)}</p>
        <ul class="flow-result-details">${i}</ul>
        <a href="${o(e.link.href)}" class="flow-result-cta">
          ${o(e.link.label)}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </a>
      </article>
    `}function w(){const e=document.querySelector("[data-flow-root]");if(!e||e.dataset.flowReady==="true")return;const l=document.getElementById("flow-tree-data");if(!l?.textContent)return;let i;try{i=JSON.parse(l.textContent)}catch{return}const s=e.querySelector("[data-flow-stage]"),h=e.querySelector("[data-flow-path]"),g=e.querySelector("[data-flow-back]"),k=e.querySelector("[data-flow-restart]");if(!s||!h||!g||!k)return;const $=s.querySelector("[data-node-id]")?.dataset.nodeId??Object.keys(i)[0],t={tree:i,startId:$,stack:[],currentId:$,stage:s,path:h,back:g,restart:k};function m(){if(t.stack.length===0){t.path.innerHTML="";return}t.path.innerHTML=t.stack.map((a,n)=>{const r=n<t.stack.length-1?'<span class="flow-path-sep" aria-hidden="true">›</span>':"";return`<button type="button" class="flow-path-item" data-flow-rewind="${n}">${o(a.chosen)}</button>${r}`}).join("")}function u(){const a=t.stack.length===0;t.back.hidden=a,t.restart.hidden=a,t.back.disabled=a}function f(){t.stage.querySelectorAll("[data-flow-next]").forEach(a=>{a.dataset.bound!=="1"&&(a.dataset.bound="1",a.addEventListener("click",()=>{const n=a.dataset.flowNext,r=a.dataset.flowLabel;n&&b(n,r)}))})}function b(a,n){const r=t.tree[a];if(!r)return;n&&t.currentId!==a&&t.tree[t.currentId]?.kind==="question"&&t.stack.push({nodeId:t.currentId,chosen:n}),t.currentId=a;const c=t.stack.length+1;t.stage.innerHTML=r.kind==="question"?y(r,c):q(r,c),f(),m(),u(),requestAnimationFrame(()=>{t.stage.scrollIntoView({behavior:"smooth",block:"nearest"})})}function v(a){if(a<0||a>t.stack.length)return;const r=t.stack[a]?.nodeId??t.startId;t.stack=t.stack.slice(0,a),t.currentId=r;const c=t.tree[r],p=t.stack.length+1;c&&(t.stage.innerHTML=c.kind==="question"?y(c,p):q(c,p),f(),m(),u())}t.path.addEventListener("click",a=>{const n=a.target.closest("[data-flow-rewind]");n?.dataset.flowRewind&&v(parseInt(n.dataset.flowRewind,10))}),t.back.addEventListener("click",()=>{t.stack.length!==0&&v(t.stack.length-1)}),t.restart.addEventListener("click",()=>{t.stack=[],b(t.startId)}),f(),u(),e.dataset.flowReady="true"}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",w,{once:!0}):w();document.addEventListener("astro:page-load",w);
