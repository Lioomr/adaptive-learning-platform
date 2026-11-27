# Deployment

Vercel root: `Notch-Demo/frontend`; production branch: `main`. Request Integration Lead approval and verify the intended Vercel project and GitHub integration before enabling production deployment. PR previews and automatic production deployment are intended, not configured or verified. Keep optional AI credentials server-side; no provider is configured. Before presentation, freeze approved changes and verify reset and fallback behavior. Never assume an existing URL is connected.

## Verified state (27 November 2026)

The Vercel project `notch-demo` (team lioomr) is connected to `Lioomr/adaptive-learning-platform`. Pushes to `main` create production deployments, and the earlier ones from `main` reached READY. The project builds from `Notch-Demo/frontend`; the folder name must not contain spaces because Vercel rejects such function names. The Vercel Deployment Protection setting is on, so preview URLs ask for a Vercel sign-in. A stray untracked `Notch Demo/` folder (old build output) is not part of the repository and must not be committed.
