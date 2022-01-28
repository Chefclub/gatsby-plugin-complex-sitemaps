import { BuildArgs } from "gatsby"
import { PluginOptions, SiteInfo } from "./types"
import { pluginOptionsSchema } from "./options-validation"
import SitemapManager from "./Sitemap/SitemapManager"
import * as path from "path"

const PUBLIC_PATH = "./public"

const SITE_INFO_QUERY = `{
  site {
    siteMetadata {
      siteUrl
    }
  }
}`

exports.onPostBuild = async (
  { graphql, pathPrefix }: BuildArgs,
  pluginOptions: PluginOptions
) => {
  //Run queries
  const siteInfo = (await graphql(SITE_INFO_QUERY)).data as SiteInfo
  console.log("siteInfo", siteInfo)
  const queryData = (await graphql(pluginOptions.query)).data

  //Reformat options and behavior
  pluginOptions.outputFolderURL = path.join(
    siteInfo.site.siteMetadata.siteUrl,
    pluginOptions.outputFolder
  )
  const basePath = path.join(PUBLIC_PATH, pathPrefix)

  //Format Queries data

  //Init manager
  const rootManager = new SitemapManager(
    pluginOptions.sitemapTree,
    pluginOptions
  )
  console.log("Populating started")
  await rootManager.populate(queryData)
  console.log("Populating ended")

  //Generate XML file content
  await rootManager.generateXML(basePath)

  //Write Files

  return
}

exports.pluginOptionsSchema = pluginOptionsSchema
