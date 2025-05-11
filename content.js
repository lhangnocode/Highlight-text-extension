// Cấu hình highlight
let highlightConfig = {
  color: '#FFFF00', // Màu vàng mặc định
  opacity: '0.5',   // Độ mờ mặc định
  duration: '1500'  // Thời gian hiệu ứng (ms)
};

// Lấy cấu hình từ storage nếu có
chrome.storage.sync.get(['highlightColor', 'highlightOpacity', 'highlightDuration'], (result) => {
  if (result.highlightColor) highlightConfig.color = result.highlightColor;
  if (result.highlightOpacity) highlightConfig.opacity = result.highlightOpacity;
  if (result.highlightDuration) highlightConfig.duration = result.highlightDuration;
});

// Danh sách các selector cho tiêu đề cần highlight
const titleSelectors = [
  '.product-tile h2',              // Tiêu đề sản phẩm
  '.product-tile .product-name',   // Tên sản phẩm
  '.product-score-container h3'    // Điểm đánh giá
];

/**
 * Hàm highlight một phần tử
 * @param {HTMLElement} element - Phần tử cần highlight
 */
function highlightElement(element) {
  // Thêm class để áp dụng hiệu ứng CSS
  element.classList.add('ewg-highlighted');
  
  // Thiết lập biến CSS tùy chỉnh cho phần tử này
  element.style.setProperty('--highlight-color', highlightConfig.color);
  element.style.setProperty('--highlight-opacity', highlightConfig.opacity);
  
  // Xóa highlight sau khoảng thời gian định sẵn
  setTimeout(() => {
    element.classList.remove('ewg-highlighted');
  }, parseInt(highlightConfig.duration));
}

/**
 * Highlight tất cả các tiêu đề hiện tại trên trang
 */
function highlightCurrentTitles() {
  titleSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      highlightElement(element);
    });
  });
}

/**
 * Thiết lập Intersection Observer để theo dõi các tiêu đề mới
 */
function setupIntersectionObserver() {
  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px',
    threshold: 0.3 // Kích hoạt khi 30% phần tử hiển thị
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Chỉ highlight khi phần tử mới xuất hiện trong viewport
      if (entry.isIntersecting) {
        highlightElement(entry.target);
      }
    });
  }, observerOptions);
  
  // Thêm tất cả các tiêu đề vào observer
  titleSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });
  });
  
  return observer;
}

/**
 * Xử lý khi trang web thêm nội dung mới (lazy loading)
 */
function handleDynamicContent() {
  // Tạo một MutationObserver để theo dõi thay đổi trong DOM
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Tìm các tiêu đề mới được thêm vào
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Kiểm tra nếu node là element
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Kiểm tra nếu node là tiêu đề cần highlight
            titleSelectors.forEach(selector => {
              if (node.matches(selector)) {
                highlightElement(node);
              }
              
              // Kiểm tra con của node
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
  
  // Thiết lập MutationObserver để quan sát toàn bộ document
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return mutationObserver;
}

// Biến toàn cục để lưu các observers
let intersectionObserver;
let mutationObserver;

// Hàm khởi tạo chính
function initialize() {
  console.log('EWG Highlighter extension đã được kích hoạt');
  
  // Highlight các tiêu đề hiện tại
  highlightCurrentTitles();
  
  // Thiết lập theo dõi các tiêu đề mới
  intersectionObserver = setupIntersectionObserver();
  
  // Theo dõi thay đổi nội dung (lazy loading)
  mutationObserver = handleDynamicContent();
  
  // Lắng nghe thông điệp từ popup hoặc background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateConfig') {
      highlightConfig = {...highlightConfig, ...message.config};
      sendResponse({status: 'Config updated'});
    } else if (message.action === 'rehighlight') {
      highlightCurrentTitles();
      sendResponse({status: 'Rehighlighted'});
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