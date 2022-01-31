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
    } else {
      content = sitemapNodeToXML(tagValue as SitemapSubNode)
    }
    xml = `${xml}<${tag}>${content}</${tag}>`
  }

  return `${xml}`
}

export const writeXML = (xml: string, folderPath: string, filename: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
  const filePath = path.join(folderPath, filename)
  fs.writeFileSync(filePath, xml, { flag: "a" })
}

export const msg = (msg: string) => `gatsby-plugin-complex-sitemaps - ${msg}`
