import { BuildArgs } from "gatsby"
import { PluginOptions } from "./types"
import { pluginOptionsSchema } from "./options-validation"
import { oneLine } from "common-tags"

const SITE_INFO_QUERY = `
  site {
    siteMetadata {
      siteUrl
    }
  }
`

exports.onPostBuild = async (
  { graphql, pathPrefix }: BuildArgs,
  pluginOptions: PluginOptions
) => {
  console.log("pathPrefix : ", pathPrefix)

  //Reformat options and behavior
  const completedQuery = oneLine`{${SITE_INFO_QUERY}${pluginOptions.query}}`
  console.log("completedQuery : ", completedQuery)

  //Run queries
  const queryData = await graphql(completedQuery)
  console.log("queryData : ", JSON.stringify(queryData))

  //Format Queries data

  //Generate XML file content

  //Write Files

  return
}

exports.pluginOptionsSchema = pluginOptionsSchema
