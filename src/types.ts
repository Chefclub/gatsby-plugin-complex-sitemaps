export type PluginOptions = {
  //Base Params
  query: string
  sitemapRoot: SiteMap

  outputFolder: string
  entryLimitPerFile: number
  createLinkInHead: boolean
}

export type SiteMap = {
  //Base options
  fileName: string
  outputFolder?: string

  //Tree
  children?: SiteMap[]

  //Datas
  queryName: string
  excludes?: (RegExp | string)[]
  filterPages?: FilteringFunction
  serialize: SerializationFunction

  //Advanced options
  xmlAnchorAttributes?: string
  urlsetAnchorAttributes?: string
}

export type FilteringFunction = (page: any) => boolean

export type SerializationFunction = (page: any) => SiteMapNode

export type SiteMapNode = {
  loc: string
  changefreq?: string
  priority?: string
  lastmod?: string | Date
  [key: string]: string | SiteMapSubNode | Date | undefined
}

export type SiteMapSubNode = {
  [key: string]: string | SiteMapSubNode
}
