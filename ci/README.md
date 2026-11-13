# CI

`github-workflow.yml` is the GitHub Actions workflow for this repository.

It could not be committed to `.github/workflows/` from the connected GitHub
account, because that account's authorisation lacks the `workflow` scope. To
turn it on, do either of these once:

1. On GitHub: **Add file > Create new file**, name it `.github/workflows/ci.yml`,
   paste the contents of `github-workflow.yml`, commit. Or
2. Reconnect the GitHub connection with the `workflow` scope, then this file can
   be moved into place automatically.

Either way the workflow runs `npm ci`, `npm run check` (fails if `docs/` is
stale against `src/`) and the gameplay tests on every push to `main` and every
pull request.
