export type PluginOptions = {
  //Base Params
  query: string
  sitemapTree: Sitemap

  outputFolder: string
  xslPath?: string
  entryLimitPerFile: number
  createLinkInHead: boolean

  //Run-time
  outputFolderURL?: string
  outputURL?: string

  languages?: string[]
  defaultLanguage: string
  filterPages: any
}

export type Sitemap = {
  //Base options
  writeFile?: boolean
  fileName: string
  outputFolder?: string
  lastmod?: string
  xslPath?: string

  //Tree
  children?: Sitemap[]

  //Datas
  queryName?: string
  filterPages?: FilteringFunction
  serializer?: SerializationFunction

  //Advanced options
  trailingSlash: TrailingSlashMode
  arbitraryNodes?: SitemapNode[]
  xmlAnchorAttributes: string
  urlsetAnchorAttributes: string
  sitemapindexAnchorAttributes: string
}

export type TrailingSlashMode = "auto" | "remove" | "add"

export type FilteringFunction = (page: any) => boolean

export type SerializationFunction = (page: any) => SitemapNode

export type SitemapNode = {
  type: "url" | "sitemap"
  loc: string
  changefreq?: string
  priority?: string
  lastmod?: string | Date
  language?: string
}

export type SitemapSubNode = {
  [key: string]: string | SitemapSubNode
}

export type SiteInfo = {
  site: {
    siteMetadata: {
      siteUrl: string
    }
  }
}
