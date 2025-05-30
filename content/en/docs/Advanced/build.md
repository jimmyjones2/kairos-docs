---
title: "Build Kairos appliances"
linkTitle: "Build"
weight: 3
description: Learn how to build Kairos images from scratch
---

{{% alert title="Warning" color="warning" %}}

This page is a work in progress!
The feature is experimental and API is likely going to be subject to changes, don't rely on it yet!
{{% /alert %}}

{{% alert title="Note" color="info" %}}
This guide provides detailed information about building Kairos images. For a complete guide on creating custom cloud images, including when and how to use these build methods, see [Creating Custom Cloud Images]({{< ref "creating_custom_cloud_images.md" >}}).
{{% /alert %}}

This documentation section describes how the Kairos Kubernetes Native API extensions can be used to build custom appliances or booting medium for Kairos.

While it's possible to just run Kairos from the artifacts provided by our release process, there are specific use-cases which needs extended customization, for example when
additional kernel modules, or custom, user-defined logic that you might want to embed in the media used for installations.

Note the same can be achieved by using advanced configuration and actually modify the images during installation phase by leveraging the `chroot` stages that takes place in the image - this is discouraged - as it goes in opposite with the "Single Image", "No infrastructure drift" approach of Kairos. The idea here is to create a system from "scratch" and apply that on the nodes - not to run any specific logic on the node itself.

To achieve that, Kairos provides a set of Kubernetes Native Extensions that allow to programmatically generate Installable mediums, Cloud Images and Netboot artifacts. These provide on-demand customization and exploit Kubernetes patterns to automatically provision nodes using control-plane management clusters - however, the same toolset can be used to build appliances for local development and debugging.

The [automated]({{< relref "../installation/automated" >}}) section already shows some examples of how to leverage the Kubernetes Native Extensions and use the Kairos images to build appliances, in this section we will cover and describe in detail how to leverage the CRDs and the Kairos factory to build custom appliances.

## Prerequisites

When building locally, only `docker` is required to be installed on the system. To build with the Kubernetes Native extensions, a Kubernetes cluster is required and `helm` and `kubectl` installed locally. Note [kind](https://github.com/kubernetes-sigs/kind) can be used as well. The Native extensions don't require any special permission, and run completely unprivileged.

### Kubernetes

To build with Kubernetes we need to install the Kairos `osbuilder` controller.

The chart depends on cert-manager. You can install the latest version of cert-manager by running the following commands:

```bash
kubectl apply -f https://github.com/jetstack/cert-manager/releases/latest/download/cert-manager.yaml
kubectl wait --for=condition=Available deployment --timeout=2m -n cert-manager --all
```

Install the Kubernetes charts with `helm`:

```bash
helm repo add kairos https://kairos-io.github.io/helm-charts
helm repo update
helm install kairos-crd kairos/kairos-crds
helm install kairos-osbuilder kairos/osbuilder
```

Among the things deployed by the helm chart, is also an nginx server which is used to
serve the artifact files after they are built. See below for more.

## Build an ISO

To build an ISO, consider the following spec, which provides a hybrid bootable ISO (UEFI/MBR), with the `core` kairos image, adding `helm`:

```yaml
kind: Secret
apiVersion: v1
metadata:
  name: cloud-config
stringData:
  userdata: |
    #cloud-config
    users:
    - name: "kairos"
      passwd: "kairos"
    install:
      device: "auto"
      reboot: true
      poweroff: false
      auto: true # Required, for automated installations
---
kind: OSArtifact
apiVersion: build.kairos.io/v1alpha2
metadata:
  name: hello-kairos
spec:
  imageName: "{{<oci variant="standard">}}"
  iso: true
  bundles:
  # Bundles available at: https://packages.kairos.io/Kairos/
  - quay.io/kairos/packages:helm-utils-3.10.1
  cloudConfigRef:
    name: cloud-config
    key: userdata
  exporters:
    - template:
        spec:
            restartPolicy: Never
            containers:
            - name: upload
              image: quay.io/curl/curl
              command:
              - /bin/sh
              args:
              - -c
              - |
                  for f in $(ls /artifacts)
                  do
                  curl -T /artifacts/$f http://osartifactbuilder-operator-osbuilder-nginx/upload/$f
                  done
              volumeMounts:
              - name: artifacts
                mountPath: /artifacts
```

Apply the manifest with `kubectl apply`.

Note, the CRD allows to specify a custom Cloud config file, [check out the full configuration reference]({{< relref "../reference/configuration" >}}).

As mentioned above, there is an nginx server that will serve the built artifacts as soon as they are ready.
By default, it is exposed with a `NodePort` type of service. Use the following commands
to get its URL:

The controller will create a pod that builds the ISO ( we can follow the process by tailing to the containers log ) and later makes it accessible to its own dedicated service (nodeport by default):

```bash
$ PORT=$(kubectl get svc osartifactbuilder-operator-osbuilder-nginx -o json | jq '.spec.ports[0].nodePort')
$ curl http://<node-ip>:$PORT/hello-kairos.iso -o output.iso
```
## Netboot artifacts

It is possible to use the CRD to prepare artifacts required for netbooting, by enabling `netboot: true` for instance:

```yaml
kind: OSArtifact
metadata:
  name: hello-kairos
spec:
  imageName: "{{<oci variant="core">}}"
  netboot: true
  netbootURL: ...
  bundles: ...
  cloudConfig: ...
  exporters: ...
```

## Build a Cloud Image

Cloud images are images that automatically boots into recovery mode and can be used to deploy whatever image you want to the VM. 
Custom user-data from the Cloud provider is automatically retrieved, additionally the CRD allows to embed a custom cloudConfig so that we can use to make configuration permanent also for VM images running outside a cloud provider.

A Cloud Image boots in QEMU and also in AWS, consider:

```yaml
kind: Secret
apiVersion: v1
metadata:
  name: cloud-config
stringData:
  userdata: |
    #cloud-config
    users:
    - name: "kairos"
      passwd: "kairos"
    name: "Default deployment"
    stages:
      boot:
      - name: "Repart image"
        layout:
          device:
            label: COS_RECOVERY
          add_partitions:
            - fsLabel: COS_STATE
              size: 16240 # At least 16gb
              pLabel: state
      - name: "Repart image"
        layout:
          device:
            label: COS_RECOVERY
          add_partitions:
            - fsLabel: COS_PERSISTENT
              pLabel: persistent
              size: 0 # all space
      - if: '[ -f "/run/cos/recovery_mode" ] && [ ! -e /usr/local/.deployed ]'
        name: "Deploy kairos"
        commands:
          - kairos-agent --debug reset --unattended
          - touch /usr/local/.deployed
          - reboot
---
apiVersion: build.kairos.io/v1alpha1
kind: OSArtifact
metadata:
  name: hello-kairos
spec:
  imageName: "{{<oci variant="core">}}"
  cloudImage: true
  cloudConfigRef:
    name: cloud-config
    key: userdata
```

Note: Since the image come with only the `recovery` system populated, we need to apply a cloud-config similar to this one which tells which container image we want to deploy.
The first steps when the machine boots into is to actually create the partitions needed to boot the active and the passive images, and its populated during the first boot.

After applying the spec, the controller will create a Kubernetes Job which runs the build process and
then copy the produced `hello-kairos.raw` file to the nginx server (see above). Alternatively you may configure your own job to copy the content elsewhere. This file is an EFI bootable raw disk, bootable in QEMU and compatible with AWS which automatically provisions the node:

```bash
$ PORT=$(kubectl get svc osartifactbuilder-operator-osbuilder-nginx -o json | jq '.spec.ports[0].nodePort')
$ curl http://<node-ip>:$PORT/hello-kairos.raw -o output.raw
```

Note, in order to use the image with QEMU, we need to resize the disk at least to 32GB, this can be done with the CRD by setting `diskSize: 32000` or by truncating the file after downloading:

```bash
truncate -s "+$((32000*1024*1024))" hello-kairos.raw 
```

This is not required if running the image in the Cloud as providers usually resize the disk during import or creation of new instances.

To run the image locally with QEMU we need `qemu` installed in the system, and we need to be able to run VMs with EFI, for example:

```bash
qemu-system-x86_64 -m 2048 -bios /usr/share/qemu/ovmf-x86_64.bin -drive if=virtio,media=disk,file=output.raw
```

### Use the Image in AWS

To consume the image, copy it into an s3 bucket:

```bash
aws s3 cp <cos-raw-image> s3://<your_s3_bucket>
```

Create a `container.json` file referring to it:

```json
{
"Description": "Kairos custom image",
"Format": "raw",
"UserBucket": {
  "S3Bucket": "<your_s3_bucket>",
  "S3Key": "<cos-raw-image>"
}
}
```

Import the image:

```bash
aws ec2 import-snapshot --description "Kairos custom image" --disk-container file://container.json
```

Follow the procedure described in [AWS docs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/creating-an-ami-ebs.html#creating-launching-ami-from-snapshot) to register an AMI from snapshot. Use all default settings except for the firmware, set to force to UEFI boot.

Since release v3.3.0, Kairos release pipeline is pushing a public image to AWS, which you can use. Read how to deploy Kairos using an AMI (the released or a custom one), in the [relevant page]({{< relref "../installation/aws" >}}).

### Use the Image in OpenStack

First get the generated image:
```bash
$ PORT=$(kubectl get svc osartifactbuilder-operator-osbuilder-nginx -o json | jq '.spec.ports[0].nodePort')
$ curl http://<node-ip>:$PORT/hello-kairos.raw -o output.raw
```

Import the image to Glance:

```bash
osp image create hello-kairos-image --property hw_firmware_type='uefi' --file ./hello-kairos.raw
```

Image could be used to create an OpenStack instance.

Set the property to force to UEFI boot. If not kairos won't be able to start and you could be prompted endlessly by :

```bash
Booting from hard drive...
```



## Build a Cloud Image for Azure

Similarly we can build images for Azure, consider:

```yaml
apiVersion: build.kairos.io/v1alpha1
kind: OSArtifact
metadata:
  name: hello-kairos
spec:
  imageName: "{{<oci variant="core">}}"
  azureImage: true
  ...
```

Will generate a compressed disk `hello-kairos-azure.vhd` ready to be used in Azure.

```bash
$ PORT=$(kubectl get svc osartifactbuilder-operator-osbuilder-nginx -o json | jq '.spec.ports[0].nodePort')
$ curl http://<node-ip>:$PORT/hello-kairos-azure.vhd -o output.vhd
```

### How to use the image in Azure

Upload the Azure Cloud VHD disk in  `.vhda`  format to your bucket:

```bash
az storage copy --source <cos-azure-image> --destination https://<account>.blob.core.windows.net/<container>/<destination-azure-image>
```

Import the disk:

```bash
az image create --resource-group <resource-group> --source https://<account>.blob.core.windows.net/<container>/<destination-azure-image> --os-type linux --hyper-v-generation v2 --name <image-name>
```

Note:  There is currently no way of altering the boot disk of an Azure VM via GUI, use the `az` to launch the VM with an expanded OS disk if needed

## Build a Cloud Image for GCE


Similarly we can build images for GCE, consider:

```yaml
apiVersion: build.kairos.io/v1alpha1
kind: OSArtifact
metadata:
  name: hello-kairos
spec:
  imageName: "{{<oci variant="core">}}"
  gceImage: true
  ...
```

Will generate a compressed disk `hello-kairos.gce.raw.tar.gz` ready to be used in GCE.

```bash
$ PORT=$(kubectl get svc osartifactbuilder-operator-osbuilder-nginx -o json | jq '.spec.ports[0].nodePort')
$ curl http://<node-ip>:$PORT/hello-kairos.gce.raw.tar.gz -o output.gce.raw.tar.gz
```

### How to use the image in GCE

To upload the image in GCE (compressed):

```bash
gsutil cp <cos-gce-image> gs://<your_bucket>/
```

Import the disk:

```bash
gcloud compute images create <new_image_name> --source-uri=<your_bucket>/<cos-gce-image> --guest-os-features=UEFI_COMPATIBLE
```

See [here how to use a cloud-init with Google cloud](https://cloud.google.com/container-optimized-os/docs/how-to/create-configure-instance#using_cloud-init_with_the_cloud_config_format).
