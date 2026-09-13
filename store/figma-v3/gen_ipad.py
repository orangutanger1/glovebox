"""Emit the per-locale plugin script for the iPad frames. Needs the one-time seed (translations + node map in root pluginData 'l10n-ipad-T' / 'l10n-ipad-N', originals in 'l10n-orig-ipad').
usage: gen_ipad.py <locale> [noexport] | gen_ipad.py - seed   — paste output into figma_execute."""
import json,sys,os
H=os.path.dirname(__file__)
loc=sys.argv[1]; export='noexport' not in sys.argv[2:]
d=json.load(open(os.path.join(H,'translations.json')))
t=d[loc]
if isinstance(t,str): t=d[t]
nodes=d['nodes_ipad']
t={k:v for k,v in t.items() if k in nodes.values()}
fam={'ja':'"Noto Sans JP"','ko':'"Noto Sans KR"'}.get(loc,'null')
if 'seed' in sys.argv[2:]:
    allT={l:{k:v for k,v in (d[d[l]] if isinstance(d[l],str) else d[l]).items() if k in nodes.values()} for l in d if l not in('_note','_note_ipad','nodes','nodes_ipad')}
    print("figma.root.setPluginData('l10n-ipad-T',"+json.dumps(json.dumps(allT,ensure_ascii=False,separators=(',',':')),ensure_ascii=False)+");figma.root.setPluginData('l10n-ipad-N',"+json.dumps(json.dumps(nodes,separators=(',',':')))+");return 'seeded';")
    sys.exit()
js=open(os.path.join(H,'apply_ipad_pd.js')).read().replace('__FAMILY__',fam).replace('__LOC__',json.dumps(loc)).replace('__EXPORT__','true' if export else 'false')
print(js)
