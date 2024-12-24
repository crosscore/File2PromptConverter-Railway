// File2PromptConverter/src/static/scripts.js

// ButtonFeedback クラスの定義
class ButtonFeedback {
  constructor(button) {
      this.button = button;
      this.originalText = button.textContent;
      this.originalColor = button.style.backgroundColor;
      this.isAnimating = false;
  }

  async showFeedback(message, type = 'success') {
      if (this.isAnimating) return;
      this.isAnimating = true;

      // 元の状態を保存
      const originalWidth = this.button.offsetWidth;
      this.button.style.width = `${originalWidth}px`;

      // ボタンの状態を変更
      this.button.textContent = message;
      this.button.classList.add('button-feedback');

      // タイプに応じたスタイルを適用
      if (type === 'success') {
          this.button.classList.add('feedback-success');
      } else if (type === 'error') {
          this.button.classList.add('feedback-error');
      }

      // ボタンを一時的に無効化
      this.button.disabled = true;

      // 1.5秒後に元の状態に戻す
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.resetState();
  }

  resetState() {
      this.button.textContent = this.originalText;
      this.button.classList.remove('button-feedback', 'feedback-success', 'feedback-error');
      this.button.disabled = false;
      this.isAnimating = false;
  }
}

// DOM Elements
const elements = {
  fileInput: document.getElementById('fileInput'),
  dropArea: document.getElementById('dropArea'),
  selectedFilesList: document.getElementById('selected-files-list'),
  uploadBtn: document.getElementById('uploadBtn'),
  resetBtn: document.getElementById('resetBtn'),
  resultContainer: document.getElementById('result-container'),
  resultText: document.getElementById('resultText'),
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

  let messageElem = dropZone.querySelector('.drop-zone-message');
  if (!messageElem) {
      messageElem = document.createElement('div');
      messageElem.className = 'drop-zone-message';
      dropZone.insertBefore(messageElem, elements.selectedFilesList);
  }

  messageElem.innerHTML = `
      ${!hasFiles ? '<p>ドラッグ＆ドロップでファイルを追加</p>' : ''}
      <button type="button" onclick="triggerFileInput()" class="select-files-btn">ファイルを選択</button>
  `;

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
  const uploadButton = elements.uploadBtn;
  const feedback = new ButtonFeedback(uploadButton);

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
      await feedback.showFeedback('Success!', 'success');
  } catch (error) {
      console.error('Error:', error);
      await feedback.showFeedback('Failed!', 'error');
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
      const feedback = new ButtonFeedback(elements.deleteAllBtn);
      await feedback.showFeedback('Load Failed!', 'error');
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
  const fileLinks = item.original_files.map(filename =>
      `<a href="#" class="file-link" data-id="${item.id}" data-filename="${filename}">${filename}</a>`
  ).join(' ');

  div.innerHTML = `
      <div class="timestamp">${timestamp}</div>
      <div class="files">${fileLinks}</div>
      <div class="file-count">Total files: ${item.file_count}</div>
      <div class="actions">
          <button onclick="loadHistoryItem('${item.id}')" class="load-btn">Load</button>
          <button onclick="deleteHistoryItem('${item.id}')" class="delete-btn">Delete</button>
      </div>
  `;

  // ファイルリンクのクリックイベントを追加
  div.querySelectorAll('.file-link').forEach(link => {
      link.addEventListener('click', async (e) => {
          e.preventDefault();
          await downloadFile(e.target.dataset.id, e.target.dataset.filename);
      });
  });

  return div;
}

// ファイルのダウンロード処理
async function downloadFile(dataId, filename) {
  try {
      const response = await fetch(`/download/${dataId}/${filename}`);
      if (!response.ok) throw new Error('Download failed');

      // レスポンスをBlobとして取得
      const blob = await response.blob();

      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // クリーンアップ
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
  }
}

// 特定の履歴アイテムを読み込む
async function loadHistoryItem(id) {
  const loadButton = event.target;
  const feedback = new ButtonFeedback(loadButton);

  try {
      const response = await fetch(`/data/${id}`);
      if (!response.ok) throw new Error('Failed to load data');

      const data = await response.json();
      elements.resultText.value = data.content;
      elements.resultContainer.style.display = 'flex';
      await feedback.showFeedback('Loaded!', 'success');
  } catch (error) {
      console.error('Error loading data:', error);
      await feedback.showFeedback('Failed!', 'error');
  }
}

// 履歴アイテムの削除
async function deleteHistoryItem(id) {
  const deleteButton = event.target;
  const feedback = new ButtonFeedback(deleteButton);

  try {
      const response = await fetch(`/data/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete data');

      await loadHistory();
      await feedback.showFeedback('Deleted!', 'success');
  } catch (error) {
      console.error('Error deleting data:', error);
      await feedback.showFeedback('Failed!', 'error');
  }
}

// コンテンツの保存
async function saveContent() {
  if (!selectedFiles.size) {
      const saveButton = document.querySelector('.save-button');
      const feedback = new ButtonFeedback(saveButton);
      await feedback.showFeedback('No files!', 'error');
      return;
  }

  const formData = new FormData();
  for (const file of selectedFiles) {
      formData.append('files', file);
  }

  const saveButton = document.querySelector('.save-button');
  const feedback = new ButtonFeedback(saveButton);

  try {
      const response = await fetch('/save', {
          method: 'POST',
          body: formData
      });

      if (!response.ok) throw new Error('Failed to save data');

      await loadHistory();
      await feedback.showFeedback('Saved!', 'success');
  } catch (error) {
      console.error('Error saving data:', error);
      await feedback.showFeedback('Failed!', 'error');
  }
}

// 確認ダイアログを表示
function showDeleteAllDialog() {
  elements.confirmDialog.style.display = 'flex';
}

// 全履歴削除の確認
async function confirmDeleteAll() {
  const deleteAllButton = elements.deleteAllBtn;
  const feedback = new ButtonFeedback(deleteAllButton);

  try {
      const response = await fetch('/data', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete all data');

      await loadHistory();
      closeDialog();
      await feedback.showFeedback('All Deleted!', 'success');
  } catch (error) {
      console.error('Error deleting all data:', error);
      await feedback.showFeedback('Failed!', 'error');
  }
}

// ダイアログを閉じる
function closeDialog() {
  elements.confirmDialog.style.display = 'none';
}

// テキストのコピー
async function copyToClipboard() {
  const copyButton = document.querySelector('.result-actions button:first-child');
  const feedback = new ButtonFeedback(copyButton);

  try {
      elements.resultText.select();
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      await feedback.showFeedback('Copied!', 'success');
  } catch (err) {
      console.error('Failed to copy text:', err);
      await feedback.showFeedback('Failed!', 'error');
  }
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

  // 初期表示
  updateDropZoneState();
  loadHistory();
});
