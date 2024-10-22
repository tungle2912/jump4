async function main() {
  const wdio = await import('webdriverio');
  // Cấu hình Desired Capabilities
  const options = {
    port: 4723,
    capabilities: {
      platformName: 'Windows',
      platformVersion: '10', // Phiên bản Windows của bạn
      deviceName: 'WindowsPC',
      app: 'C:\\Path\\To\\YourApp.exe', // Đường dẫn đến ứng dụng bạn muốn kiểm tra
      automationName: 'WindowsPC',
      noReset: true
    }
  }

  // Khởi tạo Appium client
  const client = await wdio.remote(options)

  // Chờ ứng dụng tải
  await client.pause(2000) // 2 giây để ứng dụng tải

  // Lấy tất cả cửa sổ ứng dụng
  const windows = await client.getWindowHandles()
  console.log('All windows: ', windows)

  // Chuyển sang cửa sổ ứng dụng
  await client.switchToWindow(windows[0])
  console.log('Switched to app window')

  // Tìm và tương tác với các phần tử trong ứng dụng
  const element = await client.$('button#yourButtonId') // Tìm phần tử bằng ID
  await element.click() // Thực hiện hành động click vào button

  // Đóng ứng dụng sau khi test xong
  await client.deleteSession()
}

main().catch(console.error)
