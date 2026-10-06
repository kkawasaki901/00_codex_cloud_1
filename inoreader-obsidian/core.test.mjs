import test from 'node:test';
import assert from 'node:assert/strict';
import {makeNote,folderParts} from './core.mjs';
const input={title:'記事: テスト/入門',date:'2026-10-06',url:'https://example.com/article',summary:'## 概要\n要点です。'};
test('日付付きファイル名とYAMLで安全なリンク',()=>{const result=makeNote(input);assert.equal(result.filename,'261006_記事_ テスト_入門.md');assert.equal(result.markdown,'---\nsource: "https://example.com/article"\ntitle: "記事: テスト/入門"\ndate: 2026-10-06\n---\n\n## 概要\n要点です。\n');});
test('記事の日付を必須とし、不正な日付を拒否',()=>{for(const date of ['','2026-02-30','2026-13-01'])assert.throws(()=>makeNote({...input,date}));});
test('リンクと要約を検証',()=>{assert.throws(()=>makeNote({...input,url:'javascript:alert(1)'}));assert.throws(()=>makeNote({...input,summary:''}));});
test('Vault外を指すパスを拒否',()=>{assert.deepEqual(folderParts('Clippings/Inoreader'),['Clippings','Inoreader']);for(const folder of ['../outside','a/../b','C:\\folder'])assert.throws(()=>folderParts(folder));});
