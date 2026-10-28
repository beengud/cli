
# MonitorScheduling

When the monitor evaluates. `automatic` is always returned, `true` or `false`. Alongside it, one of `interval`, `transform` and `cron` is set: the schedule the monitor actually runs on, with the server\'s defaults filled in. All three are null only for a monitor that is saved but not yet running and asked for no schedule; the server picks one when it starts the monitor. 

## Properties

Name | Type
------------ | -------------
`automatic` | boolean
`interval` | [MonitorIntervalSchedule](MonitorIntervalSchedule.md)
`transform` | [MonitorTransformSchedule](MonitorTransformSchedule.md)
`cron` | [MonitorCronSchedule](MonitorCronSchedule.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


