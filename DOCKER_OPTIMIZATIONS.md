## Docker build optimizations for constrained servers 🐳🔧

This project includes a BuildKit-friendly `Dockerfile` designed to reduce server load during `npm run build:prod`.

Recommendations when building on a low-resource server:

- Enable BuildKit (speeds repeated builds via cache mounts):

```powershell
$env:DOCKER_BUILDKIT = "1"
docker buildx build --load --progress=plain -t half-baked-fe:optimized .
```

- Control Node heap size used during the build by passing the `NODE_MEM` build arg (MB):

```powershell
# Example: give Node 768MB (useful on very constrained hosts)
$env:DOCKER_BUILDKIT = "1"
docker buildx build --load --progress=plain --build-arg NODE_MEM=768 -t half-baked-fe:optimized .
```

Notes on resource limits:

- `docker buildx` does not accept `--memory`/`--cpus` flags directly in the same way `docker run` does. If you need to limit host resource usage for the build process itself, either:
  - run the build in a separate VM/container with resource caps and a remote builder, or
  - run the build in CI or a dedicated builder host with controlled resources.

- The `Dockerfile` sets `NODE_OPTIONS=--max_old_space_size=${NODE_MEM}` by default (1024MB) and also includes the `build:prod:lowmem` npm script for an extra-safe build invocation.

Extra: local low-memory build (without docker)

```powershell
npm run build:prod:lowmem
```

If you'd like, I can run a test Docker build here and share the output and layer sizes, or I can prepare a CI job to perform the build off-host and only push the final static image to your registry.

## Docker build optimizations for constrained servers 🐳🔧

This project includes a BuildKit-friendly `Dockerfile` designed to reduce server load during `npm run build:prod`.

Recommendations when building on a low-resource server:

- Enable BuildKit (speeds repeated builds via cache mounts):

````bash
DOCKER_BUILDKIT=1 docker build --progress=plain -t half-baked-fe:optimized .

If you want to explicitly limit memory for Node during the Docker build, pass a build-arg
for the Node heap size (MB):

```bash
# Provide 768MB to Node, and limit the docker build step to 3G RAM for the builder process
DOCKER_BUILDKIT=1 docker build --progress=plain --build-arg NODE_MEM=768 --memory=3g -t half-baked-fe:optimized .
````

````

- Limit memory/cpu for the build (keeps server responsive):

```bash
# using docker buildx
DOCKER_BUILDKIT=1 docker buildx build --load --memory=3g --cpus=1.5 -t half-baked-fe:optimized .
````

- The `Dockerfile` uses `NODE_OPTIONS=--max_old_space_size=1024` for the build stage to avoid OOM hangs.
- If your server is still constrained, you can try `--max_old_space_size=768` or run the build off-host (CI) and only ship `build/` into the final image.

Extra: local low-memory build

````bash
# run locally using the package script
npm run build:prod:lowmem

Or on the server, if you prefer passing the memory arg to the Docker build step:

```bash
DOCKER_BUILDKIT=1 docker build --progress=plain --build-arg NODE_MEM=768 --memory=3g -t half-baked-fe:optimized .
````

```

If you'd like, I can:

- run a test Docker build and report layer sizes (if you give me permission to run docker here),
- or prepare a CI job that builds artifacts off-server and pushes the final static image.
```
