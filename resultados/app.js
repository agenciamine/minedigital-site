/* =========================================================================
   app.js — Painel Meta Ads (vanilla JS, SVG nativo)
   Telas: Visão Geral  +  Cliente individual (detalhe máximo)
   Pages Insights: entrada manual persistida em localStorage.
   ========================================================================= */
(function () {
  "use strict";
  var D = window.DASH_DATA;

  // ---- guarda de autenticação -------------------------------------------
  var SESSION = window.AUTH ? window.AUTH.getSession() : null;
  if(!SESSION){ window.location.replace("login.html"); return; }
  var IS_CLIENT = SESSION.role === "client";

  var TODAY = new Date();
  var STATE = { period: 30, preset: "30d", customFrom: null, customTo: null, view: "overview", metric: "spend" };
  var PAGES_AUTO = { updated: null, accounts: {} }; // alimentado por pages_data.json (robô diário)
  function loadAuto(cb){
    fetch("pages_data.json", { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if(j && j.accounts) PAGES_AUTO = j;
        // Atualiza "Atualizado em" com a data real da última coleta
        if(j && j.updated){
          var el=document.getElementById("gendate");
          if(el){
            var x=new Date(j.updated);
            var h=x.getHours().toString().padStart(2,"0");
            var m=x.getMinutes().toString().padStart(2,"0");
            el.innerHTML="Atualizado em <b>"+x.getDate()+" "+MES_ABR[x.getMonth()]+" "+x.getFullYear()+"</b> · "+h+"h"+m;
          }
        }
        cb();
      })
      .catch(function(){ cb(); });
  }

  // ---- formatadores -------------------------------------------------------
  var brl  = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
  var brl0 = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL", maximumFractionDigits:0 });
  var int  = new Intl.NumberFormat("pt-BR");
  function pct(v){ return (v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}) + "%"; }
  function compact(v){
    if (v>=1e6) return (v/1e6).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mi";
    if (v>=1e4) return (v/1e3).toLocaleString("pt-BR",{maximumFractionDigits:0})+" mil";
    return int.format(Math.round(v));
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  // ---- Tooltip customizado dos gráficos -----------------------------------
  var TIP=null;
  function ensureTip(){
    if(TIP) return TIP;
    TIP=document.createElement("div");TIP.className="chart-tip";
    TIP.innerHTML='<div class="ct-date"></div><div class="ct-val"></div>';
    document.body.appendChild(TIP);return TIP;
  }
  function showTip(label,val,cx,cy,color){
    var t=ensureTip();
    t.querySelector(".ct-date").textContent=label;
    t.querySelector(".ct-val").textContent=val;
    t.style.setProperty("--tip-color",color||"#ffd24a");
    t.style.display="block";
    var tx=cx+18, ty=cy-72;
    if(tx+160>window.innerWidth) tx=cx-165;
    if(ty<10) ty=cy+18;
    t.style.left=tx+"px"; t.style.top=ty+"px";
  }
  function hideTip(){ if(TIP) TIP.style.display="none"; }

  // ---- período / agregação ------------------------------------------------
  function activeRange(){
    if(STATE.preset==="custom" && STATE.customFrom && STATE.customTo){
      return { from: new Date(STATE.customFrom+"T00:00:00"), to: new Date(STATE.customTo+"T23:59:59") };
    }
    if(STATE.preset==="month"){
      return { from: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), to: new Date(TODAY) };
    }
    if(STATE.preset==="lastmonth"){
      return {
        from: new Date(TODAY.getFullYear(), TODAY.getMonth()-1, 1),
        to:   new Date(TODAY.getFullYear(), TODAY.getMonth(), 0, 23, 59, 59)
      };
    }
    var from=new Date(TODAY); from.setDate(from.getDate()-STATE.period);
    return { from: from, to: new Date(TODAY) };
  }
  function periodLabel(){
    if(STATE.preset==="custom" && STATE.customFrom && STATE.customTo){
      var f=STATE.customFrom.slice(5).replace("-","/"), t=STATE.customTo.slice(5).replace("-","/");
      return f+" – "+t;
    }
    if(STATE.preset==="month") return "Este mês";
    if(STATE.preset==="lastmonth") return "Mês passado";
    return STATE.period+" dias";
  }
  function dailyInPeriod(acc){
    var ads=PAGES_AUTO.accounts&&PAGES_AUTO.accounts[acc.id]&&PAGES_AUTO.accounts[acc.id].ads;
    var daily=ads&&ads.daily&&ads.daily.length?
      ads.daily.map(function(r){return {date:r.d,spend:r.spend,impr:r.impr,reach:r.reach,clicks:r.clicks};}):
      acc.daily;
    if(!daily) return [];
    var r=activeRange();
    return daily.filter(function(d){ var dt=new Date(d.date+"T12:00:00"); return dt>=r.from&&dt<=r.to; });
  }
  function sum(rows){
    var o={spend:0,impr:0,reach:0,clicks:0};
    rows.forEach(function(r){o.spend+=r.spend;o.impr+=r.impr;o.reach+=r.reach;o.clicks+=r.clicks;});
    o.spend=Math.round(o.spend*100)/100;
    o.ctr=o.impr?o.clicks/o.impr*100:0; o.cpc=o.clicks?o.spend/o.clicks:0;
    o.cpm=o.impr?o.spend/o.impr*1000:0; o.freq=o.reach?o.impr/o.reach:0;
    return o;
  }
  function totals(){
    var t={spend:0,impr:0,reach:0,clicks:0};
    D.accounts.forEach(function(a){var s=sum(dailyInPeriod(a));
      t.spend+=s.spend;t.impr+=s.impr;t.reach+=s.reach;t.clicks+=s.clicks;});
    t.spend=Math.round(t.spend*100)/100;
    t.ctr=t.impr?t.clicks/t.impr*100:0; t.cpc=t.clicks?t.spend/t.clicks:0;
    return t;
  }

  // ---- datas pt -----------------------------------------------------------
  var MES_ABR=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  function short(d){var x=new Date(d+"T12:00:00");return x.getDate()+"/"+(x.getMonth()+1);}
  function full(d){var x=new Date(d+"T12:00:00");return x.getDate()+" "+MES_ABR[x.getMonth()];}
  function monthLabel(m){var p=m.split("-");return MES_ABR[(+p[1])-1]+"/"+p[0].slice(2);}

  // ---- SVG ----------------------------------------------------------------
  var GOLD="#ffd24a", GOLD2="#ffb400", BLUE="#7b7dff", GREY="#5a5c66";
  function svgEl(tag,a){var e=document.createElementNS("http://www.w3.org/2000/svg",tag);
    for(var k in a)e.setAttribute(k,a[k]);return e;}

  function areaChart(rows, opts){
    opts=opts||{};
    var W=opts.w||820, H=opts.h||230, pl=opts.pl||48, pr=14, pt=14, pb=26;
    var iw=W-pl-pr, ih=H-pt-pb;
    var svg=svgEl("svg",{viewBox:"0 0 "+W+" "+H,class:"chart",height:H,preserveAspectRatio:"none"});
    if(!rows.length){return svg;}
    var max=Math.max.apply(null,rows.map(function(r){return r.value;}))||1; max*=1.12;
    var n=rows.length;
    function X(i){return pl+(n===1?iw/2:iw*i/(n-1));}
    function Y(v){return pt+ih-(v/max)*ih;}
    var gid="g"+Math.random().toString(36).slice(2,7);
    var defs=svgEl("defs");var lg=svgEl("linearGradient",{id:gid,x1:0,y1:0,x2:0,y2:1});
    lg.appendChild(svgEl("stop",{offset:"0%","stop-color":opts.color||GOLD,"stop-opacity":.42}));
    lg.appendChild(svgEl("stop",{offset:"100%","stop-color":opts.color||GOLD,"stop-opacity":0}));
    defs.appendChild(lg);svg.appendChild(defs);
    for(var g=0;g<=3;g++){
      var yy=pt+ih*g/3, val=max*(1-g/3);
      svg.appendChild(svgEl("line",{x1:pl,y1:yy,x2:W-pr,y2:yy,stroke:"rgba(255,255,255,.06)","stroke-width":1}));
      var tx=svgEl("text",{x:pl-8,y:yy+4,"text-anchor":"end",fill:"#6c6e77","font-size":10});
      tx.textContent=opts.money?brl0.format(val):compact(Math.round(val));svg.appendChild(tx);
    }
    var col=opts.color||GOLD;
    var d="M"+X(0)+","+Y(rows[0].value);
    for(var i=1;i<n;i++)d+=" L"+X(i)+","+Y(rows[i].value);
    svg.appendChild(svgEl("path",{d:d+" L"+X(n-1)+","+(pt+ih)+" L"+X(0)+","+(pt+ih)+" Z",fill:"url(#"+gid+")"}));
    svg.appendChild(svgEl("path",{d:d,fill:"none",stroke:col,"stroke-width":2.4,"stroke-linejoin":"round"}));
    var step=Math.ceil(n/9);
    for(var j=0;j<n;j++){
      if(rows[j].value>0){
        var c=svgEl("circle",{cx:X(j),cy:Y(rows[j].value),r:2.6,fill:col,stroke:"#0a0a0b","stroke-width":1});
        svg.appendChild(c);
      }
      if(j%step===0||j===n-1){
        var xt=svgEl("text",{x:X(j),y:H-7,"text-anchor":"middle",fill:"#6c6e77","font-size":9.5});
        xt.textContent=rows[j].short;svg.appendChild(xt);}
    }
    // ---- hover: linha vertical + ponto de destaque + tooltip customizado --
    var vLine=svgEl("line",{x1:pl,y1:pt,x2:pl,y2:pt+ih,
      stroke:"rgba(255,210,74,.5)","stroke-width":1,"stroke-dasharray":"4 3",display:"none"});
    var hRing=svgEl("circle",{r:6,fill:"none",stroke:col,"stroke-width":2,display:"none",opacity:.7});
    var hDot=svgEl("circle",{r:3.8,fill:col,stroke:"#0a0a0b","stroke-width":2,display:"none"});
    var overlay=svgEl("rect",{x:pl,y:0,width:iw,height:H,fill:"transparent",style:"cursor:crosshair"});
    svg.appendChild(vLine);svg.appendChild(hRing);svg.appendChild(hDot);svg.appendChild(overlay);
    overlay.addEventListener("mousemove",function(e){
      var rect=svg.getBoundingClientRect();
      var scx=W/rect.width;
      var mx=(e.clientX-rect.left)*scx;
      var best=0,bd=Infinity;
      for(var k=0;k<n;k++){var dd=Math.abs(X(k)-mx);if(dd<bd){bd=dd;best=k;}}
      var px=X(best),py=Y(rows[best].value);
      vLine.setAttribute("x1",px);vLine.setAttribute("x2",px);vLine.removeAttribute("display");
      hDot.setAttribute("cx",px);hDot.setAttribute("cy",py);hDot.removeAttribute("display");
      hRing.setAttribute("cx",px);hRing.setAttribute("cy",py);hRing.removeAttribute("display");
      showTip(rows[best].label,
        opts.money?brl.format(rows[best].value):int.format(rows[best].value),
        e.clientX,e.clientY,col);
    });
    overlay.addEventListener("mouseleave",function(){
      vLine.setAttribute("display","none");
      hDot.setAttribute("display","none");
      hRing.setAttribute("display","none");
      hideTip();
    });
    return svg;
  }
  function spark(vals,w,h,color){
    w=w||300;h=h||52;color=color||GOLD;
    var svg=svgEl("svg",{viewBox:"0 0 "+w+" "+h,class:"chart",height:h,preserveAspectRatio:"none"});
    if(!vals.length)return svg;
    var max=Math.max.apply(null,vals)||1,n=vals.length;
    function X(i){return n===1?w/2:w*i/(n-1);}function Y(v){return h-3-(v/max)*(h-8);}
    var gid="s"+Math.random().toString(36).slice(2,7);
    var defs=svgEl("defs");var lg=svgEl("linearGradient",{id:gid,x1:0,y1:0,x2:0,y2:1});
    lg.appendChild(svgEl("stop",{offset:"0%","stop-color":color,"stop-opacity":.35}));
    lg.appendChild(svgEl("stop",{offset:"100%","stop-color":color,"stop-opacity":0}));
    defs.appendChild(lg);svg.appendChild(defs);
    var d="M"+X(0)+","+Y(vals[0]);for(var i=1;i<n;i++)d+=" L"+X(i)+","+Y(vals[i]);
    svg.appendChild(svgEl("path",{d:d+" L"+X(n-1)+","+h+" L"+X(0)+","+h+" Z",fill:"url(#"+gid+")"}));
    svg.appendChild(svgEl("path",{d:d,fill:"none",stroke:color,"stroke-width":2,"stroke-linejoin":"round"}));
    return svg;
  }
  function donut(segs,size){
    size=size||140;var r=size/2,ir=r*0.62,cx=r,cy=r;
    var svg=svgEl("svg",{viewBox:"0 0 "+size+" "+size,height:size,width:size});
    var tot=segs.reduce(function(a,s){return a+s.value;},0)||1,ang=-Math.PI/2;
    segs.forEach(function(s){
      if(s.value<=0)return;
      var a2=ang+s.value/tot*Math.PI*2;
      var x1=cx+r*Math.cos(ang),y1=cy+r*Math.sin(ang),x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
      var xi2=cx+ir*Math.cos(a2),yi2=cy+ir*Math.sin(a2),xi1=cx+ir*Math.cos(ang),yi1=cy+ir*Math.sin(ang);
      var lg=(a2-ang)>Math.PI?1:0;
      var p=svgEl("path",{d:"M"+x1+","+y1+" A"+r+","+r+" 0 "+lg+" 1 "+x2+","+y2+" L"+xi2+","+yi2+" A"+ir+","+ir+" 0 "+lg+" 0 "+xi1+","+yi1+" Z",fill:s.color});
      var t=svgEl("title");t.textContent=s.label+" • "+pct(s.value/tot*100);p.appendChild(t);
      svg.appendChild(p);ang=a2;
    });
    return svg;
  }
  function hbars(items,fmt){
    var max=Math.max.apply(null,items.map(function(i){return i.value;}))||1;
    var w=document.createElement("div");w.className="hbars";
    items.forEach(function(it){
      var row=document.createElement("div");row.className="hbar";
      row.innerHTML='<span class="k">'+esc(it.k)+'</span><span class="t"><i style="width:'+
        (it.value/max*100).toFixed(1)+'%"></i></span><span class="n">'+(fmt?fmt(it.value):int.format(it.value))+'</span>';
      w.appendChild(row);
    });
    return w;
  }

  // ---- objetivo / status labels ------------------------------------------
  var OBJ={OUTCOME_ENGAGEMENT:"Engajamento",OUTCOME_SALES:"Vendas",OUTCOME_LEADS:"Cadastros",
    OUTCOME_TRAFFIC:"Tráfego",LINK_CLICKS:"Tráfego",OUTCOME_AWARENESS:"Reconhecimento"};
  function objLabel(o){return OBJ[o]||o;}
  function statusBadge(s){
    if(s==="ACTIVE")return '<span class="cb cb-on">Ativa</span>';
    if(s==="WITH_ISSUES")return '<span class="cb cb-warn">Com aviso</span>';
    return '<span class="cb cb-off">Pausada</span>';
  }

  /* =======================================================================
     OVERVIEW
     ======================================================================= */
  function renderOverview(){
    if(IS_CLIENT){ go(SESSION.accountId); return; }
    var t=totals();
    var kpis=[
      {l:"Investimento",v:brl.format(t.spend),f:periodLabel()},
      {l:"Impressões",v:compact(t.impr),f:int.format(t.impr)},
      {l:"Alcance",v:compact(t.reach),f:"acumulado"},
      {l:"Cliques",v:compact(t.clicks),f:int.format(t.clicks)},
      {l:"CTR médio",v:pct(t.ctr),f:"cliques / impr."},
      {l:"CPC médio",v:brl.format(t.cpc),f:"custo / clique"}
    ];
    var html='';
    html+='<section class="sec" style="margin-top:24px"><div class="sec-head">'+
      '<h2>Visão consolidada</h2><span class="tag">Todas as contas</span>'+
      '<span class="sub">Período: '+periodLabel()+'</span></div>'+
      '<div class="kpis">'+kpis.map(function(k){return '<div class="kpi"><div class="lbl"><i></i>'+
        k.l+'</div><div class="val">'+k.v+'</div><div class="foot">'+k.f+'</div></div>';}).join("")+'</div></section>';

    html+='<section class="sec"><div class="sec-head"><h2>Investimento por dia</h2>'+
      '<span class="tag">Soma de todas as contas</span></div>'+
      '<div class="panel glow" id="ovTrend"></div></section>';

    html+='<section class="sec"><div class="sec-head"><h2>Ranking de contas</h2>'+
      '<span class="tag">Por investimento</span></div><div class="panel" id="ovRank"></div></section>';

    html+='<section class="sec"><div class="sec-head"><h2>Contas</h2><span class="tag">10 contas</span>'+
      '<span class="sub">Clique numa conta para abrir o detalhe</span></div>'+
      '<div class="acc-grid" id="ovAccounts"></div></section>';

    var host=document.getElementById("overview");
    host.innerHTML=html;

    // trend agregado
    var map={};
    D.accounts.forEach(function(a){dailyInPeriod(a).forEach(function(r){map[r.date]=(map[r.date]||0)+r.spend;});});
    var rows=Object.keys(map).sort().map(function(k){return {value:Math.round(map[k]*100)/100,label:full(k),short:short(k)};});
    var tr=document.getElementById("ovTrend");
    if(rows.length)tr.appendChild(areaChart(rows,{money:true,h:240}));
    else tr.innerHTML='<div class="empty-state"><span>Sem investimento no período.</span></div>';

    // ranking
    var arr=D.accounts.map(function(a){return {a:a,s:sum(dailyInPeriod(a))};}).sort(function(x,y){return y.s.spend-x.s.spend;});
    var max=Math.max.apply(null,arr.map(function(o){return o.s.spend;}))||1;
    var rk='<div class="rank-row head"><span>#</span><span>Conta</span><span>Invest.</span>'+
      '<span class="hide-m">Impr.</span><span class="hide-m">Cliques</span><span>Share</span></div>';
    arr.forEach(function(o,i){var s=o.s;
      rk+='<div class="rank-row" data-go="'+o.a.id+'"><span class="pos">'+(i+1)+'</span>'+
        '<span class="nm">'+esc(o.a.name)+'<small>'+esc(o.a.seg)+'</small></span>'+
        '<span class="v"><b>'+brl.format(s.spend)+'</b></span>'+
        '<span class="v hide-m">'+int.format(s.impr)+'</span>'+
        '<span class="v hide-m">'+int.format(s.clicks)+'</span>'+
        '<span class="bar-mini"><i style="width:'+(s.spend/max*100).toFixed(1)+'%"></i></span></div>';
    });
    var rkEl=document.getElementById("ovRank");rkEl.innerHTML=rk;
    rkEl.querySelectorAll(".rank-row[data-go]").forEach(function(el){
      el.style.cursor="pointer";el.addEventListener("click",function(){go(el.dataset.go);});});

    // cards
    var grid=document.getElementById("ovAccounts");
    D.accounts.forEach(function(a){grid.appendChild(overviewCard(a));});
  }

  function overviewCard(a){
    var el=document.createElement("div");
    el.className="acc "+(a.status==="active"?"active":"dim");
    var ini=a.short.slice(0,2).toUpperCase();
    var badge=a.status==="active"?'<span class="badge active">Ativa</span>':
      a.status==="dormant"?'<span class="badge dormant">Dormente</span>':'<span class="badge empty">Sem dados</span>';
    var head='<div class="acc-top"><div class="ava-slot"></div>'+
      '<div class="acc-id"><h3>'+esc(a.name)+'</h3><p>'+esc(a.seg)+(a.city?' · '+esc(a.city):'')+'</p></div>'+badge+'</div>';

    if(a.status!=="active"){
      var inner;
      if(a.status==="dormant"){var lt=a.lifetime;
        inner='<div class="empty-state"><div class="big">🌙</div><b>Sem campanhas nos últimos 90 dias</b>'+
          '<span>Histórico acumulado:</span><div class="life">'+
          '<div><div class="lv">'+brl0.format(lt.spend)+'</div><div class="ll">Investido</div></div>'+
          '<div><div class="lv">'+compact(lt.impr)+'</div><div class="ll">Impressões</div></div>'+
          '<div><div class="lv">'+compact(lt.clicks)+'</div><div class="ll">Cliques</div></div></div></div>';
      } else {
        inner='<div class="empty-state"><div class="big">⚪</div><b>Sem dados disponíveis</b>'+
          '<span>Nenhuma campanha com entrega registrada.</span></div>';
      }
      el.innerHTML=head+inner;
      el.querySelector('.ava-slot').replaceWith(makeAva(a.id,ini));
      el.style.cursor="pointer";el.addEventListener("click",function(){go(a.id);});
      return el;
    }

    var rows=dailyInPeriod(a), s=sum(rows);
    var mini=[["Investimento",brl.format(s.spend)],["Impressões",compact(s.impr)],["Alcance",compact(s.reach)],
      ["Cliques",int.format(s.clicks)],["CTR",pct(s.ctr)],["CPC",brl.format(s.cpc)]];
    var mh='<div class="acc-kpis">'+mini.map(function(m){return '<div class="mini"><div class="l">'+m[0]+
      '</div><div class="v">'+m[1]+'</div></div>';}).join("")+'</div>';
    el.innerHTML=head+mh;
    el.querySelector('.ava-slot').replaceWith(makeAva(a.id,ini));
    var tb=document.createElement("div");tb.className="acc-block";
    tb.innerHTML='<div class="bh">Investimento diário · '+periodLabel()+'</div>';
    tb.appendChild(spark(rows.map(function(r){return r.spend;}),560,58));
    el.appendChild(tb);
    var cta=document.createElement("div");cta.className="card-cta";cta.textContent="Ver detalhe completo →";
    el.appendChild(cta);
    el.style.cursor="pointer";el.addEventListener("click",function(){go(a.id);});
    return el;
  }

  /* =======================================================================
     DETALHE DO CLIENTE
     ======================================================================= */
  function renderDetail(id){
    var a=D.accounts.filter(function(x){return x.id===id;})[0];
    var _ads=PAGES_AUTO.accounts&&PAGES_AUTO.accounts[id]&&PAGES_AUTO.accounts[id].ads;
    var host=document.getElementById("detail");
    var ini=a.short.slice(0,2).toUpperCase();
    var statusTxt=a.status==="active"?'<span class="badge active">Ativa</span>':
      a.status==="dormant"?'<span class="badge dormant">Dormente</span>':'<span class="badge empty">Sem dados</span>';

    var html=IS_CLIENT?'':'<button class="back" id="backBtn">← Visão Geral</button>';
    html+='<div class="dt-head"><div class="ava-slot"></div><div class="dt-id">'+
      '<h2>'+esc(a.name)+'</h2><p>'+esc(a.seg)+(a.city?' · '+esc(a.city):'')+
      (a.pageId?' · Página '+a.pageId:'')+'</p></div>'+statusTxt+'</div>';
    host.innerHTML=html;
    host.querySelector('.ava-slot').replaceWith(makeAva(a.id,ini,'big'));
    var backBtn=document.getElementById("backBtn");
    if(backBtn) backBtn.addEventListener("click",function(){go("overview");});

    if(a.status!=="active"){
      var box=document.createElement("div");box.className="panel";box.style.marginTop="18px";
      if(a.status==="dormant"){var lt=a.lifetime;
        box.innerHTML='<div class="empty-state"><div class="big">🌙</div><b>Sem campanhas nos últimos 90 dias</b>'+
          '<span>Conta com histórico (desde '+lt.since+'), pausada no período. Totais acumulados:</span>'+
          '<div class="life"><div><div class="lv">'+brl0.format(lt.spend)+'</div><div class="ll">Investido</div></div>'+
          '<div><div class="lv">'+compact(lt.impr)+'</div><div class="ll">Impressões</div></div>'+
          '<div><div class="lv">'+compact(lt.clicks)+'</div><div class="ll">Cliques</div></div></div></div>';
      } else {
        box.innerHTML='<div class="empty-state"><div class="big">⚪</div><b>Sem dados disponíveis</b>'+
          '<span>Nenhuma campanha com entrega registrada nesta conta.</span></div>';
      }
      host.appendChild(box);
      host.appendChild(pagesSection(a)); // permite cadastrar seguidores mesmo sem ads
      return;
    }

    // --- KPIs detalhados ---
    var rows=dailyInPeriod(a), s=sum(rows);
    var kpis=[
      {l:"Investimento",v:brl.format(s.spend)},{l:"Impressões",v:compact(s.impr)},
      {l:"Alcance",v:compact(s.reach)},{l:"Cliques",v:int.format(s.clicks)},
      {l:"CTR",v:pct(s.ctr)},{l:"CPC",v:brl.format(s.cpc)},
      {l:"CPM",v:brl.format(s.cpm)},{l:"Frequência",v:s.freq.toLocaleString("pt-BR",{maximumFractionDigits:2})},
      {l:"Resultados",v:a.results?int.format(a.results.value)+" "+a.results.label.toLowerCase():"—"}
    ];
    var sec=document.createElement("section");sec.className="sec";sec.style.marginTop="22px";
    sec.innerHTML='<div class="sec-head"><h2>META ADS INSIGHTS</h2><span class="tag">'+periodLabel()+'</span></div>'+
      '<div class="kpis k9">'+kpis.map(function(k){return '<div class="kpi"><div class="lbl"><i></i>'+
        k.l+'</div><div class="val">'+k.v+'</div></div>';}).join("")+'</div>';
    host.appendChild(sec);

    // --- Trend com seletor de métrica ---
    var tsec=document.createElement("section");tsec.className="sec";
    tsec.innerHTML='<div class="sec-head"><h2>Evolução diária</h2>'+
      '<div class="mini-tabs" id="mtabs">'+
      '<button data-m="spend" class="active">Gasto</button>'+
      '<button data-m="impr">Impressões</button>'+
      '<button data-m="clicks">Cliques</button>'+
      '<button data-m="reach">Alcance</button></div></div>'+
      '<div class="panel glow" id="dtTrend"></div>';
    host.appendChild(tsec);
    function drawTrend(){
      var metric=STATE.metric, money=metric==="spend";
      var rr=rows.map(function(r){return {value:r[metric],label:full(r.date),short:short(r.date)};});
      var el=document.getElementById("dtTrend");el.innerHTML="";
      if(rr.length)el.appendChild(areaChart(rr,{money:money,h:250}));
      else el.innerHTML='<div class="empty-state"><span>Sem dados no período.</span></div>';
    }
    drawTrend();
    tsec.querySelectorAll("#mtabs button").forEach(function(b){
      b.addEventListener("click",function(){
        STATE.metric=b.dataset.m;
        tsec.querySelectorAll("#mtabs button").forEach(function(x){x.classList.toggle("active",x===b);});
        drawTrend();
      });
    });

    // --- Pages Insights ---
    host.appendChild(pagesSection(a));

    // --- Público ---
    var ageData=(_ads&&_ads.age)?_ads.age:(a.age||[]);
    var genderData=(_ads&&_ads.gender)?_ads.gender:(a.gender||[]);
    var regionData=(_ads&&_ads.region)?_ads.region:(a.region||[]);
    var pubTag=_ads?"30 dias":"90 dias";
    var dsec=document.createElement("section");dsec.className="sec";
    dsec.innerHTML='<div class="sec-head"><h2>Público</h2><span class="tag">'+pubTag+'</span></div>';
    var grid=document.createElement("div");grid.className="demo-grid";

    var p1=document.createElement("div");p1.className="panel";
    p1.innerHTML='<div class="bh">Faixa etária · impressões</div>';
    p1.appendChild(hbars(ageData.map(function(x){return {k:x.k,value:x.impr};}),compact));

    var p2=document.createElement("div");p2.className="panel";
    p2.innerHTML='<div class="bh">Gênero · impressões</div>';
    var gsegs=genderData.map(function(x){
      return {label:x.k==="female"?"Feminino":x.k==="male"?"Masculino":"Não inform.",
        value:x.impr,color:x.k==="female"?GOLD:x.k==="male"?BLUE:GREY};});
    var gtot=gsegs.reduce(function(a,s){return a+s.value;},0)||1;
    var gflex=document.createElement("div");gflex.className="gflex";
    gflex.appendChild(donut(gsegs,140));
    var leg=document.createElement("div");leg.className="legend";
    leg.innerHTML=gsegs.map(function(s){return '<div class="li"><i style="background:'+s.color+'"></i>'+
      s.label+'<b>'+pct(s.value/gtot*100)+'</b></div>';}).join("");
    gflex.appendChild(leg);p2.appendChild(gflex);

    var p3=document.createElement("div");p3.className="panel";
    p3.innerHTML='<div class="bh">Top regiões · impressões</div>';
    p3.appendChild(hbars(regionData.slice(0,8).map(function(x){return {k:x.k,value:x.impr};}),compact));

    grid.appendChild(p1);grid.appendChild(p2);grid.appendChild(p3);
    dsec.appendChild(grid);host.appendChild(dsec);

    // --- Campanhas ---
    var campData=(_ads&&_ads.campaigns&&_ads.campaigns.length)?
      _ads.campaigns.map(function(c){var im=c.impr||0,cl=c.clicks||0;return {name:c.name,objective:c.objective,status:c.status,spend:c.spend,impr:im,reach:c.reach,clicks:cl,ctr:im?cl/im*100:0,resLabel:c.resLabel,resValue:c.resValue};}):
      (a.campaigns||[]);
    var campTag=(_ads&&_ads.campaigns&&_ads.campaigns.length)?"30 dias · top por gasto":"90 dias · top por gasto";
    if(campData.length){
      var csec=document.createElement("section");csec.className="sec";
      csec.innerHTML='<div class="sec-head"><h2>Campanhas</h2><span class="tag">'+campTag+'</span></div>';
      var tbl='<div class="panel"><table class="ctable"><thead><tr>'+
        '<th>Campanha</th><th>Objetivo</th><th>Status</th><th class="r">Gasto</th>'+
        '<th class="r">Impr.</th><th class="r">Cliques</th><th class="r">CTR</th><th class="r">Resultado</th></tr></thead><tbody>';
      campData.forEach(function(c){
        tbl+='<tr><td class="cn">'+esc(c.name)+'</td><td>'+objLabel(c.objective)+'</td><td>'+statusBadge(c.status)+
          '</td><td class="r"><b>'+brl.format(c.spend)+'</b></td><td class="r">'+int.format(c.impr)+
          '</td><td class="r">'+int.format(c.clicks)+'</td><td class="r">'+pct(c.ctr)+
          '</td><td class="r"><b style="color:var(--gold)">'+int.format(c.resValue)+'</b><br><small>'+esc(c.resLabel)+'</small></td></tr>';
      });
      tbl+='</tbody></table></div>';
      csec.innerHTML+=tbl;host.appendChild(csec);
    }

    var noteText=_ads?
      'Público e campanhas refletem os últimos <b>30 dias</b> (dados ao vivo). Indicadores e evolução diária seguem o período selecionado. <b>Alcance</b> por período é acumulado (soma diária).':
      'Público e campanhas refletem a janela de <b>90 dias</b>. Indicadores e evolução diária seguem o período selecionado. <b>Alcance</b> por período é acumulado (soma diária).';
    var note=document.createElement("p");note.className="note";
    note.innerHTML=noteText;
    host.appendChild(note);
  }

  /* =======================================================================
     PAGES INSIGHTS (entrada manual + localStorage)
     ======================================================================= */
  function pgKey(id){return "mine_pages_v1_"+id;}
  function loadPg(id){try{return JSON.parse(localStorage.getItem(pgKey(id)))||{series:[]};}catch(e){return {series:[]};}}
  function savePg(id,o){try{localStorage.setItem(pgKey(id),JSON.stringify(o));}catch(e){}}

  // ---- Logo por conta (salvo no navegador) --------------------------------
  function logoKey(id){return "mine_logo_v1_"+id;}
  function loadLogo(id){try{return localStorage.getItem(logoKey(id));}catch(e){return null;}}
  function saveLogo(id,dataUrl){try{localStorage.setItem(logoKey(id),dataUrl);}catch(e){}}

  // ---- Avatar editável (quadrado amarelo clicável para upload de logo) -----
  // Tamanho recomendado: PNG quadrado, mínimo 200×200 px, ideal 512×512 px.
  function makeAva(accId, ini, extraClass){
    var div=document.createElement("div");
    div.className="acc-ava ava-edit"+(extraClass?" "+extraClass:"");
    div.textContent=ini; // fallback inicial

    var inp=document.createElement("input");
    inp.type="file";inp.accept="image/png,image/jpeg,image/webp,image/svg+xml";
    inp.style.display="none";
    div.appendChild(inp);

    function applyImg(src){
      while(div.firstChild)div.removeChild(div.firstChild);
      var img=document.createElement("img");
      img.src=src;img.alt=ini;
      img.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block";
      div.appendChild(img);div.appendChild(inp);
      div.style.background="transparent";
      div.style.border="1px solid rgba(255,255,255,.14)";
    }

    // 1º tenta arquivo estático logos/{accId}.png (publicado no servidor)
    var staticImg=new Image();
    staticImg.onload=function(){ applyImg("logos/"+accId+".png"); };
    staticImg.onerror=function(){
      // 2º fallback: localStorage (upload manual pelo painel)
      var logo=loadLogo(accId);
      if(logo) applyImg(logo);
    };
    staticImg.src="logos/"+accId+".png";

    div.title="Clique para trocar a logo (PNG 512×512 px recomendado)";
    div.addEventListener("click",function(e){e.stopPropagation();inp.click();});
    inp.addEventListener("change",function(){
      var file=inp.files&&inp.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(ev){saveLogo(accId,ev.target.result);applyImg(ev.target.result);};
      reader.readAsDataURL(file);
    });
    return div;
  }

  function fmtDay(d){var x=new Date(d+"T12:00:00");return x.getDate()+"/"+(x.getMonth()+1);}
  function fmtUpdated(s){ if(!s) return ""; var x=new Date(s); return x.getDate()+" "+MES_ABR[x.getMonth()]+" "+x.getFullYear(); }

  // ---- Instagram Insights completo (robô diário) ----------------------------
  function igAutoSection(ig, username){
    var wrap=document.createElement("div");

    // período selecionado pelo botão 7d / 30d / 90d
    var P=STATE.period;
    // API só retorna 30 dias de série diária; 90d mostra os mesmos 30d com nota
    var pDays=P===90?30:P;
    var pLabel=P===7?"7d":P===30?"30d":"30d*";

    // corte de data para filtrar séries
    var cutoff=new Date(); cutoff.setDate(cutoff.getDate()-pDays);
    function filterSeries(ser){
      return ((ser||[]).slice()
        .sort(function(a,b){return a.d<b.d?-1:1;})
        .filter(function(p){return new Date(p.d+"T12:00:00")>=cutoff;}));
    }

    // série histórica de seguidores (todos os pontos coletados pelo robô)
    var ser=((ig&&ig.series)||[]).slice().sort(function(a,b){return a.d<b.d?-1:1;});
    var last=ser.length?ser[ser.length-1].v:(ig&&ig.followers||0);

    // alcance: soma dos dias no período
    var reachFiltered=filterSeries(ig&&ig.reach_series);
    var alcanceP=reachFiltered.reduce(function(s,p){return s+p.v;},0);

    // novos seguidores: SOMA dos valores diários no período
    // follower_count/day retorna incremento diário (novos seguidores naquele dia)
    var newFiltered=filterSeries(ig&&ig.new_series);
    var novosP=newFiltered.reduce(function(s,p){return s+p.v;},0);

    // crescimento relativo
    var growth=(last>0&&novosP!==0)?(novosP/(last-novosP)*100):0;

    // sufixo: _7d quando P=7, _30d para 30 e 90 (API limita a 30d)
    var sfx=P===7?"_7d":"_30d";
    var engaged=ig&&ig["accounts_engaged"+sfx]||0;
    var interactions=ig&&ig["total_interactions"+sfx]||0;

    // ---- Meta +10% vs mês anterior -------------------------------------
    function goalPct(cur,prev){
      if(cur===null||cur===undefined||!prev||prev<=0) return null;
      return Math.min(150,Math.round(cur/(prev*1.10)*100));
    }
    function mkBar(pct){
      if(pct===null||pct===undefined) return '';
      var fill=Math.min(100,pct);
      var done=pct>=100;
      var col=done?"var(--ok)":"var(--gold)";
      var txtCol=done?"var(--ok)":"var(--txt-3)";
      return '<div class="kpi-bar-label">meta esperada</div>'+
        '<div class="kpi-bar-wrap"><div class="kpi-bar">'+
        '<div class="kpi-bar-fill" style="width:'+fill+'%;background:'+col+'"></div></div>'+
        '<span class="kpi-bar-pct" style="color:'+txtCol+'">'+pct+'%</span></div>';
    }
    var pvsfx="_30d_prev";
    var prevFollowers=(last>novosP)?(last-novosP):0;
    var prevNovos   =ig&&ig["new_30d_prev"]            ||0;
    var prevAlcance =ig&&ig["reach_30d_prev"]           ||0;
    var prevEngaged =ig&&ig["accounts_engaged"+pvsfx]   ||0;
    var prevInter   =ig&&ig["total_interactions"+pvsfx] ||0;
    var prevLikes   =ig&&ig["likes"   +pvsfx]           ||0;
    var prevComments=ig&&ig["comments"+pvsfx]           ||0;
    var prevShares  =ig&&ig["shares"  +pvsfx]           ||0;
    var prevSaves   =ig&&ig["saves"   +pvsfx]           ||0;

    // KPIs principais — labels com o período real
    var kpiData=[
      {l:"Seguidores",          v:int.format(last),                                            f:"atualizado hoje",              pct:goalPct(last,prevFollowers)},
      {l:"Novos ("+pLabel+")",  v:(novosP>=0?"+":"")+int.format(novosP),                      f:"seguidores ganhos", c:novosP>=0?"var(--ok)":"var(--bad)", pct:goalPct(novosP,prevNovos)},
      {l:"Crescimento",         v:(growth>=0?"+":"")+growth.toLocaleString("pt-BR",{maximumFractionDigits:1})+"%", f:"últimos "+pLabel, c:growth>=0?"var(--ok)":"var(--bad)", pct:goalPct(novosP,prevNovos)},
      {l:"Alcance ("+pLabel+")",v:compact(alcanceP),                                          f:"contas únicas",                pct:goalPct(alcanceP,prevAlcance)},
      {l:"Engajamentos",        v:int.format(engaged),                                        f:"contas engajadas "+pLabel,     pct:goalPct(engaged,prevEngaged)},
      {l:"Interações",          v:int.format(interactions),                                   f:"likes+coment.+shares "+pLabel, pct:goalPct(interactions,prevInter)}
    ];
    var kpis=document.createElement("div");kpis.className="kpis";
    kpis.innerHTML=kpiData.map(function(k){
      return '<div class="kpi"><div class="lbl"><i></i>'+k.l+'</div>'+
        '<div class="val"'+(k.c?' style="color:'+k.c+'"':'')+'>'+k.v+'</div>'+
        '<div class="foot">'+k.f+'</div>'+mkBar(k.pct)+'</div>';
    }).join("");
    wrap.appendChild(kpis);
    // nota para 90d (explica limitação da API)
    if(P===90){
      var note90=document.createElement("p");note90.className="note";
      note90.style.marginTop="-4px";
      note90.textContent="* A API do Instagram disponibiliza no máximo 30 dias de histórico diário. Os dados de alcance e novos seguidores exibem a janela de 30 dias disponível.";
      wrap.appendChild(note90);
    }

    // Gráfico com tabs: Seguidores / Alcance (período)
    var serFollowers=ser.map(function(p){return {value:p.v,label:fmtDay(p.d),short:fmtDay(p.d)};});
    var serReach=reachFiltered.map(function(p){return {value:p.v,label:fmtDay(p.d),short:fmtDay(p.d)};});
    var uid=Math.random().toString(36).slice(2,7);
    var alcTabLabel="Alcance "+pLabel;
    var chartSec=document.createElement("div");chartSec.style.marginTop="18px";
    chartSec.innerHTML='<div class="mini-tabs" id="igtabs'+uid+'">'+
      '<button class="active" data-tab="seg">Seguidores</button>'+
      '<button data-tab="reach">'+alcTabLabel+'</button></div>'+
      '<div id="igchart'+uid+'" style="margin-top:8px"></div>';
    wrap.appendChild(chartSec);
    function drawIgChart(tab){
      var el=document.getElementById("igchart"+uid);if(!el)return;el.innerHTML="";
      var rows=tab==="seg"?serFollowers:serReach, color=tab==="seg"?GOLD:BLUE;
      if(rows.length>=2)el.appendChild(areaChart(rows,{money:false,h:200,color:color}));
      else el.innerHTML='<div class="empty-state" style="min-height:90px"><span>Aguardando mais coletas para exibir o gráfico (curva aparece a partir de 2 dias).</span></div>';
    }
    drawIgChart("seg");
    chartSec.querySelectorAll("#igtabs"+uid+" button").forEach(function(b){
      b.addEventListener("click",function(){
        chartSec.querySelectorAll("#igtabs"+uid+" button").forEach(function(x){x.classList.toggle("active",x===b);});
        drawIgChart(b.dataset.tab);
      });
    });

    // Demograficos: Gênero + Faixa etária
    var demo=ig&&ig.demographics;
    if(demo){
      var demoGrid=document.createElement("div");demoGrid.className="demo-grid";demoGrid.style.marginTop="20px";

      // Gênero
      var ageGender=demo.age_gender||[];
      var gF=0,gM=0,gU=0;
      ageGender.forEach(function(r){if(r.gender==="F")gF+=r.value;else if(r.gender==="M")gM+=r.value;else gU+=r.value;});
      var gTotal=gF+gM+gU||1;
      var gSegs=[{label:"Feminino",value:gF,color:GOLD},{label:"Masculino",value:gM,color:BLUE},{label:"Não inform.",value:gU,color:GREY}].filter(function(s){return s.value>0;});
      var p1=document.createElement("div");p1.className="panel";
      p1.innerHTML='<div class="bh">Gênero dos seguidores</div>';
      var gflex=document.createElement("div");gflex.className="gflex";
      gflex.appendChild(donut(gSegs,130));
      var leg=document.createElement("div");leg.className="legend";
      leg.innerHTML=gSegs.map(function(s){return '<div class="li"><i style="background:'+s.color+'"></i>'+s.label+'<b>'+pct(s.value/gTotal*100)+'</b></div>';}).join("");
      gflex.appendChild(leg);p1.appendChild(gflex);

      // Faixa etária
      var ageMap={};
      ageGender.forEach(function(r){if(!ageMap[r.age])ageMap[r.age]=0;ageMap[r.age]+=r.value;});
      var ageItems=Object.keys(ageMap).sort().map(function(age){return {k:age,value:ageMap[age]};});
      var ageTot=ageItems.reduce(function(s,i){return s+i.value;},0)||1;
      var p2=document.createElement("div");p2.className="panel";
      p2.innerHTML='<div class="bh">Faixa etária dos seguidores</div>';
      p2.appendChild(hbars(ageItems,function(v){
        return int.format(v)+' <small style="color:var(--txt-2)">'+(v/ageTot*100).toFixed(0)+'%</small>';
      }));
      demoGrid.appendChild(p1);demoGrid.appendChild(p2);
      wrap.appendChild(demoGrid);

      // Cidades top 10
      if(demo.cities&&demo.cities.length){
        var cityTotal=last||1;
        var cPanel=document.createElement("div");cPanel.className="panel";cPanel.style.marginTop="16px";
        cPanel.innerHTML='<div class="bh">Principais cidades dos seguidores</div>';
        var cityBars=hbars(demo.cities.slice(0,10).map(function(c){return {k:c.name,value:c.value};}),function(v){
          return int.format(v)+' <small style="color:var(--txt-2)">'+(v/cityTotal*100).toFixed(1)+'%</small>';
        });
        cityBars.querySelectorAll(".hbar").forEach(function(b){b.classList.add("wide");});
        cPanel.appendChild(cityBars);
        wrap.appendChild(cPanel);
      }
    }

    // Interações detalhadas — usa sfx (_7d ou _30d) conforme período
    if(ig&&(ig["likes"+sfx]!==undefined||ig.likes_30d!==undefined)){
      var intItems=[
        {l:"❤️ Likes",        v:ig["likes"    +sfx]||0, pct:goalPct(ig["likes"    +sfx]||0, prevLikes)},
        {l:"💬 Comentários",  v:ig["comments" +sfx]||0, pct:goalPct(ig["comments" +sfx]||0, prevComments)},
        {l:"↗️ Compartilhou", v:ig["shares"   +sfx]||0, pct:goalPct(ig["shares"   +sfx]||0, prevShares)},
        {l:"🔖 Salvamentos",  v:ig["saves"    +sfx]||0, pct:goalPct(ig["saves"    +sfx]||0, prevSaves)}
      ];
      var intPanel=document.createElement("div");intPanel.className="panel";intPanel.style.marginTop="16px";
      intPanel.innerHTML='<div class="bh">Interações detalhadas · últimos '+pLabel+'</div>'+
        '<div class="kpis" style="margin-top:12px;grid-template-columns:repeat(4,1fr)">'+
        intItems.map(function(k){
          return '<div class="kpi"><div class="lbl"><i></i>'+k.l+'</div>'+
            '<div class="val">'+int.format(k.v)+'</div><div class="foot">'+pLabel+'</div>'+mkBar(k.pct)+'</div>';
        }).join("")+'</div>';
      wrap.appendChild(intPanel);
    }

    // Top 10 conteúdos últimos 30d
    var topPosts=ig&&ig.top_posts;
    if(topPosts&&topPosts.length){
      var topPanel=document.createElement("div");topPanel.className="panel";topPanel.style.marginTop="16px";
      topPanel.innerHTML='<div class="bh">Top 10 conteúdos · últimos 30d'+
        '<small style="color:var(--txt-3);font-size:11px;font-weight:400;margin-left:8px">por likes + comentários · clique para abrir</small></div>';
      var tpList=document.createElement("div");tpList.className="top-posts";
      topPosts.forEach(function(post,idx){
        var typeIcon=post.type==="VIDEO"?"🎬":post.type==="CAROUSEL_ALBUM"?"🗂️":"🖼️";
        var capRaw=post.caption?String(post.caption):"";
        var capText=capRaw.length>90?capRaw.slice(0,90)+"…":capRaw||"(sem legenda)";
        var row=document.createElement("div");
        row.className="tp-row";
        row.title="Abrir post no Instagram ↗";
        row.addEventListener("click",function(){window.open(post.url,"_blank","noopener");});

        var rankEl=document.createElement("div");
        rankEl.className="tp-rank";rankEl.textContent="#"+(idx+1);

        var thumbEl=document.createElement("div");thumbEl.className="tp-thumb";
        if(post.img){
          var img=document.createElement("img");
          img.src=post.img;img.alt="Post "+(idx+1);img.loading="lazy";
          img.addEventListener("error",function(){thumbEl.innerHTML='<span class="tp-icon">'+typeIcon+'</span>';});
          thumbEl.appendChild(img);
        } else {
          thumbEl.innerHTML='<span class="tp-icon">'+typeIcon+'</span>';
        }

        var infoEl=document.createElement("div");infoEl.className="tp-info";
        infoEl.innerHTML='<div class="tp-cap">'+typeIcon+' '+esc(capText)+'</div>'+
          '<div class="tp-meta">'+fmtDay(post.date)+'</div>';

        var statsEl=document.createElement("div");statsEl.className="tp-stats";
        statsEl.innerHTML=
          '<div class="tp-stat"><span>❤️</span><b>'+int.format(post.likes||0)+'</b></div>'+
          '<div class="tp-stat"><span>💬</span><b>'+int.format(post.comments||0)+'</b></div>';

        row.appendChild(rankEl);row.appendChild(thumbEl);row.appendChild(infoEl);row.appendChild(statsEl);
        tpList.appendChild(row);
      });
      topPanel.appendChild(tpList);
      wrap.appendChild(topPanel);
    }

    return wrap;
  }

  function pagesSection(a){
    var sec=document.createElement("section");sec.className="sec";
    var panel=document.createElement("div");panel.className="panel glow";

    var auto = PAGES_AUTO.accounts && PAGES_AUTO.accounts[a.id];
    var hasIg = auto && auto.ig && auto.ig.series && auto.ig.series.length;

    // ---- modo automático (robô diário) ----
    if (hasIg) {
      var upd = fmtUpdated(PAGES_AUTO.updated);
      var uname = auto.username ? '@'+auto.username : '';
      sec.innerHTML='<div class="sec-head"><h2>Instagram Insights</h2><span class="tag">Automático ●</span>'+
        '<span class="sub">'+(uname?uname+' · ':'')+'Robô diário'+(upd?' · atualizado '+upd:'')+'</span></div>';
      sec.appendChild(panel);
      panel.appendChild(igAutoSection(auto.ig, auto.username));
      return sec;
    }

    // ---- fallback: entrada manual (salva no navegador) ----
    sec.innerHTML='<div class="sec-head"><h2>Instagram Insights</h2><span class="tag">Seguidores</span>'+
      '<span class="sub">Coleta automática ainda não ativa para este perfil — entrada manual (salva neste navegador)</span></div>';
    sec.appendChild(panel);

    function render(){
      var data=loadPg(a.id);
      var ser=(data.series||[]).slice().sort(function(x,y){return x.m<y.m?-1:1;});
      panel.innerHTML="";

      // KPIs seguidores
      var first=ser.length?ser[0].v:0, last=ser.length?ser[ser.length-1].v:0;
      var novos=last-first, growth=first?((last-first)/first*100):0;
      var k=document.createElement("div");k.className="kpis k3";
      k.innerHTML=
        '<div class="kpi"><div class="lbl"><i></i>Seguidores atuais</div><div class="val">'+(ser.length?int.format(last):"—")+'</div><div class="foot">último registro</div></div>'+
        '<div class="kpi"><div class="lbl"><i></i>Novos seguidores</div><div class="val" style="color:'+(novos>=0?"var(--ok)":"var(--bad)")+'">'+(ser.length>1?(novos>=0?"+":"")+int.format(novos):"—")+'</div><div class="foot">no período registrado</div></div>'+
        '<div class="kpi"><div class="lbl"><i></i>Crescimento</div><div class="val" style="color:'+(growth>=0?"var(--ok)":"var(--bad)")+'">'+(ser.length>1?(growth>=0?"+":"")+growth.toLocaleString("pt-BR",{maximumFractionDigits:1})+"%":"—")+'</div><div class="foot">acumulado</div></div>';
      panel.appendChild(k);

      // gráfico
      var chartBox=document.createElement("div");chartBox.style.marginTop="18px";
      if(ser.length>=2){
        var rr=ser.map(function(p){return {value:p.v,label:monthLabel(p.m),short:monthLabel(p.m)};});
        chartBox.appendChild(areaChart(rr,{money:false,h:210}));
      } else {
        chartBox.innerHTML='<div class="empty-state" style="min-height:120px"><div class="big">📈</div>'+
          '<b>Adicione ao menos 2 meses</b><span>Insira o total de seguidores por mês abaixo para ver a curva de crescimento.</span></div>';
      }
      panel.appendChild(chartBox);

      // tabela + form
      var tools=document.createElement("div");tools.className="pg-tools";
      var listHtml='';
      ser.slice().reverse().forEach(function(p,idx){
        var realIdx=ser.length-1-idx;
        var prev=realIdx>0?ser[realIdx-1].v:null;
        var delta=prev===null?null:p.v-prev;
        listHtml+='<tr><td>'+monthLabel(p.m)+'</td><td class="r">'+int.format(p.v)+'</td><td class="r">'+
          (delta===null?'—':'<span style="color:'+(delta>=0?"var(--ok)":"var(--bad)")+'">'+(delta>=0?"+":"")+int.format(delta)+'</span>')+
          '</td><td class="r"><button class="del" data-m="'+p.m+'">remover</button></td></tr>';
      });
      tools.innerHTML=
        '<table class="ptable"><thead><tr><th>Mês</th><th class="r">Seguidores</th><th class="r">Variação</th><th></th></tr></thead>'+
        '<tbody>'+(listHtml||'<tr><td colspan="4" style="color:var(--txt-3)">Nenhum registro ainda.</td></tr>')+'</tbody></table>'+
        '<div class="pg-form"><input type="month" id="pgM"><input type="number" id="pgV" placeholder="total de seguidores" min="0">'+
        '<button id="pgAdd" class="btn-gold">Adicionar</button></div>'+
        '<div class="pg-hint">Ex.: registre o total de seguidores no fim de cada mês. Fonte: Meta Business Suite › Insights.</div>';
      panel.appendChild(tools);

      panel.querySelector("#pgAdd").addEventListener("click",function(){
        var m=panel.querySelector("#pgM").value, v=parseInt(panel.querySelector("#pgV").value,10);
        if(!m||isNaN(v)){alert("Informe o mês e o número de seguidores.");return;}
        var dd=loadPg(a.id);dd.series=(dd.series||[]).filter(function(x){return x.m!==m;});
        dd.series.push({m:m,v:v});savePg(a.id,dd);render();
      });
      panel.querySelectorAll(".del").forEach(function(b){b.addEventListener("click",function(){
        var dd=loadPg(a.id);dd.series=(dd.series||[]).filter(function(x){return x.m!==b.dataset.m;});
        savePg(a.id,dd);render();});});
    }
    render();
    return sec;
  }

  /* =======================================================================
     ROUTER
     ======================================================================= */
  function go(view){
    if(IS_CLIENT && view==="overview") view=SESSION.accountId;
    STATE.view=view;
    var sel=document.getElementById("viewSel");
    if(sel&&!IS_CLIENT) sel.value=view;
    var ov=document.getElementById("overview"), dt=document.getElementById("detail");
    if(view==="overview"){ov.hidden=false;dt.hidden=true;renderOverview();}
    else{ov.hidden=true;dt.hidden=false;STATE.metric="spend";renderDetail(view);}
    window.scrollTo(0,0);
  }
  function rerender(){ STATE.view==="overview"?renderOverview():renderDetail(STATE.view); }

  function setPeriod(p, preset){
    STATE.period=p;
    STATE.preset=preset||(""+p+"d");
    STATE.customFrom=STATE.customTo=null;
    var lbl=document.getElementById("dfLabel");
    if(lbl) lbl.textContent=periodLabel();
    rerender();
  }

  // ---- init ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded",function(){
    document.getElementById("agency").textContent=D.agency;
    var gd=new Date(D.generated+"T12:00:00");
    document.getElementById("gendate").innerHTML="Atualizado em <b>"+gd.getDate()+" "+MES_ABR[gd.getMonth()]+" "+gd.getFullYear()+"</b>";

    // ---- user pill + logout ---------------------------------------------
    var pill=document.getElementById("userPill");
    if(pill){
      var uname=SESSION.name||(IS_CLIENT?"Cliente":"Admin");
      pill.innerHTML='<span class="up-name">'+esc(uname)+'</span>'+
        '<button class="up-logout" id="logoutBtn">Sair</button>';
      document.getElementById("logoutBtn").addEventListener("click",function(){
        window.AUTH.clearSession();
        window.location.replace("login.html");
      });
    }

    // ---- view selector --------------------------------------------------
    var sel=document.getElementById("viewSel");
    if(IS_CLIENT){
      // cliente: esconde seletor, mostra só o nome da empresa
      var vsEl=document.querySelector(".viewsel");
      if(vsEl) vsEl.style.display="none";
    } else {
      sel.innerHTML='<option value="overview">📊 Visão Geral</option>'+
        D.accounts.map(function(a){var dot=a.status==="active"?"🟢":a.status==="dormant"?"🌙":"⚪";
          return '<option value="'+a.id+'">'+dot+' '+esc(a.name)+'</option>';}).join("");
      sel.addEventListener("change",function(){go(sel.value);});
    }

    // ---- Date filter wiring -----------------------------------------------
    (function(){
      var dfWrap   = document.getElementById("dfWrap");
      var dfToggle = document.getElementById("dfToggle");
      var dfPanel  = document.getElementById("dfPanel");
      var dfLabel  = document.getElementById("dfLabel");
      var dfFrom   = document.getElementById("dfFrom");
      var dfTo     = document.getElementById("dfTo");
      var dfApply  = document.getElementById("dfApply");
      if(!dfToggle) return;

      // max = hoje
      var todayStr=TODAY.toISOString().slice(0,10);
      dfFrom.max=dfTo.max=todayStr;

      dfToggle.addEventListener("click",function(e){
        e.stopPropagation();
        dfPanel.hidden=!dfPanel.hidden;
        dfWrap.classList.toggle("open",!dfPanel.hidden);
      });
      document.addEventListener("click",function(){
        if(!dfPanel) return;
        dfPanel.hidden=true; dfWrap.classList.remove("open");
      });
      dfPanel.addEventListener("click",function(e){ e.stopPropagation(); });

      document.querySelectorAll(".df-preset").forEach(function(b){
        b.addEventListener("click",function(){
          var p=b.dataset.preset;
          if(p==="7d")        setPeriod(7,"7d");
          else if(p==="30d")  setPeriod(30,"30d");
          else if(p==="month")setPeriod(30,"month");
          else                setPeriod(30,"lastmonth");
          document.querySelectorAll(".df-preset").forEach(function(x){ x.classList.toggle("active",x===b); });
          dfPanel.hidden=true; dfWrap.classList.remove("open");
        });
      });

      dfApply.addEventListener("click",function(){
        var f=dfFrom.value, t=dfTo.value;
        if(!f||!t) return;
        if(f>t){ var tmp=f; f=t; t=tmp; }
        STATE.preset="custom"; STATE.customFrom=f; STATE.customTo=t;
        document.querySelectorAll(".df-preset").forEach(function(b){ b.classList.remove("active"); });
        dfLabel.textContent=periodLabel();
        dfPanel.hidden=true; dfWrap.classList.remove("open");
        rerender();
      });
    })();

    STATE.period=30; STATE.preset="30d";
    loadAuto(function(){
      if(IS_CLIENT) go(SESSION.accountId);
      else go("overview");
    });
  });
})();
