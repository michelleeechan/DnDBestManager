(function(){
'use strict';
var LS='dnd-inv-v1';
var DEN=['pp','gp','ep','sp','cp'];
var RATE={cp:1,sp:10,ep:50,gp:100,pp:1000};
var DEFAULT_REPO='michelleeechan/DnDBestManager';
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
var I18N={
 zh:{appTitle:'D&D 物品欄管理',characters:'角色',addChar:'＋ 新增角色',charName:'角色名稱？',contName:'容器名稱？',itemName:'物品名稱？',addCont:'＋ 新增容器',addItem:'＋ 物品',qty:'數量',weight:'重量（lb）',notes:'備註',totalValue:'總值',totalWeight:'總重量',export:'匯出',import:'匯入',settings:'同步設定',repo:'Repo（owner/name）',pat:'GitHub Token',autoSync:'改動後自動同步到 GitHub',push:'立即上傳',pull:'從 GitHub 讀取',save:'儲存',close:'關閉',syncing:'同步中…',synced:'已同步 鉁揬',syncFail:'同步失敗',del:'刪除',confirmDelChar:'確定刪除這個角色？',confirmDelCont:'確定刪除這個容器？（內含物品會一併刪除）',empty:'（空）',moneyEditTip:'輸入新數量，或用 +50 / -50：',moneyMove:'要搬移多少{d}？（上限 {max}）',pulled:'已從 GitHub 讀取 鉁揬',pullFail:'讀取失敗',noToken:'未設定 Token',den:{pp:'鉑金幣',gp:'金幣',ep:'電金幣',sp:'銀幣',cp:'銅幣'},langBtn:'EN',hint:'Token 只會存在此瀏覽器，不會被 commit 到 repo。'},
 en:{appTitle:'D&D Inventory Manager',characters:'Characters',addChar:'＋ New character',charName:'Character name?',contName:'Container name?',itemName:'Item name?',addCont:'＋ Add container',addItem:'＋ Item',qty:'Qty',weight:'Weight (lb)',notes:'Notes',totalValue:'Total value',totalWeight:'Total weight',export:'Export',import:'Import',settings:'Sync settings',repo:'Repo (owner/name)',pat:'GitHub token',autoSync:'Auto-sync to GitHub on change',push:'Push now',pull:'Pull from GitHub',save:'Save',close:'Close',syncing:'Syncing…',synced:'Synced 鉁揬',syncFail:'Sync failed',del:'Delete',confirmDelChar:'Delete this character?',confirmDelCont:'Delete this container? (items inside will be removed too)',empty:'(empty)',moneyEditTip:'New amount, or +50 / -50:',moneyMove:'How many {d} to move? (max {max})',pulled:'Pulled from GitHub 鉁揬',pullFail:'Pull failed',noToken:'No token set',den:{pp:'PP',gp:'GP',ep:'EP',sp:'SP',cp:'CP'},langBtn:'中',hint:'The token stays in this browser only; it is never committed.'}
};
function seed(){
 return {version:1,lang:'zh',savedAt:Date.now(),curChar:null,
  gh:{repo:DEFAULT_REPO,pat:'',auto:true},
  characters:[{id:uid(),name:'新角色',containers:[{id:uid(),name:'身上小袋',money:{pp:0,gp:0,ep:0,sp:0,cp:0}},{id:uid(),name:'背包',money:{pp:0,gp:0,ep:0,sp:0,cp:0}}],items:[]}]};
}
function load(){try{var s=JSON.parse(localStorage.getItem(LS));if(s&&s.characters&&s.characters.length)return s;}catch(e){}return seed();}
var state=load();
if(!state.gh)state.gh={repo:DEFAULT_REPO,pat:'',auto:true};
function t(k){var d=I18N[state.lang]||I18N.zh;return d[k]!==undefined?d[k]:k;}
function tden(d){return (I18N[state.lang]||I18N.zh).den[d];}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cur(){return state.characters.filter(function(c){return c.id===state.curChar;})[0]||state.characters[0];}
function clone(o){return JSON.parse(JSON.stringify(o));}
function publicData(){var s=clone(state);if(s.gh)s.gh.pat='';return s;}
function save(){state.savedAt=Date.now();localStorage.setItem(LS,JSON.stringify(state));render();scheduleSync();}
function newContainers(){return [{id:uid(),name:state.lang==='zh'?'身上小袋':'Pouch',money:z()},{id:uid(),name:state.lang==='zh'?'背包':'Backpack',money:z()}];}
function z(){return {pp:0,gp:0,ep:0,sp:0,cp:0};}
function chMoney(ch,cid){var c=ch.containers.filter(function(x){return x.id===cid;})[0];if(!c)return z();if(!c.money)c.money=z();return c.money;}
function totalGp(ch){var v=0;ch.containers.forEach(function(c){var m=c.money||{};DEN.forEach(function(d){v+=(m[d]||0)*RATE[d];});});return v/RATE.gp;}
function totalW(ch){var w=0;ch.items.forEach(function(i){w+=(+i.weight||0)*(+i.qty||1);});return w;}
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
function pullData(){
 if(!state.gh.pat){setStatus(t('noToken'));return;}
 setStatus(t('syncing'));
 fetchJSON(ghURL('data.json'),{headers:ghHeaders()}).then(function(f){
  var remote=JSON.parse(unb64(f.content));
  if(!remote.characters||!remote.characters.length)throw new Error('bad data');
  var gh=state.gh;
  state=remote;
  state.gh={repo:(remote.gh&&remote.gh.repo)||gh.repo,pat:gh.pat,auto:gh.auto};
  localStorage.setItem(LS,JSON.stringify(state));
  render();setStatus(t('pulled'));
 }).catch(function(e){setStatus(t('pullFail')+' ('+e.message+')');});
}
function pullIfRemoteNewer(){
 fetchJSON(ghURL('data.json'),{headers:ghHeaders()}).then(function(f){
  var remote=JSON.parse(unb64(f.content));
  if(remote&&remote.characters&&remote.characters.length&&(remote.savedAt||0)>(state.savedAt||0)){
   var gh=state.gh;
   state=remote;
   state.gh={repo:(remote.gh&&remote.gh.repo)||gh.repo,pat:gh.pat,auto:gh.auto};
   localStorage.setItem(LS,JSON.stringify(state));
   render();
  }
 }).catch(function(){});
}
function btn(act,label,cls){return '<button class="'+(cls||'')+'" data-act="'+act+'">'+label+'</button>';}
function render(){renderTop();renderSide();renderMain();}
function renderTop(){
 document.getElementById('topbar').innerHTML=
  '<div class="brand">鈿擻锔廫 '+esc(t('appTitle'))+'</div><div class="topbtns">'+
  btn('lang',esc(t('langBtn')))+btn('export',esc(t('export')))+btn('import',esc(t('import')))+
  btn('settings','鈿橽 '+esc(t('settings')))+
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
function renderMain(){
 var ch=cur();if(!ch)return;
 var html='<div class="charhead"><div class="charname" data-act="renameChar" title="'+esc(t('del'))+' 鉁嶾>+esc(ch.name)+</div>+
  <div class=\totals">'+esc(t('totalValue'))+' <b>'+totalGp(ch).toFixed(2)+' gp</b> · '+esc(t('totalWeight'))+' <b>'+totalW(ch).toFixed(1)+' lb</b></div>'+
 