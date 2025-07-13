# PowerShell script to start Qdrant vector database using Docker Compose

# Check if Docker is installed
$dockerCheck = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not installed or not in PATH. Please install Docker: https://docs.docker.com/get-docker/" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop or the Docker service." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Qdrant vector database..." -ForegroundColor Cyan

# Start the Qdrant container using Docker Compose
docker-compose up -d qdrant

if ($LASTEXITCODE -eq 0) {
    Write-Host "Qdrant is now running and accessible at:" -ForegroundColor Green
    Write-Host "- REST API: http://localhost:6333" -ForegroundColor Green
    Write-Host "- Web UI: http://localhost:6333/dashboard" -ForegroundColor Green
    Write-Host "- GRPC API: localhost:6334" -ForegroundColor Green
    Write-Host ""
    Write-Host "To stop Qdrant, run: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "Failed to start Qdrant container. Check the error message above." -ForegroundColor Red
} 