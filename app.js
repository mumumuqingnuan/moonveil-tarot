import {setupInstall} from './install.js';
import {deck,spreads,suits,randomInt,shuffleDeck,getReading,summarize} from './data.js';
import {AmbientMusic} from './music.js';
import {RitualEffects,fitFormation} from './effects.js';
import {createReadingSnapshot,readingDate} from './snapshot.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={music:'<path d="M9 18V5l12-2v13M9 8l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',mute:'<path d="M11 5 6 9H3v6h3l5 4V5ZM17 9l5 6m0-6-5 6"/>',book:'<path d="M3 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-3H3V3Zm18 0h-4a4 4 0 0 0-4 4v14a4 4 0 0 1 4-3h4V3Z"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m0 3h.01"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',chevron:'<path d="m9 5 7 7-7 7"/>',shuffle:'<path d="m18 3 3 3-3 3m0 6 3 3-3 3M3 6h3c5 0 7 12 12 12h3M3 18h3c2 0 4-3 5-6m3-4c1-1 2-2 4-2h3"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',restart:'<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',check:'<path d="m5 12 4 4L19 6"/>'};
const icon=(name)=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.spark}</svg>`;
const audio=new AmbientMusic();
const state={spread:'time',phase:'ready',question:'',a:'',b:'',date:null,immersive:false,reversals:true,pile:[],drawn:[],revealed:new Set(),busy:false,shuffleStage:0,art:{},galleryFilter:'all',musicTouched:false};
let shuffleTimers=[];let galleryReturn=false;
let exportAsset=null,exportRequest=0,nativeFullscreen=false,returnScroll=0,revealTimer=0,revealFlipTimer=0,revealFx=null,revealIndex=null,queuedReveal=null;
icons.expand='<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>';
icons.collapse='<path d="M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5"/>';
icons.download='<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>';
const selected=()=>spreads.find(s=>s.id===state.spread);
const facePath=c=>state.art[c.id]||`./assets/cards/${c.id.replace(/-(\d+)$/,(_,n)=>'-'+n.padStart(2,'0'))}.webp`;
const cardBack=()=>'<img src="./assets/card-back.webp" alt="" draggable="false" width="200" height="300">';
const getCard=id=>deck.find(c=>c.id===id);
const roman=n=>['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'][n];

$('#app').innerHTML=`
 <div class="site-shell">
 <header class="topbar"><a class="brand" href="./" aria-label="月隐塔罗首页"><span class="brand-moon">☽</span><span><strong>月隐塔罗</strong><small>MOONVEIL TAROT</small></span></a>
 <nav class="top-actions" aria-label="工具"><button class="tool-button" id="musicToggle" aria-label="开启音乐" aria-pressed="false">${icon('music')}<span>开启音乐</span></button><button class="tool-button icon-mobile" data-action="music-settings" aria-label="音乐设置"><span class="equalizer"><i></i><i></i><i></i></span><span>音境</span></button><span class="nav-separator"></span><button class="tool-button" data-action="gallery" aria-label="浏览塔罗牌典">${icon('book')}<span>牌典</span></button><button class="tool-button icon-only" data-action="guide" aria-label="玩法指引">${icon('help')}</button></nav></header>
 <main>
 <div class="workspace">
 <aside class="reading-setup" aria-label="占卜设置">
 <div class="section-kicker"><span></span> 一次与自己的对话</div>
 <h1>心有一问，<br><em>牌有回响。</em></h1>
 <div class="setup-step"><label class="field-label"><span>01</span> 选择牌阵</label><button id="spreadPicker" class="spread-picker" data-action="spreads"><span id="spreadMini" class="spread-mini"></span><span class="spread-picker-copy"><strong id="selectedName"></strong><small id="selectedMeta"></small></span>${icon('chevron')}</button></div>
 <div class="setup-step"><label class="field-label" for="question"><span>02</span> 写下你的问题 <small>可留空</small></label><textarea id="question" maxlength="180" rows="3" placeholder="此刻，什么最值得我留意？"></textarea><div id="choiceInputs" class="choice-inputs" hidden><label>选项 A<input id="optionA" maxlength="50" placeholder="例如：留在当前岗位"></label><label>选项 B<input id="optionB" maxlength="50" placeholder="例如：尝试新的机会"></label></div><p class="input-hint">也可以只在心里默念。</p></div>
 <div class="orientation-control"><div><label for="reversal">开启逆位</label><small>同时探索牌意的另一面</small></div><label class="switch"><input id="reversal" type="checkbox" checked><span></span></label></div>
 <div class="deck-note"><span class="tiny-star">✧</span><div><strong>经典韦特 · 完整 78 张</strong><small>22 张大阿尔卡那 / 56 张小阿尔卡那</small></div></div>
 <p class="quiet-note">让牌面成为观察的线索，<br>把选择留在自己手中。</p>
 </aside>
 <section class="reading-space" aria-label="塔罗牌桌">
 <canvas id="ritualFX" class="ritual-fx" aria-hidden="true"></canvas>
 <div class="table-heading"><div><div id="spreadEnglish" class="eyebrow"></div><h2 id="tableTitle"></h2><p id="tableDescription"></p></div><div class="table-toolbar"><span id="phaseBadge" class="phase-badge">静心时刻</span><button id="tableMusic" class="table-tool fullscreen-only" data-action="toggle-music" aria-label="开启背景音乐">${icon('music')}</button><button id="fullscreenToggle" class="table-tool" data-action="fullscreen" aria-label="全屏牌阵" aria-pressed="false">${icon('expand')}<span>全屏牌阵</span></button></div></div>
 <p id="tableQuestion" class="table-question" hidden></p>
 <div class="ritual-steps" aria-label="占卜步骤"><span data-step="0" class="active"><b>1</b> 静心</span><i></i><span data-step="1"><b>2</b> 洗牌</span><i></i><span data-step="2"><b>3</b> 抽牌</span><i></i><span data-step="3"><b>4</b> 解读</span></div>
 <div class="table-surface"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="table-star star-one">✦</span><span class="table-star star-two">✧</span><span class="table-star star-three">✧</span><div id="cardTable" class="card-table"></div><div id="shuffleScene" class="shuffle-scene" hidden><div class="shuffle-stack">${Array.from({length:7},(_,i)=>`<div class="shuffle-card" style="--i:${i}">${cardBack()}</div>`).join('')}</div><h3 id="shuffleMessage">将杂念轻轻放下</h3><p>深呼吸，让每一张牌重新相遇</p></div></div>
 <div id="ritualControls" class="ritual-controls"></div>
 <div id="drawArea" class="draw-area" hidden><div class="draw-header"><span id="drawPrompt"></span><small>左右滑动牌堆，自由选择</small></div><div id="drawPile" class="draw-pile" aria-label="洗好的78张牌"></div></div>
 <p id="liveStatus" class="live-status" role="status" aria-live="polite"></p>
 </section>
 </div>
 <section id="readingResults" class="reading-results" hidden aria-label="占卜解读"></section>
 </main>
 <footer class="footer"><span>MOONVEIL <i>✦</i> TAROT</span><p>牌面是象征与自我探索的线索，不是确定的预言。</p><button data-action="credits">牌面与音乐</button></footer>
 </div>
 <dialog id="mainDialog" class="main-dialog"><div class="dialog-top"><span id="dialogEyebrow" class="eyebrow"></span><button class="close-button" data-action="close" aria-label="关闭">${icon('close')}</button></div><div id="dialogContent"></div></dialog>
 <dialog id="revealDialog" class="reveal-dialog" aria-label="翻开塔罗牌"></dialog>
 <div id="toast" class="toast" role="status"></div>`;

const effects=new RitualEffects($('#ritualFX'));
const stageObserver=new ResizeObserver(()=>fitStage());stageObserver.observe($('.table-surface'));

function miniSpread(s){return `<span class="mini-layout">${s.positions.map((p,i)=>`<i style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%) rotate(${p.angle}deg)"></i>`).join('')}</span>`;}
function showToast(msg){$('#toast').textContent=msg;$('#toast').classList.add('shown');setTimeout(()=>$('#toast').classList.remove('shown'),3500);}
function setStep(step){document.querySelectorAll('[data-step]').forEach((n,i)=>{n.classList.toggle('active',i===step);n.classList.toggle('done',i<step);});}
function updateSettings(){const s=selected();$('#selectedName').textContent=s.name;$('#selectedMeta').textContent=`${s.count} 张牌 · ${s.category}探索`;$('#spreadMini').innerHTML=miniSpread(s);$('#spreadEnglish').textContent=s.en;$('#tableTitle').textContent=s.name;$('#tableDescription').textContent=s.desc;$('#choiceInputs').hidden=s.id!=='choice';}
function positionLabel(p){let label=p.label;if(state.spread==='choice'){if(label.startsWith('A ')&&state.a.trim())label=label.replace('A ',`A「${state.a.trim()}」`);if(label.startsWith('B ')&&state.b.trim())label=label.replace('B ',`B「${state.b.trim()}」`);}return label;}
function slotHTML(p,i){const d=state.drawn[i],revealed=state.revealed.has(i),c=d?getCard(d.id):null;return `<div class="card-position ${d?'occupied':''} ${revealed?'is-revealed':''} ${state.spread==='celtic'&&i===1?'crossing':''}" style="--x:${p.x};--y:${p.y};--angle:${p.angle}deg;--order:${i}"><button class="tarot-card ${revealed?'flipped':''} ${d?'dealt':''}" data-action="flip" data-index="${i}" aria-label="${revealed?`查看${c.name}${d.reversed?'逆位':'正位'}解读`:d?`翻开第 ${i+1} 张牌，${esc(p.label)}`:`第 ${i+1} 张牌位，${esc(p.label)}`}" ${!d?'disabled':''}><span class="card-rotator"><span class="card-face card-back">${cardBack()}<span class="slot-number">${String(i+1).padStart(2,'0')}</span></span><span class="card-face card-front">${c?`<img src="${facePath(c)}" alt="${esc(c.name)}牌面" class="${d.reversed?'reversed-image':''}" width="300" height="520"><span class="card-title">${esc(c.name)}<small>${d.reversed?'逆位':'正位'}</small></span>`:''}</span></span></button><span class="position-label"><b>${i+1}</b> ${esc(p.label)}</span>${revealed?`<span class="under-card-name">${esc(c.name)} · ${d.reversed?'逆位':'正位'}</span>`:''}</div>`;}
function renderTable(){const s=selected();$('#cardTable').className=`card-table layout-${s.layout} phase-${state.phase}`;$('#cardTable').innerHTML=s.positions.map(slotHTML).join('');requestAnimationFrame(fitStage);}
function renderControls(){
 const s=selected();let html='';
 if(state.phase==='ready')html=`<p class="ritual-instruction">想一想你的问题，让呼吸慢下来。</p><button class="primary-button" data-action="start">${icon('shuffle')} 静心，开始洗牌 ${icon('arrow')}</button><span class="control-footnote">洗牌后，亲手选出你的 ${s.count} 张牌</span>`;
 if(state.phase==='shuffling')html='<div class="shuffle-progress"><span></span></div>';
 if(state.phase==='drawing')html=`<p class="ritual-instruction">下一张 · <strong>${esc(s.positions[state.drawn.length]?.label||'')}</strong></p><span class="picked-count">已选 <b>${state.drawn.length}</b> / ${s.count}</span>`;
 if(state.phase==='revealing')html=`<p class="ritual-instruction">牌已落定。点击牌面，逐张揭开。</p><button class="primary-button secondary" data-action="reveal-all">${icon('spark')} 全部翻开</button>`;
 if(state.phase==='complete')html=`<p class="ritual-instruction">${s.count} 张牌，组成这一次的故事。</p><div class="button-pair"><button class="primary-button" data-action="results">阅读完整解读 ${icon('arrow')}</button><button class="primary-button secondary" data-action="export">${icon('download')} 保存图片</button><button class="text-button" data-action="new">${icon('restart')} 再占卜一次</button></div>`;
 $('#ritualControls').innerHTML=html;
 const labels={ready:'静心时刻',shuffling:'正在洗牌',drawing:`抽牌 ${state.drawn.length} / ${s.count}`,revealing:'等待揭晓',complete:'牌意已呈现'};
 $('#phaseBadge').textContent=labels[state.phase];$('.reading-space').dataset.phase=state.phase;requestAnimationFrame(fitStage);
 const locked=state.phase!=='ready';['question','optionA','optionB','reversal','spreadPicker'].forEach(id=>$('#'+id).disabled=locked);
}
async function startReading(){
 if(state.phase!=='ready')return;state.question=$('#question').value.trim();state.a=$('#optionA').value.trim();state.b=$('#optionB').value.trim();state.reversals=$('#reversal').checked;
 state.date=new Date().toISOString();clearExport();setImmersive(true,true);state.phase='shuffling';state.drawn=[];state.revealed.clear();state.pile=shuffleDeck();setStep(1);renderControls();$('#cardTable').hidden=true;$('#shuffleScene').hidden=false;effects.setMode('shuffling');
 $('#liveStatus').textContent='正在洗牌，请稍候。';
 if(!state.musicTouched){try{await audio.start();updateMusic();}catch{showToast('音乐暂未开启，可以稍后点击右上角重试。');}}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 shuffleTimers.forEach(clearTimeout);shuffleTimers=[];
 if(!reduced){shuffleTimers.push(setTimeout(()=>$('#shuffleMessage').textContent='把问题轻轻放在心里',1000));shuffleTimers.push(setTimeout(()=>$('#shuffleMessage').textContent='牌已洗好，等待你的选择',2200));}
 shuffleTimers.push(setTimeout(()=>{state.phase='drawing';effects.setMode('idle');effects.burst();$('#shuffleScene').hidden=true;$('#cardTable').hidden=false;$('#drawArea').hidden=false;setStep(2);renderTable();renderControls();renderPile();$('#liveStatus').textContent=`洗牌完成，请从牌堆选出 ${selected().count} 张牌。`;if(!state.immersive)$('#drawArea').scrollIntoView({behavior:reduced?'instant':'smooth',block:'nearest'});},reduced?500:3200));
}
function renderPile(){const s=selected();$('#drawPrompt').textContent=`随心选一张 · 还需 ${s.count-state.drawn.length} 张`;$('#drawPile').innerHTML=state.pile.map((id,i)=>`<button class="pile-card" data-action="draw" data-pile="${i}" style="--r:${Math.sin(i*.7)*4}deg" aria-label="选择牌堆中的第 ${i+1} 张牌">${cardBack()}</button>`).join('');}
function drawCard(index,button){if(state.phase!=='drawing'||state.busy||!Number.isInteger(index)||!state.pile[index])return;state.busy=true;const scroll=$('#drawPile').scrollLeft;const chosen=state.pile[index];state.drawn.push({id:chosen,reversed:state.reversals&&randomInt(2)===1});state.pile.splice(index,1);audio.chime(state.drawn.length-1);button.classList.add('chosen');burstAt(button,34);
 setTimeout(()=>{const finished=state.drawn.length===selected().count;if(finished){state.phase='revealing';$('#drawArea').hidden=true;$('#liveStatus').textContent='选牌完成，点击牌面或“全部翻开”查看结果。';}else{$('#liveStatus').textContent=`已选 ${state.drawn.length} 张，下一张是${selected().positions[state.drawn.length].label}。`;renderPile();$('#drawPile').scrollLeft=scroll;}
 renderTable();renderControls();state.busy=false;if(finished){if(!state.immersive)$('.table-heading').scrollIntoView({behavior:'smooth',block:'start'});$('#cardTable .tarot-card').focus({preventScroll:true});}else{const next=$('#drawPile').children[Math.min(index,state.pile.length-1)];next?.focus({preventScroll:true});}},240);
}
function flipCard(i){if(!state.drawn[i]||!['revealing','complete'].includes(state.phase))return;if(state.revealed.has(i)){showCard(state.drawn[i],i);return;}state.revealed.add(i);audio.chime(i);const old=$(`[data-action="flip"][data-index="${i}"]`);old.classList.add('flipped');old.closest('.card-position').classList.add('reveal-glow');setTimeout(()=>old.closest('.card-position')?.classList.remove('reveal-glow'),1800);burstAt(old,52);old.setAttribute('aria-label',`查看${getCard(state.drawn[i].id).name}解读`);old.closest('.card-position').classList.add('is-revealed');
 const d=state.drawn[i],c=getCard(d.id);const name=document.createElement('span');name.className='under-card-name';name.textContent=`${c.name} · ${d.reversed?'逆位':'正位'}`;old.closest('.card-position').append(name);
 $('#liveStatus').textContent=`${selected().positions[i].label}：${c.name}，${d.reversed?'逆位':'正位'}。`;
 if(state.revealed.size===selected().count){state.phase='complete';setStep(3);renderControls();renderResults();}
}
function revealAll(){if(state.phase!=='revealing'||state.busy)return;state.busy=true;const remaining=state.drawn.map((_,i)=>i).filter(i=>!state.revealed.has(i));remaining.forEach((i,j)=>setTimeout(()=>{if(!state.revealed.has(i))flipCard(i);if(j===remaining.length-1)state.busy=false;},j*480));}
function renderResults(){const s=selected(),summary=summarize(state.drawn,s);$('#readingResults').hidden=false;$('#readingResults').innerHTML=`<div class="results-heading"><div class="result-save-bar"><span class="reading-date">${esc(readingDate(state.date))}</span><button class="primary-button secondary" data-action="export">${icon('download')} 保存结果图片</button></div><span class="section-kicker">THE READING</span><h2>这一次，牌想与你说</h2><p>${state.question?`「${esc(state.question)}」`:'留意与你当下经验产生共鸣的部分。'}</p></div><div class="summary-panel"><div class="summary-emblem">✧</div><div><h3>把这些牌放在一起看</h3><p>${summary.theme}</p><p>${summary.orientation}</p><div class="takeaway"><span>一句话建议</span><strong>${summary.advice}</strong><small>来自「${esc(summary.position)}」的${esc(summary.anchor)}牌</small></div></div></div><div class="result-grid">${state.drawn.map((d,i)=>{const c=getCard(d.id),r=getReading(c,d.reversed);return `<article class="result-card"><button class="result-art" data-action="detail" data-index="${i}" aria-label="放大查看${c.name}"><img src="${facePath(c)}" alt="${c.name}牌面" class="${d.reversed?'reversed-image':''}" loading="lazy" width="300" height="520"></button><div class="result-copy"><div class="result-position">${String(i+1).padStart(2,'0')} <span>${esc(positionLabel(s.positions[i]))}</span></div><h3>${c.name}<small class="orientation-tag ${d.reversed?'is-reversed':''}">${d.reversed?'逆位':'正位'}</small></h3><div class="keywords">${r.keywords}</div><p>${r.meaning}</p><details><summary>放在这个牌位，如何理解？</summary><p>${esc(s.positions[i].prompt)}</p><p class="action-advice">${r.advice}</p></details></div></article>`;}).join('')}</div><div class="results-end"><p>牌面提供一个角度，你仍然可以选择不同的下一步。</p><div class="button-pair"><button class="primary-button" data-action="export">${icon('download')} 保存结果图片</button><button class="primary-button secondary" data-action="new">${icon('shuffle')} 开启下一次占卜</button></div></div>`;}
function resetReading(){if(state.phase==='shuffling'||state.busy)return;setImmersive(false);clearExport();state.date=null;state.phase='ready';state.pile=[];state.drawn=[];state.revealed.clear();$('#readingResults').hidden=true;$('#drawArea').hidden=true;$('#shuffleScene').hidden=true;$('#cardTable').hidden=false;$('#shuffleMessage').textContent='将杂念轻轻放下';$('#liveStatus').textContent='可以调整问题与牌阵，下一次抽牌会重新洗牌。';setStep(0);renderTable();renderControls();window.scrollTo({top:0,behavior:'smooth'});}
function openDialog(eyebrow,html,kind=''){const dialog=$('#mainDialog');dialog.className=`main-dialog ${kind}`;$('#dialogEyebrow').textContent=eyebrow;$('#dialogContent').innerHTML=html;if(!dialog.open)dialog.showModal();}
function showSpreads(){if(state.phase!=='ready')return;openDialog('CHOOSE YOUR SPREAD',`<h2>选一副适合此刻的牌阵</h2><p class="dialog-intro">从一个简单的问题开始，也可以探索更完整的脉络。</p><div class="spread-grid">${spreads.map(s=>`<button class="spread-option ${state.spread===s.id?'selected':''}" data-action="select-spread" data-id="${s.id}"><div class="spread-option-top"><span>${s.category}</span><small>${s.count} 张牌</small></div><div class="spread-diagram">${miniSpread(s)}</div><div class="spread-name"><h3>${s.name}</h3>${state.spread===s.id?icon('check'):''}</div><p>${s.desc}</p></button>`).join('')}</div>`,'spreads-dialog');}
function showGallery(){galleryReturn=true;openDialog('THE 78 ARCHETYPES',`<h2>韦特牌典</h2><p class="dialog-intro">轻触牌面，阅读它的正位与逆位含义。</p><div class="gallery-filters" role="group" aria-label="牌组分类">${[['all','全部 78'],['major','大阿尔卡那'],['wands','权杖'],['cups','圣杯'],['swords','宝剑'],['pentacles','星币']].map(([v,l])=>`<button data-action="filter" data-id="${v}" class="${state.galleryFilter===v?'active':''}" aria-pressed="${state.galleryFilter===v}">${l}</button>`).join('')}</div><div id="galleryGrid" class="gallery-grid"></div>`,'gallery-dialog');renderGallery();}
function renderGallery(){const cards=deck.filter(c=>state.galleryFilter==='all'||c.suit===state.galleryFilter);$('#galleryGrid').innerHTML=cards.map(c=>`<button class="gallery-card" data-action="gallery-card" data-id="${c.id}"><img src="${facePath(c)}" alt="${c.name}牌面" loading="lazy" width="300" height="520"><strong>${c.name}</strong><small>${c.suit==='major'?roman(c.number):suits[c.suit].element+'元素'}</small></button>`).join('');}
function showCard(d,i,fromGallery=false){galleryReturn=fromGallery;const c=getCard(d.id),p=selected().positions[i];openDialog(c.en.toUpperCase(),`<div class="card-detail"><div class="detail-image"><img src="${facePath(c)}" alt="${c.name}牌面" class="${!fromGallery&&d.reversed?'reversed-image':''}" width="450" height="780"></div><div class="detail-text">${fromGallery?'<button class="text-button back-gallery" data-action="gallery">‹ 返回牌典</button>':`<span class="result-position">${i+1} · ${esc(positionLabel(p))}</span>`}<h2>${c.name}</h2><p class="detail-family">${c.suit==='major'?`大阿尔卡那 · ${roman(c.number)}`:suits[c.suit].name+' · '+suits[c.suit].theme}</p>${(fromGallery?['up','down']:[d.reversed?'down':'up']).map(side=>`<section><h3>${side==='up'?'正位':'逆位'} <span>${c[side].keywords}</span></h3><p>${c[side].meaning}</p><div class="detail-advice">${c[side].advice}</div></section>`).join('')}${!fromGallery?`<section class="position-reading"><h3>在「${esc(positionLabel(p))}」的位置</h3><p>${esc(p.prompt)}</p></section>`:''}</div></div>`,'card-dialog');}
function showGuide(){openDialog('A SMALL RITUAL',`<h2>慢一点，跟随你的直觉</h2><ol class="guide-list"><li><span>01</span><div><h3>选择牌阵，想一个问题</h3><p>第一次可以从「单牌指引」或「时间之流」开始。比起“会不会”，试着问“我可以留意什么”。</p></div></li><li><span>02</span><div><h3>洗牌，让注意力回到此刻</h3><p>每一轮都会重新洗好完整的 78 张牌。一轮内不会重复抽到同一张牌。</p></div></li><li><span>03</span><div><h3>选牌，再逐张翻开</h3><p>左右滑动牌堆，选择让你想停下的那一张。选齐后轻触牌面，也可以一次全部翻开。</p></div></li><li><span>04</span><div><h3>结合位置，读懂不同侧面</h3><p>逆位并不等于坏运气。它也可能提示某种能量被压抑、过度使用，或需要向内观察。</p></div></li></ol><p class="guide-note">凯尔特十字的第二张牌会横放；横放是牌阵结构，正逆位以牌上的文字标记为准。</p><p class="guide-note">解读依据传统牌义与牌位整理，用于娱乐和自我探索；它不能读取他人的真实想法，也不决定你的未来。</p>`,'guide-dialog');}
function showMusicSettings(){openDialog('SOUNDS OF STILLNESS',`<h2>为此刻，选一片音境</h2><p class="dialog-intro">柔和的和声、钟音与长长的回响。</p><div class="sound-options">${[['moon','月光颂钵','缓缓铺开的和弦与低声颂钵'],['stars','星海回声','轻盈的拨弦与细碎钟音'],['forest','夜林微风','低沉、舒缓的冥想旋律']].map(([id,n,d])=>`<button data-action="theme" data-id="${id}" class="sound-option ${audio.theme===id?'active':''}" aria-pressed="${audio.theme===id}"><span class="sound-symbol">${id==='moon'?'☽':id==='stars'?'✧':'≈'}</span><span><strong>${n}</strong><small>${d}</small></span>${audio.theme===id?icon('check'):''}</button>`).join('')}</div><label class="volume-control" for="volume"><span>音量</span><input id="volume" type="range" min="0" max="100" value="${Math.round(audio.volume*100)}"><output id="volumeValue">${Math.round(audio.volume*100)}%</output></label><button class="primary-button sound-play" data-action="toggle-music">${icon(audio.playing?'mute':'music')} ${audio.playing?'暂停音乐':'播放音乐'}</button>`,'music-dialog');}
function updateMusic(){const el=$('#musicToggle');el.innerHTML=icon(audio.playing?'music':'mute')+`<span>${audio.playing?'音乐已开启':'开启音乐'}</span>`;el.setAttribute('aria-label',audio.playing?'暂停背景音乐':'开启背景音乐');el.setAttribute('aria-pressed',String(audio.playing));document.body.classList.toggle('music-playing',audio.playing);$('#tableMusic').innerHTML=icon(audio.playing?'music':'mute');$('#tableMusic').setAttribute('aria-label',audio.playing?'暂停背景音乐':'开启背景音乐');}
async function toggleMusic(){state.musicTouched=true;try{if(audio.playing)audio.stop();else await audio.start();updateMusic();if($('#mainDialog').open&&$('#mainDialog').classList.contains('music-dialog'))showMusicSettings();}catch{showToast('暂时无法播放音乐，请再次点击或换一个浏览器试试。');}}
function showCredits(){openDialog('ART & SOUND',`<h2>牌面与音乐</h2><div class="credits-copy"><h3>经典韦特塔罗 · Rider–Waite–Smith</h3><p>牌面绘画：Pamela Colman Smith，1909 年。采用 Wikimedia Commons 收录的经典早期版扫描，保留原作的线条、色彩与象征。</p><p><a href="https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC)" target="_blank" rel="noopener noreferrer">查看原作来源 ↗</a></p><h3>月隐牌背</h3><p>以月相、星芒与金色纹饰组成的月隐专属牌背。</p><h3>空灵音境</h3><p>三组原创和声编配，以柔和钟音、颂钵音色与空间回响连续演奏。开启或切换音乐后，会从新的乐句开始。</p><h3>关于解读</h3><p>78 张牌均包含独立的正逆位释义，结合当前牌位提供思考线索。问题只在这次页面中使用，不会发送给其他人。</p></div>`,'guide-dialog');}

function fitStage(){
 const table=$('#cardTable');if(!table)return;
 if(!state.immersive){table.classList.remove('small-stage');table.style.removeProperty('--card-w');table.querySelectorAll('.card-position').forEach(p=>{p.style.removeProperty('left');p.style.removeProperty('top');});return;}
 const box=$('.table-surface').getBoundingClientRect();if(box.width<30||box.height<60)return;
 table.classList.toggle('small-stage',box.height<300);const fit=fitFormation(selected().positions,box.width,box.height,window.innerWidth<600);table.style.setProperty('--card-w',`${fit.cardWidth}px`);
 table.querySelectorAll('.card-position').forEach((p,i)=>{p.style.left=fit.positions[i].x+'px';p.style.top=fit.positions[i].y+'px';});
}
async function setImmersive(on,native=false){
 if(on&&!state.immersive)returnScroll=window.scrollY;
 state.immersive=on;document.body.classList.toggle('play-fullscreen',on);
 for(const selector of ['.topbar','.reading-setup','.footer','#readingResults'])$(selector).inert=on;
 const b=$('#fullscreenToggle');b.innerHTML=icon(on?'collapse':'expand')+`<span>${on?'退出全屏':'全屏牌阵'}</span>`;b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'退出全屏牌阵':'全屏牌阵');
 const question=state.phase==='ready'?$('#question').value.trim():state.question;$('#tableQuestion').textContent=question?`「${question}」`:'';$('#tableQuestion').hidden=!question||!on;
 requestAnimationFrame(()=>{fitStage();effects.resize();});
 if(on&&native&&!document.fullscreenElement&&document.documentElement.requestFullscreen){try{await document.documentElement.requestFullscreen();nativeFullscreen=true;}catch{/* The viewport mode remains available on phones and embedded browsers. */}}
 if(!on){if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}window.scrollTo({top:returnScroll,behavior:'instant'});requestAnimationFrame(fitStage);}
}
async function showResults(){await setImmersive(false);$('#readingResults').scrollIntoView({behavior:'smooth',block:'start'});}
function burstAt(element,count){const r=element.getBoundingClientRect(),base=$('#ritualFX').getBoundingClientRect();effects.burst(r.left-base.left+r.width/2,r.top-base.top+r.height/2,count);}
function openReveal(i){
 if(state.busy||!state.drawn[i]||!['revealing','complete'].includes(state.phase))return;
 if(state.revealed.has(i)){showCard(state.drawn[i],i);return;}
 state.busy=true;revealIndex=i;const d=state.drawn[i],c=getCard(d.id),r=getReading(c,d.reversed),dialog=$('#revealDialog');
 dialog.innerHTML=`<canvas id="revealFX" class="reveal-fx" aria-hidden="true"></canvas><div class="reveal-content"><span class="eyebrow">${i+1} / ${selected().count} · ${esc(selected().positions[i].label)}</span><div class="reveal-aura"></div><div class="reveal-card tarot-card" style="--angle:0deg"><span class="card-rotator"><span class="card-face card-back">${cardBack()}</span><span class="card-face card-front"><img src="${facePath(c)}" alt="${c.name}牌面" class="${d.reversed?'reversed-image':''}"><span class="card-title">${c.name}<small>${d.reversed?'逆位':'正位'}</small></span></span></div><div class="reveal-caption"><h2>${c.name}<small>${d.reversed?'逆位':'正位'}</small></h2><p>${r.keywords}</p></div><div class="reveal-actions"><button class="primary-button" data-action="reveal-close" disabled>放回牌阵</button>${state.revealed.size+1<selected().count?'<button class="text-button" data-action="reveal-next" disabled>继续翻开下一张 →</button>':''}</div></div>`;
 dialog.showModal();revealFx=new RitualEffects($('#revealFX'));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 revealFlipTimer=setTimeout(()=>{dialog.querySelector('.reveal-card').classList.add('flipped');dialog.querySelector('.reveal-content').classList.add('unveiled');if(!state.revealed.has(i))flipCard(i);revealFx?.burst(undefined,undefined,90);},reduced?0:450);
 revealTimer=setTimeout(()=>{dialog.querySelectorAll('button').forEach(b=>b.disabled=false);dialog.querySelector('[data-action="reveal-close"]').focus({preventScroll:true});},reduced?20:1250);
}
function finishReveal(){
 clearTimeout(revealTimer);clearTimeout(revealFlipTimer);revealFx?.destroy();revealFx=null;
 if(revealIndex!==null&&!state.revealed.has(revealIndex))flipCard(revealIndex);
 revealIndex=null;state.busy=false;if(queuedReveal!==null){const next=queuedReveal;queuedReveal=null;setTimeout(()=>openReveal(next),60);}
}
function clearExport(){exportRequest++;if(exportAsset?.url)URL.revokeObjectURL(exportAsset.url);exportAsset=null;}
function snapshotDialog(){
 const a=exportAsset;if(!a)return;
 const canSave=typeof File!=='undefined'&&navigator.canShare?.({files:[new File([a.blob],a.filename,{type:'image/png'})]});
 openDialog('KEEP THIS MOMENT',`<h2>保存这一次的答案</h2><p class="dialog-intro">已包含日期、问题、牌面、完整解读和一句话建议。</p><div class="snapshot-actions"><a class="primary-button" href="${a.url}" download="${esc(a.filename)}">${icon('download')} 下载图片</a>${canSave?'<button class="primary-button secondary" data-action="save-system">打开系统保存</button>':''}</div><p class="snapshot-tip">iPhone / iPad 也可以长按下方图片，选择“存储到照片”。</p><img class="snapshot-preview" src="${a.url}" alt="${esc(selected().name)}占卜结果长图，含日期、问题、答案及一句话建议"><p class="snapshot-tip">${a.width} × ${a.height} · PNG 图片</p>`,'snapshot-dialog');
}
async function exportReading(){
 if(state.phase!=='complete')return;await setImmersive(false);
 if(exportAsset){snapshotDialog();return;}
 const request=++exportRequest;openDialog('KEEP THIS MOMENT','<h2>正在整理你的答案</h2><p class="dialog-intro">正在把牌面和解读排成一张完整图片…</p><div class="export-loading" aria-label="正在制作图片"></div>','snapshot-dialog');
 const record={date:state.date,question:state.question,a:state.a,b:state.b,spread:selected(),drawn:state.drawn.map(x=>({...x})),facePath};
 try{const result=await createReadingSnapshot(record);if(request!==exportRequest)return;exportAsset={blob:result.blob,width:result.width,height:result.height,filename:result.filename,url:URL.createObjectURL(result.blob)};if($('#mainDialog').open&&$('#mainDialog').classList.contains('snapshot-dialog'))snapshotDialog();}
 catch(e){if(request!==exportRequest)return;openDialog('KEEP THIS MOMENT',`<h2>图片暂未保存</h2><p class="dialog-intro">${esc(e.message||'请稍后重试。')}</p><button class="primary-button" data-action="export">重新制作图片</button>`,'snapshot-dialog');}
}
async function systemSave(){if(!exportAsset)return;try{await navigator.share({files:[new File([exportAsset.blob],exportAsset.filename,{type:'image/png'})]});}catch(e){if(e.name!=='AbortError')showToast('可以改用“下载图片”，或长按图片保存。');}}
document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement)nativeFullscreen=true;else if(nativeFullscreen){nativeFullscreen=false;setImmersive(false);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.immersive&&!$('#mainDialog').open&&!$('#revealDialog').open)setImmersive(false);});
$('#revealDialog').addEventListener('close',finishReveal);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)effects.start();});

document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
 switch(action){case'spreads':showSpreads();break;case'select-spread':state.spread=b.dataset.id;$('#mainDialog').close();updateSettings();renderTable();renderControls();break;case'start':startReading();break;case'draw':drawCard(Number(b.dataset.pile),b);break;case'flip':openReveal(Number(b.dataset.index));break;case'reveal-all':revealAll();break;case'results':showResults();break;case'new':resetReading();break;case'close':$('#mainDialog').close();break;case'gallery':showGallery();break;case'filter':state.galleryFilter=b.dataset.id;document.querySelectorAll('.gallery-filters button').forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b));});renderGallery();break;case'gallery-card':showCard({id:b.dataset.id,reversed:false},0,true);break;case'detail':showCard(state.drawn[Number(b.dataset.index)],Number(b.dataset.index));break;case'guide':showGuide();break;case'music-settings':showMusicSettings();break;case'toggle-music':toggleMusic();break;case'theme':state.musicTouched=true;try{await audio.setTheme(b.dataset.id);if(!audio.playing)await audio.start();updateMusic();showMusicSettings();}catch{showToast('音乐暂未开启，请点击播放重试。');}break;case'credits':showCredits();break;case'fullscreen':setImmersive(!state.immersive,true);break;case'export':exportReading();break;case'save-system':systemSave();break;case'reveal-close':$('#revealDialog').close();break;case'reveal-next':{const next=state.drawn.findIndex((_,i)=>!state.revealed.has(i));queuedReveal=next>=0?next:null;$('#revealDialog').close();break;}}
});
$('#musicToggle').addEventListener('click',toggleMusic);
document.addEventListener('input',e=>{if(e.target.id==='volume'){audio.setVolume(Number(e.target.value)/100);$('#volumeValue').value=e.target.value+'%';}});
$('#mainDialog').addEventListener('click',e=>{if(e.target===$('#mainDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio.playing){audio.stop();updateMusic();}});
window.addEventListener('pagehide',()=>{audio.stop();clearExport();});
updateSettings();renderTable();renderControls();

setupInstall({openDialog, showToast});
