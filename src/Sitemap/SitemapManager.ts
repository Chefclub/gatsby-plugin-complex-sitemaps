import {
  FilteringFunction,
  PluginOptions,
  SerializationFunction,
  Sitemap,
  SitemapNode,
} from "../types"
import * as path from "path"
import { joinURL, sitemapNodeToXML, writeXML } from "../utils"
import { Reporter } from "gatsby"

export default class SitemapManager {
  sitemap: Sitemap
  pluginOptions: PluginOptions
  children: SitemapManager[]
  nodes: SitemapNode[]
  reporter: Reporter

  constructor(
    sitemap: Sitemap,
    pluginOptions: PluginOptions,
    reporter: Reporter
  ) {
    this.sitemap = sitemap
    this.pluginOptions = pluginOptions
    this.reporter = reporter
    this.nodes =
      this.sitemap.arbitraryNodes?.map(node => ({ ...node, type: "url" })) ?? []

    //"Copy" sitemap.children to children attribute after init a new SitemapManager with it
    this.sitemap.children = this.sitemap?.children ?? []
    this.children = this.sitemap.children.map((child: Sitemap) => {
      //Merge sitemap specific outputFolder (if exist) with child.outputFolder, pluginOptions.outputFolder and pluginOptions.outputFolderURL
      let childOutputFolder = child.outputFolder
      let pluginOutputFolder = pluginOptions.outputFolder
      let pluginOutputFolderURL = pluginOptions.outputFolderURL
      if (
        child.outputFolder ||
        this.sitemap.outputFolder ||
        this.pluginOptions.outputFolder
      ) {
        childOutputFolder = path.join(
          this.sitemap.outputFolder ?? this.pluginOptions.outputFolder ?? "",
          child.outputFolder ?? ""
        )
        pluginOutputFolder = path.join(
          this.pluginOptions.outputFolder ?? "",
          child.outputFolder ?? ""
        )
        pluginOutputFolderURL = joinURL(
          "auto",
          pluginOptions.outputFolderURL ?? "",
          child.outputFolder ?? ""
        )
      }

      //Create SitemapManager for every child and save it into "children" array
      return new SitemapManager(
        {
          ...child,
          xslPath: child.xslPath ?? pluginOptions.xslPath,
          outputFolder: childOutputFolder,
        },
        {
          ...this.pluginOptions,
          outputFolder: pluginOutputFolder,
          outputFolderURL: pluginOutputFolderURL,
        },
        reporter
      )
    })
  }

  getLocs(): string[] {
    const fileNumber = Math.ceil(
      this.nodes.length / this.pluginOptions.entryLimitPerFile
    )

    const urls = []
    if (fileNumber > 1) {
      for (let i = 1; i <= fileNumber; i++) {
        urls.push(
          joinURL(
            "remove",
            this.pluginOptions.outputFolderURL ??
              this.pluginOptions.outputFolder,
            this.sitemap.fileName.replace(/\.xml$/, `-${i}.xml`)
          )
        )
      }
    } else {
      urls.push(
        joinURL(
          "remove",
          this.pluginOptions.outputFolderURL ?? this.pluginOptions.outputFolder,
          this.sitemap.fileName
        )
      )
    }
    return urls
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
      const childLocs = child.getLocs()
      this.reporter.verbose(
        `${this.sitemap.fileName} child : ${
          child.sitemap.fileName
        } => ${childLocs.join("&")}`
      )
      childLocs.forEach(loc =>
        this.nodes.unshift({
          type: "sitemap",
          loc: loc,
          lastmod: child.sitemap.lastmod ?? new Date().toISOString(),
        })
      )
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

      //We run the filtering function if the user has passed one
      if (this.sitemap?.filterPages) {
        this.reporter.verbose(
          `Filtering function found for ${this.sitemap.fileName}, start filtering`
        )
        const filterFunction: FilteringFunction = this.sitemap?.filterPages
        const beforeFilteringLength = edges.length

        edges = edges.filter((edge: any) =>
          filterFunction(edge.node, this.sitemap.fileName)
        )

        this.reporter.verbose(
          `Filtering ended : ${
            beforeFilteringLength - edges.length
          } node removed`
        )
      }

      //We transform each edge from the query result to a SitemapNode

      const generateSitemapNode = async (
        edge: any,
        language?: string
      ): Promise<SitemapNode> => {
        const serializedNode = await serializationFunction(edge.node)
        return {
          ...serializedNode,
          loc: joinURL(
            this.sitemap.trailingSlash,
            this.pluginOptions.outputURL ?? this.pluginOptions.outputFolder,
            language ? `/${language}/${serializedNode.loc}` : serializedNode.loc
          ),
          type: "url",
          language,
        }
      }

      const addLinksToNode = (node: SitemapNode, extraNodes: SitemapNode[]) => {
        node.links = extraNodes.map(extraNode => {
          return {
            rel: "alternate",
            hreflang: extraNode.language ?? this.pluginOptions.defaultLanguage,
            href: extraNode.loc,
          }
        })
      }

      const sitemapNodes: SitemapNode[] = []

      if (edges != null && Array.isArray(edges)) {
        for (const edge of edges) {
          const node = await generateSitemapNode(edge)
          if (this.pluginOptions.languages) {
            const extraNodes: SitemapNode[] = await Promise.all(
              this.pluginOptions.languages.map(async language => {
                return generateSitemapNode(edge, language)
              })
            )
            addLinksToNode(node, extraNodes)
            extraNodes.forEach(extraNode => {
              addLinksToNode(extraNode, [node, ...extraNodes])
            })

            sitemapNodes.push(...extraNodes)
          }

          sitemapNodes.push(node)
        }

        this.nodes.push(...sitemapNodes)
      }
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

  //This function generate the xml of each file of the tree from the leaves to the root
  async generateXML(pathPrefix: string) {
    await this.generateChildrenXML(pathPrefix)

    if (!this.sitemap.writeFile) {
      return
    }

    const writeFolderPath = path.join(
      pathPrefix,
      this.sitemap.outputFolder ?? this.pluginOptions.outputFolder ?? ""
    )

    const files: {
      sitemap: string[]
      url: string[]
    }[] = [{ sitemap: [], url: [] }]

    //Format every node attribute into xml field and add it to the xml string until it's full then add it to the next xml string
    this.nodes
      .sort(orderSitemapFirst)
      .forEach((node: SitemapNode, index: number) => {
        const fileIndex = parseInt(
          `${Math.floor(index / this.pluginOptions.entryLimitPerFile)}`
        )
        if (!files[fileIndex]) {
          files[fileIndex] = { sitemap: [], url: [] }
        }
        files[fileIndex][node?.type].push(
          `<${node.type}>${sitemapNodeToXML(node)}</${node.type}>`
        )
      })

    //For each file we add xml, xsl, urlset and/or sitemapindex, we process the file name and write it
    await Promise.all(
      files.map(
        async (
          file: {
            sitemap: string[]
            url: string[]
          },
          index
        ) => {
          const xmlContent =
            `<?xml ${this.sitemap.xmlAnchorAttributes ?? ""}?>\n` +
            (this.sitemap.xslPath
              ? `<?xml-stylesheet type="text/xsl" href="${this.sitemap.xslPath}"?>\n`
              : "") +
            (file.sitemap.length
              ? `<sitemapindex ${
                  this.sitemap.urlsetAnchorAttributes ?? ""
                }>\n${file.sitemap.join("\n")}\n</sitemapindex>`
              : "") +
            (file.url.length
              ? `<urlset ${
                  this.sitemap.urlsetAnchorAttributes ?? ""
                }>\n${file.url.join("\n")}\n</urlset>`
              : "")

          const finalFileName =
            files.length > 1
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
