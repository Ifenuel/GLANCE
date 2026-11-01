param([double]$Rate = -1, [double]$TargetGain = 1.9)
# Re-render the seven broadcast narration clips with Windows SAPI, then
# loudness-scale the PCM so the read sits well above the score in the
# mix. The rate is chosen to fit every line inside its scene's cut:
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Rate = [int]$Rate
$voice.Volume = 100

# Pick the best installed English voice, preferring a female newsroom read.
$preferred = @("Microsoft Zira Desktop", "Microsoft Zira", "Microsoft Aria Desktop", "Microsoft Aria")
foreach ($name in $preferred) {
  try {
    $voice.SelectVoice($name)
    break
  } catch { }
}
Write-Host ("Using voice: " + $voice.Voice.Name + " · rate " + $voice.Rate)

$lines = [ordered]@{
  # Scene windows are: signal 5.4s, manifesto 6.6s, nameplate 6.6s,
  # work 7.8s, numbers 7.0s, footprint 5.2s, outro runs to the film's
  # end. Every line is kept ~1s shorter than its window so the read
  # never bleeds past the scene cut.
  "signal"    = "GLANCE. Look around you."
  "manifesto" = "Nigeria's next generation is not waiting for permission. It is organising."
  "nameplate" = "Governance, leadership and national civic engagement. One movement."
  "work"      = "Thirty weeks of character, mentorship and public service."
  "numbers"   = "Thousands of young leaders, campus by campus."
  "footprint" = "From Lagos to Maiduguri, the map keeps growing."
  "outro"     = "GLANCE. Join the movement."
}

$outDir = "public/broadcast"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

foreach ($entry in $lines.GetEnumerator()) {
  $name = $entry.Key
  $text = $entry.Value
  $tmp = Join-Path $env:TEMP ("glance-tts-" + $name + ".wav")
  $out = Join-Path $outDir ($name + ".wav")
  $voice.Speak($text) | Out-Null
  $voice.SetOutputToWaveFile($tmp)
  $voice.Speak($text) | Out-Null
  $voice.SetOutputToNull()

  # Read the wav, scale the PCM samples to the target gain, write it back.
  $bytes = [System.IO.File]::ReadAllBytes($tmp)
  $count = [Math]::Floor(($bytes.Length - 44) / 2)
  $peak = 0
  for ($i = 0; $i -lt $count; $i++) {
    $s = [BitConverter]::ToInt16($bytes, 44 + ($i * 2))
    if ([Math]::Abs($s) -gt $peak) { $peak = [Math]::Abs($s) }
  }
  $gain = $TargetGain
  if ($peak -gt 0) {
    $maxGain = 32767.0 / $peak * 1.0
    $gain = [Math]::Min($TargetGain, $maxGain)
  }
  for ($i = 0; $i -lt $count; $i++) {
    $s = [BitConverter]::ToInt16($bytes, 44 + ($i * 2)) * $gain
    if ($s -gt 32767) { $s = 32767 } elseif ($s -lt -32768) { $s = -32768 }
    [BitConverter]::GetBytes([Convert]::ToInt16($s)).CopyTo($bytes, 44 + ($i * 2))
  }
  [System.IO.File]::WriteAllBytes($out, $bytes)
  Remove-Item $tmp -ErrorAction SilentlyContinue
  Write-Host ("Rendered " + $out + "  peak " + $peak + "  gain " + [Math]::Round($gain, 2))
}
$voice.Dispose()
Write-Host "Done."
