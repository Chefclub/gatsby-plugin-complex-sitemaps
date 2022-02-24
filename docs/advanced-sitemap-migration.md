# Migration guide from [`gatsby-plugin-advanced-sitemap`](https://github.com/TryGhost/gatsby-plugin-advanced-sitemap) to `gatsby-plugin-complex-sitemap-tree`

## Step 1 : Uninstall and reinstall
Obviously, to begin the migration, we start by uninstalling `gatsby-plugin-advanced-sitemap` with 
```
npm uninstall gatsby-plugin-advanced-sitemap
```
Then we install `gatsby-plugin-complex-sitemap-tree` with
```
npm install gatsby-plugin-complex-sitemap-tree
```

## Step 2 : Modify the `gatsby-config.js` file

We will start from the `gatsby-plugin-advanced-sitemap` so the first change is to change the resolve value from `gatsby-plugin-advanced-sitemap` to `gatsby-plugin-complex-sitemap-tree`

```javascript
plugins: [
  {
    resolve : "gatsby-plugin-complex-sitemap-tree", 
    options: { ... },
  }
]
```

That was the easy part 😬

Now let's take a look to `gatsby-plugin-advanced-sitemap` options which concern you to format it for `gatsby-plugin-complex-sitemap-tree`

<details><summary>query</summary>
<p>

No change here, `query` param is equivalent in both plugins 😉

</p>
</details>

<details><summary>output</summary>
<p>

`output` param is split in multiple parts.

Let's take the example of an `output` param equal to `mySitemapFolder/sitemapCustom.xml`

1. The `outputFolder` **plugin** option which, in our example, is equal to `mySitemapFolder`
2. The `fileName` **sitemap tree** option (see `mapping` param migration) which, in our example, is equal to `sitemapCustom.xml`
3. The `outputFolder` **sitemap tree** option which has no equivalent in our example (see [Sitemap tree options](../README.md#sitemap-tree-options) for more information)

</p>
</details>

<details><summary>mapping</summary>
<p>

Probably the biggest change. There is no more `mapping` param 🪦

The replacement param is `sitemapTree`. Let's get the doc example and adapt it. We have this : 
```javascript
{
    allGhostPost: {
        sitemap: `posts`,
        prefix: 'your-prefix/',
        serializer: (edges) => {
            return edges.map(({ node }) => {
                (...) // Custom logic to change final sitemap.
            })
        }
    },
    allGhostTag: {
        sitemap: `tags`,
    },
    allGhostAuthor: {
        sitemap: `authors`,
    },
    allGhostPage: {
        sitemap: `pages`,
    },
}
```

With `gatsby-plugin-advanced-sitemap`, this config will generate a file named `sitemap.xml` which link to 4 other sitemaps named `sitemap-XXX.xml` with `XXX` replaced by the `sitemap` attribute.

To obtain the same result, we complete the `sitemapTree` param with this object
```javascript
{
    fileName: "sitemap.xml",
    children: [
        {
          fileName: "sitemap-posts.xml",
          queryName: "allGhostPost",
          // Custom logic to change final sitemap.
          serializer: (edge) => ({loc : `your-prefix/${edge.slug}`, ... })
        },
        {
          fileName: "sitemap-tags.xml",
          queryName: "allGhostTag",
          serializer: (edge) => ({loc : edge.slug})
        },
        {
          fileName: "sitemap-authors.xml",
          queryName: "allGhostAuthor",
          serializer: (edge) => ({loc : edge.slug})
        },
        {
          fileName: "sitemap-pages.xml",
          queryName: "allGhostPage",
          serializer: (edge) => ({loc : edge.slug})
        },
    ],
}
```

 - As you can see `sitemap` option is now the `fileName` one. You can call your sitemap as you want.
 - In `gatsby-plugin-advanced-sitemap`, the `mapping` object keys should be equals to queries name. Now, you add it in the `queryName` parameter. It's allow you to use the same query twice !
 - The `serializer` keep the same name. The difference is that the function receive `edge` one at a time when you receive all the `edges` in `gatsby-plugin-advanced-sitemap`
 - The `prefix` option is now in the serializer function as it has to return an object with a `loc` attribute.

For more information see [Sitemap tree options](../README.md#sitemap-tree-options)


</p>
</details>

<details><summary>exclude</summary>
<p>

`exclude` param is replaced by the `filterPages` **sitemap tree** param. It's relative to a specific sitemap and as it's a function you can filter your own way.

</p>
</details>

<details><summary>createLinkInHead</summary>
<p>

No change here, `createLinkInHead` param is equivalent in both plugins 😉

</p>
</details>

<details><summary>addUncaughtPages</summary>
<p>

`addUncaughtPages` no longer exist as `gatsby-plugin-complex-sitemap-tree` do not base the sitemap on existing pages, it's your responsibility to check if the page exist. If you want to include every pages you can query for `allSitePages`.

</p>
</details>

<details><summary>additionalSitemaps</summary>
<p>

`additionalSitemaps` no longer exist in `gatsby-plugin-complex-sitemap-tree`.
To add an external sitemap, put it in your `static` folder and add it manually to the `children` array of one of your sitemap like this :
```javascript
{
    fileName: "sitemap.xml",
    children: [
        {
            fileName: "my-external-sitemap.xml",
            children: [],
        }
    ]
}
```

</p>
</details>

That's all ! Hope you achieve your migration without any problem 😊
