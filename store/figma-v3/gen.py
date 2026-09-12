import json,sys
S='/tmp/claude-1000/-home-myen-glovebox/47520b79-9a33-481a-861f-352afc3a8d7f/scratchpad/'
loc=sys.argv[1]; frame=sys.argv[2]  # f1..f5
d=json.load(open('/home/myen/glovebox/store/figma-v3/translations.json'))
t=d[loc]
if isinstance(t,str): t=d[t]
nodes={k:v for k,v in json.load(open(S+'nodes.json')).items() if frame=='all' or v.startswith(frame+'.')}
t={k:v for k,v in t.items() if k in nodes.values()}
fam={'ja':'"Noto Sans JP"','ko':'"Noto Sans KR"'}.get(loc,'null')
js=open(S+'apply.js').read().replace('__NODES__',json.dumps(nodes,separators=(',',':'))).replace('__T__',json.dumps(t,ensure_ascii=False,separators=(',',':'))).replace('__FAMILY__',fam).replace('__LOC__',json.dumps(loc))
print(js)
