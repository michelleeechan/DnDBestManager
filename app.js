(function(){
'use strict';
var LS='dnd-inv-v1';
var DEN=['pp','gp','ep','sp','cp'];
var RATE={cp:1,sp:10,ep:50,gp:100,pp:1000};
var DEFAULT_REPO='michelleeechan/DnDBestManager';
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
var I18N={
 zh:{appTitle:'D&D 物品欄管理',characters:'角色',addChar:'＋ 新增角色',charName:'角色名稱？',contName:'容器名稱？',itemName:'物品名稱？',addCont:'＋ 新增容器',addItem:'＋ 物品',qty:'數量',weight:'重量（lb）',notes:'備註',totalValue:'總值',totalWeight:'總重量',export:'匯出',import:'匯入',settings:'同步設定',repo:'Repo（owner/name）',pat:'GitHub Token',autoSync:'改動後自動同步到 GitHub',push:'立即上傳',pull:'從 GitHub 讀取',save:'儲存',close:'關閉',syncing:'同步中…',synced:'已同步 ✓',syncFail:'同步失敗',del:'刪除',confirmDelChar:'確定刪除這個角色？',confirmDelCont:'確定刪除這個容器？（內含物品會一併刪除）',empty:'（空）',moneyEditTip:'輸入新數量，或用 +50 / -50：',moneyMove:'要搬移多少{d}？（上限 {max}）',pulled:'已從 GitHub 讀取 ✓',pullFail:'讀取失敗',noToken:'未設定 Token',den:{pp:'鉑金幣',gp:'金幣',ep:'電金幣',sp:'銀幣',cp:'銅幣'},langBtn:'EN',hint:'Token 只會存在此瀏覽器，不會被 commit 到 repo。'},
 en:{appTitle:'D&D Inventory Manager',characters:'Characters',addChar:'＋ New character',charName:'Character name?',contName:'Container name?',itemName:'Item name?',addCont:'＋ Add container',addItem:'＋ Item',qty:'Qty',weight:'Weight (lb)',notes:'Notes',totalValue:'Total value',totalWeight:'Total weight',export:'Export',import:'Import',settings:'Sync settings',repo:'Repo (owner/name)',pat:'GitHub token',autoSync:'Auto-sync to GitHub on change',push:'Push now',pull:'Pull from GitHub',save:'Save',close:'Close',syncing:'Syncing…',synced:'Synced ✓',syncFail:'Sync failed',del:'Delete',confirmDelChar:'Delete this character?',confirmDelCont:'Delete this container? (items inside will be removed too)',empty:'(empty)',moneyEditTip:'New amount, or +50 / -50:',moneyMove:'How many {d} to move? (max {max})',pulled:'Pulled from GitHub ✓',pullFail:'Pull failed',noToken:'No token set',den:{pp:'PP',gp:'GP',ep:'EP',sp:'SP',cp:'CP'},langBtn:'中',hint:'The token stays in this browser only; it is never committed.'}
};
function seed(){
 return {version:1,lang:'zh',savedAt:Date.now(),curChar:null,
  gh:{repo:DEFAULT_REPO,pat:'',auto:true},
  characters:[{id:uid(),name:'新角色',containers:[{id:uid(),name:'身上小袋',money:z()},{id:uid(),name:'背包',money:z()}],items:[]}]};
}
function z(){return {pp:0,gp:0,ep:0,sp:0,cp:0};}
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
function renderMain(){
 var ch=cur();if(!ch)return;
 var html='<div class="charhead"><div class="charname" data-act="renameChar">'+esc(ch.name)+'</div>'+
  '<div class="totals">'+esc(t('totalValue'))+' <b>'+totalGp(ch).toFixed(2)+' gp</b> &middot; '+esc(t('totalWeight'))+' <b>'+totalW(ch).toFixed(1)+' lb</b></div>'+
  btn('delChar','&#128465; '+esc(t('del')))+'</div><div class="grid">';
 ch.containers.forEach(function(c){
  html+='<section class="card dropzone" data-cid="'+c.id+'">'+
   '<header><span class="cname" data-act="renameCont" data-cid="'+c.id+'">&#9998; '+esc(c.name)+'</span>'+
   '<button class="x" data-act="delCont" data-cid="'+c.id+'">&#10005;</button></header><div class="items">';
  var items=ch.items.filter(function(i){return i.cid===c.id;});
  if(!items.length)html+='<div class="empty">'+esc(t('empty'))+'</div>';
  items.forEach(function(i){
   html+='<div class="item" draggable="true" data-iid="'+i.id+'">'+
    '<span class="iname" title="'+esc(i.notes||'')+'">'+esc(i.name)+(i.notes?' *':'')+'</span>'+
    '<span class="iqty">&times;'+(+i.qty||1)+'</span>'+
    (+i.weight?'<span class="iw">'+(+i.weight)+'lb</span>':'')+
    '<span class="ibtns"><button data-act="qtyMinus" data-iid="'+i.id+'">-</button>'+
    '<button data-act="qtyPlus" data-iid="'+i.id+'">+</button>'+
    '<button data-act="editItem" data-iid="'+i.id+'">&#9998;</button>'+
    '<button data-act="delItem" data-iid="'+i.id+'">&#10005;</button></span></div>';
  });
  html+='</div><button class="itemadd" data-act="addItem" data-cid="'+c.id+'">'+esc(t('addItem'))+'</button>';
  var m=chMoney(ch,c.id);
  html+='<div class="moneyrow">';
  DEN.forEach(function(d){
   html+='<span class="chip" draggable="true" data-den="'+d+'" data-cid="'+c.id+'"><i>'+esc(tden(d))+'</i>'+
    '<b data-act="moneyEdit" data-cid="'+c.id+'" data-den="'+d+'">'+(m[d]||0)+'</b>'+
    '<button data-act="moneyMinus" data-cid="'+c.id+'" data-den="'+d+'">-</button>'+
    '<button data-act="moneyPlus" data-cid="'+c.id+'" data-den="'+d+'">+</button></span>';
  });
  html+='</div></section>';
 });
 html+='</div><div class="addcont">'+btn('addCont',esc(t('addCont')))+'</div>';
 document.getElementById('main').innerHTML=html;
}
function findItem(iid){return cur().items.filter(function(i){return i.id===iid;})[0];}
function applyMoney(cid,den,expr){
 var m=chMoney(cur(),cid);expr=String(expr).trim();var base=m[den]||0,v;
 if(/^[+-]\d+$/.test(expr))v=base+parseInt(expr,10);
 else if(/^\d+$/.test(expr))v=parseInt(expr,10);
 else return;
 m[den]=Math.max(0,v);save();
}
function editItemDialog(item){
 var n=prompt(t('itemName'),item.name);if(n===null)return;
 var q=prompt(t('qty'),item.qty);if(q===null)return;
 var w=prompt(t('weight'),item.weight==null?'':item.weight);if(w===null)return;
 var no=prompt(t('notes'),item.notes||'');if(no===null)return;
 item.name=n.trim()||item.name;item.qty=Math.max(1,parseInt(q,10)||1);item.weight=w.trim();item.notes=no.trim();save();
}
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
document.addEventListener('click',function(e){
 var el=e.target.closest?e.target.closest('[data-act]'):null;if(!el)return;
 var act=el.dataset.act,ch=cur(),cid,den,item,n,c;
 if(act==='lang'){state.lang=state.lang==='zh'?'en':'zh';save();}
 else if(act==='export'){doExport();}
 else if(act==='import'){document.getElementById('importFile').click();}
 else if(act==='settings'){openSettings();}
 else if(act==='addChar'){n=prompt(t('charName'));if(n&&n.trim()){var nc={id:uid(),name:n.trim(),containers:newContainers(),items:[]};state.characters.push(nc);state.curChar=nc.id;save();}}
 else if(act==='selChar'){state.curChar=el.dataset.id;save();}
 else if(act==='renameChar'){n=prompt(t('charName'),ch.name);if(n&&n.trim()){ch.name=n.trim();save();}}
 else if(act==='delChar'){if(state.characters.length>1&&confirm(t('confirmDelChar'))){state.characters=state.characters.filter(function(x){return x.id!==ch.id;});state.curChar=state.characters[0].id;save();}}
 else if(act==='addCont'){n=prompt(t('contName'));if(n&&n.trim()){ch.containers.push({id:uid(),name:n.trim(),money:z()});save();}}
 else if(act==='renameCont'){cid=el.dataset.cid;c=ch.containers.filter(function(x){return x.id===cid;})[0];n=prompt(t('contName'),c.name);if(n&&n.trim()){c.name=n.trim();save();}}
 else if(act==='delCont'){cid=el.dataset.cid;if(confirm(t('confirmDelCont'))){ch.containers=ch.containers.filter(function(x){return x.id!==cid;});ch.items=ch.items.filter(function(i){return i.cid!==cid;});save();}}
 else if(act==='addItem'){cid=el.dataset.cid;n=prompt(t('itemName'));if(n&&n.trim()){ch.items.push({id:uid(),cid:cid,name:n.trim(),qty:1,weight:'',notes:''});save();}}
 else if(act==='qtyPlus'){item=findItem(el.dataset.iid);if(item){item.qty=(+item.qty||1)+1;save();}}
 else if(act==='qtyMinus'){item=findItem(el.dataset.iid);if(item){item.qty=Math.max(1,(+item.qty||1)-1);save();}}
 else if(act==='delItem'){ch.items=ch.items.filter(function(i){return i.id!==el.dataset.iid;});save();}
 else if(act==='editItem'){item=findItem(el.dataset.iid);if(item)editItemDialog(item);}
 else if(act==='moneyEdit'){den=el.dataset.den;var m=chMoney(ch,el.dataset.cid);n=prompt(t('moneyEditTip'),m[den]||0);if(n!==null)applyMoney(el.dataset.cid,den,n);}
 else if(act==='moneyPlus'||act==='moneyMinus'){den=el.dataset.den;n=prompt(t('moneyEditTip'),'1');if(n!==null)applyMoney(el.dataset.cid,den,(act==='moneyPlus'?'+':'-')+String(n));}
 else if(act==='push'){pushData();}
 else if(act==='pull'){pullData();}
 else if(act==='saveSettings'){readSettings();}
 else if(act==='closeModal'){document.getElementById('modal').hidden=true;document.getElementById('modal').innerHTML='';}
});
document.getElementById('modal').addEventListener('click',function(e){if(e.target===this){this.hidden=true;this.innerHTML='';}});
document.getElementById('importFile').addEventListener('change',function(e){
 var f=e.target.files[0];if(!f)return;
 var r=new FileReader();
 r.onload=function(){
  try{var s=JSON.parse(r.result);
   if(!s.characters||!s.characters.length)throw new Error('bad');
   var gh=state.gh;state=s;state.gh=gh;save();
  }catch(err){alert('Invalid file');}
 };
 r.readAsText(f);e.target.value='';
});
document.addEventListener('dragstart',function(e){
 var item=e.target.closest?e.target.closest('.item'):null;
 var chip=e.target.closest?e.target.closest('.chip'):null;
 if(item){e.dataTransfer.setData('text/plain',JSON.stringify({kind:'item',id:item.dataset.iid}));e.dataTransfer.effectAllowed='move';}
 else if(chip){e.dataTransfer.setData('text/plain',JSON.stringify({kind:'money',den:chip.dataset.den,cid:chip.dataset.cid}));}
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
 var ch=cur(),target=z.dataset.cid;
 if(d.kind==='item'){
  var it=ch.items.filter(function(i){return i.id===d.id;})[0];
  if(it&&it.cid!==target){it.cid=target;save();}
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
render();
if(state.gh.pat)pullIfRemoteNewer();
})();
