# zkeeper

Zoom Keeper, use iframe wrapper to retain browser zoom level across local HTML files.

## Why

If you view local HTML files, such as documentations, the zoom level is not retained when navigating across them due to each page being treated as its own website.

The solution here is to view them in an iframe, thus you are always looking at the same parent (wrapper) page and retain zoom level.

zkeeper will keep track of iframe page's URL, and add it to the parent page as a query value so the page can be bookmarked.

Features:

- Back and forward support (correctly updates query value)
- Hash link support
- External links (by comparing origins) and non-html pages/assets load directly (breaks out of the iframe) to avoid security restrictions

Great to use with my `x-include.js` for local documents and documentations.

## How to use:

Setup parent page with iframe.

```html
<!DOCTYPE html>
<html><head>
<title>My Documentations</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="js/zkeeper.js""></script>
</head>
<style>
html,body {
  margin:0; padding:0;
  display:grid; min-height:100%;
}
iframe {
  border:0; margin:0; padding:0;
}
</style>
<body>
  <iframe width="100%" height="100%" data-default-src="files/index.html"></iframe>
</body>
</html>
```

For each page.

```html
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="js/zkeeper.js""></script>
</head>
<body>
  <h1>Index Page</h1>
  <p>This is the page you want to view</p>
</body>
</html>
```
