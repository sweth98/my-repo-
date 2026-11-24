// Depth-of-field: thin-lens circle of confusion from the scene depth texture + golden-angle gather (bokeh-like).
export const DofShader = {
  uniforms: {
    tColor: { value: null }, tDepth: { value: null }, uNear: { value: 0.1 }, uFar: { value: 200 }, uFocus: { value: 5 },
    uAperture: { value: 0.02 }, uMaxBlur: { value: 0.03 }, uAspect: { value: 16 / 9 }, uSamples: { value: 28 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tColor,tDepth; uniform float uNear,uFar,uFocus,uAperture,uMaxBlur,uAspect; varying vec2 vUv;
    float linZ(vec2 uv){ float d = texture2D(tDepth, uv).x; return (2.*uNear*uFar)/(uFar+uNear-(2.*d-1.)*(uFar-uNear)); }
    float cocOf(float z){ return min(uAperture*abs(z-uFocus)/max(z,.01), uMaxBlur); }
    void main(){
      float z0 = linZ(vUv);
      float c0 = cocOf(z0);
      vec3 acc = texture2D(tColor, vUv).rgb; float wsum = 1.;
      if (c0 > .0006){
        for (int i=0;i<28;i++){
          float fi = float(i)+.5;
          float r = sqrt(fi/28.);
          float a = fi*2.39996323;
          vec2 off = vec2(cos(a), sin(a))*r*c0;
          vec2 uv = vUv + off*vec2(1./uAspect, 1.);
          float zs = linZ(uv);
          float cs = cocOf(zs);
          float dist = r*c0;
          // sample contributes if its own blur disc reaches the centre (prevents sharp-foreground halos)
          float reach = (zs < z0) ? max(cs, 0.) : c0;
          float w = smoothstep(dist*.7, dist*1.0+.0005, reach);
          vec3 s = texture2D(tColor, uv).rgb;
          float lum = dot(s, vec3(.3,.5,.2));
          w *= 1. + lum*lum*.6;
          acc += s*w; wsum += w;
        }
        acc /= wsum;
      }
      gl_FragColor = vec4(acc,1.);
    }`,
};
