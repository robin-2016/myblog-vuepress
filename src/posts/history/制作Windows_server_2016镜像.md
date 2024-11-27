---
icon: pen-to-square
date: 2019-04-23
category:
  - Image
tag:
  - OpenStack
  - Image
  - 运维
  - KVM
---

# 制作Windows server 2016镜像

先介绍一下总体思路：由于virtio-win.iso和系统安装镜像都是iso格式的，不能添加两个光驱，cdrom无法热添加，先使用普通驱动进行系统安装，添加virtio驱动的磁盘和网卡，更新之前安装设备网卡驱动，可以删除后来添加的设备，也可以删除安装系统时使用的设备，再进行系统优化。

安装系统：

```bash
virt-install --name winserver2016 --memory 8192 --vcpus 4 --network network=default --disk path=ws2016.qcow2,format=qcow2,device=disk --cdrom /home/iso/cn_windows_server_2016_updated_feb_2018_x64_dvd_11636703.iso --graphics vnc,listen=0.0.0.0 --virt-type kvm --os-type windows --os-variant win2k16
```

使用vnc远程连接安装系统

```bash

#弹出系统镜像，添加virtio-win.iso（下载地址可以到下面的参考链接中找到）
virsh attach-disk winserver2016 /home/iso/virtio-win.iso –type cdrom –mode readonly –target ide

#添加新磁盘，磁盘的virtio类型的驱动在virtio-win.iso的violator目录中
virsh attach-disk winserver2016 –source /home/vms/winserver2016/ws2016-test.qcow2 –target vdb –targetbus=virtio –persistent –driver qemu –subdriver qcow2

#添加网卡，网卡驱动在NetKVM目录中
virsh attach-interface winserver2016 –type bridge –source virbr0 –model virtio
```

登录后操作：
更新所有磁盘和网卡的驱动

系统优化：
关闭防火墙
安装telnet客户端
开启远程桌面
组策略：关机：允许系统在未登录的情况下关闭
系统更新

安装QEMU guest agent

```bash
virsh edit winserver2016
```

添加如下内容

```xml
<channel type='unix'>
  <source mode='bind' path='/var/lib/libvirt/qemu/win7x86.agent'/>
  <target type='virtio' name='org.qemu.guest_agent.0'/>
  <address type='virtio-serial' controller='0' bus='0' port='1'/>
</channel>
<channel type='spicevmc'>
  <target type='virtio' name='com.redhat.spice.0'/>
  <address type='virtio-serial' controller='0' bus='0' port='2'/>
</channel>
```

通过virsh 重新启动，这样才会重读xml文件

更新驱动（其中一个是设备管理中未识别的）

两个驱动：Balloon vioserial

要允许Cloudbase-Init在实例引导期间运行脚本，请将PowerShell执行策略设置为不受限制：

```powershell

C:\Set-ExecutionPolicy Unrestricted

#下载并安装Cloudbase-Init：

C:\Invoke-WebRequest -UseBasicParsing https://cloudbase.it/downloads/CloudbaseInitSetup_Stable_x64.msi -OutFile cloudbaseinit.msi

C:.\cloudbaseinit.msi
```

在配置选项窗口中，更改以下设置：

用户名： Administrator

要配置的网络适配器： Red Hat VirtIO Ethernet Adapter

用于记录的串行端口： COM1

安装完成后，在“ 完成Cloudbase-Init安装向导”窗口中，选中“ 运行Sysprep”和“ 关闭” 复选框，然后单击“ 完成”。

```bash
#压缩镜像
virt-sparsify –compress ws2016.qcow2 Winserver2016.qcow2

#上传镜像 可修改密码参数–property hw_qemu_guest_agent=yes
openstack image create –file Winserver2016.qcow2 –container-format bare –disk-format qcow2 –public –property hw_qemu_guest_agent=yes Winserver2016

#可能会用到重置密码
virsh set-user-password instance –user administrator –password password
```

这样镜像就制作完成了。

OpenStack官方镜像制作2012参考：

[https://docs.openstack.org/image-guide/create-images-manually-example-windows-image.html](https://docs.openstack.org/image-guide/create-images-manually-example-windows-image.html)