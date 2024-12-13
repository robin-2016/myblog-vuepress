---
icon: pen-to-square
date: 2018-09-08
category:
  - 运维
tag:
  - Centos7
  - L2TP
---

# Centos 7搭建L2TP VPN服务器

说明：Centos 7 作为L2TP服务器，h3c ER5200G2作为客户端

本文参照[这篇文件](https://blog.csdn.net/kitvv/article/details/50696585)进行搭建配置

1.先看看你的主机是否支持pptp，返回结果为yes就表示通过。

```bash
modprobe ppp-compress-18 && echo yes
```

2 .是否开启了TUN，有的虚拟机主机需要开启，返回结果为cat: /dev/net/tun: File descriptor in bad state。就表示通过。

```bash
cat /dev/net/tun
```

3.更新一下再安装

```bash
yum install update
yum update -y
```

4安装EPEL源（CentOS7官方源中已经去掉了xl2tpd）

```bash
yum install -y epel-release
```

5.安装xl2tpd和libreswan(openswan已经停止维护)

```bash
yum install -y xl2tpd libreswan lsof
```

6.编辑/etc/xl2tpd/xl2tpd.conf

```
[global]

[lns default]
ip range = 172.1.1.10-172.1.1.20   #地址池
local ip = 172.1.1.1
require chap = yes
refuse pap = yes
require authentication = yes
name = firewall_c
ppp debug = yes
pppoptfile = /etc/ppp/options.xl2tpd
length bit = yes
```

7.编辑/etc/ppp/options.xl2tpd

```
ipcp-accept-local
ipcp-accept-remote
ms-dns  8.8.8.8
noccp
auth
idle 1800
mtu 1410
mru 1410
nodefaultroute
debug
proxyarp
connect-delay 5000
```

8.编辑/etc/ipsec.conf

```
config setup   
    virtual_private=%v4:10.0.0.0/8,%v4:192.168.0.0/16,%v4:172.1.0.0/12,%v4:25.0.0.0/8,%v4:100.64.0.0/10,%v6:fd00::/8,%v6:fe80::/10
include /etc/ipsec.d/*.conf
```

主要添加对应自己地址池的配置%v4:172.1.0.0/12

9.编辑/etc/ipsec.d/l2tp-ipsec.conf

```
conn L2TP-PSK-NAT
    rightsubnet=0.0.0.0/0
    dpddelay=10
    dpdtimeout=20
    dpdaction=clear
    forceencaps=yes
    also=L2TP-PSK-noNAT
conn L2TP-PSK-noNAT
    authby=secret
    pfs=no
    auto=add
    keyingtries=3
    rekey=no
    ikelifetime=8h
    keylife=1h
    type=transport
    left=192.168.1.1
    leftprotoport=17/1701
    right=%any
    rightprotoport=17/%any
```

left对应系统外网地址

10.设置用户名和密码，编辑/etc/ppp/chap-secrets

```
# client server secret IP addresses
username * passwd *
```

11.编辑/etc/ipsec.d/default.secrets

```
: PSK “123456”
```

12.设置防火墙

```bash
firewall-cmd --permanent --add-service=ipsec
firewall-cmd --permanent --add-port=1701/udp
firewall-cmd --permanent --add-port=4500/udp
firewall-cmd --permanent --add-masquerade
firewall-cmd --reload
```

13.配置转发等，编辑/etc/sysctl.conf

```
net.ipv4.ip_forward = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.rp_filter = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.default.rp_filter = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.ip_vti0.accept_redirects = 0
net.ipv4.conf.ip_vti0.rp_filter = 0
net.ipv4.conf.ip_vti0.send_redirects = 0
net.ipv4.conf.lo.accept_redirects = 0
net.ipv4.conf.lo.rp_filter = 0
net.ipv4.conf.lo.send_redirects = 0
net.ipv4.conf.enp0s3.rp_filter = 0
net.ipv4.conf.enp0s8.rp_filter = 0
# 避免放大攻击
net.ipv4.icmp_echo_ignore_broadcasts = 1
# # 开启恶意icmp错误消息保护
net.ipv4.icmp_ignore_bogus_error_responses = 1
```

执行 sysctl -p 生效配置

14.ipsec启动&检查

```bash
systemctl enable ipsec
systemctl restart ipsec
```

检查：ipsec verify 全部通过。

15.设置隧道认证，编辑/etc/xl2tpd/l2tp-secrets

```
#格式为us them secret    ,这个them就是路由器中的本段名称
* them secret
```

16.启动xl2tp

```bash
systemctl enable xl2tpd
systemctl restart xl2tpd
```

17.路由器连接设置在客户端还要添加一条策略路由：目标为192.168.2.1 的从l2tp端口出。路由器在L2TP客户端中填写用户信息和隧道认证，连接就可以了。