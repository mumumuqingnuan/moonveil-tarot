import {deck,getReading,summarize} from './data.js';
const FONT='"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const SERIF='"Songti SC", "Noto Serif CJK SC", serif';
export function readingDate(iso){return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'short'}).format(new Date(iso));}
export function readingFileName(iso){const d=new Date(iso),pad=n=>String(n).padStart(2,'0');return `月隐塔罗_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.png`;}
export function wrapText(ctx,text,maxWidth){const lines=[];for(const paragraph of String(text).split('\n')){let line='';for(const char of Array.from(paragraph)){const candidate=line+char;if(line&&ctx.measureText(candidate).width>maxWidth){const glyphs=Array.from(line);const carry=/[，。！？；：、）】》」』”’.,!?;:%]/u.test(char)||/[（【《「『“‘]$/u.test(line);if(carry&&glyphs.length>1){const last=glyphs.pop();lines.push(glyphs.join(''));line=last+char;}else{lines.push(line);line=char;}}else line=candidate;}lines.push(line);}return lines;}
function loadBrowserImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('牌面未能完整载入，请重试。'));img.src=src;});}
export async function createReadingSnapshot(record,adapters={}){
 if(!record.date||record.drawn.length!==record.spread.count)throw new Error('请先完成这次占卜。');
 const createCanvas=adapters.createCanvas||((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 const loadImage=adapters.loadImage||loadBrowserImage;
 const entries=record.drawn.map((d,i)=>{const card=deck.find(c=>c.id===d.id);return {card,reversed:d.reversed,reading:getReading(card,d.reversed),position:record.spread.positions[i],index:i};});
 const images=await Promise.all(entries.map(e=>loadImage(record.facePath(e.card))));
 if(!adapters.createCanvas&&document.fonts)await document.fonts.ready;
 const canvas=createCanvas(1200,100),ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器无法制作图片。');
 const width=1200,margin=76,content=width-margin*2,summary=summarize(record.drawn,record.spread);
 const textHeight=(text,size,maxWidth,lineHeight,serif=false)=>{ctx.font=`${size}px ${serif?SERIF:FONT}`;return wrapText(ctx,text,maxWidth).length*lineHeight;};
 const question=record.question||'未填写（心中默念）';
 const questionHeight=textHeight(question,34,content-56,53,true);
 const options=record.spread.id==='choice'?`选项 A：${record.a||'未填写'}\n选项 B：${record.b||'未填写'}`:'';
 const optionsHeight=options?textHeight(options,26,content-56,42)+20:0;
 const answer=`${summary.theme}\n${summary.orientation}`;
 const answerHeight=textHeight(answer,29,content-56,47);
 const adviceHeight=textHeight(summary.advice,33,content-62,51,true);
 const cardWidth=(content-26)/2,imageWidth=123,imageHeight=218,inner=cardWidth-48;
 const layouts=entries.map(e=>{const label=positionLabel(record,e.position.label);return {label,labelHeight:textHeight(`${e.index+1}. ${label}`,25,inner,37),meaningHeight:textHeight(e.reading.meaning,26,inner,41),promptHeight:textHeight(e.position.prompt,23,inner,36),adviceHeight:textHeight(e.reading.advice,24,inner,38),keywordsHeight:textHeight(e.reading.keywords,23,inner-imageWidth-23,36)};});
 const heights=layouts.map(l=>26+l.labelHeight+16+Math.max(imageHeight,120+l.keywordsHeight)+24+l.meaningHeight+16+l.promptHeight+18+l.adviceHeight+29);
 const rowHeights=[];for(let i=0;i<heights.length;i+=2)rowHeights.push(Math.max(heights[i],heights[i+1]||0));
 const qBox=83+questionHeight+optionsHeight+28,answerBox=89+answerHeight+27,adviceBox=85+adviceHeight+30;
 const height=270+qBox+32+answerBox+32+adviceBox+88+rowHeights.reduce((a,b)=>a+b+26,0)+150;
 if(height>12000)throw new Error('内容较长，请缩短问题后重试。');
 canvas.height=height;canvas.width=width;
 const background=ctx.createLinearGradient(0,0,width,height);background.addColorStop(0,'#322039');background.addColorStop(.55,'#251b30');background.addColorStop(1,'#213438');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='#806849';ctx.lineWidth=2;ctx.strokeRect(30,30,width-60,height-60);ctx.strokeStyle='#80684955';ctx.strokeRect(42,42,width-84,height-84);
 const text=(value,x,y,size,color,maxWidth,lineHeight,serif=false)=>{ctx.font=`${size}px ${serif?SERIF:FONT}`;ctx.fillStyle=color;ctx.textBaseline='top';const lines=wrapText(ctx,value,maxWidth);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return y+lines.length*lineHeight;};
 const panel=(x,y,w,h,fill='#5b43551f',stroke='#d9ba8244')=>{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(x,y,w,h,15);ctx.fill();ctx.stroke();};
 text('MOONVEIL  /  月隐塔罗',margin,77,29,'#d9ba82',content,40);
 text(record.spread.name,margin,132,49,'#f3e7dc',content,65,true);
 text(readingDate(record.date),margin,211,24,'#c3b1c7',content,35);
 let y=270;
 panel(margin,y,content,qBox);text('我的问题',margin+28,y+25,24,'#d9ba82',content-56,34);
 let qy=text(question,margin+28,y+80,34,'#f2e6ee',content-56,53,true);if(options)text(options,margin+28,qy+17,26,'#cfbdd4',content-56,42);y+=qBox+32;
 panel(margin,y,content,answerBox);text('这次的答案',margin+28,y+25,26,'#e0c28c',content-56,38);text(answer,margin+28,y+84,29,'#e1d7e5',content-56,47);y+=answerBox+32;
 panel(margin,y,content,adviceBox,'#d9ba8218','#d9ba8288');text('一句话建议',margin+31,y+25,25,'#d9ba82',content-62,37);text(summary.advice,margin+31,y+78,33,'#f5deb1',content-62,51,true);y+=adviceBox+43;
 text('牌面与解读',margin,y,30,'#e1c897',content,42,true);y+=45;
 let maxBottom=0;
 entries.forEach((e,i)=>{const row=Math.floor(i/2),x=i===entries.length-1&&entries.length%2===1?margin+(content-cardWidth)/2:margin+(i%2)*(cardWidth+26),l=layouts[i],h=rowHeights[row];if(i%2===0&&i>0)y+=rowHeights[row-1]+26;panel(x,y,cardWidth,h,'#70507019');let cy=text(`${i+1}. ${l.label}`,x+24,y+26,25,'#ddbd83',inner,37)+16;
  const image=images[i],ih=Math.min(imageHeight,imageWidth*image.height/image.width),iw=ih*image.width/image.height;ctx.fillStyle='#ddc9a6';ctx.fillRect(x+24-3,cy-3,iw+6,ih+6);ctx.save();if(e.reversed){ctx.translate(x+24+iw,cy+ih);ctx.rotate(Math.PI);ctx.drawImage(image,0,0,iw,ih);}else ctx.drawImage(image,x+24,cy,iw,ih);ctx.restore();
  const tx=x+24+imageWidth+23,tw=inner-imageWidth-23;text(e.card.name,tx,cy+4,33,'#f2e7e8',tw,44,true);text(e.reversed?'逆位':'正位',tx,cy+57,24,e.reversed?'#d5b6e3':'#b9dbce',tw,34);text(e.reading.keywords,tx,cy+105,23,'#d4b57e',tw,36);
  cy+=Math.max(imageHeight,120+l.keywordsHeight)+24;cy=text(e.reading.meaning,x+24,cy,26,'#dfd4e5',inner,41)+16;cy=text(e.position.prompt,x+24,cy,23,'#b9a8c5',inner,36)+18;cy=text(e.reading.advice,x+24,cy,24,'#ead2a7',inner,38);maxBottom=Math.max(maxBottom,cy);
 });
 const footerY=y+rowHeights[rowHeights.length-1]+52;
 text('留一份此刻的记录，把下一步的选择留给自己。',margin,footerY,25,'#d0b9c8',content,39,true);
 text('MOONVEIL TAROT  ·  象征解读与自我探索',margin,footerY+47,20,'#bca9bb',content,30);
 if(maxBottom>height-100||footerY+78>height-30)throw new Error('图片排版未完成，请重试。');
 let blob;
 if(adapters.toBlob)blob=await adapters.toBlob(canvas);else blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片未能完成，请重试。')),'image/png'));
 return {blob,canvas,width,height,filename:readingFileName(record.date),summary};
}
function positionLabel(record,label){if(record.spread.id==='choice'){if(label.startsWith('A ')&&record.a)label=label.replace('A ',`A「${record.a}」`);if(label.startsWith('B ')&&record.b)label=label.replace('B ',`B「${record.b}」`);}return label;}
