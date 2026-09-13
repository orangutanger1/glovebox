// Per-locale runner once seed (translations in root pluginData 'l10n-ipad-T', nodes in 'l10n-ipad-N') is in place.
const LOC=__LOC__,F=__FAMILY__,EXPORT=__EXPORT__;
const N=JSON.parse(figma.root.getPluginData('l10n-ipad-N')),T=JSON.parse(figma.root.getPluginData('l10n-ipad-T'))[LOC],SM={Bold:'Bold',Semibold:'SemiBold',Medium:'Medium',Regular:'Regular'};
const O=JSON.parse(figma.root.getPluginData('l10n-orig-ipad'));const R=[];
const nodes={};for(const id of Object.keys(N))nodes[id]=await figma.getNodeByIdAsync(id);
const fonts={};for(const id of Object.keys(N))for(const g of O[id].segs){fonts[g.fontName.family+'|'+g.fontName.style]=g.fontName;if(F)fonts[F+'|'+(SM[g.fontName.style]||'Regular')]={family:F,style:SM[g.fontName.style]||'Regular'}}
for(const f of Object.values(fonts))await figma.loadFontAsync(f);const t1=Date.now();
for(const[id,k]of Object.entries(N)){const t=nodes[id];if(t.getPluginData('l10n')===T[k])continue;
const o=O[id],s=o.segs[0],f=F?{family:F,style:SM[s.fontName.style]||'Regular'}:s.fontName;
t.characters=T[k];const L=t.characters.length;t.setRangeFontName(0,L,f);t.setRangeFontSize(0,L,s.fontSize);t.setRangeFills(0,L,s.fills);
if(k.endsWith('headline')){const nl=t.characters.indexOf('\n');if(nl>0)t.setRangeFills(nl+1,L,o.segs[o.segs.length-1].fills);t.setRangeLineHeight(0,L,o.lh);
const lh=o.lh.value,want=Math.round(o.h/lh);let z=s.fontSize,cl=lh,ln=Math.round(t.height/cl);while(ln>want&&z>124){z-=10;cl=Math.round(lh*z/s.fontSize);t.setRangeFontSize(0,L,z);t.setRangeLineHeight(0,L,{unit:'PIXELS',value:cl});ln=Math.round(t.height/cl)}
if(t.textAlignHorizontal==='CENTER')t.x=(t.parent.width-t.width)/2;R.push([k,z,ln,want])}
else{const pb=t.parent.absoluteBoundingBox,b=t.absoluteBoundingBox,ov=Math.round(b.x+b.width-pb.x-pb.width);if(ov>-8)R.push([k,'over',ov,t.parent.name])}
t.setPluginData('l10n',T[k])}
const FR=[["7878:4488","01-oil-change"],["7878:4592","02-log-service"],["7878:4660","03-history"],["7878:4743","04-garage"],["7878:4886","05-private"]];
if(EXPORT)for(const[id,name]of FR){const n=await figma.getNodeByIdAsync(id);const b=await n.exportAsync({format:'PNG',constraint:{type:'SCALE',value:1}});
const r=await fetch('http://localhost:9232/'+LOC+'/IPAD_PRO_3GEN_129/'+name+'.png',{method:'PUT',body:b});R.push([name,r.status,b.length])}
return {ms:Date.now()-t1,R};
