---
icon: pen-to-square
date: 2024-11-11
category:
  - 运维
tag:
  - Terraform
  - AWS
---

# 现代IT基础设施管理（2）：Terraform进阶

上一篇对Terraform进行了简单介绍，并尝试一个创建虚拟机实例的演示实验，对IaC（基础设施即代码）有了初步的认识，这一篇我们稍微深入一些，继续对Terraform进行进阶尝试，使用高级特性更安全高效管理基础设施，尽量还原实际生产使用。

代码仓库地址：[https://github.com/robin-2016/terraform-demo](https://github.com/robin-2016/terraform-demo)，如果没有克隆到本地的，先克隆代码仓库到本地，如之前克隆过，请将代码更新到最新。

一、变量

Terraform支持变量，变量使用场景一般为下面几种情况，一个配置需要多次引用，经常需要修改的配置，还有像AK和SK等敏感信息需要单独文件保存，一般情况是单独保存在名为vars.tf文件中，这样修改时只修改vars.tf一个文件即可，demo2就是这样的示例，将AK、SK、区域、镜像ID和实例规格等都放在vars.tf文件中，根据类型分别放在不同的配置文件中，归类方便在配置较多时能较快找到对应的配置信息，在其他配置文件中通过var.加上具体变量名称就能引用到变量的值。vars.tf部分内容如下：

```json
variable "AWS_ACCESS_KEY" {
  type        = string
  default     = ""
}
variable "AWS_SECRET_KEY" {
  type        = string
  default     = ""
}
variable "AWS_REGION" {
  type        = string
  default     = "ap-east-1"
}
variable "AMI" {
  type        = string
  default     = "ami-0ad7f83eab34d93a7"
}
variable "INSTANCE_TYPE" {
  type        = string
  default     = "t3.micro"
}
```

例如AWS_ACCESS_KEY变量，值的内容为default字段，type为变量类型，示例中变量都是string字符串类型，Terraform变量还支持number数值类型、true-false布尔类型、list列表类型和map字典类型，本次示例中只演示了字符串类型使用，其他类型请参考下面官网文档链接使用：[https://developer.hashicorp.com/terraform/tutorials/configuration-language/variables](https://developer.hashicorp.com/terraform/tutorials/configuration-language/variables)

二、生产环境示例

切换到demo-2目录下，根据资源类型，将配置拆分到不同的配置文件中。

目录文件介绍：instance.tf是虚拟机实例配置，provider.tf是供应商配置，vars.tf是变量，key.tf是实例ssh密钥，相比密码，密钥安全性更高，securitygroup.tf是安全组配置，允许访问ssh服务，output.tf是执行结束输出配置，这里配置是创建实例的公网IP地址，user_data.tftpl是虚拟机初始化脚本模版文件，下部分会详细讲解，vpc.tf是虚拟网络配置，versions.tf是供应商版本配置信息，这样根据需求只修改对应内容文件即可。

准备工作，这里主要修改是vars.tf，填写AWS的AK和SK对应到AWS_ACCESS_KEY和AWS_SECRET_KEY，再生成密钥对文件，使用下面命令生成：

```bash
ssh-keygen -f mykey
```

准备工作完成，正式开始创建资源，步骤和上一讲相同

```bash
#初始化
terraform init
#查看执行计划
terraform plan
#应用，创建资源
terraform apply
```

执行完成后会在最后Outputs部分输出虚拟机示例的公网IP地址，之后能使用下面ssh命令远程连接虚拟机示例了：

```bash
ssh -i mykey ubuntu@公网IP
```

注：如果没有连接上，可以等一会再尝试，安装配置软件需要一点时间，本示例使用Ubuntu镜像，用户名为ubuntu是镜像默认用户名，使用其他镜像需根据镜像调整。

登录后查看服务状态，nginx已经启动，并已开启80端口，登录上AWS控制台，实例、VPC、安全组、密钥对都已经配置完成。这里只是简单演示，实际会更复杂。

```bash
systemctl status nginx
ss -ntlp
```

三、user data

上面示例中，使用的公共镜像创建虚拟机实例，最终完成时却已安装nginx，使用的就是user data，在云上创建虚拟机实例时，都会在虚拟机创建完成的首次启动执行user_data中的命令进行初始化，之后虚拟机实例再启动不会再执行，这样就能使用user_data功能完成对虚拟机的初始化，下面为demo-2中user_data.tftpl内容，和普通bash脚本内容基本相同，示例中主要是安装并启动了nginx，还可以写更复杂，模版文件还支持变量输入，自行学习探索。

```bash
#!/bin/bash

sudo apt update 
sudo apt install nginx -y
sudo systemctl start nginx
```

另一个方式是Packer自定义镜像，提前安装需要应用环境，Packer还可以和Jenkins等CI持续集成工具结合，Packer配置变化后，重新执行流水线构建新的自定义镜像。

推荐使用user data方式，基本云环境都支持user data，减少不再依赖三方工具，更好管理，自定义镜像方式启动快一些，可以根据实际需要自行选择。

四、模块

上面是所有配置都是自己写，如果想抽出部分作为公共配置，供其他项目引用，或者环境不同，但配置相同，只是变量不同，会存在许多重复配置，这样情况下就需要用到Terraform的模块，我们可以直接引用模块写更少的配置文件，官网模块地址：[https://registry.terraform.io/browse/modules](https://registry.terraform.io/browse/modules)，官方提供了许多模块供开发者引用，也可以自定义模块使用，一些第三方同样提供模块。在demo-3中，我们通过dev开发环境和prod生产环境区分，引用官方实例模块来创建实例，内容示例：

```yaml
module "ec2_instance" {
  source  = "terraform-aws-modules/ec2-instance/aws"

  name = "demo-3-prod"

  instance_type          = "t3.micro"
  key_name               = "mykeypair"
  monitoring             = true
  vpc_security_group_ids = ["sg-12345678"]
  subnet_id              = "subnet-eddcdzz4"

  tags = {
    Terraform   = "true"
    Environment = "prod"
  }
}
```

五、相关生态开源工具：Infisical密钥管理平台

使用Terraform时，会有AK和SK管理问题，如直接存储在配置文件中有泄露的风险，不存储在配置文件中每次使用都需要人工配置，多人使用，还需要相互传递，官方有对应收费版本的HCP Terraform，功能齐全，不差钱可以直接使用HCP Terraform。

如果想降低成本，又想提高安全性和便利性，使用开源项目就是非常不错的选择，Infisical 是开源密钥管理平台，GitHub地址：[https://github.com/Infisical/infisical](https://github.com/Infisical/infisical)，产品定位：在您的团队/基础设施中同步密钥，防止密钥泄漏，非常合适搭配Terraform使用，并提供内部 PKI，有Python、Go、Java等编程语言SDK，同样适用于普通程序开发中需要用到一些敏感信息的地方

对于Terraform就介绍到这里，相信你对于Terraform已经有更深的了解，自己动手实操起来，阅读官网文档，定能熟练使用Terraform。如果对你有帮助，请点个关注，如果需要定制Terraform详细教程请留言咨询，嘿嘿。