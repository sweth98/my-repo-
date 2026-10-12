import json,sys
d=json.load(open('src/timing.json'))['lines']
for i in sys.argv[1:]:
    l=d[i]; print(i,l['start'],l['end'],'mid',(l['start']*0.45+l['end']*0.55)//1, 'late', int(l['start']*0.2+l['end']*0.8))
