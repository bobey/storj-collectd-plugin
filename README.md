# Storj collectd plugin

This nodejs command is meant to be used with collectd exec plugin to monitor your Storj.io nodes along with some 
Grafana/influxdb like solution. 

![Grafana dashboard built with influxdb + collectd + storj-collectd-plugin](assets/storjio-monitor-collectd-plugin-grafana.png)

## Setup

Using yarn:

```
yarn global add storj-collectd-plugin
```

Using npm:

```
npm install -g storj-collectd-plugin
```

Then you need to add the following lines in your collectd config:

```
# /etc/collectd/collectd.conf

LoadPlugin exec

<Plugin exec>
        Exec "youruser" "collectd-storj-exec-plugin"
</Plugin>
```
