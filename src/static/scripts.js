// File2PromptConverter/src/static/scripts.js

// DOM Elements
const elements = {
  fileInput: document.getElementById('fileInput'),
  dropArea: document.getElementById('dropArea'),
  selectedFilesList: document.getElementById('selected-files-list'),
  uploadBtn: document.getElementById('uploadBtn'),
  resetBtn: document.getElementById('resetBtn'),
  resultContainer: document.getElementById('result-container'),
  resultText: document.getElementById('resultText'),
  toast: document.getElementById('toast'),
  historyList: document.getElementById('history-list'),
  deleteAllBtn: document.getElementById('deleteAllBtn'),
  confirmDialog: document.getElementById('confirmDialog')
};

// 選択されたファイルを保持するSet
const selectedFiles = new Set();

// ファイル入力トリガー
function triggerFileInput() {
  elements.fileInput.click();
}

// ファイルの追加処理
function addFiles(files) {
  for (const file of files) {
      selectedFiles.add(file);
  }
  updateFilesList();
  updateButtonStates();
  updateDropZoneState();
}

// ファイルの削除処理
function removeFile(fileName) {
  for (const file of selectedFiles) {
      if (file.name === fileName) {
          selectedFiles.delete(file);
          break;
      }
  }
  updateFilesList();
  updateButtonStates();
  updateDropZoneState();
}

// ドロップゾーンの状態更新
function updateDropZoneState() {
  const hasFiles = selectedFiles.size > 0;
  const dropZone = elements.dropArea;

  // 既存のメッセージ要素を取得
  let messageElem = dropZone.querySelector('.drop-zone-message');

  // メッセージ要素が存在しない場合は作成
  if (!messageElem) {
      messageElem = document.createElement('div');
      messageElem.className = 'drop-zone-message';
      dropZone.insertBefore(messageElem, elements.selectedFilesList);
  }

  // メッセージ内容の更新
  messageElem.innerHTML = `
      ${!hasFiles ? '<p>ドラッグ＆ドロップでファイルを追加</p>' : ''}
      <button type="button" onclick="triggerFileInput()" class="select-files-btn">ファイルを選択</button>
  `;

  // ファイルが存在する場合のスタイル適用
  if (hasFiles) {
      messageElem.classList.add('with-files');
  } else {
      messageElem.classList.remove('with-files');
  }
}

// ファイルリストの更新
function updateFilesList() {
  elements.selectedFilesList.innerHTML = '';

  for (const file of selectedFiles) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
          <span class="file-name" title="${file.name}">${file.name}</span>
          <button class="remove-file" onclick="removeFile('${file.name}')" title="Remove file">&times;</button>
      `;
      elements.selectedFilesList.appendChild(fileItem);
  }
}

// ボタンの状態更新
function updateButtonStates() {
  const hasFiles = selectedFiles.size > 0;
  const hasResult = elements.resultContainer.style.display !== 'none';

  elements.uploadBtn.disabled = !hasFiles;
  elements.resetBtn.disabled = (!hasFiles && !hasResult);
}

// ファイルの全削除
function resetFiles() {
  selectedFiles.clear();
  elements.fileInput.value = '';
  updateFilesList();
  updateButtonStates();
  elements.resultContainer.style.display = 'none';
  updateDropZoneState();
}

// ファイルアップロード処理
async function handleUpload() {
  const formData = new FormData();
  for (const file of selectedFiles) {
      formData.append('files', file);
  }

  try {
      const response = await fetch('/upload', {
          method: 'POST',
          body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultText = await response.text();
      elements.resultText.value = resultText;
      elements.resultContainer.style.display = 'flex';
  } catch (error) {
      console.error('Error:', error);
      showToast('Error uploading files: ' + error.message, 'error');
  }
}

// ドラッグ&ドロップイベントハンドラ
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  elements.dropArea.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const rect = elements.dropArea.getBoundingClientRect();
  const isLeaving =
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom;

  if (isLeaving) {
      elements.dropArea.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  elements.dropArea.classList.remove('drag-over');

  const dt = e.dataTransfer;
  const files = dt.files;

  addFiles(files);
}

// 履歴の読み込みと表示
async function loadHistory() {
  try {
      const response = await fetch('/history');
      if (!response.ok) throw new Error('Failed to load history');

      const history = await response.json();
      displayHistory(history);
  } catch (error) {
      console.error('Error loading history:', error);
      showToast('Failed to load history', 'error');
  }
}

// 履歴の表示を更新
function displayHistory(history) {
  elements.historyList.innerHTML = '';

  history.forEach(item => {
      const historyItem = createHistoryItem(item);
      elements.historyList.appendChild(historyItem);
  });
}

// 履歴アイテムの作成
function createHistoryItem(item) {
  const div = document.createElement('div');
  div.className = 'history-item';

  const timestamp = new Date(item.timestamp).toLocaleString();
  const fileNames = item.original_files.join(', ');

  div.innerHTML = `
      <div class="timestamp">${timestamp}</div>
      <div class="files">Files: ${fileNames}</div>
      <div class="file-count">Total files: ${item.file_count}</div>
      <div class="actions">
          <button onclick="loadHistoryItem('${item.id}')" class="load-btn">Load</button>
          <button onclick="deleteHistoryItem('${item.id}')" class="delete-btn">Delete</button>
      </div>
  `;

  return div;
}

// 特定の履歴アイテムを読み込む
async function loadHistoryItem(id) {
  try {
      const response = await fetch(`/data/${id}`);
      if (!response.ok) throw new Error('Failed to load data');

      const data = await response.json();
      elements.resultText.value = data.content;
      elements.resultContainer.style.display = 'flex';
      showToast('Data loaded successfully');
  } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
  }
}

// 履歴アイテムの削除
async function deleteHistoryItem(id) {
  try {
      const response = await fetch(`/data/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete data');

      await loadHistory();
      showToast('Data deleted successfully');
  } catch (error) {
      console.error('Error deleting data:', error);
      showToast('Failed to delete data', 'error');
  }
}

// コンテンツの保存
async function saveContent() {
  if (!selectedFiles.size) {
      showToast('No files to save', 'error');
      return;
  }

  const formData = new FormData();
  for (const file of selectedFiles) {
      formData.append('files', file);
  }

  try {
      const response = await fetch('/save', {
          method: 'POST',
          body: formData
      });

      if (!response.ok) throw new Error('Failed to save data');

      await loadHistory();
      showToast('Data saved successfully');
  } catch (error) {
      console.error('Error saving data:', error);
      showToast('Failed to save data', 'error');
  }
}

// 確認ダイアログを表示
function showDeleteAllDialog() {
  elements.confirmDialog.style.display = 'flex';
}

// 全履歴削除の確認
async function confirmDeleteAll() {
  try {
      const response = await fetch('/data', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete all data');

      await loadHistory();
      closeDialog();
      showToast('All data deleted successfully');
  } catch (error) {
      console.error('Error deleting all data:', error);
      showToast('Failed to delete all data', 'error');
  }
}

// ダイアログを閉じる
function closeDialog() {
  elements.confirmDialog.style.display = 'none';
}

// テキストのコピー
function copyToClipboard() {
  try {
      const copyButton = document.querySelector('.result-actions button:first-child');
      const originalText = copyButton.textContent;

      elements.resultText.select();
      document.execCommand('copy');
      window.getSelection().removeAllRanges();

      // ボタンの状態を変更（幅は変化しない）
      copyButton.textContent = 'Copied!';
      copyButton.classList.add('copy-success');

      setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove('copy-success');
      }, 1500);
  } catch (err) {
      console.error('Failed to copy text:', err);
  }
}

// トースト表示
function showToast(message, type = 'success', duration = 3000) {
  elements.toast.textContent = message;
  elements.toast.style.backgroundColor = type === 'error' ? '#d32f2f' : '#333';
  elements.toast.style.display = 'block';

  setTimeout(() => {
      elements.toast.classList.add('show');
  }, 50);

  setTimeout(() => {
      elements.toast.classList.remove('show');
      setTimeout(() => {
          elements.toast.style.display = 'none';
      }, 300);
  }, duration);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // ドロップゾーンイベント
  elements.dropArea.addEventListener('dragover', handleDragOver);
  elements.dropArea.addEventListener('dragleave', handleDragLeave);
  elements.dropArea.addEventListener('drop', handleDrop);

  // ファイル選択イベント
  elements.fileInput.addEventListener('change', (e) => {
      addFiles(e.target.files);
  });

  // 履歴関連
  elements.deleteAllBtn.addEventListener('click', showDeleteAllDialog);

  // コピーボタンの初期幅を設定
  const copyButton = document.querySelector('.result-actions button:first-child');
  if (copyButton) {
      const initialWidth = copyButton.offsetWidth;
      copyButton.style.width = `${initialWidth}px`;
  }

  // 初期表示
  updateDropZoneState();
  loadHistory();
});
