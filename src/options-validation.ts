import { parse as parseGraphql } from "gatsby/graphql"
import { stripIndent, oneLine } from "common-tags"
import { PluginOptions } from "./types"

export const pluginOptionsSchema = ({ Joi }: any) =>
  Joi.object({
    plugins: Joi.array().strip(),
    outputFolder: Joi.string()
      .default(`/sitemap`)
      .description(`Folder path where sitemaps are stored in \`public\`.`),
    createLinkInHead: Joi.boolean()
      .default(true)
      .description(
        `Whether to populate the \`<head>\` of your site with a link to the sitemap.`
      ),
    entryLimitPerFile: Joi.number()
      .default(-1) // default based on upstream "sitemap" plugin default, may need optimization
      .description(
        `Number of entries per sitemap file, a sitemap index and multiple sitemaps are created if you have more entries.`
      ),
    query: Joi.string()
      .default(
        oneLine`{
          site {
            siteMetadata {
              siteUrl
            }
          }
          allSitePage {
            nodes {
              path
            }
          }
        }`
      )
      .external((pluginOptions: PluginOptions) => {
        const query = pluginOptions?.query
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
      })
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
    excludes: Joi.array()
      .items(Joi.any())
      .default([])
      .description(
        stripIndent`
        An array of paths to exclude from the sitemap.
        While this is usually an array of strings it is possible to
        enter other data types into this array for custom filtering.
        Doing so will require customization of the \`filterPages\` function.`
      ),
    resolveSiteUrl: Joi.function().description(
      `Takes the output of the data query and lets you return the site URL.`
    ),
    resolvePagePath: Joi.function().description(
      `Takes a page object and returns the uri of the page (no domain or protocol).`
    ),
    resolvePages: Joi.function().description(
      `Takes the output of the data query and expects an array of page objects to be returned.`
    ),
    filterPages: Joi.function().description(
      stripIndent`Takes the current page a string (or other object)
        from the \`exclude\` array and expects a boolean to be returned.
        \`true\` excludes the path, \`false\` keeps it.`
    ),
    serialize: Joi.function().description(
      `Takes the output of \`filterPages\` and lets you return a sitemap entry.`
    ),
  })
