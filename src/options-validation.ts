import { parse as parseGraphql } from "gatsby/graphql"
import { stripIndent } from "common-tags"
import { PluginOptions, SiteMap } from "./types"

const DEFAULT_QUERY = `
  allSitePage {
    nodes {
      path
    }
  }
`

const DEFAULT_SITEMAP_ROOT = {
  fileName: "sitemap",
  createLinkInHead: true,
  queryName: "allSitePage",
  serialize: (page: any) => page.path,
}

const DEFAULT_XML_ATTRIBUTES = 'version="1.0" encoding="UTF-8"'
const DEFAULT_URLSET_ATTRIBUTES =
  'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'

export const pluginOptionsSchema = ({ Joi }: any) => {
  const validateQuery = ({ query }: PluginOptions) => {
    if (query) {
      try {
        parseGraphql(query)
      } catch (e: any) {
        throw new Error(
          stripIndent`
        Invalid plugin options for "gatsby-plugin-sitemap":
        "query" must be a valid GraphQL query. Received the error "${e?.message}"`
        )
      }
    }
  }

  const validateSitemap = (sitemap: SiteMap) => {
    sitemapSchema.validate(sitemap)
  }

  const sitemapSchema = Joi.object({
    fileName: Joi.string()
      .pattern(/.*\.xml$/)
      .description("The sitemap file name"),
    outputFolder: Joi.string().description(
      "Path appended at the end of the global outputFolder path"
    ),
    children: Joi.array()
      .items(Joi.object().external(validateSitemap))
      .description("Children sitemap, referenced into parent"),
    queryName: Joi.string().description(
      "Name of the graphQL query (ex : allSitePage)"
    ),
    excludes: Joi.alternatives().try(Joi.string(), Joi.object().type("RegExp")),
    filterPages: Joi.function(),
    serialize: Joi.function(),
    xmlAnchorAttributes: Joi.string()
      .default(DEFAULT_XML_ATTRIBUTES)
      .description("Attribute to add <?xml {here} ?>"),
    urlsetAnchorAttributes: Joi.string()
      .default(DEFAULT_URLSET_ATTRIBUTES)
      .description("Attribute to add <urlset {here} >"),
  })

  Joi.object({
    query: Joi.string()
      .default(DEFAULT_QUERY)
      .external(validateQuery)
      .description(
        stripIndent`
        (GraphQL Query) The query for the data you need to generate the sitemap.
        It's required to get the site's URL, if you are not fetching it from \`site.siteMetadata.siteUrl\`,
        you will need to set a custom \`resolveSiteUrl\` function.
        If you override the query, you may need to pass in a custom \`resolvePagePath\` or
        \`resolvePages\` to keep everything working.
        If you fetch pages without using \`allSitePage.nodes\` query structure
        you will definately need to customize the \`resolvePages\` function.`
      ),
    sitemapRoot: Joi.object()
      .default(DEFAULT_SITEMAP_ROOT)
      .external((pluginOption: PluginOptions) =>
        validateSitemap(pluginOption.sitemapRoot)
      )
      .description(`A sitemap object `),
    outputFolder: Joi.string()
      .default(`/`)
      .description(`Folder path where sitemaps are stored in \`public\`.`),
    entryLimitPerFile: Joi.number()
      .min(1)
      .max(50000)
      .integer()
      .default(45000) // default based on upstream "sitemap" plugin default, may need optimization
      .description(
        `Number of entries per sitemap file, a sitemap index and multiple sitemaps are created if you have more entries.`
      ),
    createLinkInHead: Joi.boolean()
      .default(true)
      .description(
        "Whether to populate the head of your site with a link to the sitemap."
      ),
  })
}
