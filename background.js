// Thiết lập giá trị mặc định khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    highlightColor: '#FFFF00',  // Màu vàng
    highlightOpacity: '0.5'     // Độ mờ 50%
  });
  
  console.log('EWG Highlighter đã được cài đặt với cấu hình mặc định');
});

// Lắng nghe khi tab thay đổi
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Kiểm tra nếu URL khớp với trang mục tiêu và trang đã tải xong
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('https://www.ewg.org/skindeep/browse/category/Lip_balm')) {
    
    // Gửi thông báo đến content script để kích hoạt highlight
    chrome.tabs.sendMessage(tabId, {
      action: 'pageLoaded',
      url: tab.url
    });
  }
});

// Lắng nghe tin nhắn từ popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    // Trả về các cài đặt hiện tại
    chrome.storage.sync.get(['highlightColor', 'highlightOpacity', 'highlightDuration'], (data) => {
      sendResponse(data);
    });
    return true; // Yêu cầu cho sendResponse không đồng bộ
  }
  
  else if (message.action === 'saveSettings') {
    // Lưu cài đặt mới
    chrome.storage.sync.set({
      highlightColor: message.settings.highlightColor,
      highlightOpacity: message.settings.highlightOpacity,
      highlightDuration: message.settings.highlightDuration
    }, () => {
      // Cập nhật cài đặt cho tất cả các tab đang mở
      chrome.tabs.query({url: 'https://www.ewg.org/skindeep/browse/category/Lip_balm*'}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateConfig',
            config: message.settings
          });
        });
      });
      
      sendResponse({status: 'success'});
    });
    return true; // Yêu cầu cho sendResponse không đồng bộ
  }
});