from PIL import Image
import numpy as np
src={'happy':'v1/happy.png','heads-up':'v1/headsup.png','worried':'v1/worried.png','sleepy':'v2/sleepy.png','celebrating':'v1/celebrating.png'}
C=480; BW=300; OUT='/home/myen/glovebox/assets/mascot'
prev=[]
for name,f in src.items():
  im=Image.open(f).convert('RGBA'); a=np.array(im).astype(int)
  body=(a[...,3]>200)&(a[...,2]>200)&(a[...,0]<120)&(a[...,1]>90)&(a[...,1]<160)
  ys,xs=np.where(body); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
  s=BW/(x1-x0); im2=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
  cx=(x0+x1)/2*s; cy=(y0+y1)/2*s
  out=Image.new('RGBA',(C,C),(0,0,0,0))
  out.paste(im2,(round(C/2-cx),round(C*0.53-cy)),im2)
  full=np.array(out)[...,3]; print(name,'body',x1-x0,y1-y0,'edges',full[0].max(),full[-1].max(),full[:,0].max(),full[:,-1].max())
  out.save(f'{OUT}/car-{name}@3x.png',optimize=True)
  out.resize((320,320),Image.LANCZOS).save(f'{OUT}/car-{name}@2x.png',optimize=True)
  out.resize((160,160),Image.LANCZOS).save(f'{OUT}/car-{name}.png',optimize=True)
  bg=Image.new('RGBA',(C,C),(10,11,13,255)); bg.alpha_composite(out); prev.append(bg)
sheet=Image.new('RGB',(C*5,C)); [sheet.paste(p.convert('RGB'),(i*C,0)) for i,p in enumerate(prev)]; sheet.save('final_sheet.jpg')
