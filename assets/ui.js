/* assets/ui.js
   UI helper: theme toggle, entrance animations and Supabase init helper
*/
(function(global){
  // Default = light theme. We store 'dark' in localStorage when user enables dark mode.
  function isDark(){ return localStorage.getItem('theme') === 'dark'; }
  function applyTheme(){ if(isDark()){ document.documentElement.classList.add('dark-theme'); } else { document.documentElement.classList.remove('dark-theme'); } }
  function toggleTheme(){ localStorage.setItem('theme', isDark() ? 'light' : 'dark'); applyTheme(); }

  // Attach any theme toggle buttons present
  function attachThemeToggles(){ const els = document.querySelectorAll('#theme-toggle'); els.forEach(btn=>{ btn.addEventListener('click', toggleTheme); // set initial icon: show moon when dark active, sun otherwise
    if(isDark()){ btn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='currentColor'><path d='M20.742 13.045A8.088 8.088 0 0112 20c-4.411 0-8-3.589-8-8 0-3.657 2.493-6.748 5.915-7.7.3-.086.62.048.706.348.086.3-.048.62-.348.706C7.12 6.179 5 8.828 5 12c0 3.866 3.134 7 7 7 3.172 0 5.821-2.12 6.296-4.273.086-.3.406-.434.706-.348.3.086.434.406.348.706z'/></svg>`; } else { btn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='currentColor'><path d='M6.76 4.84l-1.8-1.79L3.17 4.85l1.79 1.79 1.8-1.8zM1 13h3v-2H1v2zm10-9h2V1h-2v3zm7.03 1.05l1.8-1.79-1.79-1.79-1.8 1.8 1.79 1.78zM17.24 19.16l1.8 1.79 1.79-1.79-1.79-1.79-1.8 1.79zM20 11v2h3v-2h-3zM11 20h2v3h-2v-3zM4.22 19.78l1.79-1.79-1.79-1.79-1.8 1.8 1.8 1.78zM12 6a6 6 0 100 12 6 6 0 000-12z'/></svg>`; } }); }

  // Small entrance animation for main content
  function animateIn(){ const mains = document.querySelectorAll('main, .glass, .max-w-6xl, #accounts-app, #admin-app'); mains.forEach((el,i)=>{ el.classList.add('animate-in'); el.style.animationDelay = (i*60)+'ms'; }); }

  // Supabase init helper used by pages that previously duplicated logic
  async function initSupabase(url, key){ if(!url || !key) return null; if(typeof supabase === 'undefined'){ // load CDN
      await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
    await new Promise(r=>setTimeout(r,80));
    const creator = (typeof supabase !== 'undefined' && supabase.createClient) ? supabase.createClient : (window.createClient || null);
    if(!creator) return null; const client = creator(url, key); global.__supabase = client; return client; }

  // Export helpers
  global.__ui = { applyTheme, toggleTheme, attachThemeToggles, animateIn, initSupabase };

  // Auto-run
  try{ applyTheme(); document.addEventListener('DOMContentLoaded', ()=>{ attachThemeToggles(); animateIn(); }); }catch(e){}
})(window);
