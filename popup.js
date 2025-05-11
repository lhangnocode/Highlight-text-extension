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
      
      // Cập nhật hiển thị giá trị
      opacityValue.textContent = opacitySlider.value;
      
      // Cập nhật preview
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
  
  chrome.runtime.sendMessage({ 
    action: 'saveSettings',
    settings: settings
  }, (response) => {
    if (response && response.status === 'success') {
      statusMessage.textContent = 'Đã lưu cài đặt!';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    }
  });
});

// Highlight ngay lập tức
highlightNowButton.addEventListener('click', () => {
  // Kiểm tra tab hiện tại có phải là trang EWG không
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].url.includes('https://www.ewg.org/skindeep/browse/category/Lip_balm')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'rehighlight' }, (response) => {
        if (response) {
          statusMessage.textContent = 'Đã highlight các tiêu đề!';
          setTimeout(() => {
            statusMessage.textContent = '';
          }, 3000);
        }
      });
    } else {
      statusMessage.textContent = 'Không phải trang EWG Lip Balm!';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    }
  });
});

// Cập nhật hiệu ứng preview
function updatePreview() {
  // Chuyển đổi hex sang rgb
  const hex = colorPicker.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Áp dụng highlight tĩnh cho preview
  previewText.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacitySlider.value})`;
  previewText.style.transition = 'background-color 0.3s ease-in-out';
  
  // Thêm viền
  previewText.style.position = 'relative';
  previewText.style.setProperty('--preview-color', colorPicker.value);
  previewText.style.setProperty('--preview-opacity', opacitySlider.value);
  
  // Thêm hoặc cập nhật pseudo-element
  for (let i = 0; i < styleSheet.cssRules.length; i++) {
    if (styleSheet.cssRules[i].selectorText === '#preview-text::before') {
      styleSheet.deleteRule(i);
      break;
    }
  }
  
  const beforeRule = `#preview-text::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background-color: transparent;
    border: 2px solid var(--preview-color);
    opacity: var(--preview-opacity);
    border-radius: 4px;
    pointer-events: none;
  }`;
  
  styleSheet.insertRule(beforeRule, styleSheet.cssRules.length);
}

// Khởi tạo khi mở popup
document.addEventListener('DOMContentLoaded', loadSettings);