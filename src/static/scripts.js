// File2PromptConverter/src/templates/scripts.js

// DOM Elements
const elements = {
  form: document.getElementById('upload-form'),
  fileInput: document.getElementById('fileInput'),
  uploadedFiles: document.getElementById('uploaded-files'),
  resultContainer: document.getElementById('result-container'),
  resultText: document.getElementById('resultText'),
  toast: document.getElementById('toast')
};

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

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resultText = await response.text();
      elements.resultText.value = resultText;
      elements.resultContainer.style.display = 'block';
  } catch (error) {
      console.error('Error:', error);
      alert('Error uploading files: ' + error.message);
  }
}

// Clipboard Handler
async function copyToClipboard() {
  try {
    elements.resultText.select();
    const success = document.execCommand('copy');
    if (!success) {
      throw new Error('copy command failed');
    }
    showToast(); // 成功時にトーストを表示
  } catch (err) {
    console.error('Failed to copy text: ', err);
    elements.toast.style.backgroundColor = '#d32f2f';
    elements.toast.textContent = 'コピーに失敗しました';
    showToast();
    elements.toast.style.backgroundColor = '#333'; // 色を元に戻す
  }
}

// Form Reset Handler
function resetForm() {
  elements.fileInput.value = '';
  elements.uploadedFiles.innerHTML = '';
  elements.resultText.value = '';
  elements.resultContainer.style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  elements.form.addEventListener('submit', handleFileUpload);
  elements.fileInput.addEventListener('change', displayFileNames);
});

// トースト表示用の関数
function showToast(duration = 2400) {
  elements.toast.style.display = 'block';
  // 表示アニメーションのため少し待つ
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
