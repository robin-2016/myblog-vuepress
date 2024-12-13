---
icon: pen-to-square
date: 2020-05-04
category:
  - 运维
tag:
  - Linux
  - 优化
---

# Linux 性能优化 CPU篇

## **CPU使用率**

CPU 使用率描述了非空闲时间占总 CPU 时间的百分比，根据 CPU 上运行任务的不同，又被分为用户 CPU、系统 CPU、等待 I/O CPU、软中断和硬中断等。

1.用户 CPU 使用率，包括用户态 CPU 使用率（user）和低优先级用户态 CPU 使用率（nice），表示 CPU 在用户态运行的时间百分比。用户 CPU 使用率高，通常说明有应用程序比较繁忙。

2.系统 CPU 使用率，表示 CPU 在内核态运行的时间百分比（不包括中断）。系统 CPU 使用率高，说明内核比较繁忙。

3.等待 I/O 的 CPU 使用率，通常也称为 iowait，表示等待 I/O 的时间百分比。iowait 高，通常说明系统与硬件设备的 I/O 交互时间比较长。

4.软中断和硬中断的 CPU 使用率，分别表示内核调用软中断处理程序、硬中断处理程序的时间百分比。它们的使用率高，通常说明系统发生了大量的中断。

5.除了上面这些，还有在虚拟化环境中会用到的窃取 CPU 使用率（steal）和客户 CPU 使用率（guest），分别表示被其他虚拟机占用的 CPU 时间百分比，和运行客户虚拟机的 CPU 时间百分比。

- 从 top 的输出可以得到各种 CPU 使用率以及僵尸进程和平均负载等信息。
- 从 vmstat 的输出可以得到上下文切换次数、中断次数、运行状态和不可中断状态的进程数。
- 从 pidstat 的输出可以得到进程的用户 CPU 使用率、系统 CPU 使用率、以及自愿上下文切换和非自愿上下文切换情况。

stress Linux系统压测工具

mpstat 多核CPU性能分析工具

pidstat 进程性能分析工具

stress –cpu 1 –timeout 600 压测一个cpu

mpstat -P ALL 5 每隔5秒 查看所有cpu

pidstat -u 5 1 5秒后输出1组数据 u 表示汇总CPU利用率

stress -i 1 –timeout 500 I/O压测

stress -c 8 –timeout 500 8进程压测， 多进程压测

dstat是新的性能工具

yum install dstat -y

dstat -c -m -d

查询进程的线程数

watch “ps hH p | wc -l”

ps -Lf | wc -l

查看磁盘设备使用者

fuser -vm 挂载点|设备

查看实时IO

iotop -oP

## **CPU使用率达到100%是怎么办**

先使用ps或top确定是哪个进程导致的，再使用perf排查具体调用函数

pidstat

%usr 用户态

%system 内核态

%guest 运行虚拟机CPU使用率

%wait 等待CPU使用率

%cpu 总CPU使用率

perf top

Samples 采样数 event时间类型 event count事件总数 注意：采样数过少的问题

overhead 性能事件在所有采样中的占比

shared 函数或指令所在的动态共享对象

object 动态共享对象的类型 [.]用户空间可以执行程序或动态链接库 [k]内核空间

symbol 符号名 函数名 当函数名未知时使用十六进制的地址表示

perf record 记录数据 perf report 解析展示

perf top -g -p 21515 -g开启调用关系分析 -p指定进程号 方向键选择指定的进程，回车展开调用关系

## **CPU使用率很高，却找不到高cpu的应用**

首先想是不是短时应用导致的问题：应用里调用了其他二进制程序，运行比较短，top不容易发现，或者应用不停的崩溃重启，启动时占用资源较多

perf record -g 记录性能事件

perf report 查看报告

execsnoop 专为短时进程设计的，使用ftrace的动态追踪技术，一般用于Linux内核运行时的行为

wget [https://raw.githubusercontent.com/brendangregg/perf-tools/master/execsnoop](https://raw.githubusercontent.com/brendangregg/perf-tools/master/execsnoop)

是一个bash的脚本，直接执行就可以

## **僵尸进程**

查找僵尸进程的父进程 pstree -aps pid

pidstat -d 展示I/O统计数据

strace 最常用的跟踪进程系统调用工具

strace -p pid

## **软中断原理**

中断处理分为上半部和下半部

上半部对应硬件中断，用来快速处理中断

下半部对应软中断，用来异步处理上半部未完成的工作

cat /proc/softirqs 查看软中断运行情况

cat /proc/interrupts 查看硬中断运行情况

TIMER 定时中断

NET_TX 网络发送

NET_RX 网络接收

SCHED 内核调度

RCU rcu锁

大量的小网络包会导致频繁的硬中断和软中断，导致性能下降

软中断是以内核线程的方式运行，每一个CPU对应一个软中断内核线程

ps aux |grep softirq

## **软中断处理**

查看中断时不是中断的累计次数，而是增加的频率

```bash
watch -d cat /proc/softirqs

hping3 -S -p 80 -i u100 192.168.0.30
```

-S 参数表示设置 TCP 协议的 SYN（同步序列号），-p 表示目的端口为 80

-i u100 表示每隔 100 微秒发送一个网络帧

注：如果你在实践过程中现象不明显，可以尝试把 100 调小，比如调成 10 甚至 1

star -n DEV 1 -n DEV 表示显示网络收发的报告

第三四列表示每秒接收、发送的网络帧数，pps

第五六列表示每秒接收、发送的千字节数，bps

```bash
tcpdum -i eth0 -n tcp port 80
```