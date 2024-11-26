---
icon: pen-to-square
date: 2024-11-06
category:
  - 运维
tag:
  - Terraform
  - AWS
---

# 现代IT基础设施管理（1）：Terraform初识和小试牛刀

基础设施包括各种云，像国内的阿里云、腾讯云和华为云，国外的AWS、微软Azure云和谷歌云，还有Kubernetes和OpenStack，都可以用Terraform进行资源管理。使用基础设施即代码（Infrastructure as Code, IaC）的方式来管理基础设施，这是现代IT基础设施管理的一个重要趋势，它允许我们以代码的形式定义基础设施，实现基础设施的自动化部署，确保基础设施配置的一致性，方便进行版本控制和变更管理。

Terraform属于基础设施即代码工具，官网地址：[https://www.terraform.io/](https://www.terraform.io/)，产品定位：使用 Terraform 在任何云上进行自动化基础架构，高效管理基础设施，阿里云和腾讯云是Terraform合作伙伴，使用和下载量都不小，华为云是自己在维护，没有合作伙伴标识。

![terraform1-1](/assets/images/terraform1-1.png)

安装，直接在官网下载页找到对应系统下载安装即可，Linux、macOS和Windows都支持，下面通过一个演示示例体验一下Terraform具体操作，用的是AWS云，AWS提供了750小时2核CPU-1G内存虚拟机的免费使用，Terraform演示示例所需配置文件在[https://github.com/robin-2016/terraform-demo](https://github.com/robin-2016/terraform-demo)代码仓库下，下面进行一个简单的创建一个虚拟机的demo演示示例：

先将代码仓库克隆到本地，进入demo-1目录下，下图就是main.tf文件全部内容。先来解释文件内容对应的含义，provider部分为对应的供应商，现在使用的是AWS，region是配置区域，ap-east-1为香港地区，access_key和secret_key为AWS账号生成的AK和SK。resource部分为创建的资源，这里设置的虚拟机实例，ami为虚拟机实例镜像id，是Ubuntu server24.04的镜像，instance_type为虚拟机实例规格，t3.micro是AWS提供的免费规格，2核CPU-1G内存，下面开始实操实验。

![terraform1-2](/assets/images/terraform1-2.png)

演示实验

第一步：填写AWS的AK和SK分别对应access_key和secret_key，执行“terraform init”初始化，会创建一个lock文件.terraform.lock.hcl，后续需要添加到代码仓库中

![terraform1-3](/assets/images/terraform1-3.png)

初始化后，可以执行“terraform validate”来验证配置文件是否正确，不是必须执行，必须在init初始化之后执行

![terraform1-4](/assets/images/terraform1-4.png)

第二步：在执行具体操作前，再执行“terraform plan”查看要执行内容，避免误操作，这里可以看到返回结果显示是将要创建一个AWS的虚拟机实例。这一步也可以不执行，可以跳过执行第三步，感觉还是先看一下执行内容比较放心。

![terraform1-5](/assets/images/terraform1-5.png)

第三步：确定好执行plan后符合预期，继续操作，执行“terraform apply“，输入yes确认操作，等待一会，一台实例就创建好了，显示“Apply complete”表明执行完成。

![terraform1-6](/assets/images/terraform1-6.png)

登录到AWS控制台，看到有一台刚刚创建的实例，也可以更改实例类型后再执行一次apply，现有的实例会销毁再创建对应类型的实例。

![terraform1-7](/assets/images/terraform1-7.png)

第四步：演示实验完成后，执行“terraform destroy“销毁资源，上面创建出来的实例就会被删除，同样要求输入yes来确认操作。

![terraform1-8](/assets/images/terraform1-8.png)

在演示实验结束后，查看目录，会生成两个文件：terraform.tfstate和terraform.tfstate.backup，这两个文件是用来记录terraform远程状态的，所以要保证在操作terraform之前这两个状态文件是最新的，两个状态文件可以存储在terraform提供的远程空间里，如果操作少一些也可以保存在代码仓库一个单独目录下。

![terraform1-9](/assets/images/terraform1-9.png)

Terraform可以用来管理vpc、安全组和dns记录等云上的大部分资源，还可以搭配自定义镜像+Linux脚本方式，完成应用程序层面部署，特别是有多个云账号需要管理，或者频繁初始化部署的情况下，能大大提高管理效率，一次编写执行多次。

以上为Terraform的初级使用分享，如果对你有帮助，请关注留言互动，如果需要Terraform具体云服务商教程请留言咨询，嘿嘿。