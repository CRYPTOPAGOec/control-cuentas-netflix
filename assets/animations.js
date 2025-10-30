/* assets/animations.js
   Inicializa animación sutil para los elementos .floating-logo.
   Usa variables data-* para controlar desplazamiento inicial, duración y escala.
*/
(function(){
  function rnd(min,max){ return Math.random()*(max-min)+min }
  function init(){
    const logos = document.querySelectorAll('.floating-logo');
    logos.forEach((el,i)=>{
      // read optional data attributes
      const dx = el.dataset.x || (rnd(-30,30)+'px');
      const dy = el.dataset.y || (rnd(-20,20)+'px');
      const dur = el.dataset.d || (rnd(9,18)+'s');
      const s = el.dataset.s || (1 + rnd(-0.12,0.14)).toFixed(2);
      const r = (rnd(-10,10)).toFixed(2)+'deg';
      // set CSS vars
      el.style.setProperty('--x0', '0px');
      el.style.setProperty('--y0', '0px');
      el.style.setProperty('--dx', dx);
      el.style.setProperty('--dy', dy);
      el.style.setProperty('--d', dur);
      el.style.setProperty('--s', s);
      el.style.setProperty('--r', r);
      // subtle random starting offset
      const offX = (rnd(-6,6)).toFixed(2)+'px';
      const offY = (rnd(-6,6)).toFixed(2)+'px';
      el.style.transform = `translate3d(${offX},${offY},0)`;
      // decide animation variant: from data-anim or random
      const anim = el.dataset.anim || (Math.random() > 0.5 ? 'rotate' : 'pulse');
      el.classList.add(`anim-${anim}`);
      // set duration variable
      el.style.setProperty('--d', dur);
      el.style.setProperty('animation-duration', dur);
      // animate gentle entrance (fade+scale) but respect reduced motion
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!prefersReduced){
        el.animate([{opacity:0, transform:`translate3d(${offX},${offY},0) scale(0.6)`},{opacity:1, transform:`translate3d(${offX},${offY},0) scale(${s})`}], {duration:700+ i*120, easing:'cubic-bezier(.2,.9,.3,1)', fill:'forwards'});
      } else {
        // ensure visible state if reduced-motion
        el.style.opacity = '1';
        el.style.transform = `translate3d(${offX},${offY},0) scale(${s})`;
      }
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
