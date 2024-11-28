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
      {
        text: "历史博文",
        icon: "pen-to-square",
        prefix: "history/",
        children: [
          "制作Windows_server_2016镜像",
          "制作Centos7镜像",
        ],
      },
    ],
  },
]);
