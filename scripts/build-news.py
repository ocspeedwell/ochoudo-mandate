#!/usr/bin/env python3
"""Create crawler-readable static article pages from publicly published Supabase articles."""
import json, os, re, html, urllib.request, urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='https://ochoudomandategroup.com.ng'
CONFIG=(ROOT/'newsroom-config.js').read_text()
url=re.search(r"url:'([^']+)'",CONFIG).group(1)
key=re.search(r"key:'([^']+)'",CONFIG).group(1)
endpoint=url+'/rest/v1/omg_articles?select=title,slug,body,excerpt,category,featured_image_url,published_at,author_name&status=eq.published&order=published_at.desc&limit=1000'
req=urllib.request.Request(endpoint,headers={'apikey':key,'Authorization':'Bearer '+key,'Accept':'application/json'})
with urllib.request.urlopen(req,timeout=35) as response: articles=json.load(response)
if not isinstance(articles,list): raise ValueError('Unexpected response')
folder=ROOT/'news'; folder.mkdir(exist_ok=True)
def e(s):return html.escape(str(s or ''),quote=True)
slugs=set()
for a in articles:
 slug=a.get('slug','')
 if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):continue
 slugs.add(slug)
 title=a.get('title') or 'Ochoudo Newsroom'
 description=(a.get('excerpt') or title).strip()[:300]
 image=a.get('featured_image_url') or BASE+'/assets/ochoudo-logo3.png'
 if not image.startswith('https://'): image=BASE+'/assets/ochoudo-logo3.png'
 canonical=BASE+'/news/'+slug+'.html'
 body='\n'.join('<p>'+e(p).replace('\n','<br>')+'</p>' for p in re.split(r'\n\s*\n',a.get('body') or '') if p.strip())
 page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} | Ochoudo Newsroom</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{e(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Ochoudo Mandate Group"><meta property="og:locale" content="en_NG"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{e(canonical)}"><meta property="og:image" content="{e(image)}"><meta property="og:image:alt" content="{e(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(description)}"><meta name="twitter:image" content="{e(image)}"><link rel="icon" href="/assets/ochoudo-favicon.png"><link rel="stylesheet" href="/newsroom.css"></head><body><header><a href="/index.html"><img src="/assets/ochoudo-logo3.png" alt="OMG"></a><nav><a href="/index.html">Home</a><a href="/newsroom.html">Newsroom</a><a href="/membership.html" class="join">Join OMG</a></nav></header><main class="wrap"><article class="article"><a href="/newsroom.html">← Back to Newsroom</a><p class="tag">{e(a.get('category'))}</p><h1>{e(title)}</h1><p class="muted">{e(a.get('author_name') or 'OMG Media Team')}</p>{'<img src="'+e(image)+'" alt="'+e(title)+'">' if a.get('featured_image_url') else ''}<div class="article-body">{body}</div><div class="cta"><h2>Learn more about our movement</h2><p>Membership is voluntary and open to interested supporters.</p><a class="btn" href="/membership.html">Join OMG</a></div><button class="btn" id="share" onclick="shareArticle()">Share this story</button></article></main><footer>© Ochoudo Mandate Group<div class="coreknight-credit" style="margin-top:12px;font-size:0.85rem;text-align:center">Developed by <a href="https://coreknight.com" target="_blank" rel="noopener noreferrer">CoreKnight Technologies Ltd</a></div></footer><script>async function shareArticle(){{if(navigator.share){{try{{await navigator.share({{title:document.title,url:location.href}})}}catch(e){{}}}}else{{await navigator.clipboard.writeText(location.href);document.getElementById('share').textContent='Link copied'}}}}</script></body></html>'''
 (folder/(slug+'.html')).write_text(page,encoding='utf-8')
for p in folder.glob('*.html'):
 if p.stem not in slugs:p.unlink()
print('Generated',len(slugs),'published article pages')
