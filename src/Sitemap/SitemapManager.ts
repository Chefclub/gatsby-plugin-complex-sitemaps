import {
  FilteringFunction,
  PluginOptions,
  SerializationFunction,
  Sitemap,
  SitemapNode,
} from "../types"
import * as path from "path"
import { sitemapNodeToXML, writeXML } from "../utils"
import { Reporter } from "gatsby"

export default class SitemapManager {
  sitemap: Sitemap
  pluginOption: PluginOptions
  children: SitemapManager[]
  nodes: SitemapNode[]
  reporter: Reporter

  constructor(
    sitemap: Sitemap,
    pluginOption: PluginOptions,
    reporter: Reporter
  ) {
    this.sitemap = sitemap
    this.pluginOption = pluginOption
    this.reporter = reporter
    this.nodes = []

    //"Copy" sitemap.children to children attribute after init a new SitemapManager with it
    this.sitemap.children = this.sitemap?.children ?? []
    this.children = this.sitemap.children.map(
      (child: Sitemap) => new SitemapManager(child, this.pluginOption, reporter)
    )
  }

  async populate(queryData: any) {
    await Promise.all([
      this.populateChildren(queryData),
      this.populateWithQuery(queryData),
    ])
    this.populateWithChildren()
  }

  populateWithChildren() {
    this.children?.forEach((child: SitemapManager) => {
      const childLoc = path.join(
        this.pluginOption.outputFolderURL ?? this.pluginOption.outputFolder,
        child.sitemap.fileName
      )
      this.reporter.verbose(
        `${this.sitemap.fileName} child : ${child.sitemap.fileName} => ${childLoc}`
      )
      this.nodes.unshift({
        type: "sitemap",
        loc: childLoc,
        lastmod: child.sitemap.lastmod ?? new Date().toISOString(),
      })
    })
  }

  async populateWithQuery(queryData: any) {
    //Parse query result
    if (
      queryData &&
      this.sitemap?.queryName &&
      queryData[this.sitemap.queryName] &&
      this.sitemap?.serializer
    ) {
      let edges = queryData[this.sitemap.queryName].edges
      const serializationFunction: SerializationFunction =
        this.sitemap.serializer

      if (this.sitemap?.filterPages) {
        const filterFunction: FilteringFunction = this.sitemap?.filterPages
        edges = edges.filter((edge: any) => filterFunction(edge.node))
      }

      edges = await Promise.all(
        edges.map(async (edge: any) => ({
          ...(await serializationFunction(edge.node)),
          type: "url",
        }))
      )

      this.nodes.push(...edges)
    } else {
      this.reporter.warn(
        `${this.sitemap?.fileName} => Invalid query name (${this.sitemap?.queryName}) => only children`
      )
    }
  }

  async populateChildren(queryData: any) {
    await Promise.all(
      this.children?.map(async (child: SitemapManager) => {
        await child.populate(queryData)
      })
    )
  }

  async generateXML(pathPrefix: string) {
    await this.generateChildrenXML(pathPrefix)

    const writeFolderPath = path.join(
      pathPrefix,
      this.sitemap.outputFolder ?? this.pluginOption.outputFolder ?? ""
    )

    const XMLs: {
      sitemap: string[]
      url: string[]
    }[] = [{ sitemap: [], url: [] }]

    //Format every node attribute into xml field and add it to the xml string until it's full then add it to the next xml string
    this.nodes
      .sort(orderSitemapFirst)
      .forEach((node: SitemapNode, index: number) => {
        const i = parseInt(
          `${Math.floor(index / this.pluginOption.entryLimitPerFile)}`
        )
        XMLs[i][node?.type].push(
          `<${node.type}>${sitemapNodeToXML(node)}</${node.type}>`
        )
      })

    //For each xml string, add xml and urlset, process the file name and write it
    await Promise.all(
      XMLs.map(
        async (
          xml: {
            sitemap: string[]
            url: string[]
          },
          index
        ) => {
          const xmlContent = `
          <?xml ${this.sitemap.xmlAnchorAttributes ?? ""}?>
          ${
            xml.sitemap.length
              ? `
                  <sitemapindex ${this.sitemap.urlsetAnchorAttributes ?? ""}>
                    ${xml.sitemap.join("\n")}
                  </sitemapindex>
              `
              : ""
          }
          ${
            xml.url.length
              ? `
                  <urlset ${this.sitemap.urlsetAnchorAttributes ?? ""}>
                    ${xml.url.join("\n")}
                  </urlset>
              `
              : ""
          }
        `

          const finalFileName =
            XMLs.length > 1
              ? this.sitemap.fileName.replace(/\.xml$/, `-${index + 1}.xml`)
              : this.sitemap.fileName

          this.reporter.verbose(
            `Writting ${finalFileName} in ${writeFolderPath}`
          )
          writeXML(xmlContent, writeFolderPath, finalFileName)
        }
      )
    )
  }

  async generateChildrenXML(pathPrefix: string) {
    await Promise.all(
      this.children?.map(async (child: SitemapManager) => {
        await child.generateXML(pathPrefix)
      })
    )
  }
}

const orderSitemapFirst = (a: SitemapNode, b: SitemapNode) => {
  if (a.type === "url" && b.type === "sitemap") {
    return -1
  } else if (a.type === "sitemap" && b.type === "url") {
    return 1
  } else {
    return 0
  }
}
