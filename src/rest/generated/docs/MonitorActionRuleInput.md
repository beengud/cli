
# MonitorActionRuleInput

Binds one action to the monitor, and says when it fires: exactly one of `action`, to bind an existing shared action by id, and `inlineAction`, to create one that belongs to this monitor alone. An inline action of another monitor cannot be bound. 

## Properties

Name | Type
------------ | -------------
`action` | [MonitorActionRef](MonitorActionRef.md)
`inlineAction` | [MonitorActionInlineInput](MonitorActionInlineInput.md)
`levels` | [Array&lt;MonitorAlarmLevel&gt;](MonitorAlarmLevel.md)
`conditions` | [MonitorComparisonExpressionInput](MonitorComparisonExpressionInput.md)
`sendEndNotifications` | boolean
`sendRemindersIntervalSeconds` | number


[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


