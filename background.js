// Khởi tạo giá trị mặc định cho cấu hình
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(
    ['highlightColor', 'highlightOpacity', 'highlightDuration', 'selectedCategory'],
    (result) => {
      // Chỉ đặt những giá trị chưa tồn tại
      const defaultSettings = {};
      
      if (!result.highlightColor) defaultSettings.highlightColor = '#FFFF00';
      if (!result.highlightOpacity) defaultSettings.highlightOpacity = '0.5';
      if (!result.highlightDuration) defaultSettings.highlightDuration = '1500';
      if (!result.selectedCategory) defaultSettings.selectedCategory = 'all';
      
      // Lưu các giá trị mặc định nếu có
      if (Object.keys(defaultSettings).length > 0) {
        chrome.storage.sync.set(defaultSettings);
      }
    }
  );
});

// Lắng nghe thông điệp từ popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Lấy cài đặt hiện tại
  if (message.action === 'getSettings') {
    chrome.storage.sync.get(
      ['highlightColor', 'highlightOpacity', 'highlightDuration', 'selectedCategory'],
      (result) => {
        sendResponse(result);
      }
    );
    return true; // Cho phép sendResponse bất đồng bộ
  }
  
  // Lưu cài đặt mới
  if (message.action === 'saveSettings') {
    chrome.storage.sync.set(message.settings, () => {
      // Thông báo cho tất cả các tab đang mở của EWG về thay đổi cấu hình
      chrome.tabs.query({ url: 'https://www.ewg.org/skindeep/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateConfig',
            config: message.settings
          });
        });
      });
      
      sendResponse({ status: 'success' });
    });
    return true; // Cho phép sendResponse bất đồng bộ
  }
});

// Lắng nghe sự kiện khi tab được kích hoạt
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    // Kiểm tra xem tab đang hoạt động có phải trang EWG không
    if (tab.url && tab.url.includes('https://www.ewg.org/skindeep')) {
      // Lấy danh mục đã chọn từ storage
      chrome.storage.sync.get(['selectedCategory'], (result) => {
        // Gửi thông điệp đến content script để cập nhật danh mục đã chọn
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateConfig',
          config: { category: result.selectedCategory || 'all' }
        });
      });
    }
  });
});