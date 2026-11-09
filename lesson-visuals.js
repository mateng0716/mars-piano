// One deterministic concept diagram per lesson. The card and selected preview share this source.
const lessonInk='#315b7a',lessonAccent='#18a5b4',lessonWarm='#f0a53f';
const vText=(x,y,text,size=20,color=lessonInk,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="800" fill="${color}">${text}</text>`;
const vLine=(x1,y1,x2,y2,color='#94b9c8',width=2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const vNote=(x,y,beats=1,color=lessonAccent,stem=true)=>{
  const head=`<ellipse cx="${x}" cy="${y}" rx="11" ry="7.5" transform="rotate(-18 ${x} ${y})" fill="${beats>=2?'#fff':color}" stroke="${color}" stroke-width="${beats>=2?3:1}"/>`;
  const stick=stem&&beats<4?vLine(x+10,y,x+10,y-36,color,3):'';
  const flag=stem&&beats<=.5?`<path d="M${x+10} ${y-36} Q${x+31} ${y-24} ${x+23} ${y-8}" fill="none" stroke="${color}" stroke-width="3"/>`:'';
  return head+stick+flag;
};
const vStaff=()=>[24,40,56,72,88].map(y=>vLine(12,y,288,y)).join('');
const vKeyboard=(marks=[])=>{
  let out='';
  for(let i=0;i<7;i++)out+=`<rect x="${21+i*37}" y="21" width="36" height="72" rx="4" fill="${marks.includes(i)?'#ffe29b':'#fff'}" stroke="#9abccc" stroke-width="2"/>`;
  for(const i of [0,1,3,4,5])out+=`<rect x="${48+i*37}" y="21" width="17" height="43" rx="3" fill="${marks.includes('b'+i)?lessonWarm:'#31516f'}"/>`;
  return out;
};
function lessonDiagram(index){
  let art='';
  const staff=vStaff();
  switch(index){
    case 0: art=staff+vText(38,94,'𝄞',71)+vLine(106,104,154,104)+vNote(130,104)+vNote(180,88)+vNote(230,72)+vText(180,119,'右手 · C  E  G',13);break;
    case 1: art=staff+vText(40,73,'𝄢',66)+vNote(130,64)+vNote(180,48)+vNote(230,32)+vText(180,113,'左手 · C  E  G',13);break;
    case 2: art=staff+vLine(52,104,98,104)+vNote(75,104)+vNote(140,96)+vNote(205,88)+vText(142,119,'一步一步',14);break;
    case 3: art=staff+vLine(52,104,98,104)+vNote(75,104)+vNote(145,88)+vNote(215,72)+vText(145,119,'隔一个音',14);break;
    case 4: art=staff+vNote(150,72)+vText(150,116,'♩ = 1 拍',18);break;
    case 5: art=staff+vNote(150,72,2)+vText(150,116,'二分音符 · 2 拍',17);break;
    case 6: art=staff+vNote(150,72,4)+vText(150,116,'全音符 · 4 拍',17);break;
    case 7: art=staff+vNote(78,72)+`<path d="M145 43 l17 8 -16 12 16 9 -15 18" fill="none" stroke="${lessonWarm}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`+vNote(220,72)+vText(150,116,'弹 · 停 · 弹',15);break;
    case 8: art=staff+vNote(110,72,.5)+vNote(175,64,.5)+vText(150,116,'♪ + ♪ = 1 拍',17);break;
    case 9: art=staff+vText(47,56,'4',27)+vText(47,86,'4',27)+[102,151,200,249].map(x=>vNote(x,72)).join('')+vLine(277,24,277,88,lessonWarm,3);break;
    case 10: art=staff+vText(45,58,'2/4',23)+vNote(108,72)+vNote(150,72)+vLine(180,24,180,88,lessonWarm,3)+vText(232,58,'3/4',23)+vText(234,109,'两拍 / 三拍',13);break;
    case 11: art=staff+vText(90,85,'♯',41,lessonWarm)+vNote(154,80)+vText(212,78,'F♯',27)+vText(154,114,'升高半音',14);break;
    case 12: art=staff+vText(86,92,'♭',45,lessonWarm)+vNote(153,88)+vText(214,78,'E♭',27)+vText(153,114,'降低半音',14);break;
    case 13: art=vKeyboard(['b1'])+vText(150,112,'D♯ = E♭',17);break;
    case 14: art=vKeyboard([0,1,2,3])+vText(75,113,'E–F 半音',15)+vText(220,113,'C–D 全音',15);break;
    case 15: art=staff+vText(30,80,'𝄞',58)+vLine(50,104,90,104)+[70,95,120,145,170,195,220,245].map((x,i)=>vNote(x,104-i*8,1,i===0||i===7?lessonWarm:lessonAccent)).join('')+vText(160,120,'C D E F G A B C',13);break;
    case 16: art=staff+vLine(72,104,118,104)+vNote(95,104)+vNote(195,88)+vText(151,118,'C → E · 三度',17);break;
    case 17: art=staff+vLine(132,104,178,104)+vNote(155,104)+vNote(155,88)+vNote(155,72)+vText(156,118,'C + E + G',17);break;
    case 18: art=staff+vText(46,57,'6',27)+vText(46,86,'8',27)+[92,126,160,194,228,262].map((x,i)=>vNote(x,72-(i%3)*8,.5,i<3?lessonAccent:lessonWarm)).join('')+vText(150,116,'3 + 3',18);break;
  }
  const title=COURSE_LESSONS[index].title.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  return `<svg class="concept-diagram" viewBox="0 0 300 124" role="img" aria-label="${title}示意图" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="298" height="122" rx="14" fill="#f5fbfb" stroke="#cde5eb" stroke-width="2"/>${art}</svg>`;
}
