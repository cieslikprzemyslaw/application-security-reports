$currentBranch = git branch --show-current
$protectedBranches = @("master", "main", $currentBranch)

$branches = git branch --format="%(refname:short)" |
    Where-Object {
        $_ -and $protectedBranches -notcontains $_
    }

if (-not $branches) {
    Write-Host "No local branches to delete."
    exit 0
}

Write-Host "The following local branches will be deleted:"
$branches | ForEach-Object { Write-Host " - $_" }

$confirmation = Read-Host "Continue? (y/N)"

if ($confirmation -ne "y") {
    Write-Host "Cancelled."
    exit 0
}

foreach ($branch in $branches) {
    git branch -D $branch
}

git fetch --prune

Write-Host "Local branches deleted and remote references pruned."