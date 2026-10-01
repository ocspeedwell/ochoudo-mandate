#!/usr/bin/env python3
"""Offline aggregate-only CSV conversion. No person-level data is written."""
import argparse,csv,json,collections,pathlib,sys

def main():
 p=argparse.ArgumentParser(description='Produce aggregate-only polling-unit counts from INEC-style CSV.')
 p.add_argument('source',type=pathlib.Path);p.add_argument('destination',type=pathlib.Path)
 args=p.parse_args()
 counts=collections.Counter(); missing=collections.Counter(); total=0
 with args.source.open('r',encoding='utf-8-sig',newline='') as f:
  reader=csv.DictReader(f)
  required={'sname','lname','rname','pname','delim'}
  if not required.issubset(set(reader.fieldnames or [])):raise SystemExit('Missing required geographic fields: '+str(sorted(required-set(reader.fieldnames or []))))
  for row in reader:
   total+=1
   state=(row.get('sname') or '').strip().upper()
   if state!='IMO':missing['non_imo']+=1;continue
   key=tuple((row.get(field) or '').strip() for field in ('lname','rname','pname','delim'))
   if not all(key):missing['incomplete_geography']+=1;continue
   counts[key]+=1
 output=[{'lga':k[0],'ward':k[1],'polling_unit':k[2],'code':k[3],'registered_count':n} for k,n in sorted(counts.items())]
 args.destination.parent.mkdir(parents=True,exist_ok=True)
 args.destination.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 print('Input rows:',total)
 print('Aggregated entries:',sum(counts.values()))
 print('Polling unit records:',len(output))
 print('LGAs:',len({x['lga'] for x in output}))
 print('Wards:',len({(x['lga'],x['ward']) for x in output}))
 print('Excluded rows:',dict(missing))
 print('JSON size bytes:',args.destination.stat().st_size)
 print('NOTE: Entries are CSV rows, not necessarily unique voters; duplicates and source completeness are unverified.')
if __name__=='__main__':main()
