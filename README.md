# This is Interact Frontend
 created by Daniel Kravec

To build Docker Image:
```
$ docker build -t novapro/interact .
```
```
docker build -t novapro/interact . && docker tag novapro/interact registry.xnet.com:5000/novapro/interact:latest && docker push registry.xnet.com:5000/novapro/interact
```
To Run/Test localy:

```
$ docker run --name interact -d novapro/interact:latest
```

To Stop test (get container_id from docker ps):
```
$ docker stop <container_id>
```

To Login Into Registry (SHould only have to do once ever):
```
$ docker login registry.xnet.com:5000
```

To push image to registry:
```$ docker tag novapro/interact registry.xnet.com:5000/novapro/interact:latest
$ docker push registry.xnet.com:5000/novapro/interact
```

Registry Format:
// Eg: registry.xnet.com:5000/daniel/novapro/homepage_test:latest

Docker Tag Standard:
 is the latest master master build (used for production)
 is the latest non master branch build
<COMMIT_SHA> Images are tagged with its  matching commit IDs

---

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
