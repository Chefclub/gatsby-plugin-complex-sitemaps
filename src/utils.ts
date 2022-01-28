import { SitemapNode, SitemapSubNode } from "./types"
import fs from "fs"
import * as path from "path"

export const sitemapNodeToXML = (
  node: SitemapNode | SitemapSubNode
): string => {
  let xml = ""

  for (const tag in node) {
    let content = ""
    const tagValue = node[tag]
    if (typeof tagValue === "string") {
      content = tagValue as string
    } else if (tagValue instanceof Date) {
      content = (tagValue as Date).toISOString().split("T")[0]
    } else {
      content = sitemapNodeToXML(tagValue as SitemapSubNode)
    }
    xml = `${xml}<${tag}>${content}</${tag}>`
  }

  return `${xml}`
}

export const writeXML = (xml: string, folderPath: string, filename: string) => {
  console.log("folderPath", folderPath)
  console.log("filename", filename)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
  const filePath = path.join(folderPath, filename)
  fs.writeFileSync(filePath, xml, { flag: "a" })
}
