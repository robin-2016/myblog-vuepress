---
icon: pen-to-square
date: 2018-09-08
category:
  - 运维
tag:
  - MySQL
  - 优化
---

# MySQL配置文件

《高性能MySQL》第八章 优化服务器设置

建议：如果现在已经有mysql正在运行，不建议把配置文件大改一通，除非你知道你在干什么。安装新实例时可以按照上面的从新生成一份新配置文件。

本文是我读完《高性能MySQL》第三版第八章时整理的笔记，有些地方可能理解的与书中有差别，请读一遍还是有收获的。

觉得可以给点捐赠，当是我去颈椎科的医药费，读这个砖头一样厚的书真需要去一趟颈椎科。

一. 从基础配置开始

如果你使用Innodb引擎，最重要的两个配置项是innodb_buffer_pool_size和innodb_log_file_size，用来配置缓冲池和写日志大小的。

《高性能MySQL》作者维护的推荐在线配置工具[Percona](https://tools.percona.com/)，在回答一些问题之后可以生成一个基础的配置文件。

类似下面的配置文件：

```
[mysql]
# CLIENT #
port = 3306
socket = /data/mysql/mysql.sock

[mysqld]
# GENERAL #
user = mysql
default_storage_engine = InnoDB
socket = /data/mysql/mysql.sock
pid_file = /data/mysql/mysql.pid

# MyISAM #
key_buffer_size = 32M
myisam_recover_options = FORCE,BACKUP

# SAFETY #
max_allowed_packet = 16M
max_connect_errors = 1000000
skip_name_resolve
sql_mode = STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_AUTO_VALUE_ON_ZERO,NO_ENGINE_SUBSTITUTION,NO_ZERO_DATE,NO_ZERO_IN_DATE,ONLY_FULL_GROUP_BY
sysdate_is_now = 1
innodb = FORCE

# DATA STORAGE #
datadir = /data/mysql/

# BINARY LOGGING #
log_bin = /data/mysql/mysql-bin
expire_logs_days = 14
sync_binlog = 1

# CACHES AND LIMITS #
tmp_table_size = 32M
max_heap_table-size = 32M
query_cache_type = 0
query_cache_size = 0
max_connections = 4096
thread_cache_size = 100
open_files_limit = 65535
table_definition_cache = 4096
table_open_cache = 8

# INNODB #
innodb_flush_method = O_DIRECT
innodb_log_files_in_group = 2
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1
innodb_buffer_pool_size = 6G

# LOGGING #
log_error = /data/mysql/mysql-error.log
log_queries_not_using_indexes = 1
slow_query_log = 1
slow_query_log_file = /data/mysql/mysql-slow.log
```

二.参数介绍

现在已经有了一个基础配置，可以满足绝大多数场景需求，下面介绍一些重要的配置选项，来进一步优化MySQL的配置，其中有很多配置只通过名字来理解的话并不是其本义，或者和本义差别比较大。

1.innodb_buffer_pool_size—缓冲池

如果只运行mysql的生产服务器，简单点计算就是总内存减去操作系统和mysql自身等使用的内存，或者流行的经验法则：服务器内存的75%~80%

2.innodb_log_file_size—一个日志文件大小

如果日志文件太小会在写满之后频繁刷新到磁盘，引起较高的IO，如果设置的过高，则在mysql崩溃时恢复时间较长。

默认值是5MB，高性能的工作应该设置在几百MB或上G大小。设置之后，修改时需要先关闭mysql，移动旧文件，重新配置参数，再启动mysql

3.innodb_log_files_in_group—日志文件个数

总的日志文件大小为个数*单个大小。默认值为2。通常不需要修改日志数量，只修改日志文件大小即可。

4.key_buffer_size—键缓存

操作系统并不会真的立刻分配内存，只在使用时才分配。默认是8M，可以设置为32M

5.table_cache_size—表缓存

当有线程打开表时，mysql会检查现在缓存的表和这个值进行对比，空间足够就打开表，放入缓存，如果不够，就清理最不常用的表

6.thread_cache_size—连接缓存

在连接被关闭时，如果这个缓存有空间，缓存这个连接备用，如果没有空间，消除这个连接。通过观测SHOW GLOBAL STATUS中的Threads_created的值一直在增长则应该增大这个值，但不宜过大，保持大量等待连接的空闲线程并没有什么真正的用处。

7.query_cache_size—查询缓存

mysql在启动时会一次性分配并初始化这块内存。提示，有个坑：如果修改这个值，mysql会先立刻删除旧的查询缓存，再重新分配，并且在完成初始化之前服务器无法提供服务。如果旧的缓存比较大，清理会需要比较长时间，mysql不是一次性全部删除，而是逐个清理。别在高峰时修改这个值。

8.read_buffer_size

mysql只会在查询需要使用时才会为缓存分配内存，并且一次性分配该参数的大小的全部内存。默认是128k

9.read_rnd_buffer_size

mysql只会在查询需要使用时才会为缓存分配内存，并且只会分配合适大小的内存而不是全部指定的大小。感觉设置这个值更靠谱一点。

10.sort_buffer_size

只有在查询需要排序时才会为这个缓存分配内存，并且会立刻分配指定大小的全部内存，不管排序是否需要这么大的内存。sort_buffer_size默认是256k。建议不要设置过大，容易造成内存浪费。如果需要大内存进行排序时，可以在排序语句开始之前设置这个值，排序之后再修改回默认值。

11.innodb_flush_log_at_trx_commit—控制日志缓冲刷新的频繁程度的

0：把日志缓冲写到日志文件，并且每秒刷新一次，但是事务提交时不做任何事

1：默认值。把日志缓冲写到日志文件，并且每次事务提交都刷新到持久化存储。该设置保证不丢失任何已提交的事务，最安全。

2：每次提交把日志缓冲写到日志文件，但是不刷新，innodb每秒做一次刷新。

2是0和1的折中，比较合适，但如果mysql挂掉可能会丢失1秒钟数据，但1对性能有一定的影响，看业务需求在1和2选择。

12.innodb_flush_method—配置innodb如何和文件系统交互，影响读和写。

fdatasync:非windows的默认值。缺点：操作系统会有自己的缓存缓冲一些数据，这种双重缓冲是浪费的，innodb管理的自己的缓冲会更高效

0_DIRECT:会通知操作系统不要缓存数据，也不要预读。完全关闭了操作系统缓存。

windows上的一些值不再介绍。

作者给的建议是：如果使用是类UNIX操作系统并且RAID控制器带有电池保护的写缓存，建议使用0_DIRECT。如果不是，选择默认值或者0_DIRECT

13.innodb表空间

innodb_data_home_dir = /data/mysql/

innodb_data_file_path = ibdata1:2G:autoextend:max:4G

获取高性能使用raid控制器，设置自增长后，设置max最大值。

管理一个单独的表空间可能有点麻烦，尤其是自动扩展的，希望回收空间时，需先导出数据，关闭mysql，删除所有文件，修改配置，重启，导入数据，如果表空间损坏，innodb会拒绝启动。设置之后修改起来比较麻烦。

建议：启用innodb_file_per_table并给共享表空间设置大小范围。

14.innodb_doublewirter—双写缓冲

innodb用双写缓冲来避免页没有写完整所导致的数据损坏。

在备库或者从库上可以关闭，在使用ZFS文件系统时也可以关闭。

15.sync_binlog—刷新二进制日志到磁盘的方法

0：默认值。mysql并不刷新，由操作系统自己决定什么时候刷新，默认值就好。

1：mysql来刷新日志，可以获得安全保证，但对性能有影响。

MySQL并发配置

16.innodb_thread_concurrency—限制一次性可以有多少线程进入内核

理论值=cpu数量 *磁盘数量* 2 ，实践中使用更小的值会更好一点

0表示不限制

剩下的一些配置

17.tmp_table_size和max_heap_table_size—控制使用Memory引擎的内存临时表能使用多大的内存。

可以简单的把两个值设置的相同，作者选择了32M，这可能不够，但谨防这个变量太大，临时表最好呆在内存中，如果太大还是使用磁盘表比较好，否则可能会让服务器内存溢出。

SHOW GLOBAL STATUS中的Create_tmp_disk_tables和Create_tmp_tables来看创建的磁盘临时表和内存临时表

18.max_connections—最大连接数

默认值是100，完全不够使用，SHOW GLOBAL STATUS中的Max_used_connections来查看最高连接数，可以设置的比这个值更高一些。

19.table_cache_size—表缓存

SHOW GLOBAL STATUS中Opened_tables一直在增大，需要增大该参数，可以设置的较大，避免重新打开和重新解析表的定义。

安全和稳定的设置

1.expire_logs_days—二进制日志过期天数

打开二进制日志时应该打开这个选项

2.max_allowed_packet—最大收发包的大小

3.max_connect_errors—默认值太小，可以设置的足够大来有效禁用主机黑名单

4.skip_name_resolve—关闭DNS，禁用通过主机名来登陆

5.sql_mode—可以改变服务器的行为

6.sysdata_is_now—确保SYSDATE()函数有确定的行为

高级innodb设置

1.innodb

看似平淡实际非常重要。如果把这个值设置为FORCE，只有在innodb启动时，服务器才会启动，使用innodb作为默认引擎时有用。

2.innodb_autoinc_lock_mode—控制innodb如何生成自增长主键的

3.innodb_buffer_pool_instances—把缓冲池切分为多段

4.innodb_io_capacity

默认值很糟糕。需要设置的较高innodb才能稳定的刷新脏页。原因作者说解释起来很麻烦就没有解释

5.innodb_read_io_threads和innodb_write_io_threads

控制有多少后台线程可以被IO操作使用。默认是4个读线程和4个写线程。默认情况下够用了，如果有很多磁盘并且工作负载并发很大时，可以增大

6.innodb_strict_mode—在某些条件，例如CREATE TABLE时，把警告改成抛错

7.innodb_old_blocks_time

这个变量设置一个页面从LRU链表“年轻”部分转移到“年老”部分之前必须经过的毫秒数。默认值为0，可以设置为1000毫秒非常有效