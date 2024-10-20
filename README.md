Nếu bạn không muốn tải cả Android Studio, bạn có thể cài đặt Android SDK riêng biệt mà không cần cài đặt Android Studio. Dưới đây là hướng dẫn chi tiết:

### Bước 1: Tải Android SDK Command-line Tools

1. Truy cập [trang tải về Android Studio](https://developer.android.com/studio#downloads).
2. Kéo xuống phần **Command line tools only**.
3. Chọn phiên bản dành cho **Windows** và tải file zip về.

### Bước 2: Giải nén và thiết lập SDK

1. Giải nén file zip đã tải về vào một thư mục trên máy tính của bạn, ví dụ: `C:\Android\cmdline-tools`.
2. Đảm bảo cấu trúc thư mục sau khi giải nén trông như sau:
   ```
   C:\Android\cmdline-tools\bin
   ```

### Bước 3: Thiết lập biến môi trường

1. **Thiết lập ANDROID_HOME:**

   - Nhấp chuột phải vào **This PC** hoặc **My Computer** trên màn hình Desktop và chọn **Properties**.
   - Chọn **Advanced system settings** ở phía bên trái.
   - Trong cửa sổ **System Properties**, chọn tab **Advanced** và nhấp vào nút **Environment Variables**.
   - Trong phần **System variables**, nhấp vào **New** và thêm biến mới với:
     - **Variable name**: `ANDROID_HOME`
     - **Variable value**: `C:\Android\cmdline-tools`

2. **Thiết lập PATH:**
   - Trong cửa sổ **Environment Variables**, tìm biến **Path** trong phần **System variables**, sau đó nhấp **Edit**.
   - Thêm đường dẫn `C:\Android\cmdline-tools\bin` vào danh sách.

### Bước 4: Cài đặt các thành phần SDK

1. Mở Command Prompt và điều hướng đến thư mục `cmdline-tools/bin`:
   ```sh
   cd C:\Android\cmdline-tools\bin
   ```
2. Chạy lệnh sau để khởi chạy SDK Manager:
   ```sh
   sdkmanager --sdk_root=C:\Android --install "platform-tools" "platforms;android-30"
   ```
   - `platform-tools` bao gồm ADB và các công cụ khác.
   - `platforms;android-30` là phiên bản Android bạn muốn hỗ trợ (có thể thay đổi phiên bản theo nhu cầu).

### Kiểm tra cài đặt

Sau khi cài đặt xong, bạn có thể kiểm tra xem ADB đã được cài đặt và thiết lập đúng chưa bằng cách mở Command Prompt và chạy lệnh:

```sh
adb devices
```

Nếu danh sách thiết bị được hiển thị mà không có lỗi, bạn đã cấu hình thành công.

## Fix bug gologin

```
   async emptyProfileFolder() {
       debug('get emptyProfileFolder');
       const currentDir = dirname(new URL(import.meta.url).pathname);
       const zeroProfilePath = join(currentDir, '..', 'zero_profile.zip').slice(1);
       const profile = await readFile(zeroProfilePath);
       debug('emptyProfileFolder LENGTH ::', profile.length);
       return profile;
   }
```
