"""Optional updater for offline Philippine administrative shapes from geoBoundaries gbOpen.
Run from the project root: python tools/fetch_ph_boundaries.py
Uses internet, downloads country-level ADM1/2/3 simplified geometries and saves ph_admin_geo.js.
Requires no third-party Python packages. Review metadata/license in geo/ph_boundaries_metadata.json.
"""
from pathlib import Path
from urllib.request import urlopen, Request
import json, sys, time
ROOT=Path(__file__).resolve().parent.parent
SOURCE='https://www.geoboundaries.org/api/current/gbOpen/PHL/{level}/'
output={};metadata={}
def fetch(url):
 req=Request(url,headers={'User-Agent':'WorldsGalleryDemo/0.5 (education; offline-map preparation)'})
 with urlopen(req,timeout=55) as r:
  return json.loads(r.read().decode('utf-8'))
for lev in ['ADM1','ADM2','ADM3']:
 print('Checking:',lev,flush=True)
 try:
  meta=fetch(SOURCE.format(level=lev))
  if isinstance(meta,list):meta=meta[0]
  url=meta.get('simplifiedGeometryGeoJSON') or meta.get('gjDownloadURL')
  if not url:raise RuntimeError('No download URL returned')
  data=fetch(url)
  if data.get('type')!='FeatureCollection':raise RuntimeError('Unexpected response type')
  output[lev]=data
  metadata[lev]={k:meta.get(k) for k in ['boundaryID','boundaryYearRepresented','boundaryLicense','boundarySource','licenseSource','buildDate','gjDownloadURL','simplifiedGeometryGeoJSON']}
  print('  Features:',len(data.get('features',[])),flush=True)
  time.sleep(.4)
 except Exception as ex:
  print('WARNING:',lev,'not downloaded:',ex,file=sys.stderr)
if not output:
 print('No changes written. Check internet connection and URL.');sys.exit(1)
(ROOT/'ph_admin_geo.js').write_text('/* Derived from geoBoundaries gbOpen: https://www.geoboundaries.org/ - attribution and license metadata in geo/ph_boundaries_metadata.json */\nwindow.PH_ADMIN_GEO='+json.dumps(output,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'geo').mkdir(exist_ok=True)
(ROOT/'geo'/'ph_boundaries_metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print('Saved ph_admin_geo.js; refresh your browser. Verify updated boundary names against PSA PSGC 2026 before production use.')
