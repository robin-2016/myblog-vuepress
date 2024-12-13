---
icon: pen-to-square
date: 2019-04-08
category:
  - 云计算
tag:
  - OpenStack
  - Ceph
  - 运维
---

# OpenStack对接Ceph

本文章是参考[http://docs.ceph.com/docs/master/rbd/rbd-openstack/](http://docs.ceph.com/docs/master/rbd/rbd-openstack/)

进行操作的，是官网文档文章，只是没有说明openstack-cinder-volume应该部署的位置，我尝试了几次才成功，希望你看完文章后能减少一点弯路。

与文章的差别是我没有使用openstack-cinder-backup。

openstack版本为rock版，ceph为luminous版本。前提是已经有openstack和ceph环境。

一、创建ceph存储池并初始化

```bash
ceph osd pool create volumes 128
ceph osd pool create images 128
ceph osd pool create compute 128
#初始化
rbd pool init volumes
rbd pool init images
rbd pool init compute
```

二、配置ceph客户端

注意：openstack-cinder-volume应该部署在ceph的mon所在节点上。不是cinder-api节点，也不是ceph的osd节点。（我就是在这里尝试了多次）

复制ceph集群的/etc/ceph/ceph.conf配置文件到glance-api，cinder-volume，nova-compute的/etc/ceph/ceph.conf

glance-api节点安装python-rbd

yum install python-rbd

nova-compute，cinder-backup和上cinder-volume节点上安装ceph-common

yum install ceph-common

如果ceph启用了认证，还需要创建用户和生成认证文件，并将认证文件复制的openstack的节点

```bash
ceph auth get-or-create client.glance mon 'profile rbd' osd 'profile rbd pool=images'
ceph auth get-or-create client.cinder mon 'profile rbd' osd 'profile rbd pool=volumes, profile rbd pool=compute, profile rbd pool=images'
ceph auth get-or-create client.glance | ssh glance sudo tee /etc/ceph/ceph.client.glance.keyring
ssh glance chown glance:glance /etc/ceph/ceph.client.glance.keyring
ceph auth get-or-create client.cinder | ssh cinder sudo tee /etc/ceph/ceph.client.cinder.keyring
ssh cinder chown cinder:cinder /etc/ceph/ceph.client.cinder.keyring
ceph auth get-or-create client.cinder | ssh nova-compute sudo tee /etc/ceph/ceph.client.cinder.keyring
```

nova-compute节点创建密钥环文件

```bash
ceph auth get-key client.cinder | ssh nova-compute tee client.cinder.key
uuidgen
457eb676-33da-42ec-9a8c-9293d545c337

cat > secret.xml <<EOF
<secret ephemeral='no' private='no'>
  <uuid>457eb676-33da-42ec-9a8c-9293d545c337</uuid>
  <usage type='ceph'>
    <name>client.cinder secret</name>
  </usage>
</secret>
EOF
virsh secret-define --file secret.xml
virsh secret-set-value --secret 457eb676-33da-42ec-9a8c-9293d545c337 --base64 $(cat client.cinder.key) && rm client.cinder.key secret.xml
```

三、配置openstack使用ceph

glance增加下面配置

编辑/etc/glance/glance-api.conf配置文件

```
[glance_store]
stores = rbd
default_store = rbd
rbd_store_chunk_size = 8
rbd_store_pool = images
rbd_store_user = glance
rbd_store_ceph_conf = /etc/ceph/ceph.conf

[paste_deploy]
flavor = keystone
```

cinder-volume增加下面配置，编辑/etc/cinder/cinder.conf配置文件

```
[DEFAULT]
...
enabled_backends = ceph
glance_api_version = 2
...
[ceph]
volume_driver = cinder.volume.drivers.rbd.RBDDriver
volume_backend_name = ceph
rbd_pool = volumes
rbd_ceph_conf = /etc/ceph/ceph.conf
rbd_flatten_volume_from_snapshot = false
rbd_max_clone_depth = 5
rbd_store_chunk_size = 4
rados_connect_timeout = -1
rbd_user = cinder
rbd_secret_uuid = 457eb676-33da-42ec-9a8c-9293d545c337
```

nova-compute配置，编辑/etc/nova/nova.conf配置文件

```
[libvirt]
...
libvirt_images_type = rbd
libvirt_images_rbd_pool = vms
libvirt_images_rbd_ceph_conf = /etc/ceph/ceph.conf
disk_cachemodes="network=writeback"
rbd_user = cinder
rbd_secret_uuid = 457eb676-33da-42ec-9a8c-9293d545c337
inject_password = false
inject_key = false
inject_partition = -2
live_migration_flag = “VIR_MIGRATE_UNDEFINE_SOURCE，VIR_MIGRATE_PEER2PEER，VIR_MIGRATE_LIVE，VIR_MIGRATE_PERSIST_DEST，VIR_MIGRATE_TUNNELLED”

```

编辑/etc/ceph/ceph.conf配置文件

```
[client]
rbd cache = true
rbd cache writethrough until flush = true
admin socket = /var/run/ceph/guests/$cluster-$type.$id.$pid.$cctid.asok
log file = /var/log/qemu/qemu-guest-$pid.log
rbd concurrent management ops = 20
```

```bash
#执行
mkdir -p /var/run/ceph/guests/ /var/log/qemu/
chown qemu:libvirtd /var/run/ceph/guests /var/log/qemu/
```

到此配置完成，在服务对应节点重启openstack的服务：

```bash
systemctl restart openstack-glance-api
systemctl restart openstack-nova-compute
systemctl restart openstack-cinder-volume
```