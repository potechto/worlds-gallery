"""Create a self-contained demo HTML from local CSS, JS, and NASA Earth texture.
External Wikimedia Commons place photos remain optional online media; the demo works without them.
"""
from pathlib import Path
import base64
p=Path(__file__).resolve().parent
html=(p/'index.html').read_text(encoding='utf-8')
earth='data:image/jpeg;base64,'+base64.b64encode((p/'earth_bluemarble.jpg').read_bytes()).decode()
for name in ('styles.css','portal.css'):
 css=(p/name).read_text(encoding='utf-8').replace("url('earth_bluemarble.jpg')","url('"+earth+"')")
 html=html.replace('<link rel="stylesheet" href="'+name+'">','<style>\n'+css+'\n</style>')
for name in ('data.js','world_geometry.js','ph_coastline.js','ph_admin_geo.js','place_highlights.js','globe.js','app.js','timezones.js','portal.js'):
 src=(p/name).read_text(encoding='utf-8')
 if name=='portal.js':src=src.replace("EARTH_SOURCE='earth_bluemarble.jpg'", "EARTH_SOURCE='"+earth+"'")
 html=html.replace('<script src="'+name+'"></script>','<script>\n'+src+'\n</script>')
html=html.replace('Worlds Gallery — Every picture has a world behind it','Worlds Gallery V5 — The Earth is your entrance')
(p/'Worlds_Gallery_V5_Preview.html').write_text(html,encoding='utf-8')
print('Created standalone preview',len(html),'characters')
