/* =========================================================================
   auth.js — Autenticação Mine Painel Meta Ads
   Senhas armazenadas como SHA-256. Sessão em sessionStorage (apaga ao fechar).
   ========================================================================= */
(function(){
  "use strict";

  // ---- usuários -----------------------------------------------------------
  // Para trocar senha: rode SHA-256 da nova senha e substitua o hash aqui.
  var USERS = [
    { user:"admin",   hash:"a71ddaee076561c3008fec3b4ab4280f32160071cfcf21ae9d781d4aee360767", role:"admin",  accountId:null,              name:"Admin" },
    { user:"life",    hash:"5ce386e818eaa999ebc56b74a491003509e1d9e3b858f20ab2064f101a36b3b2", role:"client", accountId:"996138788068033",  name:"Life Drink Bar" },
    { user:"village", hash:"d7503c4ee3085681abdb7bcbc40ad3bc7c338b9b0d679d84b46f672ae2d2ac79", role:"client", accountId:"787633890652103",  name:"Village Steakhouse" },
    { user:"kyokai",  hash:"e0daf4557b6357d51fb3cad2f3cf1433b67610d9f080d7fe95b3c136771c20c0", role:"client", accountId:"3890380901253199", name:"Kyokai Sushi Bar" },
    { user:"otica",   hash:"5c63a76f51dddd0159b2a9ca82b7c1eadd231d032f93ec22e26843a70049785a", role:"client", accountId:"853572560704252",  name:"Ótica Aliança" },
    { user:"texsa",   hash:"14b4c159d516ee4700108e514283108915a7ec95dadd75ad54029e67b6f1a735", role:"client", accountId:"1018517297786259", name:"Texsa Lubrificante" },
    { user:"treina",  hash:"e7c71db3b3b2bfd78750a6e1a9c91b21c895963123f7dc11d497a9abdf2443a8", role:"client", accountId:"1422408889638342", name:"Treinadores GB" },
    { user:"recanto", hash:"b5c6cbfd70c8e9407763b9efe39c22bcd3315c32c4edf4250d855e9841dfa5b5", role:"client", accountId:"26505177645746881",  name:"Recanto da Pizza" },
    { user:"gelato",  hash:"08ff380104019493d5a67a9d62e49af42fa39894d2672add08490b70df480135", role:"client", accountId:"842679138932536",   name:"Gelato Borelli" },
    { user:"hana",    hash:"2e0ebdaba0e8e726daf3cab3200afa51365d6d2527f4a4847c19ecc91c310608", role:"client", accountId:"466200930515969",   name:"Hana Sushi Bar" }
  ];

  var SESSION_KEY = "mine_auth_v1";

  // Redireciona para HTTPS se estiver em HTTP (crypto.subtle exige contexto seguro)
  if(location.protocol === "http:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1"){
    location.replace("https:" + location.href.slice(5));
  }

  // SHA-256 via Web Crypto API (nativo no browser, retorna Promise)
  function sha256(msg){
    if(!window.crypto || !window.crypto.subtle){
      return Promise.reject(new Error("HTTPS necessario para autenticacao segura."));
    }
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg))
      .then(function(buf){
        return Array.from(new Uint8Array(buf))
          .map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
      });
  }

  window.AUTH = {
    // Verifica usuário + senha. Resolve com o objeto do usuário ou null.
    check: function(user, pass){
      return sha256(pass).then(function(h){
        var found = null;
        USERS.forEach(function(u){
          if(u.user === user.toLowerCase().trim() && u.hash === h) found = u;
        });
        return found;
      });
    },
    getSession: function(){
      try{ return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }catch(e){ return null; }
    },
    setSession: function(data){
      try{ sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); }catch(e){}
    },
    clearSession: function(){
      try{ sessionStorage.removeItem(SESSION_KEY); }catch(e){}
    }
  };
})();
