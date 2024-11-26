---
icon: pen-to-square
date: 2024-11-05
category:
  - AI
tag:
  - Cursor
---


# Cursor使用

Cursor是一款AI 代码编辑器，官网地址为[https://www.cursor.com/](https://www.cursor.com/)，直接在官网下载安装即可，基于VS Code二次开发而来，之所以没有采用插件方式，在官方网站上给出的答案是某些功能插件无法实现，产品专注在使用AI来进行编程方面，价格方面还不便宜，Pro单月20刀，企业版单月单个用户40刀，但某些功能确实好用啊，有找外包替你完成部分工作的感觉，不付费的话使用次数有限制。

最基本功能：Tab键代码自动补全。在写代码时，后面会有代码提示，官网上说是一个更强大的 Copilot（Github出品的代码补全工具），Copilot我只体验过，没有深度使用，不能给出比较准确的对比评价。

第二个特色功能：根据提示修改代码或生成命令。快捷键Ctrl/Cmd + k，比如下图，找到需要优化问题代码片段，选中需要优化一段代码，快捷键Ctrl/Cmd + k，输入提示“优化一下”，就会生成新代码，比较有特色是可以分段部分接受修改，根据右侧图中红框内快捷键操作即可，如果有错误，还可以继续进行AI Fix修复，用来重构代码效率会大大提高。

![cursor01.png](/assets/images/cursor01.png)

如果在终端中按快捷键Ctrl/Cmd + k，同样会出现提示框，输入“构建命令”，就会在命令行中生成要执行的命令，命令稍加修改就能执行，感觉已经非常厉害了，理论上可以在这个终端里连接上远程服务器，通过提示生成要执行的命令，这对于终端命令不太熟悉的同学非常有帮助。

![cursor02.png](/assets/images/cursor02.png)

第三个特色功能：聊天功能。快捷键Ctrl/Cmd + L，会单独打开右侧窗口，同样是输入“优化一下”，生成代码后点击右上角Apply应用到代码中，下面还会总结改进的内容，也可用继续问，进行多轮聊天，直到感觉可以后再应用，也可以闲聊，问一些和代码无关的问题也没有问题。

![cursor03.png](/assets/images/cursor03.png)

Cursor会对代码进行索引，会计算代码库中的每个文件的嵌入向量，并将使用这些嵌入向量来提高代码库答案的准确性。如果在聊天时，使用快捷键Ctrl/Cmd + Enter，会使用这项功能来搜索项目下代码内容来提高答案的准确性，也是特色功能之一。

第四个特色功能：AI Review代码

Review功能目前还是Beta测试中，需要先在设置中启用，如需要长文本功能的也在这里启用，目前聊天中token限制为20000个，快捷提示中为10000个。

![cursor04.png](/assets/images/cursor04.png)

根据提示，Ctrl/Cmd + Shift + P，输入Reload Window，重载窗口，就能看到聊天窗口右边出现Review标签页了。

![cursor05.png](/assets/images/cursor05.png)

重载窗口后，同样是输入提示，下面也提供了四项对应的Review功能，Review Working State可以对未提交的工作空间内代码进行Review，Review Last Commit也挺方便的，在开发分支提交代码后直接进行Review，Review后再合并到上层分支。

![cursor06.png](/assets/images/cursor06.png)

Cursor可以配置使用其他AI，发送任意数量的 AI 消息

![cursor07.png](/assets/images/cursor07.png)

可以对使用的模型进行设置，选择使用哪些模型，可以同时使用多个模型，GPT-4, GPT-4o, and Claude 3.5 Sonnet都是收费的高级模型

![cursor08.png](/assets/images/cursor08.png)

总结Cursor使用，编写代码中可以使用tab键补全代码，使用提示（Ctrl/Cmd + k）生成、修改或重构代码，同样可以使用聊天（Ctrl/Cmd + L）方式生成、修改或重构代码，在聊天时使用Ctrl/Cmd + Enter发送信息会索引本地代码提高回答准确率，Beta测试中的Review代码功能非常好用。

以上为Cursor使用总结，Cursor是非常有创新的产品，不管是否是在计算机行业都应该体验一下，在某些直播平台，我刷到过几次直播使用Cursor挑战不写代码完成一款程序的编程，虽然有些噱头成分，Cursor还是非常值得体验一下的，欢迎关注留言互动，嘿嘿。