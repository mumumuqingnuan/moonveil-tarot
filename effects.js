// Abstract light and particle effects. No artwork or card faces are synthesized here.
export class RitualEffects {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mode='idle';this.particles=[];this.rings=[];this.frameId=0;this.last=0;this.width=0;this.height=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;const ratio=Math.min(window.devicePixelRatio||1,1.6);this.canvas.width=Math.max(1,Math.round(r.width*ratio));this.canvas.height=Math.max(1,Math.round(r.height*ratio));this.ctx.setTransform(ratio,0,0,ratio,0,0);}
 setMode(mode){this.mode=mode;if(mode!=='idle')this.start();}
 start(){if(!this.frameId&&!this.reduced&&!document.hidden){this.last=performance.now();this.frameId=requestAnimationFrame(t=>this.frame(t));}}
 burst(x=this.width/2,y=this.height*.45,count=54){if(this.reduced)return;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*150;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1.1+Math.random()*.8,max:2,size:1+Math.random()*2.7,color:i%4===0?'174,220,211':'242,209,145'});}this.rings.push({x,y,r:10,life:1});this.start();}
 frame(now){this.frameId=0;if(document.hidden)return;const dt=Math.min((now-this.last)/1000,.05);this.last=now;const ctx=this.ctx,w=this.width,h=this.height;ctx.clearRect(0,0,w,h);
  if(this.mode==='shuffling'){
   const time=now*.0006,cx=w/2,cy=h*.43;
   for(let arm=0;arm<2;arm++){const a=time*(arm===0?1:-.8)+arm*Math.PI;const radius=Math.min(w*.28,h*.29);const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.58;
    this.particles.push({x,y,vx:Math.cos(a+1.5)*18,vy:Math.sin(a+1.5)*18-12,life:1.4,max:1.4,size:1+Math.random()*2,color:arm?'171,210,215':'238,202,137'});
   }
   ctx.strokeStyle='rgba(224,186,115,.17)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,Math.min(w*.28,h*.29),Math.min(w*.28,h*.29)*.58,time*.09,0,Math.PI*2);ctx.stroke();
  }
  this.particles=this.particles.filter(p=>p.life>0).slice(-220);
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;const alpha=Math.max(0,Math.min(1,p.life/p.max));ctx.fillStyle=`rgba(${p.color},${alpha})`;ctx.shadowBlur=9;ctx.shadowColor=`rgba(${p.color},.7)`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
  this.rings=this.rings.filter(r=>r.life>0);for(const r of this.rings){r.life-=dt;r.r+=dt*160;ctx.strokeStyle=`rgba(245,216,158,${Math.max(0,r.life)*.35})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();}
  if(this.mode!=='idle'||this.particles.length||this.rings.length)this.frameId=requestAnimationFrame(t=>this.frame(t));
 }
 destroy(){cancelAnimationFrame(this.frameId);this.frameId=0;this.resizeObserver.disconnect();this.particles=[];this.rings=[];this.ctx.clearRect(0,0,this.width,this.height);}
}

// Fit a complete formation to the available full-screen stage, including its labels.
export function fitFormation(positions,width,height,compact=false){
 const gap=height<300?22:compact?34:42,maximum=positions.length===1?330:positions.length<=3?270:180;
 const minX=Math.min(...positions.map(p=>p.x)),maxX=Math.max(...positions.map(p=>p.x)),minY=Math.min(...positions.map(p=>p.y)),maxY=Math.max(...positions.map(p=>p.y));
 const place=cw=>{const ch=cw/.584,outerW=positions.some(p=>p.angle===90)?ch:cw;return positions.map(p=>({x:maxX===minX?width/2:outerW/2+9+(p.x-minX)/(maxX-minX)*(width-outerW-18),y:maxY===minY?(height-gap)/2:ch/2+9+(p.y-minY)/(maxY-minY)*(height-ch-gap-18)}));};
 const valid=cw=>{const centered=place(cw),rects=positions.map((p,i)=>{const h=cw/.584,side=p.angle===90,ww=side?h:cw,hh=side?cw:h;return {l:centered[i].x-ww/2,r:centered[i].x+ww/2,t:centered[i].y-hh/2,b:centered[i].y+hh/2+gap};});if(rects.some(r=>r.l<7||r.r>width-7||r.t<5||r.b>height-4))return false;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){if(positions[i].angle===90||positions[j].angle===90)continue;const a=rects[i],b=rects[j];if(a.l<b.r+7&&a.r+7>b.l&&a.t<b.b+5&&a.b+5>b.t)return false;}return true;};
 let lo=10,hi=maximum;for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(valid(mid))lo=mid;else hi=mid;}const cardWidth=Math.max(10,Math.floor(lo));return {cardWidth,labelGap:gap,positions:place(cardWidth)};
}
