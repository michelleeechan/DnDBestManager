(function(){
'use strict';
var LS='dnd-inv-v1';
var DEN=['pp','gp','ep','sp','cp'];
var RATE={cp:1,sp:10,ep:50,gp:100,pp:1000};
var DEFAULT_REPO='michelleeechan/DnDBestManager';
var TYPES=['misc','weapon','armor','tool','consumable','magic'];
var SLOTS=[
 {id:'head',kind:'item',t:'0%',l:'50%'},
 {id:'neck',kind:'item',t:'13%',l:'50%'},
 {id:'body',kind:'item',t:'23%',l:'50%'},
 {id:'mainHand',kind:'item',t:'27%',l:'12%'},
 {id:'offHand',kind:'item',t:'27%',l:'88%'},
 {id:'ring1',kind:'item',t:'40%',l:'14%'},
 {id:'ring2',kind:'item',t:'40%',l:'86%'},
 {id:'back',kind:'bag',t:'76%',l:'50%'},
 {id:'waist1',kind:'bag',t:'56%',l:'36%'},
 {id:'waist2',kind:'bag',t:'56%',l:'64%'}
];
var DOLL_SVG='<svg class="dollsvg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">'+
 '<circle cx="100" cy="32" r="19"/>'+
 '<line x1="100" y1="51" x2="100" y2="66"/>'+
 '<path d="M74 66 H126 V150 H74 Z"/>'+
 '<path d="M76 74 L34 122"/><path d="M124 74 L166 122"/>'+
 '<circle cx="32" cy="130" r="7"/><circle cx="168" cy="130" r="7"/>'+
 '<path d="M88 150 L82 258"/><path d="M112 150 L118 258"/>'+
 '<path d="M82 258 H70"/><path d="M118 258 H130"/>'+
 '</svg>';
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
var I18N={
 zh:{appTitle:'D&D 物品欄管理',characters:'角色',addChar:'＋ 新增角色',charName:'角色名稱？',contName:'容器名稱？',itemName:'物品名稱？',addCont:'＋ 新增容器',addItem:'＋ 物品',qty:'數量',weight:'重量（lb）',notes:'備註',totalValue:'總值',totalWeight:'總重量',export:'匯出',import:'匯入',settings:'同步設定',repo:'Repo（owner/name）',pat:'GitHub Token',autoSync:'改動後自動同步到 GitHub',push:'立即上傳',pull:'從 GitHub 讀取',save:'儲存',close:'關閉',syncing:'同步中…',synced:'已同步 ✓',syncFail:'同步失敗',del:'刪除',confirmDelChar:'確定刪除這個角色？',confirmDelCont:'確定刪除這個容器？（內含物品會一併刪除）',empty:'（空）',moneyEditTip:'輸入新數量，或用 +50 / -50：',qtyEditTip:'輸入新數量，或用 +50 / -50：',moneyMove:'要搬移多少{d}？（上限 {max}）',pulled:'已從 GitHub 讀取 ✓',pullFail:'讀取失敗',noToken:'未設定 Token',den:{pp:'鉑金幣',gp:'金幣',ep:'電金幣',sp:'銀幣',cp:'銅幣'},langBtn:'EN',hint:'Token 只會存在此瀏覽器，不會被 commit 到 repo。',
  str:'力量',strPrompt:'力量值（負重上限＝力量×15 lb）',load:'負重',enc_ok:'負重正常',enc_light:'負重：速度 -10 呎',enc_heavy:'重度負重：速度 -20 呎、檢定劣勢',enc_over:'超出負重上限！',
  coinOn:'金幣計重：開',coinOff:'金幣計重：關',att:'同調 {n}/3',attuneFlag:'需同調',attunedPill:'同調中',equippedPill:'已裝備',attFull:'已同調 3 件物品，不能再同調更多。',
  equip:'裝備',unequip:'卸下',dropBtn:'丟棄',pickUp:'撿起',goneBtn:'永久刪除',confirmGone:'確定永久刪除？（無法復原）',
  dropped:'丟棄區（腳邊）',droppedEmpty:'（腳邊沒有東西）',
  expand:'展開',collapse:'收合',bagPanel:'容器內容',itemsCount:'{n} 件',
  capacity:'容量',capUnlimited:'不限',capPrompt:'容量上限（lb，0＝不限）',capOver:'超載',
  sort:'排序',sQty:'數量',sWeight:'重量',sValue:'價值',sName:'名稱',viewList:'列表',viewGrid:'格子',
  detail:'物品詳情',noSel:'點選物品名稱以查看／編輯詳情。',noExpand:'點擊紙人上的袋子或下方容器卡片以展開。',
  type:'分類',valueEach:'單價（gp）',moveTo:'移到容器',
  noFreeSlot:'沒有空的裝備位。',slotOccupied:'該裝備位已被佔用。',
  bagDropWarn:'把這個容器連同裡面所有物品和金錢一併丟棄？',
  dollTitle:'身上裝備（紙人）',storedTitle:'未裝備容器',noCont:'沒有容器，已自動新增一個。',
  slotNames:{head:'頭部',neck:'頸部',body:'身體',mainHand:'主手',offHand:'副手',ring1:'戒指一',ring2:'戒指二',back:'背部',waist1:'腰間一',waist2:'腰間二'},
  typeNames:{misc:'其他',weapon:'武器',armor:'防具',tool:'工具',consumable:'消耗品',magic:'魔法物品'}},
 en:{appTitle:'D&D Inventory Manager',characters:'Characters',addChar:'＋ New character',charName:'Character name?',contName:'Container name?',itemName:'Item name?',addCont:'＋ Add container',addItem:'＋ Item',qty:'Qty',weight:'Weight (lb)',notes:'Notes',totalValue:'Total value',totalWeight:'Total weight',export:'Export',import:'Import',settings:'Sync settings',repo:'Repo (owner/name)',pat:'GitHub token',autoSync:'Auto-sync to GitHub on change',push:'Push now',pull:'Pull from GitHub',save:'Save',close:'Close',syncing:'Syncing…',synced:'Synced ✓',syncFail:'Sync failed',del:'Delete',confirmDelChar:'Delete this character?',confirmDelCont:'Delete this container? (items inside will be removed too)',empty:'(empty)',moneyEditTip:'New amount, or +50 / -50:',qtyEditTip:'New quantity, or +50 / -50:',moneyMove:'How many {d} to move? (max {max})',pulled:'Pulled from GitHub ✓',pullFail:'Pull failed',noToken:'No token set',den:{pp:'PP',gp:'GP',ep:'EP',sp:'SP',cp:'CP'},langBtn:'中',hint:'The token stays in this browser only; it is never committed.',
  str:'STR',strPrompt:'Strength score (carry capacity = STR × 15 lb)',load:'Load',enc_ok:'Unencumbered',enc_light:'Encumbered: speed -10 ft',enc_heavy:'Heavily encumbered: speed -20 ft, disadvantage',enc_over:'Over capacity!',
  coinOn:'Coin weight: ON',coinOff:'Coin weight: OFF',att:'Attuned {n}/3',attuneFlag:'Requires attunement',attunedPill:'Attuned',equippedPill:'Equipped',attFull:'Already attuned to 3 items.',
  equip:'Equip',unequip:'Unequip',dropBtn:'Drop',pickUp:'Pick up',goneBtn:'Delete',confirmGone:'Permanently delete? (cannot be undone)',
  dropped:'Dropped (at your feet)',droppedEmpty:'(nothing on the ground)',
  expand:'Open',collapse:'Close',bagPanel:'Container contents',itemsCount:'{n} items',
  capacity:'Capacity',capUnlimited:'Unlimited',capPrompt:'Capacity limit (lb, 0 = unlimited)',capOver:'OVER',
  sort:'Sort',sQty:'Qty',sWeight:'Weight',sValue:'Value',sName:'Name',viewList:'List',viewGrid:'Grid',
  detail:'Item details',noSel:'Click an item name to view / edit details.',noExpand:'Click a bag on the doll or a container card below to expand it.',
  type:'Type',valueEach:'Value (gp each)',moveTo:'Move to container',
  noFreeSlot:'No free equipment slot.',slotOccupied:'That slot is occupied.',
  bagDropWarn:'Drop this container together with everything inside?',
  dollTitle:'Worn & carried (doll)',storedTitle:'Stowed containers',noCont:'No container; one has been created.',
  slotNames:{head:'Head',neck:'Neck',body:'Body',mainHand:'Main hand',offHand:'Off hand',ring1:'Ring I',ring2:'Ring II',back:'Back',waist1:'Waist I',waist2:'Waist II'},
  typeNames:{misc:'Misc',weapon:'Weapon',armor:'Armor',tool:'Tool',consumable:'Consumable',magic:'Magic'}}
};
function seed(){
 return {version:2,lang:'zh',savedAt:Date.now(),curChar:null,
  gh:{repo:DEFAULT_REPO,pat:'',auto:true},
  characters:[{id:uid(),name:'新角色',str:10,coinWeight:false,dropped:[],
   containers:[{id:uid(),name:'身上小袋',money:z(),cap:0,equipped:false,slot:null},{id:uid(),name:'背包',money:z(),cap:0,equipped:false,slot:null}],
   items:[]}]};
}
function z(){return {pp:0,gp:0,ep:0,sp:0,cp:0};}
function migrate(s){
 if(!s)return seed();
 if(!s.gh)s.gh={repo:DEFAULT_REPO,pat:'',auto:true};
 (s.characters||[]).forEach(function(ch){
  if(ch.str==null)ch.str=10;
  if(ch.coinWeight==null)ch.coinWeight=false;
  if(!ch.dropped)ch.dropped=[];
  (ch.containers||[]).forEach(function(c){
   if(c.cap==null)c.cap=0;
   if(c.equipped==null){c.equipped=false;c.slot=null;}
  });
  (ch.items||[]).forEach(function(i){
   if(i.value==null)i.value='';
   if(!i.type)i.type='misc';
   if(i.attune==null)i.attune=false;
   if(i.attuned==null)i.attuned=false;
   if(i.equipped==null){i.equipped=false;i.slot=null;}
  });
 });
 s.version=2;
 return s;
}
function load(){try{var s=JSON.parse(localStorage.getItem(LS));if(s&&s.characters&&s.characters.length)return migrate(s);}catch(e){}return seed();}
var state=load();
try{localStorage.setItem(LS,JSON.stringify(state));}catch(e){}
var ui={expand:null,sel:null,view:'list',inited:false};
function t(k){var d=I18N[state.lang]||I18N.zh;return d[k]!==undefined?d[k]:k;}
function tden(d){return (I18N[state.lang]||I18N.zh).den[d];}
function tslot(id){return (I18N[state.lang]||I18N.zh).slotNames[id]||id;}
function ttype(k){return (I18N[state.lang]||I18N.zh).typeNames[k]||k;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cur(){return state.characters.filter(function(c){return c.id===state.curChar;})[0]||state.characters[0];}
function clone(o){return JSON.parse(JSON.stringify(o));}
function publicData(){var s=clone(state);if(s.gh)s.gh.pat='';return s;}
function save(){state.savedAt=Date.now();localStorage.setItem(LS,JSON.stringify(state));render();scheduleSync();}
function newContainers(){return [{id:uid(),name:state.lang==='zh'?'身上小袋':'Pouch',money:z(),cap:0,equipped:false,slot:null},{id:uid(),name:state.lang==='zh'?'背包':'Backpack',money:z(),cap:0,equipped:false,slot:null}];}
function chMoney(ch,cid){var c=ch.containers.filter(function(x){return x.id===cid;})[0];if(!c)return z();if(!c.money)c.money=z();return c.money;}
function contItems(ch,cid){return ch.items.filter(function(i){return i.cid===cid;});}
function contWeight(ch,cid){var w=0;contItems(ch,cid).forEach(function(i){w+=(+i.weight||0)*(+i.qty||1);});return w;}
function findItem(iid){return cur().items.filter(function(i){return i.id===iid;})[0];}
function itemIndex(ch,id){for(var k=0;k<ch.items.length;k++)if(ch.items[k].id===id)return k;return -1;}
function contIndex(ch,id){for(var k=0;k<ch.containers.length;k++)if(ch.containers[k].id===id)return k;return -1;}
function attunedCount(ch){return ch.items.filter(function(i){return i.attuned;}).length;}
function totalGp(ch){
 var v=0;
 ch.containers.forEach(function(c){var m=c.money||{};DEN.forEach(function(d){v+=(m[d]||0)*RATE[d];});});
 ch.items.forEach(function(i){v+=(+i.value||0)*(+i.qty||1)*RATE.gp;});
 return v/RATE.gp;
}
function carriedW(ch){
 var w=0;
 ch.items.forEach(function(i){
  var c=ch.containers.filter(function(x){return x.id===i.cid;})[0];
  if(i.equipped||(c&&c.equipped))w+=(+i.weight||0)*(+i.qty||1);
 });
 if(ch.coinWeight){
  var coins=0;
  ch.containers.forEach(function(c){var m=c.money||{};DEN.forEach(function(d){coins+=(m[d]||0);});});
  w+=coins/50;
 }
 return w;
}
function loadInfo(ch){
 var str=+ch.str||10,w=carriedW(ch),cap=str*15;
 var st=w>=cap?'over':w>=str*10?'heavy':w>=str*5?'light':'ok';
 return {w:w,cap:cap,st:st,pct:Math.min(100,cap?w/cap*100:100)};
}
function freeSlot(ch,kind){
 for(var k=0;k<SLOTS.length;k++){
  var s=SLOTS[k];if(s.kind!==kind)continue;
  var occ;
  if(kind==='bag')occ=ch.containers.filter(function(c){return c.equipped&&c.slot===s.id;})[0];
  else occ=ch.items.filter(function(i){return i.equipped&&i.slot===s.id;})[0];
  if(!occ)return s.id;
 }
 return null;
}
function b64(str){var a=new TextEncoder().encode(str),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s);}
function unb64(b){var s=atob(b.replace(/\n/g,'')),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return new TextDecoder().decode(a);}
function setStatus(m){var el=document.getElementById('syncStatus');if(el)el.textContent=m;}
function ghURL(p){return 'https://api.github.com/repos/'+state.gh.repo+'/contents/'+p;}
function ghHeaders(){return {'Authorization':'Bearer '+state.gh.pat,'Accept':'application/vnd.github+json'};}
function fetchJSON(url,opt){return fetch(url,opt).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});}
var syncTimer=null;
function scheduleSync(){if(!(state.gh.pat&&state.gh.auto))return;clearTimeout(syncTimer);syncTimer=setTimeout(pushData,1500);}
function pushData(){
 if(!state.gh.pat){setStatus(t('noToken'));return;}
 setStatus(t('syncing'));
 var sha=null;
 fetchJSON(ghURL('data.json'),{headers:ghHeaders()}).then(function(meta){sha=meta.sha;}).catch(function(){})
 .then(function(){
  var body={message:'inventory update '+new Date().toISOString(),content:b64(JSON.stringify(publicData(),null,2))};
  if(sha)body.sha=sha;
  return fetchJSON(ghURL('data.json'),{method:'PUT',headers:ghHeaders(),body:JSON.stringify(body)});
 }).then(function(){setStatus(t('synced'));}).catch(function(e){setStatus(t('syncFail')+' ('+e.message+')');});
}
function adoptRemote(remote){
 var gh=state.gh;
 state=migrate(remote);
 state.gh={repo:(remote.gh&&remote.gh.repo)||gh.repo,pat:gh.pat,auto:gh.auto};
 localStorage.setItem(LS,JSON.stringify(state));
 resetUI();render();setStatus(t('pulled'));
}
function pullData(){
 if(!state.gh.pat){setStatus(t('noToken'));return;}
 setStatus(t('syncing'));
 fetchJSON(ghURL('data.json'),{headers:ghHeaders()}).then(function(f){
  var remote=JSON.parse(unb64(f.content));
  if(!remote.characters||!remote.characters.length)throw new Error('bad data');
  adoptRemote(remote);
 }).catch(function(e){setStatus(t('pullFail')+' ('+e.message+')');});
}
function pullIfRemoteNewer(){
 fetchJSON(ghURL('data.json'),{headers:ghHeaders()}).then(function(f){
  var remote=JSON.parse(unb64(f.content));
  if(remote&&remote.characters&&remote.characters.length&&(remote.savedAt||0)>(state.savedAt||0)){
   var gh=state.gh;var pat=gh.pat;
   state=migrate(remote);
   state.gh={repo:(remote.gh&&remote.gh.repo)||gh.repo,pat:pat,auto:gh.auto};
   localStorage.setItem(LS,JSON.stringify(state));
   resetUI();render();
  }
 }).catch(function(){});
}
function resetUI(){ui.sel=null;ui.expand=null;var c=cur();if(c&&c.containers&&c.containers.length)ui.expand=c.containers[0].id;}
function btn(act,label,cls){return '<button class="'+(cls||'')+'" data-act="'+act+'">'+label+'</button>';}
function btnC(act,cid,label,cls){return '<button class="'+(cls||'')+'" data-act="'+act+'" data-cid="'+cid+'">'+label+'</button>';}
function btnI(act,iid,label,cls){return '<button class="'+(cls||'')+'" data-act="'+act+'" data-iid="'+iid+'">'+label+'</button>';}
function render(){renderTop();renderSide();renderMain();}
function renderTop(){
 document.getElementById('topbar').innerHTML=
  '<div class="brand">&#9876; '+esc(t('appTitle'))+'</div><div class="topbtns">'+
  btn('lang',esc(t('langBtn')))+btn('export',esc(t('export')))+btn('import',esc(t('import')))+
  btn('settings','&#9881; '+esc(t('settings')))+
  '<span id="syncStatus" class="status"></span></div>';
}
function renderSide(){
 var html='<h2>'+esc(t('characters'))+'</h2>';
 state.characters.forEach(function(c){
  html+='<div class="char'+(c.id===cur().id?' active':'')+'" data-act="selChar" data-id="'+c.id+'">'+esc(c.name)+'</div>';
 });
 html+=btn('addChar',esc(t('addChar')),'wide');
 document.getElementById('sidebar').innerHTML=html;
}
function capBar(c,w,cid){
 var cap=+c.cap||0;
 if(!cap)return '<div class="capline dim">'+esc(t('capacity'))+': '+esc(t('capUnlimited'))+(cid?' <button class="mini" data-act="editCap" data-cid="'+cid+'">&#9998;</button>':'')+'</div>';
 var pct=Math.min(100,w/cap*100);
 var cls=w>cap?'bad':w>=cap*0.8?'warn':'ok';
 return '<div class="capline'+(w>cap?' over':'')+'"><span>'+esc(t('capacity'))+' <b>'+fw(w)+'</b>/'+cap+'lb'+(w>cap?' &#9888; '+esc(t('capOver')):'')+(cid?' <button class="mini" data-act="editCap" data-cid="'+cid+'">&#9998;</button>':'')+'</span>'+
  '<div class="capbar"><div class="capfill '+cls+'" style="width:'+pct+'%"></div></div></div>';
}
function moneyRow(ch,cid){
 var m=chMoney(ch,cid),html='<div class="moneyrow">';
 DEN.forEach(function(d){
  html+='<span class="chip" draggable="true" data-den="'+d+'" data-cid="'+cid+'"><i>'+esc(tden(d))+'</i>'+
   '<button data-act="moneyMinus" data-cid="'+cid+'" data-den="'+d+'">-</button>'+
   '<b data-act="moneyEdit" data-cid="'+cid+'" data-den="'+d+'">'+(m[d]||0)+'</b>'+
   '<button data-act="moneyPlus" data-cid="'+cid+'" data-den="'+d+'">+</button></span>';
 });
 return html+'</div>';
}
function itemPills(i){
 var html='';
 if(i.type&&i.type!=='misc')html+='<span class="pill">'+esc(ttype(i.type))+'</span>';
 if(i.equipped)html+='<span class="pill eq">'+esc(t('equippedPill'))+'</span>';
 if(i.attune&&i.attuned)html+='<span class="pill at">'+esc(t('attunedPill'))+'</span>';
 return html;
}
function fw(n){return String(Math.round(n*10)/10);}
function renderDetail(ch){
 var item=ch.items.filter(function(i){return i.id===ui.sel;})[0];
 var html='<h2>'+esc(t('detail'))+'</h2>';
 if(!item)return html+'<p class="hint">'+esc(t('noSel'))+'</p>';
 var q=+item.qty||0,uw=+item.weight||0,tw=uw*q,tv=(+item.value||0)*q;
 var typeOpts=TYPES.map(function(k){return '<option value="'+k+'"'+(item.type===k?' selected':'')+'>'+esc(ttype(k))+'</option>';}).join('');
 var moveOpts='<option value="">--</option>'+ch.containers.map(function(c){return '<option value="'+c.id+'"'+(item.cid===c.id?' selected':'')+'>'+esc(c.name)+'</option>';}).join('');
 html+='<label>'+esc(t('itemName'))+'<input data-f="name" value="'+esc(item.name)+'"></label>'+
  '<div class="frow">'+
  '<label>'+esc(t('qty'))+'<input data-f="qty" type="number" min="0" value="'+q+'"></label>'+
  '<label>'+esc(t('weight'))+'<input data-f="weight" type="number" min="0" step="0.1" value="'+esc(item.weight==null?'':item.weight)+'"></label>'+
  '<label>'+esc(t('valueEach'))+'<input data-f="value" type="number" min="0" step="0.01" value="'+esc(item.value==null?'':item.value)+'"></label>'+
  '</div>'+
  '<label>'+esc(t('type'))+'<select data-f="type">'+typeOpts+'</select></label>'+
  '<label>'+esc(t('notes'))+'<textarea data-f="notes" rows="3">'+esc(item.notes||'')+'</textarea></label>'+
  '<label class="chk"><input type="checkbox" data-f="attune"'+(item.attune?' checked':'')+'>'+esc(t('attuneFlag'))+'</label>'+
  '<div class="dpills">'+(item.equipped?'<span class="pill eq">'+esc(t('equippedPill'))+'</span>':'')+
  (item.attune?'<span class="pill'+(item.attuned?' at':'')+'">'+esc(t('attunedPill'))+': '+(item.attuned?'ON':'OFF')+'</span>':'')+
  '</div>'+
  '<p class="hint">'+esc(t('weight'))+' '+fw(tw)+'lb'+(tv?' &middot; '+esc(t('totalValue'))+' '+fw(tv)+'gp':'')+'</p>'+
  '<div class="dbtns">'+
  (item.equipped?btnI('unequipItem',item.id,esc(t('unequip'))):btn('equipSel',esc(t('equip'))))+
  (item.attune?btnI('toggleAttuned',item.id,item.attuned?'&#10003; '+esc(t('attunedPill')):esc(t('attunedPill'))+'?'):'')+
  '</div>'+
  '<label>'+esc(t('moveTo'))+'<select data-f="move">'+moveOpts+'</select></label>'+
  '<div class="dbtns">'+btnI('dropItem',item.id,esc(t('dropBtn')))+btnI('delItem',item.id,esc(t('del')),'x')+'</div>';
 return html;
}
function renderDoll(ch){
 var html='<div class="dollzone"><h2 class="ztitle">'+esc(t('dollTitle'))+'</h2><div class="dollwrap">'+DOLL_SVG;
 SLOTS.forEach(function(s){
  var pos=' style="top:'+s.t+';left:'+s.l+'"';
  if(s.kind==='item'){
   var it=ch.items.filter(function(i){return i.equipped&&i.slot===s.id;})[0];
   if(it){
    html+='<div class="slot filled dropzone" data-slot="'+s.id+'" data-kind="item"'+pos+'>'+
     '<b>'+esc(tslot(s.id))+'</b><span class="sname">'+esc(it.name)+'</span>'+
     '<button class="sbtn" data-act="unequipItem" data-iid="'+it.id+'" title="'+esc(t('unequip'))+'">&#10005;</button></div>';
   }else{
    html+='<div class="slot empty dropzone" data-slot="'+s.id+'" data-kind="item" data-act="slotEquip"'+pos+'>'+
     '<b>'+esc(tslot(s.id))+'</b><span class="sdim">'+esc(t('empty'))+'</span></div>';
   }
  }else{
   var c=ch.containers.filter(function(x){return x.equipped&&x.slot===s.id;})[0];
   if(c){
    html+='<div class="slot filled bag dropzone'+(ui.expand===c.id?' open':'')+'" data-act="expandCont" data-cid="'+c.id+'" data-slot="'+s.id+'" data-kind="bag"'+pos+'>'+
     '<b>'+esc(tslot(s.id))+'</b><span class="sname">'+esc(c.name)+'</span>'+
     '<span class="smeta">'+t('itemsCount').replace('{n}',contItems(ch,c.id).length)+' &middot; '+fw(contWeight(ch,c.id))+'lb</span>'+
     '<span class="sbtns"><button data-act="expandCont" data-cid="'+c.id+'">'+(ui.expand===c.id?'&#9650;':'&#9660;')+'</button>'+
     '<button data-act="unequipCont" data-cid="'+c.id+'" title="'+esc(t('unequip'))+'">&#10005;</button></span></div>';
   }else{
    html+='<div class="slot empty dropzone" data-slot="'+s.id+'" data-kind="bag"'+pos+'>'+
     '<b>'+esc(tslot(s.id))+'</b><span class="sdim">'+esc(t('empty'))+'</span></div>';
   }
  }
 });
 return html+'</div></div>';
}
function renderStored(ch){
 var list=ch.containers.filter(function(c){return !c.equipped;});
 var html='<div class="dollzone"><h2 class="ztitle">'+esc(t('storedTitle'))+'</h2><div class="stored">';
 list.forEach(function(c){
  var w=contWeight(ch,c.id);
  html+='<section class="card contcard dropzone" data-cid="'+c.id+'" draggable="true">'+
   '<header><span class="cname" data-act="expandCont" data-cid="'+c.id+'">'+esc(c.name)+'</span>'+
   '<span class="cmeta">'+t('itemsCount').replace('{n}',contItems(ch,c.id).length)+' &middot; '+fw(w)+'lb</span></header>'+
   capBar(c,w,c.id)+
   moneyRow(ch,c.id)+
   '<div class="cardbtns">'+btnC('equipCont',c.id,esc(t('equip')))+
   '<button data-act="renameCont" data-cid="'+c.id+'">&#9998;</button>'+
   '<button class="x" data-act="delCont" data-cid="'+c.id+'">&#10005;</button></div>'+
   '</section>';
 });
 html+='</div><div class="addcont">'+btn('addCont',esc(t('addCont')))+'</div></div>';
 return html;
}
function itemRow(i){
 var q=+i.qty||1,uw=+i.weight||0,tw=uw*q,v=(+i.value||0)*q;
 return '<div class="item'+(ui.sel===i.id?' sel':'')+'" draggable="true" data-iid="'+i.id+'">'+
  '<span class="stepper"><button data-act="qtyMinus" data-iid="'+i.id+'">-</button>'+
  '<b data-act="qtyEdit" data-iid="'+i.id+'">'+q+'</b>'+
  '<button data-act="qtyPlus" data-iid="'+i.id+'">+</button></span>'+
  '<span class="iname" data-act="selItem" data-iid="'+i.id+'" title="'+esc(i.notes||'')+'">'+esc(i.name)+itemPills(i)+'</span>'+
  '<span class="iw">'+(uw?fw(tw)+'lb':'')+(v?' &middot; '+fw(v)+'gp':'')+'</span>'+
  '<span class="ibtns">'+
  (i.equipped?btnI('unequipItem',i.id,esc(t('unequip'))):'')+
  btnI('selItem',i.id,'&#9998;')+
  btnI('dropItem',i.id,esc(t('dropBtn')))+
  '</span></div>';
}
function itemTile(i){
 var q=+i.qty||1,uw=+i.weight||0,tw=uw*q,v=(+i.value||0)*q;
 return '<div class="tile'+(ui.sel===i.id?' sel':'')+'" draggable="true" data-iid="'+i.id+'" data-act="selItem">'+
  '<b>'+esc(i.name)+'</b><span>&times;'+q+'</span>'+
  '<span class="dim">'+(uw?fw(tw)+'lb':'')+(v?' &middot; '+fw(v)+'gp':'')+'</span>'+
  itemPills(i)+
  '<button class="x" data-act="dropItem" data-iid="'+i.id+'" title="'+esc(t('dropBtn'))+'">&#10005;</button></div>';
}
function renderBag(ch){
 var c=ch.containers.filter(function(x){return x.id===ui.expand;})[0];
 var html='<h2>'+esc(t('bagPanel'))+'</h2>';
 if(!c)return html+'<p class="hint">'+esc(t('noExpand'))+'</p>';
 var items=contItems(ch,c.id);
 html+='<div class="baghead"><span class="cname" data-act="renameCont" data-cid="'+c.id+'">&#9998; '+esc(c.name)+'</span>'+
  (c.equipped?'<span class="pill eq">'+esc(t('equippedPill'))+'</span>'+btnC('unequipCont',c.id,esc(t('unequip'))) : btnC('equipCont',c.id,esc(t('equip'))))+
  '<button class="x" data-act="dropCont" data-cid="'+c.id+'">'+esc(t('dropBtn'))+'</button>'+
  '<button class="x" data-act="delCont" data-cid="'+c.id+'">&#10005;</button></div>'+
  capBar(c,contWeight(ch,c.id),c.id)+
  moneyRow(ch,c.id)+
  '<div class="toolbar"><span class="dim">'+esc(t('sort'))+':</span>'+
  '<button data-act="sortCont" data-key="qty">'+esc(t('sQty'))+'</button>'+
  '<button data-act="sortCont" data-key="weight">'+esc(t('sWeight'))+'</button>'+
  '<button data-act="sortCont" data-key="value">'+esc(t('sValue'))+'</button>'+
  '<button data-act="sortCont" data-key="name">'+esc(t('sName'))+'</button>'+
  '<span class="spacer"></span>'+
  '<button data-act="setView" data-v="list"'+(ui.view==='list'?' class="on"':'')+'>'+esc(t('viewList'))+'</button>'+
  '<button data-act="setView" data-v="grid"'+(ui.view==='grid'?' class="on"':'')+'>'+esc(t('viewGrid'))+'</button></div>'+
  '<button class="itemadd" data-act="addItem" data-cid="'+c.id+'">'+esc(t('addItem'))+'</button>'+
  '<div class="items'+(ui.view==='grid'?' tiles':'')+'">';
 if(!items.length)html+='<div class="empty">'+esc(t('empty'))+'</div>';
 items.forEach(function(i){html+=ui.view==='grid'?itemTile(i):itemRow(i);});
 html+='</div>';
 html+='<div class="dropped"><h3>'+esc(t('dropped'))+'</h3>';
 if(!ch.dropped.length)html+='<p class="hint">'+esc(t('droppedEmpty'))+'</p>';
 ch.dropped.forEach(function(d){
  if(d.kind==='item'){
   var i=d.item;
   html+='<div class="drow"><span>'+esc(i.name)+' &times;'+(+i.qty||0)+' ('+fw((+i.weight||0)*(+i.qty||1))+'lb)</span>'+
    '<span class="dbtns"><button data-act="pickup" data-did="'+d.id+'">'+esc(t('pickUp'))+'</button>'+
    '<button class="x" data-act="goneDrop" data-did="'+d.id+'">'+esc(t('goneBtn'))+'</button></span></div>';
  }else{
   var cw=0;d.items.forEach(function(i){cw+=(+i.weight||0)*(+i.qty||1);});
   html+='<div class="drow"><span>&#128188; '+esc(d.cont.name)+' ('+t('itemsCount').replace('{n}',d.items.length)+' &middot; '+fw(cw)+'lb)</span>'+
    '<span class="dbtns"><button data-act="pickup" data-did="'+d.id+'">'+esc(t('pickUp'))+'</button>'+
    '<button class="x" data-act="goneDrop" data-did="'+d.id+'">'+esc(t('goneBtn'))+'</button></span></div>';
  }
 });
 return html+'</div>';
}
function renderMain(){
 var ch=cur();if(!ch)return;
 var li=loadInfo(ch);
 var html='<div class="charhead">'+
  '<div class="charname" data-act="renameChar">'+esc(ch.name)+'</div>'+
  '<div class="stats">'+
  '<span class="statchip" data-act="editStr" title="'+esc(t('strPrompt'))+'">'+esc(t('str'))+' <b>'+(+ch.str||10)+'</b></span>'+
  '<span class="statchip">'+esc(t('load'))+' <b>'+fw(li.w)+'</b> / '+li.cap+' lb</span>'+
  '<span class="encst '+li.st+'">'+esc(t('enc_'+li.st))+'</span>'+
  '<button data-act="toggleCoinW">'+esc(ch.coinWeight?t('coinOn'):t('coinOff'))+'</button>'+
  '<span class="statchip att">'+esc(t('att').replace('{n}',attunedCount(ch)))+'</span>'+
  '<span class="totals">'+esc(t('totalValue'))+' <b>'+totalGp(ch).toFixed(2)+' gp</b></span>'+
  '</div>'+
  '<div class="encbar"><div class="encfill '+li.st+'" style="width:'+li.pct+'%"></div><i class="mark" style="left:33.33%"></i><i class="mark" style="left:66.66%"></i></div>'+
  btn('delChar','&#128465; '+esc(t('del')))+
  '</div>';
 html+='<div class="ws">'+
  '<aside class="panel" id="leftPanel">'+renderDetail(ch)+'</aside>'+
  '<div class="mid">'+renderDoll(ch)+renderStored(ch)+'</div>'+
  '<aside class="panel" id="bagPanel">'+renderBag(ch)+'</aside>'+
  '</div>';
 document.getElementById('main').innerHTML=html;
}
function applyMoney(cid,den,expr){
 var m=chMoney(cur(),cid);expr=String(expr).trim();var base=m[den]||0,v;
 if(/^[+-]\d+$/.test(expr))v=base+parseInt(expr,10);
 else if(/^\d+$/.test(expr))v=parseInt(expr,10);
 else return;
 m[den]=Math.max(0,v);save();
}
function applyQty(iid,expr){
 var it=findItem(iid);if(!it)return;
 expr=String(expr).trim();var base=+it.qty||0,v;
 if(/^[+-]\d+$/.test(expr))v=base+parseInt(expr,10);
 else if(/^\d+$/.test(expr))v=parseInt(expr,10);
 else return;
 it.qty=Math.max(0,v);save();
}
function sortCont(ch,cid,key){
 var idx=[],arr=[];
 ch.items.forEach(function(i,k){if(i.cid===cid){idx.push(k);arr.push(i);}});
 if(!arr.length)return;
 arr.sort(function(a,b){
  if(key==='qty')return (+b.qty||0)-(+a.qty||0);
  if(key==='weight')return ((+b.weight||0)*(+b.qty||0))-((+a.weight||0)*(+a.qty||0));
  if(key==='value')return ((+b.value||0)*(+b.qty||0))-((+a.value||0)*(+a.qty||0));
  return String(a.name).localeCompare(String(b.name));
 });
 for(var k=0;k<arr.length;k++)ch.items[idx[k]]=arr[k];
 save();
}
function equipItemToSlot(ch,iid,slotId){
 var it=ch.items.filter(function(i){return i.id===iid;})[0];if(!it)return;
 if(it.equipped&&it.slot===slotId)return;
 var occ=ch.items.filter(function(x){return x.equipped&&x.slot===slotId;})[0];
 if(occ){alert(t('slotOccupied'));return;}
 it.equipped=true;it.slot=slotId;save();
}
function equipContToSlot(ch,cid,slotId){
 var c=ch.containers.filter(function(x){return x.id===cid;})[0];if(!c)return;
 if(c.equipped&&c.slot===slotId)return;
 var occ=ch.containers.filter(function(x){return x.equipped&&x.slot===slotId;})[0];
 if(occ){alert(t('slotOccupied'));return;}
 c.equipped=true;c.slot=slotId;save();
}
function dropItemAct(ch,iid){
 var k=itemIndex(ch,iid);if(k<0)return;
 var it=ch.items[k];it.equipped=false;it.slot=null;
 ch.items.splice(k,1);
 ch.dropped.push({id:uid(),kind:'item',item:it});
 if(ui.sel===iid)ui.sel=null;
 save();
}
function dropContAct(ch,cid){
 if(!confirm(t('bagDropWarn')))return;
 var k=contIndex(ch,cid);if(k<0)return;
 var c=ch.containers[k];c.equipped=false;c.slot=null;
 ch.containers.splice(k,1);
 var items=ch.items.filter(function(i){return i.cid===cid;});
 ch.items=ch.items.filter(function(i){return i.cid!==cid;});
 ch.dropped.push({id:uid(),kind:'cont',cont:c,items:items});
 if(ui.expand===cid)ui.expand=ch.containers.length?ch.containers[0].id:null;
 if(ui.sel&&items.filter(function(i){return i.id===ui.sel;}).length)ui.sel=null;
 save();
}
function pickupAct(ch,did){
 var k=-1;for(var j=0;j<ch.dropped.length;j++)if(ch.dropped[j].id===did){k=j;break;}
 if(k<0)return;
 var d=ch.dropped[k];
 if(d.kind==='item'){
  var cid=(d.item.cid&&contIndex(ch,d.item.cid)>=0)?d.item.cid:(ui.expand||(ch.containers[0]&&ch.containers[0].id));
  if(!cid){ch.containers.push({id:uid(),name:state.lang==='zh'?'身上小袋':'Pouch',money:z(),cap:0,equipped:false,slot:null});cid=ch.containers[0].id;alert(t('noCont'));}
  d.item.cid=cid;
  ch.items.push(d.item);
 }else{
  d.cont.equipped=false;d.cont.slot=null;
  ch.containers.push(d.cont);
  d.items.forEach(function(i){ch.items.push(i);});
 }
 ch.dropped.splice(k,1);save();
}
function goneAct(ch,did){
 if(!confirm(t('confirmGone')))return;
 ch.dropped=ch.dropped.filter(function(d){return d.id!==did;});save();
}
function editItemPanel(iid){ui.sel=iid;render();}
function openSettings(){
 var m=document.getElementById('modal');
 m.hidden=false;
 m.innerHTML='<div class="sheet"><h3>&#9881; '+esc(t('settings'))+'</h3>'+
  '<label>'+esc(t('repo'))+'<input id="setRepo" value="'+esc(state.gh.repo||'')+'"></label>'+
  '<label>'+esc(t('pat'))+'<input id="setPat" type="password" placeholder="github_pat_..." value="'+esc(state.gh.pat||'')+'"></label>'+
  '<label class="chk"><input type="checkbox" id="setAuto"'+(state.gh.auto?' checked':'')+'>'+esc(t('autoSync'))+'</label>'+
  '<div class="row">'+btn('push',esc(t('push')))+btn('pull',esc(t('pull')))+btn('saveSettings','&#128190; '+esc(t('save')))+btn('closeModal',esc(t('close')))+'</div>'+
  '<p class="hint">'+esc(t('hint'))+'</p></div>';
}
function readSettings(){
 state.gh.repo=(document.getElementById('setRepo').value.trim())||DEFAULT_REPO;
 state.gh.pat=document.getElementById('setPat').value.trim();
 state.gh.auto=document.getElementById('setAuto').checked;
 save();document.getElementById('modal').hidden=true;document.getElementById('modal').innerHTML='';
}
function doExport(){
 var blob=new Blob([JSON.stringify(publicData(),null,2)],{type:'application/json'});
 var a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download='dnd-inventory-'+new Date().toISOString().slice(0,10)+'.json';
 a.click();URL.revokeObjectURL(a.href);
}
var lpFired=false,lpTimer=null;
function lpCancel(){if(lpTimer){clearTimeout(lpTimer);lpTimer=null;}}
function isStepper(el){return el.closest?el.closest('[data-act="moneyPlus"],[data-act="moneyMinus"],[data-act="qtyPlus"],[data-act="qtyMinus"]'):null;}
document.addEventListener('pointerdown',function(e){
 var el=isStepper(e.target);
 if(!el)return;
 lpFired=false;lpCancel();
 lpTimer=setTimeout(function(){
  lpTimer=null;lpFired=true;
  var n=prompt(t('moneyEditTip'),'1');
  if(n===null)return;
  var expr=(el.dataset.act.slice(-4)==='Plus'?'+':'-')+String(n);
  if(el.dataset.act.indexOf('money')===0)applyMoney(el.dataset.cid,el.dataset.den,expr);
  else applyQty(el.dataset.iid,expr);
 },500);
});
document.addEventListener('pointerup',lpCancel);
document.addEventListener('pointercancel',lpCancel);
document.addEventListener('contextmenu',function(e){if(isStepper(e.target))e.preventDefault();});
document.addEventListener('click',function(e){
 var el=e.target.closest?e.target.closest('[data-act]'):null;if(!el)return;
 var act=el.dataset.act,ch=cur(),cid,den,item,n,c;
 if(act==='lang'){state.lang=state.lang==='zh'?'en':'zh';save();}
 else if(act==='export'){doExport();}
 else if(act==='import'){document.getElementById('importFile').click();}
 else if(act==='settings'){openSettings();}
 else if(act==='addChar'){n=prompt(t('charName'));if(n&&n.trim()){var nc={id:uid(),name:n.trim(),str:10,coinWeight:false,dropped:[],containers:newContainers(),items:[]};state.characters.push(nc);state.curChar=nc.id;resetUI();save();}}
 else if(act==='selChar'){state.curChar=el.dataset.id;resetUI();save();}
 else if(act==='renameChar'){n=prompt(t('charName'),ch.name);if(n&&n.trim()){ch.name=n.trim();save();}}
 else if(act==='delChar'){if(state.characters.length>1&&confirm(t('confirmDelChar'))){state.characters=state.characters.filter(function(x){return x.id!==ch.id;});state.curChar=state.characters[0].id;resetUI();save();}}
 else if(act==='editStr'){n=prompt(t('strPrompt'),ch.str);if(n!==null){ch.str=Math.max(1,Math.min(30,parseInt(n,10)||10));save();}}
 else if(act==='toggleCoinW'){ch.coinWeight=!ch.coinWeight;save();}
 else if(act==='addCont'){n=prompt(t('contName'));if(n&&n.trim()){c={id:uid(),name:n.trim(),money:z(),cap:0,equipped:false,slot:null};ch.containers.push(c);ui.expand=c.id;save();}}
 else if(act==='renameCont'){cid=el.dataset.cid;c=ch.containers.filter(function(x){return x.id===cid;})[0];n=prompt(t('contName'),c.name);if(n&&n.trim()){c.name=n.trim();save();}}
 else if(act==='delCont'){cid=el.dataset.cid;if(confirm(t('confirmDelCont'))){ch.containers=ch.containers.filter(function(x){return x.id!==cid;});ch.items=ch.items.filter(function(i){return i.cid!==cid;});if(ui.expand===cid)ui.expand=ch.containers.length?ch.containers[0].id:null;save();}}
 else if(act==='editCap'){cid=el.dataset.cid;c=ch.containers.filter(function(x){return x.id===cid;})[0];n=prompt(t('capPrompt'),c.cap||0);if(n!==null){c.cap=Math.max(0,parseFloat(n)||0);save();}}
 else if(act==='equipCont'){cid=el.dataset.cid;var fs=freeSlot(ch,'bag');if(!fs){alert(t('noFreeSlot'));return;}equipContToSlot(ch,cid,fs);}
 else if(act==='unequipCont'){cid=el.dataset.cid;c=ch.containers.filter(function(x){return x.id===cid;})[0];if(c){c.equipped=false;c.slot=null;save();}}
 else if(act==='expandCont'){cid=el.dataset.cid;ui.expand=(ui.expand===cid)?null:cid;render();}
 else if(act==='slotEquip'){item=ch.items.filter(function(i){return i.id===ui.sel;})[0];if(item&&!item.equipped)equipItemToSlot(ch,item.id,el.dataset.slot);}
 else if(act==='equipSel'){item=ch.items.filter(function(i){return i.id===ui.sel;})[0];if(!item)return;var fs2=freeSlot(ch,'item');if(!fs2){alert(t('noFreeSlot'));return;}equipItemToSlot(ch,item.id,fs2);}
 else if(act==='unequipItem'){item=findItem(el.dataset.iid);if(item){item.equipped=false;item.slot=null;save();}}
 else if(act==='toggleAttuned'){item=findItem(el.dataset.iid);if(!item)return;if(!item.attuned&&attunedCount(ch)>=3){alert(t('attFull'));return;}item.attuned=!item.attuned;save();}
 else if(act==='addItem'){cid=el.dataset.cid;n=prompt(t('itemName'));if(n&&n.trim()){var ni={id:uid(),cid:cid,name:n.trim(),qty:1,weight:'',notes:'',value:'',type:'misc',attune:false,attuned:false,equipped:false,slot:null};ch.items.push(ni);ui.sel=ni.id;save();}}
 else if(act==='qtyPlus'){item=findItem(el.dataset.iid);if(item){item.qty=(+item.qty||0)+1;save();}}
 else if(act==='qtyMinus'){item=findItem(el.dataset.iid);if(item){item.qty=Math.max(0,(+item.qty||0)-1);save();}}
 else if(act==='qtyEdit'){item=findItem(el.dataset.iid);if(item){n=prompt(t('qtyEditTip'),item.qty);if(n!==null)applyQty(item.id,n);}}
 else if(act==='selItem'){ui.sel=el.dataset.iid;render();}
 else if(act==='dropItem'){dropItemAct(ch,el.dataset.iid);}
 else if(act==='dropCont'){dropContAct(ch,el.dataset.cid);}
 else if(act==='pickup'){pickupAct(ch,el.dataset.did);}
 else if(act==='goneDrop'){goneAct(ch,el.dataset.did);}
 else if(act==='sortCont'){if(ui.expand)sortCont(ch,ui.expand,el.dataset.key);}
 else if(act==='setView'){ui.view=el.dataset.v;render();}
 else if(act==='delItem'){ch.items=ch.items.filter(function(i){return i.id!==el.dataset.iid;});if(ui.sel===el.dataset.iid)ui.sel=null;save();}
 else if(act==='moneyEdit'){den=el.dataset.den;var m=chMoney(ch,el.dataset.cid);n=prompt(t('moneyEditTip'),m[den]||0);if(n!==null)applyMoney(el.dataset.cid,den,n);}
 else if(act==='moneyPlus'||act==='moneyMinus'){
  if(lpFired){lpFired=false;return;}
  applyMoney(el.dataset.cid,el.dataset.den,act==='moneyPlus'?'+1':'-1');
 }
 else if(act==='push'){pushData();}
 else if(act==='pull'){pullData();}
 else if(act==='saveSettings'){readSettings();}
 else if(act==='closeModal'){document.getElementById('modal').hidden=true;document.getElementById('modal').innerHTML='';}
});
document.addEventListener('change',function(e){
 var el=e.target;if(!el.closest||!el.closest('#leftPanel'))return;
 var ch=cur();
 var item=ch.items.filter(function(i){return i.id===ui.sel;})[0];if(!item)return;
 var f=el.dataset.f;if(!f)return;
 if(f==='name')item.name=el.value.trim()||item.name;
 else if(f==='qty')item.qty=Math.max(0,parseInt(el.value,10)||0);
 else if(f==='weight')item.weight=el.value.trim();
 else if(f==='value')item.value=el.value.trim();
 else if(f==='type')item.type=el.value;
 else if(f==='notes')item.notes=el.value;
 else if(f==='attune'){item.attune=el.checked;if(!item.attune)item.attuned=false;}
 else if(f==='move'){var cid=el.value;if(cid&&cid!==item.cid){item.cid=cid;item.equipped=false;item.slot=null;}}
 save();
});
document.getElementById('modal').addEventListener('click',function(e){if(e.target===this){this.hidden=true;this.innerHTML='';}});
document.getElementById('importFile').addEventListener('change',function(e){
 var f=e.target.files[0];if(!f)return;
 var r=new FileReader();
 r.onload=function(){
  try{var s=JSON.parse(r.result);
   if(!s.characters||!s.characters.length)throw new Error('bad');
   adoptRemote(s);scheduleSync();
  }catch(err){alert('Invalid file');}
 };
 r.readAsText(f);e.target.value='';
});
document.addEventListener('dragstart',function(e){
 var di=e.target.closest?e.target.closest('.item,.tile'):null;
 var chip=e.target.closest?e.target.closest('.chip'):null;
 var card=e.target.closest?e.target.closest('.contcard'):null;
 if(di){e.dataTransfer.setData('text/plain',JSON.stringify({kind:'item',id:di.dataset.iid}));e.dataTransfer.effectAllowed='move';}
 else if(chip){e.dataTransfer.setData('text/plain',JSON.stringify({kind:'money',den:chip.dataset.den,cid:chip.dataset.cid}));}
 else if(card){e.dataTransfer.setData('text/plain',JSON.stringify({kind:'cont',id:card.dataset.cid}));e.dataTransfer.effectAllowed='move';}
});
document.addEventListener('dragover',function(e){
 var z=e.target.closest?e.target.closest('.dropzone'):null;
 if(z){e.preventDefault();z.classList.add('over');}
});
document.addEventListener('dragleave',function(e){
 var z=e.target.closest?e.target.closest('.dropzone'):null;
 if(z)z.classList.remove('over');
});
document.addEventListener('drop',function(e){
 var z=e.target.closest?e.target.closest('.dropzone'):null;if(!z)return;
 e.preventDefault();z.classList.remove('over');
 var raw=e.dataTransfer.getData('text/plain');if(!raw)return;
 var d;try{d=JSON.parse(raw);}catch(err){return;}
 var ch=cur();
 if(z.dataset.slot){
  var slotId=z.dataset.slot,kind=z.dataset.kind;
  if(d.kind==='item'&&kind==='item'){equipItemToSlot(ch,d.id,slotId);return;}
  if(d.kind==='cont'&&kind==='bag'){equipContToSlot(ch,d.id,slotId);return;}
  if(d.kind==='item'&&kind==='bag'&&z.dataset.cid){
   var it=ch.items.filter(function(i){return i.id===d.id;})[0];
   if(it&&it.cid!==z.dataset.cid){it.cid=z.dataset.cid;it.equipped=false;it.slot=null;save();}
   return;
  }
  return;
 }
 var target=z.dataset.cid;if(!target)return;
 if(d.kind==='item'){
  var it2=ch.items.filter(function(i){return i.id===d.id;})[0];
  if(it2&&it2.cid!==target){it2.cid=target;it2.equipped=false;it2.slot=null;save();}
 }else if(d.kind==='money'&&d.cid!==target){
  var src=chMoney(ch,d.cid);var max=src[d.den]||0;
  if(max<=0)return;
  var v=prompt(t('moneyMove').replace('{d}',tden(d.den)).replace('{max}',String(max)),String(max));
  if(v===null)return;
  v=Math.min(max,Math.max(0,parseInt(v,10)||0));
  if(v<=0)return;
  src[d.den]=max-v;
  var dst=chMoney(ch,target);dst[d.den]=(dst[d.den]||0)+v;
  save();
 }
});
if(!ui.inited){ui.inited=true;var c0=cur();if(c0&&c0.containers&&c0.containers.length)ui.expand=c0.containers[0].id;}
render();
if(state.gh.pat)pullIfRemoteNewer();
})();
