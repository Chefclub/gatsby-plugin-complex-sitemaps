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
        edges.map(async (edge: any) => await serializationFunction(edge.node))
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
    const XMLs = [""]

    //Format every node attribute into xml field and add it to the xml string until it's full then add it to the next xml string
    this.nodes.forEach((node: SitemapNode, index: number) => {
      const i = parseInt(
        `${Math.floor(index / this.pluginOption.entryLimitPerFile)}`
      )
      if (XMLs[i] === undefined) XMLs.push("")
      XMLs[i] = `${XMLs[i]}<url>${sitemapNodeToXML(node)}</url>`
    })

    //For each xml string, add xml and urlset, process the file name and write it
    await Promise.all(
      XMLs.map(async (xml: string, index) => {
        xml = `
          <?xml ${this.sitemap.xmlAnchorAttributes ?? ""}?>
          <urlset ${this.sitemap.urlsetAnchorAttributes ?? ""}>
            ${xml}
          </urlset>
        `

        const finalFileName =
          XMLs.length > 1
            ? this.sitemap.fileName.replace(/\.xml$/, `-${index + 1}.xml`)
            : this.sitemap.fileName

        this.reporter.verbose(`Writting ${finalFileName} in ${writeFolderPath}`)
        writeXML(xml, writeFolderPath, finalFileName)
      })
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
