// supabase_client_example.js
// Helper ligero para inicializar Supabase desde páginas estáticas.
// Uso: define window.SUPABASE_URL y window.SUPABASE_ANON_KEY en una etiqueta <script> antes de cargar este archivo
// Ejemplo:
// <script>window.SUPABASE_URL = 'https://xxxx.supabase.co'; window.SUPABASE_ANON_KEY = 'public-anon-key';</script>
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
// <script src="/supabase_client_example.js"></script>

(function(global){
  let supabase = null;

  function initSupabase(url, key){
    if (!url || !key) return null;
    if (!global.supabaseJs) {
      // if the CDN loaded @supabase/supabase-js it exposes createClient globally as supabaseJs.createClient
      if (typeof supabaseJs === 'undefined' && typeof window.createClient === 'undefined') {
        console.warn('Supabase JS no está cargado desde CDN. Asegúrate de incluir https://cdn.jsdelivr.net/npm/@supabase/supabase-js');
        return null;
      }
    }
    // prefer window.createClient if available
    const creator = window.createClient || (global.supabaseJs && global.supabaseJs.createClient);
    if (!creator) { console.warn('No se encontró createClient para Supabase.'); return null; }
    supabase = creator(url, key);
    global.__supabase = supabase;
    return supabase;
  }

  async function signup(email, password){
    if (!supabase) throw new Error('Supabase no inicializado');
    // signUp con password
    const resp = await supabase.auth.signUp({ email, password });
    return resp;
  }

  async function signin(email, password){
    if (!supabase) throw new Error('Supabase no inicializado');
    const resp = await supabase.auth.signInWithPassword({ email, password });
    return resp;
  }

  async function signout(){ if (!supabase) return; await supabase.auth.signOut(); }
  // Devuelve el usuario actual consultando la API de Supabase (no usar caches locales como fuente de verdad)
  async function getUser(){
    if (!supabase) return null;
    // v2: auth.getUser()
    if (supabase.auth && supabase.auth.getUser) {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    }
    // v1 fallback: supabase.auth.user() may be synchronous
    if (supabase.auth && typeof supabase.auth.user === 'function') {
      try { return supabase.auth.user(); } catch(e) { return null; }
    }
    return null;
  }

  // On auth state change helper
  function onAuthStateChange(callback){ if (!supabase) return; if (supabase.auth.onAuthStateChange) { supabase.auth.onAuthStateChange((event, session) => callback(event, session)); } }

  global.supabaseHelper = { initSupabase, signup, signin, signout, getUser, onAuthStateChange };
})(window);
