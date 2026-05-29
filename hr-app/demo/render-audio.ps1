param(
  [string]$ScenesJson = "$PSScriptRoot\scenes.json",
  [string]$OutDir = "$PSScriptRoot\audio"
)

# Reads scenes.json, calls ElevenLabs TTS for each scene's narration,
# writes scene-<id>.mp3 to the output folder, and prints duration via ffprobe.
# Idempotent: skips a scene if the mp3 already exists and the text hasn't changed
# (cache key = sha256(narration) stored alongside the mp3 as <id>.sha).

if (-not $env:XI_API_KEY) { throw 'XI_API_KEY env var not set' }
if (-not $env:VOICE_ID)   { throw 'VOICE_ID env var not set'   }

New-Item -ItemType Directory -Force $OutDir | Out-Null

$scenes = Get-Content $ScenesJson -Raw | ConvertFrom-Json
$total = $scenes.Count
$i = 0
$totalDuration = 0

foreach ($scene in $scenes) {
  $i++
  $id = $scene.id
  $text = $scene.narration
  $mp3 = Join-Path $OutDir "$id.mp3"
  $sha = Join-Path $OutDir "$id.sha"

  # Compute hash of the narration text to detect content changes
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  $hash = ($sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text)) | ForEach-Object { $_.ToString('x2') }) -join ''
  $sha256.Dispose()

  $cached = (Test-Path $mp3) -and (Test-Path $sha) -and ((Get-Content $sha -Raw).Trim() -eq $hash)

  if ($cached) {
    Write-Host "[$i/$total] $id  cache hit"
  } else {
    Write-Host "[$i/$total] $id  rendering ($($text.Length) chars)..."
    $body = @{
      text = $text
      model_id = 'eleven_multilingual_v2'
      voice_settings = @{ stability = 0.5; similarity_boost = 0.75; style = 0.0; use_speaker_boost = $true }
    } | ConvertTo-Json -Compress
    # PowerShell 5.1's default body encoding mangles non-ASCII chars (em-dash, smart quotes, etc.)
    # before transmission — ElevenLabs then rejects the malformed JSON with 400.
    # Sending the body as explicit UTF-8 bytes fixes this.
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $headers = @{
      'xi-api-key' = $env:XI_API_KEY
      'Content-Type' = 'application/json; charset=utf-8'
      'Accept' = 'audio/mpeg'
    }
    try {
      Invoke-WebRequest -Uri "https://api.elevenlabs.io/v1/text-to-speech/$env:VOICE_ID" `
        -Method POST -Headers $headers -Body $bodyBytes -OutFile $mp3 -ErrorAction Stop | Out-Null
      Set-Content -Path $sha -Value $hash -NoNewline
    } catch {
      Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
      if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "  $($reader.ReadToEnd())" -ForegroundColor Red
      }
      continue
    }
  }

  # Report duration
  $duration = (& ffprobe -v error -show_entries 'format=duration' -of default=noprint_wrappers=1:nokey=1 $mp3 2>$null).Trim()
  $totalDuration += [double]$duration
  Write-Host "       duration=${duration}s  size=$([math]::Round((Get-Item $mp3).Length/1KB,1))KB"
}

Write-Host ''
Write-Host ("Total runtime: {0:N1}s  ({1:mm\:ss})" -f $totalDuration, ([TimeSpan]::FromSeconds($totalDuration)))
