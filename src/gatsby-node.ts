import { BuildArgs } from "gatsby"
import { PluginOptions, SiteInfo } from "./types"
import { pluginOptionsSchema } from "./options-validation"
import SitemapManager from "./Sitemap/SitemapManager"
import * as path from "path"
import { joinURL, msg } from "./utils"

const PUBLIC_PATH = "./public"

const SITE_INFO_QUERY = `{
  site {
    siteMetadata {
      siteUrl
    }
  }
}`

exports.onPostBuild = async (
  { graphql, pathPrefix, reporter }: BuildArgs,
  pluginOptions: PluginOptions
) => {
  const timer = reporter.activityTimer(msg(`Generating sitemaps`))
  timer.start()

  //Run queries
  const siteInfo = (await graphql(SITE_INFO_QUERY)).data as SiteInfo

  const queryData = (await graphql(pluginOptions.query)).data

  //Reformat options and behavior
  pluginOptions.outputFolderURL = joinURL(
    siteInfo.site.siteMetadata.siteUrl,
    pluginOptions.outputFolder
  )

  pluginOptions.outputURL = siteInfo.site.siteMetadata.siteUrl

  const basePath = path.join(PUBLIC_PATH, pathPrefix)

  //Init root manager => recursively init children manager
  const rootManager = new SitemapManager(
    pluginOptions.sitemapTree,
    pluginOptions,
    reporter
  )

  //Run query and populate all managers with query data and parent/children information
  reporter.verbose("Start populating sitemap")
  await rootManager.populate(queryData)
  reporter.verbose("Populating sitemap ended")

  //Generate the content of XML files and write the files recursively
  await rootManager.generateXML(basePath)

  timer.end()

  return
}

exports.pluginOptionsSchema = pluginOptionsSchema
