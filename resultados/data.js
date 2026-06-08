/* =========================================================================
   data.js — Dados reais Meta Ads (Mine Agência Digital)
   Coletado em 2026-06-06. Janela das séries: últimos ~90 dias.
   Os valores estão no formato bruto da API (pt-BR) e são convertidos
   para número pelo parser em runtime (window.DASH_DATA).
   ========================================================================= */
(function () {
  "use strict";

  // ---- Parsers ------------------------------------------------------------
  var MESES = { janeiro:"01",fevereiro:"02","março":"03",marco:"03",abril:"04",maio:"05",
    junho:"06",julho:"07",agosto:"08",setembro:"09",outubro:"10",novembro:"11",dezembro:"12" };

  function d(s){ // "8 de março de 2026" -> "2026-03-08"
    var m = s.toLowerCase().match(/(\d+)\s+de\s+([a-zç]+)\s+de\s+(\d+)/);
    var dia = ("0"+m[1]).slice(-2);
    return m[3] + "-" + MESES[m[2]] + "-" + dia;
  }
  function money(s){ // "R$1.234,56 BRL" -> 1234.56
    s = String(s).replace("R$","").replace("BRL","").replace(/\s/g,"").trim();
    s = s.replace(/\./g,"").replace(",",".");
    var v = parseFloat(s); return isNaN(v)?0:Math.round(v*100)/100;
  }
  function n(v){ if(typeof v==="number") return v; return v||0; }

  // ---- Metadados das contas ----------------------------------------------
  var META = {
    "996138788068033":  {name:"Life Drink Bar",       short:"Life",        seg:"Bar / Drinks",        status:"active", city:"Maringá-PR"},
    "787633890652103":  {name:"Village Steakhouse",   short:"Village",     seg:"Restaurante",         status:"active", city:"Maringá-PR"},
    "3890380901253199": {name:"Kyokai Sushi Bar",     short:"Kyokai",      seg:"Restaurante / Sushi", status:"active", city:"Maringá-PR"},
    "853572560704252":  {name:"Ótica Aliança",        short:"Ótica",       seg:"Varejo / Ótica",      status:"active", city:"Paraná"},
    "1018517297786259": {name:"Texsa do Brasil",      short:"Texsa",       seg:"Indústria / B2B",     status:"active", city:"São Paulo"},
    "1422408889638342": {name:"Treinadores GB",       short:"Treinadores", seg:"Educação / Esporte",  status:"active", city:"PR / SP"},
    "1239539613309782": {name:"Mine Digital",         short:"Mine",        seg:"Agência",             status:"dormant", lifetime:{spend:670.91,impr:271792,clicks:1420,since:"2023-05-06"}},
    "614549147474977":  {name:"Lonardoni Engenharia", short:"Lonardoni",   seg:"Engenharia",          status:"dormant", lifetime:{spend:3526.95,impr:244272,clicks:10990,since:"2023-08-03"}},
    "26505177645746881":{name:"Recanto da Pizza",     short:"Recanto",     seg:"Restaurante / Pizzaria", status:"active", city:"Umuarama-PR"},
    "4529196403968760": {name:"Edu Yokomizo",         short:"Edu Yokomizo",seg:"Pessoal / Marca",     status:"empty"}
  };
  var ORDER = ["996138788068033","787633890652103","3890380901253199","853572560704252",
    "1018517297786259","1422408889638342","26505177645746881","1239539613309782",
    "614549147474977","4529196403968760"];

  // ---- Séries diárias [data, spend, impr, reach, clicks] ------------------
  var DAILY = {
  "996138788068033":[
  ["8 de março de 2026","R$33,03",2355,1288,17],["9 de março de 2026","R$37,67",2097,1290,23],
  ["10 de março de 2026","R$45,05",2300,1402,15],["11 de março de 2026","R$28,87",1318,759,21],
  ["12 de março de 2026","R$39,42",1541,1162,17],["13 de março de 2026","R$24,47",1347,958,16],
  ["14 de março de 2026","R$28,08",1490,1029,8],["15 de março de 2026","R$0,05",4,4,0],
  ["19 de maio de 2026","R$44,77",2766,1723,63],["20 de maio de 2026","R$43,30",2577,1408,58],
  ["21 de maio de 2026","R$31,92",2048,1331,58],["22 de maio de 2026","R$27,42",1884,1264,38],
  ["23 de maio de 2026","R$31,94",2218,1510,65],["24 de maio de 2026","R$34,75",2559,1646,62],
  ["25 de maio de 2026","R$34,91",2448,1744,57],["26 de maio de 2026","R$33,57",1869,1404,64],
  ["27 de maio de 2026","R$37,87",2142,1664,57],["28 de maio de 2026","R$28,40",2055,1562,46],
  ["29 de maio de 2026","R$25,71",1853,1524,37],["30 de maio de 2026","R$18,59",1527,1271,38],
  ["31 de maio de 2026","R$20,19",1631,1335,43],["1 de junho de 2026","R$32,11",2571,1910,73],
  ["2 de junho de 2026","R$40,56",2680,2147,52],["3 de junho de 2026","R$38,83",2603,2163,54],
  ["4 de junho de 2026","R$26,26",1847,1537,36],["5 de junho de 2026","R$14,86",998,864,30]],
  "787633890652103":[
  ["16 de março de 2026","R$7,21",1375,1191,20],["17 de março de 2026","R$18,44",3476,2839,72],
  ["18 de março de 2026","R$15,08",2295,1954,69],["19 de março de 2026","R$13,88",2423,2152,47],
  ["20 de março de 2026","R$13,63",2646,2308,40],["21 de março de 2026","R$13,19",2458,2156,53],
  ["22 de março de 2026","R$13,57",2836,2491,48],["23 de março de 2026","R$12,78",2396,1961,25],
  ["24 de março de 2026","R$18,00",3305,2803,47],["25 de março de 2026","R$17,20",3025,2606,45],
  ["26 de março de 2026","R$15,22",2538,2290,30],["27 de março de 2026","R$14,57",2447,2150,41],
  ["28 de março de 2026","R$13,51",2623,2275,44],["29 de março de 2026","R$17,80",4023,3313,76],
  ["30 de março de 2026","R$16,51",3915,3320,71],["31 de março de 2026","R$13,53",2477,2241,45],
  ["1 de abril de 2026","R$13,33",2664,2370,56],["2 de abril de 2026","R$14,27",3182,2816,48],
  ["3 de abril de 2026","R$1,82",496,475,7]],
  "3890380901253199":[
  ["8 de março de 2026","R$27,21",7386,6007,171],["9 de março de 2026","R$26,07",6506,4710,137],
  ["10 de março de 2026","R$31,72",6916,4656,238],["11 de março de 2026","R$31,11",6989,4674,286],
  ["12 de março de 2026","R$23,71",5754,4297,136],["13 de março de 2026","R$19,54",4890,3718,110],
  ["14 de março de 2026","R$21,21",5025,4111,111],["15 de março de 2026","R$23,97",6431,5345,118],
  ["16 de março de 2026","R$18,01",4628,3703,72],["17 de março de 2026","R$20,00",4862,3659,84],
  ["18 de março de 2026","R$21,27",4989,3941,73],["19 de março de 2026","R$18,04",4194,3114,57],
  ["20 de março de 2026","R$19,36",4491,3365,75],["21 de março de 2026","R$13,62",3343,2697,41],
  ["23 de março de 2026","R$12,74",3390,3020,56],["24 de março de 2026","R$28,69",6708,5430,136],
  ["25 de março de 2026","R$27,00",6054,5041,150],["26 de março de 2026","R$22,01",4977,3965,114],
  ["27 de março de 2026","R$24,22",5556,4349,80],["28 de março de 2026","R$25,34",5806,4502,99],
  ["29 de março de 2026","R$23,82",5958,4778,110],["30 de março de 2026","R$21,74",5521,4583,84],
  ["31 de março de 2026","R$20,26",4973,3959,81],["1 de abril de 2026","R$19,19",5242,4039,62],
  ["2 de abril de 2026","R$19,53",5331,4383,82],["3 de abril de 2026","R$18,46",5852,4573,63],
  ["4 de abril de 2026","R$16,89",5412,4282,89],["5 de abril de 2026","R$21,71",6784,5397,131],
  ["6 de abril de 2026","R$20,72",6330,4986,133],["7 de abril de 2026","R$20,48",5390,4606,129],
  ["8 de abril de 2026","R$19,78",4590,4019,105],["9 de abril de 2026","R$32,33",6532,5282,88],
  ["10 de abril de 2026","R$15,09",4161,3203,40],["11 de abril de 2026","R$9,80",2851,2452,30],
  ["12 de abril de 2026","R$16,08",5247,4289,59],["13 de abril de 2026","R$12,29",4022,3419,39],
  ["14 de abril de 2026","R$17,04",4965,4036,56],["15 de abril de 2026","R$20,15",5889,4810,60],
  ["16 de abril de 2026","R$24,04",6548,5358,95],["17 de abril de 2026","R$17,71",4597,3869,54],
  ["1 de junho de 2026","R$6,80",873,686,12],["2 de junho de 2026","R$13,06",1512,1119,34],
  ["3 de junho de 2026","R$14,82",1668,1231,32],["4 de junho de 2026","R$15,03",1641,1402,35],
  ["5 de junho de 2026","R$14,08",1583,1380,16]],
  "853572560704252":[
  ["13 de março de 2026","R$6,67",1867,1723,17],["14 de março de 2026","R$13,04",4132,3471,42],
  ["15 de março de 2026","R$17,07",5052,4348,57],["16 de março de 2026","R$14,68",3529,3205,47],
  ["17 de março de 2026","R$14,75",3407,2955,45],["18 de março de 2026","R$14,75",3160,2901,50],
  ["19 de março de 2026","R$14,85",2245,2071,46],["20 de março de 2026","R$14,97",1836,1763,52],
  ["21 de março de 2026","R$13,38",1511,1430,68],["22 de março de 2026","R$16,37",1929,1858,74],
  ["23 de março de 2026","R$14,92",2038,1927,73],["24 de março de 2026","R$17,13",3213,2964,73],
  ["25 de março de 2026","R$15,22",3155,2918,83],["26 de março de 2026","R$13,30",3104,2794,100],
  ["27 de março de 2026","R$13,56",3006,2747,72],["28 de março de 2026","R$14,44",2991,2839,73],
  ["29 de março de 2026","R$15,97",2174,2120,61],["30 de março de 2026","R$14,13",1609,1514,66],
  ["31 de março de 2026","R$15,39",1826,1639,50],["1 de abril de 2026","R$17,76",2354,2270,59],
  ["2 de abril de 2026","R$15,31",3092,2881,81],["3 de abril de 2026","R$12,49",2750,2575,68],
  ["4 de abril de 2026","R$13,95",3381,3273,74],["5 de abril de 2026","R$15,92",4160,3947,87],
  ["6 de abril de 2026","R$15,30",3681,3504,97],["7 de abril de 2026","R$15,36",3196,3089,99],
  ["8 de abril de 2026","R$14,00",2768,2650,67],["9 de abril de 2026","R$17,11",3814,3472,117],
  ["10 de abril de 2026","R$18,13",5120,4638,121],["11 de abril de 2026","R$16,70",7765,6685,117],
  ["12 de abril de 2026","R$21,21",8605,6950,126],["13 de abril de 2026","R$19,64",7065,6248,128],
  ["14 de abril de 2026","R$19,87",4440,3953,137],["15 de abril de 2026","R$7,51",1674,1601,45],
  ["16 de abril de 2026","R$5,62",266,250,3],["17 de abril de 2026","R$5,82",305,298,7],
  ["18 de abril de 2026","R$0,77",46,46,0],["24 de abril de 2026","R$13,84",1459,1240,8],
  ["25 de abril de 2026","R$7,09",791,646,7],["26 de abril de 2026","R$15,20",1348,1041,11],
  ["27 de abril de 2026","R$15,75",1224,1006,8],["28 de abril de 2026","R$14,70",964,852,17],
  ["29 de abril de 2026","R$11,71",368,340,7],["30 de abril de 2026","R$8,86",639,530,28],
  ["1 de maio de 2026","R$19,55",3042,2326,65],["2 de maio de 2026","R$17,56",3413,2619,64],
  ["3 de maio de 2026","R$16,44",2218,1641,44],["4 de maio de 2026","R$25,85",2873,2042,30],
  ["5 de maio de 2026","R$58,93",3466,2326,40],["6 de maio de 2026","R$43,18",2789,1855,43],
  ["7 de maio de 2026","R$33,32",1976,1242,25],["8 de maio de 2026","R$27,10",1735,1090,18],
  ["9 de maio de 2026","R$21,72",1353,953,12],["10 de maio de 2026","R$0,63",59,50,1],
  ["25 de maio de 2026","R$19,78",1372,1063,25],["26 de maio de 2026","R$36,94",1723,1229,28],
  ["27 de maio de 2026","R$32,40",1921,1333,29],["28 de maio de 2026","R$26,23",1743,1171,22],
  ["29 de maio de 2026","R$28,52",1680,1147,25],["30 de maio de 2026","R$13,59",1230,995,17],
  ["31 de maio de 2026","R$11,59",786,675,11],["1 de junho de 2026","R$7,94",1370,1168,14],
  ["2 de junho de 2026","R$4,09",352,337,8]],
  "1018517297786259":[
  ["5 de junho de 2026","R$38,39",1327,1117,60]],
  "1422408889638342":[
  ["23 de abril de 2026","R$9,13",863,834,72],["24 de abril de 2026","R$32,39",3905,3764,399],
  ["25 de abril de 2026","R$31,20",4166,3967,372],["26 de abril de 2026","R$15,13",2062,1991,217],
  ["7 de maio de 2026","R$15,98",1961,1744,14],["8 de maio de 2026","R$22,00",3191,2678,22],
  ["9 de maio de 2026","R$11,84",1570,1191,17],["10 de maio de 2026","R$25,20",2959,2515,43],
  ["11 de maio de 2026","R$70,94",10865,9439,160],["12 de maio de 2026","R$67,73",13538,12397,243],
  ["13 de maio de 2026","R$55,39",7083,5819,164],["14 de maio de 2026","R$22,96",1712,1501,60],
  ["15 de maio de 2026","R$31,53",961,813,50],["16 de maio de 2026","R$24,44",818,736,36],
  ["17 de maio de 2026","R$3,39",130,127,6]]
  };

  // ---- Idade [bucket, spend, impr, reach, clicks] (90d) -------------------
  var AGE = {
  "996138788068033":[["18-24","R$110,89",11794,4024,222],["25-34","R$448,78",28624,9052,541],["35-44","R$158,04",7467,2825,162],["45-54","R$64,97",2207,939,84],["55-64","R$13,54",501,254,29],["65+","R$6,38",135,71,10]],
  "787633890652103":[["18-24","R$35,47",9666,3219,112],["25-34","R$92,74",21707,7433,360],["35-44","R$76,25",12537,4847,241],["45-54","R$39,16",4774,1801,112],["55-64","R$15,38",1511,660,41],["65+","R$4,53",399,177,18]],
  "3890380901253199":[["18-24","R$171,98",59789,11508,844],["25-34","R$314,41",90276,17942,1491],["35-44","R$213,36",43545,9920,917],["45-54","R$123,58",19021,4808,480],["55-64","R$61,04",7418,1993,240],["65+","R$21,36",2313,707,91]],
  "853572560704252":[["18-24","R$64,92",17707,7555,189],["25-34","R$158,11",35184,15587,475],["35-44","R$220,26",36254,16359,690],["45-54","R$264,01",32639,13960,690],["55-64","R$219,34",25949,10632,730],["65+","R$132,93",10422,4631,415]],
  "1018517297786259":[["18-24","R$0,19",5,4,0],["25-34","R$2,85",116,97,2],["35-44","R$12,11",456,395,18],["45-54","R$16,25",534,440,31],["55-64","R$6,73",207,176,9],["65+","R$0,26",9,9,0]],
  "1422408889638342":[["18-24","R$43,49",6835,6242,147],["25-34","R$68,76",9011,7782,243],["35-44","R$55,55",7463,5871,240],["45-54","R$78,73",10239,7864,345],["55-64","R$80,56",10368,7768,393],["65+","R$112,16",11868,9134,507]]
  };

  // ---- Gênero [genero, spend, impr, reach, clicks] (90d) ------------------
  var GENDER = {
  "996138788068033":[["female","R$649,22",40607,13386,841],["male","R$150,93",10008,3841,204],["unknown","R$2,45",113,46,3]],
  "787633890652103":[["female","R$167,11",31070,11124,558],["male","R$95,70",19419,7097,323],["unknown","R$0,73",111,42,3]],
  "3890380901253199":[["female","R$638,18",156342,30428,2594],["male","R$264,61",65313,18572,1460],["unknown","R$2,95",712,170,9]],
  "853572560704252":[["female","R$768,86",109285,44246,2220],["male","R$287,91",48519,23066,963],["unknown","R$2,80",356,169,6]],
  "1018517297786259":[["female","R$1,39",47,43,1],["male","R$36,90",1275,1068,59],["unknown","R$0,10",5,5,0]],
  "1422408889638342":[["female","R$209,69",25710,23029,1164],["male","R$229,02",29998,22473,710],["unknown","R$0,54",76,71,1]]
  };

  // ---- Região [regiao, impr, reach, clicks] (top, 90d) --------------------
  var REGION = {
  "996138788068033":[["Paraná",50523,16928,1041],["Mato Grosso do Sul",130,41,4],["Canindeyú (PY)",75,24,3]],
  "787633890652103":[["Paraná",50600,18074,884]],
  "3890380901253199":[["Paraná",222367,47499,4063]],
  "853572560704252":[["Paraná",156446,64751,3151],["Mato Grosso do Sul",387,307,7],["São Paulo",173,160,5],["Minas Gerais",171,152,6],["Bahia",117,105,1],["Rio de Janeiro",91,83,5],["Goiás",79,73,0],["Pará",77,71,1]],
  "1018517297786259":[["São Paulo",1317,1108,60],["Paraná",7,6,0],["Minas Gerais",2,2,0],["Mato Grosso do Sul",1,1,0]],
  "1422408889638342":[["Paraná",30438,21741,600],["São Paulo",25031,23183,1260],["Santa Catarina",250,213,15],["Alto Paraná (PY)",60,48,0],["Misiones (AR)",5,5,0]]
  };

  var RESULTS = { "1018517297786259": { label:"Leads", value:14 } };

  // ---- page_id por conta (Facebook/Instagram) -----------------------------
  var PAGES = {
    "996138788068033":"1844756289115103",
    "787633890652103":"754653257736551",
    "3890380901253199":"867268539792671",
    "853572560704252":"792046037329253",
    "1018517297786259":"910043728865263",
    "1422408889638342":"110415260752356"
  };

  // ---- Campanhas (90 dias) -----------------------------------------------
  // [nome, objetivo, status, spend, impr, reach, clicks, resultLabel, resultValue]
  var CAMPAIGNS = {
  "996138788068033":[
   ["[MSG-WPP] Casamentos e Formaturas","OUTCOME_ENGAGEMENT","ACTIVE","R$565,96",38276,13500,931,"Conversas (WPP)",100],
   ["Enyf - [Mensagem] WhatsApp - Teste","OUTCOME_SALES","PAUSED","R$236,64",12452,4722,117,"Conversas (WPP)",5]
  ],
  "787633890652103":[
   ["[TRAF] Reels - IG - Público Aberto","LINK_CLICKS","WITH_ISSUES","R$263,54",50600,18074,884,"Visitas ao perfil",917]
  ],
  "3890380901253199":[
   ["[02/03][TRÁFEGO][IG][ABO][CRU] - Forçando Conteúdos","LINK_CLICKS","PAUSED","R$426,14",109886,10835,1752,"Visitas ao perfil",3685],
   ["[26/02][TRÁFEGO][IG][ABO][UMU] - Forçando Conteúdos","LINK_CLICKS","PAUSED","R$415,81",105204,36015,2182,"Visitas ao perfil",2580],
   ["UMU - [MSG-WPP] - Reels","OUTCOME_ENGAGEMENT","ACTIVE","R$63,79",7277,4582,129,"Conversas (WPP)",5]
  ],
  "853572560704252":[
   ["[TRAF-IG] Reels","LINK_CLICKS","PAUSED","R$457,54",89244,42975,2121,"Visitas ao perfil",2080],
   ["[MSG] WPP","OUTCOME_ENGAGEMENT","PAUSED","R$288,11",26280,12238,449,"Conversas (WPP)",25],
   ["[MSG] WPP — Dia das Mães","OUTCOME_ENGAGEMENT","PAUSED","R$184,59",10249,4876,119,"Conversas (WPP)",9],
   ["[ENGAJ] Pesca","OUTCOME_ENGAGEMENT","PAUSED","R$72,02",5982,4156,49,"Conversas (WPP)",3],
   ["[TRÁF] Grupo VIP","LINK_CLICKS","PAUSED","R$57,31",26405,14269,451,"Cliques no link",309]
  ],
  "1018517297786259":[
   ["[LEADS-FORM] Distribuição - SP","OUTCOME_LEADS","ACTIVE","R$38,39",1327,1117,60,"Leads",14]
  ],
  "1422408889638342":[
   ["[TRAF] LP - Criativos Venda","LINK_CLICKS","PAUSED","R$186,83",24822,16761,298,"Views da LP",104],
   ["[TRAF] Antes x Depois","LINK_CLICKS","PAUSED","R$119,95",21396,19914,585,"Views da LP",358],
   ["[VENDAS] Reels - LP","OUTCOME_SALES","ACTIVE","R$76,38",2841,2296,134,"Checkouts iniciados",10],
   ["[TRAF] Site","LINK_CLICKS","PAUSED","R$56,09",6725,6382,858,"Views da LP",399]
  ]
  };

  // ---- Normalização -------------------------------------------------------
  var accounts = ORDER.map(function (id) {
    var m = META[id];
    var rec = { id:id, name:m.name, short:m.short, seg:m.seg, status:m.status, city:m.city||"" };
    if (m.status === "dormant") rec.lifetime = m.lifetime;
    if (DAILY[id])  rec.daily  = DAILY[id].map(function(r){ return {date:d(r[0]),spend:money(r[1]),impr:n(r[2]),reach:n(r[3]),clicks:n(r[4])}; });
    if (AGE[id])    rec.age    = AGE[id].map(function(r){ return {k:r[0],spend:money(r[1]),impr:n(r[2]),reach:n(r[3]),clicks:n(r[4])}; });
    if (GENDER[id]) rec.gender = GENDER[id].map(function(r){ return {k:r[0],spend:money(r[1]),impr:n(r[2]),reach:n(r[3]),clicks:n(r[4])}; });
    if (REGION[id]) rec.region = REGION[id].map(function(r){ return {k:r[0],impr:n(r[1]),reach:n(r[2]),clicks:n(r[3])}; });
    if (RESULTS[id]) rec.results = RESULTS[id];
    if (PAGES[id]) rec.pageId = PAGES[id];
    if (CAMPAIGNS[id]) rec.campaigns = CAMPAIGNS[id].map(function(c){
      var impr=n(c[4]), clk=n(c[6]);
      return { name:c[0], objective:c[1], status:c[2], spend:money(c[3]),
               impr:impr, reach:n(c[5]), clicks:clk, ctr: impr? clk/impr*100:0,
               resLabel:c[7], resValue:c[8] };
    });
    return rec;
  });

  window.DASH_DATA = {
    agency: "Mine Agência Digital",
    generated: "2026-06-06",
    currency: "BRL",
    accounts: accounts
  };
})();
