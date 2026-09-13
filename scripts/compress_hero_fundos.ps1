# Compress fundo_*.png in place to <= 500KB (keep .png names)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$imgDir = Join-Path $PSScriptRoot '..\apps\www\public\images' | Resolve-Path
# When run from Windows against WSL share:
if (-not (Test-Path (Join-Path $imgDir 'fundo_busca.png'))) {
  $imgDir = '\\wsl.localhost\Ubuntu-24.04\app\netsys-apps\cac\apps\www\public\images'
}
$target = 512000
$maxW = 1920
$files = @(Get-ChildItem -Path $imgDir -Filter 'fundo_*.png')
Write-Host "DIR=$imgDir"
Write-Host 'BEFORE:'
foreach ($f in $files) { Write-Host ("  {0}: {1} bytes" -f $f.Name, $f.Length) }

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

foreach ($f in $files) {
  $raw = [System.IO.File]::ReadAllBytes($f.FullName)
  $msIn = New-Object System.IO.MemoryStream(,$raw)
  $src = [System.Drawing.Bitmap]::FromStream($msIn)
  $msIn.Dispose()
  $w = $src.Width; $h = $src.Height
  $baseW = [Math]::Min($w, $maxW)
  $baseH = if ($w -gt $maxW) { [int]($h * $maxW / $w) } else { $h }

  $outBytes = $null
  $meta = ''
  # Photographic heroes: encode as high-quality JPEG then re-wrap as PNG is huge.
  # Instead produce a valid PNG via palette reduction after resize.
  # If still too big, also try writing JPEG bytes into .png path is invalid —
  # so we keep reducing.
  $scales = @(1.0, 0.85, 0.75, 0.65, 0.55, 0.45)
  foreach ($sc in $scales) {
    $nw = [Math]::Max(1, [int]($baseW * $sc))
    $nh = [Math]::Max(1, [int]($baseH * $sc))
    $frame = New-Object System.Drawing.Bitmap $nw, $nh
    $g = [System.Drawing.Graphics]::FromImage($frame)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $nw, $nh)
    $g.Dispose()

    # First try JPEG-to-memory then load and save PNG (still large). Prefer 8bpp clone.
    $candidates = @()
    $msRgb = New-Object System.IO.MemoryStream
    $frame.Save($msRgb, [System.Drawing.Imaging.ImageFormat]::Png)
    $candidates += ,@('rgb', $msRgb.ToArray())
    $msRgb.Dispose()

    try {
      $pal = $frame.Clone([System.Drawing.Rectangle]::new(0,0,$nw,$nh), [System.Drawing.Imaging.PixelFormat]::Format8bppIndexed)
      $ms8 = New-Object System.IO.MemoryStream
      $pal.Save($ms8, [System.Drawing.Imaging.ImageFormat]::Png)
      $candidates += ,@('8bpp', $ms8.ToArray())
      $ms8.Dispose()
      $pal.Dispose()
    } catch {}

    # Also try JPEG quality ladder saved as temporary approach for size probe —
    # final output must remain PNG. Use JPEG only to decide scale, not as output.
    foreach ($pair in $candidates) {
      $label = $pair[0]; $cand = $pair[1]
      Write-Host ("  try {0} {1}x{2} {3}: {4} bytes" -f $f.Name, $nw, $nh, $label, $cand.Length)
      if ($cand.Length -le $target) {
        $outBytes = $cand
        $meta = "{0}x{1} {2}" -f $nw, $nh, $label
        break
      }
    }
    $frame.Dispose()
    if ($null -ne $outBytes) { break }
  }

  $src.Dispose()
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()

  if ($null -eq $outBytes) {
    # Last resort: save as JPEG file alongside, but user asked png-only.
    # Force very small 8bpp
    throw "Failed to compress $($f.Name) under $target as PNG"
  }

  $tmp = $f.FullName + '.tmp'
  [System.IO.File]::WriteAllBytes($tmp, $outBytes)
  Move-Item -LiteralPath $tmp -Destination $f.FullName -Force
  $after = (Get-Item -LiteralPath $f.FullName).Length
  Write-Host ("  wrote {0}: {1} -> {2} ({3})" -f $f.Name, $raw.Length, $after, $meta)
}

Write-Host 'AFTER:'
Get-ChildItem -Path $imgDir -Filter 'fundo_*.png' | ForEach-Object { Write-Host ("  {0}: {1} bytes" -f $_.Name, $_.Length) }
