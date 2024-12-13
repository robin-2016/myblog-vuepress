---
icon: pen-to-square
date: 2019-04-15
category:
  - 运维
tag:
  - Harbor
  - Https
---

# Harbor安装并配置https之注意事项

Harbor的安装配置不复杂，对照官方github上流程进行安装即可，本文是针对安装和使用过程中我遇到的两个问题而写。

官方的安装配置指南：[https://github.com/goharbor/harbor/blob/master/docs/installation_guide.md](https://github.com/goharbor/harbor/blob/master/docs/installation_guide.md)

自定义证书https配置指南：[https://github.com/goharbor/harbor/blob/master/docs/configure_https.md](https://github.com/goharbor/harbor/blob/master/docs/configure_https.md)

Harbor版本为v1.7.5

一、启动后提示无法找到secretkey文件

在当前这个版本中，不能修改配置文件中secretkey_path的参数，启动程序是还是会去默认的位置查找secretkey_path文件，参数修改后不能生效，应该会在以后的版本中修复

二、docker拉取镜像前先login，login时提示错误x509

这是因为使用的自签名的证书，解决方式是（在docker主机上操作）

创建目录/etc/docker/certs.d/域名/

复制harbor上生成的域名cert、key和ca.crt到创建的目录中

重启docker

三、postgresql数据库配置（不熟悉postgresql配置的看看）

配置

编辑/var/lib/pgsql/11/data/postgresql.conf配置文件

```
listen_addresses = ‘*’
```

编辑/var/lib/pgsql/11/data/pg_hba.conf配置文件

```
#增加
hostnossl all postgres 0.0.0.0/0 password
```

设置密码，创建数据库

```bash
su postgres

psql

\password postgres

CREATE DATABASE registry OWNER postgres;
```

四、配置示例（未出现的配置为默认配置）

```
hostname = reg.mydocker.com
ui_url_protocol = https
ssl_cert = /usr/local/harbor/cert/mydocker.com.crt
ssl_cert_key = /usr/local/harbor/cert/mydocker.com.key
db_host = 本机IP
redis_host = 本机IP
```

reg.mydocker.com就是login的地址，这个地址需要在内网解析到Harbor所在IP