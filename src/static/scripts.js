// File2PromptConverter/src/templates/scripts.js

// DOM Elements
const elements = {
  form: document.getElementById('upload-form'),
  fileInput: document.getElementById('fileInput'),
  uploadedFiles: document.getElementById('uploaded-files'),
  resultContainer: document.getElementById('result-container'),
  resultText: document.getElementById('resultText'),
  toast: document.getElementById('toast'),
  historyList: document.getElementById('history-list'),
  deleteAllBtn: document.getElementById('deleteAllBtn'),
  confirmDialog: document.getElementById('confirmDialog')
};

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
      elements.resultContainer.style.display = 'block';
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

      await loadHistory(); // 履歴を再読み込み
      showToast('Data deleted successfully');
  } catch (error) {
      console.error('Error deleting data:', error);
      showToast('Failed to delete data', 'error');
  }
}

// 全履歴削除の確認ダイアログを表示
function showDeleteAllDialog() {
  elements.confirmDialog.style.display = 'flex';
}

// 全履歴削除の確認
async function confirmDeleteAll() {
  try {
      const response = await fetch('/data', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete all data');

      await loadHistory(); // 履歴を再読み込み
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

// コンテンツの保存
async function saveContent() {
  if (!elements.resultText.value) {
      showToast('No content to save', 'error');
      return;
  }

  const formData = new FormData();
  for (const file of elements.fileInput.files) {
      formData.append('files', file);
  }

  try {
      const response = await fetch('/save', {
          method: 'POST',
          body: formData
      });

      if (!response.ok) throw new Error('Failed to save data');

      const result = await response.json();
      await loadHistory(); // 履歴を再読み込み
      showToast('Data saved successfully');
  } catch (error) {
      console.error('Error saving data:', error);
      showToast('Failed to save data', 'error');
  }
}

// File Display Handler
function displayFileNames() {
  elements.uploadedFiles.innerHTML = '';

  if (elements.fileInput.files.length > 0) {
      const fileNames = Array.from(elements.fileInput.files)
          .map(file => file.name)
          .join(', ');
      elements.uploadedFiles.textContent = 'Selected files: ' + fileNames;
  }
}

// File Upload Handler
async function handleFileUpload(event) {
  event.preventDefault();

  const formData = new FormData();
  for (const file of elements.fileInput.files) {
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
      elements.resultContainer.style.display = 'block';
  } catch (error) {
      console.error('Error:', error);
      showToast('Error uploading files: ' + error.message, 'error');
  }
}

// クリップボードにコピー
async function copyToClipboard() {
  try {
      await navigator.clipboard.writeText(elements.resultText.value);
      showToast('Copied to clipboard');
  } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy text', 'error');
  }
}

// フォームのリセット
function resetForm() {
  elements.fileInput.value = '';
  elements.uploadedFiles.innerHTML = '';
  elements.resultText.value = '';
  elements.resultContainer.style.display = 'none';
}

// トースト表示
function showToast(message, type = 'success', duration = 2400) {
  elements.toast.textContent = message;
  elements.toast.style.backgroundColor = type === 'error' ? '#d32f2f' : '#333';
  elements.toast.style.display = 'block';

  setTimeout(() => {
      elements.toast.classList.add('show');
  }, 10);

  setTimeout(() => {
      elements.toast.classList.remove('show');
      setTimeout(() => {
          elements.toast.style.display = 'none';
      }, 300);
  }, duration);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  elements.form.addEventListener('submit', handleFileUpload);
  elements.fileInput.addEventListener('change', displayFileNames);
  elements.deleteAllBtn.addEventListener('click', showDeleteAllDialog);
  loadHistory(); // 初期読み込み
});
