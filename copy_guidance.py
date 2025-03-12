# Source file
$sourceFile = "data_storage/guidance.md"

# Get all directories in the current directory
$directories = Get-ChildItem -Directory | Where-Object { -not $_.Name.StartsWith(".") } | Select-Object -ExpandProperty Name

Write-Host "Found directories: $directories"

# Copy the file to each directory
foreach ($dir in $directories) {
    $destination = Join-Path -Path $dir -ChildPath "guidance.md"
    
    # Skip if the source and destination are the same
    if ((Resolve-Path $sourceFile).Path -eq (Resolve-Path $destination -ErrorAction SilentlyContinue).Path) {
        Write-Host "Skipping $dir as it already contains the source file"
        continue
    }
    
    try {
        Copy-Item -Path $sourceFile -Destination $destination -Force
        Write-Host "Successfully copied guidance.md to $dir/"
    } catch {
        Write-Host "Error copying to $dir/: $_"
    }
}

# Also copy to the root directory
try {
    Copy-Item -Path $sourceFile -Destination "./guidance.md" -Force
    Write-Host "Successfully copied guidance.md to ./"
} catch {
    Write-Host "Error copying to ./: $_"
} 