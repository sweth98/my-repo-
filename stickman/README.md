# The Counter — stickman action short

Open `index.html` in a browser (no build, no dependencies).

- **Rig** (`js/rig.js`): fixed-length skeleton (head, neck, shoulders, elbows, wrists, hips, knees, ankles). Pseudo-3D body frame with yaw so the spin foreshortens; 2-bone IK plants feet so walks and stances don't slide; ground clamp keeps contact honest.
- **Engine** (`js/anim.js`): per-channel keyframes with easing (overshoot, anticipation, snap, gravity), Catmull-Rom for walk cycles, spring filters for follow-through on arms/head/torso, baked at 120 Hz, speed ramps (slow-mo, hit-stop).
- **Shot** (`js/choreo.js`): enter → notice → guard → dodge → spinning kick → fall → land & idle.
- **Player** (`js/app.js`): play/pause/restart, frame step, speed, loop, draggable timeline with beat markers and a dope sheet, PNG frame save, WebM export (MediaRecorder, records in real time).

Squash and stretch is applied to the spine length only (≤5%) at takeoff and landing; all limb lengths are constant.
