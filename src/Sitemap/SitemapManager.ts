import {
  FilteringFunction,
  PluginOptions,
  SerializationFunction,
  Sitemap,
  SitemapNode,
} from "../types"
import * as path from "path"

export default class SitemapManager {
  sitemap: Sitemap
  pluginOption: PluginOptions
  children: SitemapManager[]
  nodes: SitemapNode[]

  constructor(sitemap: Sitemap, pluginOption: PluginOptions) {
    this.sitemap = sitemap
    this.pluginOption = pluginOption
    this.nodes = []

    //"Copy" sitemap.children to children attribute after init a new SitemapManager with it
    this.sitemap.children = this.sitemap?.children ?? []
    this.children = this.sitemap.children.map(
      (child: Sitemap) => new SitemapManager(child, this.pluginOption)
    )
  }

  getSitemap() {
    return this.sitemap
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
      console.log("Child : ", child.sitemap.fileName, "=>", childLoc)
      this.nodes.unshift({
        loc: childLoc,
        lastmod: child.sitemap.lastmod,
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
      console.log(
        this.sitemap?.fileName,
        "=> Invalid query name => only children"
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

  async generateXML() {
    await this.generateChildrenXML()
    console.log(this.sitemap.fileName, "=>", this.nodes.length)
  }

  async generateChildrenXML() {
    await Promise.all(
      this.children?.map(async (child: SitemapManager) => {
        await child.generateXML()
      })
    )
  }
}
