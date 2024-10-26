import * as fs from 'fs'
function readFormattedProxies(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const resultArray: string[] = []

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      // Loại bỏ dấu [] ở đầu và cuối file, sau đó tách thành từng dòng
      const lines = data.replace(/[[\]]/g, '').split(',')

      for (let line of lines) {
        line = line.trim().replace(/^'|'$/g, '') // Loại bỏ dấu ' ở đầu và cuối chuỗi
        if (line) {
          resultArray.push(line)
        }
      }

      resolve(resultArray)
    })
  })
}
function readFileAndParseProxies(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const resultArray: string[] = []

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      const lines = data.split('\n')

      for (let line of lines) {
        line = line.trim()
        if (line) {
          resultArray.push(line) // Để nguyên chuỗi proxy, không tách thành đối tượng
        }
      }

      resolve(resultArray)
    })
  })
}

const filePath: string = './src/test/kk.txt'
readFileAndParseProxies(filePath)
  .then((proxies) => {
    // Chuyển đổi mỗi phần tử trong mảng thành chuỗi có dấu '
    const formattedProxies: string[] = proxies.map((proxy) => `'${proxy}'`)

    // Ghi mảng vào file, mỗi proxy trên 1 dòng
    fs.writeFileSync('./src/test/kkk.txt', `[${formattedProxies.join(',\n')}]`)

    console.log('Đã ghi mảng proxy vào file proxyArr.txt')
  })
  .catch((err) => {
    console.error('Đã xảy ra lỗi:', err)
  })

// const formattedFilePath: string = './src/test/kkk.txt'
// readFormattedProxies(formattedFilePath)
//   .then((proxies) => {
//     // Ghi mảng vào file, mỗi proxy trên 1 dòng mà không có dấu '
//     fs.writeFileSync('./src/test/kk.txt', proxies.join('\n'))

//     console.log("Đã ghi mảng proxy vào file kk_no_quotes.txt mà không có dấu '")
//   })
//   .catch((err) => {
//     console.error('Đã xảy ra lỗi:', err)
//   })
