# Minimal static file server for local preview (no Node/Python required).
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1   ->  http://localhost:8080
param([int]$Port = 8080)

$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".htm"="text/html; charset=utf-8";
  ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8";
  ".json"="application/json; charset=utf-8"; ".svg"="image/svg+xml";
  ".xml"="application/xml; charset=utf-8"; ".txt"="text/plain; charset=utf-8";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg";
  ".webp"="image/webp"; ".gif"="image/gif"; ".ico"="image/x-icon";
  ".woff2"="font/woff2"; ".woff"="font/woff"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try { $listener.Start() } catch { Write-Error "Could not start on $prefix : $_"; exit 1 }
Write-Host "Serving $root at $prefix (Ctrl+C to stop)"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { break }
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $path = Join-Path $root $rel
    # Directory -> index.html
    if (Test-Path $path -PathType Container) { $path = Join-Path $path "index.html" }
    # Clean-URL fallback: /about -> about.html
    if (-not (Test-Path $path) -and -not [IO.Path]::HasExtension($path)) { $path = "$path.html" }

    $full = [IO.Path]::GetFullPath($path)
    if (-not $full.StartsWith([IO.Path]::GetFullPath($root))) {
      $res.StatusCode = 403; $res.Close(); continue
    }
    if (Test-Path $full -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $res.ContentType = $ct
      $bytes = [IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("404 - Not found: $rel")
      $res.OutputStream.Write($b, 0, $b.Length)
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}
