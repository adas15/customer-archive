import { exportGroupZip, exportAllZip } from './exportZip.js';
import { exportGroupExcel, exportAllExcel } from './exportExcel.js';
import { exportGroupWord, exportAllWord } from './exportWord.js';
import { exportGroupPdf, exportAllPdf } from './exportPdf.js';

// 统一导出入口：format ∈ zip|excel|word|pdf, scope ∈ current|all
export async function runExport(format, scope, chatId) {
  const map = {
    zip: [exportGroupZip, exportAllZip],
    excel: [exportGroupExcel, exportAllExcel],
    word: [exportGroupWord, exportAllWord],
    pdf: [exportGroupPdf, exportAllPdf],
  };
  const [group, all] = map[format];
  if (scope === 'all') return all();
  return group(chatId);
}
