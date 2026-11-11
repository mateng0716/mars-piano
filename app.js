const names=['Do','Re','Mi','Fa','Sol','La','Si','Do'];
let hand='right',group=0,position=0,locked=false,audio=null,timer=null,courseIndex=0,pieceIndex=null,freeNote=null,drawerMode='course',pieceDone={right:false,left:false},playing=false,playTimers=[],pieceTake=null,micStream=null,micAnalyser=null,micLoop=null,singSince=0;
let gameMode=false,game=null,gameTick=null,gameAdvance=null,gameFeedbackTimer=null;
const GAME_DURATION=60000,GAME_RANKING_KEY='mars-piano-note-game-v1';
const voices=new Map(),$=s=>document.querySelector(s);
const pianoSampleNotes='C2 D2 E2 F2 G2 G#2 A2 A#2 B2 C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 G#4 A4 A#4 B4 C#5 D5 D#5 E5 F5 F#5 G5 G#5 A5 A#5 B5 C6 C#6 D6 D#6 F6 F#6 G6 G#6 A6 A#6'.split(' ');
const pianoBuffers=new Map();let pianoPreloadStarted=false,pianoOutput=null;
const notes=()=>hand==='right'?['C4','D4','E4','F4','G4','A4','B4','C5']:['C3','D3','E3','F3','G3','A3','B3','C4'];
const groups=()=>pieceIndex!==null?MUSIC_PIECES[pieceIndex].hands[hand]:courseIndex!==null?COURSE_LESSONS[courseIndex].groups:[[]];
const phrase=()=>groups()[group]||[],current=()=>phrase()[position];
const stepOf=item=>item&&item.rest?null:typeof item==='number'?item:item.step;
const alterOf=item=>typeof item==='number'?'':item?.alter||'';
const writtenPitchOf=item=>item?.pitch||notes()[stepOf(item)];
const pitchOf=item=>{if(item==null||item.rest)return null;if(item.pitch)return item.pitch;const base=writtenPitchOf(item),alter=alterOf(item);if(!alter)return base;if(alter==='#')return base[0]+'#'+base.slice(1);const flats={C:'B',D:'C#',E:'D#',F:'E',G:'F#',A:'G#',B:'A#'};const replacement=flats[base[0]];return replacement+(replacement==='B'&&base[0]==='C'?Number(base.slice(1))-1:base.slice(1))};
const labelOf=item=>item?.rest?'休止':item?.pitch?item.pitch.replace('#','♯'):names[stepOf(item)]+(alterOf(item)==='#'?'♯':alterOf(item)==='b'?'♭':'');
const beatOf=(item,i)=>item?.beats||COURSE_LESSONS[courseIndex]?.beats?.[i]||1;
const meterParts=meter=>meter.split('/').map(Number);
const measureLength=meter=>{const [count,denominator]=meterParts(meter);return count*4/denominator};
const noteOnsets=items=>{let elapsed=0;return items.map((item,i)=>{const start=elapsed;elapsed+=beatOf(item,i);return start})};
function midi(note){const match=/^([A-G])(#?)(\d)$/.exec(note);if(!match)return NaN;return 12*(Number(match[3])+1)+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]]+(match[2]?1:0)}
function frequency(note){return 440*Math.pow(2,(midi(note)-69)/12)}
function getAudio(){if(audio)return audio;audio=new(window.AudioContext||window.webkitAudioContext)();pianoOutput=audio.createDynamicsCompressor();pianoOutput.threshold.value=-13;pianoOutput.knee.value=16;pianoOutput.ratio.value=3;pianoOutput.attack.value=.003;pianoOutput.release.value=.18;pianoOutput.connect(audio.destination);return audio}
function ensureAudio(){try{getAudio();if(audio.state!=='running')audio.resume().catch(()=>{})}catch{$('#feedback').textContent='请开启声音'}}
function preloadPianoSamples(){if(pianoPreloadStarted)return;pianoPreloadStarted=true;let context;try{context=getAudio()}catch{return}for(const sample of pianoSampleNotes){fetch(pianoAssetUrl(`assets/piano/steinway-splendid/${encodeURIComponent(sample)}.m4a`)).then(response=>{if(!response.ok)throw Error(sample);return response.arrayBuffer()}).then(data=>context.decodeAudioData(data)).then(buffer=>pianoBuffers.set(sample,buffer)).catch(error=>console.warn('Piano sample unavailable:',sample,error))}}
function closestPianoSample(note){let best=null,distance=Infinity;for(const sample of pianoSampleNotes){if(!pianoBuffers.has(sample))continue;const difference=Math.abs(midi(sample)-midi(note));if(difference<distance){best=sample;distance=difference}}return best}
function stopTone(key){const v=voices.get(key);if(!v||!audio)return;v.gain.gain.cancelScheduledValues(audio.currentTime);v.gain.gain.setTargetAtTime(.0001,audio.currentTime,v.sampled ? .19 : .09);try{v.node.stop(audio.currentTime+(v.sampled ? .85 : .35))}catch{}voices.delete(key)}
function startTone(note,key){if(!note)return;ensureAudio();if(!audio)return;stopTone(key);const anchor=closestPianoSample(note),gain=audio.createGain(),node=anchor?audio.createBufferSource():audio.createOscillator();if(anchor){node.buffer=pianoBuffers.get(anchor);node.playbackRate.value=Math.pow(2,(midi(note)-midi(anchor))/12)}else{node.type='triangle';node.frequency.value=frequency(note)}gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(anchor ? .68 : .19,audio.currentTime+(anchor ? .006 : .025));node.connect(gain).connect(pianoOutput||audio.destination);node.start();voices.set(key,{node,gain,sampled:!!anchor})}
function ping(note){startTone(note,'preview');setTimeout(()=>stopTone('preview'),500)}
function renderPieceStaff(){
 const piece=MUSIC_PIECES[pieceIndex],measures=groups(),barLength=measureLength(piece.meter),[count,denominator]=meterParts(piece.meter);
 const naturalIndex=note=>{const match=/^([A-G])#?(\d)$/.exec(note);return Number(match[2])*7+'CDEFGAB'.indexOf(match[1])};
 const bottomIndex=naturalIndex(hand==='right'?'E4':'G2');
 const rows=[];
 for(let row=0;row<Math.ceil(measures.length/2);row++){
  const first=row*2,last=Math.min(first+2,measures.length);
  const lines=[48,64,80,96,112].map(y=>`<line x1="73" x2="806" y1="${y}" y2="${y}" stroke="#8cabc9" stroke-width="2.6"/>`).join('');
  const signature=`<text x="150" y="77" text-anchor="middle" font-size="27" font-weight="900" fill="#4777a3">${count}</text><text x="150" y="108" text-anchor="middle" font-size="27" font-weight="900" fill="#4777a3">${denominator}</text>`;
  const bars=Array.from({length:last-first},(_,slot)=>{
   const measureIndex=first+slot,items=measures[measureIndex],base=180+slot*313,onsets=noteOnsets(items);
   const background=measureIndex===group?`<rect x="${base+3}" y="33" width="307" height="129" rx="12" fill="#dff4ff" opacity=".65"/>`:measureIndex<group?`<rect x="${base+3}" y="33" width="307" height="129" rx="12" fill="#e9fbf4" opacity=".55"/>`:'';
   const heading=`<text x="${base+18}" y="23" font-size="16" font-weight="900" fill="${measureIndex===group?'#137da5':'#5d83a0'}">第 ${measureIndex+1} 小节</text>`;
   const notes=items.map((item,i)=>{
    const beat=beatOf(item,i),x=base+18+(onsets[i]+beat/2)/barLength*276,y=item?.rest?80:112-8*(naturalIndex(writtenPitchOf(item))-bottomIndex);
    const fill=measureIndex<group||measureIndex===group&&i<position?'#2ba978':measureIndex===group&&i===position?'#167fca':'#8faac6';
    const ledger=item?.rest?'':Array.from({length:Math.max(0,Math.floor((y-112)/16))},(_,n)=>`<line x1="${x-23}" x2="${x+24}" y1="${128+n*16}" y2="${128+n*16}" stroke="#8cabc9" stroke-width="2.4"/>`).join('')+Array.from({length:Math.max(0,Math.floor((48-y)/16))},(_,n)=>`<line x1="${x-23}" x2="${x+24}" y1="${32-n*16}" y2="${32-n*16}" stroke="#8cabc9" stroke-width="2.4"/>`).join('');
    const accidental=item?.pitch?.includes('#')?'♯':item?.pitch?.includes('b')?'♭':'';
    const accidentalGlyph=accidental?`<text x="${x-30}" y="${y+8}" font-size="26" font-weight="800" fill="${fill}">${accidental}</text>`:'';
    const head=item?.rest?`<path d="M ${x+7} ${y-24} l -14 16 l 16 8 l -14 16" fill="none" stroke="${fill}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`:beat>=2?`<ellipse cx="${x}" cy="${y}" rx="12" ry="9" fill="none" stroke="${fill}" stroke-width="3.2"/>`:`<ellipse cx="${x}" cy="${y}" rx="12" ry="9" fill="${fill}"/>`;
    const down=y<56,stem=item?.rest||beat>=4?'':down?`<line x1="${x-11}" x2="${x-11}" y1="${y}" y2="${y+38}" stroke="${fill}" stroke-width="2.7"/>`:`<line x1="${x+11}" x2="${x+11}" y1="${y}" y2="${y-38}" stroke="${fill}" stroke-width="2.7"/>`;
    const flag=item?.rest||beat>.5?'':down?`<path d="M ${x-11} ${y+38} Q ${x+11} ${y+24} ${x+5} ${y+11}" fill="none" stroke="${fill}" stroke-width="2.7"/>`:`<path d="M ${x+11} ${y-38} Q ${x+32} ${y-25} ${x+25} ${y-12}" fill="none" stroke="${fill}" stroke-width="2.7"/>`;
    return `<g class="score-note" data-measure="${measureIndex}" data-index="${i}" role="button" tabindex="0" aria-label="试听第 ${measureIndex+1} 小节 ${labelOf(item)}"><rect x="${x-23}" y="${Math.min(y-48,48)}" width="46" height="${Math.max(72,y+30-Math.min(y-48,48))}" fill="transparent"/>${ledger}${accidentalGlyph}${stem}${flag}${head}<text x="${x}" y="156" text-anchor="middle" font-size="15" font-weight="800" fill="${fill}">${labelOf(item)}</text></g>`
   }).join('');
   return `${background}${heading}<line x1="${base}" x2="${base}" y1="48" y2="112" stroke="#638aa6" stroke-width="2.5"/><line x1="${base+313}" x2="${base+313}" y1="48" y2="112" stroke="#638aa6" stroke-width="2.5"/>${notes}`;
  }).join('');
  rows.push(`<svg class="score-line" viewBox="0 0 820 168" preserveAspectRatio="none" role="img" aria-label="${piece.title}，${hand==='right'?'右手':'左手'}，第 ${first+1} 至 ${last} 小节"><text x="85" y="113" font-family="Georgia,serif" font-size="91" fill="#4576a2">${hand==='right'?'𝄞':'𝄢'}</text>${signature}${lines}${bars}</svg>`);
 }
 $('#staff').innerHTML=rows.join('');
 $('#staff').querySelectorAll('.score-note').forEach(el=>{const preview=()=>previewStaffNote(Number(el.dataset.index),Number(el.dataset.measure));el.addEventListener('click',preview);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();preview()}})});
}
function renderStaff(){
 $('#staff').classList.toggle('piece-score',pieceIndex!==null);
 if(pieceIndex!==null){renderPieceStaff();return}
 const freeMode=courseIndex===null&&pieceIndex===null;
 const right=freeMode?(freeNote===null||midi(freeNote)>=60):hand==='right',p=freeMode?(freeNote?[{pitch:freeNote}]:[]):phrase(),courseTitle=courseIndex===null?'':COURSE_LESSONS[courseIndex].title;
 const timeSig=pieceIndex!==null?MUSIC_PIECES[pieceIndex].meter:courseTitle.includes('4/4')?'4/4':courseTitle==='2/4 与 3/4 拍'?(group<2?'2/4':'3/4'):courseTitle==='6/8 拍'?'6/8':null;
 const isPiece=pieceIndex!==null,barLength=isPiece?measureLength(MUSIC_PIECES[pieceIndex].meter):0,onsets=isPiece?noteOnsets(p):[];
 const start=p.length>6?210:p.length>4?235:p.length===1?400:305,gap=p.length<2?0:Math.min(95,(730-start)/(p.length-1));
 const lines=[48,64,80,96,112].map(y=>`<line x1="75" x2="750" y1="${y}" y2="${y}" stroke="#8cabc9" stroke-width="2.6"/>`).join('');
 const signature=timeSig?`<text x="165" y="77" text-anchor="middle" font-size="27" font-weight="900" fill="#4777a3">${timeSig.split('/')[0]}</text><text x="165" y="108" text-anchor="middle" font-size="27" font-weight="900" fill="#4777a3">${timeSig.split('/')[1]}</text>`:'';
 const measureSize=courseTitle==='2/4 与 3/4 拍'?(group<2?2:3):0;
 const barlines=measureSize?Array.from({length:Math.floor((p.length-1)/measureSize)},(_,i)=>{const x=start+(i+1)*measureSize*gap-gap/2;return `<line x1="${x}" x2="${x}" y1="48" y2="112" stroke="#8cabc9" stroke-width="2.5"/>`}).join(''):isPiece?'<line x1="756" x2="756" y1="48" y2="112" stroke="#638aa6" stroke-width="3"/>':'';
 const beatGuides=isPiece?(()=>{const [count,denominator]=meterParts(MUSIC_PIECES[pieceIndex].meter),unit=4/denominator;return Array.from({length:count},(_,i)=>{const x=208+i*unit/barLength*540;return `<line x1="${x}" x2="${x}" y1="40" y2="46" stroke="#9ab9c7" stroke-width="2"/><text x="${x+unit/barLength*270}" y="30" text-anchor="middle" font-size="14" font-weight="800" fill="#5b87a2">${i+1}</text>`}).join('')})():'';
 const naturalIndex=note=>{const match=/^([A-G])#?(\d)$/.exec(note);return (Number(match[2])*7)+'CDEFGAB'.indexOf(match[1])};
 const bottomIndex=naturalIndex(right?'E4':'G2');
 const glyphs=p.map((item,i)=>{const beat=beatOf(item,i),x=isPiece?208+(onsets[i]+beat/2)/barLength*540:start+i*gap,y=item?.rest?80:112-8*(naturalIndex(writtenPitchOf(item))-bottomIndex),active=i===position,fill=active?'#258fd0':i<position?'#2dbd82':'#8faac6';
 const ledger=item?.rest?'':Array.from({length:Math.max(0,Math.floor((y-112)/16))},(_,n)=>`<line x1="${x-25}" x2="${x+26}" y1="${128+n*16}" y2="${128+n*16}" stroke="#8cabc9" stroke-width="2.6"/>`).join('')+Array.from({length:Math.max(0,Math.floor((48-y)/16))},(_,n)=>`<line x1="${x-25}" x2="${x+26}" y1="${32-n*16}" y2="${32-n*16}" stroke="#8cabc9" stroke-width="2.6"/>`).join('');
 const accidental=alterOf(item)==='#'||item?.pitch?.includes('#')?'♯':alterOf(item)==='b'||item?.pitch?.includes('b')?'♭':'';
 const accidentalGlyph=accidental?`<text x="${x-34}" y="${y+8}" font-size="29" font-weight="800" fill="${fill}">${accidental}</text>`:'';
 const head=item?.rest?`<path d="M ${x+8} ${y-24} l -15 16 l 16 8 l -14 16" fill="none" stroke="${fill}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`:beat>=2?`<ellipse cx="${x}" cy="${y}" rx="14" ry="10" fill="none" stroke="${fill}" stroke-width="3.5"/>`:`<ellipse cx="${x}" cy="${y}" rx="14" ry="11" fill="${fill}"/>`;
 const down=y<56,stem=item?.rest||beat>=4?'':down?`<line x1="${x-13}" x2="${x-13}" y1="${y}" y2="${y+44}" stroke="${fill}" stroke-width="3"/>`:`<line x1="${x+13}" x2="${x+13}" y1="${y}" y2="${y-44}" stroke="${fill}" stroke-width="3"/>`;
 const flag=item?.rest||beat>.5?'':down?`<path d="M ${x-13} ${y+44} Q ${x+10} ${y+29} ${x+4} ${y+14}" fill="none" stroke="${fill}" stroke-width="3"/>`:`<path d="M ${x+13} ${y-44} Q ${x+36} ${y-29} ${x+28} ${y-14}" fill="none" stroke="${fill}" stroke-width="3"/>`;
 return `<g class="score-note" data-index="${i}" role="button" tabindex="0" aria-label="试听 ${labelOf(item)}"><rect x="${x-31}" y="${Math.min(y-56,12)}" width="62" height="${Math.max(92,y+36-12)}" fill="transparent"/>${ledger}${accidentalGlyph}${stem}${flag}${head}<text x="${x}" y="158" text-anchor="middle" font-size="17" font-weight="800" fill="${fill}">${labelOf(item)}</text></g>`}).join('');
 const staffLabel=freeMode?freeNote?`自由键盘，当前 ${labelOf(p[0])}`:'自由键盘，点按琴键查看音符':isPiece?`${MUSIC_PIECES[pieceIndex].title}，第 ${group+1} 小节，${MUSIC_PIECES[pieceIndex].meter}，按节拍读 ${p.map(labelOf).join('、')}`:`${right?'高音':'低音'}谱号，音列 ${p.map(labelOf).join('、')}，当前 ${labelOf(current())}`;
 const freePrompt=freeMode?`<text x="410" y="25" text-anchor="middle" font-size="17" font-weight="800" fill="#357e9a">${freeNote?`自由键盘 · 当前 ${labelOf(p[0])}`:'自由键盘 · 点按琴键查看音符'}</text>`:'';
 $('#staff').innerHTML=`<svg viewBox="0 0 820 168" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${staffLabel}">${lines}${barlines}${beatGuides}<text x="85" y="113" font-family="Georgia,serif" font-size="91" fill="#4576a2">${right?'𝄞':'𝄢'}</text>${signature}${freePrompt}${glyphs}</svg>`;
 $('#staff').querySelectorAll('.score-note').forEach(el=>{const preview=()=>previewStaffNote(Number(el.dataset.index));el.addEventListener('click',preview);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();preview()}})})
}
function renderKeyboard(){
 const all=[];
 for(let oct=2;oct<=6;oct++)for(const letter of 'CDEFGAB')all.push(letter+oct);
 all.push('C7');
 const whites=all.map((note,i)=>`<button class="white-key" data-note="${note}" aria-label="${note} 琴键" style="left:calc(${i} * var(--key-width))"></button>`).join('');
 const blacks=all.slice(0,-1).flatMap((note,i)=>'EB'.includes(note[0])?[]:[`<button class="black-key" data-note="${note[0]}#${note.slice(1)}" aria-label="${note[0]}#${note.slice(1)} 黑键" style="left:calc(${i+1} * var(--key-width) - var(--black-width) / 2)"><span>${note[0]}♯</span></button>`]).join('');
 $('#keyboard').innerHTML=whites+blacks;
 $('#keyboard').querySelectorAll('button').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.blur();b.setPointerCapture(e.pointerId);b.classList.add('active');if(!gameMode&&courseIndex===null&&pieceIndex===null){freeNote=b.dataset.note;renderStaff()}startTone(b.dataset.note,e.pointerId);if(gameMode)judgeGame(b);else judge(b)});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{b.classList.remove('active');stopTone(e.pointerId)})
 })
}
function keyPosition(b,v){const key=b.getBoundingClientRect(),viewport=v.getBoundingClientRect();return {left:key.left-viewport.left+v.scrollLeft,right:key.right-viewport.left+v.scrollLeft,center:(key.left+key.right)/2-viewport.left+v.scrollLeft}}
function locate(){const target=gameMode?(game?.target||notes()[0]):pitchOf(current())||notes()[0],b=$(`#keyboard [data-note="${target}"]`),v=$('#keyboardViewport');if(b){const {center}=keyPosition(b,v);v.scrollTo({left:center-v.clientWidth/2,behavior:'smooth'})}}
function revealCurrent(){const pitch=pitchOf(current()),b=pitch?$(`#keyboard [data-note="${pitch}"]`):null,v=$('#keyboardViewport');if(!b)return;const {left,right,center}=keyPosition(b,v);if(left<v.scrollLeft+12||right>v.scrollLeft+v.clientWidth-12)v.scrollTo({left:center-v.clientWidth/2,behavior:'smooth'})}
function updateHint(){$('#keyboard').querySelectorAll('.target').forEach(b=>b.classList.remove('target'));$('#keyboard').querySelectorAll('[data-finger]').forEach(b=>b.removeAttribute('data-finger'));if(courseIndex!==null)notes().slice(0,5).forEach((note,i)=>{const b=$(`#keyboard [data-note="${note}"]`);if(b)b.dataset.finger=hand==='right'?i+1:5-i});if($('#hint').checked&&pitchOf(current()))$(`#keyboard [data-note="${pitchOf(current())}"]`)?.classList.add('target')}
function render(centerFirst=false){stopPieceTake();clearTimeout(timer);locked=false;clearKeyColors();$('#groupCelebration').hidden=true;$('#feedback').textContent='';$('#nextBtn').hidden=true;document.body.classList.toggle('free-mode',courseIndex===null&&pieceIndex===null);document.body.classList.toggle('piece-mode',pieceIndex!==null);if(current()?.rest){$('#feedback').textContent='休止一拍 · 不按键';if(!playing)timer=setTimeout(advance,850)}$('#lessonBadge').hidden=courseIndex===null&&pieceIndex===null;if(courseIndex!==null)$('#lessonBadge').textContent=`${String(courseIndex+1).padStart(2,'0')} · ${COURSE_LESSONS[courseIndex].title} · ${group+1}/${groups().length} 组`;if(pieceIndex!==null)$('#lessonBadge').textContent=`${MUSIC_PIECES[pieceIndex].title} · ${hand==='right'?'右手':'左手'} · 第 ${group+1}/${groups().length} 小节`;renderStaff();updateHint();syncPieceControls();requestAnimationFrame(centerFirst?locate:revealCurrent);const dual=courseIndex!==null&&['降号 ♭','黑键的两个名字'].includes(COURSE_LESSONS[courseIndex].title);for(const octave of [2,3,4,5,6]){const key=$(`#keyboard [data-note="D#${octave}"] span`);if(key)key.innerHTML=dual?'D♯<br>E♭':'D♯'}}
function judge(b){if(courseIndex===null&&pieceIndex===null||locked||playing)return;if(pieceIndex!==null){recordPieceNote(b);return}if(current()?.rest){b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),1400);$('#feedback').textContent='休止时停一拍';return}$('#keyboard').querySelectorAll('.preview').forEach(k=>k.classList.remove('preview'));if(b.dataset.note!==pitchOf(current())){b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),1400);$('#feedback').textContent='再试一次';return}locked=true;clearKeyColors();b.classList.add('correct');$('#feedback').textContent='✓';timer=setTimeout(advance,420)}
function showCelebration(){locked=true;clearKeyColors();$('#keyboard').querySelectorAll('.target').forEach(b=>b.classList.remove('target'));const box=$('#groupCelebration');box.hidden=false;box.classList.add('finished');$('#celebrationProgress').innerHTML=Array.from({length:groups().length},()=>'<span class="done"></span>').join('');$('#nextBtn').hidden=false;if(pieceIndex!==null){pieceDone[hand]=true;const other=hand==='right'?'left':'right';$('#celebrationTitle').textContent='这一只手读完了';$('#celebrationGuide').textContent=pieceDone[other]?'双手谱都读完了！可以再读一遍，或选下一首。':`接下来试试${other==='right'?'右手':'左手'}谱。`;$('#nextBtn').textContent=pieceDone[other]?'再读这首 ↻':`练${other==='right'?'右手':'左手'} →`;return}$('#celebrationTitle').textContent='这节练完了';$('#celebrationGuide').textContent=courseIndex<COURSE_LESSONS.length-1?`接下来：${COURSE_LESSONS[courseIndex+1].title}`:'课程已完成，可以去曲子识谱试试。';$('#nextBtn').textContent=courseIndex<COURSE_LESSONS.length-1?'进入下一课 →':'去曲子识谱 →'}
function advance(){if(position<phrase().length-1){position++;render()}else if(group<groups().length-1){group++;position=0;render()}else showCelebration()}
function reset(){group=0;position=0;render(true)}
function clearKeyColors(){$('#keyboard').querySelectorAll('.correct,.wrong,.preview').forEach(k=>k.classList.remove('correct','wrong','preview'))}
function syncPieceControls(){
 const isPiece=pieceIndex!==null;
 $('#beatBtn').hidden=!isPiece;
 $('#singBtn').hidden=isPiece;
 $('#hearBtn').hidden=isPiece;
 $('#playBtn').setAttribute('aria-label',isPiece?'听整小节示范':'自动播放');
 if(!pieceTake&&!locked)$('#beatBtn').disabled=false;
 if(!playing)$('#playBtn').textContent=isPiece?'▶ 听小节':'▶ 示范';
 if(isPiece&&!pieceTake&&!locked)$('#feedback').textContent='先听整小节，再跟拍弹奏';
}
function stopPieceTake(){
 if(!pieceTake)return;
 for(const id of pieceTake.timers)clearTimeout(id);
 pieceTake=null;
 $('#beatBtn').disabled=false;
 $('#beatBtn').textContent='♩ 跟拍练一小节';
}
function metronomeClick(accent=false){
 ensureAudio();if(!audio)return;
 const tone=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
 tone.type='sine';tone.frequency.value=accent?880:660;
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.065,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.07);
 tone.connect(gain).connect(pianoOutput||audio.destination);tone.start(now);tone.stop(now+.08);
}
function startPieceTake(){
 if(pieceIndex===null||locked||!$('#groupCelebration').hidden)return;
 if(pieceTake){stopPieceTake();$('#feedback').textContent='已停止，点跟拍可重来';return}
 stopPlayback();stopSinging();clearTimeout(timer);clearKeyColors();ensureAudio();
 const p=phrase(),meter=MUSIC_PIECES[pieceIndex].meter,[count,denominator]=meterParts(meter),unit=4/denominator,beatMs=850,onsets=noteOnsets(p);
 const take={phase:'countin',timers:[],matches:new Set(),wrong:0,startedAt:0,beatMs,onsets};
 pieceTake=take;position=0;renderStaff();updateHint();
 $('#beatBtn').textContent='■ 停止跟拍';
 const later=(fn,delay)=>take.timers.push(setTimeout(()=>{if(pieceTake===take)fn()},delay));
 for(let i=0;i<count;i++)later(()=>{metronomeClick(i===0);$('#feedback').textContent=`预备 ${i+1} / ${count}`},i*unit*beatMs);
 later(()=>{
  take.phase='playing';take.startedAt=performance.now();$('#feedback').textContent='跟着节拍，弹完整小节';
  for(let i=0;i<count;i++)later(()=>metronomeClick(i===0),i*unit*beatMs);
  onsets.forEach((onset,i)=>later(()=>{position=i;renderStaff();updateHint()},onset*beatMs));
  later(finishPieceTake,measureLength(meter)*beatMs+220);
 },count*unit*beatMs);
}
function recordPieceNote(b){
 if(!pieceTake){$('#feedback').textContent='先听示范，再点「跟拍练一小节」';return}
 if(pieceTake.phase!=='playing'){$('#feedback').textContent='等预备拍结束再弹';return}
 const take=pieceTake,when=(performance.now()-take.startedAt)/take.beatMs;
 const i=phrase().findIndex((item,index)=>!take.matches.has(index)&&pitchOf(item)===b.dataset.note&&Math.abs(take.onsets[index]-when)<=.36);
 if(i>=0){take.matches.add(i);b.classList.add('correct');$('#feedback').textContent=`按准 ${take.matches.size} / ${phrase().length} 个音 · 继续跟拍`}
 else{take.wrong++;b.classList.add('wrong');$('#feedback').textContent='继续听拍点，弹完整小节'}
 setTimeout(()=>b.classList.remove('correct','wrong'),240);
}
function finishPieceTake(){
 const take=pieceTake;if(!take)return;
 const matched=take.matches.size,total=phrase().length,passed=matched===total&&take.wrong<=1;
 stopPieceTake();clearKeyColors();
 if(!passed){position=0;renderStaff();updateHint();$('#feedback').textContent=`本小节按准 ${matched} / ${total} 个音，跟拍再练一次`;return}
 locked=true;$('#beatBtn').disabled=true;$('#feedback').textContent='✓ 整小节的音和节拍都完成了';
 timer=setTimeout(()=>{if(group<groups().length-1){group++;position=0;render(true)}else showCelebration()},900);
}
function previewStaffNote(i,measure=group){const item=courseIndex===null&&pieceIndex===null?(freeNote?{pitch:freeNote}:null):groups()[measure]?.[i],pitch=pitchOf(item);if(!pitch){$('#feedback').textContent='休止一拍';return}const b=$(`#keyboard [data-note="${pitch}"]`);if(!b)return;clearKeyColors();b.classList.add('preview');ping(pitch)}
function gameRanks(){try{const saved=JSON.parse(localStorage.getItem(GAME_RANKING_KEY)||'[]');return Array.isArray(saved)?saved.filter(row=>row&&typeof row.name==='string'&&Number.isFinite(row.score)).slice(0,10):[]}catch{return []}}
function renderGameRanks(){const list=$('#gameRankingList');list.replaceChildren();const ranks=gameRanks();if(!ranks.length){const row=document.createElement('li');row.textContent='还没有成绩，开始第一局吧！';list.append(row);return}ranks.forEach((entry,index)=>{const row=document.createElement('li'),place=document.createElement('span'),name=document.createElement('span'),score=document.createElement('strong');place.textContent=`${index+1}.`;name.textContent=entry.name.slice(0,12);score.textContent=`${entry.score} 分`;row.append(place,name,score);list.append(row)})}
function saveGameRank(){const entry={name:$('#gameName').value.trim().slice(0,12)||'小小琴探险家',score:game.score,streak:game.best,at:Date.now()};const ranks=[...gameRanks(),entry].sort((a,b)=>b.score-a.score||b.streak-a.streak||a.at-b.at).slice(0,10);try{localStorage.setItem(GAME_RANKING_KEY,JSON.stringify(ranks))}catch{$('#gameMessage').textContent='本局完成，浏览器未允许保存排行榜。'}renderGameRanks()}
function pickGameNote(previous){const choices=notes().filter(note=>note!==previous);return choices[Math.floor(Math.random()*choices.length)]}
function renderGameStaff(){
 const note=game.target,right=hand==='right',visual=game.visual;
 const compact=window.innerWidth<=600,staffStart=compact?260:130,staffEnd=compact?640:760,clefX=compact?260:140,viewBox=compact?'225 0 450 176':'0 0 900 176';
 const naturalIndex=value=>Number(value.slice(-1))*7+'CDEFGAB'.indexOf(value[0]);
 const y=112-8*(naturalIndex(note)-naturalIndex(right?'E4':'G2'));
 const fill=visual==='correct'?'#20ad76':visual==='wrong'?'#e64d5e':'#247fad';
 const lines=[48,64,80,96,112].map(line=>`<line x1="${staffStart}" x2="${staffEnd}" y1="${line}" y2="${line}" stroke="#86abc6" stroke-width="2.7"/>`).join('');
 const ledgers=Array.from({length:Math.max(0,Math.floor((y-112)/16))},(_,i)=>`<line x1="425" x2="475" y1="${128+i*16}" y2="${128+i*16}" stroke="#86abc6" stroke-width="2.7"/>`).join('')+Array.from({length:Math.max(0,Math.floor((48-y)/16))},(_,i)=>`<line x1="425" x2="475" y1="${32-i*16}" y2="${32-i*16}" stroke="#86abc6" stroke-width="2.7"/>`).join('');
 const stem=y<56?`<line x1="437" x2="437" y1="${y}" y2="${y+46}" stroke="${fill}" stroke-width="3.5"/>`:`<line x1="463" x2="463" y1="${y}" y2="${y-46}" stroke="${fill}" stroke-width="3.5"/>`;
 const bursts=[[-155,-42],[-125,26],[-107,-72],[-84,38],[-55,-56],[-32,29],[-10,-76],[25,37],[48,-51],[72,27],[95,-68],[128,37],[155,-27],[-142,-12],[112,4],[6,-37]];
 const confetti=visual==='correct'?bursts.map(([dx,dy],i)=>`<circle class="game-particle" cx="450" cy="${y}" r="${i%3===0?9:7}" fill="hsl(${i*31+15} 88% 58%)" style="--tx:${dx}px;--ty:${dy}px;--delay:${i*.012}s"/>`).join(''):'';
 const staff=$('#staff');staff.classList.remove('piece-score');staff.classList.toggle('is-wrong',visual==='wrong');staff.classList.toggle('is-correct',visual==='correct');
 staff.innerHTML=`<svg class="game-staff" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${right?'高音':'低音'}谱号上的随机音符"><text x="${clefX}" y="116" font-family="Georgia,serif" font-size="96" fill="#42779f">${right?'𝄞':'𝄢'}</text>${lines}${ledgers}<g class="game-note">${stem}<ellipse cx="450" cy="${y}" rx="14" ry="10" fill="${fill}" transform="rotate(-18 450 ${y})"/></g>${confetti}</svg>`
}
function gameCue(correct){ensureAudio();if(!audio)return;const now=audio.currentTime,tones=correct?[660,880,1175]:[330,220];tones.forEach((hz,index)=>{const oscillator=audio.createOscillator(),gain=audio.createGain(),start=now+index*(correct?.09:.12);oscillator.type=correct?'sine':'triangle';oscillator.frequency.setValueAtTime(hz,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(correct?.16:.12,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+(correct?.23:.21));oscillator.connect(gain).connect(pianoOutput||audio.destination);oscillator.start(start);oscillator.stop(start+(correct?.25:.23))})}
function gameFeedback(kind,message,key){
 clearTimeout(gameFeedbackTimer);
 const result=$('#gameResult');result.hidden=false;result.className=`game-result ${kind}`;result.replaceChildren();
 const symbol=document.createElement('strong'),copy=document.createElement('span');symbol.textContent=kind==='correct'?'✓':'✕';copy.textContent=message;result.append(symbol,copy);
 gameFeedbackTimer=setTimeout(()=>{key?.classList.remove('wrong');result.hidden=true;if(gameMode&&game?.visual==='wrong'){game.visual=null;renderGameStaff()}},540)
}
function updateGameHud(){
 if(!game)return;
 const active=game.status==='playing'||game.status==='celebrating';
 const remaining=active?Math.max(0,Math.ceil((game.deadline-performance.now())/1000)):game.status==='finished'?0:60;
 const progress=$('#gameProgress');progress.hidden=!active;progress.setAttribute('aria-valuenow',String(remaining));$('#gameProgressFill').style.width=`${remaining/60*100}%`;
 $('#gameHand').textContent=hand==='right'?'右手':'左手';$('#gameStart').hidden=active;$('#gameStart').textContent=game.status==='finished'?'再玩一次':'开始弹音';$('#gameName').disabled=active;
 const records=$('#gameLeaderboard');records.hidden=active;if(active)records.open=false;
 document.querySelectorAll('[data-hand]').forEach(button=>button.disabled=active)
}
function finishGame(){
 if(!game||!['playing','celebrating'].includes(game.status))return;
 clearInterval(gameTick);gameTick=null;clearTimeout(gameAdvance);gameAdvance=null;game.status='finished';game.visual=null;clearKeyColors();$('#gameResult').hidden=true;
 $('#gameMessage').textContent=`这一分钟弹对了 ${game.correct} 个音，真棒！`;
 $('#gameRecordSummary').textContent=`本局弹对 ${game.correct} 个音 · 最高连对 ${game.best} 个 · ${game.score} 分`;
 saveGameRank();updateGameHud();renderGameStaff()
}
function tickGame(){if(!game||!['playing','celebrating'].includes(game.status))return;if(performance.now()>=game.deadline){finishGame();return}updateGameHud()}
function startGame(){
 if(!gameMode)return;
 clearInterval(gameTick);clearTimeout(gameAdvance);clearTimeout(gameFeedbackTimer);$('#gameResult').hidden=true;clearKeyColors();
 game={status:'playing',target:pickGameNote(game?.target),visual:null,score:0,streak:0,best:0,correct:0,wrong:0,deadline:performance.now()+GAME_DURATION};
 $('#gameMessage').textContent='看音符，找到琴键。';renderGameStaff();updateGameHud();gameTick=setInterval(tickGame,100);requestAnimationFrame(locate)
}
function judgeGame(key){
 if(!gameMode||!game||game.status==='idle'||game.status==='finished')return;
 if(performance.now()>=game.deadline){finishGame();return}
 if(game.status==='celebrating')return;
 clearTimeout(gameFeedbackTimer);clearKeyColors();
 if(key.dataset.note!==game.target){
  game.streak=0;game.wrong++;game.visual='wrong';key.classList.add('wrong');gameCue(false);gameFeedback('wrong','再试试',key);$('#gameMessage').textContent='还差一点，再试试这颗音符。';renderGameStaff();return
 }
 game.streak++;game.best=Math.max(game.best,game.streak);game.score+=game.streak;game.correct++;game.status='celebrating';game.visual='correct';key.classList.add('correct');gameCue(true);gameFeedback('correct','真棒！');$('#gameMessage').textContent='真棒！下一颗音符来了。';renderGameStaff();
 gameAdvance=setTimeout(()=>{if(!game||game.status!=='celebrating')return;if(performance.now()>=game.deadline){finishGame();return}game.target=pickGameNote(game.target);game.status='playing';game.visual=null;clearKeyColors();$('#gameResult').hidden=true;renderGameStaff();requestAnimationFrame(revealGameNote)},650)
}
function revealGameNote(){const key=$(`#keyboard [data-note="${game?.target}"]`),view=$('#keyboardViewport');if(!key)return;const {left,right,center}=keyPosition(key,view);if(left<view.scrollLeft+10||right>view.scrollLeft+view.clientWidth-10)view.scrollTo({left:center-view.clientWidth/2,behavior:'smooth'})}
function enterGame(){
 clearTimeout(timer);stopPieceTake();stopPlayback();stopSinging();if(narrationAudio){narrationAudio.pause();narrationAudio=null}
 clearInterval(gameTick);clearTimeout(gameAdvance);clearTimeout(gameFeedbackTimer);hand='right';document.querySelectorAll('[data-hand]').forEach(button=>{button.disabled=false;button.classList.toggle('selected',button.dataset.hand===hand)});
 courseIndex=null;pieceIndex=null;freeNote=null;gameMode=true;game={status:'idle',target:pickGameNote(),visual:null,score:0,streak:0,best:0,correct:0,wrong:0,deadline:0};
 document.body.classList.remove('show-home','free-mode','piece-mode');document.body.classList.add('game-mode');$('#courseDrawer').hidden=true;$('#gamePanel').hidden=false;$('#gameResult').hidden=true;$('#lessonBadge').hidden=true;$('#groupCelebration').hidden=true;
 $('#gameMessage').textContent='看音符，按下对应的琴键。弹错了可以再试。';$('#gameRecordSummary').textContent='玩完以后，这里会留下今天的记录。';$('#gameLeaderboard').open=false;
 clearKeyColors();updateHint();renderGameRanks();updateGameHud();renderGameStaff();requestAnimationFrame(locate)
}
function leaveGame(){if(!gameMode)return;clearInterval(gameTick);gameTick=null;clearTimeout(gameAdvance);gameAdvance=null;clearTimeout(gameFeedbackTimer);gameFeedbackTimer=null;gameMode=false;game=null;courseIndex=0;pieceIndex=null;freeNote=null;document.body.classList.remove('game-mode');$('#gamePanel').hidden=true;$('#gameResult').hidden=true;$('#gameLeaderboard').hidden=true;document.querySelectorAll('[data-hand]').forEach(button=>button.disabled=false);render()}
function enterPractice(){document.body.classList.remove('show-home');requestAnimationFrame(locate)}
function showHome(){leaveGame();clearTimeout(timer);stopPieceTake();stopPlayback();stopSinging();if(narrationAudio){narrationAudio.pause();narrationAudio=null}document.body.classList.add('show-home');$('#courseDrawer').hidden=true}
function chooseHand(next){
 if(gameMode){
  if(game.status==='playing'||game.status==='celebrating')return;
  hand=next;game.status='idle';game.target=pickGameNote(game.target);game.visual=null;game.score=0;game.streak=0;game.best=0;game.correct=0;
  $('#gameMessage').textContent='看音符，按下对应的琴键。准备好就开始！';document.querySelectorAll('[data-hand]').forEach(button=>button.classList.toggle('selected',button.dataset.hand===hand));renderGameStaff();updateGameHud();requestAnimationFrame(locate);return
 }
 stopPlayback();stopSinging();hand=next;document.querySelectorAll('[data-hand]').forEach(button=>button.classList.toggle('selected',button.dataset.hand===hand));reset()
}
document.querySelectorAll('[data-hand]').forEach(b=>b.onclick=()=>chooseHand(b.dataset.hand));
$('#hint').onchange=updateHint;
$('#locateBtn').onclick=locate;
$('#keyWidth').oninput=e=>{document.documentElement.style.setProperty('--key-width',e.target.value+'mm');$('#keyWidthValue').textContent=e.target.value+' mm';requestAnimationFrame(locate)};
$('#hearBtn').onclick=()=>ping(pitchOf(current()));
$('#nextBtn').onclick=()=>{if(pieceIndex!==null){const other=hand==='right'?'left':'right';if(!pieceDone[other])chooseHand(other);else reset();return}if(courseIndex<COURSE_LESSONS.length-1){selectCourse(courseIndex+1);$('#courseDrawer').hidden=true}else openDrawer('pieces')};
$('#playBtn').onclick=()=>playing?stopPlayback():playDemo();
$('#beatBtn').onclick=startPieceTake;
$('#singBtn').onclick=()=>micStream?stopSinging():startSinging();
$('#courseBtn').onclick=()=>openDrawer('course');
$('#pieceBtn').onclick=()=>openDrawer('pieces');
$('#gameBtn').onclick=enterGame;
$('#gameStart').onclick=startGame;
$('#gameExit').onclick=showHome;
$('#closeCourse').onclick=()=>{if(narrationAudio){narrationAudio.pause();narrationAudio=null}$('#courseDrawer').hidden=true};
$('#homeBtn').onclick=showHome;
$('#homeCourseBtn').onclick=()=>openDrawer('course');
$('#homeContinueBtn').onclick=$('#homeCourseBtn').onclick;
$('#homeExploreBtn').onclick=()=>{courseIndex=null;pieceIndex=null;freeNote=null;stopPlayback();stopSinging();reset();enterPractice()};
$('#homePracticeBtn').onclick=()=>openDrawer('pieces');
$('#homeGameBtn').onclick=enterGame;
$('#refreshBtn').onclick=()=>{const url=new URL(location.href);url.searchParams.set('refresh',String(Date.now()));url.hash='';$('#refreshBtn').textContent='正在更新…';location.replace(url.href)};
if(window.pianoRefreshToken){$('#refreshBtn').textContent='✓ 已刷新最新版';setTimeout(()=>$('#refreshBtn').textContent='↻ 刷新最新版',3500)}
$('#shapeBtn').onclick=()=>$('#shapeModal').hidden=false;
$('#closeModal').onclick=()=>$('#shapeModal').hidden=true;
$('#shapeModal').onclick=e=>{if(e.target.id==='shapeModal')e.target.hidden=true};
document.onkeydown=e=>{if(e.key==='Escape'){$('#shapeModal').hidden=true;$('#courseDrawer').hidden=true}};
renderKeyboard();renderCourseList();render();preloadPianoSamples();requestAnimationFrame(locate);
function openDrawer(type){
 leaveGame();drawerMode=type;clearTimeout(timer);stopPieceTake();stopPlayback();stopSinging();
 $('#courseDrawer').classList.toggle('piece-picker',type==='pieces');
 $('#courseDrawer').classList.toggle('course-picker',type==='course');
 if(type==='course'){enterPractice();renderCourseList()}
 else renderPieceList();
 $('#drawerKicker').textContent=type==='course'?'ABRSM 1–3 级知识范围 · 点一课直接开始':'5 首 C 大调教学版 · 选一首直接开始';
 $('#drawerTitle').textContent=type==='course'?'19 节乐理课':'曲子识谱';
 $('#courseDrawer').hidden=false;
}
function renderCourseList(){const list=$('#lessonList');list.className='course-list';list.innerHTML=COURSE_LESSONS.map((l,i)=>`<button class="course-item ${courseIndex===i?'chosen':''}" data-index="${i}" aria-label="开始第 ${i+1} 课 ${l.title}"><span class="course-num">${String(i+1).padStart(2,'0')}</span><span class="course-item-copy"><b>${l.title}</b><small>${l.grade}</small></span><span class="course-thumb" aria-hidden="true">${lessonDiagram(i)}</span></button>`).join('');list.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectCourse(Number(b.dataset.index));enterPractice();$('#courseDrawer').hidden=true})}
function selectCourse(i){if(narrationAudio){narrationAudio.pause();narrationAudio=null}stopPlayback();stopSinging();pieceIndex=null;courseIndex=i;const l=COURSE_LESSONS[i];hand=l.hand||'right';document.querySelectorAll('[data-hand]').forEach(b=>b.classList.toggle('selected',b.dataset.hand===hand));group=0;position=0;render(true);renderCourseList()}
function renderPieceList(){
 const list=$('#lessonList');list.className='course-list piece-list';
 list.innerHTML=MUSIC_PIECES.map((p,i)=>`<button class="course-item piece-item ${pieceIndex===i?'chosen':''}" data-index="${i}" aria-label="打开 ${p.title}，${p.key} ${p.meter}"><span class="course-num">${String(i+1).padStart(2,'0')}</span><span class="course-item-copy"><b>${p.title}</b><small>${p.key} · ${p.meter} · ${p.grade}</small></span><span class="piece-start" aria-hidden="true">开始 →</span></button>`).join('');
 list.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectPiece(Number(b.dataset.index));enterPractice();$('#courseDrawer').hidden=true});
}
function selectPiece(i){
 if(narrationAudio){narrationAudio.pause();narrationAudio=null}
 stopPieceTake();stopPlayback();stopSinging();courseIndex=null;pieceIndex=i;hand='right';
 document.querySelectorAll('[data-hand]').forEach(b=>b.classList.toggle('selected',b.dataset.hand===hand));
 pieceDone={right:false,left:false};group=0;position=0;render(true);
}
function stopPlayback(){for(const id of playTimers)clearTimeout(id);playTimers=[];for(const key of [...voices.keys()])if(String(key).startsWith('demo'))stopTone(key);$('#keyboard').querySelectorAll('.demo').forEach(b=>b.classList.remove('demo'));playing=false;$('#playBtn').textContent=pieceIndex!==null?'▶ 听小节':'▶ 示范'}
function playDemo(){if(courseIndex===null&&pieceIndex===null||locked)return;if(!$('#groupCelebration').hidden)return;stopPieceTake();stopSinging();playing=true;$('#playBtn').textContent='■ 停止';const savedGroup=group,savedPosition=position,p=phrase().slice();let delay=0;p.forEach((item,i)=>{const duration=Math.max(.5,beatOf(item,i))*510,key='demo'+i;playTimers.push(setTimeout(()=>{position=i;render();const note=pitchOf(item);if(note)startTone(note,key);const b=note?$(`#keyboard [data-note="${note}"]`):null;b?.classList.add('demo');playTimers.push(setTimeout(()=>{stopTone(key);b?.classList.remove('demo')},duration*.82))},delay));delay+=duration});playTimers.push(setTimeout(()=>{playing=false;group=savedGroup;position=savedPosition;render();$('#playBtn').textContent=pieceIndex!==null?'▶ 听小节':'▶ 示范'},delay+150))}
async function startSinging(){if(courseIndex===null&&pieceIndex===null)return;stopPlayback();try{micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});ensureAudio();const source=audio.createMediaStreamSource(micStream);micAnalyser=audio.createAnalyser();micAnalyser.fftSize=2048;source.connect(micAnalyser);$('#singBtn').textContent='■ 停止试唱';$('#feedback').textContent='唱当前音';singSince=0;micLoop=setInterval(checkSinging,80)}catch{micStream=null;$('#feedback').textContent='需允许麦克风（HTTPS）'}}
function stopSinging(){if(micLoop)clearInterval(micLoop);micLoop=null;if(micStream)micStream.getTracks().forEach(t=>t.stop());micStream=null;micAnalyser=null;$('#singBtn').textContent='🎙 试唱';singSince=0}
function detectPitch(){if(!micAnalyser||!audio)return null;const data=new Float32Array(micAnalyser.fftSize);micAnalyser.getFloatTimeDomainData(data);let rms=0;for(const v of data)rms+=v*v;rms=Math.sqrt(rms/data.length);if(rms<.018)return null;let best=0,bestScore=0;const min=Math.floor(audio.sampleRate/900),max=Math.min(Math.floor(audio.sampleRate/100),data.length/2);for(let lag=min;lag<=max;lag++){let sum=0,a=0,b=0;for(let i=0;i<data.length-lag;i+=2){const x=data[i],y=data[i+lag];sum+=x*y;a+=x*x;b+=y*y}const score=sum/Math.sqrt(a*b||1);if(score>bestScore){bestScore=score;best=lag}}return bestScore>.82?audio.sampleRate/best:null}
function checkSinging(){if(locked||playing)return;const heard=detectPitch();if(!heard){singSince=0;return}const sung=69+12*Math.log2(heard/440),target=midi(pitchOf(current()));const distance=Math.abs((((sung-target)%12)+18)%12-6);if(distance<.8){if(!singSince)singSince=Date.now();if(Date.now()-singSince>320){singSince=0;judge({dataset:{note:pitchOf(current())},classList:{add(){}}})}}else{singSince=0;$('#feedback').textContent='再听，再唱'}}

let narrationAudio=null;function playNarration(i){if(narrationAudio){narrationAudio.pause();narrationAudio=null;return}narrationAudio=new Audio(pianoAssetUrl(`assets/voice/lesson-${String(COURSE_LESSONS[i].voiceId).padStart(2,'0')}.m4a`));narrationAudio.onended=()=>{narrationAudio=null};narrationAudio.onerror=()=>{$('#feedback').textContent='讲解暂不可播放';narrationAudio=null};narrationAudio.play().catch(()=>{$('#feedback').textContent='请点按后播放';narrationAudio=null})}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPieceTake();stopPlayback();stopSinging();if(narrationAudio){narrationAudio.pause();narrationAudio=null}}});window.addEventListener('pagehide',()=>{stopPieceTake();stopPlayback();stopSinging();if(narrationAudio)narrationAudio.pause()});
window.addEventListener('resize',()=>{if(gameMode)renderGameStaff()});
