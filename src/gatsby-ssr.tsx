import * as React from "react"
import {
  withPrefix as fallbackWithPrefix,
  withAssetPrefix,
  RenderBodyArgs,
} from "gatsby"
import { PluginOptions } from "./types"
import { posix } from "path"

const withPrefix = withAssetPrefix || fallbackWithPrefix

exports.onRenderBody = (
  { setHeadComponents }: RenderBodyArgs,
  pluginOptions: PluginOptions
) => {
  const { outputFolder, createLinkInHead } = pluginOptions

  if (!createLinkInHead) {
    return
  }

  setHeadComponents([
    <link
      key={`gatsby-plugin-sitemap`}
      rel="sitemap"
      type="application/xml"
      href={withPrefix(posix.join(outputFolder, `/sitemap-index.xml`))}
    />,
  ])
}
