This is Interact Frontend  created by Daniel Kravec

To build Docker Image:
$ docker build -t novapro/interact .

To Run/Test localy:
$ docker run --name interact -d novapro/interact:latest

To Stop test (get container_id from docker ps):
$ docker stop <container_id>

To Login Into Registry (SHould only have to do once ever):
$ docker login registry.xnet.com:5000

To push image to registry:
$ docker tag novapro/interact registry.xnet.com:5000/novapro/interact:latest
$ docker push registry.xnet.com:5000/novapro/interact


Registry Format:
// Eg: registry.xnet.com:5000/daniel/novapro/homepage_test:latest

Docker Tag Standard:
 is the latest master master build (used for production)
 is the latest non master branch build
<COMMIT_SHA> Images are tagged with its  matching commit IDs