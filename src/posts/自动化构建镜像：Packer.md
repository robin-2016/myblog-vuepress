---
icon: pen-to-square
date: 2024-11-15
category:
  - 运维
tag:
  - Packer
  - AWS
  - 镜像
---

# 自动化构建镜像：Packer

在介绍Packer之前，先来回顾一下未使用Packer时自定义虚拟机镜像的步骤。先在本地启动一个虚拟机，从安装系统开始，再进行自定义配置或应用安装，最后封装压缩成镜像，详细操作步骤可以参考我之前写的文档，[制作centos7镜像](/posts/history/%E5%88%B6%E4%BD%9CCentos7%E9%95%9C%E5%83%8F.html)，[制作Windows-server-2016镜像](/posts/history/%E5%88%B6%E4%BD%9CWindows_server_2016%E9%95%9C%E5%83%8F.html)。还可以借助阿里云或华为云等公有云，可以直接运行一个虚拟机实例，再进行相关配置，最后导出镜像，使用公有云相比本地构建镜像节省了安装系统的时间，相关云配置也能减少，只需进行自定义相关配置。

不论在本地还是在云上构建虚拟机镜像，都需要很多手动操作步骤，而Packer就是为了构建镜像自动化，和Terraform一样都是HashiCorp公司出品，官网地址：[https://www.packer.io/](https://www.packer.io/)，在官网首页还提出了镜像即代码（Images as code）的概念，支持虚拟机和容器镜像构建，我体验了一下容器构建过程，相比dockerfile略显复杂难懂，推荐容器镜像还是写dockerfile，用Packer来构建虚拟机镜像，容器构建之前已经实现了自动化，虚拟机镜像构建还是手动操作，Packer能大大提高效率。下面进入实操演示。

Packer安装，参考官网：[https://developer.hashicorp.com/packer/install](https://developer.hashicorp.com/packer/install)，基本1-2条命令就能完成安装，示例配置文件代码仓库：[https://github.com/robin-2016/terraform-demo](https://github.com/robin-2016/terraform-demo)，克隆后进行packer-demo目录下

先来看一下aws-demo.pkr.hcl配置文件内容结构，第一部分packer部分定义了使用的插件，这里使用的AWS云，AWS第一次注册使用有750小时免费使用计划（限定规格）。第二部分source部分定义了镜像来源，amazon-ebs标识是AWS的云硬盘，ami_name为最终生成的镜像名称，{{timestamp}}为时间戳变量，多次执行时镜像名称会因为执行时间不同而不同，不会名称冲突，instance_type为虚拟机实例规格，其实Packer底层原理还是创建了一个虚拟机实例，执行脚本命令，导出镜像，再删除虚拟机实例，Packer是把上面步骤自动化了，region为实例运行区域，ap-east-1是香港地区，source_ami为基础镜像ID，这里选择的公有Ubuntu Server 24镜像。第三部分build是定义构建过程，主要是shell部分，可以写脚本来安装配置应用程序，示例中是安装的redis程序。

```json
packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "aws-demo-ubuntu-{{timestamp}}"
  instance_type = "t3.micro"
  region        = "ap-east-1"
  source_ami    = "ami-0ad7f83eab34d93a7"
  ssh_username  = "ubuntu"
}

build {
  name = "learn-packer"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "shell" {
    environment_vars = [
      "FOO=hello world",
    ]
    inline = [
      "echo Installing Redis",
      "sleep 30",
      "sudo apt-get update",
      "sudo apt-get install -y redis-server",
      "echo \"FOO is $FOO\" > example.txt",
    ]
  }
}
```

在具体执行前先配置下面两个环境变量，AWS的AK和SK，Packer会读取环境变量就能有权限操作AWS了。

```bash
export AWS_ACCESS_KEY_ID="<YOUR_AWS_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<YOUR_AWS_SECRET_ACCESS_KEY>"
```

依次执行下面命令，就能完成镜像的构建了，先进行初始化，格式化和验证配置文件命令是可选的，最后进行镜像构建，操作看着和Terraform非常相似。

```bash
#初始化
packer init .
#格式化配置-可选
packer fmt .
#验证配置-可选
packer validate .
#构建镜像
packer build aws-demo.pkr.hcl
```

等待构建命令执行完成，镜像就构建完成了，可以登录进入到AWS的镜像服务，就能看到本次Packer构建的镜像了，演示完成后如不需要记得手动删除镜像。

![packer.png](/assets/images/packer.png)

本示例构建镜像过程耗时大约5分钟，相比之前手动操作效率提高不少，还可以把配置文件添加到代码仓库中，同代码一起进行版本管理，和Jenkins等工具结合，实现流水线构建镜像，AWS支持Windows镜像，需要使用Powershell脚本，参考官网文档：[https://developer.hashicorp.com/packer/integrations/hashicorp/amazon/latest/components/builder/ebs#windows-2016-sysprep-commands-for-amazon-windows-amis-only](https://developer.hashicorp.com/packer/integrations/hashicorp/amazon/latest/components/builder/ebs#windows-2016-sysprep-commands-for-amazon-windows-amis-only)。

AWS支持并行构建多个镜像，参考官网文档：[https://developer.hashicorp.com/packer/tutorials/aws-get-started/aws-get-started-parallel-builds](https://developer.hashicorp.com/packer/tutorials/aws-get-started/aws-get-started-parallel-builds)

Packer官方供应商还支持阿里云、腾讯云和OpenStack，没有华为云，但在华为云自己的文档中有使用Packer构建镜像文档，参考链接：[https://support.huaweicloud.com/bestpractice-ims/ims_bp_0031.html](https://support.huaweicloud.com/bestpractice-ims/ims_bp_0031.html)，在阿里云、腾讯云和华为云中没有看到对Windows镜像支持的文档，对比来看，还是AWS使用文档最详细。

Packer介绍和演示到此结束，如果对你有帮助，请点个关注，嘿嘿。