
---
title: "Welcome"
linkTitle: "Documentation"
weight: 20
menu:
  main:
    weight: 20
---

{{% alert title="Known Issues" color="warning" %}}
- Kairos user ids change on upgrade, breaking ssh login [#2797](https://github.com/kairos-io/kairos/issues/2797)
- Long duration hang during boot [#2802](https://github.com/kairos-io/kairos/issues/2802)
- RPi EFI booting no longer supported on kernels shipped with Ubuntu 24.04+ [#2249](https://github.com/kairos-io/kairos/issues/2249)
- RPi Alpine is a bit slow to sync the date on boot
{{% /alert %}}

{{% alert title="Deprecation Warnings" color="primary" %}}
Starting on v3.5.0, reading of `/etc/elemental/config.yaml` will be deprecated. Use `/etc/kairos/config.yaml` instead. [#2233](https://github.com/kairos-io/kairos/issues/2233)
{{% /alert %}}

{{% alert title="Remarkable Changes" color="info" %}}
By default, Uki artifacts (identified by the `-uki` suffix) no longer include Linux modules and firmware in the image. Real-world testing has shown that many EFI firmwares are very particular about the size of the EFI image, often refusing to boot if the file exceeds 300-400MB. Given the wide variety of EFI firmware implementations, predicting whether a UKI EFI file will boot on different hardware is challenging.

To enhance compatibility, we decided to slim down the UKI files by removing the largest components: the Linux modules and firmware packages. This results in EFI files around 200-300MB, which are much more likely to boot correctly across various EFI implementations.

However, this change comes with a trade-off. Smaller images, while being more compatible with a wide range of EFI firmwares, may lack comprehensive hardware support because they do not include all the Linux modules and firmware packages. This means that certain hardware components may not function correctly or optimally when using these slimmer UKI images.

On the other hand, larger UKI images, which include all necessary modules and firmware for extensive hardware support, provide better functionality and compatibility with a broad range of hardware. However, these larger images are more likely to encounter boot issues due to EFI firmware limitations, as many EFI implementations refuse to boot files larger than 300-400MB.

We publish `-uki` artifacts ourselves, which are the slimmed versions, as examples of how to build a slimmer UKI artifact. **While these serve as a reference, we recommend always building your own custom images to tailor them to your specific hardware needs.** If you need to include those packages for full hardware support, you can create a custom artifact to add them back, as detailed in the Kairos docs.

We recommend keeping your UKI EFI files as small as possible to maximize boot success across different EFI firmware implementations. While smaller images offer better compatibility, they may lack full hardware support. Conversely, larger images, which include all necessary modules and firmware, provide comprehensive hardware support but may fail to boot due to EFI firmware constraints.
{{% /alert %}}

Welcome to the Kairos {{< kairosVersion >}} Documentation

Kairos is the open-source project that simplifies Edge, cloud, and bare metal OS lifecycle management. With a unified Cloud Native API, Kairos is community-driven, open source, and distro agnostic.

Our key features include:

- [Immutability]({{< relref "architecture/immutable" >}}): ensure your infrastructure stays consistent with atomic upgrades
- Security: protect your cluster from vulnerabilities and attacks with a read-only system
- [Container-based]({{< relref "architecture/container" >}}): manage your nodes as apps in containers for maximum flexibility and portability
- [P2P Mesh]({{< relref "architecture/network" >}}): self-coordinated, automated, no interaction Kubernetes deployments with P2P
- [Meta-Distribution]({{< relref "architecture/meta" >}}), distro agnostic


In this documentation, you will find everything you need to know about Kairos, from installation and configuration, to examples and advanced features.

To get started with Kairos, follow the instructions in the [quickstart]({{< relref "Getting started" >}}) guide. Then, check out the [examples]({{< relref "examples" >}}) to see how Kairos can be used in real-world scenarios.

For more information, please refer to this documentation. If you have any questions or feedback, feel free to [open an issue](https://github.com/kairos-io/kairos/issues/new) or [join our community forum](https://github.com/kairos-io/kairos/discussions).

{{% alert title="Note" %}}
You can also find some good resources on the [Media Section]({{< relref "media" >}} "Media")
{{% /alert %}}

## What is Kairos ?

Kairos is a cloud-native meta-Linux distribution that runs on Kubernetes and brings the power of the public cloud to your on-premises environment. With Kairos, you can build your own cloud with complete control and no vendor lock-in.

Here are a few reasons why you should try Kairos:

- Build your own cloud on-premises with complete control and no vendor lock-in
- Provision nodes with your own image or use Kairos releases for added flexibility
- Use Kairos for a wide range of use cases, from Kubernetes applications to appliances and more
- Simple and streamlined day-2 operations (e.g. node upgrades)

## What I can do with it ?

With Kairos, you can easily spin up a Kubernetes cluster with the Linux distribution of your choice, and manage the entire cluster lifecycle with Kubernetes. Try Kairos today and experience the benefits of a unified, cloud-native approach to OS management.

With Kairos, you can:

- Spin up a Kubernetes cluster with any Linux distribution in just a few clicks
- Create an immutable infrastructure that stays consistent and free of drift with atomic upgrades
- Manage your cluster's entire lifecycle with Kubernetes, from building to upgrading
- Automatically create multi-node, single clusters that spans across regions for maximum flexibility and scalability

Try Kairos today and experience the benefits of a unified, cloud-native approach to OS management. Say goodbye to the hassle of managing multiple systems, and hello to a more streamlined and efficient way of working.

## Features

- Easily create multi-node Kubernetes clusters with [K3s](https://k3s.io), and enjoy all of [K3s](https://k3s.io)'s features
- Upgrade manually via CLI or with Kubernetes, and use container registries for distribution upgrades
- Enjoy the benefits of an immutable distribution that stays configured to your needs
- Configure nodes with a single cloud-init config file for added simplicity
- Upgrade even in airgap environments with in-cluster container registries
- Extend your image at runtime or build time with Kubernetes Native APIs
- Coming soon: CAPI support with full device lifecycle management and more
- Create private virtual network segments with a full-mesh P2P hybrid VPN network that can stretch up to 10000 km

## More than a Linux distribution

Kairos is more than just an ISO, qcow2, or Netboot artifact. It allows you to turn any Linux distribution into a uniform and compliant distro with an immutable design. This means that any distro "converted" with Kairos will share the same common feature set and can be managed in the same way using Kubernetes Native API components. Kairos treats all OSes homogeneously and upgrades are distributed via container registries. Installations mediums and other assets required for booting bare metal or edge devices are built dynamically by Kairos' Kubernetes Native API components.

![livecd](https://user-images.githubusercontent.com/2420543/189219806-29b4deed-b4a1-4704-b558-7a60ae31caf2.gif)

## Goals

The Kairos ultimate goal is to bridge the gap between Cloud and Edge by creating a smooth user experience. There are several areas in the ecosystem that can be improved for edge deployments to make it in pair with the cloud.

The Kairos project encompasses all the tools and architectural pieces needed to fill those gaps. This spans between providing Kubernetes Native API components to assemble OSes, deliver upgrades, and control nodes after deployment.

Kairos is distro-agnostic, and embraces openness: The user can provide their own underlying base image, and Kairos onboards it and takes it over to make it Cloud Native, immutable that plugs into an already rich ecosystem by leveraging containers as distribution medium.

## Contribute

Kairos is an open source project, and any contribution is more than welcome! The project is big and narrows to various degrees of complexity and problem space. Feel free to join our chat, discuss in our forums and join us in the Office hours. Check out the [contribution guidelines](https://github.com/kairos-io/kairos/contribute) to see how to get started and our [governance](https://github.com/kairos-io/kairos/blob/master/GOVERNANCE.md).

We have an open roadmap, so you can always have a look on what's going on, and actively contribute to it.

Useful links:

- [Upcoming releases](https://github.com/kairos-io/kairos/issues?q=is%3Aissue+is%3Aopen+label%3Arelease)


## Community

You can find us at:

- [#Kairos-io at matrix.org](https://matrix.to/#/#kairos-io:matrix.org)
- [IRC #kairos in libera.chat](https://web.libera.chat/#kairos)
- [GitHub Discussions](https://github.com/kairos-io/kairos/discussions)

### Project Office Hours

Project Office Hours is an opportunity for attendees to meet the maintainers of the project, learn more about the project, ask questions, learn about new features and upcoming updates.

Office hours are happening weekly on Wednesday - 5:30 – 6:00pm CEST. [Meeting link](https://meet.google.com/aus-mhta-azb)

Besides, we have monthly meetup to participate actively into the roadmap planning and presentation which takes part during the office hours:

#### Roadmap planning

We will discuss on agenda items and groom issues, where we plan where they fall into the release timeline.

Occurring: Monthly on the first Wednesday - 5:30 – 6:30pm CEST. 

#### Roadmap presentation

We will discuss the items of the roadmaps and the expected features on the next releases

Occurring: Monthly on the second Wednesday - 5:30pm CEST.

## Alternatives

There are other projects that are similar to Kairos which are great and worth to mention, and actually Kairos took to some degree inspiration from.
However, Kairos have different goals and takes completely unique approaches to the underlying system, upgrade, and node lifecycle management.

- [k3os](https://github.com/rancher/k3os)
- [Talos](https://github.com/siderolabs/talos)
- [FlatCar](https://flatcar-linux.org/)
- [CoreOS](https://getfedora.org/it/coreos?stream=stable)

## Development

### Building Kairos

Requirements: [Docker](https://www.docker.com/) and [Earthly](https://earthly.dev/).

First we need to clone the repository

```bash
git clone https://github.com/kairos-io/kairos.git
cd kairos
```

Then we can build the ISO with the following command for a Kairos core image based on {{<flavorCode >}}:

```bash
earthly +iso \
  --FAMILY=@family \
  --FLAVOR=@flavor \
  --FLAVOR_RELEASE=@flavorRelease \
  --BASE_IMAGE=@baseImage \
  --MODEL=generic \
  --VARIANT=core
```


## What's next?

See the [quickstart]({{< relref "Getting started" >}}) to install Kairos on a VM and create a Kubernetes cluster!
