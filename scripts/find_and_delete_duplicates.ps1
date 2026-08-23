# PowerShell Duplicate Photo Finder & Remover
# Scans C:\Users\tejas (excluding internal AppData/node_modules/.git caches)

$TargetRoot = "C:\Users\tejas"
$ExcludeFolders = @("AppData", "node_modules", ".git", ".gemini", ".vscode", ".cache", "dist", "build", "VirtualBox VMs")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   STARTING DEEP DUPLICATE PHOTO ANALYSIS                 " -ForegroundColor Cyan
Write-Host "   Target Root: $TargetRoot                               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$PhotoFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()

# Gather files safely skipping excluded dirs
Get-ChildItem -Path $TargetRoot -File -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $file = $_
    $skip = $false
    foreach ($ex in $ExcludeFolders) {
        if ($file.FullName -like "*\$ex\*" -or $file.FullName -like "*\$ex") {
            $skip = $true
            break
        }
    }
    if (-not $skip) {
        $ext = $file.Extension.ToLower()
        if ($ext -in @(".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff", ".heic", ".raw", ".cr2", ".nef", ".arw")) {
            if ($file.Length -gt 1024) {
                $PhotoFiles.Add($file)
            }
        }
    }
}

Write-Host "Total Candidate Photos Found: $($PhotoFiles.Count)" -ForegroundColor Yellow

# Step 1: Pre-filter by exact File Size
$SizeGroups = $PhotoFiles | Group-Object -Property Length | Where-Object { $_.Count -gt 1 }
Write-Host "Potential Size Collision Groups: $($SizeGroups.Count)" -ForegroundColor Yellow

$TotalDeletedCount = 0
$TotalReclaimedBytes = [long]0

$Sha256 = [System.Security.Cryptography.SHA256]::Create()

function Get-FileHashString($filePath) {
    try {
        $stream = [System.IO.File]::OpenRead($filePath)
        $hashBytes = $Sha256.ComputeHash($stream)
        $stream.Close()
        $stream.Dispose()
        return [BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
    } catch {
        return $null
    }
}

foreach ($sizeGroup in $SizeGroups) {
    $HashMap = @{}

    foreach ($file in $sizeGroup.Group) {
        $hash = Get-FileHashString $file.FullName
        if ($null -ne $hash) {
            if (-not $HashMap.ContainsKey($hash)) {
                $HashMap[$hash] = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
            }
            $HashMap[$hash].Add($file)
        }
    }

    foreach ($hash in $HashMap.Keys) {
        $filesWithSameHash = $HashMap[$hash]
        if ($filesWithSameHash.Count -gt 1) {
            $sorted = $filesWithSameHash | Sort-Object -Property CreationTime
            $original = $sorted[0]
            $duplicates = $sorted | Select-Object -Skip 1

            $origSizeMB = [Math]::Round($original.Length / 1MB, 2)
            $shortHash = $hash.Substring(0, 16)

            Write-Host "`n[DUPLICATE GROUP MATCHED - SHA256: $shortHash...]" -ForegroundColor Green
            Write-Host "  [KEEPING ORIGINAL] : $($original.FullName) ($origSizeMB MB)" -ForegroundColor White

            foreach ($dup in $duplicates) {
                try {
                    $dupSize = $dup.Length
                    Remove-Item -LiteralPath $dup.FullName -Force -ErrorAction Stop
                    $TotalDeletedCount++
                    $TotalReclaimedBytes += $dupSize
                    Write-Host "  [DELETED DUPLICATE]: $($dup.FullName)" -ForegroundColor Red
                } catch {
                    Write-Host "  [SKIPPED/LOCKED]   : $($dup.FullName)" -ForegroundColor DarkYellow
                }
            }
        }
    }
}

$Sha256.Dispose()

$ReclaimedMB = [Math]::Round($TotalReclaimedBytes / 1MB, 2)
$ReclaimedGB = [Math]::Round($TotalReclaimedBytes / 1GB, 2)

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   DUPLICATE REMOVAL COMPLETE!                            " -ForegroundColor Cyan
Write-Host "   Total Duplicate Photos Removed : $TotalDeletedCount    " -ForegroundColor Green
Write-Host "   Total Disk Space Reclaimed     : $ReclaimedMB MB ($ReclaimedGB GB)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
