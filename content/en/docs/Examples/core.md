---
title: "Using Kairos Core Images as an Installer"
linkTitle: "Using Kairos Core Images as an Installer"
description: Core images serve as the foundation for creating downstream images or as an installer for deploying other images during the installation process. In this guide, we'll take a closer look at using Kairos core images as an installer to deploy other container images.
---

Kairos is a powerful, open-source meta-distribution that allows you to easily deploy and manage nodes on your Immutable infrastructure.

One key feature of Kairos is the use of its core images, which are released as part of the [kairos-io/kairos](https://github.com/kairos-io/kairos) repository and can be found in the releases section. These core images serve as the foundation for creating [downstream images]({{< relref "../advanced/customizing/" >}}) or as an installer for deploying other images during the installation process. In this guide, we'll take a closer look at using Kairos core images as an installer to deploy other container images.

## Getting started

To begin using Kairos core images as an installer, you'll need to start by using the artifacts from the [Kairos core](https://github.com/kairos-io/kairos/releases) repository. These images do not include the Kubernetes engine, so you'll need to configure the container image you want to deploy in the `install.source` field of your cloud config file. A list of available images can be found in [our support matrix]({{< relref "../reference/image_matrix/" >}}).

For example, let's say you want to use a standard image. Your cloud config file might look something like this:

```yaml
#cloud-config
install:
 # Here we specify the image that we want to deploy
 source: "docker:{{<oci variant="standard">}}"
```

{{% alert title="Note" color="success" %}}
Looking to install from a private registry OCI image? Check the [Private registry auth]({{< relref "../Advanced/private_registry_auth" >}}) page.
{{% /alert %}}


Once you've chosen your image, you can move on to the installation process by following the steps outlined in our [Installation]({{< relref "../installation/" >}}) documentation.

For example, a full cloud-config might look like this:

```yaml
#cloud-config

install:
 device: "auto"
 auto: true
 reboot: true
 # Here we specify the image that we want to deploy
 source: "docker:{{<oci variant="standard">}}"

hostname: "test"
users:
- name: "kairos"
  passwd: "kairos"
  ssh_authorized_keys:
  - github:mudler

k3s:
  enable: true
```

## Configuring the installation

As you move through the installation process, there are a few key points to keep in mind when configuring your cloud config file:

- We set `install.source` to the container image that we want to deploy. This can be an image from [our support matrix]({{< relref "../reference/image_matrix" >}}), a [custom image]({{< relref "../advanced/customizing" >}}) or an [image from scratch]({{< relref "../reference/build-from-scratch" >}}).
- After the installation is complete, the configuration in the `k3s` block will take effect. This is because after the installation, the system will boot into the image specified in the `install.source` field, which in the example above is an image with the Kairos K3s provider, as such the configuration in the k3s block will become active.

With these steps, you should now be able to use Kairos core images as an installer to deploy other container images. The process is straightforward and gives you the flexibility to customize your deployments and build custom images as needed.

You can also refer our [troubleshooting]({{< relref "../reference/troubleshooting" >}}) document if you are facing any issue while following the installation process.
