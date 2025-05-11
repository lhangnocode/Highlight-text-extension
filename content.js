// Cấu hình highlight
let highlightConfig = {
  color: '#FFFF00', // Màu vàng mặc định
  opacity: '0.5',   // Độ mờ mặc định
  duration: '1500', // Thời gian hiệu ứng (ms)
  category: 'all'   // Danh mục sản phẩm mặc định (tất cả)
};

// Khai báo các cấu trúc selector theo từng danh mục
const categorySelectors = {
  // Selector mặc định cho tất cả sản phẩm
  all: {
    productTitle: [
      '.product-tile h2',              // Tiêu đề sản phẩm
      '.product-tile .product-name',   // Tên sản phẩm
      '.product-score-container h3'    // Điểm đánh giá
    ],
    productItem: '.product-tile',
    productScore: '.product-score'
  },
  // Selector đặc biệt cho từng danh mục nếu cần
  Lip_balm: {
    productTitle: [
      '.product-tile h2',
      '.product-tile .product-name',
      '.product-score-container h3'
    ],
    productItem: '.product-tile',
    productScore: '.product-score'
  },
  Eye_shadow: {
    productTitle: [
      '.product-tile h2',
      '.product-tile .product-name',
      '.product-score-container h3'
    ],
    productItem: '.product-tile',
    productScore: '.product-score'
  },
  Facial_powder: {
    productTitle: [
      '.product-tile h2',
      '.product-tile .product-name',
      '.product-score-container h3'
    ],
    productItem: '.product-tile',
    productScore: '.product-score'
  }
  // Thêm các danh mục khác khi cần thiết
};

// Hàm để xác định trang hiện tại thuộc danh mục nào
function getCurrentCategory() {
  const url = window.location.href;
  
  // Kiểm tra xem URL có chứa /browse/category/ không
  if (url.includes('/browse/category/')) {
    // Trích xuất tên danh mục từ URL
    const matches = url.match(/\/browse\/category\/([^\/]+)/);
    if (matches && matches[1]) {
      const category = matches[1];
      
      // Kiểm tra xem danh mục có trong danh sách đã định nghĩa không
      if (categorySelectors[category]) {
        return category;
      }
    }
  }
  
  // Mặc định trả về 'all' nếu không tìm thấy danh mục cụ thể
  return 'all';
}

// Lấy cấu hình từ storage nếu có
function loadConfig() {
  chrome.storage.sync.get(
    ['highlightColor', 'highlightOpacity', 'highlightDuration', 'selectedCategory'],
    (result) => {
      if (result.highlightColor) highlightConfig.color = result.highlightColor;
      if (result.highlightOpacity) highlightConfig.opacity = result.highlightOpacity;
      if (result.highlightDuration) highlightConfig.duration = result.highlightDuration;
      if (result.selectedCategory) highlightConfig.category = result.selectedCategory;
      
      // Áp dụng highlight sau khi có cấu hình
      applyHighlightToCurrentPage();
    }
  );
}

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
  
  // Không còn xóa highlight sau một khoảng thời gian
  // Highlight sẽ được duy trì khi phần tử còn trong viewport
}

/**
 * Kiểm tra xem phần tử có nên được highlight không dựa vào danh mục đã chọn
 * @param {HTMLElement} element - Phần tử cần kiểm tra
 * @returns {Boolean} - Có nên highlight không
 */
function shouldHighlightElement(element) {
  // Nếu đã chọn tất cả danh mục, luôn highlight
  if (highlightConfig.category === 'all') {
    return true;
  }
  
  // Lấy danh mục hiện tại từ URL
  const currentCategory = getCurrentCategory();
  
  // Nếu đang ở trang đúng danh mục đã chọn
  return highlightConfig.category === 'all' || highlightConfig.category === currentCategory;
}

/**
 * Highlight tất cả các tiêu đề hiện tại trên trang
 */
function highlightCurrentTitles() {
  // Xác định danh mục hiện tại
  const currentCategory = getCurrentCategory();
  
  // Nếu danh mục đã chọn là 'all' hoặc khớp với danh mục hiện tại
  if (highlightConfig.category === 'all' || highlightConfig.category === currentCategory) {
    const selectors = categorySelectors[currentCategory].productTitle;
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        highlightElement(element);
      });
    });
  }
}

/**
 * Áp dụng highlight cho trang hiện tại dựa trên danh mục
 */
function applyHighlightToCurrentPage() {
  // Xóa tất cả highlight hiện có
  document.querySelectorAll('.ewg-highlighted').forEach(el => {
    el.classList.remove('ewg-highlighted');
  });
  
  // Highlight lại các phần tử
  highlightCurrentTitles();
  
  // Cập nhật IntersectionObserver với các selector mới
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
  intersectionObserver = setupIntersectionObserver();
}

/**
 * Thiết lập Intersection Observer để theo dõi các tiêu đề trong và ngoài viewport
 */
function setupIntersectionObserver() {
  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px',
    threshold: 0.3 // Kích hoạt khi 30% phần tử hiển thị
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Chỉ xử lý nếu phần tử nên được highlight
      if (shouldHighlightElement(entry.target)) {
        // Highlight khi phần tử xuất hiện trong viewport
        if (entry.isIntersecting) {
          highlightElement(entry.target);
        } 
        // Bỏ highlight khi phần tử ra khỏi viewport
        else {
          entry.target.classList.remove('ewg-highlighted');
        }
      }
    });
  }, observerOptions);
  
  // Xác định danh mục hiện tại và thêm các tiêu đề vào observer
  const currentCategory = getCurrentCategory();
  const selectors = categorySelectors[currentCategory].productTitle;
  
  selectors.forEach(selector => {
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
        // Xác định danh mục hiện tại
        const currentCategory = getCurrentCategory();
        const selectors = categorySelectors[currentCategory].productTitle;
        
        mutation.addedNodes.forEach(node => {
          // Kiểm tra nếu node là element
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Kiểm tra nếu node là tiêu đề cần highlight
            selectors.forEach(selector => {
              if (node.matches(selector) && shouldHighlightElement(node)) {
                highlightElement(node);
              }
              
              // Kiểm tra con của node
              node.querySelectorAll(selector).forEach(element => {
                if (shouldHighlightElement(element)) {
                  highlightElement(element);
                  intersectionObserver.observe(element);
                }
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
  
  // Thêm một style cho highlight
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
  
  // Tải cấu hình từ storage
  loadConfig();
  
  // Theo dõi thay đổi nội dung (lazy loading)
  mutationObserver = handleDynamicContent();
  
  // Lắng nghe thông điệp từ popup hoặc background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateConfig') {
      highlightConfig = {...highlightConfig, ...message.config};
      applyHighlightToCurrentPage();
      sendResponse({status: 'Config updated'});
    } else if (message.action === 'rehighlight') {
      // Cập nhật danh mục nếu có
      if (message.category) {
        highlightConfig.category = message.category;
      }
      
      // Áp dụng highlight lại
      applyHighlightToCurrentPage();
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