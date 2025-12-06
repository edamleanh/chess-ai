# ♟️ Chess vs AI

Game cờ vua với AI Stockfish - chơi trực tiếp trên trình duyệt!

## 🎮 Demo
👉 **[Chơi ngay tại đây](https://your-username.github.io/chess-ai/)**

## 📋 Giới thiệu
Game cờ vua với đối thủ AI Stockfish - một trong những engine cờ vua mạnh nhất thế giới.

## 🎮 Tính năng
- ✅ Chơi cờ vua với AI Stockfish
- ✅ 4 mức độ khó: Dễ, Trung bình, Khó, Rất khó
- ✅ Giao diện đẹp với chessboard.js
- ✅ Theo dõi lịch sử nước đi
- ✅ Hoàn tác nước đi
- ✅ Lật bàn cờ
- ✅ Hiển thị trạng thái game (chiếu, chiếu hết, hòa...)

## 📦 Cài đặt Stockfish

### Cách 1: Tải từ GitHub (Khuyến nghị)

1. **Tải Stockfish.js từ GitHub:**
   - Truy cập: https://github.com/nmrugg/stockfish.js/
   - Tải file `stockfish.js` và `stockfish.wasm` từ thư mục `src` hoặc releases

2. **Hoặc tải trực tiếp:**
   ```
   https://raw.githubusercontent.com/nmrugg/stockfish.js/master/stockfish.js
   https://raw.githubusercontent.com/nmrugg/stockfish.js/master/stockfish.wasm
   ```

3. **Đặt 2 file vào cùng thư mục với index.html:**
   ```
   📁 shinyhunters_vs_vietnam/
   ├── 📄 index.html
   ├── 📄 game.js
   ├── 📄 stockfish.js    ← Tải về đây
   └── 📄 stockfish.wasm  ← Tải về đây
   ```

### Cách 2: Sử dụng CDN (Có thể không hoạt động do CORS)

Thay thế dòng `<script src="stockfish.js"></script>` trong `index.html` bằng:
```html
<script src="https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js"></script>
```

**Lưu ý:** CDN có thể gặp lỗi CORS với file WASM, nên khuyến nghị dùng Cách 1.

### Cách 3: Download bằng PowerShell

```powershell
# Chuyển đến thư mục dự án
cd C:\Users\edaml\Downloads\shinyhunters_vs_vietnam

# Tải stockfish.js
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nmrugg/stockfish.js/master/stockfish.js" -OutFile "stockfish.js"

# Tải stockfish.wasm
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nmrugg/stockfish.js/master/stockfish.wasm" -OutFile "stockfish.wasm"
```

## 🚀 Cách chạy

### Option 1: Live Server (VS Code)
1. Cài đặt extension "Live Server" trong VS Code
2. Click chuột phải vào `index.html` → "Open with Live Server"
3. Trò chơi sẽ mở tại `http://127.0.0.1:5500`

### Option 2: Python HTTP Server
```powershell
# Python 3
python -m http.server 8000

# Truy cập: http://localhost:8000
```

### Option 3: Mở trực tiếp file
- Chỉ hoạt động nếu đã tải stockfish.js và stockfish.wasm về máy
- Không hoạt động với CDN do chính sách CORS

## 🎯 Hướng dẫn chơi

1. **Bắt đầu game:** 
   - Bạn chơi quân Trắng, đi trước
   - Kéo thả quân cờ để di chuyển

2. **Độ khó:**
   - **Dễ (Depth 5):** Phù hợp người mới
   - **Trung bình (Depth 10):** Cân bằng
   - **Khó (Depth 15):** Thử thách
   - **Rất khó (Depth 20):** Chuyên gia

3. **Các nút điều khiển:**
   - 🔄 **Ván mới:** Bắt đầu ván cờ mới
   - ↶ **Hoàn tác:** Hoàn tác 2 nước đi (của bạn và máy)
   - 🔃 **Lật bàn cờ:** Thay đổi góc nhìn

## 🔧 Cấu trúc code

### index.html
- Giao diện HTML5 với CSS3
- Import các thư viện: jQuery, chessboard.js, chess.js
- Layout responsive với gradient background

### game.js
- Logic game với chess.js
- Tích hợp Stockfish engine qua UCI protocol
- Xử lý nước đi, kiểm tra luật cờ, game over
- Communication với Stockfish qua postMessage

### Stockfish Integration
```javascript
// Khởi tạo engine
stockfish = STOCKFISH();

// Gửi vị trí bàn cờ
stockfish.postMessage('position fen ' + fen);

// Yêu cầu tính toán (depth = độ sâu)
stockfish.postMessage('go depth 10');

// Nhận nước đi tốt nhất
stockfish.onmessage = function(event) {
    // Parse "bestmove e2e4"
};
```

## ⚙️ UCI Protocol

Stockfish sử dụng Universal Chess Interface (UCI):

- `uci` - Khởi tạo engine
- `isready` - Kiểm tra sẵn sàng
- `ucinewgame` - Bắt đầu ván mới
- `position fen [FEN_STRING]` - Gửi vị trí bàn cờ
- `go depth [N]` - Tính toán với độ sâu N
- `go movetime [MS]` - Tính toán trong MS milliseconds
- `bestmove [MOVE]` - Engine trả về nước đi tốt nhất

## 🐛 Troubleshooting

### Lỗi: "Không tìm thấy Stockfish"
- **Nguyên nhân:** Chưa tải stockfish.js và stockfish.wasm
- **Giải pháp:** Tải 2 file về theo Cách 1 hoặc Cách 3

### Lỗi: "Failed to fetch WASM"
- **Nguyên nhân:** CORS policy khi dùng CDN hoặc mở file:// trực tiếp
- **Giải pháp:** Sử dụng HTTP server (Live Server hoặc Python HTTP)

### Máy không đi quân
- Kiểm tra Console (F12) xem có lỗi không
- Đảm bảo stockfish.js và stockfish.wasm trong cùng thư mục
- Thử reload lại trang (Ctrl + F5)

### Game bị lag khi máy suy nghĩ
- Giảm độ khó xuống Depth 5 hoặc 10
- Stockfish chạy trên Web Worker nên không làm đơ UI
- Depth càng cao càng mất thời gian (Depth 20 có thể mất 10-30s)

## 📚 Tài liệu tham khảo

- **Chess.js:** https://github.com/jhlywa/chess.js
- **Chessboard.js:** https://chessboardjs.com/
- **Stockfish.js:** https://github.com/nmrugg/stockfish.js
- **UCI Protocol:** https://www.chessprogramming.org/UCI

## 🎨 Customization

### Thay đổi màu sắc giao diện
Sửa trong `<style>` của `index.html`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Thay đổi hình quân cờ
Sửa trong `game.js`:
```javascript
pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
```

### Tùy chỉnh độ khó
Sửa trong `index.html`:
```html
<option value="25">Siêu khó (Depth 25)</option>
```

## 📝 License
Free to use for educational purposes.

---
**Tác giả:** GitHub Copilot  
**Ngày tạo:** 6/12/2025  
**Version:** 1.0
