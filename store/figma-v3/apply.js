const N=__NODES__,T=__T__,F=__FAMILY__,SM={Bold:'Bold',Semibold:'SemiBold',Medium:'Medium',Regular:'Regular'};
const O=JSON.parse(figma.root.getPluginData('l10n-orig'));const R=[];const t0=Date.now();
const nodes={};for(const id of Object.keys(N))nodes[id]=await figma.getNodeByIdAsync(id);
const fonts={};for(const id of Object.keys(N))for(const g of O[id].segs){fonts[g.fontName.family+'|'+g.fontName.style]=g.fontName;if(F)fonts[F+'|'+(SM[g.fontName.style]||'Regular')]={family:F,style:SM[g.fontName.style]||'Regular'}}
for(const f of Object.values(fonts))await figma.loadFontAsync(f);const t1=Date.now();
for(const[id,k]of Object.entries(N)){const t=nodes[id];if(t.getPluginData('l10n')===T[k])continue;
const o=O[id],s=o.segs[0],f=F?{family:F,style:SM[s.fontName.style]||'Regular'}:s.fontName;
t.characters=T[k];const L=t.characters.length;t.setRangeFontName(0,L,f);t.setRangeFontSize(0,L,s.fontSize);t.setRangeFills(0,L,s.fills);
if(k.endsWith('headline')){const nl=t.characters.indexOf('\n');if(nl>0)t.setRangeFills(nl+1,L,o.segs[o.segs.length-1].fills);t.setRangeLineHeight(0,L,o.lh);
const lh=o.lh.value,want=Math.round(o.h/lh);let z=s.fontSize,cl=lh,ln=Math.round(t.height/cl);while(ln>want&&z>96){z-=8;cl=Math.round(lh*z/s.fontSize);t.setRangeFontSize(0,L,z);t.setRangeLineHeight(0,L,{unit:'PIXELS',value:cl});ln=Math.round(t.height/cl)}R.push([k,z,ln,want])}
else{const pb=t.parent.absoluteBoundingBox,b=t.absoluteBoundingBox,ov=Math.round(b.x+b.width-pb.x-pb.width);if(ov>-8)R.push([k,'over',ov,t.parent.name])}
t.setPluginData('l10n',T[k])}
const LOC=__LOC__;const FR=[["7852:4880","01-oil-change"],["7852:4905","02-log-service"],["7852:4927","03-history"],["7852:4951","04-garage"],["7852:4984","05-private"]];
for(const[id,name]of FR){const n=await figma.getNodeByIdAsync(id);const b=await n.exportAsync({format:'PNG',constraint:{type:'SCALE',value:1}});
const r=await fetch('http://localhost:9232/'+LOC+'/IPHONE_65/'+name+'.png',{method:'PUT',body:b});R.push([name,r.status])}
return {ms:Date.now()-t1,R};
