import { Link, SitemapNode, SitemapSubNode, TrailingSlashMode } from "./types"
import fs from "fs"
import * as path from "path"

export const sitemapNodeToXML = (
  node: SitemapNode | SitemapSubNode
): string => {
  let xml = ""

  for (const tag in node) {
    if (tag === "type") continue //We do not write the "type" attribute which is used in SitemapManager
    if (tag === "language") continue
    let content = ""
    if (tag === "links") {
      const links = node[tag] as Link[]
      links.forEach(link => {
        content = `${content}<xhtml:link rel="${encodeXML(
          link.rel
        )}" hreflang="${encodeXML(link.hreflang)}" href="${encodeXML(
          link.href
        )}" />`
      })
      xml = `${xml}${content}`
    } else if (tag === "images") {
      const images = node[tag] as string[]
      images.forEach(image => {
        content = `${content}<image:image><image:loc>${image}</image:loc></image:image>`
      })
      xml = `${xml}${content}`
    } else {
      const tagValue = node[tag]
      if (typeof tagValue === "string") {
        content = encodeXML(tagValue as string)
      } else {
        content = sitemapNodeToXML(tagValue as SitemapSubNode)
      }
      xml = `${xml}<${tag}>${content}</${tag}>`
    }
  }

  return `${xml}`
}

export const writeXML = (xml: string, folderPath: string, filename: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
  const filePath = path.join(folderPath, filename)
  fs.writeFileSync(filePath, xml)
}

export const msg = (msg: string) => `gatsby-plugin-complex-sitemaps - ${msg}`

export const joinURL = (
  trailingSlashMode: TrailingSlashMode,
  baseURL: string,
  ...parts: string[]
) => {
  //Remove start/end slash on parts
  parts = parts.map((part: string, index: number) =>
    index + 1 !== parts.length || trailingSlashMode != "auto"
      ? part.replace(/^\/*/, "").replace(/\/*$/, "")
      : part.replace(/^\/*/, "")
  )
  //Add / at the end of parts
  parts = parts.map((part: string) => `${part}`)

  //Remove end slash of baseURL
  baseURL = baseURL.replace(/\/*$/, "")

  //Return https://www.example.com/part1/part2/part3/
  return `${baseURL}/${parts.join("/")}${
    trailingSlashMode === "add" ? "/" : ""
  }`
}

const encodeXML = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
