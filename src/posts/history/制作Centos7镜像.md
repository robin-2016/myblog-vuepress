---
icon: pen-to-square
date: 2019-04-08
category:
  - Image
tag:
  - OpenStack
  - Image
  - 运维
  - KVM
---

# 制作Centos7镜像

创建镜像目录，创建镜像文件，安装系统

```bash
mkdir /home/vms/centos7-image1

qemu-img create -f qcow2 /home/vms/centos7/centos7.qcow2 10G

virt-install --virt-type kvm --name centos7 --ram 2048 --disk /home/vms/centos7/centos7.qcow2,format=qcow2 --network network=default --graphics vnc,listen=0.0.0.0 --noautoconsole --os-type=linux --os-variant=centos7.0 --location=/home/iso/CentOS-7-x86_64-Minimal-1810.iso
```

安装系统：
只要一个根分区，存储驱动选择Virtio Block Device，设置时区，关闭kdump，网络开启dhcp

优化：
安装epel源

```bash
yum install epel-release
yum update
yum groupinstall -y 'Development Tools'
yum install vim wget ntp
```

关闭防火墙和selinux，配置ntp时间同步

```bash
systemctl stop firewalld
systemctl disable firewalld
systemctl start ntpd
systemctl enable ntpd
sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
```

安装电源管理服务

```bash
yum install acpid
systemctl start acpid.service
systemctl enable acpid.service
```

配置启动日志显示

```bash
vim /etc/default/grub
删除 rhgb quiet 增加 console=tty0 console=ttyS0,115200n8
grub2-mkconfig -o /boot/grub2/grub.cfg
```

禁用zeroconf 路由,Disable the zeroconf route

```bash
echo "NOZEROCONF=yes" >> /etc/sysconfig/network
```

安装配置qemu-guest-agent

```bash
yum install -y qemu-guest-agent
vim /etc/sysconfig/qemu-ga
#增加下面的配置
BLACKLIST_RPC=guest-file-open,guest-file-close,guest-file-read,guest-file-write,guest-file-seek,guest-file-flush,guest-exec,guest-exec-status
```

安装配置cloud 软件包

```bash
yum install cloud-init cloud-utils cloud-utils-growpart
useradd -u 1000 centos -s /sbin/nologin
vim /etc/cloud/cloud.cfg
system_info:
     default_user:
         name: centos
```

弹出cdrom

```bash
virsh attach-disk --type cdrom --mode readonly centos7 "" hda
```

封装镜像

```bash
yum install libguestfs-tools
virt-sysprep -d centos7
virsh undefine centos7
```

压缩镜像

```bash
virt-sparsify --compress centos7.qcow2 CentOS-7-x86_64.qcow2
```

上传镜像

```bash
openstack image create --file CentOS-7-2019.04.08.qcow2 --container-format bare --disk-format qcow2 --public Centos-7
```