# Releasing to npm

Releases are published from GitHub Actions through npm trusted publishing. The workflow uses short-lived OIDC credentials and produces npm provenance. An `NPM_TOKEN` secret is needed only to bootstrap the package's first publish because npm does not yet have a package settings page on which to configure the trusted publisher.

## One-time npm configuration

In the npm settings for `@figranium/sdk`, add a GitHub Actions trusted publisher with:

- Organization: `figranium`
- Repository: `figranium-js`
- Workflow filename: `publish.yml`
- Allowed action: `npm publish`
- Environment: leave empty

The package does not currently exist on npm, so bootstrap the first release as follows:

1. Create a granular npm access token that can publish packages under the `@figranium` scope and can bypass 2FA for automation.
2. Add it temporarily to the GitHub repository as an Actions secret named `NPM_TOKEN`.
3. Complete the normal release process below. The workflow's `--provenance` flag and OIDC permission produce provenance for this token-authenticated first publish.
4. Configure the trusted publisher using the values above.
5. Delete the `NPM_TOKEN` repository secret. Later publishes authenticate through OIDC.

The npm CLI checks for trusted-publishing OIDC credentials before falling back to `NODE_AUTH_TOKEN`, so the same workflow supports both the bootstrap release and later tokenless releases.

## Release process

1. Update the version in `package.json` and `package-lock.json`.
2. Update `CHANGELOG.md`.
3. Merge the version change into `main`.
4. Create and publish a GitHub release whose tag matches the package version, such as `v0.1.0`.
5. Confirm the `Publish package to npm` workflow succeeds.
6. Verify the npm package page shows provenance for the released version.

The workflow performs a clean install, strict typecheck, tests, and package build before publishing. Published npm versions are immutable, so a failed or incorrect release must be followed by a new version.
