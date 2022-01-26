//import { CreatePagesArgs } from "gatsby"

type PluginOptions = {
  test: string
}

exports.onPostBuild = async (
  //{ graphql, pathPrefix }: CreatePagesArgs,
  pluginOptions: PluginOptions
) => {
  //Reformat options and behavior
  console.log("pluginOptions", pluginOptions)

  for (let i = 0; i < 50; i++) {
    console.log("coucou")
  }

  //Run queries

  //Format Queries data

  //Generate XML file content

  //Write Files

  return
}
