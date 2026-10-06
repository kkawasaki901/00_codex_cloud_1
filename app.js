import {makeNote,folderParts} from './core.mjs';
const $=id=>document.getElementById(id);
let vaultHandle;
function status(message){$('status').textContent=message;$('status').style.display='block';}
function values(){return {title:$('title').value,date:$('date').value,url:$('url').value,summary:$('summary').value};}
function preview(){try{const note=makeNote(values());$('preview').textContent=note.filename+'\n\n'+note.markdown;}catch{$('preview').textContent='タイトル・日付・リンク・要約を入力すると表示されます。';}}
async function db(){return new Promise((resolve,reject)=>{const request=indexedDB.open('vault',1);request.onupgradeneeded=()=>request.result.createObjectStore('handles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function persist(handle){const database=await db();await new Promise((resolve,reject)=>{const tx=database.transaction('handles','readwrite');tx.objectStore('handles').put(handle,'vault');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});database.close();}
async function restore(){const database=await db();vaultHandle=await new Promise((resolve,reject)=>{const request=database.transaction('handles').objectStore('handles').get('vault');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});database.close();if(vaultHandle)$('vault').textContent='選択済み: '+vaultHandle.name;}
function run(id,fn){$(id).addEventListener('click',async()=>{const button=$(id);button.disabled=true;try{await fn();}catch(e){status(e.message);}finally{button.disabled=false;preview();}});}
function extractArticle(){
  const visible=e=>!!e && e.getClientRects().length>0;
  const root=Array.from(document.querySelectorAll('#article_full_contents, .article_full_contents, .article_reader, .article_content, .article_content_wrapper')).find(visible);
  if(!root)return {error:'開いている記事を検出できませんでした。Inoreaderで記事と要約を表示してください。取得できない場合は各項目を手入力できます。'};
  const scope=root.closest('.article_full, .article_reader, .article_full_contents_wrapper')||root.parentElement;
  const titleNode=Array.from(scope.querySelectorAll('.article_title, .article_header_title, h1, h2')).find(visible)||Array.from(document.querySelectorAll('.article_title, .article_header_title')).find(visible);
  const anchor=titleNode?.closest('a')||titleNode?.querySelector('a')||scope.querySelector('a.article_title, .article_title a, .article_header_title a');
  const dateNode=scope.querySelector('time[datetime], [data-published], .article_date[title], .article_header_date[title]');
  const raw=dateNode?.getAttribute('datetime')||dateNode?.getAttribute('data-published')||dateNode?.getAttribute('title')||'';
  let date='';
  if(/^\d{4}-\d{2}-\d{2}/.test(raw))date=raw.slice(0,10);
  else if(raw && /\d{4}/.test(raw)){const parsed=new Date(raw);if(!isNaN(parsed))date=[parsed.getFullYear(),String(parsed.getMonth()+1).padStart(2,'0'),String(parsed.getDate()).padStart(2,'0')].join('-');}
  // 選択テキストを優先。要約のDOMは表示モードにより変わるため手入力も提供する。
  const selected=window.getSelection()?.toString().trim()||'';
  const summaryNode=Array.from(scope.querySelectorAll('[data-role="article-summary"], .article_summary_content, .article_ai_summary_content, .ai_summary_content')).find(visible);
  const summary=selected||summaryNode?.innerText?.trim()||'';
  return {title:titleNode?.innerText?.trim()||'',url:anchor?.href||'',date,summary,summarySource:selected?'selection':summary?'detected':''};
}
async function extract(){const {sourceTabId}=await chrome.storage.session.get('sourceTabId');if(!sourceTabId)throw new Error('Inoreaderの記事を開いて拡張アイコンを押してください。');const tab=await chrome.tabs.get(sourceTabId);if(!/^https:\/\/([^/]+\.)?inoreader\.com\//.test(tab.url||''))throw new Error('Inoreaderのタブから拡張を開いてください。');const [result]=await chrome.scripting.executeScript({target:{tabId:sourceTabId},func:extractArticle});const data=result.result;if(data.error)throw new Error(data.error);for(const key of ['title','date','url'])$(key).value=data[key];if(data.summary)$('summary').value=data.summary;status(data.summary?(data.summarySource==='selection'?'選択したテキストを要約として取得しました。':'要約候補を取得しました。Inoreaderの要約と一致するか確認してください。'):'要約を検出できませんでした。Inoreaderで生成した要約を選択して再取得するか、下の欄に貼り付けてください。');}
run('extract',extract);
run('settings',async()=>{await chrome.storage.local.set({folder:$('folder').value});status('保存先の設定を保存しました。');});
run('choose',async()=>{vaultHandle=await window.showDirectoryPicker({mode:'readwrite',id:'obsidian-vault'});await persist(vaultHandle);$('vault').textContent='選択済み: '+vaultHandle.name;status('Vaultフォルダを選択しました。');});
run('save',async()=>{
  const note=makeNote(values()),parts=folderParts($('folder').value);if(!vaultHandle)throw new Error('最初にVaultフォルダを選択してください。');
  if(await vaultHandle.requestPermission({mode:'readwrite'})!=='granted')throw new Error('Vaultへの書き込みを許可してください。');
  let dir=vaultHandle;for(const part of parts)dir=await dir.getDirectoryHandle(part,{create:true});
  try{await dir.getFileHandle(note.filename);throw new Error('同名ファイルが存在します。タイトルを変更して保存してください。');}catch(e){if(e.name!=='NotFoundError')throw e;}
  const handle=await dir.getFileHandle(note.filename,{create:true});const writer=await handle.createWritable();await writer.write(note.markdown);await writer.close();status('保存しました: '+[...parts,note.filename].join('/'));
});
for(const id of ['title','date','url','summary'])$(id).addEventListener('input',preview);
const settings=await chrome.storage.local.get(['folder']);for(const [key,value]of Object.entries(settings))if($(key))$(key).value=value;
await chrome.storage.local.remove(['provider','model','key','vaultName']);
await chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
await restore().catch(()=>{});await extract().catch(e=>status(e.message));preview();
