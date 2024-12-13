---
icon: pen-to-square
date: 2019-04-23
category:
  - 云计算
tag:
  - OpenStack
  - LB
  - 运维
---

# OpenStack配置LBaas

openstack 版本为rocky

### **neutron-controller配置**

```bash
yum install openstack-neutron-lbaas -y
```

修改下面的配置文件

编辑/etc/neutron/neutron.conf配置文件，增加下面配置（router是之前原有，只增加后面的）

```
service_plugins = router,neutron_lbaas.services.loadbalancer.plugin.LoadBalancerPluginv2
```

编辑/etc/neutron/neutron_lbaas.conf配置文件，增加下面配置

```
[service_providers]

service_provider = LOADBALANCERV2:Haproxy:neutron_lbaas.drivers.haproxy.plugin_driver.HaproxyOnHostPluginDriver:default
```

编辑/etc/neutron/lbaas_agent.ini配置文件，增加下面配置

```
[DEFAULT]

device_driver = neutron_lbaas.drivers.haproxy.namespace_driver.HaproxyNSDriver

interface_driver = linuxbridge

[haproxy]

user_group = haproxy

systemctl restart neutron-server
```

### **computer节点配置**

```bash
yum install openstack-neutron-lbaas haproxy -y
```

同样是修改下面的文件

编辑/etc/neutron/neutron.conf配置文件，增加下面配置

```
service_plugins = router,neutron_lbaas.services.loadbalancer.plugin.LoadBalancerPluginv2
```

编辑/etc/neutron/neutron_lbaas.conf配置文件，增加下面配置

```
[service_providers]

service_provider = LOADBALANCERV2:Haproxy:neutron_lbaas.drivers.haproxy.plugin_driver.HaproxyOnHostPluginDriver:default
```

编辑/etc/neutron/lbaas_agent.ini配置文件，增加下面配置

```
[DEFAULT]

device_driver = neutron_lbaas.drivers.haproxy.namespace_driver.HaproxyNSDriver

interface_driver = linuxbridge

[haproxy]

user_group = haproxy

systemctl enable neutron-lbaasv2-agent

systemctl start neutron-lbaasv2-agent
```

### **dashboard 开启lbaas**

```bash
git clone https://git.openstack.org/openstack/neutron-lbaas-dashboard
cd neutron-lbaas-dashboard
git checkout stable/rocky
python setup.py install
cp neutron_lbaas_dashboard/enabled/_1481_project_ng_loadbalancersv2_panel.py /usr/share/openstack-dashboard/openstack_dashboard/local/enabled/
```

编辑/etc/openstack-dashboard/local_settings配置文件

OPENSTACK_NEUTRON_NETWORK 中添加 ‘enable_lb’: True,

安装模块pip install neutron-lbaas-dashboard

不安装模块重启时日志会提示找不到模块，无法启用load balance

```bash
systemctl restart httpd
```

在项目，网络，有load balance

创建load balance后无法ping通，需要设置安全组

```bash
neutron lbaas-loadbalancer-show lbaas_name

neutron port-update –security-group security-group-name vip-port-id
```

安全组开放80和443端口

参考资料：

[https://docs.openstack.org/neutron/rocky/admin/config-lbaas.html](https://docs.openstack.org/neutron/rocky/admin/config-lbaas.html)

[https://www.server-world.info/en/note?os=CentOS_7&p=openstack_rocky2&f=16](https://www.server-world.info/en/note?os=CentOS_7&p=openstack_rocky2&f=16)

[https://kurisu.love/index.php/archives/82/](https://kurisu.love/index.php/archives/82/)