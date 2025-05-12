// Cấu hình highlight
let highlightConfig = {
  color: '#FFFF00', // Màu vàng mặc định
  opacity: '0.5',   // Độ mờ mặc định
  duration: '1500', // Thời gian hiệu ứng (ms)
  category: 'cocolux' // Danh mục cố định cho cocolux
};

// Khai báo các cấu trúc selector cho cocolux
const categorySelectors = {
  cocolux: {
    productTitle: [
      'h1.detail-title', // Tiêu đề sản phẩm chi tiết
      '.product-title', // Tiêu đề sản phẩm ở danh sách (nếu có)
      '.product-item__title' // Tiêu đề sản phẩm ở danh sách (nếu có)
    ],
    productItem: '.product-item',
    productScore: '' // Cocolux không có điểm số
  }
};

// Hàm để xác định trang hiện tại (cố định là cocolux)
function getCurrentCategory() {
  return 'cocolux';
}

// Lấy cấu hình từ storage nếu có
function loadConfig() {
  chrome.storage.sync.get(['highlightColor', 'highlightOpacity', 'highlightDuration'], (result) => {
    if (result.highlightColor) highlightConfig.color = result.highlightColor;
    if (result.highlightOpacity) highlightConfig.opacity = result.highlightOpacity;
    if (result.highlightDuration) highlightConfig.duration = result.highlightDuration;
    // Áp dụng highlight sau khi có cấu hình
    applyHighlightToCurrentPage();
  });
}

// Hàm highlight một phần tử
function highlightElement(element) {
  element.classList.add('ewg-highlighted');
  element.style.setProperty('--highlight-color', highlightConfig.color);
  element.style.setProperty('--highlight-opacity', highlightConfig.opacity);
}

// Kiểm tra xem phần tử có nên được highlight không (luôn trả về true cho cocolux)
function shouldHighlightElement(element) {
  return true;
}

// Highlight tất cả các tiêu đề hiện tại trên trang
function highlightCurrentTitles() {
  const selectors = categorySelectors.cocolux.productTitle;
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      highlightElement(element);
    });
  });
}

// Áp dụng highlight cho trang hiện tại
function applyHighlightToCurrentPage() {
  document.querySelectorAll('.ewg-highlighted').forEach(el => { el.classList.remove('ewg-highlighted'); });
  highlightCurrentTitles();
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
  intersectionObserver = setupIntersectionObserver();
}

// Thiết lập Intersection Observer để theo dõi các tiêu đề trong và ngoài viewport
function setupIntersectionObserver() {
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.3 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        highlightElement(entry.target);
      } else {
        entry.target.classList.remove('ewg-highlighted');
      }
    });
  }, observerOptions);
  const selectors = categorySelectors.cocolux.productTitle;
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => { observer.observe(element); });
  });
  return observer;
}

// Xử lý khi trang web thêm nội dung mới (lazy loading)
function handleDynamicContent() {
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const selectors = categorySelectors.cocolux.productTitle;
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            selectors.forEach(selector => {
              if (node.matches(selector)) {
                highlightElement(node);
              }
              node.querySelectorAll(selector).forEach(element => {
                highlightElement(element);
                intersectionObserver.observe(element);
              });
            });
          }
        });
      }
    });
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
  return mutationObserver;
}

// Biến toàn cục để lưu các observers
let intersectionObserver;
let mutationObserver;

// Hàm khởi tạo chính
function initialize() {
  console.log('Cocolux Highlighter extension đã được kích hoạt');
  const style = document.createElement('style');
  style.textContent = `
    .ewg-highlighted {
      background-color: var(--highlight-color, #FFFF00) !important;
      opacity: var(--highlight-opacity, 0.5) !important;
      transition: background-color 0.3s ease-in-out !important;
      position: relative !important;
      z-index: 1 !important;
    }
  `;
  document.head.appendChild(style);
  loadConfig();
  mutationObserver = handleDynamicContent();
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateConfig') {
      highlightConfig = { ...highlightConfig, ...message.config };
      applyHighlightToCurrentPage();
      sendResponse({ status: 'Config updated' });
    } else if (message.action === 'rehighlight') {
      applyHighlightToCurrentPage();
      sendResponse({ status: 'Rehighlighted' });
    }
    return true;
  });
}

// Đợi trang tải xong rồi khởi tạo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}