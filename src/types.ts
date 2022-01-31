export type PluginOptions = {
  //Base Params
  query: string
  sitemapTree: Sitemap

  outputFolder: string
  outputFolderURL?: string
  entryLimitPerFile: number
  createLinkInHead: boolean
}

export type Sitemap = {
  //Base options
  fileName: string
  outputFolder?: string
  lastmod?: string

  //Tree
  children?: Sitemap[]

  //Datas
  queryName?: string
  excludes?: (RegExp | string)[]
  filterPages?: FilteringFunction
  serializer?: SerializationFunction

  //Advanced options
  xmlAnchorAttributes: string
  urlsetAnchorAttributes: string
  sitemapindexAnchorAttributes: string
}

export type FilteringFunction = (page: any) => boolean

export type SerializationFunction = (page: any) => SitemapNode

export type SitemapNode = {
  type: "url" | "sitemap"
  loc: string
  changefreq?: string
  priority?: string
  lastmod?: string | Date
  [key: string]: string | SitemapSubNode | Date | undefined
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
