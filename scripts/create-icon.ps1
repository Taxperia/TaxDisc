Add-Type -AssemblyName System.Drawing

$size = 512
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 92
$diameter = $radius * 2
$path.AddArc(14, 14, $diameter, $diameter, 180, 90)
$path.AddArc($size - $diameter - 14, 14, $diameter, $diameter, 270, 90)
$path.AddArc($size - $diameter - 14, $size - $diameter - 14, $diameter, $diameter, 0, 90)
$path.AddArc(14, $size - $diameter - 14, $diameter, $diameter, 90, 90)
$path.CloseFigure()

$gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(40, 30)),
  (New-Object System.Drawing.Point(470, 490)),
  ([System.Drawing.Color]::FromArgb(255, 38, 154, 255)),
  ([System.Drawing.Color]::FromArgb(255, 4, 75, 185))
)
$graphics.FillPath($gradient, $path)

$ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(95, 255, 255, 255), 10)
$graphics.DrawPath($ringPen, $path)

$font = New-Object System.Drawing.Font('Segoe UI', 270, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.DrawString('T', $font, $textBrush, (New-Object System.Drawing.RectangleF(0, -10, $size, $size)), $format)

$assetsPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets'
New-Item -ItemType Directory -Path $assetsPath -Force | Out-Null
$outputPath = Join-Path $assetsPath 'icon.png'
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$textBrush.Dispose()
$format.Dispose()
$font.Dispose()
$ringPen.Dispose()
$gradient.Dispose()
$path.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $outputPath
