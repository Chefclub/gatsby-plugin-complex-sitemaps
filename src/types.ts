export type PluginOptions = {
  outputFolder: string
  createLinkInHead: boolean
  entryLimitPerFile: number
  query: string
  excludes: string[]
  resolveSiteUrl: (data: any) => string
  resolvePagePath: (data: any) => string
  resolvePages: (data: any) => any[]
  filterPages: (page: Page, excludedRoute: string, tools: any) => boolean
  serialize: (
    pages: Page[],
    tools: any
  ) => { url: string; changefreq: string; priority: number }
}

type Page = { path: string; [key: string]: any }
