$status = ""
while ($status -ne "SUCCESS" -and $status -ne "FAILURE" -and $status -ne "TIMEOUT") {
    Start-Sleep -Seconds 10
    $status = (gcloud builds list --project daily-506100 --filter="id=5468e071-8526-4dbe-b92b-527419f92806" --format="value(status)")
}
if ($status -eq "SUCCESS") {
    gcloud run deploy daily --image asia-east1-docker.pkg.dev/daily-506100/daily/web:latest --region asia-east1 --project daily-506100 --allow-unauthenticated
}
