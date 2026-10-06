export function safeTitle(title) {
  const value = title.normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_').replace(/[. ]+$/g, '').trim().slice(0, 120);
  return value || 'untitled';
}
export function makeNote({title,date,url,summary}) {
  if (!title.trim() || !summary.trim()) throw new Error('タイトルと要約を入力してください。');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) throw new Error('記事の作成日を入力してください。');
  const link = new URL(url); if (!['https:','http:'].includes(link.protocol)) throw new Error('記事リンクはhttp/httpsで指定してください。');
  return {filename: `${date.slice(2).replaceAll('-','')}_${safeTitle(title)}.md`, markdown: `---\nsource: ${JSON.stringify(link.href)}\ntitle: ${JSON.stringify(title)}\ndate: ${date}\n---\n\n${summary.trim()}\n`};
}
export function folderParts(folder) {
  const parts = folder.trim().split('/').filter(Boolean);
  if (parts.some(p => p==='.' || p==='..' || /[\\:*?"<>|\u0000-\u001f]/.test(p))) throw new Error('保存先はVault内のフォルダ名を / で区切って指定してください。');
  return parts;
}
