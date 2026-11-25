#!/usr/bin/env python3
"""Generate AURA SVG drawings. Dimensions in mm (see docs/03). Run: python3 make_svgs.py"""
import math
W, D, H = 360, 240, 24
Z1 = (-125, 0, 35)         # centre x, y(depth), radius mm  (relative to body centre)
Z2 = (60, 0, 85)           # TX coil radius 85 (dia 170)
STROKE = "#1f2937"
STYLE = """<style>
 text{font-family:Helvetica,Arial,sans-serif;fill:#1f2937}
 .t{font-size:13px}.s{font-size:10px;fill:#4b5563}.h{font-size:16px;font-weight:bold}
 .body{fill:#d7dadf;stroke:#1f2937;stroke-width:1.5}.glass{fill:#0f1318;stroke:#1f2937;stroke-width:1.5}
 .dim{stroke:#6b7280;stroke-width:.8;fill:none}.thin{stroke:#1f2937;stroke-width:1;fill:none}
 .led{fill:#3b82f6}.cu{stroke:#c87533;stroke-width:1.6;fill:none}.fer{fill:#374151}
</style>"""

def svg(w, h, title, inner, note=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'{STYLE}<rect width="100%" height="100%" fill="#ffffff"/>'
            f'<text x="20" y="28" class="h">AURA - {title}</text>'
            f'<text x="20" y="46" class="s">{note} Dimensions in mm. Schematic concept drawing, not a manufacturing drawing.</text>'
            f'{inner}</svg>')

def dimh(x1, x2, y, label):
    return (f'<line class="dim" x1="{x1}" y1="{y}" x2="{x2}" y2="{y}"/><line class="dim" x1="{x1}" y1="{y-5}" x2="{x1}" y2="{y+5}"/>'
            f'<line class="dim" x1="{x2}" y1="{y-5}" x2="{x2}" y2="{y+5}"/><text x="{(x1+x2)/2}" y="{y-6}" text-anchor="middle" class="s">{label}</text>')
def dimv(x, y1, y2, label):
    return (f'<line class="dim" x1="{x}" y1="{y1}" x2="{x}" y2="{y2}"/><line class="dim" x1="{x-5}" y1="{y1}" x2="{x+5}" y2="{y1}"/>'
            f'<line class="dim" x1="{x-5}" y1="{y2}" x2="{x+5}" y2="{y2}"/>'
            f'<text x="{x+8}" y="{(y1+y2)/2}" class="s">{label}</text>')

S = 2.0  # px per mm for plan/elevation
def plan_origin(): return 60 + W*S/2, 90 + D*S/2   # centre of body in px

def top_view(sensors=False, internal=False):
    cx, cy = plan_origin(); o = ""
    o += f'<rect class="body" x="{cx-W*S/2}" y="{cy-D*S/2}" width="{W*S}" height="{D*S}" rx="10"/>'
    if not internal:
        o += f'<rect class="glass" x="{cx-W*S/2+4}" y="{cy-D*S/2+4}" width="{W*S-8}" height="{D*S-8}" rx="7"/>'
    else:
        o += f'<rect fill="#eef2f0" stroke="{STROKE}" x="{cx-W*S/2+8}" y="{cy-D*S/2+8}" width="{W*S-16}" height="{D*S-16}" rx="6"/>'
    # zones
    z1x, z2x = cx + Z1[0]*S, cx + Z2[0]*S
    o += f'<circle cx="{z1x}" cy="{cy-10}" r="{35*S}" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 3"/>'
    o += f'<rect x="{z2x-110*S}" y="{cy-95*S}" width="{220*S}" height="{190*S}" rx="8" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 3"/>'
    o += f'<text x="{z1x}" y="{cy-10-35*S-8}" text-anchor="middle" class="t" style="fill:#60a5fa">Z1 PHONE (Ø70)</text>'
    o += f'<text x="{z2x}" y="{cy-95*S-8}" text-anchor="middle" class="t" style="fill:#60a5fa">Z2 LAPTOP 220x190 (TX coil Ø170)</text>'
    # LED bar
    o += f'<rect class="led" x="{cx-W*S/2+40}" y="{cy+D*S/2-20}" width="{W*S-80}" height="3" rx="1.5"/>'
    if internal:
        o += f'<circle cx="{z1x}" cy="{cy-10}" r="{30*S}" class="cu"/><circle cx="{z1x}" cy="{cy-10}" r="{16*S}" class="cu"/>'
        for r in (85,70,55,40):
            o += f'<circle cx="{z2x}" cy="{cy}" r="{r*S}" class="cu"/>'
        o += f'<circle cx="{z2x}" cy="{cy}" r="{92*S}" fill="none" stroke="#374151" stroke-width="3" opacity=".35"/>'
        # boards
        boards = [("MCU ESP32-S3",-130,85,80,36),("Inverter+driver",-30,85,80,36),("Buck-boost",60,85,70,36),("HW latch",150,85,46,36)]
        for n,x,y,w,h in boards:
            o += f'<rect x="{cx+(x-w/2)*S*0.9}" y="{cy+y*S*0.9-h*S*0.5+10}" width="{w*S*0.9}" height="{h*S*0.9}" fill="#1d6b3a" opacity=".55" stroke="{STROKE}" stroke-dasharray="5 3"/>'
            o += f'<text x="{cx+x*S*0.9}" y="{cy+y*S*0.9+14}" text-anchor="middle" class="s" style="fill:#fff">{n}</text>'
        o += f'<rect x="{cx-W*S/2+14}" y="{cy-D*S/2+14}" width="28" height="20" fill="#9ca3af" stroke="{STROKE}"/><text x="{cx-W*S/2+28}" y="{cy-D*S/2+28}" text-anchor="middle" class="s">FAN</text>'
        for p in [(-165,-105),(165,-105),(-165,105),(165,105)]:
            o += f'<rect x="{cx+p[0]*S-10}" y="{cy+p[1]*S-5}" width="20" height="10" fill="#d1d5db" stroke="{STROKE}"/>'
        o += f'<text x="{cx}" y="{cy-D*S/2+26}" text-anchor="middle" class="s">gray = load cells | copper = TX coils | grey ring = ferrite | dashed green = power PCBs on the LOWER layer (under spreader)</text>'
    if sensors:
        for (x,y) in [(Z2[0]-100,-85),(Z2[0]+100,-85),(Z2[0]-100,85),(Z2[0]+100,85)]:
            o += f'<rect x="{cx+x*S-9}" y="{cy+y*S-9}" width="18" height="18" fill="#f59e0b" stroke="{STROKE}"/>'
        for (dx,dy) in [(-40,-10),(40,-10),(0,-50),(0,30)]:
            o += f'<circle cx="{z1x+dx*S*0.9}" cy="{cy+dy*S*0.9}" r="6" fill="#22d3ee" stroke="{STROKE}"/>'
        o += f'<circle cx="{z1x}" cy="{cy+100*S*0.8}" r="8" fill="#ef4444" stroke="{STROKE}"/><circle cx="{z2x}" cy="{cy+110*S}" r="8" fill="#ef4444" stroke="{STROKE}"/>'
        for (x,y) in [(Z2[0]-45,-20),(Z2[0]+45,20)]:
            o += f'<polygon points="{cx+x*S},{cy+y*S-9} {cx+x*S+9},{cy+y*S+7} {cx+x*S-9},{cy+y*S+7}" fill="#a855f7" stroke="{STROKE}"/>'
        o += f'<circle cx="{z1x}" cy="{cy-10}" r="4" fill="#10b981"/>'
        lx, ly = 60, 90 + D*S + 50
        items=[("#f59e0b","LDC1612 metal-sense coil x4 (Z2 FOD)",'r'),("#22d3ee","Hall sensor x4 (Z1 magnet alignment)",'c'),
               ("#ef4444","ToF proximity x2",'c'),("#a855f7","MLX90614 IR thermopile x2",'t'),("#10b981","Z1 NTC (coil rear)",'c')]
        for i,(c,t,_) in enumerate(items):
            o += f'<rect x="{lx+(i%3)*250}" y="{ly+(i//3)*22}" width="12" height="12" fill="{c}" stroke="{STROKE}"/><text x="{lx+(i%3)*250+18}" y="{ly+(i//3)*22+11}" class="s">{t}</text>'
        o += f'<text x="{lx}" y="{ly+60}" class="s">Also: NTC x6 on coil backs, FETs, inductor, outlet air; load cells x4 under carrier plate (see internal layout); INA226 x3 on power rails.</text>'
    o += dimh(cx-W*S/2, cx+W*S/2, 80, "360")
    o += dimv(cx+W*S/2+25, cy-D*S/2, cy+D*S/2, "240")
    return o

def front_elev():
    cx = 60 + W*S/2; y0 = 140; h = H*S
    o = f'<rect class="body" x="{cx-W*S/2}" y="{y0}" width="{W*S}" height="{h}" rx="3"/>'
    o += f'<rect class="glass" x="{cx-W*S/2+1}" y="{y0}" width="{W*S-2}" height="{4*S}"/>'
    o += f'<rect class="led" x="{cx-W*S/2+40}" y="{y0+h-9}" width="{W*S-80}" height="2"/>'
    for x in (-150, 150): o += f'<rect x="{cx+x*S-12}" y="{y0+h}" width="24" height="6" rx="3" fill="#374151"/>'
    o += dimh(cx-W*S/2, cx+W*S/2, y0-20, "360") + dimv(cx+W*S/2+25, y0, y0+h, "24")
    o += f'<text x="{cx}" y="{y0+h+40}" text-anchor="middle" class="s">4 mm tempered glass (flush), 1.5 mm chamfer, anodised aluminium body, LED slit on front-lower edge</text>'
    return o

def side_elev():
    cx = 60 + D*S/2; y0 = 140; h = H*S
    o = f'<rect class="body" x="{cx-D*S/2}" y="{y0}" width="{D*S}" height="{h}" rx="3"/>'
    o += f'<rect class="glass" x="{cx-D*S/2+1}" y="{y0}" width="{D*S-2}" height="{4*S}"/>'
    for i in range(14): o += f'<rect x="{cx+D*S/2-40+(i%2)*0}" y="{y0+8+ (i%7)*0}" width="0" height="0"/>'
    for i in range(6): o += f'<rect x="{cx-D*S/2+30+i*18}" y="{y0+h-12}" width="10" height="3" fill="#111827"/>'
    for x in (-90, 90): o += f'<rect x="{cx+x*S-12}" y="{y0+h}" width="24" height="6" rx="3" fill="#374151"/>'
    o += dimh(cx-D*S/2, cx+D*S/2, y0-20, "240") + dimv(cx+D*S/2+25, y0, y0+h, "24")
    o += f'<text x="{cx}" y="{y0+h+40}" text-anchor="middle" class="s">Rear edge at right: vent slots + USB-C PD power recess (no cables on user-facing surface)</text>'
    return o

def section():
    x0, y0, w = 60, 110, 560
    layers = [("Glass 4","#0f1318",8),("Gap + sensor PCB (LDC) 2-3","#7c9a6d",6),("TX coil (Litz) ~3","#c87533",8),("Ferrite plate 2-3","#374151",7),
              ("Thermal pad + Al spreader 3","#9ca3af",8),("Power PCB cavity ~8","#1d6b3a",20),("Base plate + blower inlet 1.5","#d7dadf",6)]
    o=""; y=y0
    for n,c,h in layers:
        o += f'<rect x="{x0}" y="{y}" width="{w}" height="{h*4}" fill="{c}" stroke="{STROKE}"/><text x="{x0+w+14}" y="{y+h*2+4}" class="t">{n} mm</text>'
        y += h*4
    o += dimv(x0-24, y0, y, "~24 mm")
    o += f'<text x="{x0}" y="{y+30}" class="s">Section through Z2 (scale 4 px/mm). Laptop bottom + feet add 3-10 mm above the glass: total TX-RX gap budget is the key design number.</text>'
    return o

def exploded():
    cx=340; o=""; names=[("7 Glass top 4 mm + frit + IR window","#0f1318"),("6 LED light guide + diffuser","#3b82f6"),("5 Sensor/FOD PCB: LDC x4, Hall x4, ToF x2","#7c9a6d"),
        ("4 Z2 coil + ferrite  |  Z1 Qi2 module + magnets","#c87533"),("3 Al spreader + load-cell carrier","#9ca3af"),("2 Main PCB: ESP32-S3, inverter, buck-boost, protection","#1d6b3a"),("1 Aluminium base + blower + feet","#d7dadf")]
    y=90
    for i,(n,c) in enumerate(names):
        w=300; h=34
        pts=f"{cx-w/2},{y+h/2} {cx},{y} {cx+w/2},{y+h/2} {cx},{y+h}"
        o+=f'<polygon points="{pts}" fill="{c}" stroke="{STROKE}"/><line class="dim" x1="{cx}" y1="{y+h/2}" x2="{cx}" y2="{y+h/2+0}"/>'
        o+=f'<text x="{cx+w/2+16}" y="{y+h/2+4}" class="t">{n}</text>'
        if i<6: o+=f'<line class="dim" stroke-dasharray="3 3" x1="{cx}" y1="{y+h}" x2="{cx}" y2="{y+62}"/>'
        y+=62
    return o

def power_diagram():
    def box(x,y,w,h,t,c="#e5e7eb"): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{c}" stroke="{STROKE}"/><text x="{x+w/2}" y="{y+h/2+4}" text-anchor="middle" class="t">{t}</text>'
    def arr(x1,y1,x2,y2,lab=""):
        return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{STROKE}" stroke-width="1.6" marker-end="url(#a)"/>'
                f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2-6}" text-anchor="middle" class="s">{lab}</text>')
    o='<defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#1f2937"/></marker></defs>'
    o+='<text x="20" y="90" class="h" style="fill:#2563eb">Z1 - Qi2 phone (proven)</text>'
    o+=box(20,100,90,44,"20 V PD")+arr(110,122,140,122)+box(140,100,150,44,"Qi2 TX controller",'#dbeafe')+arr(290,122,320,122)+box(320,100,140,44,"TX coil + magnets",'#fde68a')
    o+='<line x1="460" y1="122" x2="520" y2="122" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6 4"/><text x="490" y="112" text-anchor="middle" class="s">magnetic</text>'
    o+=box(520,100,120,44,"Phone RX coil",'#fde68a')+arr(640,122,670,122)+box(670,100,90,44,"Battery",'#bbf7d0')
    o+='<text x="445" y="168" text-anchor="middle" class="s">in-band Qi communication (ASK/FSK) returns RX power requests to the TX controller</text>'
    o+='<text x="20" y="230" class="h" style="fill:#b45309">Z2 - Laptop (experimental)</text>'
    o+=box(20,240,70,44,"20 V PD")+arr(90,262,110,262)+box(110,240,140,44,"Buck-boost DC-link",'#fecaca')+arr(250,262,270,262)+box(270,240,150,44,"Full-bridge ~110 kHz",'#fecaca')
    o+=arr(420,262,440,262)+box(440,240,100,44,"C_tx + L_tx",'#fde68a')
    o+='<line x1="540" y1="262" x2="580" y2="262" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4"/><text x="560" y="234" text-anchor="middle" class="s">gap 6-10 mm</text>'
    o+=box(580,240,100,44,"L_rx + C_rx",'#fde68a')+arr(680,262,700,262)+box(700,240,80,44,"Rectifier",'#e5e7eb')
    o+=arr(740,284,740,330)+box(660,330,150,44,"Buck + PD source",'#e5e7eb')+arr(660,352,600,352)+box(480,330,120,44,"USB-C -> laptop",'#bbf7d0')
    o+=box(560,420,230,40,"RX ESP32-C3 (BLE telemetry)",'#e0e7ff')+arr(560,440,330,440,"Vout, Iout, T, contract")+box(200,420,130,40,"Hub ESP32-S3",'#e0e7ff')
    o+=arr(265,420,265,290,"DC-link / enable")
    o+='<text x="20" y="500" class="s">Hardware safety latch (NTC comparators + INA226 alert + eFuse PG) can cut the inverter enable independent of firmware.</text>'
    return o

files = {
 "01_front_elevation.svg": svg(760,300,"Front elevation",front_elev()),
 "02_side_elevation.svg": svg(560,300,"Side elevation",side_elev()),
 "03_top_view.svg": svg(840,560,"Top view",top_view()),
 "04_exploded_assembly.svg": svg(900,580,"Exploded assembly",exploded(),"Isometric-style stack, bottom=1."),
 "05_internal_layout.svg": svg(840,620,"Internal component layout (glass removed)",top_view(internal=True)),
 "06_sensor_placement.svg": svg(840,720,"Sensor placement",top_view(sensors=True)),
 "07_power_transmission.svg": svg(840,520,"Wireless power transmission",power_diagram()),
 "08_section_Z2.svg": svg(820,420,"Section through Z2 (layer stack)",section()),
}
for n,c in files.items():
    open(n,"w").write(c)
print(len(files),"files")
