// Các phần tử DOM
const colorPicker = document.getElementById('highlight-color');
const opacitySlider = document.getElementById('highlight-opacity');
const opacityValue = document.getElementById('opacity-value');
const saveButton = document.getElementById('save-button');
const highlightNowButton = document.getElementById('highlight-now');
const statusMessage = document.getElementById('status-message');
const previewText = document.getElementById('preview-text');

// Cập nhật giá trị hiển thị cho slider opacity
opacitySlider.addEventListener('input', () => {
  opacityValue.textContent = opacitySlider.value;
  updatePreview();
});

// Cập nhật preview khi thay đổi màu
colorPicker.addEventListener('input', updatePreview);

// Hiển thị thiết lập hiện tại khi mở popup
function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
    if (settings) {
      colorPicker.value = settings.highlightColor || '#FFFF00';
      opacitySlider.value = settings.highlightOpacity || 0.5;
      opacityValue.textContent = opacitySlider.value;
      updatePreview();
    }
  });
}

// Lưu thiết lập
saveButton.addEventListener('click', () => {
  const settings = {
    highlightColor: colorPicker.value,
    highlightOpacity: opacitySlider.value
  };
  chrome.runtime.sendMessage({ action: 'saveSettings', settings: settings }, (response) => {
    if (response && response.status === 'success') {
      statusMessage.textContent = 'Đã lưu cài đặt!';
      setTimeout(() => { statusMessage.textContent = ''; }, 3000);
    }
  });
});

// Highlight ngay lập tức
highlightNowButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    const isCocoluxPage = currentUrl.includes('cocolux.com');
    if (isCocoluxPage) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'rehighlight', category: 'cocolux' }, (response) => {
        if (response) {
          statusMessage.textContent = 'Đã highlight các sản phẩm!';
          setTimeout(() => { statusMessage.textContent = ''; }, 3000);
        }
      });
    } else {
      statusMessage.textContent = 'Không phải trang Cocolux!';
      setTimeout(() => { statusMessage.textContent = ''; }, 3000);
    }
  });
});

// Cập nhật hiệu ứng preview
function updatePreview() {
  const hex = colorPicker.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  previewText.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacitySlider.value})`;
  previewText.style.transition = 'background-color 0.3s ease-in-out';
  previewText.style.position = 'relative';
  previewText.style.setProperty('--preview-color', colorPicker.value);
  previewText.style.setProperty('--preview-opacity', opacitySlider.value);
  const styleSheet = document.styleSheets[0];
  let beforeRuleIndex = -1;
  for (let i = 0; i < styleSheet.cssRules.length; i++) {
    if (styleSheet.cssRules[i].selectorText === '#preview-text::before') {
      beforeRuleIndex = i;
      break;
    }
  }
  if (beforeRuleIndex !== -1) {
    styleSheet.deleteRule(beforeRuleIndex);
  }
  const beforeRule = `#preview-text::before { content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background-color: transparent; border: 2px solid var(--preview-color); opacity: var(--preview-opacity); border-radius: 4px; pointer-events: none; }`;
  styleSheet.insertRule(beforeRule, styleSheet.cssRules.length);
}

// Khởi tạo khi mở popup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});