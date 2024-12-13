---
icon: pen-to-square
date: 2019-03-30
category:
  - 运维
tag:
  - Ceph
  - 存储
---

# 搭建ceph分布式存储

下面所有操作都是基于ceph的luminous版本进行的
官网安装非常详细，之前我安装这个版本的时候官网文档还未更新，现在官网已更新。下面记录了我安装的一些步骤供大家参考。
最少有一个admin节点，即操作部署节点，两个node存储节点

一、所有节点都操作
1.yum源(注意文件名必须为ceph.repo)

```bash
cat > /etc/yum.repo.d/ceph.repo << EOF
[Ceph]
name=Ceph packages for $basearch
baseurl=http://mirrors.aliyun.com/ceph/rpm-luminous/el7/$basearch
enabled=1
gpgcheck=1
type=rpm-md
gpgkey=https://download.ceph.com/keys/release.asc
priority=1
[Ceph-noarch]
name=Ceph noarch packages
baseurl=http://mirrors.aliyun.com/ceph/rpm-luminous/el7/noarch
enabled=1
gpgcheck=1
type=rpm-md
gpgkey=https://download.ceph.com/keys/release.asc
priority=1
[ceph-source]
name=Ceph source packages
baseurl=http://mirrors.aliyun.com/ceph/rpm-luminous/el7/SRPMS
enabled=1
gpgcheck=1
type=rpm-md
gpgkey=https://download.ceph.com/keys/release.asc
priority=1
EOF
```

2.ntp时间同步
关闭firewall和selinux

3.host解析
192.168.1.128 admin
192.168.1.129 node1
192.168.1.130 node2
192.168.1.131 node3

二、admin 节点操作
1.ssh 信任

```bash
ssh-keygen
ssh-copy-id admin
ssh-copy-id node1
ssh-copy-id node2
ssh-copy-id node3
```

2.使用ceph-deploy进行部署(生产可用，ceph-deploy安装的都是rpm包)

```bash
yum install ceph-deploy python-pip
#创建存放认证文件的目录
mkdir my-cluster
cd my-cluster/
```

3.创建一个集群

```bash
ceph-deploy new node1
```

如果是少于三节点的osd可以在/etc/ceph/ceph.conf中增加下面的配置，默认是三节点osd可用才为active+clean

```
osd pool default size = 2
```

```bash
#安装ceph包
ceph-deploy install admin node1 node2 node3
#mon初始化
ceph-deploy mon create-initial
```

会在当前目录下生成一些认证文件

4.部署osd（使用整个硬盘和使用lvm卷二选一即可，建议使用整个磁盘的方式。）
4.1使用整个硬盘。注意：下面操作会擦除磁盘，谨慎操作

```bash
ceph-deploy disk zap node1 /dev/vdb
ceph-deploy osd create node1 --data /dev/vdb
```

4.2使用lvm卷 经过测试，不太稳定，重启后可能会服务无法自动启动

```bash
ceph-deploy osd create node2 --data /dev/centos/data
ceph-deploy osd create node3 --data /dev/centos/data
```

5.创建mgr

```bash
ceph-deploy mgr create admin
```

6.创建对象网关，使用对象存储时需要进行安装

```bash
ceph-deploy rgw create node2
```

7.创建元数据节点（是为cephFS提供服务的，如果不使用cephFS可以不安装）

```bash
ceph-deploy mds create node3
```

8.执行ceph -s 查看集群的健康状态

执行前需要把ceph.client.admin.keyring复制到/etc/ceph目录下

```bash
cp ceph.client.admin.keyring /etc/ceph/
```

用 ceph-deploy 把配置文件和 admin 密钥拷贝到管理节点和 Ceph 节点，这样你每次执行 Ceph 命令行时就无需指定 monitor 地址和 ceph.client.admin.keyring 了。（如果只在admin节点查看，无需操作）

```bash
ceph-deploy admin admin-node node1 node2 node3
```

查看存储池

```bash
ceph osd lspools
```

9.创建存储池

```bash
ceph osd pool create test 128
```

test为存储池名称，128为pg_unm的值，归置组计算方式如下:

少于 5 个 OSD 时可把 pg_num 设置为 128

OSD 数量在 5 到 10 个时，可把 pg_num 设置为 512

OSD 数量在 10 到 50 个时，可把 pg_num 设置为 4096

OSD 数量大于 50 时，你得理解权衡方法、以及如何自己计算 pg_num 取值

自己计算 pg_num 取值时可借助 pgcalc 工具

优化：

硬盘和文件系统：

建议系统和osd分别使用不同的硬盘，或者是不同的分区

开启认证：（ceph-deploy部署方式默认是开启认证的）

使用cephx协议进行认证，防止中间人攻击

心跳：

各 OSD 每 6 秒会与其他 OSD 进行心跳检查，如果一个 OSD 20 秒都没有心跳，集群就认为它 down 了，用 [osd] 下的 osd heartbeat grace 可更改宽限期、或者运行时更改。

本文只是入门，ceph的部署在生产环境使用时，还需要考虑mgr,mon,osd,mds等服务的高可用，网络方面可以分成两个网络，即存储网络和管理网络。