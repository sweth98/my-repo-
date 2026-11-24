import { GLSL_NOISE } from './chunks';

// Final grade + transition pass: iris match-cut mask, radial motion blur, heat shimmer, vignette, grain.
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uAspect: { value: 16 / 9 },
    uTint: { value: [1, 1, 1] }, uSat: { value: 1 }, uContrast: { value: 1 }, uLift: { value: [0, 0, 0] },
    uIris: { value: 2 }, uIrisSoft: { value: 0.22 }, uIrisColor: { value: [0.05, 0.025, 0.012] }, uIrisCenter: { value: [0.5, 0.5] }, uIrisShape: { value: 0.0 },
    uBlur: { value: 0 }, uShimmer: { value: 0 }, uVignette: { value: 0.32 }, uGrain: { value: 0.03 }, uFade: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */ `
    ${GLSL_NOISE}
    uniform sampler2D tDiffuse; uniform float uTime,uAspect,uSat,uContrast,uIris,uIrisSoft,uBlur,uShimmer,uVignette,uGrain,uFade,uIrisShape;
    uniform vec3 uTint,uLift,uIrisColor; uniform vec2 uIrisCenter; varying vec2 vUv;
    vec3 aces(vec3 x){ x*=0.9; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }
    vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1./2.4))-.055, step(.0031308, c)); }
    vec3 samp(vec2 uv){ return toSRGB(aces(texture2D(tDiffuse, uv).rgb)); }
    void main(){
      vec2 uv = vUv;
      vec2 c = uIrisCenter;
      // heat shimmer (rising refractive wobble) above the centre of the roaster
      if (uShimmer > 0.001){
        float m = smoothstep(.55,.0,length((uv-vec2(.5,.62))*vec2(1.,1.4))) * uShimmer;
        uv += vec2(vnoise2(vec2(uv.x*40., uv.y*18. - uTime*3.)) - .5, vnoise2(vec2(uv.x*33.+4., uv.y*22. - uTime*2.4)) - .5) * .012 * m;
      }
      vec3 col;
      if (uBlur > 0.001){
        col = vec3(0.); float w=0.;
        for(int i=0;i<10;i++){ float k=float(i)/9.; vec2 p = mix(uv, c, k*uBlur); float ww = 1.-k*.6; col += samp(p)*ww; w+=ww; }
        col /= w;
      } else col = samp(uv);
      // grade
      float l = dot(col, vec3(.2126,.7152,.0722));
      col = mix(vec3(l), col, uSat);
      col = (col - .5)*uContrast + .5;
      col = col*uTint + uLift;
      // vignette
      vec2 q = (vUv-.5)*vec2(uAspect*.5+.5,1.);
      col *= 1. - uVignette*smoothstep(.25,.95,length(q)*1.25);
      // iris match-cut
      vec2 p = (vUv - c) * vec2(uAspect, 1.);
      float r = length(p * vec2(1., mix(1., 1.45, uIrisShape)));  // slightly oval (bean-shaped) iris
      float m = smoothstep(uIris, uIris + uIrisSoft, r);
      col = mix(col, uIrisColor*(.8+.4*vnoise2(vUv*3.+uTime*.05)), m);
      col = mix(col, uIrisColor, uFade);
      // film grain
      float gr = h21(vUv*vec2(1920.,1080.) + fract(uTime*7.1)*100.) - .5;
      col += gr * uGrain;
      gl_FragColor = vec4(col,1.);
    }`,
};
