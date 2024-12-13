import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "博文",
    icon: "pen-to-square",
    prefix: "/posts/",
    children: [
      "开始和起名",
      "Cursor使用",
      "现代IT基础设施管理（1）：Terraform初识和小试牛刀",
      "现代IT基础设施管理（2）：Terraform进阶",
      "自动化构建镜像：Packer",
      "用VuePress在GitHub-Pages上搭建博客",
      "使用Notion写博客",
      { text: "不错的AI项目集合", icon: "pen-to-square", link: "ai-project-set" },
      {
        text: "历史文章",
        icon: "pen-to-square",
        prefix: "历史文章/",
        children: [
          "制作Windows_server_2016镜像",
          "制作Centos7镜像",
          "搭建ceph分布式存储",
          "在openstack中keepalived的VIP配置",
          "Centos7搭建L2TP_VPN服务器",
          "Harbor安装并配置https之注意事项",
          "Linux-性能优化-磁盘篇",
          "Linux-性能优化-网络篇",
          "Linux-性能优化-CPU篇",
          "MySQL配置文件",
          "openstack对接ceph",
          "openstack配置LBaas"
        ],
      },
    ],
  },
]);
