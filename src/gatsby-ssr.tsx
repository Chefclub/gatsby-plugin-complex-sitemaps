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
  const { outputFolder, createLinkInHead, sitemapTree } = pluginOptions

  if (!createLinkInHead) {
    return
  }

  const urlParts = sitemapTree.outputFolder
    ? [sitemapTree.outputFolder, sitemapTree.fileName]
    : [sitemapTree.fileName]

  setHeadComponents([
    <link
      key={`gatsby-plugin-complex-sitemap-tree`}
      rel="sitemap"
      type="application/xml"
      href={withPrefix(posix.join(outputFolder, ...urlParts))}
    />,
  ])
}
