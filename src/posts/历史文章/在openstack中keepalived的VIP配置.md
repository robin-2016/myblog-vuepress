---
icon: pen-to-square
date: 2019-04-15
category:
  - 云计算
tag:
  - OpenStack
  - 运维
  - keepalive
---

# 在OpenStack中keepalived的VIP配置

问题描述：
在openstack环境下安装配置keepalived后，VIP只能在所在的主机节点ping通，其他节点无法ping通
解决方式：
需要配置allowed-address-pairs
红帽官网对allowed-address-pairs的解释：allowed-address-pairs 允许您指定 mac_address/ip_address（CIDR）对，使它们可以在不考虑子网的情况下通过一个端口。这会启用对一些协议的使用，如 VRRP，它会在两个实例间浮动一个 IP 地址，从而实现快速故障切换功能。

配置步骤：（在openstack的neutron的控制节点操作）

```bash
#查看需要使用VIP网络id
neutron net-list
#创建带有allowed-address-pairs功能的IP
neutron port-create –fixed-ip –allowed-address-pairs subnet_id=子网id,ip_address=VIP 网络id
#在需要启动keepalived所有实例的网络接口上启用allowed-address-pairs功能
neutron port-update 实例网卡id –allowed-address-pair ip_address=VIP
#查找实例的网络接口的信息
neutron port-list |grep 实例IP
```

示例：

```bash
[root@openstack ~]# neutron net-list
neutron CLI is deprecated and will be removed in the future. Use openstack CLI instead.
+--------------------------------------+--------+----------------------------------+-----------------------------------------------------+
| id | name | tenant_id | subnets |
+--------------------------------------+--------+----------------------------------+-----------------------------------------------------+
| 12e41d31-5be5-4cf9-a45c-4ee374388759 | EX-NET | a2ff5d90248e46328448f02252f190ec | 6489102f-60c1-4938-b5f5-7a97689429f5 192.168.1.0/24 |
| a8751de8-016d-4038-afc1-bcff552044a2 | YTJY | a2ff5d90248e46328448f02252f190ec | 327a7ca8-9fb5-4ab3-850e-9d835e7575ee 192.168.2.0/24 |
+--------------------------------------+--------+----------------------------------+-----------------------------------------------------+
[root@openstack ~]# neutron port-create --fixed-ip subnet_id=327a7ca8-9fb5-4ab3-850e-9d835e7575ee,ip_address=192.168.2.6 a8751de8-016d-4038-afc1-bcff552044a
[root@openstack ~]# neutron port-list |grep 192.168.2.4
neutron CLI is deprecated and will be removed in the future. Use openstack CLI instead.
| 69ebfd68-a789-4330-88d5-8f5ba4370caa |      | a2ff5d90248e46328448f02252f190ec | fa:16:3e:55:90:c7 | {"subnet_id": "327a7ca8-9fb5-4ab3-850e-9d835e7575ee", "ip_address": 192.168.2.4"}  |
[root@openstack ~]# neutron port-update 69ebfd68-a789-4330-88d5-8f5ba4370caa --allowed-address-pair ip_address=192.168.2.6
```

所有实例都开启allowed-address-pairs就可以正常使用keepalived了