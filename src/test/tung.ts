fetch(
  'https://link.honeygain.com/ls/click?upn=u001.NWWqGuEOH4LkTT-2Fil4sdkdB8wEF5eG1Nv54PqGUygHZfFTBuOaHUCwzIejiaXSSErHBXwLjLD6lDeaHCbHtlK5XM0GjDh3Jah7wSl-2FsBve6-2F3yDanOxHDueBBjPuXlqa81dKzhKhHjjTocJIsxU2qraVt0H8G01nfhCaQ9aEUdruxDFL9NvUSzaT3jzLB1vEmqV5PgZZ5oDKeD0dMnKWU9RqpmNaOqqoocUKNJuy4p8-3DgNMs_DIBkZ06iLAI8mTm7CyN8jMR4-2F7tXdXIzmgJkVm1L2xz2-2FecRN7so7DuROaTTVX-2FPv-2BM5LBAorzjWk5ZuGEoB1t0yCv2UrLbQCY333cDtkDwZjVqxEkgo4ZGKJpo4J-2FIGKOX7xIGaDFawrwXqfNewOO-2F3am0WZfMNYgh7SVnJYzxSf4KZH01AK-2BUE9D7rNe5KBZbyrhHA5l2anTkWNRqoyI8t7S5LLVgHjDCTEWxwHc3B7vV5q60wV-2BJfWaer1ltmrowPJyHS06Z3VS4M9NYB3nTfH5sBdl4Ep49Q2G7aBt9zBYCEBJVwc5CxUR1hQbi31AFVSPRu4orXsZ7YpY1-2F17dVfH-2Blhqjwi4fmxej6gUO7j6z12DeWckhKRGnJBxzw',
  { method: 'GET' }
)
  .then((response) => response.json())
  .then((data) => {
    console.log(data) // Log dữ liệu JSON mà API trả về
  })
  .catch((error) => {
    console.error('Lỗi:', error)
  })
