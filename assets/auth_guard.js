/* assets/auth_guard.js
   Proporciona guards cliente para requerir sesión y requerir admin.
*/
(function(global){
  async function ensureClient(){
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if(!url || !key) return null;
    if(window.__supabase) return window.__supabase;
    if(window.__ui && window.__ui.initSupabase) return await window.__ui.initSupabase(url, key);
    // Fallback: cargar CDN y crear cliente
    if(typeof supabase === 'undefined'){
      await new Promise((res, rej)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    }
    await new Promise(r=>setTimeout(r,80));
    const creator = (typeof supabase !== 'undefined' && supabase.createClient) ? supabase.createClient : (window.createClient || null);
    if(!creator) return null;
    const client = creator(url, key);
    window.__supabase = client;
    return client;
  }

  async function getSessionUser(){
    try{
      const client = await ensureClient();
      if(!client) return null;
      // v2: auth.getSession()
      try{
        const { data } = await client.auth.getSession();
        const session = data?.session;
        if(session && session.user) return session.user;
      }catch(e){ /* ignore */ }
      try{
        const { data } = await client.auth.getUser();
        return data?.user || null;
      }catch(e){ /* ignore */ }
    }catch(e){ console.error('auth_guard getSessionUser error', e); }
    return null;
  }

  async function requireAuth(){
    const user = await getSessionUser();
    if(!user){ // no session -> redirect to login
      try{ const next = encodeURIComponent(window.location.pathname + window.location.search); window.location.href = `login.html?next=${next}`; }catch(e){ window.location.href = 'login.html'; }
      return false;
    }
    return true;
  }

  async function requireAdmin(){
    const ok = await requireAuth();
    if(!ok) return false;
    try{
      const client = window.__supabase || await ensureClient();
      if(!client) { window.location.href = 'login.html'; return false; }
      const { data, error } = await client.rpc('is_admin');
      if(error) { console.warn('is_admin rpc error', error); window.location.href='login.html'; return false; }
      const isAdmin = (data === true) || (Array.isArray(data) && data.length && (data[0] === true || data[0] === 1)) || (data && data.is_admin);
      if(!isAdmin){ window.location.href = 'login.html'; return false; }
      return true;
    }catch(e){ console.error('requireAdmin error', e); window.location.href='login.html'; return false; }
  }

  async function redirectIfAuthenticated(redirectTo = 'accounts.html'){
    // Si la URL de login contiene ?next=..., respetarla (no redirigir desde login si vino de otro recurso)
    try{ const params = new URLSearchParams(window.location.search); if(params.get('next')) return false; }catch(e){}
    const user = await getSessionUser();
    if(user){ window.location.href = redirectTo; return true; }
    return false;
  }

  global.__auth = { ensureClient, getSessionUser, requireAuth, requireAdmin, redirectIfAuthenticated };
})(window);
