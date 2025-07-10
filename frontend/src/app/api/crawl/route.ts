// pages/api/crawl.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const homepage = 'https://subjav.cv' // giả sử là trang gốc

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(homepage, { waitUntil: 'networkidle2' })

  // Lấy danh sách link chi tiết
  const links = await page.$$eval('a.clip-link', (elements) =>
    elements.map((el) => (el as HTMLAnchorElement).href)
  )
  console.log(`Tìm thấy`, links)
  const videoUrls: string[] = []

  for (const link of links.slice(0, 1)) {
    // giới hạn 10 link để tránh quá tải
    try {
      console.log(`Đang xử lý link: ${link}`)
      const detailPage = await browser.newPage()
      await detailPage.goto(link, { waitUntil: 'networkidle2' })

      // Intercept request hoặc lấy video src thật
      const requests: string[] = []

      detailPage.on('request', (req) => {
        const url = req.url()
        console.log(`Request URL: ${url}`)
        if (
          url.includes('.mp4') ||
          url.includes('.m3u8') ||
          url.includes('video')
        ) {
          requests.push(url)
        }
      })

      // Wait for requests
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await detailPage.close()

      if (requests.length > 0) {
        videoUrls.push(requests[0]) // lấy cái đầu tiên
      }
    } catch (err) {
      console.error(`Lỗi khi xử lý ${link}:`, err)
    }
  }

  await browser.close()

  console.log(`Tổng số video tìm thấy:`, videoUrls)
  // Tải video
  const downloadsFolder = path.resolve('./downloads')

  if (!fs.existsSync(downloadsFolder)) fs.mkdirSync(downloadsFolder)

  for (const [i, url] of videoUrls.entries()) {
    try {
      const response = await axios.get(url, { responseType: 'stream' })
      const filepath = path.join(downloadsFolder, `video${i + 1}.mp4`)
      const writer = fs.createWriteStream(filepath)
      response.data.pipe(writer)

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve())
        writer.on('error', () => reject(undefined))
      })
    } catch (err) {
      console.error(`Lỗi tải video ${url}:`, err)
    }
  }

  res.status(200).json({ message: 'Đã tải xong', count: videoUrls.length })
}
