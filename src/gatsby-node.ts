import { BuildArgs } from "gatsby"
import { PluginOptions } from "./types"
import { pluginOptionsSchema } from "./options-validation"

exports.pluginOptionsSchema = pluginOptionsSchema

exports.onPostBuild = async (
  { graphql, pathPrefix }: BuildArgs,
  pluginOptions: PluginOptions
) => {
  //Reformat options and behavior
  console.log("pluginOptions", pluginOptions)

  //Run queries

  //Format Queries data

  //Generate XML file content

  //Write Files

  return
}
