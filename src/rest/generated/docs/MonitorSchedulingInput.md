
# MonitorSchedulingInput

A schedule for the monitor to run on: at most one of `transform` and `cron`. Omit `scheduling`, or send it empty, to let the server choose, which `Monitor-Scheduling` reports as `automatic`. An interval is always chosen by the server, so it cannot be requested. `Anomaly` monitors cannot set a schedule. 

## Properties

Name | Type
------------ | -------------
`transform` | [MonitorTransformSchedule](MonitorTransformSchedule.md)
`cron` | [MonitorCronScheduleInput](MonitorCronScheduleInput.md)


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


