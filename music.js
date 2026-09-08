export class AmbientMusic {
 constructor(){this.ctx=null;this.playing=false;this.theme='moon';this.volume=.38;this.timer=null;this.beat=0;this.next=0;this.nodes=new Set();}
 async init(){
  if(this.ctx)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('这个浏览器暂不支持音乐播放。');
  this.ctx=new AC();const c=this.ctx;
  this.master=c.createGain();this.master.gain.value=0;
  this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-20;this.limiter.knee.value=16;this.limiter.ratio.value=4;this.limiter.attack.value=.02;this.limiter.release.value=.5;
  this.master.connect(this.limiter);this.limiter.connect(c.destination);
  this.dry=c.createGain();this.dry.gain.value=.6;this.dry.connect(this.master);
  this.reverb=c.createConvolver();const length=Math.floor(c.sampleRate*5);const impulse=c.createBuffer(2,length,c.sampleRate);
  for(let ch=0;ch<2;ch++){const a=impulse.getChannelData(ch);for(let i=0;i<length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/length,3.6)*.55;}
  this.reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.4;this.reverb.connect(wet);wet.connect(this.master);
 }
 route(node){node.connect(this.dry);node.connect(this.reverb);}
 tone(freq,time,duration,level=.13,kind='bell'){
  const c=this.ctx;if(!c)return;
  const voice=c.createGain();voice.gain.setValueAtTime(0,time);voice.gain.linearRampToValueAtTime(level,time+(kind==='pad'?2.4:.03));voice.gain.exponentialRampToValueAtTime(.0001,time+duration);
  const pan=c.createStereoPanner?c.createStereoPanner():c.createGain();if(pan.pan)pan.pan.value=(Math.random()-.5)*1.1;voice.connect(pan);this.route(pan);
  const parts=kind==='pad'?[[1,.6],[2,.1],[1.002,.22]]:kind==='bowl'?[[1,.65],[2.01,.18],[2.76,.09],[4.07,.025]]:[[1,.72],[2,.13],[3,.03]];
  let remaining=parts.length;
  parts.forEach(([ratio,amp])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=freq*ratio;const g=c.createGain();g.gain.value=amp;o.connect(g);g.connect(voice);o.start(time);o.stop(time+duration+.1);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();if(--remaining===0){voice.disconnect();pan.disconnect();}};});
 }
 schedule(){
  if(!this.playing)return;
  const c=this.ctx;const themes={moon:{base:48,step:1.5,melody:[12,null,19,null,16,null,14,null,12,null,7,null,9,null,7,null],chords:[[0,7,11,16],[-3,4,7,14],[-7,0,4,11],[-5,2,7,9]]},stars:{base:50,step:1.25,melody:[12,19,null,21,19,null,16,null,14,null,12,7,null,9,null,null],chords:[[0,7,12,16],[-3,4,9,14],[-7,0,7,11],[-5,2,9,14]]},forest:{base:45,step:1.75,melody:[12,null,null,7,null,14,null,null,16,null,14,null,7,null,null,null],chords:[[0,7,12,15],[-5,2,7,10],[-7,0,5,8],[-2,5,10,14]]}};
  const t=themes[this.theme];let loops=0;
  if(this.next<c.currentTime-.5)this.next=c.currentTime+.05;
  while(this.next<c.currentTime+.25&&loops++<3){const beat=this.beat;const chord=t.chords[Math.floor(beat/16)%4];
   if(beat%16===0){chord.forEach((n,i)=>this.tone(440*2**((t.base+n-69)/12),this.next+i*.16,t.step*18,.062,'pad'));this.tone(440*2**((t.base-12-69)/12),this.next,10,.11,'bowl');}
   const note=t.melody[beat%16];if(note!==null)this.tone(440*2**((t.base+note-69)/12),this.next,5,.11,'bell');
   this.beat++;this.next+=t.step;
  }
 }
 async start(){await this.init();await this.ctx.resume();this.playing=true;this.next=this.ctx.currentTime+.08;this.beat=0;this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.7);clearInterval(this.timer);this.schedule();this.timer=setInterval(()=>this.schedule(),180);}
 stop(){this.playing=false;clearInterval(this.timer);if(this.ctx){this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.25);for(const n of this.nodes){try{n.stop(this.ctx.currentTime+1.4);}catch{}}}}
 setVolume(v){this.volume=v;if(this.playing)this.master.gain.setTargetAtTime(v,this.ctx.currentTime,.1);}
 async setTheme(t){this.theme=t;if(this.playing){this.stop();await this.start();}}
 chime(index=0){if(this.playing)this.tone(440*2**(([72,76,79,83,86][index%5]-69)/12),this.ctx.currentTime+.02,3,.18);}
}
